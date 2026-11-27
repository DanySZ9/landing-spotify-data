const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Mismos límites que el backend (backend/main.py): se comprueban aquí para avisar
// antes de subir nada.
const MAX_ARCHIVOS = 30;
const MAX_MB_ARCHIVO = 20;
const MAX_MB_TOTAL = 100;
const MB = 1024 * 1024;

// Tiempo máximo de espera. Incluye el arranque en frío del servidor (en el plan
// gratuito de Render puede tardar cerca de un minuto en despertar) y el análisis.
const TIEMPO_LIMITE_MS = 120_000;

// En el plan gratuito de Render el servidor se duerme tras un rato sin uso.
// Se le da un toque al cargar la página para que vaya despertando mientras el
// visitante descarga o elige sus archivos. "no-cors": no hace falta leer la respuesta.
export function despertarServidor() {
  fetch(`${API}/api/salud`, { mode: "no-cors" }).catch(() => {});
}

function comprobarLimites(archivos) {
  if (archivos.length > MAX_ARCHIVOS) {
    throw new Error(`Sube como máximo ${MAX_ARCHIVOS} archivos a la vez.`);
  }
  const grande = archivos.find((f) => f.size > MAX_MB_ARCHIVO * MB);
  if (grande) throw new Error(`El archivo ${grande.name} pesa más de ${MAX_MB_ARCHIVO} MB.`);
  const total = archivos.reduce((s, f) => s + f.size, 0);
  if (total > MAX_MB_TOTAL * MB) throw new Error(`Los archivos pesan más de ${MAX_MB_TOTAL} MB en total.`);
}

// Los archivos viven solo en memoria del navegador (objetos File). Cada consulta los
// reenvía con los filtros; el servidor los analiza y no guarda nada.
export async function analizar(archivos, filtros) {
  comprobarLimites(archivos);
  const form = new FormData();
  archivos.forEach((f) => form.append("archivos", f));
  form.append("filtros", JSON.stringify(filtros));

  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIEMPO_LIMITE_MS);
  let res;
  try {
    res = await fetch(`${API}/api/analizar`, { method: "POST", body: form, signal: control.signal });
  } catch (e) {
    throw new Error(
      e.name === "AbortError"
        ? "El servidor tardó demasiado en responder. Inténtalo de nuevo en un momento."
        : "No pudimos conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.",
      { cause: e }
    );
  } finally {
    clearTimeout(temporizador);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.detail === "string" ? err.detail : "No se pudo analizar el historial");
  }
  return res.json();
}
