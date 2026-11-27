import Grafico from "../Grafico.jsx";
import { picoVertical } from "../../destacados.js";

const DESTACADO = picoVertical("Tu hora pico", "reproducciones");

export default function GraficoPorHora({ figura }) {
  return (
    <Grafico
      figura={figura}
      destacado={DESTACADO}
      titulo="A qué hora escuchas"
      descripcion="Reproducciones que empezaste en cada hora del día, según tu zona horaria. La barra más brillante es tu hora pico."
    />
  );
}
