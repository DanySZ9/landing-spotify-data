import { useState } from "react";
import { analizar } from "./api.js";
import { FILTROS_INICIALES } from "./filtros.js";

{/* COMPONENTES */}
import Filtros from "./components/Filtros.jsx";
import Resumen from "./components/Resumen.jsx";

{/* COMPONENTES GRAFICOS */}
import GraficoHorasPorMes from "./components/charts/GraficoHorasPorMes.jsx";
import GraficoPorHora from "./components/charts/GraficoPorHora.jsx";
import GraficoMapaCalor from "./components/charts/GraficoMapaCalor.jsx";
import GraficoDispositivos from "./components/charts/GraficoDispositivos.jsx";
import GraficoCaracteristicas from "./components/charts/GraficoCaracteristicas.jsx";
import GraficoDuracion from "./components/charts/GraficoDuracion.jsx";
import GraficoComoEmpiezan from "./components/charts/GraficoComoEmpiezan.jsx";
import GraficoComoTerminan from "./components/charts/GraficoComoTerminan.jsx";

{/* COMPONENTES TABLAS */}
import TablaTopArtistas from "./components/tables/TablaTopArtistas.jsx";
import TablaTopCanciones from "./components/tables/TablaTopCanciones.jsx";
import TablaTopAlbumes from "./components/tables/TablaTopAlbumes.jsx";
import TablaTopPodcasts from "./components/tables/TablaTopPodcasts.jsx";
import TablaMasSaltadas from "./components/tables/TablaMasSaltadas.jsx";
import TablaTopDias from "./components/tables/TablaTopDias.jsx";
import TablaHistorial from "./components/tables/TablaHistorial.jsx";

{/* COMPONENTES */}
import Header from "./components/Header.jsx"
import PreguntasFrecuentes from "./components/PreguntasFrecuentes.jsx";

