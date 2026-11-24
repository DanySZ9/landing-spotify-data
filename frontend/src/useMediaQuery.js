import { useSyncExternalStore } from "react";

// true mientras se cumpla la media query. Se actualiza al girar o redimensionar.
export function useMediaQuery(consulta) {
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia(consulta);
      mq.addEventListener("change", avisar);
      return () => mq.removeEventListener("change", avisar);
    },
    () => window.matchMedia(consulta).matches
  );
}
