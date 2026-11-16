const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Los archivos viven solo en memoria del navegador (objetos File). Cada consulta los
// reenvía con los filtros; el servidor los analiza en memoria y no guarda nada.
export async function analizar(archivos, filtros) {
  const form = new FormData();
  archivos.forEach((f) => form.append("archivos", f));
  form.append("filtros", JSON.stringify(filtros));

  let res;
  try {
    res = await fetch(`${API}/api/analizar`, { method: "POST", body: form });
  } catch {
    throw new Error("No se pudo conectar con el servidor. ¿Está corriendo el backend?");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.detail === "string" ? err.detail : "No se pudo analizar el historial");
  }
  return res.json();
}
