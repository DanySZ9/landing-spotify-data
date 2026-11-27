import { useEffect, useMemo, useRef, useState } from "react";
import { FORMATOS, URL_PUBLICA, prepararTarjetas } from "./datosTarjetas.js";
import { Tarjeta } from "./Tarjetas.jsx";
import { portadas } from "./portadas.js";
import "./Compartir.css";

// ¿El navegador puede enviar imágenes al menú de compartir del sistema? (sobre todo móviles)
function sePuedenCompartirArchivos() {
  try {
    return Boolean(navigator.canShare?.({ files: [new File([""], "x.png", { type: "image/png" })] }));
  } catch {
    return false;
  }
}

const PUEDE_COMPARTIR = sePuedenCompartirArchivos();

function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: nombre });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Ventana con las tarjetas en un carrusel deslizable. La imagen se crea en el
// propio navegador: no se envía nada a ningún servidor.
export default function Compartir({ datos, filtros, onCerrar }) {
  const dialogo = useRef(null);
  const carrusel = useRef(null);
  const nodos = useRef([]);
  const pngs = useRef(new Map()); // "formato-id" -> promesa del PNG
  const fuentes = useRef(null); // CSS de las fuentes, se calcula una sola vez

  const [formato, setFormato] = useState("historia");
  const [actual, setActual] = useState(0);
  const [vista, setVista] = useState({ ancho: 0, alto: 0 }); // espacio disponible para el carrusel
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState("");
  const [fotos, setFotos] = useState(null); // { uri: dataURL } de las portadas; null mientras cargan

  const { info, tarjetas } = useMemo(() => prepararTarjetas(datos, filtros), [datos, filtros]);
  const puedeCompartir = PUEDE_COMPARTIR;
  const { ancho, alto } = FORMATOS[formato];

  // <dialog> nativo: atrapa el foco, se cierra con Esc y devuelve el foco al botón
  useEffect(() => {
    const d = dialogo.current;
    d.showModal();
    return () => d.close();
  }, []);

  // Portadas de los tops (Spotify oEmbed). Hasta que llegan no se generan imágenes.
  useEffect(() => {
    let vigente = true;
    const uris = [...info.artistas, ...info.temas].map((it) => it.uri);
    portadas(uris).then((r) => vigente && setFotos(r));
    return () => { vigente = false; };
  }, [info]);
  const listo = fotos !== null;

  // Espacio del carrusel: su ancho y el alto de la ventana del navegador
  useEffect(() => {
    const c = carrusel.current;
    const medir = () => setVista({ ancho: c.clientWidth, alto: window.innerHeight });
    const observador = new ResizeObserver(medir);
    observador.observe(c);
    window.addEventListener("resize", medir);
    return () => { observador.disconnect(); window.removeEventListener("resize", medir); };
  }, []);

  // Tamaño de cada diapositiva: cabe a lo ancho y deja sitio a los controles a lo alto.
  // Las tarjetas miden 1080 px y se reducen con la misma proporción.
  const sobra = vista.ancho && vista.alto - (window.innerWidth <= 600 ? 390 : 330);
  const diapositiva = Math.max(120, Math.floor(Math.min(vista.ancho, sobra * (ancho / alto), formato === "historia" ? 300 : 380)));
  const escala = diapositiva / ancho;

  function generar(i) {
    const clave = `${formato}-${tarjetas[i].id}`;
    if (!pngs.current.has(clave)) {
      const nodo = nodos.current[i];
      const promesa = (async () => {
        const { toBlob, getFontEmbedCSS } = await import("html-to-image");
        await document.fonts.ready;
        fuentes.current ??= await getFontEmbedCSS(nodo);
        const blob = await toBlob(nodo, { width: ancho, height: alto, pixelRatio: 1, fontEmbedCSS: fuentes.current });
        if (!blob) throw new Error("Imagen vacía");
        return blob;
      })();
      promesa.catch(() => pngs.current.delete(clave)); // si falla, se reintenta al pulsar
      pngs.current.set(clave, promesa);
    }
    return pngs.current.get(clave);
  }

  // Se adelanta la imagen de la tarjeta visible: así, al pulsar "Compartir", el
  // menú del sistema se abre al instante (Safari lo exige justo tras el toque)
  useEffect(() => {
    if (!listo) return;
    const t = setTimeout(() => generar(actual).catch(() => {}), 400);
    return () => clearTimeout(t);
  });

  const nombreArchivo = (i) => `spotlytics-${tarjetas[i].id}-${formato}.png`;

  async function compartir() {
    setOcupado(true);
    setAviso("");
    const i = actual;
    try {
      const blob = await generar(i);
      const archivo = new File([blob], nombreArchivo(i), { type: "image/png" });
      if (puedeCompartir && navigator.canShare({ files: [archivo] })) {
        try {
          await navigator.share({ files: [archivo], title: "Mis estadísticas de Spotlytics", text: `Mira tus estadísticas en ${URL_PUBLICA}` });
        } catch (e) {
          if (e.name === "AbortError") return; // cerró el menú sin elegir
          descargar(blob, archivo.name); // p. ej. Safari si tardó demasiado: se descarga
        }
      } else {
        descargar(blob, archivo.name);
      }
    } catch {
      setAviso("No se pudo crear la imagen. Inténtalo de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  async function bajar() {
    setOcupado(true);
    setAviso("");
    try {
      descargar(await generar(actual), nombreArchivo(actual));
    } catch {
      setAviso("No se pudo crear la imagen. Inténtalo de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  // Diapositiva más cercana al centro del carrusel
  function alDesplazar() {
    const c = carrusel.current;
    const centro = c.scrollLeft + c.clientWidth / 2;
    let mejor = 0;
    [...c.children].forEach((s, i) => {
      const d = (el) => Math.abs(el.offsetLeft + el.offsetWidth / 2 - centro);
      if (d(s) < d(c.children[mejor])) mejor = i;
    });
    setActual(mejor);
  }

  function irA(i) {
    const destino = Math.max(0, Math.min(tarjetas.length - 1, i));
    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    carrusel.current.children[destino].scrollIntoView({ behavior: suave ? "smooth" : "auto", block: "nearest", inline: "center" });
    setActual(destino);
  }

  // Al cambiar de formato las diapositivas cambian de tamaño: se recentra la actual
  function cambiarFormato(id) {
    setFormato(id);
    requestAnimationFrame(() => irA(actual));
  }

  function alTeclear(e) {
    const paso = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!paso) return;
    e.preventDefault();
    irA(actual + paso);
  }

  return (
    <dialog ref={dialogo} className="compartir" aria-labelledby="compartir-titulo" onClose={onCerrar}
            onClick={(e) => e.target === dialogo.current && dialogo.current.close()}>
      <div className="compartir-caja">
        <div className="compartir-cabecera">
          <h2 id="compartir-titulo">Comparte tus estadísticas</h2>
          <button type="button" className="compartir-cerrar" onClick={() => dialogo.current.close()} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div className="segmentado compartir-formato" role="radiogroup" aria-label="Formato de la imagen">
          {Object.entries(FORMATOS).map(([id, f]) => (
            <label key={id}>
              <input type="radio" name="formato-tarjeta" value={id} checked={formato === id} onChange={() => cambiarFormato(id)} />
              <span>{f.nombre} <small>{f.ancho}×{f.alto}</small></span>
            </label>
          ))}
        </div>

        <div className="compartir-visor">
          <button type="button" className="compartir-flecha" onClick={() => irA(actual - 1)} disabled={actual === 0} aria-label="Tarjeta anterior">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <div ref={carrusel} className="compartir-carrusel" onScroll={alDesplazar} onKeyDown={alTeclear}
               style={{ paddingInline: Math.max(0, (vista.ancho - diapositiva) / 2) }}
               tabIndex={0} role="region" aria-roledescription="carrusel" aria-label="Tarjetas para compartir">
            {tarjetas.map((t, i) => (
              <div key={t.id} className="compartir-diapositiva" style={{ width: diapositiva, height: diapositiva * (alto / ancho) }} role="group" aria-roledescription="tarjeta"
                   aria-label={`${i + 1} de ${tarjetas.length}: ${t.nombre}`} aria-hidden={i !== actual}>
                <div className="compartir-escala" style={{ transform: `scale(${escala})` }}>
                  <Tarjeta id={t.id} info={info} formato={formato} imagenes={fotos ?? {}} ref={(n) => { nodos.current[i] = n; }} />
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="compartir-flecha" onClick={() => irA(actual + 1)} disabled={actual === tarjetas.length - 1} aria-label="Tarjeta siguiente">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="compartir-puntos">
          {tarjetas.map((t, i) => (
            <button key={t.id} type="button" aria-label={`Ver tarjeta ${i + 1}: ${t.nombre}`} aria-current={i === actual}
                    onClick={() => irA(i)} />
          ))}
        </div>

        <div className="acciones compartir-acciones">
          {puedeCompartir && (
            <button type="button" className="primario" onClick={compartir} disabled={ocupado || !listo}>
              {!listo ? "Cargando portadas…" : ocupado ? "Preparando…" : "Compartir"}
            </button>
          )}
          <button type="button" className={puedeCompartir ? "secundario" : "primario"} onClick={bajar} disabled={ocupado || !listo}>
            {!puedeCompartir && !listo ? "Cargando portadas…" : ocupado && !puedeCompartir ? "Preparando…" : "Descargar imagen"}
          </button>
        </div>
        <p className="compartir-nota" role="status">
          {aviso || "La imagen se crea en tu dispositivo; las portadas de los álbumes se descargan de Spotify."}
        </p>
      </div>
    </dialog>
  );
}
