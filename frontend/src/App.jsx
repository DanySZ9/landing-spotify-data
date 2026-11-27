import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { analizar, despertarServidor } from "./api.js";
import { cargarPlot } from "./cargarPlot.js";
import { FILTROS_INICIALES } from "./filtros.js";
import { PREGUNTAS } from "./preguntas.js";

// COMPONENTES
import Filtros from "./components/Filtros.jsx";
import Resumen from "./components/Resumen.jsx";

// COMPONENTES GRAFICOS
import GraficoHorasPorMes from "./components/charts/GraficoHorasPorMes.jsx";
import GraficoPorHora from "./components/charts/GraficoPorHora.jsx";
import GraficoMapaCalor from "./components/charts/GraficoMapaCalor.jsx";
import GraficoDispositivos from "./components/charts/GraficoDispositivos.jsx";
import GraficoCaracteristicas from "./components/charts/GraficoCaracteristicas.jsx";
import GraficoDuracion from "./components/charts/GraficoDuracion.jsx";
import GraficoComoEmpiezan from "./components/charts/GraficoComoEmpiezan.jsx";
import GraficoComoTerminan from "./components/charts/GraficoComoTerminan.jsx";

// COMPONENTES TABLAS
import TablaTopArtistas from "./components/tables/TablaTopArtistas.jsx";
import TablaTopCanciones from "./components/tables/TablaTopCanciones.jsx";
import TablaTopAlbumes from "./components/tables/TablaTopAlbumes.jsx";
import TablaTopPodcasts from "./components/tables/TablaTopPodcasts.jsx";
import TablaMasSaltadas from "./components/tables/TablaMasSaltadas.jsx";
import TablaTopDias from "./components/tables/TablaTopDias.jsx";
import TablaHistorial from "./components/tables/TablaHistorial.jsx";

// COMPONENTES
import Fondo from "./components/Fondo.jsx";
import FotoPaso from "./components/FotoPaso.jsx";
import Footer from "./components/Footer.jsx";
import Header from "./components/Header.jsx";
import PreguntasFrecuentes from "./components/PreguntasFrecuentes.jsx";

// La ventana de compartir (y html-to-image) solo se descarga al abrirla
const Compartir = lazy(() => import("./components/compartir/Compartir.jsx"));

const PESTANAS = [
  ["cuando", "Cuándo escuchas"],
  ["que", "Qué escuchas"],
  ["como", "Cómo escuchas"],
  ["historial", "Historial"],
];

