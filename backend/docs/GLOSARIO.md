# Glosario de conceptos

Explicaciones sin asumir conocimientos previos. Cada término indica **dónde
aparece en este proyecto** para que puedas verlo en el código.

---

## Conceptos web

### Servidor
Un programa que se queda "escuchando" en un puerto de la computadora (aquí el
`8000`) y responde cuando alguien le hace una petición. En este proyecto el
servidor es **Uvicorn**, que ejecuta la aplicación definida en `main.py`.

### HTTP y petición / respuesta
HTTP es el idioma con el que se comunican navegadores y servidores. Siempre hay
una **petición** (el cliente pide algo) y una **respuesta** (el servidor
contesta). Cada respuesta lleva un **código de estado**:

| Código | Significado | Cuándo lo devuelve este backend |
|---|---|---|
| `200` | Todo bien | El análisis se hizo correctamente. |
| `400` | Error del cliente (datos incorrectos) | Filtros inválidos, archivos que no son historial, filtros sin resultados. |
| `422` | Faltan datos obligatorios | No se envió el campo `archivos` (lo genera FastAPI automáticamente). |
| `500` | Error interno del servidor | Un fallo inesperado en el código. |

### Métodos HTTP (GET, POST…)
Indican la intención de la petición. `GET` = "dame información", `POST` =
"te envío datos para que hagas algo con ellos". Este backend solo usa **POST**,
porque el cliente envía archivos.

### API
*Application Programming Interface*. Es el conjunto de "puertas" por las que un
programa puede pedirle cosas a otro. Aquí, el frontend usa la API del backend
para pedirle que analice un historial.

### API REST
Un estilo de diseño de APIs en el que cada recurso tiene una dirección (URL) y
se usan los métodos HTTP para operar sobre él. Este backend es una API HTTP
sencilla de un solo endpoint; no necesita más.

### Endpoint (o ruta)
Una puerta concreta de la API: **método + dirección**. Este proyecto tiene uno:
`POST /api/analizar`, definido en `main.py` con `@app.post("/api/analizar")`.

### Router
En proyectos grandes, los endpoints se agrupan en "routers" (archivos separados
por tema: usuarios, pagos…). Este proyecto **no usa routers** porque solo tiene
un endpoint; si creciera, sería el primer paso de reorganización (ver
`GUIA_CAMBIOS.md`).

### JSON
Formato de texto para intercambiar datos. Se parece a los diccionarios y listas
de Python:
```json
{"artista": "Shakira", "minutos": 120.5, "favorita": true, "canciones": ["A", "B"]}
```
Los archivos que exporta Spotify son JSON, y las respuestas del backend también.

### multipart/form-data
La forma estándar de enviar **archivos** en una petición HTTP (la misma que usa
un formulario web con un botón "Subir archivo"). El frontend envía así los
archivos y el campo de texto `filtros`.

### CORS
*Cross-Origin Resource Sharing*. Por seguridad, un navegador **bloquea** que una
página cargada desde un "origen" (protocolo + dominio + puerto, p. ej.
`http://localhost:5173`) lea respuestas de otro origen (`http://localhost:8000`),
a menos que el servidor diga explícitamente "acepto peticiones de ese origen".
Esa autorización se configura en `main.py` con `CORSMiddleware`.
Antes de la petición real, el navegador envía una petición de "permiso"
llamada **preflight** (método `OPTIONS`); el middleware la responde solo.

> CORS **no** protege al servidor de herramientas como `curl` o scripts: solo
> controla qué páginas web pueden usar la API desde un navegador.

### Middleware
Código que se ejecuta **antes y después de cada petición**, como un control por
el que pasan todas. Sirve para tareas comunes: CORS, registros, compresión,
autenticación… Aquí hay uno solo: `CORSMiddleware`.

---

## Conceptos de Python y del proyecto

### FastAPI
Framework (conjunto de herramientas) de Python para crear APIs. Se encarga de
recibir las peticiones, leer los archivos y formularios, validar datos,
convertir la respuesta a JSON y generar documentación automática en `/docs`.

### Uvicorn
El servidor que ejecuta la aplicación FastAPI. El comando
`uvicorn main:app` significa "abre el archivo `main.py` y usa la variable `app`".

### async / await
`async def` declara una función que puede "pausarse" mientras espera algo lento
(como leer un archivo subido) sin bloquear al servidor. `await` marca el punto
donde se espera. En `main.py`: `await a.read()`.

### Pydantic, modelo y esquema
Pydantic es una librería que **valida datos**: se define una clase con los
campos y tipos esperados y Pydantic rechaza todo lo que no encaje. A esa clase
se le llama *modelo* o *esquema*. En este proyecto: `class Filtros(BaseModel)`
en `data.py`. Si llega `{"saltadas": "quizas"}`, Pydantic lo rechaza porque solo
acepta `"todas"`, `"si"` o `"no"`.

