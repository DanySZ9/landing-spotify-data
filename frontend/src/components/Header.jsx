import { useEffect, useState } from "react";
import "./Header.css";

const NOMBRE = "Spotlytics"; // cámbialo por el nombre de tu proyecto

export default function Header({ hayDatos = false }) {
  const [conFondo, setConFondo] = useState(false);
  const [activa, setActiva] = useState("main");
  const [menuAbierto, setMenuAbierto] = useState(false);

  // ids de las secciones de la página: main, estadisticas, steps, preguntas
  const enlaces = [
    ["main", "Inicio"],
    ...(hayDatos ? [["estadisticas", "Mis estadísticas"]] : []),
    ["steps", "Pasos"],
    ["preguntas", "Preguntas frecuentes"],
  ];

  // Fondo difuminado cuando se baja de la parte superior
  useEffect(() => {
    const alScroll = () => setConFondo(window.scrollY > 16);
    alScroll();
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => window.removeEventListener("scroll", alScroll);
  }, []);

  // Marca como activo el enlace de la sección que cruza la mitad de la pantalla
  useEffect(() => {
    const secciones = enlaces.map(([id]) => document.getElementById(id)).filter(Boolean);
    const observador = new IntersectionObserver(
      (entradas) => entradas.forEach((e) => e.isIntersecting && setActiva(e.target.id)),
      { rootMargin: "-40% 0px -55% 0px" }
    );
    secciones.forEach((s) => observador.observe(s));
    return () => observador.disconnect();
  }, [hayDatos]);

  // Escape cierra el menú en móvil
  useEffect(() => {
    if (!menuAbierto) return;
    const alTeclear = (e) => e.key === "Escape" && setMenuAbierto(false);
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [menuAbierto]);

  const cerrar = () => setMenuAbierto(false);

  return (
    <header className={`sitio-header ${conFondo || menuAbierto ? "con-fondo" : ""}`}>
      <a href="#main" className="sitio-marca" onClick={cerrar}>
        <span className="eq" aria-hidden="true"><i /><i /><i /></span>
        <span>{NOMBRE}</span>
      </a>

      <nav id="menu-principal" className={`sitio-nav ${menuAbierto ? "abierto" : ""}`} aria-label="Principal">
        <ul>
          {enlaces.map(([id, texto]) => (
            <li key={id}>
              <a href={`#${id}`} aria-current={activa === id ? "location" : undefined} onClick={cerrar}>
                {texto}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sitio-acciones">
        <a href="#main" className={`sitio-cta ${conFondo ? "visible" : ""}`}>Subir historial</a>
        <button
          type="button"
          className="sitio-menu"
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuAbierto}
          aria-controls="menu-principal"
          onClick={() => setMenuAbierto((a) => !a)}
        >
          <span /><span />
        </button>
      </div>
    </header>
  );
}
