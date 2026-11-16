"""
main.py — Punto de entrada del backend (la "puerta" del servidor).

PROPÓSITO
    Crear la aplicación web con FastAPI y exponer sus rutas: ``POST /api/analizar``
    (el análisis) y ``GET /api/salud`` (comprobación de que el servidor está vivo).
    Es el único archivo que "habla HTTP";
    el resto de módulos solo trabajan con datos de Python/pandas.

RESPONSABILIDAD
    1. Configurar la aplicación (FastAPI) y la política CORS.
    2. Recibir los archivos JSON del historial de Spotify y los filtros.
    3. Validar los filtros y orquestar el flujo:
       cargar -> preparar -> calcular opciones -> filtrar -> analizar.
    4. Traducir cualquier error en una respuesta HTTP comprensible (400 / 500).

ARCHIVOS QUE UTILIZA
    - data.py      -> Filtros, cargar_historial, preparar, opciones_disponibles, aplicar_filtros
    - analysis.py  -> analizar (que a su vez usa graficos.py y tablas.py)

INFORMACIÓN QUE RECIBE (petición HTTP tipo multipart/form-data)
    - ``archivos``: uno o varios archivos ``Streaming_History_Audio_*.json``.
    - ``filtros``:  texto JSON con los filtros (ver clase ``Filtros`` en data.py).
                    Si no se envía, vale ``"{}"`` (sin filtros).

INFORMACIÓN QUE DEVUELVE (JSON)
    {
      "opciones":  {...},   # valores para llenar los controles de filtro
      "ignorados": [...],   # nombres de archivos que no se pudieron usar
      "resumen":   {...},   # cifras generales (minutos, sesiones, etc.)
      "graficos":  {...},   # figuras de Plotly listas para dibujar
      "tablas":    {...}    # rankings e historial reciente
    }
    En caso de error: ``{"detail": "mensaje"}`` con código 400 o 500.

CUÁNDO MODIFICARLO
    - Para agregar una nueva ruta (endpoint).
    - Para cambiar cómo se configuran los orígenes CORS. Para cambiar QUÉ
      orígenes se permiten no hace falta tocar el código: basta con la variable
      de entorno ``ALLOWED_ORIGINS``.
    - Para cambiar cómo se reportan los errores o agregar límites de tamaño de subida.
    - NO es el lugar para agregar cálculos o gráficos nuevos (ver analysis.py).

CONCEPTOS CLAVE (explicados en detalle en docs/GLOSARIO.md)
    - API: conjunto de "puertas" por las que otro programa (aquí, el frontend
      en React) le pide cosas al servidor.
    - Endpoint / ruta: una de esas puertas, identificada por un método HTTP
      (GET, POST...) y una dirección (``/api/analizar``).
    - Middleware: código que se ejecuta antes y después de cada petición,
      como un filtro por el que pasan todas.
    - CORS: regla de seguridad de los navegadores que impide que una página de
      un origen (p. ej. localhost:5173) llame a un servidor de otro origen
      (localhost:8000) salvo que el servidor lo autorice explícitamente.
"""
import logging
import os

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from analysis import analizar
from data import Filtros, aplicar_filtros, cargar_historial, opciones_disponibles, preparar

# "Logger": canal para escribir mensajes de diagnóstico en la consola del servidor.
# Solo se usa para registrar errores inesperados (ver el último ``except``).
log = logging.getLogger("spotify-stats")

# La aplicación FastAPI. Uvicorn (el servidor) busca esta variable al ejecutar
# ``uvicorn main:app``  ->  "archivo main.py, variable app".
app = FastAPI()

# Orígenes permitidos por CORS, leídos de la VARIABLE DE ENTORNO ``ALLOWED_ORIGINS``
# (valores separados por comas, sin barra final). Así el mismo código sirve en
# desarrollo y en producción cambiando solo la configuración del servidor:
#   - En tu PC no hace falta definirla: se usan los orígenes de Vite (puerto 5173).
#   - En Render: ALLOWED_ORIGINS=https://spotlytics-five.vercel.app  (frontend en Vercel)
ORIGENES_DESARROLLO = "http://localhost:5173,http://127.0.0.1:5173"
ORIGENES = [
    o.strip().rstrip("/")   # tolera espacios y una barra final escrita por error
    for o in os.getenv("ALLOWED_ORIGINS", ORIGENES_DESARROLLO).split(",")
    if o.strip()            # ignora entradas vacías (p. ej. una coma al final)
]

