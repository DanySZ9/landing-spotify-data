"""Gráficos de Plotly. Sin título ni márgenes grandes: el título y la explicación los pone el frontend.
Cada función devuelve un dict JSON, o None si no hay datos.

PROPÓSITO
    Construir las figuras (gráficos) del análisis con la librería Plotly y
    entregarlas como diccionarios JSON. El frontend las dibuja tal cual con
    ``react-plotly.js``, así que TODA la apariencia de los datos se decide aquí.

RESPONSABILIDAD
    - Una función pública por gráfico: por_mes, por_hora, mapa_calor,
      dispositivos, caracteristicas, duracion, como_empiezan, como_terminan.
    - Estilo común (tema oscuro, márgenes, colores) en ``_json``, ``PALETA``...

ARCHIVOS QUE UTILIZA
    - etiquetas.py -> agrupar motivos de inicio/fin para los gráficos de dona.
    Lo usa: analysis.py.

INFORMACIÓN QUE RECIBE
    El DataFrame preparado y filtrado (columnas ``local``, ``hora``, ``dia``,
    ``dispositivo``, ``ms_played``, banderas, ``reason_start``/``reason_end``).

INFORMACIÓN QUE DEVUELVE
    Un diccionario ``{"data": [...], "layout": {...}}`` (formato estándar de
    Plotly) o ``None`` si no hay datos. El frontend debe manejar ``None``.

CUÁNDO MODIFICARLO
    - Para crear un gráfico nuevo (y registrarlo en analysis.py).
    - Para cambiar colores, textos al pasar el ratón (hovertemplate) o tamaños.
    - Si cambia el diseño visual del frontend (tema claro/oscuro, paleta).

GLOSARIO PLOTLY
    - ``go.Figure``: un gráfico. ``go.Bar`` barras, ``go.Heatmap`` mapa de
      calor, ``go.Pie`` torta/dona.
    - ``hovertemplate``: texto que aparece al pasar el ratón; ``%{x}``, ``%{y}``,
      ``%{customdata}`` se reemplazan por los valores de cada punto;
      ``<extra></extra>`` oculta la etiqueta secundaria.
"""
import json

import pandas as pd
import plotly.graph_objects as go

import etiquetas

TEMPLATE = "plotly_dark"   # tema visual oscuro de Plotly
DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
PALETA = ["#00FFAA", "#5A6BFF", "#FF0080", "#00C8FF", "#FFB454", "#9A9CB5"]   # colores de las donas


def _json(fig: go.Figure, **layout) -> dict:
    """Aplica el estilo común y convierte la figura en un dict serializable a JSON.

    ``**layout`` permite que cada gráfico agregue opciones propias (títulos de
    ejes, altura...). Se pasa por ``fig.to_json()`` + ``json.loads`` porque así
    Plotly convierte tipos de numpy/pandas a tipos JSON estándar.
    """
    fig.update_layout(template=TEMPLATE, margin=dict(l=10, r=20, t=10, b=40), **layout)
    fig.update_xaxes(automargin=True)
    fig.update_yaxes(automargin=True)
    return json.loads(fig.to_json())


def por_mes(df):
    """Horas escuchadas por mes (más útil que contar reproducciones).

    Los meses sin escucha se rellenan con 0 para que no "desaparezcan" del eje.
    3.6e6 ms = 1 hora.
    """
    if df.empty:
        return None
    mes = df["local"].dt.to_period("M")
    g = df.groupby(mes).agg(ms=("ms_played", "sum"), rep=("ts", "size"))
    g = g.reindex(pd.period_range(g.index.min(), g.index.max(), freq="M"), fill_value=0)
    fig = go.Figure(go.Bar(
        x=[str(p) for p in g.index], y=(g["ms"] / 3.6e6).round(1).tolist(), customdata=g["rep"].tolist(),
        hovertemplate="%{x}<br>%{y} horas<br>%{customdata} reproducciones<extra></extra>",
        marker=dict(color="#5A6BFF"),
    ))
    return _json(fig, yaxis_title="Horas", xaxis_type="category", bargap=0.2)


def por_hora(df):
    """Reproducciones por hora del día (0 a 23 h, hora local del usuario)."""
    if df.empty:
        return None
    c = df["hora"].value_counts().reindex(range(24), fill_value=0)
    fig = go.Figure(go.Bar(
        x=[f"{h} h" for h in c.index], y=c.values.tolist(),
        hovertemplate="%{x}<br>%{y} reproducciones<extra></extra>", marker=dict(color="#00C8FF"),
    ))
    return _json(fig, yaxis_title="Reproducciones", bargap=0.15)


