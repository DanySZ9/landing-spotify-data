import { fmtDuracion, fmtNumero } from "../formato.js";

// Tarjeta: etiqueta arriba, cifra grande y una línea de contexto debajo
function Tarjeta({ etiqueta, valor, contexto, grande = false, medidor }) {
  return (
    <div className={grande ? "dato dato-grande" : "dato"}>
      <span className="dato-etiqueta">{etiqueta}</span>
      <strong className="dato-valor">{valor}</strong>
      {medidor !== undefined && (
        <span className="medidor" aria-hidden="true">
          <i style={{ width: `${Math.min(100, medidor)}%` }} />
        </span>
      )}
      {contexto && <span className="dato-contexto">{contexto}</span>}
    </div>
  );
}

export default function Resumen({ datos }) {
  const porDia = datos.dias_activos ? datos.minutos / datos.dias_activos : 0;
  return (
    <section className="resumen" aria-label="Resumen">
      <Tarjeta
        grande
        etiqueta="Tiempo escuchado"
        valor={fmtDuracion(datos.minutos)}
        contexto={`Unos ${fmtDuracion(porDia)} por cada día con música`}
      />
      <Tarjeta
        grande
        etiqueta="Reproducciones"
        valor={fmtNumero(datos.reproducciones)}
        contexto={`En ${fmtNumero(datos.dias_activos)} días con música`}
      />
      <Tarjeta etiqueta="Canciones distintas" valor={fmtNumero(datos.canciones_unicas)} />
      <Tarjeta etiqueta="Artistas distintos" valor={fmtNumero(datos.artistas_unicos)} />
      <Tarjeta
        etiqueta="Sesiones de escucha"
        valor={fmtNumero(datos.sesiones)}
        contexto={`De ${fmtDuracion(datos.minutos_por_sesion)} en promedio`}
      />
      <Tarjeta
        etiqueta="Reproducciones saltadas"
        valor={`${fmtNumero(datos.pct_saltadas)} %`}
        medidor={datos.pct_saltadas}
      />
    </section>
  );
}
