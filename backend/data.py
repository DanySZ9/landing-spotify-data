"""
data.py — Carga, preparación y filtrado del historial. Todo en memoria, sin escribir a disco.

PROPÓSITO
    Convertir los archivos JSON que exporta Spotify en una tabla limpia y
    uniforme (un DataFrame de pandas) y recortarla según los filtros del usuario.

RESPONSABILIDAD
    - Definir y validar la forma de los filtros (clase ``Filtros``, un "esquema").
    - Leer y unir varios archivos JSON, descartando los que no son historial de audio.
    - Limpiar tipos de datos (fechas, números, verdadero/falso).
    - Agregar columnas derivadas: hora local, día de la semana, dispositivo, tipo.
    - Calcular las opciones disponibles para los controles de filtro.
    - Aplicar los filtros.

ARCHIVOS QUE UTILIZA
    - etiquetas.py -> ``dispositivo()`` para agrupar plataformas (Android, Windows...).
    Lo usa: main.py.

INFORMACIÓN QUE RECIBE
    - Lista de ``(nombre_archivo, bytes)`` con el contenido de cada JSON subido.
    - Un objeto ``Filtros`` y una zona horaria (texto IANA, p. ej. "America/Bogota").

INFORMACIÓN QUE PROCESA
    Cada elemento del JSON de Spotify es UNA reproducción, con campos como
    ``ts`` (fecha/hora UTC en que terminó), ``ms_played`` (milisegundos
    escuchados), nombre de canción/artista/álbum, plataforma y motivos de inicio/fin.

INFORMACIÓN QUE DEVUELVE
    - DataFrames de pandas (tablas en memoria) listos para analysis.py.
    - Un diccionario de "opciones" para el frontend.

CUÁNDO MODIFICARLO
    - Para agregar un filtro nuevo: añadir el campo a ``Filtros`` y la condición
      en ``aplicar_filtros`` (y el control correspondiente en el frontend).
    - Si Spotify cambia el formato del export o se necesita una columna nueva:
      añadirla a ``COLUMNAS``.
    - Para agregar una columna derivada (p. ej. "mes" o "año"): en ``preparar``.

CONCEPTOS CLAVE
    - DataFrame: tabla en memoria (filas y columnas), como una hoja de Excel,
      que ofrece la librería pandas.
    - Esquema / modelo Pydantic: clase que describe qué campos y tipos debe
      tener un dato; Pydantic rechaza automáticamente los datos que no encajan.
      (Este proyecto NO usa base de datos ni ORM; los "modelos" son solo esquemas
      de validación).
"""
import json
from datetime import timezone
from typing import Literal
from zoneinfo import ZoneInfo

import pandas as pd
from pydantic import BaseModel, Field

import etiquetas

# Solo se conservan las columnas que usa el análisis. Se descartan ip_addr, conn_country, etc.
# (Además de ahorrar memoria, evita manipular datos personales que no se necesitan).
COLUMNAS = [
    "ts", "platform", "ms_played",
    "master_metadata_track_name", "master_metadata_album_artist_name",
    "master_metadata_album_album_name", "spotify_track_uri",
    "episode_name", "episode_show_name",
    "reason_start", "reason_end",
    "shuffle", "skipped", "offline", "incognito_mode",
]
# Columnas de tipo verdadero/falso ("banderas"). En el export pueden venir
# como true, false o null; se normalizan a True/False.
BANDERAS = ["shuffle", "skipped", "offline", "incognito_mode"]

# Tipo para filtros de tres estados: "todas" (no filtrar), "si" o "no".
TriEstado = Literal["todas", "si", "no"]


