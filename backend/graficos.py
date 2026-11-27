"""Gráficos de Plotly. Sin título ni márgenes grandes: el título y la explicación los pone el frontend.
Cada función devuelve un dict JSON, o None si no hay datos.

PROPÓSITO
    Construir las figuras (gráficos) del análisis con la librería Plotly y
    entregarlas como diccionarios JSON. El frontend las dibuja tal cual con
    ``react-plotly.js``, así que TODA la apariencia de los datos se decide aquí.

RESPONSABILIDAD
    - Una función pública por gráfico: por_mes, por_hora, mapa_calor,
      dispositivos, caracteristicas, duracion, como_empiezan, como_terminan.
    - Estilo común en ``_json``: fondo transparente, rejilla tenue, barras con
      la punta redondeada y sin zoom (en móvil el zoom estorbaba al desplazarse).

CRITERIOS DE DISEÑO
    - Un solo color (el verde de la marca) para todos los gráficos: cada uno
      muestra una sola serie, así que más colores no aportarían información.
    - Se resalta el dato importante (la hora o el mes con más escucha) y el
      resto de barras se atenúa. Así se entiende de un vistazo.
    - Barras finas: el espacio libre entre ellas hace el gráfico más legible.
    - Proporciones (dispositivos, cómo empiezan/terminan...) en barras
      horizontales ordenadas con su porcentaje al final, en vez de donas:
      comparar longitudes es más fácil que comparar ángulos.

ARCHIVOS QUE UTILIZA
    - etiquetas.py -> agrupar motivos de inicio/fin.
    Lo usa: analysis.py.

INFORMACIÓN QUE RECIBE
    El DataFrame preparado y filtrado (columnas ``local``, ``hora``, ``dia``,
    ``dispositivo``, ``ms_played``, banderas, ``reason_start``/``reason_end``).

INFORMACIÓN QUE DEVUELVE
    Un diccionario ``{"data": [...], "layout": {...}}`` (formato estándar de
    Plotly) o ``None`` si no hay datos. El frontend debe manejar ``None``.

CUÁNDO MODIFICARLO
    - Para crear un gráfico nuevo (y registrarlo en analysis.py).
    - Para cambiar colores (constantes de abajo), textos al pasar el ratón
      (hovertemplate) o tamaños.

GLOSARIO PLOTLY
    - ``go.Figure``: un gráfico. ``go.Bar`` barras, ``go.Heatmap`` mapa de calor.
    - ``hovertemplate``: texto que aparece al pasar el ratón; ``%{x}``, ``%{y}``,
      ``%{customdata}`` se reemplazan por los valores de cada punto;
      ``<extra></extra>`` oculta la etiqueta secundaria.
"""
import json

import pandas as pd
import plotly.graph_objects as go

import etiquetas

DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

# Colores (mismos valores que las variables CSS del frontend, en index.css).
VERDE = "#1DB954"          # la serie de datos / el dato destacado
VERDE_TENUE = "#1F7A43"    # barras no destacadas: verde oscuro con contraste 3:1 sobre el fondo
TEXTO = "#FFFFFF"
TEXTO_SUAVE = "#B3B3B3"    # ejes y etiquetas
REJILLA = "#2A2A2A"        # líneas de guía: apenas se distinguen del fondo
BASE = "#404040"           # línea base de las barras
FONDO_TOOLTIP = "#242424"


def _json(fig: go.Figure, **layout) -> dict:
    """Aplica el estilo común y convierte la figura en un dict serializable a JSON.

    ``**layout`` permite que cada gráfico agregue opciones propias (títulos de
    ejes, altura...). Se pasa por ``fig.to_json()`` + ``json.loads`` porque así
    Plotly convierte tipos de numpy/pandas a tipos JSON estándar.
    """
    eje = dict(
        automargin=True, fixedrange=True,          # sin zoom ni arrastre
        gridcolor=REJILLA, zeroline=False, linecolor=BASE,
        tickfont=dict(color=TEXTO_SUAVE, size=12), title_font=dict(color=TEXTO_SUAVE, size=12),
    )
    fig.update_layout(
        margin=dict(l=10, r=20, t=16, b=40),
        font=dict(color=TEXTO), showlegend=False,
        barcornerradius=4,                          # punta de las barras redondeada
        hoverlabel=dict(bgcolor=FONDO_TOOLTIP, bordercolor=BASE, font=dict(color=TEXTO, size=13)),
        dragmode=False,
    )
    fig.update_xaxes(**eje)
    fig.update_yaxes(**eje)
    fig.update_layout(**layout)
    return json.loads(fig.to_json())


