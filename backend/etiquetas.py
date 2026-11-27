"""
etiquetas.py — Traducciones y agrupaciones para que los códigos del export se entiendan.

PROPÓSITO
    El export de Spotify usa códigos técnicos en inglés ("fwdbtn", "trackdone",
    "Android OS 11 API 30 (samsung, SM-G991B)"...). Este módulo los traduce a
    textos en español comprensibles para cualquier persona.

RESPONSABILIDAD
    - Diccionarios de traducción (código -> texto).
    - Funciones que aplican esas traducciones a columnas enteras de pandas.
    - Agrupar los textos de plataforma en familias de dispositivos.
    No hace cálculos ni gráficos; solo nombra cosas.

ARCHIVOS QUE UTILIZA
    Ninguno del proyecto. Lo usan: data.py, graficos.py y tablas.py.

INFORMACIÓN QUE RECIBE
    Columnas (``pd.Series``) con códigos ``reason_start`` / ``reason_end``,
    o un texto de plataforma.

INFORMACIÓN QUE DEVUELVE
    Las mismas columnas con textos en español. Un código desconocido se
    convierte en "Otro motivo" (o "Otro" para dispositivos).

CUÁNDO MODIFICARLO
    - Si aparece "Otro motivo" u "Otro" con frecuencia: falta un código en
      algún diccionario o un patrón en ``dispositivo``.
    - Para cambiar los textos que ve el usuario.
    - Para cambiar cómo se agrupan las categorías de los gráficos de cómo empiezan / terminan.
"""
import re

import pandas as pd

# Cómo terminó una reproducción (reason_end), con el detalle completo.
# Se usa en la tabla de historial reciente (columna "Fin").
FIN_DETALLE = {
    "trackdone": "Terminó sola",
    "fwdbtn": "La saltaste",
    "backbtn": "Volviste a la anterior",
    "endplay": "La detuviste",
    "logout": "Cerraste sesión",
    "unexpected-exit": "Cierre inesperado",
    "unexpected-exit-while-paused": "Cierre inesperado",
    "remote": "Control remoto",
    "trackerror": "Error de reproducción",
    "switched-to-video": "Cambió a video",
    "unknown": "Motivo desconocido",
}

# Agrupación para el gráfico (pocas categorías, más fácil de leer).
# Se usa en el gráfico "Cómo terminan tus reproducciones".
GRUPO_FIN = {
    "trackdone": "Terminó sola",
    "fwdbtn": "La saltaste",
    "backbtn": "Volviste a la anterior",
    "endplay": "La detuviste o cerraste la app",
    "logout": "La detuviste o cerraste la app",
    "unexpected-exit": "La detuviste o cerraste la app",
    "unexpected-exit-while-paused": "La detuviste o cerraste la app",
    "switched-to-video": "La detuviste o cerraste la app",
}

# Cómo empezó una reproducción (reason_start).
# Se usa en el gráfico "Cómo empiezan tus reproducciones".
GRUPO_INICIO = {
    "clickrow": "La elegiste tú",
    "trackdone": "Sonó sola tras la anterior",
    "fwdbtn": "Botón siguiente",
    "backbtn": "Botón anterior",
    "playbtn": "Al abrir la app o dar play",
    "appload": "Al abrir la app o dar play",
    "remote": "Al abrir la app o dar play",
    "switched-to-audio": "Al abrir la app o dar play",
}


def grupo_fin(serie: pd.Series) -> pd.Series:
    """Traduce ``reason_end`` a su grupo resumido (para gráficos)."""
    return serie.map(GRUPO_FIN).fillna("Otro motivo")


def grupo_inicio(serie: pd.Series) -> pd.Series:
    """Traduce ``reason_start`` a su grupo resumido (para gráficos)."""
    return serie.map(GRUPO_INICIO).fillna("Otro motivo")


def fin_detalle(serie: pd.Series) -> pd.Series:
    """Traduce ``reason_end`` a su texto detallado (para tablas)."""
    return serie.map(FIN_DETALLE).fillna("Otro motivo")


def dispositivo(plataforma) -> str:
    """Agrupa textos como 'Android OS 11 API 30 (samsung, SM-G991B)' en 'Android'.

    Recibe el texto crudo de la columna ``platform`` (o un valor vacío).
    Devuelve una familia: Navegador web, Android, iPhone o iPad, Windows, Mac,
    Xbox, PlayStation, Linux, TV o altavoz, Sin dato u Otro.

    El ORDEN de las comprobaciones importa: se devuelve la primera que coincide.
    Por ejemplo, "web_player windows" debe clasificarse como navegador, no como
    Windows, por eso el navegador se comprueba primero. ``\\b`` en las
    expresiones regulares significa "límite de palabra" (evita que "ios"
    coincida dentro de "studios").
    """
    if not isinstance(plataforma, str):
        return "Sin dato"
    s = plataforma.lower()
    if "web_player" in s or "web player" in s or "webplayer" in s:
        return "Navegador web"
    if "android" in s:
        return "Android"
    if re.search(r"\bios\b|iphone|ipad", s):
        return "iPhone o iPad"
    if "windows" in s:
        return "Windows"
    if re.search(r"os x|osx|macos|macintosh", s):
        return "Mac"
    if "xbox" in s:
        return "Xbox"
    if "playstation" in s:
        return "PlayStation"
    if "linux" in s:
        return "Linux"
    if re.search(r"cast|sonos|alexa|echo|\btv\b|speaker|partner", s):
        return "TV o altavoz"
    if "not_applicable" in s:
        return "Sin dato"
    return "Otro"
