import Tabla from "./Tabla.jsx";
import { DosLineas } from "./Celdas.jsx";

const COLUMNAS = [
  {
    clave: "Cancion", etiqueta: "Canción", tipo: "texto",
    render: (f) => <DosLineas titulo={f.Cancion} detalle={f.Artista} uri={f.URL} />,
  },
  { clave: "Reproducciones", etiqueta: "Veces que sonó", tipo: "numero" },
  { clave: "Minutos", etiqueta: "Tiempo escuchado", tipo: "duracion", barra: true },
  { clave: "PctSaltadas", etiqueta: "La saltas", tipo: "porcentaje", ayuda: "Porcentaje de veces que la cortaste antes de que terminara" },
];

export default function TablaTopCanciones({ filas }) {
  return (
    <Tabla
      titulo="Tus canciones más escuchadas"
      descripcion="Ordenadas por tiempo escuchado. Haz clic en el título para abrirla en Spotify."
      columnas={COLUMNAS}
      filas={filas}
    />
  );
}
