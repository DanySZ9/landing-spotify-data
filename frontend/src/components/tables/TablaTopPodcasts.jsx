import Tabla from "./Tabla.jsx";

const COLUMNAS = [
  { clave: "Programa", etiqueta: "Programa", tipo: "texto" },
  { clave: "Episodios", etiqueta: "Episodios distintos", tipo: "numero" },
  { clave: "Reproducciones", etiqueta: "Veces reproducido", tipo: "numero" },
  { clave: "Minutos", etiqueta: "Tiempo escuchado", tipo: "duracion", barra: true },
];

export default function TablaTopPodcasts({ filas }) {
  return <Tabla titulo="Tus podcasts más escuchados" columnas={COLUMNAS} filas={filas} />;
}
