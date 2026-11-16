// Valores por defecto de los filtros. Vacío o "todas" significa "sin filtrar".
export const FILTROS_INICIALES = {
  inicio: "",
  fin: "",
  zona: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  contenido: "todo",
  plataformas: [],
  artista: "",
  saltadas: "todas",
  aleatorio: "todas",
  offline: "todas",
  incognito: "todas",
  min_segundos: 0,
};
