import Grafico from "../Grafico.jsx";
import { principalHorizontal } from "../../destacados.js";

const DESTACADO = principalHorizontal("Tu dispositivo principal");

export default function GraficoDispositivos({ figura }) {
  return (
    <Grafico
      figura={figura}
      destacado={DESTACADO}
      titulo="Desde qué dispositivos escuchas"
      descripcion="Porcentaje de tus reproducciones en cada tipo de dispositivo."
    />
  );
}
