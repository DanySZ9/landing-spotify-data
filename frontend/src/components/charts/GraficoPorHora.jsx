import Grafico from "../Grafico.jsx";

export default function GraficoPorHora({ figura }) {
  return (
    <Grafico
      figura={figura}
      titulo="A qué hora escuchas"
      descripcion="Cada barra cuenta las reproducciones que empezaste en esa hora del día, según tu zona horaria."
    />
  );
}
