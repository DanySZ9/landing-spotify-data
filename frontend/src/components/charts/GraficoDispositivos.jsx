import Grafico from "../Grafico.jsx";

export default function GraficoDispositivos({ figura }) {
  return (
    <Grafico
      figura={figura}
      titulo="Desde qué dispositivos escuchas"
      descripcion="Porcentaje de tus reproducciones en cada tipo de dispositivo."
    />
  );
}
