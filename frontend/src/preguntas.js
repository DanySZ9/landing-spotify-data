// Preguntas frecuentes. `categoria` alimenta los botones para filtrar por tema
// en <PreguntasFrecuentes />. Las respuestas describen el comportamiento real
// del backend (ver backend/docs/API.md); si este cambia, actualízalas.
export const PREGUNTAS = [
    // --- General ---
    {
        id: 1,
        categoria: "General",
        question: "¿Qué puedo ver aquí que no me muestra Spotify Wrapped?",
        answer: "Wrapped resume un solo año con unas pocas cifras. Aquí puedes explorar todo tu historial desde que creaste la cuenta: horas escuchadas por mes, a qué hora y qué días escuchas más, en qué dispositivos, qué canciones saltas, cómo empiezan y terminan tus reproducciones, y rankings de hasta 100 artistas, canciones, álbumes y podcasts. Además puedes filtrar por fechas, artista, dispositivo y más."
    },
    {
        id: 2,
        categoria: "General",
        question: "¿Es una página oficial de Spotify?",
        answer: "No. Es un proyecto independiente, sin relación con Spotify. Solo usa los archivos que Spotify te entrega cuando solicitas tus datos; no se conecta a tu cuenta ni necesita tu contraseña."
    },
    {
        id: 3,
        categoria: "General",
        question: "¿Tiene algún costo o necesito crear una cuenta?",
        answer: "No. Es gratis y no hay registro: subes tus archivos y ves tus estadísticas al momento."
    },
    {
        id: 4,
        categoria: "General",
        question: "¿Puedo usarla desde el celular?",
        answer: "Sí, funciona en el navegador del móvil. Eso sí, primero tienes que descomprimir el ZIP que envía Spotify para poder elegir los archivos .json, y eso suele ser más cómodo desde una computadora."
    },

    // --- Privacidad ---
    {
        id: 5,
        categoria: "Privacidad",
        question: "¿Guardan mis archivos o mi historial?",
        answer: "No. Tus archivos solo se usan mientras se calculan las estadísticas y se borran del servidor en cuanto termina el análisis: no hay base de datos ni se conserva ninguna copia. Si cierras o recargas la página, tendrás que volver a subirlos."
    },
    {
        id: 6,
        categoria: "Privacidad",
        question: "¿Qué datos de mis archivos se usan?",
        answer: "Solo los necesarios para las estadísticas: fecha y hora, tiempo escuchado, canción, artista, álbum, podcast, dispositivo y si la reproducción fue saltada, aleatoria, sin conexión o en modo incógnito. Datos como tu dirección IP o tu país de conexión, que también vienen en el archivo, se descartan sin usarse."
    },
    {
        id: 7,
        categoria: "Privacidad",
        question: "¿Alguien más puede ver mis estadísticas?",
        answer: "No. Los resultados solo se muestran en tu navegador y no se publican ni se comparten con nadie."
    },

    // --- Tus datos de Spotify ---
    {
        id: 8,
        categoria: "Tus datos",
        question: "¿Cómo pido mis datos a Spotify y cuánto tardan en llegar?",
        answer: "Entra a spotify.com/account/privacy desde un navegador, marca solo «Extended streaming history» y pulsa «Request data». Confirma la solicitud en el correo que te llega. Spotify indica que puede tardar hasta 30 días, aunque normalmente llega en pocos días. El enlace de descarga caduca a los 14 días. Arriba tienes los pasos detallados."
    },
    {
        id: 9,
        categoria: "Tus datos",
        question: "¿Qué archivos tengo que subir?",
        answer: "Los que se llaman Streaming_History_Audio_… .json, que están dentro del ZIP. Puedes seleccionarlos todos a la vez: se unen automáticamente para analizar todo tu historial. Si incluyes otros archivos del ZIP, simplemente se ignoran."
    },
    {
        id: 10,
        categoria: "Tus datos",
        question: "Pedí «Account data» y no funciona, ¿por qué?",
        answer: "Esa opción solo incluye aproximadamente el último año y con menos detalle, en archivos con otro formato (StreamingHistory_music_….json) que esta página no puede leer. Necesitas solicitar el «Extended streaming history»."
    },

    // --- Estadísticas ---
    {
        id: 11,
        categoria: "Estadísticas",
        question: "¿Por qué mis números no coinciden con los de Wrapped?",
        answer: "Aquí se cuenta cada reproducción del archivo, incluidas las que saltaste a los pocos segundos, y el periodo es el que tú elijas. Wrapped usa sus propios criterios y fechas. Para acercarte a su forma de contar, escribe 30 en el filtro «Duración mínima (segundos)»."
    },
    {
        id: 12,
        categoria: "Estadísticas",
        question: "¿Cómo se ordenan los rankings de artistas y canciones?",
        answer: "Por tiempo total escuchado, no por número de reproducciones. Así, una canción que saltaste veinte veces a los 3 segundos no supera a otra que escuchaste completa diez veces."
    },
    {
        id: 13,
        categoria: "Estadísticas",
        question: "¿Qué es una «sesión» de escucha?",
        answer: "Un bloque de reproducciones seguidas. Si pasan más de 30 minutos sin escuchar nada, la siguiente reproducción empieza una sesión nueva."
    },
    {
        id: 14,
        categoria: "Estadísticas",
        question: "¿En qué zona horaria se muestran las horas?",
        answer: "En la de tu dispositivo, que se detecta automáticamente. Spotify guarda las fechas en hora universal (UTC) y aquí se convierten a tu hora local para que los gráficos por hora y por día reflejen cuándo escuchaste realmente."
    },
    {
        id: 15,
        categoria: "Estadísticas",
        question: "¿Se incluyen los podcasts?",
        answer: "Sí. Tienen su propio ranking y, si tu historial incluye podcasts, el filtro «Contenido» te permite ver solo música o solo podcasts."
    },

    // --- Problemas ---
    {
        id: 16,
        categoria: "Problemas",
        question: "Dice que se ignoraron algunos archivos, ¿es un error?",
        answer: "No necesariamente. Se ignoran los archivos que no son historial de audio, por ejemplo el historial de video (Streaming_History_Video_….json), archivos dañados o de otro tipo. El resto se analiza con normalidad."
    },
    {
        id: 17,
        categoria: "Problemas",
        question: "Aparece «No hay reproducciones con esos filtros», ¿qué hago?",
        answer: "La combinación de filtros que elegiste no deja ninguna reproducción. Amplía el rango de fechas, quita el filtro de artista o pulsa «Restablecer» para volver a ver todo tu historial."
    },
    {
        id: 18,
        categoria: "Problemas",
        question: "¿Por qué tarda en cargar?",
        answer: "Un historial de varios años puede tener cientos de miles de reproducciones, y cada vez que aplicas filtros se vuelven a analizar todas. Suele tardar solo unos segundos, según el tamaño de tus archivos y tu conexión."
    },
];
