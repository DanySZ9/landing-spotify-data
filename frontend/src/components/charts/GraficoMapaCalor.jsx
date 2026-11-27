import Grafico from "../Grafico.jsx";
import { momentoFavorito } from "../../destacados.js";

export default function GraficoMapaCalor({ figura }) {
  return (
    <Grafico
      figura={figura}
      destacado={momentoFavorito}
      titulo="Qué días y a qué hora escuchas más"
      descripcion="Cuanto más verde es un cuadro, más reproducciones hubo ese día de la semana a esa hora."
    />
  );
}
