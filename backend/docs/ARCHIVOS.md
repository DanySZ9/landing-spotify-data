# Ficha de cada archivo

Cada ficha responde a las mismas preguntas: propósito, responsabilidad, archivos
que utiliza, qué recibe, qué procesa, qué devuelve y cuándo modificarlo.
El código fuente contiene el mismo resumen en su comentario inicial.

Índice: [main.py](#mainpy) · [data.py](#datapy) · [analysis.py](#analysispy) ·
[graficos.py](#graficospy) · [tablas.py](#tablaspy) · [etiquetas.py](#etiquetaspy) ·
[requirements.txt](#requirementstxt)

---

## `main.py`

| Pregunta | Respuesta |
|---|---|
| **Propósito** | Punto de entrada: crea la aplicación FastAPI y expone `POST /api/analizar` y `GET /api/salud`. |
| **Responsabilidad** | Todo lo relacionado con HTTP: configurar CORS, recibir archivos y filtros, validar los filtros, llamar al resto de módulos en orden y convertir errores en respuestas 400/500. No hace cálculos. |
| **Usa** | `data.py` (`Filtros`, `cargar_historial`, `preparar`, `opciones_disponibles`, `aplicar_filtros`), `analysis.py` (`analizar`). Librerías: FastAPI, Pydantic, logging. |
| **Recibe** | Petición multipart con `archivos` (lista de `UploadFile`) y `filtros` (texto JSON). |
| **Procesa** | Valida filtros → lee bytes → carga → prepara → opciones → filtra → analiza. |
| **Devuelve** | JSON `{opciones, ignorados, resumen, graficos, tablas}` o `{detail}` con 400/500. |
| **Modificar cuando…** | Se agregue otra ruta; se quiera limitar tamaño de subida, añadir autenticación, *rate limiting* o cambiar mensajes de error. Para cambiar los dominios permitidos por CORS **no** hace falta tocarlo: se usa la variable de entorno `ALLOWED_ORIGINS`. |

**Funciones / objetos**

| Nombre | Qué es |
|---|---|
| `app` | La aplicación FastAPI; Uvicorn la arranca con `uvicorn main:app`. |
| `log` | Logger para registrar errores inesperados en la consola. |
| `ORIGENES` | Lista de orígenes CORS, leída de `ALLOWED_ORIGINS` (o los de desarrollo si no existe). Ignora espacios, entradas vacías y barras finales. |
| `salud()` | `GET /api/salud`: devuelve `{"ok": true}`. La usa Render como *health check*. |
| `analizar_historial(archivos, filtros)` | El endpoint principal. Es `async` porque espera la lectura de cada archivo. |

---

## `data.py`

| Pregunta | Respuesta |
|---|---|
| **Propósito** | Convertir los JSON de Spotify en una tabla (DataFrame) limpia y filtrarla. |
| **Responsabilidad** | Definir el esquema de filtros, leer y unir archivos, limpiar tipos, crear columnas derivadas, calcular opciones de filtro y aplicar filtros. |
| **Usa** | `etiquetas.py` (`dispositivo`). Librerías: pandas, Pydantic, json, zoneinfo. |
| **Recibe** | Lista de `(nombre, bytes)`; una zona horaria; un objeto `Filtros`. |
| **Procesa** | Decodifica JSON, descarta archivos inválidos o de video, conserva solo 15 columnas, convierte fechas a UTC y luego a hora local, clasifica dispositivo y tipo de contenido. |
| **Devuelve** | DataFrames; lista de archivos ignorados; diccionario de opciones. Lanza `ValueError` si no hay ningún historial válido o si una fecha de filtro no se puede interpretar. |
| **Modificar cuando…** | Se agregue un filtro (campo en `Filtros` + condición en `aplicar_filtros` + control en el frontend); Spotify cambie su formato (`COLUMNAS`); se necesite una columna derivada nueva (`preparar`). |

**Funciones / objetos**

| Nombre | Entrada → Salida | Notas |
|---|---|---|
| `COLUMNAS` | — | Columnas que se conservan. Las demás (IP, país…) se descartan. |
| `BANDERAS` | — | Columnas verdadero/falso; `null` se convierte en `False`. |
| `Filtros` | JSON → objeto validado | Esquema Pydantic. Valores por defecto = sin filtrar. |
| `cargar_historial(archivos)` | `[(nombre, bytes)]` → `(df, ignorados)` | Ignora: JSON inválido, no-lista, sin `ts`, o nombre con "video". |
| `preparar(df, zona)` | df → df con `local`, `hora`, `dia`, `dispositivo`, `tipo` | Zona inválida → UTC. `dia`: 0 = lunes. Devuelve una copia. |
| `opciones_disponibles(df)` | df → dict | Se llama **antes** de filtrar. |
| `_tri(df, col, valor)` | df → df | Filtro de tres estados (interno). |
| `aplicar_filtros(df, f)` | df, `Filtros` → df | Puede devolver un df vacío. |

**Columnas del DataFrame tras `preparar`** (referencia para todo el backend)

| Columna | Tipo | Origen |
|---|---|---|
| `ts` | fecha UTC | export |
| `local` | fecha sin zona (hora local del usuario) | derivada |
| `hora` | 0–23 | derivada |
| `dia` | 0–6 (lunes–domingo) | derivada |
| `dispositivo` | texto agrupado | derivada (`etiquetas.dispositivo`) |
| `tipo` | `musica` / `podcast` / `otro` | derivada |
| `ms_played` | número | export |
| `shuffle`, `skipped`, `offline`, `incognito_mode` | `True`/`False` | export, normalizadas |
| resto de `COLUMNAS` | texto o vacío | export |

---

## `analysis.py`

| Pregunta | Respuesta |
|---|---|
| **Propósito** | Ensamblar la respuesta final del análisis. |
| **Responsabilidad** | Calcular el resumen y las sesiones; llamar a cada gráfico y tabla; definir los **nombres de las claves** que el frontend espera. |
| **Usa** | `graficos.py`, `tablas.py`. Librería: pandas. |
| **Recibe** | DataFrame preparado y filtrado, nunca vacío. |
| **Procesa** | Totales, porcentaje de saltadas, detección de sesiones (pausa > 30 min = nueva sesión). |
| **Devuelve** | `{"resumen": {...}, "graficos": {...}, "tablas": {...}}`. |
| **Modificar cuando…** | Se agregue/quite un gráfico o tabla; se agregue una cifra al resumen; se cambie la definición de sesión (`HUECO_SESION`). Si se renombra una clave, hay que actualizar el frontend. |

**Funciones**

| Nombre | Qué hace |
|---|---|
| `HUECO_SESION` | 30 minutos: pausa máxima dentro de una sesión. |
| `sesiones(df)` | Devuelve `(número de sesiones, minutos promedio)`. Estima el inicio de cada reproducción como `ts − ms_played`. |
| `resumen(df)` | Diccionario de 8 cifras para las tarjetas del frontend. |
| `analizar(df)` | Construye el diccionario completo. |

---

## `graficos.py`

| Pregunta | Respuesta |
|---|---|
| **Propósito** | Construir los gráficos con Plotly y entregarlos como JSON. |
| **Responsabilidad** | Agrupar datos para cada gráfico y definir su aspecto (tema oscuro, colores, texto al pasar el ratón). Los títulos y explicaciones los pone el frontend. |
| **Usa** | `etiquetas.py` (`grupo_inicio`, `grupo_fin`). Librerías: Plotly, pandas, json. |
| **Recibe** | DataFrame preparado y filtrado. |
| **Procesa** | Conteos por mes/hora/día, porcentajes por dispositivo y característica, tramos de duración, motivos de inicio/fin. |
| **Devuelve** | `{"data": [...], "layout": {...}}` por gráfico, o `None` si no hay datos. |
| **Modificar cuando…** | Se cree un gráfico nuevo; se cambie la paleta o el tema visual; se ajusten tamaños, ejes o textos emergentes. |

**Funciones**

| Función | Gráfico | Datos |
|---|---|---|
| `por_mes` | Barras | Horas escuchadas por mes (meses vacíos = 0). |
| `por_hora` | Barras | Reproducciones por hora 0–23. |
| `mapa_calor` | Mapa de calor | Reproducciones por día de la semana × hora. |
| `dispositivos` | Barras horizontales | % por dispositivo. |
| `caracteristicas` | Barras horizontales | % aleatorio, saltadas, sin conexión, incógnito. |
| `duracion` | Barras | Reproducciones en 5 tramos de duración. |
| `como_empiezan` / `como_terminan` | Dona | Motivos de inicio / fin agrupados. |
| `_json`, `_barras_pct`, `_dona` | (internas) | Estilo común y plantillas reutilizables. |

---

## `tablas.py`

| Pregunta | Respuesta |
|---|---|
| **Propósito** | Construir los rankings y el historial reciente. |
| **Responsabilidad** | Agrupar, ordenar por tiempo escuchado y renombrar columnas a nombres "amigables"; convertir a lista de filas JSON. |
| **Usa** | `etiquetas.py` (`fin_detalle`). Librería: pandas. |
| **Recibe** | DataFrame preparado y filtrado. |
| **Procesa** | Sumas de `ms_played`, conteos, porcentaje de saltadas, favorito por artista y por día. |
| **Devuelve** | DataFrames pequeños; `a_filas` los convierte en `[{columna: valor}]`. |
| **Modificar cuando…** | Se agregue una tabla; se cambie el número de filas (`TOP` o `n`); se agregue una columna. Los nombres de columna los usa `frontend/src/components/tables`. |

**Funciones**

| Función | Filas máx. | Orden |
|---|---|---|
| `top_canciones` | 100 | Tiempo escuchado |
| `top_artistas` | 100 | Tiempo escuchado (incluye canción favorita) |
| `top_albumes` | 100 | Tiempo escuchado |
| `top_podcasts` | 100 | Tiempo escuchado |
| `mas_saltadas` | 50 | % saltadas, luego reproducciones (mín. 5 reproducciones) |
| `top_dias` | 15 | Tiempo escuchado ese día (incluye artista del día) |
| `historial_reciente` | 100 | Más reciente primero |
| `_musica`, `_por_cancion` | — | Internas: filtro de música y totales por canción. |
| `a_filas` | — | DataFrame → lista de diccionarios; `NaN` → `""`. |

---

## `etiquetas.py`

| Pregunta | Respuesta |
|---|---|
| **Propósito** | Traducir códigos técnicos del export a español comprensible. |
| **Responsabilidad** | Diccionarios de traducción y funciones que los aplican; agrupación de plataformas en dispositivos. |
| **Usa** | Ningún archivo del proyecto. Librerías: pandas, re (expresiones regulares). |
| **Recibe** | Columnas con `reason_start`/`reason_end`, o un texto de plataforma. |
| **Procesa** | Busca cada código en el diccionario; para plataformas, busca palabras clave en orden. |
| **Devuelve** | Textos en español; desconocidos → "Otro motivo" / "Otro". |
| **Modificar cuando…** | Aparezcan muchos "Otro" en los gráficos (falta un código o patrón); se quieran cambiar textos visibles o agrupaciones. |

**Objetos**

| Nombre | Uso |
|---|---|
| `FIN_DETALLE` | Texto detallado del motivo de fin (tabla historial). |
| `GRUPO_FIN` / `GRUPO_INICIO` | Agrupaciones con pocas categorías (gráficos de dona). |
| `grupo_fin`, `grupo_inicio`, `fin_detalle` | Aplican los diccionarios a una columna. |
| `dispositivo(plataforma)` | Clasifica una plataforma. **El orden de las comprobaciones importa.** |

---

## `requirements.txt`

| Pregunta | Respuesta |
|---|---|
| **Propósito** | Listar las librerías de Python que necesita el backend. |
| **Contenido** | `fastapi` (framework web), `uvicorn[standard]` (servidor), `python-multipart` (necesario para recibir archivos/formularios), `pandas` (análisis), `plotly` (gráficos). |
| **Usa / lo usa** | `pip install -r requirements.txt`. |
| **Modificar cuando…** | Se agregue o quite una librería, o se actualice una versión. Las versiones están **fijas** (`==`) para que Render instale exactamente las que se probaron; para actualizar, cambia el número, prueba en local y despliega. |

Versiones fijadas (probadas en local con Python 3.15): FastAPI 0.162.2,
Uvicorn 0.54.0, python-multipart 0.0.33, pandas 3.1.1, Plotly 7.1.0.

---

## Carpeta `__pycache__/`

Python la crea automáticamente con versiones compiladas (`.pyc`) de los módulos
para arrancar más rápido. No se edita ni debe subirse a un repositorio. Contiene
un `datos.cpython-315.pyc` de un archivo `datos.py` que ya no existe (restos de
un renombrado); es inofensivo.
