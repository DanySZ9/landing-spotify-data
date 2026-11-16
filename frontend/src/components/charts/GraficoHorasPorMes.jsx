import Grafico from "../Grafico.jsx";

export default function GraficoHorasPorMes({ figura }) {
  return (
    <Grafico
      figura={figura}
      titulo="Horas escuchadas por mes"
      descripcion="Cuánto tiempo escuchaste música cada mes. Pasa el cursor sobre una barra para ver también el número de reproducciones."
    />
  );
}