# Middleware CORS: autoriza al frontend a llamar a este backend desde el navegador.
#   - allow_origins: direcciones desde las que se aceptan peticiones (ver arriba).
#   - allow_methods: solo POST, que es el único método que el navegador necesita.
#                    (/api/salud usa GET, pero la consulta Render, no el navegador).
#   - allow_headers: se permite cualquier cabecera HTTP en la petición.
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGENES,
    allow_methods=["POST"],
    allow_headers=["*"],
)


@app.get("/api/salud")
def salud():
    """Comprobación de salud ("health check").

    Render (u otro hosting) llama periódicamente a esta ruta para saber si el
    servidor está vivo; si no responde, lo reinicia. No hace ningún cálculo.
    Devuelve: ``{"ok": True}``.
    """
    return {"ok": True}


# El decorador ``@app.post(...)`` registra la función de abajo como el
# endpoint que responde a peticiones POST en la ruta /api/analizar.
@app.post("/api/analizar")
async def analizar_historial(
    # ``File(...)``: el campo "archivos" es obligatorio y llega como archivo subido.
    archivos: list[UploadFile] = File(...),
    # ``Form("{}")``: el campo "filtros" es texto de formulario; por defecto "{}".
    filtros: str = Form("{}"),
):
    """Analiza el historial de Spotify subido y devuelve estadísticas.

    Flujo:
        1. Valida el JSON de filtros con Pydantic (clase ``Filtros``).
        2. Lee en memoria el contenido de cada archivo (no se guarda en disco).
        3. ``cargar_historial`` une los JSON válidos en una sola tabla (DataFrame).
        4. ``preparar`` agrega hora local, día, dispositivo y tipo de contenido.
        5. ``opciones_disponibles`` calcula los valores de los filtros ANTES de
           filtrar, para que el usuario siempre vea todas las opciones posibles.
        6. ``aplicar_filtros`` recorta la tabla según lo elegido.
        7. ``analizar`` construye resumen, gráficos y tablas.

    Errores:
        - 400 si los filtros no son válidos, si ningún archivo es un historial
          válido o si tras filtrar no queda ninguna reproducción.
        - 500 ante cualquier fallo inesperado (se registra en el log).
    """
    # Paso 1: convertir el texto JSON en un objeto Filtros validado.
    # Si algún campo tiene un tipo o valor incorrecto, Pydantic lanza ValidationError.
    try:
        f = Filtros.model_validate_json(filtros)
    except ValidationError:
        raise HTTPException(status_code=400, detail="Los filtros enviados no son válidos")

    try:
        # Paso 2: lista de tuplas (nombre_del_archivo, bytes_del_contenido).
        contenidos = [(a.filename or "", await a.read()) for a in archivos]
        # Pasos 3 a 6: ver data.py.
        df, ignorados = cargar_historial(contenidos)
        df = preparar(df, f.zona)
        opciones = opciones_disponibles(df)
        df = aplicar_filtros(df, f)
        if df.empty:
            raise HTTPException(status_code=400, detail="No hay reproducciones con esos filtros")
        # Paso 7: ``**analizar(df)`` "despliega" las claves resumen/graficos/tablas
        # dentro del mismo diccionario de respuesta.
        return {"opciones": opciones, "ignorados": ignorados, **analizar(df)}
    except HTTPException:
        # Errores ya preparados para el usuario: se dejan pasar tal cual.
        raise
    except ValueError as e:
        # Errores de datos (p. ej. "No se encontró ningún historial..." o una
        # fecha mal escrita en los filtros): se muestran al usuario con código 400.
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Se responde con HTTPException para que el navegador reciba cabeceras CORS
        # y el frontend pueda mostrar el mensaje en lugar de un error de CORS.
        log.exception("Error al analizar el historial")
        raise HTTPException(status_code=500, detail=f"Error interno al analizar ({type(e).__name__})")
