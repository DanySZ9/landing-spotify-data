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

Para algo pequeño (p. ej. comprobar que el servidor está vivo), en `main.py`:

```python
@app.get("/api/salud")
def salud():
    return {"ok": True}
```

Recuerda añadir `"GET"` a `allow_methods` del middleware CORS si lo va a llamar
el navegador. Si el número de endpoints crece, conviene moverlos a routers
(`fastapi.APIRouter`) en una carpeta `routers/`.

---

## Despliegue en un servidor

> Lista de comprobación; las mejoras recomendadas están en `HALLAZGOS.md`.

1. **Python 3.10+** en el servidor y un entorno virtual con
   `pip install -r requirements.txt`.
2. **CORS**: añade el dominio real del frontend a `allow_origins` en `main.py`
   (p. ej. `https://estadisticas.midominio.com`). Idealmente, léelo de una
   variable de entorno en lugar de escribirlo en el código.
3. **Frontend**: compílalo con `VITE_API_URL` apuntando al backend público
   (p. ej. `VITE_API_URL=https://api.midominio.com npm run build`).
4. **Arrancar sin `--reload`** y escuchando en todas las interfaces:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
   ```
   Cada *worker* es un proceso independiente; como el análisis consume CPU y
   RAM, ajusta el número según la memoria del servidor.
5. **Proxy inverso con HTTPS** (Nginx, Caddy o el de tu plataforma) delante de
   Uvicorn. Ahí también puedes limitar el tamaño de subida (en Nginx:
   `client_max_body_size 200m;`).
6. **Mantenerlo vivo**: un servicio de systemd, Docker, o la plataforma de
   hosting (Render, Railway, Fly.io…) para reiniciarlo si se cae.
7. **Comprobación**: abrir `https://tu-backend/docs` y hacer un análisis de prueba
   desde el frontend desplegado.
