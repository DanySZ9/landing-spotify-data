// Fotos de public/pasos: cada una existe en 480, 800 y 1280 px de ancho.
// El navegador descarga solo el tamaño que necesita, y cuando está por verse.
export default function FotoPaso({ archivo, alt, ancho = 1280, alto = 853 }) {
  const ruta = (w) => `/pasos/${archivo}-${w}.webp`;
  return (
    <img
      src={ruta(800)}
      srcSet={[480, 800, 1280].map((w) => `${ruta(w)} ${w}w`).join(", ")}
      sizes="(max-width: 900px) 86vw, 525px"
      width={ancho}
      height={alto}
      loading="lazy"
      decoding="async"
      alt={alt}
      className="img-step"
    />
  );
}
