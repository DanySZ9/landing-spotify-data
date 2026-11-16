import Grafico from "../Grafico.jsx";

export default function GraficoCaracteristicas({ figura }) {
  return (
    <Grafico
      figura={figura}
      titulo="Cómo reproduces"
      descripcion="Qué parte de tus reproducciones fue en modo aleatorio, saltada, sin conexión o en modo incógnito."
    />
  );
}
