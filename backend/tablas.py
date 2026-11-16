"""
tablas.py — Rankings y listados que el frontend muestra como tablas.

PROPÓSITO
    Agrupar y ordenar las reproducciones para obtener los "top": artistas,
    canciones, álbumes, podcasts, canciones más saltadas, días con más
    escucha e historial reciente.

RESPONSABILIDAD
    - Cada función pública devuelve un DataFrame con columnas de nombre
      "amigable" (Artista, Cancion, Minutos...) que el frontend usa directamente.
    - ``a_filas`` convierte esos DataFrames a listas de diccionarios (JSON).

ARCHIVOS QUE UTILIZA
    - etiquetas.py -> ``fin_detalle`` para traducir el motivo de fin.
    Lo usa: analysis.py.

INFORMACIÓN QUE RECIBE
    El DataFrame preparado y filtrado (con columnas ``tipo``, ``local``,
    ``dispositivo``... creadas en data.preparar).

INFORMACIÓN QUE DEVUELVE
    DataFrames pequeños (máximo ``TOP`` filas) y, tras ``a_filas``, listas como:
    [{"Artista": "X", "Minutos": 120.5, ...}, ...]

CUÁNDO MODIFICARLO
    - Para agregar una tabla nueva (y registrarla en analysis.py).
    - Para cambiar cuántas filas devuelve cada ranking (``TOP`` o el parámetro ``n``).
    - ATENCIÓN: los nombres de columna (Artista, Cancion, URL, PctSaltadas...)
      los lee el frontend; si se renombran hay que actualizar
      ``frontend/src/components/tables``.

CONVENCIONES
    - Los rankings se ordenan por TIEMPO escuchado (``ms``), no por número de
      reproducciones: 50 saltos de 5 segundos no deberían pesar más que 10
      canciones completas.
    - "ms" = milisegundos; ``/ 60000`` convierte a minutos.
"""
# IMPORTACION DE PANDAS, SE ENCARGARA DE MANIPULAR LAS TABLAS DE DATOS (DataFrames)
import pandas as pd
import etiquetas

# Cantidad máxima de filas por defecto en cada ranking.
TOP = 100

def _musica(df: pd.DataFrame) -> pd.DataFrame:
    """Solo las filas de música (excluye podcasts y otros)."""
    return df[df["tipo"] == "musica"]


def _por_cancion(df: pd.DataFrame) -> pd.DataFrame:
    """Totales por canción: tiempo (ms), Reproducciones y Saltadas.

    Base compartida por ``top_canciones``, ``top_artistas`` y ``mas_saltadas``.
    Se agrupa también por ``spotify_track_uri`` (identificador único de Spotify)
    para no mezclar canciones distintas que tengan el mismo nombre.
    """
    return (
        _musica(df)
        .groupby(["master_metadata_track_name", "master_metadata_album_artist_name", "spotify_track_uri"])
        .agg(ms=("ms_played", "sum"), Reproducciones=("ts", "size"), Saltadas=("skipped", "sum"))
        .reset_index()
        .rename(columns={
            "master_metadata_track_name": "Cancion",
            "master_metadata_album_artist_name": "Artista",
            "spotify_track_uri": "URL",
        })
    )


def top_canciones(df: pd.DataFrame, n: int = TOP) -> pd.DataFrame:
    """Canciones más escuchadas por tiempo, con % de veces que se saltaron."""
    g = _por_cancion(df).sort_values("ms", ascending=False)
    g["Minutos"] = (g["ms"] / 60000).round(1)
    g["PctSaltadas"] = (100 * g["Saltadas"] / g["Reproducciones"]).round(0)
    return g.head(n)[["Artista", "Cancion", "Reproducciones", "Minutos", "Saltadas", "PctSaltadas", "URL"]]


def top_artistas(df: pd.DataFrame, n: int = TOP) -> pd.DataFrame:
    """Artistas más escuchados, con su canción favorita y cuántas canciones distintas sonaron."""
    canciones = _por_cancion(df)
    # Canción favorita de cada artista: la de más tiempo. Al ordenar de mayor a
    # menor y quitar duplicados por artista, queda la primera (la mayor).
    favorita = (
        canciones.sort_values("ms", ascending=False).drop_duplicates("Artista").set_index("Artista")["Cancion"]
    )
    g = (
        canciones.groupby("Artista")
        .agg(ms=("ms", "sum"), Reproducciones=("Reproducciones", "sum"),
             Canciones=("URL", "nunique"), Saltadas=("Saltadas", "sum"))
        .reset_index().sort_values("ms", ascending=False)
    )
    g["Minutos"] = (g["ms"] / 60000).round(1)
    g["PctSaltadas"] = (100 * g["Saltadas"] / g["Reproducciones"]).round(0)
    g["Favorita"] = g["Artista"].map(favorita).fillna("")
    return g.head(n)[["Artista", "Favorita", "Reproducciones", "Minutos", "Canciones", "PctSaltadas"]]


