// Plantillas de las tarjetas para compartir. Se dibujan a tamaño real
// (1080 px de ancho) y la ventana las muestra reducidas; html-to-image las
// convierte en PNG tal cual se ven.
//
// Formato historia: arriba y abajo quedan márgenes amplios porque Instagram y
// TikTok tapan esas zonas con el nombre, la foto de perfil y la caja de respuesta.
import { URL_PUBLICA } from "./datosTarjetas.js";
import { texturaGrano } from "./portadas.js";
import "./Tarjetas.css";

const BARRAS = (
  <>
    <rect x="13" y="30" width="10" height="21" rx="4" />
    <rect x="27" y="13" width="10" height="38" rx="4" />
    <rect x="41" y="22" width="10" height="29" rx="4" />
  </>
);

function Marca() {
  return (
    <div className="tc-marca">
      <svg viewBox="0 0 64 64" aria-hidden="true"><g fill="currentColor">{BARRAS}</g></svg>
      <span>Spotlytics</span>
    </div>
  );
}

function Pie({ periodo }) {
  return (
    <div className="tc-pie">
      <span>{periodo.largo}</span>
      <span className="tc-url">{URL_PUBLICA}</span>
    </div>
  );
}

// Portada cuadrada; sin imagen, la inicial del nombre sobre un fondo gris
function Portada({ src, nombre, className = "" }) {
  return src
    ? <img className={`tc-portada-img ${className}`} src={src} alt="" />
    : <span className={`tc-portada-img tc-portada-vacia ${className}`}>{nombre.charAt(0).toUpperCase()}</span>;
}

// Top 5 con portadas. En historia el nº 1 va en grande ("protagonista").
function ListaConPortadas({ items, imagenes, protagonista }) {
  const [primero, ...resto] = items;
  const hayPortadas = items.some((it) => imagenes[it.uri]);
  const filas = protagonista ? resto : items;
  return (
    <>
      {protagonista && primero && (
        <div className="tc-prota">
          <div className="tc-prota-imagen">
            <Portada src={imagenes[primero.uri]} nombre={primero.nombre} />
            <span className="tc-prota-rank">1</span>
          </div>
          <div className="tc-item">
            <b>{primero.nombre}</b>
            <small>{primero.detalle}</small>
          </div>
        </div>
      )}
      <ol className="tc-filas" start={protagonista ? 2 : 1}>
        {filas.map((it, i) => (
          <li key={i}>
            <span className="tc-num">{i + (protagonista ? 2 : 1)}</span>
            <Portada src={imagenes[it.uri]} nombre={it.nombre} />
            <span className="tc-item">
              <b>{it.nombre}</b>
              <small>{it.detalle}</small>
            </span>
          </li>
        ))}
      </ol>
      {hayPortadas && <p className="tc-credito">Portadas de álbum: Spotify</p>}
    </>
  );
}

// Lista de solo texto (tarjeta resumen)
function ListaCompacta({ items }) {
  return (
    <ol className="tc-compacta">
      {items.map((it, i) => (
        <li key={i}><span className="tc-num">{i + 1}</span><b>{it.nombre}</b></li>
      ))}
    </ol>
  );
}

// Mini gráfico de 24 barras: la hora pico en el color de acento, el resto en gris
function Horas({ hora }) {
  return (
    <div className="tc-horas">
      <div className="tc-horas-barras">
        {hora.barras.map((v, i) => (
          <i key={i} className={i === hora.pico ? "pico" : ""} style={{ height: `${Math.max(2, v * 100)}%` }} />
        ))}
      </div>
      <div className="tc-horas-ejes">
        {["0 h", "6 h", "12 h", "18 h", "23 h"].map((t) => <span key={t}>{t}</span>)}
      </div>
    </div>
  );
}

function Inicio({ info }) {
  return (
    <>
      <svg className="tc-deco" viewBox="0 0 64 64" aria-hidden="true">{BARRAS}</svg>
      <div className="tc-centro">
        <p className="tc-antetitulo">Mi {info.periodo.corto} en música</p>
        <p className="tc-gigante">{info.tiempo.valor}</p>
        <p className="tc-unidad">{info.tiempo.unidad} escuchando música</p>
        <div className="tc-cifras">
          <p><b>{info.reproducciones}</b> reproducciones</p>
          <p><b>{info.canciones}</b> canciones distintas</p>
        </div>
      </div>
    </>
  );
}

function Artistas({ info, imagenes, formato }) {
  return (
    <div className="tc-centro">
      <p className="tc-titulo">Mis artistas más escuchados</p>
      <ListaConPortadas items={info.artistas} imagenes={imagenes} protagonista={formato === "historia"} />
    </div>
  );
}

function Canciones({ info, imagenes, formato }) {
  return (
    <div className="tc-centro">
      <p className="tc-titulo">Mis canciones más escuchadas</p>
      <ListaConPortadas items={info.temas} imagenes={imagenes} protagonista={formato === "historia"} />
    </div>
  );
}

function Hora({ info }) {
  return (
    <div className="tc-centro">
      <p className="tc-titulo">Mi hora favorita para escuchar música</p>
      <p className="tc-gigante">{info.hora.etiqueta}</p>
      <p className="tc-frase">El {info.hora.pct} % de mis reproducciones sonaron a esta hora</p>
      <Horas hora={info.hora} />
    </div>
  );
}

function Resumen({ info }) {
  return (
    <div className="tc-centro">
      <p className="tc-titulo">Mi {info.periodo.corto} en música</p>
      <div className="tc-resumen-cifras">
        <div><small>Tiempo escuchado</small><b>{info.tiempo.valor} {info.tiempo.unidad === "horas" ? "h" : "min"}</b></div>
        {info.hora && <div><small>Hora favorita</small><b>{info.hora.etiqueta}</b></div>}
      </div>
      <div className="tc-columnas">
        {info.artistas.length > 0 && (
          <div><p className="tc-subtitulo">Artistas</p><ListaCompacta items={info.artistas} /></div>
        )}
        {info.temas.length > 0 && (
          <div><p className="tc-subtitulo">Canciones</p><ListaCompacta items={info.temas} /></div>
        )}
      </div>
    </div>
  );
}

const CONTENIDO = { portada: Inicio, artistas: Artistas, canciones: Canciones, hora: Hora, resumen: Resumen };

export function Tarjeta({ id, info, formato, imagenes = {}, ref }) {
  const Contenido = CONTENIDO[id];
  const grano = texturaGrano();
  return (
    <div ref={ref} className={`tc tc-${id} tc-${formato}`} style={grano ? { "--tc-grano": `url(${grano})` } : undefined}>
      <div className="tc-fondo" aria-hidden="true" />
      <Marca />
      <Contenido info={info} imagenes={imagenes} formato={formato} />
      <Pie periodo={info.periodo} />
    </div>
  );
}
