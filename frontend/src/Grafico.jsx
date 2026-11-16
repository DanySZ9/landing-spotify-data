import factoryModule from "react-plotly.js/factory";
import PlotlyModule from "plotly.js-dist-min";

// Compatibilidad CJS/ESM: según el modo, el import llega directo o dentro de .default
const createPlotlyComponent = factoryModule.default ?? factoryModule;
const Plotly = PlotlyModule.default ?? PlotlyModule;

const Plot = createPlotlyComponent(Plotly);

// Recibe la figura tal como la genera Plotly en Python (data + layout).
export default function Grafico({ figura }) {
  const layout = {
    ...figura.layout,
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    autosize: true,
    width: undefined,
  };
  return (
    <Plot
      data={figura.data}
      layout={layout}
      config={{ responsive: true, displaylogo: false }}
      useResizeHandler
      style={{ width: "100%", height: layout.height ?? 420 }}
    />
  );
}