def top_albumes(df: pd.DataFrame, n: int = TOP) -> pd.DataFrame:
    """Álbumes más escuchados por tiempo (agrupados por álbum + artista)."""
    g = (
        _musica(df).groupby(["master_metadata_album_album_name", "master_metadata_album_artist_name"])
        .agg(ms=("ms_played", "sum"), Reproducciones=("ts", "size"),
             Canciones=("spotify_track_uri", "nunique"))
        .reset_index().sort_values("ms", ascending=False)
    )
    g["Minutos"] = (g["ms"] / 60000).round(1)
    g = g.rename(columns={
        "master_metadata_album_album_name": "Album",
        "master_metadata_album_artist_name": "Artista",
    })
    return g.head(n)[["Album", "Artista", "Canciones", "Reproducciones", "Minutos"]]


def top_podcasts(df: pd.DataFrame, n: int = TOP) -> pd.DataFrame:
    """Programas de podcast más escuchados y cuántos episodios distintos se oyeron."""
    g = (
        df[df["tipo"] == "podcast"].groupby("episode_show_name")
        .agg(ms=("ms_played", "sum"), Reproducciones=("ts", "size"), Episodios=("episode_name", "nunique"))
        .reset_index().sort_values("ms", ascending=False)
    )
    g["Minutos"] = (g["ms"] / 60000).round(1)
    g = g.rename(columns={"episode_show_name": "Programa"})
    return g.head(n)[["Programa", "Episodios", "Reproducciones", "Minutos"]]


def mas_saltadas(df: pd.DataFrame, minimo: int = 5, n: int = 50) -> pd.DataFrame:
    """Canciones que más se saltan, en porcentaje.

    Solo se consideran canciones con al menos ``minimo`` reproducciones, para
    que una canción saltada 1 de 1 veces (100 %) no encabece la lista.
    """
    g = _por_cancion(df)
    g = g[g["Reproducciones"] >= minimo].copy()
    g["PctSaltadas"] = (100 * g["Saltadas"] / g["Reproducciones"]).round(0)
    g = g.sort_values(["PctSaltadas", "Reproducciones"], ascending=False)
    return g.head(n)[["Artista", "Cancion", "Reproducciones", "Saltadas", "PctSaltadas", "URL"]]


def top_dias(df: pd.DataFrame, n: int = 15) -> pd.DataFrame:
    """Los días con más tiempo escuchado y el artista que más sonó ese día.

    Nota: aquí ``dia`` es la FECHA (medianoche local) y sustituye, solo dentro
    de esta función, a la columna ``dia`` = día de la semana creada en data.preparar.
    """
    d = df.assign(dia=df["local"].dt.normalize())
    diario = (
        d.groupby("dia").agg(ms=("ms_played", "sum"), Reproducciones=("ts", "size"))
        .sort_values("ms", ascending=False).head(n)
    )
    musica = d[d["dia"].isin(diario.index) & (d["tipo"] == "musica")]
    favorito = (
        musica.groupby(["dia", "master_metadata_album_artist_name"])["ms_played"].sum().reset_index()
        .sort_values("ms_played", ascending=False).drop_duplicates("dia")
        .set_index("dia")["master_metadata_album_artist_name"]
    )
    diario["Artista"] = favorito.reindex(diario.index).fillna("")
    diario["Minutos"] = (diario["ms"] / 60000).round(1)
    diario = diario.reset_index()
    diario["Fecha"] = diario["dia"].dt.strftime("%Y-%m-%d")
    return diario[["Fecha", "Reproducciones", "Minutos", "Artista"]]


def historial_reciente(df: pd.DataFrame, n: int = TOP) -> pd.DataFrame:
    """Las ``n`` reproducciones más recientes (música o podcast).

    Para podcasts, "Cancion" muestra el episodio y "Artista" el programa.
    """
    h = df.sort_values("ts", ascending=False).head(n)
    return pd.DataFrame({
        "Fecha": h["local"].dt.strftime("%Y-%m-%d %H:%M"),
        "Cancion": h["master_metadata_track_name"].fillna(h["episode_name"]).fillna(""),
        "Artista": h["master_metadata_album_artist_name"].fillna(h["episode_show_name"]).fillna(""),
        "Dispositivo": h["dispositivo"],
        "Segundos": (h["ms_played"] / 1000).round(0),
        "Fin": etiquetas.fin_detalle(h["reason_end"]),
        "URL": h["spotify_track_uri"].fillna(""),
    })


def a_filas(df: pd.DataFrame) -> list[dict]:
    """Lista de filas; devuelve [] si no hay datos.

    Convierte el DataFrame en ``[{columna: valor, ...}, ...]``, el formato que
    FastAPI puede enviar como JSON. Los valores vacíos (NaN) se reemplazan por
    "" porque NaN no es válido en JSON.
    """
    if df.empty:
        return []
    return df.astype(object).where(df.notna(), "").to_dict("records")
