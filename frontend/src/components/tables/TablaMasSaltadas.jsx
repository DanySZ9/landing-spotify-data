import Tabla from "./Tabla.jsx";
import { DosLineas } from "./Celdas.jsx";

const COLUMNAS = [
  {
    clave: "Cancion", etiqueta: "Canción", tipo: "texto",
    render: (f) => <DosLineas titulo={f.Cancion} detalle={f.Artista} uri={f.URL} />,
  },
  { clave: "Reproducciones", etiqueta: "Veces que sonó", tipo: "numero" },
  { clave: "Saltadas", etiqueta: "Veces saltada", tipo: "numero", barra: true },
  { clave: "PctSaltadas", etiqueta: "La saltas", tipo: "porcentaje", ayuda: "Porcentaje de veces que la cortaste antes de que terminara" },
];

export default function TablaMasSaltadas({ filas }) {
  return (
    <Tabla
      titulo="Canciones que más saltas"
      descripcion="Solo canciones que sonaron al menos 5 veces. Ordenadas por el porcentaje de veces que las saltas."
      columnas={COLUMNAS}
      filas={filas}
    />
  );
}