export default function App() {
  const [archivos, setArchivos] = useState([]);
  const [datos, setDatos] = useState(null);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [pestana, setPestana] = useState("cuando");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [lento, setLento] = useState(false);
  const [compartiendo, setCompartiendo] = useState(false);
  const resultados = useRef(null);
  const irAResultados = useRef(false);

  // Despierta al servidor (Render gratuito) mientras el visitante lee la página
  useEffect(despertarServidor, []);

  // Tras subir archivos lleva a las estadísticas (al aplicar filtros no se mueve la página)
  useEffect(() => {
    if (!datos || !irAResultados.current) return;
    irAResultados.current = false;
    resultados.current.focus({ preventScroll: true });
    resultados.current.scrollIntoView();
  }, [datos]);

  async function ejecutar(files, f) {
    setCargando(true);
    setError("");
    // Si tarda, lo normal es que el servidor esté arrancando: se avisa al visitante
    const aviso = setTimeout(() => setLento(true), 8000);
    try {
      setDatos(await analizar(files, f));
      setFiltros(f);
    } catch (e) {
      setError(e.message);
    } finally {
      clearTimeout(aviso);
      setLento(false);
      setCargando(false);
    }
  }

  function alElegirArchivos(e) {
    const files = [...e.target.files];
    e.target.value = ""; // permite volver a elegir los mismos archivos si algo falla
    if (!files.length || cargando) return;
    cargarPlot().catch(() => {}); // se adelanta mientras responde el servidor
    setArchivos(files);
    setDatos(null);
    irAResultados.current = true;
    ejecutar(files, FILTROS_INICIALES);
  }

  // Teclado en las pestañas: flechas, Inicio y Fin
  function alTeclearPestana(e) {
    const actual = PESTANAS.findIndex(([id]) => id === pestana);
    const destino = {
      ArrowRight: (actual + 1) % PESTANAS.length,
      ArrowLeft: (actual - 1 + PESTANAS.length) % PESTANAS.length,
      Home: 0,
      End: PESTANAS.length - 1,
    }[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    setPestana(PESTANAS[destino][0]);
    e.currentTarget.children[destino].focus();
  }

  const g = datos?.graficos;
  const t = datos?.tablas;

  return (
    <>
      <a href="#main" className="saltar">Saltar al contenido</a>
      <Fondo />
      <Header hayDatos={Boolean(datos)} />

      <main>
        <section id="main">
          <h1 className="title-main">Tus estadísticas de <span>Spotify</span>, solo para ti</h1>
          <p className="subtitle-main">Tu historial de Spotify guarda años de música. Descubre cuáles son tus canciones más repetidas, a qué hora escuchas más y qué artistas dominan tu semana.</p>
          <p className="text-main">
            Sube los archivos <code>Streaming_History_Audio_*.json</code> de tu exportación.
          </p>
          <label className="btn-subir">
            <span>{cargando ? "Analizando…" : "Elegir archivos"}</span>
            {/* Cubre todo el botón, invisible: se puede pulsar o soltar archivos encima */}
            <input type="file" accept=".json" multiple onChange={alElegirArchivos} className="btn-subir-input" />
          </label>
          <div role="status">
            <p className="sr-only">{cargando ? "Analizando tu historial" : datos ? "Estadísticas actualizadas" : ""}</p>
            {lento && (
              <p className="estado">Está tardando un poco más de lo normal. Si el servidor llevaba un rato sin uso, puede tardar hasta un minuto en arrancar; no cierres la página.</p>
            )}
            {datos?.ignorados.length > 0 && (
              <p className="estado">Se ignoraron por no ser historial de audio: {datos.ignorados.join(", ")}</p>
            )}
          </div>
          {error && !datos && <p className="estado error" role="alert">{error}</p>}
        </section>

        <div className="dec">
          <div className="dec-1"></div>
          <div className="dec-2"></div>
        </div>

        <section id="estadisticas" className="informacion-usuario" ref={resultados} tabIndex={-1} aria-label="Mis estadísticas">
          {datos && (
            <>
              <Filtros key={archivos.map((a) => a.name + a.size).join("|")}
                      opciones={datos.opciones} aplicados={filtros} onAplicar={(f) => ejecutar(archivos, f)}
                      cargando={cargando} />
              {error && <p className="estado error" role="alert">{error}</p>}
              {datos.resumen.reproducciones > 0 && (
                <div className="barra-compartir">
                  <button type="button" className="primario boton-compartir" onClick={() => setCompartiendo(true)}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg>
                    Compartir mis estadísticas
                  </button>
                </div>
              )}
              <Resumen datos={datos.resumen} />
              {compartiendo && (
                <Suspense fallback={null}>
                  <Compartir datos={datos} filtros={filtros} onCerrar={() => setCompartiendo(false)} />
                </Suspense>
              )}

              <div className="pestanas" role="tablist" aria-label="Estadísticas" onKeyDown={alTeclearPestana}>
                {PESTANAS.map(([id, nombre]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    id={`pestana-${id}`}
                    aria-selected={pestana === id}
                    aria-controls="panel-pestana"
                    tabIndex={pestana === id ? 0 : -1}
                    onClick={(e) => {
                      setPestana(id);
                      // En móvil las pestañas se desplazan: centra la elegida
                      e.currentTarget.scrollIntoView({ block: "nearest", inline: "center" });
                    }}
                  >
                    {nombre}
                  </button>
                ))}
              </div>

              <div role="tabpanel" id="panel-pestana" aria-labelledby={`pestana-${pestana}`} tabIndex={0}>
                {pestana === "cuando" && (
                  <>
                    <GraficoHorasPorMes figura={g.por_mes} />
                    <GraficoPorHora figura={g.por_hora} />
                    <GraficoMapaCalor figura={g.mapa_calor} />
                    <TablaTopDias filas={t.top_dias} />
                  </>
                )}

                {pestana === "que" && (
                  <>
                    <TablaTopArtistas filas={t.top_artistas} />
                    <TablaTopCanciones filas={t.top_canciones} />
                    <TablaTopAlbumes filas={t.top_albumes} />
                    <TablaTopPodcasts filas={t.top_podcasts} />
                  </>
                )}

                {pestana === "como" && (
                  <>
                    <div className="dos-columnas">
                      <GraficoDispositivos figura={g.dispositivos} />
                      <GraficoCaracteristicas figura={g.caracteristicas} />
                    </div>
                    <GraficoDuracion figura={g.duracion} />
                    <div className="dos-columnas">
                      <GraficoComoEmpiezan figura={g.como_empiezan} />
                      <GraficoComoTerminan figura={g.como_terminan} />
                    </div>
                    <TablaMasSaltadas filas={t.mas_saltadas} />
                  </>
                )}

                {pestana === "historial" && <TablaHistorial filas={t.historial} />}
              </div>
            </>
          )}
        </section>

        <section id="steps">

          <div className="step step-top">
            <figure className="step-figure">
              <FotoPaso archivo="nainoa-shizuru" alt="" />
              <figcaption className="image-credit">
                Foto de <a href="https://unsplash.com/es/@nainoa?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Nainoa Shizuru</a> en <a href="https://unsplash.com/es/fotos/concert-photos-NcdG9mK3PBY?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
              </figcaption>
            </figure>
            <div>
              <h2 className="step-title">1. Entra a la privacidad de tu cuenta</h2>
              <p>
                Abre{" "}
                <a href="https://www.spotify.com/account/privacy/" target="_blank" rel="noreferrer">
                  spotify.com/account/privacy
                </a>{" "}
                desde un navegador (no funciona desde la app) e inicia sesión.
              </p>
            </div>
          </div>

          <div className="step">
            <div>
              <h2 className="step-title">2. Solicita el "Extended streaming history"</h2>
              <p>
                Baja hasta <strong>Download your data</strong>, marca solo{" "}
                <strong>Extended streaming history</strong> y haz clic en{" "}
                <strong>Request data</strong>. Es la única opción que incluye el historial
                completo de reproducciones.
              </p>
            </div>
            <figure className="step-figure">
              <FotoPaso archivo="blocks" alt="" />
              <figcaption className="image-credit">
                Foto de <a href="https://unsplash.com/es/@blocks?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">blocks</a> en <a href="https://unsplash.com/es/fotos/auriculares-y-discos-de-vinilo-vintage-T3mKJXfdims?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
              </figcaption>
            </figure>
          </div>

          <div className="step">
            <figure className="step-figure">
              <FotoPaso archivo="gabriel-gurrola" alt="" />
              <figcaption className="image-credit">
                Foto de <a href="https://unsplash.com/es/@gabrielgurrola?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Gabriel Gurrola</a> en <a href="https://unsplash.com/es/fotos/persona-tocando-la-guitarra-2UuhMZEChdc?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
              </figcaption>
            </figure>
            <div>
              <h2 className="step-title">3. Confirma desde tu correo</h2>
              <p>
                Spotify te enviará un email de confirmación. Pulsa <strong>Confirm</strong>;
                si no lo haces, la solicitud no se procesa.
              </p>
            </div>
          </div>

          <div className="step">
            <div>
              <h2 className="step-title">4. Espera y descarga tu archivo</h2>
              <p>
                Puede tardar hasta 30 días, aunque normalmente llega en pocos días. Cuando
                esté listo recibirás otro correo con el botón de descarga. El enlace{" "}
                <strong>caduca a los 14 días</strong>, así que descárgalo pronto.
              </p>
            </div>
            <figure className="step-figure">
              <FotoPaso archivo="austin-neill" alt="" />
              <figcaption className="image-credit">
                Foto de <a href="https://unsplash.com/es/@arstyy?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Austin Neill</a> en <a href="https://unsplash.com/es/fotos/hombre-con-camisa-gris-de-manga-corta-cantando-hgO1wFPXl3I?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
              </figcaption>
            </figure>
          </div>

          <div className="step step-bottom">
            <figure className="step-figure">
              <FotoPaso archivo="kevin-mccutcheon" alt="" ancho={1280} alto={1920} />
              <figcaption className="image-credit">
                Foto de <a href="https://unsplash.com/es/@kevinmccutcheon?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Kevin McCutcheon</a> en <a href="https://unsplash.com/es/fotos/tocadiscos-negro-sobre-mesa-de-madera-marron-TcSckNRL9J8?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
              </figcaption>
            </figure>
            <div>
              <h2 className="step-title">5. Descomprime y sube tus archivos</h2>
              <p>
                Dentro del ZIP encontrarás archivos como{" "}
                <code>Streaming_History_Audio_2019-2021_0.json</code>. Cada registro incluye
                la fecha (<code>ts</code>), los milisegundos reproducidos (
                <code>ms_played</code>), canción, artista y álbum. Sube esos archivos aquí
                para ver tus estadísticas.
              </p>
            </div>
          </div>
        </section>

        <div className="decoracion">
          <div className="dec-white-1"></div>
          <div className="dec-white-2"></div>
        </div>

        <PreguntasFrecuentes preguntas={PREGUNTAS} />
      </main>
      <Footer />
    </>
  );
}
