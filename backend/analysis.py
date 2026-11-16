"""
analysis.py — Une los gráficos y las tablas en la respuesta que consume el frontend.

PROPÓSITO
    Ser el "director de orquesta" del análisis: a partir de la tabla ya filtrada,
    llama a cada función de gráficos y tablas y arma un único diccionario.

RESPONSABILIDAD
    - Calcular el resumen general (totales, % saltadas, sesiones).
    - Detectar sesiones de escucha.
    - Definir la ESTRUCTURA (nombres de claves) de la respuesta. El frontend
      depende de estos nombres, así que cambiarlos rompe la interfaz.

ARCHIVOS QUE UTILIZA
    - graficos.py -> una función por gráfico.
    - tablas.py   -> una función por tabla + ``a_filas`` para convertir a JSON.
    Lo usa: main.py.

INFORMACIÓN QUE RECIBE
    Un DataFrame preparado y filtrado (salida de ``data.aplicar_filtros``),
    que nunca está vacío (main.py lo comprueba antes).

INFORMACIÓN QUE DEVUELVE
    {"resumen": {...}, "graficos": {nombre: figura|None}, "tablas": {nombre: [filas]}}

CUÁNDO MODIFICARLO
    - Para agregar un gráfico o tabla nuevos: crear la función en graficos.py o
      tablas.py y registrarla aquí con un nombre de clave; luego mostrarla en el frontend.
    - Para agregar una cifra al resumen: en ``resumen``.
    - Para cambiar qué se considera una "sesión": ``HUECO_SESION``.
"""
import pandas as pd

import graficos
import tablas

# Tiempo máximo de silencio entre dos reproducciones para considerarlas
# parte de la misma sesión de escucha.
HUECO_SESION = pd.Timedelta(minutes=30)


def sesiones(df: pd.DataFrame) -> tuple[int, float]:
    """Una sesión termina cuando pasan más de 30 min sin reproducir nada.

    Cómo funciona:
        ``ts`` indica cuándo TERMINÓ cada reproducción. Restando ``ms_played``
        se estima cuándo empezó. Si entre el inicio de una reproducción y el
        final de la anterior hay más de ``HUECO_SESION``, empieza una sesión nueva.
        ``cumsum`` numera las sesiones (1, 1, 1, 2, 2, 3...) para agruparlas.

    Devuelve:
        (número_de_sesiones, minutos_promedio_por_sesión con 1 decimal)

    Requiere al menos una fila (con 0 filas ``iloc[0]`` fallaría).
    """
    d = df.sort_values("ts")
    fin = d["ts"]
    inicio = fin - pd.to_timedelta(d["ms_played"], unit="ms")
    nueva = (inicio - fin.shift()) > HUECO_SESION
    nueva.iloc[0] = True
    duracion = d["ms_played"].groupby(nueva.cumsum()).sum()
    return int(len(duracion)), round(float(duracion.mean()) / 60000, 1)


def resumen(df: pd.DataFrame) -> dict:
    """Cifras generales que el frontend muestra como tarjetas.

    Devuelve un diccionario con: reproducciones, minutos, canciones_unicas,
    artistas_unicos, dias_activos, pct_saltadas, sesiones y minutos_por_sesion.
    (60000 ms = 1 minuto).
    """
    n = len(df)
    saltadas = int(df["skipped"].sum())
    n_sesiones, minutos_sesion = sesiones(df)
    return {
        "reproducciones": n,
        "minutos": round(float(df["ms_played"].sum()) / 60000, 1),
        "canciones_unicas": int(df["spotify_track_uri"].nunique()),
        "artistas_unicos": int(df["master_metadata_album_artist_name"].nunique()),
        "dias_activos": int(df["local"].dt.normalize().nunique()),
        "pct_saltadas": round(100 * saltadas / n, 1) if n else 0,
        "sesiones": n_sesiones,
        "minutos_por_sesion": minutos_sesion,
    }


def analizar(df: pd.DataFrame) -> dict:
    """Construye la respuesta completa del análisis.

    Los gráficos se devuelven como diccionarios de Plotly (o ``None`` si no
    hay datos); las tablas, como listas de filas (diccionarios).
    """
    return {
        "resumen": resumen(df),
        "graficos": {
            "por_mes": graficos.por_mes(df),
            "por_hora": graficos.por_hora(df),
            "mapa_calor": graficos.mapa_calor(df),
            "dispositivos": graficos.dispositivos(df),
            "caracteristicas": graficos.caracteristicas(df),
            "duracion": graficos.duracion(df),
            "como_empiezan": graficos.como_empiezan(df),
            "como_terminan": graficos.como_terminan(df),
        },
        "tablas": {
            "top_artistas": tablas.a_filas(tablas.top_artistas(df)),
            "top_canciones": tablas.a_filas(tablas.top_canciones(df)),
            "top_albumes": tablas.a_filas(tablas.top_albumes(df)),
            "top_podcasts": tablas.a_filas(tablas.top_podcasts(df)),
            "mas_saltadas": tablas.a_filas(tablas.mas_saltadas(df)),
            "top_dias": tablas.a_filas(tablas.top_dias(df)),
            "historial": tablas.a_filas(tablas.historial_reciente(df)),
        },
    }
