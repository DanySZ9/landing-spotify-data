import Tabla from "./Tabla.jsx";
import { fmtDia } from "../../formato.js";

const COLUMNAS = [
  { clave: "Fecha", etiqueta: "Día", tipo: "texto", render: (f) => fmtDia(f.Fecha) },
  { clave: "Minutos", etiqueta: "Tiempo escuchado", tipo: "duracion", barra: true },
  { clave: "Reproducciones", etiqueta: "Reproducciones", tipo: "numero" },
  { clave: "Artista", etiqueta: "Artista que más sonó", tipo: "texto" },
];

export default function TablaTopDias({ filas }) {
  return (
    <Tabla
      titulo="Tus días de más música"
      descripcion="Los 15 días en los que más tiempo escuchaste."
      columnas={COLUMNAS}
      filas={filas}
      buscar={false}
    />
  );
}
