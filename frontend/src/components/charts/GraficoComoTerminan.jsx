import Grafico from "../Grafico.jsx";
import { principalHorizontal } from "../../destacados.js";

const DESTACADO = principalHorizontal("Lo más habitual", true);

export default function GraficoComoTerminan({ figura }) {
  return (
    <Grafico
      figura={figura}
      destacado={DESTACADO}
      titulo="Cómo terminan tus reproducciones"
      descripcion="Si las dejas acabar o las cortas antes."
    />
  );
}
