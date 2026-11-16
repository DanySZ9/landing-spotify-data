import Grafico from "../Grafico.jsx";

export default function GraficoComoEmpiezan({ figura }) {
  return (
    <Grafico
      figura={figura}
      titulo="Cómo empiezan tus reproducciones"
      descripcion="Qué hiciste para que sonara cada canción: elegirla tú o dejar que siguiera sola."
    />
  );
}
