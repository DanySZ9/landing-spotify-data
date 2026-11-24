import Tabla from "./Tabla.jsx";
import { DosLineas } from "./Celdas.jsx";

const COLUMNAS = [
  {
    clave: "Artista", etiqueta: "Artista", tipo: "texto",
    render: (f) => <DosLineas titulo={f.Artista} detalle={f.Favorita ? `Más escuchada: ${f.Favorita}` : ""} />,
  },
  { clave: "Reproducciones", etiqueta: "Veces que sonó", tipo: "numero" },
  { clave: "Minutos", etiqueta: "Tiempo escuchado", tipo: "duracion", barra: true },
  { clave: "Canciones", etiqueta: "Canciones distintas", tipo: "numero" },
  { clave: "PctSaltadas", etiqueta: "Las saltas", tipo: "porcentaje", ayuda: "Porcentaje de sus reproducciones que cortaste antes de que terminaran" },
];

export default function TablaTopArtistas({ filas }) {
  return (
    <Tabla
      titulo="Tus artistas más escuchados"
      descripcion="Ordenados por tiempo escuchado. También puedes ordenarlos por otra columna."
      columnas={COLUMNAS}
      filas={filas}
    />
  );
}
