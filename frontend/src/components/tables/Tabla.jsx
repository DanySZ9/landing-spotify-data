import { useMemo, useState } from "react";
import { fmtDuracion, fmtNumero } from "../../formato.js";

/**
 * Tabla base: numeración, barras de proporción, ordenamiento, buscador y "ver más".
 *
 * columnas: [{
 *   clave,           campo de la fila (también sirve para ordenar)
 *   etiqueta,        encabezado
 *   tipo,            "texto" | "numero" | "duracion" | "porcentaje"
 *   barra,           true -> barra proporcional bajo el valor (numero/duracion)
 *   ayuda,           explicación que aparece al pasar el cursor por el encabezado
 *   render(fila),    contenido propio de la celda (opcional, solo para texto)
 * }]
 */
export default function Tabla({
  titulo, descripcion, columnas, filas, ranking = true, buscar = true, inicial = 10, limite = 100,
}) {
  const [orden, setOrden] = useState(null); // { clave, dir }
  const [texto, setTexto] = useState("");
  const [expandida, setExpandida] = useState(false);

  const maximos = useMemo(() => {
    const m = {};
    columnas.filter((c) => c.barra).forEach((c) => {
      m[c.clave] = Math.max(...(filas ?? []).map((f) => f[c.clave]), 1);
    });
    return m;
  }, [columnas, filas]);

  const visibles = useMemo(() => {
    let f = filas ?? [];
    const q = texto.trim().toLowerCase();
    if (q) {
      const claves = columnas.filter((c) => c.tipo === "texto").map((c) => c.clave);
      f = f.filter((fila) => claves.some((k) => String(fila[k]).toLowerCase().includes(q)));
    }
    if (orden) {
      const { clave, dir } = orden;
      f = [...f].sort((a, b) =>
        typeof a[clave] === "number"
          ? (a[clave] - b[clave]) * dir
          : String(a[clave]).localeCompare(String(b[clave]), "es") * dir
      );
    }
    return f;
  }, [filas, columnas, texto, orden]);

  if (!filas?.length) return null;

  // Primer clic: mayor a menor · segundo: menor a mayor · tercero: orden original
  function ordenarPor(clave) {
    setOrden((o) => {
      if (o?.clave !== clave) return { clave, dir: -1 };
      return o.dir === -1 ? { clave, dir: 1 } : null;
    });
  }

  const tope = expandida ? limite : inicial;
  const mostradas = visibles.slice(0, tope);

  function celda(c, fila) {
    const v = fila[c.clave];
    if (c.render) return c.render(fila);
    if (c.tipo === "duracion") {
      return (
        <div className="celda-barra">
          <span>{fmtDuracion(v)}</span>
          {c.barra && <i style={{ width: `${(v / maximos[c.clave]) * 100}%` }} aria-hidden="true" />}
        </div>
      );
    }
    if (c.tipo === "porcentaje") {
      const nivel = v >= 50 ? "alto" : v >= 25 ? "medio" : "bajo";
      return <span className={`chip chip-${nivel}`}>{fmtNumero(v)} %</span>;
    }
    if (c.tipo === "numero") {
      return (
        <div className="celda-barra">
          <span>{fmtNumero(v)}</span>
          {c.barra && <i style={{ width: `${(v / maximos[c.clave]) * 100}%` }} aria-hidden="true" />}
        </div>
      );
    }
    return v;
  }

  return (
    <section className="panel">
      <div className="tabla-cabecera">
        <div className="panel-texto">
          <h2>{titulo}</h2>
          {descripcion && <p className="descripcion">{descripcion}</p>}
        </div>
        {buscar && filas.length > inicial && (
          <input
            type="search"
            placeholder="Buscar…"
            aria-label={`Buscar en ${titulo}`}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
        )}
      </div>

      <div className="orden-movil">
        <label>
          Ordenar por
          <select
            value={orden?.clave ?? ""}
            onChange={(e) => {
              const c = columnas.find((col) => col.clave === e.target.value);
              setOrden(c ? { clave: c.clave, dir: c.tipo === "texto" ? 1 : -1 } : null);
            }}
          >
            <option value="">Orden original</option>
            {columnas.map((c) => <option key={c.clave} value={c.clave}>{c.etiqueta}</option>)}
          </select>
        </label>
        <button
          type="button"
          disabled={!orden}
          aria-label={orden?.dir === 1 ? "Cambiar a orden descendente" : "Cambiar a orden ascendente"}
          onClick={() => setOrden((o) => o && { ...o, dir: -o.dir })}
        >
          <span aria-hidden="true">{orden?.dir === 1 ? "▲" : "▼"}</span>
        </button>
      </div>

      {/* Los role explícitos conservan la semántica de tabla cuando el CSS la muestra como tarjetas */}
      <div className="tabla-scroll">
        <table role="table">
          <thead role="rowgroup">
            <tr role="row">
              {ranking && <th role="columnheader" className="col-rank"><span className="sr-only">Posición</span></th>}
              {columnas.map((c) => {
                const activo = orden?.clave === c.clave;
                return (
                  <th
                    role="columnheader"
                    key={c.clave}
                    className={c.tipo === "texto" ? "" : "num"}
                    aria-sort={activo ? (orden.dir === 1 ? "ascending" : "descending") : "none"}
                  >
                    <button onClick={() => ordenarPor(c.clave)} title={c.ayuda}>
                      {c.etiqueta}
                      <span className="flecha" aria-hidden="true">{activo ? (orden.dir === 1 ? "▲" : "▼") : ""}</span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody role="rowgroup">
            {mostradas.map((fila, i) => (
              <tr role="row" key={i}>
                {ranking && <td role="cell" className="col-rank">{i + 1}</td>}
                {columnas.map((c, n) => (
                  <td
                    role="cell"
                    key={c.clave}
                    data-etiqueta={c.etiqueta}
                    className={`${c.tipo === "texto" ? "" : "num"} ${n === 0 ? "principal" : ""}`}
                  >
                    {celda(c, fila)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pie-tabla">
        <span>Mostrando {mostradas.length} de {visibles.length}</span>
        {visibles.length > inicial && (
          <button onClick={() => setExpandida((e) => !e)}>
            {expandida ? "Ver menos" : `Ver hasta ${Math.min(limite, visibles.length)}`}
          </button>
        )}
      </div>
    </section>
  );
}
