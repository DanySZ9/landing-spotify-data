import createFactory from "react-plotly.js/factory";
// Versión reducida de Plotly: barras, mapas de calor y donas. Si el backend
// envía otro tipo de gráfico (mapas, 3D…), hay que volver a plotly.js-dist-min.
import PlotlyModule from "plotly.js-cartesian-dist-min";

// Compatibilidad CJS/ESM: según el modo, el import llega directo o dentro de .default
const createPlotlyComponent = createFactory.default ?? createFactory;
const Plotly = PlotlyModule.default ?? PlotlyModule;

export default createPlotlyComponent(Plotly);