{/* ICONOS */}
import { Plus, Minus } from "lucide-react";

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
  const [activeQuestion, setActiveQuestion] = useState(null);

  async function ejecutar(files, f) {
    setCargando(true);
    setError("");
    try {
      setDatos(await analizar(files, f));
      setFiltros(f);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  function alElegirArchivos(e) {
    const files = [...e.target.files];
    if (!files.length) return;
    setArchivos(files);
    setDatos(null);
    ejecutar(files, FILTROS_INICIALES);
  }

  const g = datos?.graficos;
  const t = datos?.tablas;

  const tens = [1, 2, 1];                                  
  const units = [3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 3]; 

  // Preguntas frecuentes. `categoria` alimenta los botones para filtrar por tema
  // en <PreguntasFrecuentes />. Las respuestas describen el comportamiento real
  // del backend (ver backend/docs/API.md); si este cambia, actualízalas.
  const preguntas = [
      // --- General ---
      {
          id: 1,
          categoria: "General",
          question: "¿Qué puedo ver aquí que no me muestra Spotify Wrapped?",
          answer: "Wrapped resume un solo año con unas pocas cifras. Aquí puedes explorar todo tu historial desde que creaste la cuenta: horas escuchadas por mes, a qué hora y qué días escuchas más, en qué dispositivos, qué canciones saltas, cómo empiezan y terminan tus reproducciones, y rankings de hasta 100 artistas, canciones, álbumes y podcasts. Además puedes filtrar por fechas, artista, dispositivo y más."
      },
      {
          id: 2,
          categoria: "General",
          question: "¿Es una página oficial de Spotify?",
          answer: "No. Es un proyecto independiente, sin relación con Spotify. Solo usa los archivos que Spotify te entrega cuando solicitas tus datos; no se conecta a tu cuenta ni necesita tu contraseña."
      },
      {
          id: 3,
          categoria: "General",
          question: "¿Tiene algún costo o necesito crear una cuenta?",
          answer: "No. Es gratis y no hay registro: subes tus archivos y ves tus estadísticas al momento."
      },
      {
          id: 4,
          categoria: "General",
          question: "¿Puedo usarla desde el celular?",
          answer: "Sí, funciona en el navegador del móvil. Eso sí, primero tienes que descomprimir el ZIP que envía Spotify para poder elegir los archivos .json, y eso suele ser más cómodo desde una computadora."
      },

      // --- Privacidad ---
      {
          id: 5,
          categoria: "Privacidad",
          question: "¿Guardan mis archivos o mi historial?",
          answer: "No. Tus archivos se analizan en memoria y se descartan en cuanto se generan las estadísticas: no hay base de datos ni se guarda nada en el servidor. Si cierras o recargas la página, tendrás que volver a subirlos."
      },
      {
          id: 6,
          categoria: "Privacidad",
          question: "¿Qué datos de mis archivos se usan?",
          answer: "Solo los necesarios para las estadísticas: fecha y hora, tiempo escuchado, canción, artista, álbum, podcast, dispositivo y si la reproducción fue saltada, aleatoria, sin conexión o en modo incógnito. Datos como tu dirección IP o tu país de conexión, que también vienen en el archivo, se descartan sin usarse."
      },
      {
          id: 7,
          categoria: "Privacidad",
          question: "¿Alguien más puede ver mis estadísticas?",
          answer: "No. Los resultados solo se muestran en tu navegador y no se publican ni se comparten con nadie."
      },

      // --- Tus datos de Spotify ---
      {
          id: 8,
          categoria: "Tus datos",
          question: "¿Cómo pido mis datos a Spotify y cuánto tardan en llegar?",
          answer: "Entra a spotify.com/account/privacy desde un navegador, marca solo «Extended streaming history» y pulsa «Request data». Confirma la solicitud en el correo que te llega. Spotify indica que puede tardar hasta 30 días, aunque normalmente llega en pocos días. El enlace de descarga caduca a los 14 días. Arriba tienes los pasos detallados."
      },
      {
          id: 9,
          categoria: "Tus datos",
          question: "¿Qué archivos tengo que subir?",
          answer: "Los que se llaman Streaming_History_Audio_… .json, que están dentro del ZIP. Puedes seleccionarlos todos a la vez: se unen automáticamente para analizar todo tu historial. Si incluyes otros archivos del ZIP, simplemente se ignoran."
      },
      {
          id: 10,
          categoria: "Tus datos",
          question: "Pedí «Account data» y no funciona, ¿por qué?",
          answer: "Esa opción solo incluye aproximadamente el último año y con menos detalle, en archivos con otro formato (StreamingHistory_music_….json) que esta página no puede leer. Necesitas solicitar el «Extended streaming history»."
      },

      // --- Estadísticas ---
      {
          id: 11,
          categoria: "Estadísticas",
          question: "¿Por qué mis números no coinciden con los de Wrapped?",
          answer: "Aquí se cuenta cada reproducción del archivo, incluidas las que saltaste a los pocos segundos, y el periodo es el que tú elijas. Wrapped usa sus propios criterios y fechas. Para acercarte a su forma de contar, escribe 30 en el filtro «Duración mínima (segundos)»."
      },
      {
          id: 12,
          categoria: "Estadísticas",
          question: "¿Cómo se ordenan los rankings de artistas y canciones?",
          answer: "Por tiempo total escuchado, no por número de reproducciones. Así, una canción que saltaste veinte veces a los 3 segundos no supera a otra que escuchaste completa diez veces."
      },
      {
          id: 13,
          categoria: "Estadísticas",
          question: "¿Qué es una «sesión» de escucha?",
          answer: "Un bloque de reproducciones seguidas. Si pasan más de 30 minutos sin escuchar nada, la siguiente reproducción empieza una sesión nueva."
      },
      {
          id: 14,
          categoria: "Estadísticas",
          question: "¿En qué zona horaria se muestran las horas?",
          answer: "En la de tu dispositivo, que se detecta automáticamente. Spotify guarda las fechas en hora universal (UTC) y aquí se convierten a tu hora local para que los gráficos por hora y por día reflejen cuándo escuchaste realmente."
      },
      {
          id: 15,
          categoria: "Estadísticas",
          question: "¿Se incluyen los podcasts?",
          answer: "Sí. Tienen su propio ranking y, si tu historial incluye podcasts, el filtro «Contenido» te permite ver solo música o solo podcasts."
      },

      // --- Problemas ---
      {
          id: 16,
          categoria: "Problemas",
          question: "Dice que se ignoraron algunos archivos, ¿es un error?",
          answer: "No necesariamente. Se ignoran los archivos que no son historial de audio, por ejemplo el historial de video (Streaming_History_Video_….json), archivos dañados o de otro tipo. El resto se analiza con normalidad."
      },
      {
          id: 17,
          categoria: "Problemas",
          question: "Aparece «No hay reproducciones con esos filtros», ¿qué hago?",
          answer: "La combinación de filtros que elegiste no deja ninguna reproducción. Amplía el rango de fechas, quita el filtro de artista o pulsa «Restablecer» para volver a ver todo tu historial."
      },
      {
          id: 18,
          categoria: "Problemas",
          question: "¿Por qué tarda en cargar?",
          answer: "Un historial de varios años puede tener cientos de miles de reproducciones, y cada vez que aplicas filtros se vuelven a analizar todas. Suele tardar solo unos segundos, según el tamaño de tus archivos y tu conexión."
      },
  ]

  function showContent(index) {
    setActiveQuestion(activeQuestion === index ? null : index);
  }

  return (
    <main>

      <div className="background">
        <div className="window tens">
          <div className="strip">
            {tens.map((n, i) => <div className="number" key={i}>{n}</div>)}
          </div>
        </div>
        <div className="window units">
          <div className="strip">
            {units.map((n, i) => <div className="number" key={i}>{n}</div>)}
          </div>
        </div>
      </div>

      <Header />
      
      <section id="main">
        <h1 className="title-main">Tus estadísticas de <span>Spotify</span>, solo para ti</h1>
        <h2 className="subtitle-main">Tu historial de Spotify guarda años de música. Descubre cuáles son tus canciones más repetidas, a qué hora escuchas más y qué artistas dominan tu semana.</h2>
        <p className="text-main">
          Sube los archivos <code>Streaming_History_Audio_*.json</code> de tu exportación.
        </p>
        <label className="btn-subir">
          <input type="file" accept=".json" multiple onChange={alElegirArchivos} className="btn-subir-input" />
        </label>
        {cargando && <p className="estado">Analizando…</p>}
        {error && <p className="estado error" role="alert">{error}</p>}
        {datos?.ignorados.length > 0 && (
          <p className="estado">Se ignoraron por no ser historial de audio: {datos.ignorados.join(", ")}</p>
        )}
      </section>    

      <div className="dec">
        <div className="dec-1"></div>
        <div className="dec-2"></div>
      </div>

      <section className="informacion-usuario">
        {datos && (
          <>
            <Filtros key={archivos.map((a) => a.name + a.size).join("|")}
                    opciones={datos.opciones} aplicados={filtros} onAplicar={(f) => ejecutar(archivos, f)}
                    cargando={cargando} />
            <Resumen datos={datos.resumen} />

            <div className="pestanas" role="tablist">
              {PESTANAS.map(([id, nombre]) => (
                <button key={id} role="tab" aria-selected={pestana === id} onClick={() => setPestana(id)}>
                  {nombre}
                </button>
              ))}
            </div>

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
          </>
        )}
      </section>


      <section id="steps">

        <div className="step step-top">
          <figure className="step-figure">
            <img src="../nainoa-shizuru-NcdG9mK3PBY-unsplash.jpg" alt="Paso 1: página de privacidad" className="img-step" />
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
            <img src="../blocks-T3mKJXfdims-unsplash.jpg" alt="Paso 2: Solicita" className="img-step" />
            <figcaption className="image-credit">
              Foto de <a href="https://unsplash.com/es/@blocks?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">blocks</a> en <a href="https://unsplash.com/es/fotos/auriculares-y-discos-de-vinilo-vintage-T3mKJXfdims?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
            </figcaption>
          </figure>
        </div>

        <div className="step">
          <figure className="step-figure">
            <img src="../gabriel-gurrola-2UuhMZEChdc-unsplash.jpg" alt="Paso 3: Confirma desde tu correo" className="img-step" />
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
            <img src="../austin-neill-hgO1wFPXl3I-unsplash.jpg" alt="Paso 4: Espera y descarga tu archivo" className="img-step" />
            <figcaption className="image-credit">
              Foto de <a href="https://unsplash.com/es/@arstyy?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Austin Neill</a> en <a href="https://unsplash.com/es/fotos/hombre-con-camisa-gris-de-manga-corta-cantando-hgO1wFPXl3I?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
            </figcaption>
          </figure>
        </div>

        <div className="step step-bottom">
          <figure className="step-figure">
            <img src="../kevin-mccutcheon-TcSckNRL9J8-unsplash.jpg" alt="Paso 5: Descomprime y sube tus archivos" className="img-step" />
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

      <PreguntasFrecuentes preguntas={preguntas}/>
      
    </main>
  );
}
