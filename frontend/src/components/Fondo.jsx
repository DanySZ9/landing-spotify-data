import { useEffect, useState } from "react";

const DECENAS = [1, 2, 1];
const UNIDADES = [3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 3];

function Ventana({ clase, numeros }) {
  return (
    <div className={`window ${clase}`}>
      <div className="strip">
        {numeros.map((n, i) => <div className="number" key={i}>{n}</div>)}
      </div>
    </div>
  );
}

// Números animados del fondo. Se detienen cuando el inicio sale de la pantalla,
// porque el resto de secciones los tapa.
export default function Fondo() {
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    const observador = new IntersectionObserver(([e]) => setPausado(!e.isIntersecting));
    observador.observe(document.getElementById("main"));
    return () => observador.disconnect();
  }, []);

  return (
    <div className={`background ${pausado ? "pausado" : ""}`} aria-hidden="true">
      <Ventana clase="tens" numeros={DECENAS} />
      <Ventana clase="units" numeros={UNIDADES} />
    </div>
  );
}