def _destacar_maximo(valores: list) -> list[str]:
    """Color de cada barra: verde vivo la mayor, verde tenue el resto."""
    tope = max(valores) if valores else 0
    return [VERDE if v == tope and tope > 0 else VERDE_TENUE for v in valores]


def por_mes(df):
    """Horas escuchadas por mes (más útil que contar reproducciones).

    Los meses sin escucha se rellenan con 0 para que no "desaparezcan" del eje.
    3.6e6 ms = 1 hora. Se destaca el mes con más horas.
    """
    if df.empty:
        return None
    mes = df["local"].dt.to_period("M")
    g = df.groupby(mes).agg(ms=("ms_played", "sum"), rep=("ts", "size"))
    g = g.reindex(pd.period_range(g.index.min(), g.index.max(), freq="M"), fill_value=0)
    horas = (g["ms"] / 3.6e6).round(1).tolist()
    fig = go.Figure(go.Bar(
        x=[f"{MESES[p.month - 1]} {p.year}" for p in g.index], y=horas, customdata=g["rep"].tolist(),
        hovertemplate="<b>%{x}</b><br>%{y} horas · %{customdata:,} reproducciones<extra></extra>",
        marker=dict(color=_destacar_maximo(horas)),
    ))
    # Con pocos meses las barras serían muy anchas: más hueco entre ellas.
    hueco = 0.55 if len(horas) <= 12 else 0.3
    return _json(fig, yaxis=dict(title="Horas", showline=False),
                 xaxis=dict(type="category", showgrid=False, showline=True), bargap=hueco)


def por_hora(df):
    """Reproducciones por hora del día (0 a 23 h, hora local). Se destaca la hora pico."""
    if df.empty:
        return None
    c = df["hora"].value_counts().reindex(range(24), fill_value=0)
    valores = c.values.tolist()
    fig = go.Figure(go.Bar(
        x=[f"{h} h" for h in c.index], y=valores,
        hovertemplate="<b>%{x}</b><br>%{y:,} reproducciones<extra></extra>",
        marker=dict(color=_destacar_maximo(valores)),
    ))
    return _json(fig, yaxis=dict(title="Reproducciones", showline=False),
                 xaxis=dict(showgrid=False, showline=True), bargap=0.4)


def mapa_calor(df):
    """Mapa de calor día de la semana x hora: cuándo se escucha más.

    ``pd.crosstab`` cuenta reproducciones por cada combinación (día, hora).
    Escala de un solo color: casi fondo = poca escucha, verde = mucha.
    """
    if df.empty:
        return None
    z = pd.crosstab(df["dia"], df["hora"]).reindex(index=range(7), columns=range(24), fill_value=0)
    fig = go.Figure(go.Heatmap(
        z=z.values.tolist(), x=[f"{h} h" for h in range(24)], y=DIAS, xgap=3, ygap=3,
        colorscale=[[0, "#232323"], [1, VERDE]],
        colorbar=dict(title=dict(text="Reprod.", font=dict(color=TEXTO_SUAVE, size=12)),
                      tickfont=dict(color=TEXTO_SUAVE, size=11), thickness=10, outlinewidth=0),
        hovertemplate="<b>%{y}, %{x}</b><br>%{z:,} reproducciones<extra></extra>",
    ))
    # autorange="reversed": el lunes arriba y el domingo abajo.
    return _json(fig, yaxis=dict(autorange="reversed", showgrid=False),
                 xaxis=dict(showgrid=False), height=360)


