import createFactory from "react-plotly.js/factory";
import PlotlyModule from "plotly.js-dist-min";

// Compatibilidad CJS/ESM: según el modo, el import llega directo o dentro de .default
const createPlotlyComponent = createFactory.default ?? createFactory;
const Plotly = PlotlyModule.default ?? PlotlyModule;
const Plot = createPlotlyComponent(Plotly);

// Base de todos los gráficos: título y explicación en HTML, figura de Plotly debajo.
export default function Grafico({ figura, titulo, descripcion }) {
  if (!figura) return null;
  const layout = {
    ...figura.layout,
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { family: "Bricolage Grotesque, system-ui, sans-serif", color: "#e8e9f3" },
    autosize: true,
    width: undefined,
  };
  return (
    <section className="panel">
      <div className="panel-texto">
        <h2>{titulo}</h2>
        {descripcion && <p className="descripcion">{descripcion}</p>}
      </div>
      <Plot
        data={figura.data}
        layout={layout}
        config={{ responsive: true, displaylogo: false }}
        useResizeHandler
        style={{ width: "100%", height: layout.height ?? 340 }}
      />
    </section>
  );
}