def mapa_calor(df):
    """Mapa de calor día de la semana x hora: cuándo se escucha más.

    ``pd.crosstab`` cuenta reproducciones por cada combinación (día, hora).
    """
    if df.empty:
        return None
    z = pd.crosstab(df["dia"], df["hora"]).reindex(index=range(7), columns=range(24), fill_value=0)
    fig = go.Figure(go.Heatmap(
        z=z.values.tolist(), x=[f"{h} h" for h in range(24)], y=DIAS, xgap=2, ygap=2,
        colorscale=[[0, "#1e1f2b"], [1, "#00ffaa"]], colorbar=dict(title="Reprod."),
        hovertemplate="%{y}, %{x}<br>%{z} reproducciones<extra></extra>",
    ))
    # autorange="reversed": el lunes arriba y el domingo abajo.
    return _json(fig, yaxis=dict(autorange="reversed"), height=380)


def _barras_pct(etiquetas_: list[str], pct: list[float], conteos: list[int], color: str, rango=None) -> dict:
    """Plantilla de barras horizontales con porcentajes (la usan dispositivos y caracteristicas).

    Recibe las etiquetas, el porcentaje y el conteo de cada barra. La altura
    crece con la cantidad de barras para que no se amontonen.
    (``etiquetas_`` lleva guion bajo final para no chocar con el módulo ``etiquetas``).
    """
    fig = go.Figure(go.Bar(
        x=pct, y=etiquetas_, orientation="h", customdata=conteos,
        text=[f"{p:.0f} %" if p >= 10 else f"{p:.1f} %" for p in pct], textposition="outside", cliponaxis=False,
        hovertemplate="%{y}<br>%{x:.1f} %<br>%{customdata:,} reproducciones<extra></extra>",
        marker=dict(color=color),
    ))
    return _json(
        fig, xaxis=dict(title="% de tus reproducciones", range=rango or [0, max(pct) * 1.2 + 1]),
        yaxis={"categoryorder": "total ascending"}, height=max(240, 48 * len(etiquetas_) + 80),
    )


def dispositivos(df):
    """Porcentaje de reproducciones por familia de dispositivo."""
    if df.empty:
        return None
    c = df["dispositivo"].value_counts()
    return _barras_pct(c.index.tolist(), (100 * c / len(df)).tolist(), c.tolist(), "#00FFAA")


def caracteristicas(df):
    """Porcentaje de reproducciones con cada característica (en vez de barras Sí/No gigantes)."""
    if df.empty:
        return None
    nombres = {"shuffle": "En modo aleatorio", "skipped": "Saltadas", "offline": "Sin conexión", "incognito_mode": "En modo incógnito"}
    conteos = [int(df[c].sum()) for c in nombres]
    pct = [100 * n / len(df) for n in conteos]
    return _barras_pct(list(nombres.values()), pct, conteos, "#5A6BFF", rango=[0, 100])


def duracion(df):
    """Distribución de cuánto tiempo se escuchó cada reproducción, en 5 tramos.

    ``pd.cut`` clasifica cada valor de ``ms_played`` en un tramo. Se empieza en
    -1 para que las reproducciones de 0 ms caigan en el primer tramo.
    """
    if df.empty:
        return None
    etiquetas_ = ["Hasta 30 s", "30 s a 1 min", "1 a 3 min", "3 a 5 min", "Más de 5 min"]
    cat = pd.cut(df["ms_played"], bins=[-1, 30000, 60000, 180000, 300000, float("inf")], labels=etiquetas_)
    c = cat.value_counts(sort=False)
    fig = go.Figure(go.Bar(
        x=etiquetas_, y=c.values.tolist(), text=[f"{100 * v / len(df):.0f} %" for v in c.values],
        textposition="outside", cliponaxis=False,
        hovertemplate="%{x}<br>%{y:,} reproducciones<extra></extra>", marker=dict(color="#00C8FF"),
    ))
    return _json(fig, yaxis_title="Reproducciones", bargap=0.2)


def _dona(grupos: pd.Series) -> dict | None:
    """Plantilla de gráfico de dona a partir de una columna de categorías."""
    if grupos.empty:
        return None
    c = grupos.value_counts()
    fig = go.Figure(go.Pie(
        labels=c.index.tolist(), values=c.values.tolist(), hole=0.55, sort=False,
        textinfo="percent", marker=dict(colors=PALETA[: len(c)], line=dict(color="#14151f", width=2)),
        hovertemplate="%{label}<br>%{value:,} reproducciones (%{percent})<extra></extra>",
    ))
    return _json(fig, height=380, legend=dict(orientation="h", y=-0.05))


def como_empiezan(df):
    """Dona: cómo empiezan las reproducciones (elegida, automática, botones...)."""
    return _dona(etiquetas.grupo_inicio(df["reason_start"]))


def como_terminan(df):
    """Dona: cómo terminan las reproducciones (completa, saltada, detenida...)."""
    return _dona(etiquetas.grupo_fin(df["reason_end"]))
