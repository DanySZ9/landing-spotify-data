import { enlaceSpotify } from "../../formato.js";

// Título arriba y detalle en gris debajo
export function DosLineas({ titulo, detalle, uri }) {
  const url = enlaceSpotify(uri);
  return (
    <div className="dos-lineas">
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" title="Abrir en Spotify">{titulo}</a>
      ) : (
        <strong>{titulo}</strong>
      )}
      {detalle && <span>{detalle}</span>}
    </div>
  );
}
