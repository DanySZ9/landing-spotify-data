# Guía para hacer cambios

Recetas paso a paso para las modificaciones más habituales. Regla general:
**si cambias un nombre que viaja en el JSON (clave, columna o filtro), actualiza
también el frontend.**

---

## Antes de empezar

1. Arranca el backend con recarga automática: `uvicorn main:app --reload --port 8000`.
2. Ten a mano un historial real o de prueba (`Streaming_History_Audio_*.json`).
3. Prueba desde `http://localhost:8000/docs` o desde el frontend.
4. Los errores inesperados aparecen completos en la consola donde corre Uvicorn.

### Probar funciones sin levantar el servidor

Como solo `main.py` sabe de HTTP, el resto se puede probar desde Python:

```python
from data import cargar_historial, preparar, aplicar_filtros, Filtros
from analysis import analizar

with open("Streaming_History_Audio_2025.json", "rb") as fh:
    df, ignorados = cargar_historial([("Streaming_History_Audio_2025.json", fh.read())])
df = preparar(df, "America/Bogota")
df = aplicar_filtros(df, Filtros(contenido="musica"))
print(analizar(df)["resumen"])
```

---

## Receta 1 — Agregar un filtro nuevo

Ejemplo: filtrar por nombre de canción.

1. **`data.py` → clase `Filtros`**: agrega el campo con un valor por defecto que
   signifique "sin filtrar":
   ```python
   cancion: str = ""
   ```
2. **`data.py` → `aplicar_filtros`**: agrega la condición:
   ```python
   if f.cancion.strip():
       df = df[df["master_metadata_track_name"].fillna("")
               .str.contains(f.cancion.strip(), case=False, regex=False)]
   ```
3. **Frontend**: agrega el valor inicial en `frontend/src/filtros.js` y el control
   en `frontend/src/components/Filtros.jsx`.
4. Si el filtro necesita una lista de opciones (como `plataformas`), calcúlala en
   `opciones_disponibles`.

## Receta 2 — Agregar un gráfico nuevo

Ejemplo: reproducciones por día de la semana.

1. **`graficos.py`**: crea la función. Devuelve `None` si no hay datos y termina con `_json(...)`:
   ```python
   def por_dia(df):
       if df.empty:
           return None
       c = df["dia"].value_counts().reindex(range(7), fill_value=0)
       fig = go.Figure(go.Bar(x=DIAS, y=c.values.tolist(), marker=dict(color="#FF0080")))
       return _json(fig, yaxis_title="Reproducciones")
   ```
2. **`analysis.py` → `analizar`**: regístralo en `"graficos"`:
   `"por_dia": graficos.por_dia(df),`
3. **Frontend**: muéstralo leyendo `datos.graficos.por_dia`.

## Receta 3 — Agregar una tabla nueva

1. **`tablas.py`**: crea una función que devuelva un DataFrame con columnas de
   nombre legible y como máximo `n` filas.
2. **`analysis.py`**: regístrala en `"tablas"` envuelta en `tablas.a_filas(...)`
   (convierte a JSON y reemplaza vacíos).
3. **Frontend**: crea el componente en `frontend/src/components/tables`.

## Receta 4 — Agregar una cifra al resumen

Añade la clave en `analysis.resumen`. Convierte siempre a tipos nativos de
Python (`int(...)`, `float(...)`, `round(...)`): los tipos de numpy pueden dar
problemas al convertir a JSON.

## Receta 5 — Un código aparece como "Otro motivo" / dispositivo "Otro"

Añade el código al diccionario correspondiente en `etiquetas.py`
(`GRUPO_INICIO`, `GRUPO_FIN`, `FIN_DETALLE`) o un patrón en `dispositivo()`.
Ojo con el orden: las comprobaciones más específicas deben ir primero.

## Receta 6 — Agregar otro endpoint

Toma como modelo `/api/salud` en `main.py`:

```python
@app.get("/api/version")
def version():
    return {"version": "1.0"}
```

Recuerda añadir `"GET"` a `allow_methods` del middleware CORS si lo va a llamar
el navegador. Si el número de endpoints crece, conviene moverlos a routers
(`fastapi.APIRouter`) en una carpeta `routers/`.

---

## Despliegue en Render

El backend no tiene direcciones fijas en el código: todo lo que cambia entre tu
PC y el servidor se configura con **variables de entorno**.

### 1. Crear el servicio
En Render: **New → Web Service**, conecta el repositorio y completa:

| Campo | Valor |
|---|---|
| Language / Runtime | Python 3 |
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path (en *Advanced*) | `/api/salud` |

Por qué ese Start Command:
- `main:app` → archivo `main.py`, variable `app`.
- `--host 0.0.0.0` → acepta conexiones de fuera del servidor. Con el valor por
  defecto (`127.0.0.1`) solo aceptaría conexiones internas y Render no podría alcanzarlo.
- `--port $PORT` → Render elige el puerto y lo pasa en la variable `PORT`.
  **No** pongas un número fijo.
- Sin `--reload`: eso es solo para desarrollo.

### 2. Variables de entorno del backend (pestaña *Environment*)

| Variable | Ejemplo | Para qué |
|---|---|---|
| `ALLOWED_ORIGINS` | `https://tu-frontend.onrender.com` | Dominios del frontend autorizados por CORS. Varios separados por comas. Sin barra final. |
| `PYTHON_VERSION` | `3.13.1` | Versión de Python que Render instala. Usa una versión completa que Render ofrezca y que hayas probado. |

Si `ALLOWED_ORIGINS` no está definida, solo se aceptan los orígenes de
desarrollo (`localhost:5173`) y **el frontend publicado quedará bloqueado**.

### 3. Frontend
`VITE_API_URL` se lee **al compilar** el frontend, y el archivo `.env` no se
sube al repositorio. Defínela en el panel del servicio del frontend:

```
VITE_API_URL=https://tu-backend.onrender.com
```

Sin barra final. Si la cambias, vuelve a desplegar el frontend.

### 4. Comprobar
1. `https://tu-backend.onrender.com/api/salud` debe responder `{"ok":true}`.
2. `https://tu-backend.onrender.com/docs` abre la documentación interactiva.
3. Haz un análisis desde el frontend publicado. Si el navegador muestra un error
   de CORS, revisa que `ALLOWED_ORIGINS` coincida **exactamente** con la
   dirección del frontend (`https://`, sin barra final).

### 5. A tener en cuenta en el plan gratuito
- El servicio "se duerme" tras un rato sin uso; la primera petición después
  puede tardar cerca de un minuto en responder.
- La memoria es limitada. Historiales de muchos años consumen bastante RAM al
  analizarse; si el servicio se reinicia en pleno análisis, es la causa más probable.

### Probar el comando de Render en tu PC
```bash
# PowerShell
$env:PORT = "8000"; uvicorn main:app --host 0.0.0.0 --port $env:PORT
# macOS / Linux / Git Bash
PORT=8000 uvicorn main:app --host 0.0.0.0 --port $PORT
```
