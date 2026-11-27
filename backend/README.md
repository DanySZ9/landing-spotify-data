# Spotlytics: backend

API de [Spotlytics](../README.md). Recibe los archivos de historial que exporta
Spotify (`Streaming_History_Audio_*.json`), los analiza en memoria y devuelve el
resumen, los gráficos y los rankings que muestra el frontend.

No hay base de datos: cada petición se procesa y sus datos se descartan al responder.

## Tecnologías

- FastAPI + Uvicorn
- pandas para el análisis
- Plotly para generar los gráficos (se envían como JSON)

## Puesta en marcha

Requiere Python 3.10 o superior.

```bash
python -m venv .venv
# Windows: .venv\Scripts\Activate.ps1   ·   macOS / Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- La API queda en `http://localhost:8000`.
- La documentación interactiva de FastAPI está en `http://localhost:8000/docs`.
- El frontend de desarrollo (`http://localhost:5173`) ya tiene permiso para llamar a la API.
  En producción, los orígenes permitidos se configuran con variables de entorno.

## Estructura

```
backend/
├── main.py        App FastAPI y endpoints
├── data.py        Carga, limpieza y filtros del historial
├── analysis.py    Arma la respuesta completa
├── graficos.py    Gráficos
├── tablas.py      Rankings
├── etiquetas.py   Textos en español para los códigos de Spotify
└── docs/          Documentación detallada
```

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) | Cómo está organizado y qué ocurre en cada petición |
| [`docs/API.md`](docs/API.md) | Qué se envía y qué se recibe |
| [`docs/ARCHIVOS.md`](docs/ARCHIVOS.md) | Ficha de cada archivo |
| [`docs/GUIA_CAMBIOS.md`](docs/GUIA_CAMBIOS.md) | Cómo agregar filtros, gráficos o tablas, y cómo desplegar |
| [`docs/GLOSARIO.md`](docs/GLOSARIO.md) | Conceptos básicos explicados desde cero |

## Despliegue

Desplegado en Render. Los pasos están en [`docs/GUIA_CAMBIOS.md`](docs/GUIA_CAMBIOS.md).
