import Grafico from "../Grafico.jsx";
import { duracionMasComun } from "../../destacados.js";

export default function GraficoDuracion({ figura }) {
  return (
    <Grafico
      figura={figura}
      destacado={duracionMasComun}
      titulo="Cuánto escuchas cada vez"
      descripcion="Cuánto duró cada reproducción antes de terminar o ser cortada. Las de menos de 30 segundos casi siempre son canciones que saltaste."
    />
  );
}
