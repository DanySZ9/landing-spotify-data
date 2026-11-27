import "./Footer.css";

// Firma del autor: cambia aquí el nombre o el enlace
const AUTOR = { nombre: "DaNYsZ99", enlace: "https://github.com/DanySZ9" };

export default function Footer() {
  return (
    <footer className="pie">
      <div className="pie-contenedor">
        <div className="pie-marca">
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <rect width="64" height="64" rx="15" fill="#242424" />
            <g fill="#1DB954">
              <rect x="13" y="30" width="10" height="21" rx="4" />
              <rect x="27" y="13" width="10" height="38" rx="4" />
              <rect x="41" y="22" width="10" height="29" rx="4" />
            </g>
          </svg>
          <span>Spotlytics</span>
        </div>

        <p className="pie-firma">
          Diseñado y desarrollado por
          {/* La firma (public/DaNYsZ99_logo.svg) se usa como máscara: toma el color del texto */}
          <a href={AUTOR.enlace} target="_blank" rel="noreferrer" className="pie-firma-logo"
             aria-label={`${AUTOR.nombre} (abre su perfil de GitHub)`} title={AUTOR.nombre}>
            <span aria-hidden="true" />
          </a>
        </p>
      </div>

      <p className="pie-aviso">
        © {new Date().getFullYear()} Spotlytics. Proyecto independiente, sin relación con Spotify AB.
        Spotify es una marca registrada de Spotify AB.
      </p>
    </footer>
  );
}
