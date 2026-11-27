// Portadas de las canciones para las tarjetas. Se piden al servicio público
// oEmbed de Spotify (no necesita credenciales) y se guardan como data URL:
// así html-to-image las incrusta en el PNG sin volver a descargarlas.
// Spotify y su CDN de imágenes permiten estas peticiones desde el navegador (CORS).

const cache = new Map(); // id de canción -> promesa de data URL (o null)

const aDataURL = (blob) =>
  new Promise((ok, mal) => {
    const lector = new FileReader();
    lector.onload = () => ok(lector.result);
    lector.onerror = mal;
    lector.readAsDataURL(blob);
  });

async function descargarImagen(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`Imagen ${r.status}`);
  return aDataURL(await r.blob());
}

// "spotify:track:ID" -> data URL de la portada de su álbum, o null si no se pudo
export function portada(uri) {
  const id = /^spotify:track:([A-Za-z0-9]{22})$/.exec(uri ?? "")?.[1];
  if (!id) return Promise.resolve(null);
  if (!cache.has(id)) {
    cache.set(id, (async () => {
      const r = await fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/track/${id}`, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error(`oEmbed ${r.status}`);
      const miniatura = (await r.json()).thumbnail_url; // 300 px
      // La misma imagen a 640 px (cambia el código de tamaño); si falla, la de 300 px
      return descargarImagen(miniatura.replace("00001e02", "0000b273")).catch(() => descargarImagen(miniatura));
    })().catch(() => null));
  }
  return cache.get(id);
}

// { uri: dataURL } de todas las portadas pedidas (las que fallan se omiten)
export async function portadas(uris) {
  const unicas = [...new Set(uris.filter(Boolean))];
  const imagenes = await Promise.all(unicas.map(portada));
  return Object.fromEntries(unicas.map((u, i) => [u, imagenes[i]]).filter(([, img]) => img));
}

// Textura de grano para los fondos: ruido aleatorio en un PNG pequeño que se repite.
// Se crea con <canvas> (en vez de un filtro SVG) porque así se ve igual en todos los navegadores.
let grano;
export function texturaGrano() {
  if (grano !== undefined) return grano;
  try {
    const lado = 160;
    const lienzo = Object.assign(document.createElement("canvas"), { width: lado, height: lado });
    const ctx = lienzo.getContext("2d");
    const pixeles = ctx.createImageData(lado, lado);
    for (let i = 0; i < pixeles.data.length; i += 4) {
      const v = Math.random() * 255;
      pixeles.data.set([v, v, v, 28], i);
    }
    ctx.putImageData(pixeles, 0, 0);
    grano = lienzo.toDataURL("image/png");
  } catch {
    grano = null;
  }
  return grano;
}
