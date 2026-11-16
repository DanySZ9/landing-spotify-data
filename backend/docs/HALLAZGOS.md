# Hallazgos de la revisión

Observaciones detectadas al documentar el backend (noviembre de 2026).
**Ninguna se ha corregido todavía**: esta revisión solo añadió documentación,
sin cambiar el comportamiento del código. Están ordenadas por prioridad.

---

## Seguridad y estabilidad

### 1. Sin límite de tamaño ni de número de archivos — prioridad alta (si se publica)
`main.py` lee cada archivo entero en memoria (`await a.read()`) y pandas crea
después varias copias de la tabla. Alguien podría enviar archivos enormes o
cientos de archivos y agotar la RAM del servidor (denegación de servicio).
**Propuesta:** limitar el tamaño en el proxy inverso (`client_max_body_size`) y
además en el código (máximo de archivos y de bytes por archivo, respondiendo 413).

### 2. Sin control de abuso — prioridad media (si se publica)
No hay autenticación ni límite de peticiones. Como cada análisis es costoso en
CPU, un cliente podría saturar el servidor con peticiones repetidas. CORS no lo
impide (solo afecta a navegadores).
**Propuesta:** *rate limiting* por IP en el proxy o con una librería como `slowapi`.

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

### 6. Orígenes CORS escritos en el código — prioridad alta para desplegar
Solo se aceptan `localhost:5173`/`127.0.0.1:5173`. Al desplegar habrá que editar
`main.py`. **Propuesta:** leer una variable de entorno, p. ej.
`ALLOWED_ORIGINS=https://midominio.com`, con los valores actuales como respaldo.

### 7. Dependencias sin versión fija — prioridad media
`requirements.txt` no fija versiones: una instalación futura puede traer una
versión de pandas o Plotly con cambios incompatibles y romper el backend sin
haber tocado el código. **Propuesta:** fijar versiones probadas
(`pip freeze > requirements.txt` o rangos como `pandas>=3.1,<4`).

### 8. No hay endpoint de salud — prioridad baja
Las plataformas de hosting suelen comprobar una ruta (p. ej. `GET /api/salud`)
para saber si el servicio está vivo. Ver receta 6 en `GUIA_CAMBIOS.md`.

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

### 11. Proyecto sin control de versiones ni `.gitignore` — prioridad media
La carpeta raíz no es un repositorio git. Al crearlo, conviene ignorar
`__pycache__/`, `.venv/` y `node_modules/`.

### 12. Archivos sobrantes — prioridad baja
- `backend/package-lock.json`: archivo vacío de npm, sin uso en un backend Python.
- `backend/__pycache__/datos.cpython-315.pyc`: caché de un `datos.py` que ya no existe.
Ambos se pueden borrar sin efecto.

### 13. Columna `dia` con dos significados — prioridad baja
En `data.preparar`, `dia` es el día de la semana (0–6); en `tablas.top_dias` se
sobrescribe localmente con la fecha. Funciona, pero puede confundir. Un nombre
como `fecha` en `top_dias` lo aclararía.

### 14. Validación de historial basada en el primer elemento — informativo
`cargar_historial` solo revisa que el primer elemento tenga `ts`. Elementos
posteriores con formato raro no rompen el proceso (las fechas inválidas se
descartan), así que es un compromiso razonable entre rapidez y robustez.
