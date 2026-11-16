import { useMemo, useState } from "react";
import "./PreguntasFrecuentes.css";

/**
 * preguntas: [{ id, categoria, question, answer }]
 * Si las preguntas tienen `categoria`, aparecen los botones para filtrarlas por tema.
 */

export default function PreguntasFrecuentes({ preguntas }) {
  const categorias = useMemo(
    () => ["Todas", ...new Set(preguntas.map((p) => p.categoria).filter(Boolean))],
    [preguntas]
  );
  const [categoria, setCategoria] = useState("Todas");

  const visibles = categoria === "Todas" ? preguntas : preguntas.filter((p) => p.categoria === categoria);

  return (
    <section id="preguntas" className="faq">
      <div className="faq-contenedor">
        <div className="faq-intro">
          <h2 className="faq-titulo">Preguntas frecuentes</h2>
          <p className="faq-texto">Lo que conviene saber antes de subir tu historial.</p>

          {categorias.length > 2 && (
            <div className="faq-chips" role="group" aria-label="Filtrar preguntas por tema">
              {categorias.map((c) => (
                <button key={c} type="button" aria-pressed={categoria === c} onClick={() => setCategoria(c)}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="faq-lista">
          {visibles.map((p) => (
            // `name` hace que se abra una sola pregunta a la vez
            <details key={p.id} name="faq" className="faq-item">
              <summary>
                <span>{p.question}</span>
                <span className="faq-icono" aria-hidden="true" />
              </summary>
              <p className="faq-respuesta">{p.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
