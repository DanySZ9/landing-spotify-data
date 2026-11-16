import Grafico from "../Grafico.jsx";

export default function GraficoDuracion({ figura }) {
  return (
    <Grafico
      figura={figura}
      titulo="Cuánto escuchas cada vez"
      descripcion="Cuánto duró cada reproducción antes de terminar o ser cortada. Las de menos de 30 segundos casi siempre son canciones que saltaste."
    />
  );
}
