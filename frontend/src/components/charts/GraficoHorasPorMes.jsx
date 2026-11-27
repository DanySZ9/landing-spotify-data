import Grafico from "../Grafico.jsx";
import { picoVertical } from "../../destacados.js";

const DESTACADO = picoVertical("Tu mes con más música", "horas");

export default function GraficoHorasPorMes({ figura }) {
  return (
    <Grafico
      figura={figura}
      destacado={DESTACADO}
      titulo="Horas escuchadas por mes"
      descripcion="Cuánto tiempo escuchaste música cada mes; la barra más brillante es tu mejor mes. Pasa el cursor o toca una barra para ver el detalle."
    />
  );
}