### ORM y base de datos
Un ORM (*Object-Relational Mapper*, p. ej. SQLAlchemy) traduce clases de Python
a tablas de una base de datos. **Este proyecto no tiene base de datos ni ORM**:
todo ocurre en memoria durante la petición. Por eso aquí "modelo" significa solo
"esquema de validación".

### pandas y DataFrame
pandas es la librería de análisis de datos de Python. Un **DataFrame** es una
tabla en memoria, como una hoja de Excel: filas (cada reproducción) y columnas
(fecha, canción, artista…). Casi todo el backend trabaja con DataFrames
(variable `df`).

Operaciones que verás a menudo:

| Código | Qué hace |
|---|---|
| `df[df["tipo"] == "musica"]` | Filtra: se queda con las filas que cumplen la condición. |
| `df.groupby("Artista")` | Agrupa filas iguales para calcular totales por grupo. |
| `.agg(ms=("ms_played", "sum"))` | Calcula una columna nueva `ms` = suma de `ms_played` del grupo. |
| `.sort_values("ms", ascending=False)` | Ordena de mayor a menor. |
| `.head(100)` | Se queda con las primeras 100 filas. |
| `.value_counts()` | Cuenta cuántas veces aparece cada valor. |

### Plotly
Librería de gráficos. El backend construye cada gráfico en Python y lo convierte
en JSON (`{"data": [...], "layout": {...}}`); el frontend lo dibuja con la
versión JavaScript de Plotly sin tener que hacer cálculos.

### Entorno virtual (venv)
Una carpeta aislada con su propio Python y sus librerías, para que las versiones
de este proyecto no choquen con las de otros. Se crea con `python -m venv .venv`.

### requirements.txt
Lista de librerías que hay que instalar (`pip install -r requirements.txt`).

### Logging
Sistema de Python para escribir mensajes de diagnóstico en la consola del
servidor. `main.py` lo usa para registrar errores inesperados con todos sus
detalles (sin mostrarlos al usuario).

---

## Conceptos que este proyecto **no** usa (pero conviene conocer)

### Autenticación y autorización
- **Autenticación**: comprobar *quién* eres (usuario y contraseña, Google…).
- **Autorización**: decidir *qué* puedes hacer una vez identificado.

Este backend **no tiene usuarios ni login**: cualquiera que alcance el servidor
puede usar el endpoint. Es razonable porque no guarda datos de nadie, pero
implica que, en un servidor público, conviene limitar el abuso (ver `HALLAZGOS.md`).

### JWT
*JSON Web Token*. Un "pase" firmado digitalmente que el servidor entrega tras
iniciar sesión; el cliente lo envía en cada petición para demostrar quién es,
sin que el servidor tenga que recordar sesiones. Sería la opción habitual si
algún día se agregan cuentas de usuario.

### Variables de entorno
Valores de configuración que se leen del sistema operativo en lugar de
escribirse en el código (p. ej. `ALLOWED_ORIGINS`, claves secretas, URLs). Así
el mismo código funciona en desarrollo y en producción cambiando solo la
configuración, y los secretos no quedan en el repositorio.
**El backend actualmente no usa ninguna**: los orígenes de CORS están escritos
en `main.py`. El frontend sí usa una: `VITE_API_URL` (en `frontend/src/api.js`),
que indica la dirección del backend.

---

## Términos del export de Spotify

| Campo | Significado |
|---|---|
| `ts` | Fecha y hora (UTC) en que **terminó** la reproducción. |
| `ms_played` | Milisegundos escuchados (60 000 ms = 1 minuto). |
| `platform` | Texto del dispositivo, p. ej. `Android OS 11 API 30 (samsung, SM-G991B)`. |
| `master_metadata_track_name` / `..._album_artist_name` / `..._album_album_name` | Canción, artista y álbum. Vacíos si es un podcast. |
| `spotify_track_uri` | Identificador único de la canción (`spotify:track:...`). |
| `episode_name` / `episode_show_name` | Episodio y programa, si es un podcast. |
| `reason_start` / `reason_end` | Código de cómo empezó/terminó (`clickrow`, `trackdone`, `fwbtn`…). Traducidos en `etiquetas.py`. |
| `shuffle`, `skipped`, `offline`, `incognito_mode` | Verdadero/falso: aleatorio, saltada, sin conexión, modo incógnito. |
| UTC / zona IANA | UTC es la hora universal. Una zona IANA es un nombre estándar como `America/Bogota`, usado para convertir a la hora local del usuario. |
