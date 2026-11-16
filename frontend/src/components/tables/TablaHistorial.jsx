import Tabla from "./Tabla.jsx";
import { DosLineas } from "./Celdas.jsx";
import { fmtFechaHora, fmtSegundos } from "../../formato.js";

const COLUMNAS = [
  { clave: "Fecha", etiqueta: "Cuándo", tipo: "texto", render: (f) => fmtFechaHora(f.Fecha) },
  {
    clave: "Cancion", etiqueta: "Qué escuchaste", tipo: "texto",
    render: (f) => <DosLineas titulo={f.Cancion} detalle={f.Artista} uri={f.URL} />,
  },
  { clave: "Dispositivo", etiqueta: "Dispositivo", tipo: "texto" },
  { clave: "Segundos", etiqueta: "Escuchaste", tipo: "numero", render: (f) => fmtSegundos(f.Segundos) },
  { clave: "Fin", etiqueta: "Cómo terminó", tipo: "texto" },
];

export default function TablaHistorial({ filas }) {
  return (
    <Tabla
      titulo="Tus últimas reproducciones"
      descripcion="Las 100 más recientes dentro de los filtros, en tu zona horaria. La columna «Escuchaste» muestra minutos:segundos."
      columnas={COLUMNAS}
      filas={filas}
      ranking={false}
      inicial={20}
    />
  );
}
