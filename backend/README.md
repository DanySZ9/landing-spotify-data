# Backend — Estadísticas de Spotify

Este backend recibe los archivos de historial que exporta Spotify
(`Streaming_History_Audio_*.json`), los analiza **en memoria** y devuelve
estadísticas, gráficos y rankings para que el frontend (React) los muestre.

> **No guarda nada.** No hay base de datos ni se escriben archivos en disco.
> Cada petición se procesa de principio a fin y los datos se descartan al responder.

---

## ¿Qué es un "backend"? (para quien empieza)

Una aplicación web suele tener dos partes:

| Parte | Dónde se ejecuta | Qué hace en este proyecto |
|---|---|---|
| **Frontend** | En el navegador del usuario | Muestra la página, permite elegir archivos y filtros, dibuja los gráficos. Carpeta `../frontend`. |
| **Backend** | En un servidor (o en tu PC durante el desarrollo) | Recibe los archivos, hace los cálculos pesados con Python y responde con los resultados. **Esta carpeta.** |

Se comunican mediante una **API**: el frontend envía una petición HTTP a una
dirección concreta (`POST http://localhost:8000/api/analizar`) y el backend
responde con datos en formato **JSON**. Todos estos términos están explicados en
[`docs/GLOSARIO.md`](docs/GLOSARIO.md).

---

## Inicio rápido

Requisitos: **Python 3.10 o superior** (el código usa la sintaxis `str | None`).

```bash
cd backend

# 1. Crear y activar un entorno virtual (una "caja" aislada para las librerías)
python -m venv .venv
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# 2. Instalar las dependencias
pip install -r requirements.txt

# 3. Arrancar el servidor en modo desarrollo (se reinicia al guardar cambios)
uvicorn main:app --reload --port 8000
```

- La API queda en `http://localhost:8000/api/analizar`.
- FastAPI genera documentación interactiva automática en
  **`http://localhost:8000/docs`**: desde ahí se puede probar el endpoint subiendo archivos.
- El frontend (`npm run dev` en `../frontend`) se sirve en `http://localhost:5173`
  y ya está autorizado por CORS para llamar al backend.

---

## Estructura

```
backend/
├── main.py           ← Puerta de entrada: app FastAPI, CORS y el endpoint /api/analizar
├── data.py           ← Carga los JSON, limpia, agrega columnas y aplica filtros
├── analysis.py       ← Arma la respuesta: resumen + gráficos + tablas
├── graficos.py       ← Construye los gráficos (Plotly) como JSON
├── tablas.py         ← Construye los rankings (top artistas, canciones…)
├── etiquetas.py      ← Traduce códigos de Spotify a textos en español
├── requirements.txt  ← Lista de librerías de Python necesarias
├── package-lock.json ← Archivo sobrante de npm (no se usa, ver HALLAZGOS)
└── docs/             ← Documentación detallada
```

El flujo de una petición, en una línea:

```
main.py ──► data.py (cargar → preparar → opciones → filtrar) ──► analysis.py ──► graficos.py + tablas.py
                                         └── etiquetas.py (traducciones) ──┘
```

---

## Documentación

| Documento | Para qué sirve |
|---|---|
| [`docs/GLOSARIO.md`](docs/GLOSARIO.md) | Conceptos explicados desde cero: API, endpoint, JSON, CORS, middleware, DataFrame, Pydantic, JWT, variables de entorno… |
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) | Cómo está organizado el backend y qué ocurre, paso a paso, en cada petición. |
| [`docs/ARCHIVOS.md`](docs/ARCHIVOS.md) | Ficha de cada archivo: propósito, responsabilidad, dependencias, entradas, salidas y cuándo modificarlo. |
| [`docs/API.md`](docs/API.md) | Contrato del endpoint: qué enviar, qué se recibe y qué errores pueden ocurrir. |
| [`docs/GUIA_CAMBIOS.md`](docs/GUIA_CAMBIOS.md) | Recetas: agregar un filtro, un gráfico o una tabla; desplegar en un servidor. |
| [`docs/HALLAZGOS.md`](docs/HALLAZGOS.md) | Observaciones de seguridad, despliegue y mantenimiento detectadas en la revisión (pendientes de decidir). |

Además, **cada archivo `.py` empieza con un comentario** que resume su
propósito y cada función tiene un *docstring* (texto entre `"""` bajo su
definición) que explica qué recibe y qué devuelve.
