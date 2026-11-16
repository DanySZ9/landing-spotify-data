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

## Despliegue: backend en Render + frontend en Vercel

Direcciones actuales del proyecto:

| Parte | Plataforma | URL |
|---|---|---|
| Backend | Render | `https://spotlytics.onrender.com` |
| Frontend | Vercel | `https://spotlytics-five.vercel.app` |

Ninguna parte tiene direcciones fijas en el código: todo lo que cambia entre tu
PC y los servidores se configura con **variables de entorno**, y cada parte
necesita conocer la dirección de la otra:

```
 Frontend (Vercel)  ── VITE_API_URL ──────►  Backend (Render)
   "¿a quién llamo?"                           "¿a quién le respondo?"
 Frontend (Vercel)  ◄── ALLOWED_ORIGINS ────  Backend (Render)
```

### 1. Backend: crear el servicio en Render
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

### 2. Backend: variables de entorno en Render (pestaña *Environment*)

| Variable | Valor | Para qué |
|---|---|---|
| `ALLOWED_ORIGINS` | `https://spotlytics-five.vercel.app` | Dominios del frontend autorizados por CORS. Varios separados por comas. Sin barra final. |
| `PYTHON_VERSION` | p. ej. `3.13.1` | Versión de Python que Render instala. Usa una versión completa que Render ofrezca y que hayas probado. |

Si `ALLOWED_ORIGINS` no está definida, solo se aceptan los orígenes de
desarrollo (`localhost:5173`) y **el frontend publicado quedará bloqueado**.
Al guardar una variable Render reinicia el servicio; si no lo hace, usa
**Manual Deploy → Deploy latest commit**.

### 3. Frontend: proyecto en Vercel
Al importar el repositorio en Vercel (**Add New → Project**):

| Campo | Valor |
|---|---|
| Framework Preset | Vite (Vercel lo detecta solo) |
| Root Directory | `frontend` |
| Build Command | `npm run build` (por defecto) |
| Output Directory | `dist` (por defecto) |

### 4. Frontend: variable de entorno en Vercel
En **Settings → Environment Variables**:

```
VITE_API_URL=https://spotlytics.onrender.com
```

- **Sin barra final**: el código arma la dirección como `${API}/api/analizar`;
  con barra quedaría `...onrender.com//api/analizar`.
- Márcala al menos para **Production** (y **Preview** si quieres que las
  previsualizaciones también llamen al backend).
- El archivo `.env` está en el `.gitignore`, así que Vercel **no** lo ve: la
  variable debe estar en el panel.
- Vite escribe la variable dentro del código **al compilar**. Después de crearla
  o cambiarla hay que volver a compilar: **Deployments → ⋯ → Redeploy**.
- Solo las variables que empiezan por `VITE_` llegan al navegador. Por lo mismo,
  **nunca** pongas secretos en una variable `VITE_`: cualquiera puede verla en el
  código de la página.

### 5. Comprobar
1. Abre `https://spotlytics.onrender.com/api/salud`: debe responder `{"ok":true}`.
2. `https://spotlytics.onrender.com/docs` abre la documentación interactiva.
3. Abre `https://spotlytics-five.vercel.app`, pulsa **F12 → Network (Red)** y
   sube un historial. Según lo que veas en la petición `analizar`:

| Síntoma | Causa | Solución |
|---|---|---|
| Apunta a `spotlytics.onrender.com` y responde 200 | Todo correcto | — |
| Apunta a `localhost:8000` | `VITE_API_URL` no se aplicó | Revisa el nombre exacto de la variable en Vercel y haz *Redeploy*. |
| Error de **CORS** en la consola | `ALLOWED_ORIGINS` no coincide con el dominio de Vercel | Debe ser exactamente `https://spotlytics-five.vercel.app`. |
| Tarda casi un minuto y luego funciona | El servicio de Render estaba "dormido" | Normal en el plan gratuito (ver abajo). |
| Error 502/503 o el servicio se reinicia a mitad del análisis | Falta de memoria con historiales muy grandes | Prueba con menos archivos o un plan con más RAM. |

### 6. Previsualizaciones (*preview deployments*) de Vercel
Vercel publica cada rama o *pull request* en una dirección distinta, por
ejemplo `spotlytics-git-mi-rama-usuario.vercel.app`. Esas direcciones **no**
están en `ALLOWED_ORIGINS`, así que el backend las rechaza. Es lo correcto para
producción. Si quieres probar una previsualización contra el backend, agrega
su dirección separada por comas:

```
ALLOWED_ORIGINS=https://spotlytics-five.vercel.app,https://spotlytics-git-mi-rama-usuario.vercel.app
```

### 7. A tener en cuenta en el plan gratuito de Render
- El servicio "se duerme" tras un rato sin uso; la primera petición después
  puede tardar cerca de un minuto en responder.
- La memoria es limitada. Historiales de muchos años consumen bastante RAM al
  analizarse; si el servicio se reinicia en pleno análisis, es la causa más probable.

### 8. Si cambia alguna dirección
| Si cambia… | Actualiza… | Y después… |
|---|---|---|
| El dominio del frontend (p. ej. dominio propio) | `ALLOWED_ORIGINS` en Render | Render se reinicia solo. |
| La URL del backend | `VITE_API_URL` en Vercel | *Redeploy* en Vercel. |

### Probar el comando de Render en tu PC
```bash
# PowerShell
$env:PORT = "8000"; uvicorn main:app --host 0.0.0.0 --port $env:PORT
# macOS / Linux / Git Bash
PORT=8000 uvicorn main:app --host 0.0.0.0 --port $PORT
```
