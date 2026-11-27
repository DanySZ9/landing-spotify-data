// Funciones para mostrar números, tiempos y fechas de forma legible.

export const fmtNumero = (n) => Number(n).toLocaleString("es");

// 134.4 minutos -> "2 h 14 min" · 3000 minutos -> "2 d 2 h"
export function fmtDuracion(minutos) {
  const total = Math.round(minutos);
  if (total < 1) return "< 1 min";
  if (total < 60) return `${total} min`;
  const horas = Math.floor(total / 60);
  if (horas < 48) return `${horas} h ${total % 60} min`;
  return `${Math.floor(horas / 24)} d ${horas % 24} h`;
}

// 185 segundos -> "3:05"
export function fmtSegundos(s) {
  const total = Math.round(s);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

// "2024-03-12" -> "mar, 12 mar 2024"
export function fmtDia(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

// "2024-03-12" -> "12 de marzo de 2024"
export function fmtFecha(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
}

// "2024-03-12 18:10" -> "12 mar 2024 · 18:10"
export function fmtFechaHora(texto) {
  const [dia, hora] = texto.split(" ");
  const [a, m, d] = dia.split("-").map(Number);
  const f = new Date(a, m - 1, d).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
  return `${f} · ${hora}`;
}

// "spotify:track:ID" -> enlace para abrir la canción en Spotify
export function enlaceSpotify(uri) {
  const partes = String(uri ?? "").split(":");
  return partes.length === 3 && partes[0] === "spotify" ? `https://open.spotify.com/${partes[1]}/${partes[2]}` : null;
}
