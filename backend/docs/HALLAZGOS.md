# Hallazgos de la revisión

Observaciones detectadas al documentar el backend (noviembre de 2026).
Están ordenadas por prioridad. Las resueltas se marcan con ✅ y la fecha.

---

## Seguridad y estabilidad

### 1. ~~Sin límite de tamaño ni de número de archivos~~ — ✅ RESUELTO (27/11/2026)
`main.py` limita la subida a `MAX_ARCHIVOS` (30), `MAX_MB_ARCHIVO` (20 MB) y
`MAX_MB_TOTAL` (100 MB) y responde 413 si se superan. El frontend comprueba los
mismos límites antes de enviar. Falta confirmar con un historial completo que
100 MB caben en la memoria del plan de Render.

### 2. ~~Sin control de abuso~~ — ✅ RESUELTO (27/11/2026)
`main.py` limita cada IP a `LIMITE_PETICIONES` (20) análisis por minuto y
responde 429 con `Retry-After`. Está hecho a mano, en memoria del proceso (sin
dependencias); sirve mientras haya una sola instancia. La IP se lee de
`CF-Connecting-IP` o `X-Forwarded-For`: conviene comprobar en Render que llega
la IP real del visitante.

### 3. Fecha de filtro inválida devuelve un mensaje técnico en inglés — prioridad baja
`{"inicio": "ayer"}` responde 400 con `Unknown datetime string format, unable to parse: ayer`
(mensaje interno de pandas). No es grave, pero expone detalles internos y no es
comprensible para el usuario.
**Propuesta:** validar `inicio`/`fin` en el esquema `Filtros` (tipo `datetime.date`)
para que Pydantic las rechace con el mensaje genérico de filtros inválidos.

### 4. El error 500 incluye el nombre del tipo de excepción — prioridad baja
`Error interno al analizar (KeyError)`. Ayuda a depurar, pero revela detalles
internos. Aceptable en desarrollo; en producción podría ocultarse.

### 5. Zona horaria inválida se ignora sin avisar — prioridad baja
`preparar` usa UTC si la zona no existe. El usuario vería horas desplazadas sin
saber por qué. Se podría validar en `Filtros` o informar en la respuesta.

---

## Despliegue y configuración

### 6. ~~Orígenes CORS escritos en el código~~ — ✅ RESUELTO (16/11/2026)
`main.py` lee ahora la variable de entorno `ALLOWED_ORIGINS` y, si no existe,
usa los orígenes de desarrollo.

### 7. ~~Dependencias sin versión fija~~ — ✅ RESUELTO (16/11/2026)
`requirements.txt` fija las versiones exactas con las que se probó el backend.

### 8. ~~No hay endpoint de salud~~ — ✅ RESUELTO (16/11/2026)
Se agregó `GET /api/salud`, que devuelve `{"ok": true}`.

### 9. Logging sin configurar — prioridad baja
`main.py` crea un logger pero no configura formato ni nivel. Los errores sí se
muestran (Python usa un manejador por defecto), pero sin fecha ni formato
uniforme con los registros de Uvicorn.

---

## Mantenimiento

### 10. Sin pruebas automáticas — prioridad media
No hay tests. Los cálculos (sesiones, rankings, filtros) son fáciles de probar
porque no dependen de HTTP. **Propuesta:** `pytest` con un historial pequeño de
ejemplo y `fastapi.testclient.TestClient` para el endpoint.

### 11. Proyecto sin control de versiones — prioridad media (`.gitignore` ✅ resuelto)
Ya existe un `.gitignore` en la raíz que excluye cachés, entornos virtuales,
`node_modules/`, archivos `.env` e historiales de Spotify. Falta inicializar el
repositorio git.

### 12. Archivos sobrantes — prioridad baja (parcialmente resuelto)
- ~~`backend/package-lock.json`~~: eliminado.
- `backend/__pycache__/datos.cpython-315.pyc`: caché de un `datos.py` que ya no
  existe. Inofensivo, y `__pycache__/` ya está en el `.gitignore`.

### 13. Columna `dia` con dos significados — prioridad baja
En `data.preparar`, `dia` es el día de la semana (0–6); en `tablas.top_dias` se
sobrescribe localmente con la fecha. Funciona, pero puede confundir. Un nombre
como `fecha` en `top_dias` lo aclararía.

### 14. Validación de historial basada en el primer elemento — informativo
`cargar_historial` solo revisa que el primer elemento tenga `ts`. Elementos
posteriores con formato raro no rompen el proceso (las fechas inválidas se
descartan), así que es un compromiso razonable entre rapidez y robustez.
