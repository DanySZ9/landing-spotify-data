import { useState } from "react";
import { FILTROS_INICIALES } from "../filtros.js";

const TRI = [["todas", "Todas"], ["si", "Solo sí"], ["no", "Solo no"]];

function Selector({ etiqueta, valor, onChange, opciones = TRI }) {
  return (
    <label>
      {etiqueta}
      <select value={valor} onChange={(e) => onChange(e.target.value)}>
        {opciones.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </label>
  );
}

export default function Filtros({ opciones, aplicados, onAplicar, cargando }) {
  const [f, setF] = useState(aplicados);
  const cambiar = (campo) => (valor) => setF((a) => ({ ...a, [campo]: valor }));

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

  return (
    <section className="filtros" aria-label="Filtros">
      <p className="rango">Tus datos van del {opciones.rango.min} al {opciones.rango.max}.</p>

      <div className="fila-filtros">
        <label>Desde
          <input type="date" value={f.inicio} min={opciones.rango.min} max={opciones.rango.max}
                 onChange={(e) => cambiar("inicio")(e.target.value)} />
        </label>
        <label>Hasta
          <input type="date" value={f.fin} min={opciones.rango.min} max={opciones.rango.max}
                 onChange={(e) => cambiar("fin")(e.target.value)} />
        </label>
        <Selector etiqueta="Contenido" valor={f.contenido} onChange={cambiar("contenido")}
                  opciones={[["todo", "Todo"], ["musica", "Solo música"],
                             ...(opciones.hay_podcasts ? [["podcasts", "Solo podcasts"]] : [])]} />
        <label>Artista
          <input type="text" list="lista-artistas" placeholder="Cualquiera" value={f.artista}
                 onChange={(e) => cambiar("artista")(e.target.value)} />
          <datalist id="lista-artistas">
            {opciones.artistas.map((a) => <option key={a} value={a} />)}
          </datalist>
        </label>
        <label>Duración mínima (segundos)
          <input type="number" min="0" max="3600" value={f.min_segundos}
                 onChange={(e) => cambiar("min_segundos")(Math.max(0, Number(e.target.value) || 0))} />
        </label>
      </div>

      <fieldset className="plataformas">
        <legend>Dispositivos</legend>
        {opciones.plataformas.map((p) => (
          <label key={p} className="casilla">
            <input type="checkbox" checked={f.plataformas.includes(p)} onChange={() => alternarPlataforma(p)} />
            {p}
          </label>
        ))}
        <span className="ayuda">Sin marcar ninguna se incluyen todas.</span>
      </fieldset>

      <details>
        <summary>Más filtros</summary>
        <div className="fila-filtros">
          <Selector etiqueta="Saltadas" valor={f.saltadas} onChange={cambiar("saltadas")} />
          <Selector etiqueta="Modo aleatorio" valor={f.aleatorio} onChange={cambiar("aleatorio")} />
          <Selector etiqueta="Sin conexión" valor={f.offline} onChange={cambiar("offline")} />
          <Selector etiqueta="Modo incógnito" valor={f.incognito} onChange={cambiar("incognito")} />
        </div>
      </details>

      <div className="acciones">
        <button className="primario" onClick={() => onAplicar(f)} disabled={cargando}>{cargando ? "Aplicando…" : "Aplicar filtros"}</button>
        <button className="secundario" onClick={reiniciar} disabled={cargando}>Restablecer</button>
      </div>
    </section>
  );
}
