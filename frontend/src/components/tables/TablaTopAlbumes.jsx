import Tabla from "./Tabla.jsx";
import { DosLineas } from "./Celdas.jsx";

const COLUMNAS = [
  {
    clave: "Album", etiqueta: "Álbum", tipo: "texto",
    render: (f) => <DosLineas titulo={f.Album} detalle={f.Artista} />,
  },
  { clave: "Canciones", etiqueta: "Canciones distintas", tipo: "numero" },
  { clave: "Reproducciones", etiqueta: "Veces que sonó", tipo: "numero" },
  { clave: "Minutos", etiqueta: "Tiempo escuchado", tipo: "duracion", barra: true },
];

export default function TablaTopAlbumes({ filas }) {
  return <Tabla titulo="Tus álbumes más escuchados" columnas={COLUMNAS} filas={filas} />;
}