class Filtros(BaseModel):
    """Esquema de los filtros que envía el frontend como texto JSON.

    Cada campo tiene un valor por defecto que significa "no filtrar", así que
    ``{}`` es un filtro válido. ``Literal[...]`` limita los valores aceptados y
    ``Field(ge=..., le=...)`` impone mínimos y máximos. Si llega un valor fuera
    de lo permitido, main.py responde 400.
    Debe mantenerse sincronizado con ``frontend/src/filtros.js``.
    """
    inicio: str | None = None          # YYYY-MM-DD, en la zona horaria del usuario
    fin: str | None = None             # YYYY-MM-DD, incluido (se filtra hasta el final de ese día)
    zona: str = "UTC"                  # zona IANA, p. ej. "America/Bogota"
    contenido: Literal["todo", "musica", "podcasts"] = "todo"
    plataformas: list[str] = Field(default_factory=list)   # dispositivos; vacío = todos
    artista: str = ""                  # texto contenido en el nombre
    saltadas: TriEstado = "todas"
    aleatorio: TriEstado = "todas"
    offline: TriEstado = "todas"
    incognito: TriEstado = "todas"
    min_segundos: int = Field(0, ge=0, le=3600)   # duración mínima escuchada, 0 a 1 hora


def cargar_historial(archivos: list[tuple[str, bytes]]) -> tuple[pd.DataFrame, list[str]]:
    """Une los JSON de historial. Devuelve (DataFrame, nombres de archivos ignorados).

    Recibe:
        archivos: lista de tuplas ``(nombre, contenido_en_bytes)``.

    Un archivo se IGNORA (y se reporta al usuario) si:
        - no es JSON válido o no está en UTF-8;
        - no es una lista de objetos con el campo ``ts``;
        - su nombre contiene "video" (historial de video, no de audio).

    Devuelve:
        - DataFrame con exactamente las columnas de ``COLUMNAS``, con ``ts``
          convertido a fecha UTC, ``ms_played`` numérico y banderas en True/False.
        - Lista con los nombres de los archivos ignorados.

    Lanza:
        ValueError si ningún archivo resultó válido (main.py lo convierte en 400).
    """
    partes, ignorados = [], []
    for nombre, contenido in archivos:
        try:
            datos = json.loads(contenido.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            ignorados.append(nombre)
            continue
        # Comprobación rápida: se mira solo el primer elemento.
        es_historial = (
            isinstance(datos, list) and datos
            and isinstance(datos[0], dict) and "ts" in datos[0]
        )
        if not es_historial or "video" in nombre.lower():
            ignorados.append(nombre)
            continue
        df = pd.DataFrame(datos)
        # Si a un archivo le falta alguna columna (exports antiguos), se crea vacía
        # para que todas las partes tengan la misma forma y se puedan unir.
        for col in COLUMNAS:
            if col not in df.columns:
                df[col] = None
        partes.append(df[COLUMNAS])

    if not partes:
        raise ValueError(
            "No se encontró ningún historial de audio válido. Sube los archivos "
            "Streaming_History_Audio_*.json de tu exportación."
        )
    df = pd.concat(partes, ignore_index=True)
    # Limpieza de tipos. ``errors="coerce"`` convierte valores inválidos en vacío
    # (NaT/NaN) en lugar de fallar; luego se descartan o se rellenan.
    df["ts"] = pd.to_datetime(df["ts"], utc=True, errors="coerce")
    df = df.dropna(subset=["ts"])
    df["ms_played"] = pd.to_numeric(df["ms_played"], errors="coerce").fillna(0)
    for col in BANDERAS:
        # ``.eq(True)``: True solo si el valor es exactamente True; null -> False.
        df[col] = df[col].eq(True)
    return df, ignorados


def preparar(df: pd.DataFrame, zona: str) -> pd.DataFrame:
    """Agrega hora local, día de la semana y tipo de contenido.

    Recibe:
        df:   DataFrame devuelto por ``cargar_historial``.
        zona: zona horaria IANA del usuario. Si no es válida se usa UTC sin avisar.

    Columnas nuevas:
        - ``local``:       fecha/hora en la zona del usuario (sin información de zona).
        - ``hora``:        0 a 23.
        - ``dia``:         0 = lunes ... 6 = domingo.
        - ``dispositivo``: plataforma agrupada (ver etiquetas.dispositivo).
        - ``tipo``:        "musica", "podcast" u "otro" (p. ej. audiolibros).

    Devuelve una COPIA; no modifica el DataFrame original.
    """
    try:
        tz = ZoneInfo(zona)
    except Exception:
        tz = timezone.utc
    df = df.copy()
    df["local"] = df["ts"].dt.tz_convert(tz).dt.tz_localize(None)
    df["hora"] = df["local"].dt.hour
    df["dia"] = df["local"].dt.dayofweek          # 0 = lunes
    # Se calcula el grupo una sola vez por cada plataforma distinta (hay pocas)
    # en lugar de una vez por fila (puede haber cientos de miles).
    mapa = {p: etiquetas.dispositivo(p) for p in df["platform"].dropna().unique()}
    df["dispositivo"] = df["platform"].map(mapa).fillna("Sin dato")
    # El orden importa: si una fila tiene nombre de canción, gana "musica".
    df["tipo"] = "otro"
    df.loc[df["episode_name"].notna(), "tipo"] = "podcast"
    df.loc[df["master_metadata_track_name"].notna(), "tipo"] = "musica"
    return df


def opciones_disponibles(df: pd.DataFrame) -> dict:
    """Valores para llenar los controles de filtro (se calculan antes de filtrar).

    Devuelve:
        {
          "plataformas":  [dispositivos ordenados por cantidad de reproducciones],
          "artistas":     [300 artistas más escuchados, por tiempo],
          "rango":        {"min": "YYYY-MM-DD", "max": "YYYY-MM-DD"},
          "hay_podcasts": True/False
        }
    """
    artistas = (
        df.groupby("master_metadata_album_artist_name")["ms_played"].sum()
        .sort_values(ascending=False).head(300).index.tolist()
    )
    return {
        "plataformas": df["dispositivo"].value_counts().index.tolist(),
        "artistas": artistas,
        "rango": {
            "min": df["local"].min().date().isoformat(),
            "max": df["local"].max().date().isoformat(),
        },
        "hay_podcasts": bool((df["tipo"] == "podcast").any()),
    }


def _tri(df: pd.DataFrame, col: str, valor: str) -> pd.DataFrame:
    """Aplica un filtro de tres estados sobre una columna booleana.

    "si" -> filas donde ``col`` es True; "no" -> donde es False; "todas" -> sin cambio.
    (El guion bajo inicial indica que es una función interna de este módulo).
    """
    if valor == "si":
        return df[df[col]]
    if valor == "no":
        return df[~df[col]]
    return df


def aplicar_filtros(df: pd.DataFrame, f: Filtros) -> pd.DataFrame:
    """Devuelve solo las filas que cumplen TODOS los filtros de ``f``.

    Recibe el DataFrame ya preparado (necesita ``local``, ``tipo`` y
    ``dispositivo``). Las fechas se comparan en hora local del usuario.
    Puede devolver un DataFrame vacío; main.py lo detecta y responde 400.

    Lanza ValueError si ``inicio``/``fin`` no son fechas interpretables.
    """
    if f.inicio:
        df = df[df["local"] >= pd.Timestamp(f.inicio)]
    if f.fin:
        # "< fin + 1 día" para incluir todo el día final completo.
        df = df[df["local"] < pd.Timestamp(f.fin) + pd.Timedelta(days=1)]
    if f.contenido == "musica":
        df = df[df["tipo"] == "musica"]
    elif f.contenido == "podcasts":
        df = df[df["tipo"] == "podcast"]
    if f.plataformas:
        df = df[df["dispositivo"].isin(f.plataformas)]
    if f.artista.strip():
        # Búsqueda parcial sin distinguir mayúsculas. ``regex=False`` hace que
        # caracteres como "(" o "*" se traten como texto normal.
        df = df[df["master_metadata_album_artist_name"].fillna("")
                .str.contains(f.artista.strip(), case=False, regex=False)]
    df = _tri(df, "skipped", f.saltadas)
    df = _tri(df, "shuffle", f.aleatorio)
    df = _tri(df, "offline", f.offline)
    df = _tri(df, "incognito_mode", f.incognito)
    if f.min_segundos:
        df = df[df["ms_played"] >= f.min_segundos * 1000]
    return df
