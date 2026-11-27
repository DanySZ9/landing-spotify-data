// Prepara lo que muestran las tarjetas para compartir a partir de la respuesta
// del análisis. Todo sale de datos que ya están en el navegador: no se llama
// al servidor ni se envía nada fuera del dispositivo.
import { fmtNumero } from "../../formato.js";

// Dirección que aparece al pie de cada tarjeta para atraer visitas
export const URL_PUBLICA = "spotlytics-five.vercel.app";

export const FORMATOS = {
  historia: { nombre: "Historia", ancho: 1080, alto: 1920 },
  cuadrado: { nombre: "Cuadrado", ancho: 1080, alto: 1080 },
};

// 74.040 minutos -> { valor: "1.234", unidad: "horas" }; menos de 2 h, en minutos
export function cifraTiempo(minutos) {
  return minutos >= 120
    ? { valor: fmtNumero(Math.round(minutos / 60)), unidad: "horas" }
    : { valor: fmtNumero(Math.round(minutos)), unidad: "minutos" };
}

const tiempoCorto = (min) => {
  const { valor, unidad } = cifraTiempo(min);
  return `${valor} ${unidad === "horas" ? "h" : "min"}`;
};

// Periodo de las estadísticas: el de los filtros o, si no hay, el del historial.
// corto: "2024" o "2019–2025" · largo: "12 mar 2019 – 5 ene 2025"
const fechaCorta = (iso) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" }).replace(".", "");
};

function describirPeriodo(inicio, fin) {
  const [a, b] = [inicio.slice(0, 4), fin.slice(0, 4)];
  return {
    corto: a === b ? a : `${a}–${b}`,
    largo: `${fechaCorta(inicio)} – ${fechaCorta(fin)}`,
  };
}

// Hora con más reproducciones, a partir del gráfico "por hora" (x = "22 h", y = reproducciones)
function horaPico(figura) {
  const y = figura?.data?.[0]?.y;
  if (!y?.length) return null;
  const total = y.reduce((s, v) => s + v, 0);
  if (!total) return null;
  const i = y.reduce((m, v, k) => (v > y[m] ? k : m), 0);
  const pct = (100 * y[i]) / total;
  return {
    etiqueta: figura.data[0].x[i],
    pct: pct >= 10 ? Math.round(pct) : pct.toFixed(1).replace(".", ","),
    barras: y.map((v) => v / y[i]), // altura relativa de cada hora (0 a 1)
    pico: i,
  };
}

export function prepararTarjetas(datos, filtros) {
  const { resumen, tablas, graficos, opciones } = datos;
  const info = {
    periodo: describirPeriodo(filtros.inicio || opciones.rango.min, filtros.fin || opciones.rango.max),
    tiempo: cifraTiempo(resumen.minutos),
    reproducciones: fmtNumero(resumen.reproducciones),
    canciones: fmtNumero(resumen.canciones_unicas),
    // uri: canción cuya portada se muestra (para un artista, su canción más escuchada)
    artistas: (tablas.top_artistas ?? []).slice(0, 5).map((f) => ({ nombre: f.Artista, detalle: tiempoCorto(f.Minutos), uri: f.FavoritaURL })),
    temas: (tablas.top_canciones ?? []).slice(0, 5).map((f) => ({ nombre: f.Cancion, detalle: f.Artista, uri: f.URL })),
    hora: horaPico(graficos.por_hora),
  };

  // Solo se ofrecen las tarjetas que tienen datos (p. ej. solo podcasts: sin canciones)
  const tarjetas = [
    { id: "portada", nombre: "Portada" },
    info.artistas.length && { id: "artistas", nombre: "Artistas" },
    info.temas.length && { id: "canciones", nombre: "Canciones" },
    info.hora && { id: "hora", nombre: "Hora favorita" },
    { id: "resumen", nombre: "Resumen" },
  ].filter(Boolean);

  return { info, tarjetas };
}
