import { lazy, Suspense, useMemo } from "react";
import { useMediaQuery } from "../useMediaQuery.js";
import { cargarPlot } from "../cargarPlot.js";
import LimiteError from "./LimiteError.jsx";

const Plot = lazy(cargarPlot);

// Ajustes para pantallas estrechas: letra menor y más espacio para los datos.
function adaptarAMovil(figura, base) {
  const { layout } = figura;
  const eje = (e) => ({ ...e, nticks: 8, automargin: true, tickfont: { ...e?.tickfont, size: 11 } });
  return {
    data: figura.data.map((traza) => (
      traza.type === "heatmap"
        ? { ...traza, xgap: 1, ygap: 1,
            colorbar: { ...traza.colorbar, orientation: "h", y: -0.15, yanchor: "top", thickness: 10 } }
        : traza
    )),
    layout: {
      ...base,
      font: { ...base.font, size: 12 },
      margin: { ...layout.margin, l: 4, r: 12 },
      xaxis: eje(layout.xaxis),
      // Las barras horizontales necesitan todas sus etiquetas
      yaxis: { ...eje(layout.yaxis), ...(layout.yaxis?.categoryorder && { nticks: 0 }) },
      dragmode: false, // deslizar el dedo desplaza la página en vez de hacer zoom
    },
  };
}

// Base de todos los gráficos: título y explicación en HTML, figura de Plotly debajo.
export default function Grafico({ figura, titulo, descripcion }) {
  const estrecha = useMediaQuery("(max-width: 600px)");
  const tactil = useMediaQuery("(pointer: coarse)");

  const grafico = useMemo(() => {
    if (!figura) return null;
    const layout = {
      ...figura.layout,
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: "system-ui, sans-serif", color: "#e8e9f3" },
      autosize: true,
      width: undefined,
      height: figura.layout.height ?? (estrecha ? 280 : 340),
    };
    if (estrecha) return adaptarAMovil(figura, layout);
    return { data: figura.data, layout: tactil ? { ...layout, dragmode: false } : layout };
  }, [figura, estrecha, tactil]);

  if (!grafico) return null;
  const estilo = { width: "100%", height: grafico.layout.height };
  return (
    <section className="panel">
      <div className="panel-texto">
        <h2>{titulo}</h2>
        {descripcion && <p className="descripcion">{descripcion}</p>}
      </div>
      <LimiteError aviso={<p className="descripcion" role="alert">No se pudo cargar el gráfico. Recarga la página para intentarlo de nuevo.</p>}>
        {/* El hueco reservado evita que la página salte mientras se descarga Plotly */}
        <Suspense fallback={<div style={estilo} aria-busy="true" />}>
          <Plot
            data={grafico.data}
            layout={grafico.layout}
            config={{ responsive: true, displaylogo: false, displayModeBar: estrecha || tactil ? false : "hover" }}
            useResizeHandler
            style={estilo}
          />
        </Suspense>
      </LimiteError>
    </section>
  );
}
