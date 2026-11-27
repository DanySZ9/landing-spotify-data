import Grafico from "../Grafico.jsx";
import { principalHorizontal } from "../../destacados.js";

const DESTACADO = principalHorizontal("Lo más habitual", true);

export default function GraficoComoEmpiezan({ figura }) {
  return (
    <Grafico
      figura={figura}
      destacado={DESTACADO}
      titulo="Cómo empiezan tus reproducciones"
      descripcion="Qué hiciste para que sonara cada canción: elegirla tú o dejar que siguiera sola."
    />
  );
}
