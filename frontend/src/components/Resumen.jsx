import { fmtDuracion, fmtNumero } from "../formato.js";

export default function Resumen({ datos }) {
  const items = [
    [fmtNumero(datos.reproducciones), "reproducciones"],
    [fmtDuracion(datos.minutos), "de música en total"],
    [fmtNumero(datos.dias_activos), "días con música"],
    [fmtNumero(datos.canciones_unicas), "canciones distintas"],
    [fmtNumero(datos.artistas_unicos), "artistas distintos"],
    [`${fmtNumero(datos.pct_saltadas)} %`, "de reproducciones saltadas"],
    [fmtNumero(datos.sesiones), "sesiones de escucha"],
    [fmtDuracion(datos.minutos_por_sesion), "dura una sesión en promedio"],
  ];
  return (
    <section className="resumen" aria-label="Resumen">
      {items.map(([valor, etiqueta]) => (
        <div className="dato" key={etiqueta}>
          <strong>{valor}</strong>
          <span>{etiqueta}</span>
        </div>
      ))}
    </section>
  );
}
