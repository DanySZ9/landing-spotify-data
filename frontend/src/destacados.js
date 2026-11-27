// Frases de "dato clave" que se muestran encima de cada gráfico, calculadas a
// partir de la propia figura de Plotly. Resumen en una línea lo que el gráfico
// enseña, para que no haga falta interpretarlo.
import { fmtNumero } from "./formato.js";

const pct = (p) => `${p >= 10 ? Math.round(p) : p.toFixed(1).replace(".", ",")} %`;

// Índice del valor más alto de una lista
function mayor(valores) {
  return valores.reduce((m, v, i) => (v > valores[m] ? i : m), 0);
}

// Barras verticales: x = etiquetas, y = valores
export function picoVertical(prefijo, unidad) {
  return (figura) => {
    const { x, y } = figura.data[0];
    const i = mayor(y);
    if (!y[i]) return null;
    return `${prefijo}: ${x[i]}, con ${fmtNumero(y[i])} ${unidad}`;
  };
}

// Barras horizontales de porcentaje: x = %, y = etiquetas
// minuscula: true para frases ("la elegiste tú"); false para nombres propios ("Android")
export function principalHorizontal(prefijo, minuscula = false) {
  return (figura) => {
    const { x, y } = figura.data[0];
    const i = mayor(x);
    if (!x[i]) return null;
    const nombre = minuscula ? y[i].charAt(0).toLowerCase() + y[i].slice(1) : y[i];
    return `${prefijo}: ${nombre} (${pct(x[i])})`;
  };
}

export function duracionMasComun(figura) {
  const { x, y } = figura.data[0];
  const i = mayor(y);
  return y[i] ? `Lo más común: reproducciones de ${x[i].toLowerCase()} (${pct(y[i])})` : null;
}

export function momentoFavorito(figura) {
  const { z, x, y } = figura.data[0];
  let mejor = { v: 0 };
  z.forEach((fila, d) => fila.forEach((v, h) => { if (v > mejor.v) mejor = { v, d, h }; }));
  if (!mejor.v) return null;
  const dia = y[mejor.d].toLowerCase();
  return `Tu momento favorito: los ${dia.endsWith("s") ? dia : dia + "s"} a las ${x[mejor.h]}`;
}
