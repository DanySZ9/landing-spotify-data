# Contrato de la API

El backend expone **dos endpoints**: `POST /api/analizar` (el análisis) y
`GET /api/salud` (comprobación de que está vivo). Documentación interactiva
generada automáticamente por FastAPI: `http://localhost:8000/docs`.

---

## `GET /api/salud`

Comprobación de salud (*health check*). La usa Render para saber si el servidor
responde. No recibe nada y siempre devuelve `200 OK` con `{"ok": true}`.

---

## `POST /api/analizar`

Analiza uno o varios archivos de historial de Spotify y devuelve estadísticas.

### Petición

- **Formato:** `multipart/form-data` (el mismo que usa un formulario con archivos).
- **Campos:**

| Campo | Tipo | Obligatorio | Descripción |
|---|---|:-:|---|
| `archivos` | archivo (se puede repetir) | Sí | Archivos `Streaming_History_Audio_*.json`. Los que no sean válidos se ignoran y se informan. |
| `filtros` | texto JSON | No (por defecto `{}`) | Objeto con los filtros descritos abajo. |

#### Objeto `filtros`

Todos los campos son opcionales; el valor por defecto significa "no filtrar".
Se define en `data.py` (clase `Filtros`) y debe coincidir con `frontend/src/filtros.js`.

| Campo | Tipo / valores | Por defecto | Efecto |
|---|---|---|---|
| `inicio` | `"YYYY-MM-DD"` o `null` | `null` | Desde esa fecha (incluida), en hora local. |
| `fin` | `"YYYY-MM-DD"` o `null` | `null` | Hasta esa fecha (incluida, el día completo). |
| `zona` | zona IANA, p. ej. `"America/Bogota"` | `"UTC"` | Zona horaria para fechas, horas y días. Si no es válida se usa UTC. |
| `contenido` | `"todo"` \| `"musica"` \| `"podcasts"` | `"todo"` | Tipo de contenido. |
| `plataformas` | lista de textos | `[]` (todas) | Dispositivos, con los nombres de `opciones.plataformas` (p. ej. `["Android","Windows"]`). |
| `artista` | texto | `""` | Artistas cuyo nombre **contiene** ese texto (sin distinguir mayúsculas). |
| `saltadas` | `"todas"` \| `"si"` \| `"no"` | `"todas"` | Solo saltadas / solo no saltadas. |
| `aleatorio` | `"todas"` \| `"si"` \| `"no"` | `"todas"` | Modo aleatorio. |
| `offline` | `"todas"` \| `"si"` \| `"no"` | `"todas"` | Sin conexión. |
| `incognito` | `"todas"` \| `"si"` \| `"no"` | `"todas"` | Modo incógnito. |
| `min_segundos` | entero de 0 a 3600 | `0` | Descarta reproducciones más cortas. |

#### Ejemplo con `curl`

```bash
curl -X POST http://localhost:8000/api/analizar \
  -F "archivos=@Streaming_History_Audio_2024.json" \
  -F "archivos=@Streaming_History_Audio_2025.json" \
  -F 'filtros={"zona":"America/Bogota","contenido":"musica","min_segundos":30}'
```

### Respuesta exitosa — `200 OK`

```jsonc
{
  "opciones": {                       // para llenar los filtros (calculado ANTES de filtrar)
    "plataformas": ["Android", "Windows"],
    "artistas": ["Artista A", "Artista B"],          // hasta 300, por tiempo escuchado
    "rango": {"min": "2023-01-04", "max": "2025-03-01"},
    "hay_podcasts": false
  },
  "ignorados": ["basura.txt"],         // archivos que no se pudieron usar
  "resumen": {
    "reproducciones": 40, "minutos": 94.3,
    "canciones_unicas": 5, "artistas_unicos": 3, "dias_activos": 1,
    "pct_saltadas": 25.0, "sesiones": 4, "minutos_por_sesion": 23.6
  },
  "graficos": {                        // cada uno: {"data": [...], "layout": {...}} de Plotly, o null
    "por_mes": {...}, "por_hora": {...}, "mapa_calor": {...}, "dispositivos": {...},
    "caracteristicas": {...}, "duracion": {...}, "como_empiezan": {...}, "como_terminan": {...}
  },
  "tablas": {                          // listas de filas; [] si no hay datos
    "top_artistas":  [{"Artista","Favorita","FavoritaURL","Reproducciones","Minutos","Canciones","PctSaltadas"}],
    "top_canciones": [{"Artista","Cancion","Reproducciones","Minutos","Saltadas","PctSaltadas","URL"}],
    "top_albumes":   [{"Album","Artista","Canciones","Reproducciones","Minutos"}],
    "top_podcasts":  [{"Programa","Episodios","Reproducciones","Minutos"}],
    "mas_saltadas":  [{"Artista","Cancion","Reproducciones","Saltadas","PctSaltadas","URL"}],
    "top_dias":      [{"Fecha","Reproducciones","Minutos","Artista"}],
    "historial":     [{"Fecha","Cancion","Artista","Dispositivo","Segundos","Fin","URL"}]
  }
}
```

Notas sobre las tablas:
- Rankings de hasta 100 filas, salvo `mas_saltadas` (50, solo canciones con ≥ 5
  reproducciones) y `top_dias` (15).
- `URL` contiene el identificador `spotify:track:...`.
- `historial` son las 100 reproducciones más recientes; para podcasts,
  `Cancion` es el episodio y `Artista` el programa.

### Errores

Todas las respuestas de error tienen la forma `{"detail": "mensaje"}`.

| Código | Mensaje | Causa |
|---|---|---|
| `400` | `Los filtros enviados no son válidos` | `filtros` no es JSON o algún valor no está permitido (p. ej. `"saltadas":"quizas"`). |
| `400` | `No se encontró ningún historial de audio válido…` | Ningún archivo era un historial de audio (todos ignorados). |
| `400` | `No hay reproducciones con esos filtros` | Los filtros dejaron la tabla vacía. |
| `400` | Mensaje técnico de pandas (en inglés) | `inicio`/`fin` no es una fecha interpretable, p. ej. `"ayer"`. Ver `HALLAZGOS.md`. |
| `422` | Detalle de validación de FastAPI | No se envió el campo `archivos`. |
| `500` | `Error interno al analizar (TipoDeError)` | Fallo inesperado; el detalle completo queda en la consola del servidor. |

### CORS

Los orígenes permitidos se leen de la variable de entorno `ALLOWED_ORIGINS`
(separados por comas). Si no está definida, solo se aceptan
`http://localhost:5173` y `http://127.0.0.1:5173`. Solo se acepta el método `POST`
desde el navegador.