def _barras_pct(etiquetas_: list[str], pct: list[float], conteos: list[int], rango=None) -> dict:
    """Barras horizontales con el porcentaje al final de cada una.

    La usan dispositivos, caracteristicas, como_empiezan y como_terminan. El
    porcentaje ya va escrito en cada barra, así que el eje X se oculta. La
    altura crece con la cantidad de barras para que no se amontonen.
    (``etiquetas_`` lleva guion bajo final para no chocar con el módulo ``etiquetas``).
    """
    fig = go.Figure(go.Bar(
        x=pct, y=etiquetas_, orientation="h", customdata=conteos,
        text=[f"{p:.0f} %" if p >= 10 else f"{p:.1f} %" for p in pct], textposition="outside",
        textfont=dict(color=TEXTO, size=13), cliponaxis=False,
        hovertemplate="<b>%{y}</b><br>%{x:.1f} % · %{customdata:,} reproducciones<extra></extra>",
        marker=dict(color=VERDE),
    ))
    return _json(
        fig,
        xaxis=dict(visible=False, range=rango or [0, max(pct) * 1.18 + 1]),
        yaxis=dict(categoryorder="total ascending", showgrid=False, showline=True,
                   tickfont=dict(color=TEXTO, size=13), ticksuffix="  "),
        bargap=0.42, height=max(200, 44 * len(etiquetas_) + 40), margin=dict(l=10, r=20, t=8, b=8),
    )


def dispositivos(df):
    """Porcentaje de reproducciones por familia de dispositivo."""
    if df.empty:
        return None
    c = df["dispositivo"].value_counts()
    return _barras_pct(c.index.tolist(), (100 * c / len(df)).tolist(), c.tolist())


def caracteristicas(df):
    """Porcentaje de reproducciones con cada característica (escala fija de 0 a 100 %)."""
    if df.empty:
        return None
    nombres = {"shuffle": "En modo aleatorio", "skipped": "Saltadas", "offline": "Sin conexión", "incognito_mode": "En modo incógnito"}
    conteos = [int(df[c].sum()) for c in nombres]
    pct = [100 * n / len(df) for n in conteos]
    return _barras_pct(list(nombres.values()), pct, conteos, rango=[0, 118])


def duracion(df):
    """Cuánto se escuchó cada reproducción, en 5 tramos, como % del total.

    ``pd.cut`` clasifica cada valor de ``ms_played`` en un tramo. Se empieza en
    -1 para que las reproducciones de 0 ms caigan en el primer tramo.
    """
    if df.empty:
        return None
    etiquetas_ = ["Hasta 30 s", "30 s a 1 min", "1 a 3 min", "3 a 5 min", "Más de 5 min"]
    cat = pd.cut(df["ms_played"], bins=[-1, 30000, 60000, 180000, 300000, float("inf")], labels=etiquetas_)
    c = cat.value_counts(sort=False)
    pct = [100 * v / len(df) for v in c.values]
    fig = go.Figure(go.Bar(
        x=etiquetas_, y=pct, customdata=c.values.tolist(),
        text=[f"{p:.0f} %" for p in pct], textposition="outside", textfont=dict(color=TEXTO, size=13),
        cliponaxis=False,
        hovertemplate="<b>%{x}</b><br>%{y:.1f} % · %{customdata:,} reproducciones<extra></extra>",
        marker=dict(color=_destacar_maximo(pct)),
    ))
    return _json(fig, yaxis=dict(visible=False, range=[0, max(pct) * 1.2 + 1]),
                 xaxis=dict(showgrid=False, showline=True, tickfont=dict(color=TEXTO, size=12)),
                 bargap=0.5)


def _proporciones(grupos: pd.Series) -> dict | None:
    """Barras horizontales con el % de cada categoría de una columna."""
    if grupos.empty:
        return None
    c = grupos.value_counts()
    return _barras_pct(c.index.tolist(), (100 * c / c.sum()).tolist(), c.tolist())


def como_empiezan(df):
    """Cómo empiezan las reproducciones (elegida, automática, botones...)."""
    return _proporciones(etiquetas.grupo_inicio(df["reason_start"]))


def como_terminan(df):
    """Cómo terminan las reproducciones (completa, saltada, detenida...)."""
    return _proporciones(etiquetas.grupo_fin(df["reason_end"]))
