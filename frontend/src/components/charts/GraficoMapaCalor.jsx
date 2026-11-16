import Grafico from "../Grafico.jsx";

export default function GraficoMapaCalor({ figura }) {
  return (
    <Grafico
      figura={figura}
      titulo="Qué días y a qué hora escuchas más"
      descripcion="Cuanto más verde es un cuadro, más reproducciones hubo ese día de la semana a esa hora."
    />
  );
}
