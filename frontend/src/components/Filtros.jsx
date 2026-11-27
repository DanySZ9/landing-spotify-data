import { useId, useState } from "react";
import { FILTROS_INICIALES } from "../filtros.js";
import { fmtFecha } from "../formato.js";

const TRI = [["todas", "Todas"], ["si", "Sí"], ["no", "No"]];

// Campos que cuentan como "filtro activo" (la zona horaria no la elige el usuario)
const CAMPOS = Object.keys(FILTROS_INICIALES).filter((c) => c !== "zona");
const esActivo = (f, c) => JSON.stringify(f[c]) !== JSON.stringify(FILTROS_INICIALES[c]);
const AVANZADOS = ["saltadas", "aleatorio", "offline", "incognito"];

// Grupo de botones de opción única: muestra todas las opciones a la vista
function Segmentado({ etiqueta, valor, onChange, opciones = TRI }) {
  const nombre = useId();
  return (
    <fieldset className="campo">
      <legend>{etiqueta}</legend>
      <div className="segmentado">
        {opciones.map(([v, t]) => (
          <label key={v}>
            <input type="radio" name={nombre} value={v} checked={valor === v} onChange={() => onChange(v)} />
            <span>{t}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function Filtros({ opciones, aplicados, onAplicar, cargando }) {
  const [f, setF] = useState(aplicados);
  const cambiar = (campo) => (valor) => setF((a) => ({ ...a, [campo]: valor }));

  const activos = CAMPOS.filter((c) => esActivo(aplicados, c)).length;
  const hayCambios = CAMPOS.some((c) => JSON.stringify(f[c]) !== JSON.stringify(aplicados[c]));
  const avanzadosActivos = AVANZADOS.filter((c) => esActivo(f, c)).length;
  // "Más filtros" empieza abierto si ya hay alguno aplicado; luego lo controla el usuario
  const [abierto, setAbierto] = useState(() => AVANZADOS.some((c) => esActivo(aplicados, c)));

  function alternarPlataforma(p) {
    setF((a) => ({
      ...a,
      plataformas: a.plataformas.includes(p) ? a.plataformas.filter((x) => x !== p) : [...a.plataformas, p],
    }));
  }

  function reiniciar() {
    setF(FILTROS_INICIALES);
    onAplicar(FILTROS_INICIALES);
  }

  function aplicar(e) {
    e.preventDefault();
    onAplicar(f);
  }

  return (
    <form className="filtros" aria-label="Filtros" onSubmit={aplicar}>
      <div className="filtros-cabecera">
        <div>
          <h2>Filtra tus estadísticas</h2>
          <p className="rango">Tus datos van del {fmtFecha(opciones.rango.min)} al {fmtFecha(opciones.rango.max)}.</p>
        </div>
        {activos > 0 && (
          <span className="insignia">{activos === 1 ? "1 filtro activo" : `${activos} filtros activos`}</span>
        )}
      </div>

      <div className="filtros-rejilla">
        <fieldset className="campo">
          <legend>Periodo</legend>
          <div className="fechas">
            <label>
              <span className="sr-only">Desde</span>
              <input type="date" value={f.inicio} min={opciones.rango.min} max={opciones.rango.max}
                     aria-label="Desde" onChange={(e) => cambiar("inicio")(e.target.value)} />
            </label>
            <span className="fechas-guion" aria-hidden="true">—</span>
            <label>
              <span className="sr-only">Hasta</span>
              <input type="date" value={f.fin} min={opciones.rango.min} max={opciones.rango.max}
                     aria-label="Hasta" onChange={(e) => cambiar("fin")(e.target.value)} />
            </label>
          </div>
        </fieldset>

        <Segmentado etiqueta="Contenido" valor={f.contenido} onChange={cambiar("contenido")}
                    opciones={[["todo", "Todo"], ["musica", "Música"],
                               ...(opciones.hay_podcasts ? [["podcasts", "Podcasts"]] : [])]} />

        <label className="campo">
          <span className="campo-titulo">Artista</span>
          <input type="search" list="lista-artistas" placeholder="Cualquier artista" value={f.artista}
                 onChange={(e) => cambiar("artista")(e.target.value)} />
          <datalist id="lista-artistas">
            {opciones.artistas.map((a) => <option key={a} value={a} />)}
          </datalist>
        </label>

        <label className="campo">
          <span className="campo-titulo">Escuchadas al menos</span>
          <span className="con-unidad">
            <input type="number" min="0" max="3600" inputMode="numeric" value={f.min_segundos}
                   onChange={(e) => cambiar("min_segundos")(Math.max(0, Number(e.target.value) || 0))} />
            <span aria-hidden="true">segundos</span>
          </span>
        </label>
      </div>

      {opciones.plataformas.length > 1 && (
        <fieldset className="campo">
          <legend>Dispositivos <span className="ayuda">· sin marcar ninguno se incluyen todos</span></legend>
          <div className="pildoras">
            {opciones.plataformas.map((p) => (
              <label key={p} className="pildora">
                <input type="checkbox" checked={f.plataformas.includes(p)} onChange={() => alternarPlataforma(p)} />
                <span>{p}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <details className="mas-filtros" open={abierto} onToggle={(e) => setAbierto(e.currentTarget.open)}>
        <summary>
          Más filtros{avanzadosActivos > 0 && <span className="insignia">{avanzadosActivos}</span>}
        </summary>
        <div className="filtros-rejilla">
          <Segmentado etiqueta="Saltadas" valor={f.saltadas} onChange={cambiar("saltadas")} />
          <Segmentado etiqueta="Modo aleatorio" valor={f.aleatorio} onChange={cambiar("aleatorio")} />
          <Segmentado etiqueta="Sin conexión" valor={f.offline} onChange={cambiar("offline")} />
          <Segmentado etiqueta="Modo incógnito" valor={f.incognito} onChange={cambiar("incognito")} />
        </div>
      </details>

      <div className="acciones">
        <button type="submit" className="primario" disabled={cargando || !hayCambios}>
          {cargando ? "Aplicando…" : "Aplicar filtros"}
        </button>
        <button type="button" className="secundario" onClick={reiniciar} disabled={cargando || activos === 0}>
          Quitar filtros
        </button>
        {hayCambios && !cargando && <span className="ayuda">Tienes cambios sin aplicar</span>}
      </div>
    </form>
  );
}
