# Arquitectura del backend

## Visión general

El backend es un **servicio sin estado** (*stateless*): no recuerda nada entre
peticiones, no tiene base de datos y no escribe en disco. Cada petición trae
todo lo necesario (los archivos y los filtros) y recibe todo el resultado.

```
 Navegador (frontend React, puerto 5173)
        │  POST /api/analizar   (archivos JSON + filtros)
        ▼
 ┌────────────────────────── Backend (FastAPI + Uvicorn, puerto 8000) ──────────────────────────┐
 │                                                                                               │
 │  CORSMiddleware ─► main.py  ──►  data.py  ──────────────────────►  analysis.py               │
 │  (¿origen        (HTTP,          cargar_historial                    resumen / sesiones       │
 │   permitido?)     validación,    preparar  ──► etiquetas.py          │                        │
 │                   errores)       opciones_disponibles                ├─► graficos.py ─┐       │
 │                                  aplicar_filtros                     └─► tablas.py  ──┴► etiquetas.py
 │                                                                                               │
 └───────────────────────────────────────────────────────────────────────────────────────────────┘
        │  200 {opciones, ignorados, resumen, graficos, tablas}   ó   400/500 {detail}
        ▼
 Navegador dibuja tarjetas, gráficos (Plotly) y tablas
```

## Capas y responsabilidades

El código está separado en capas para que cada archivo tenga **una sola razón
para cambiar**:

| Capa | Archivo | Sabe de HTTP | Sabe de pandas | Razón para cambiar |
|---|---|:-:|:-:|---|
| Entrada / transporte | `main.py` | ✅ | ❌ | Nuevas rutas, CORS, manejo de errores, límites. |
| Datos | `data.py` | ❌ | ✅ | Formato del export, filtros nuevos, columnas derivadas. |
| Orquestación | `analysis.py` | ❌ | ✅ | Agregar/quitar gráficos o tablas, cifras del resumen. |
| Presentación (gráficos) | `graficos.py` | ❌ | ✅ | Aspecto visual de los gráficos. |
| Presentación (tablas) | `tablas.py` | ❌ | ✅ | Rankings y columnas de las tablas. |
| Traducciones | `etiquetas.py` | ❌ | mínimo | Textos visibles y agrupaciones de códigos. |

Ventaja práctica: `data.py`, `analysis.py`, `graficos.py` y `tablas.py` se pueden
usar y probar desde un script o un cuaderno Jupyter **sin levantar el servidor**.

Grafo de dependencias (quién importa a quién; no hay ciclos):

```
main.py ──► data.py ──────► etiquetas.py
   └──────► analysis.py ──► graficos.py ──► etiquetas.py
                       └──► tablas.py ───► etiquetas.py
```

## Recorrido de una petición, paso a paso

1. **El navegador envía** un `POST` con formato *multipart/form-data*: uno o
   varios archivos en el campo `archivos` y un texto JSON en `filtros`
   (ver `frontend/src/api.js`).
2. **CORSMiddleware** comprueba que el origen esté autorizado. Si no lo está, el
   navegador no deja que la página lea la respuesta.
3. **FastAPI** lee el formulario. Si falta `archivos` responde `422` automáticamente.
4. **`main.analizar_historial`** valida `filtros` con el esquema `Filtros`
   (Pydantic). Si hay un valor no permitido → `400`.
5. Lee cada archivo **completo en memoria** como bytes.
6. **`data.cargar_historial`**: decodifica cada JSON, descarta los que no son
   historial de audio (y los anota en `ignorados`), conserva solo las columnas
   necesarias y normaliza tipos (fecha UTC, números, booleanos).
7. **`data.preparar`**: convierte la fecha a la zona horaria del usuario y añade
   `local`, `hora`, `dia`, `dispositivo` y `tipo`.
8. **`data.opciones_disponibles`**: calcula dispositivos, artistas y rango de
   fechas **antes** de filtrar, para que los controles del frontend muestren
   siempre todas las opciones posibles aunque haya un filtro activo.
9. **`data.aplicar_filtros`**: recorta la tabla. Si queda vacía → `400`.
10. **`analysis.analizar`**: calcula el resumen y llama a cada función de
    `graficos.py` y `tablas.py`.
11. FastAPI convierte el diccionario final en JSON y responde `200`.
12. Al terminar la función, Python libera la memoria: **no queda rastro de los datos**.

## Decisiones de diseño (el "por qué")

| Decisión | Motivo |
|---|---|
| Sin base de datos ni disco | Privacidad: el historial de escucha es personal. Además simplifica mucho el despliegue. |
| Reenviar los archivos en cada cambio de filtro | Consecuencia de no guardar estado. Es más simple y privado, a cambio de volver a subir y procesar los archivos cada vez. |
| Descartar columnas como `ip_addr` o `conn_country` | Minimizar datos personales en memoria; el análisis no las necesita. |
| Gráficos generados en el backend | El frontend solo dibuja; toda la lógica y el estilo de datos está en Python, en un único lugar. |
| Rankings por tiempo escuchado, no por reproducciones | Una canción saltada a los 3 s no debe contar igual que una escuchada completa. |
| Errores inesperados como `HTTPException(500)` | Así la respuesta pasa por el middleware CORS y el frontend puede mostrar el mensaje en vez de un confuso "error de CORS". |
| Opciones calculadas antes de filtrar | Si se calcularan después, al filtrar por "Android" desaparecerían los demás dispositivos del selector. |

## Limitaciones conocidas

- Todo el historial se carga en memoria en cada petición: historiales muy
  grandes (varios cientos de MB) consumen mucha RAM y CPU.
- No hay límite de tamaño ni de número de archivos.
- La configuración (CORS) está escrita en el código.

Detalles y propuestas en [`HALLAZGOS.md`](HALLAZGOS.md).
