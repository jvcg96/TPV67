// Variables para el PIN
let pinActual = '';
// Variables para manejar imágenes
let tipoVisualSeleccionado = 'emoji';




// Función para obtener fecha/hora local correcta ESPAÑA
function obtenerFechaLocal() {
    // Crear fecha actual
    const ahora = new Date();

    // Formatear a hora española usando toLocaleString
    const opciones = {
        timeZone: 'Europe/Madrid',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };

    // Obtener string formateado para España
    const fechaEspañola = ahora.toLocaleString('es-ES', opciones);

    // Parsear el string español (formato: dd/mm/yyyy, hh:mm:ss)
    const [fecha, hora] = fechaEspañola.split(', ');
    const [dia, mes, año] = fecha.split('/');
    const [horas, minutos, segundos] = hora.split(':');

    // Retornar en formato ISO para mantener consistencia
    return `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T${horas}:${minutos}:${segundos}`;
}

// Función para obtener emoji por área
function obtenerEmojiArea(areaId, nombreArea) {
    const emojis = {
        'barra': '🍺',
        'terraza': '🌅',
        'salon': '🍽️',
        'sala': '🍽️',
        'cocina': '👨‍🍳',
        'exterior': '🌳',
        'interior': '🏠',
        'vip': '👑',
        'privado': '🔒'
    };

    // Buscar por ID exacto
    if (emojis[areaId]) return emojis[areaId];

    // Buscar por nombre (contiene)
    const nombreLower = nombreArea.toLowerCase();
    for (const [key, emoji] of Object.entries(emojis)) {
        if (nombreLower.includes(key) || key.includes(nombreLower)) {
            return emoji;
        }
    }

    return '📍'; // Por defecto
}


// Función auxiliar para formatear fechas
function formatearFecha(fecha) {
    const opciones = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    return new Date(fecha).toLocaleDateString('es-ES', opciones);
}


// Función para actualizar contadores en tiempo real
function actualizarContadoresEnTiempoReal() {
    if (document.getElementById('estadisticasHora')) {
        const hoy = new Date().toISOString().split('T')[0];
        const fechaFiltro = document.getElementById('filtroFecha').value;

        if (fechaFiltro === hoy) {
            // Solo actualizar si estamos viendo el día actual
            setTimeout(() => {
                aplicarFiltrosPedidos();
            }, 1000);
        }
    }
}

// Función para validar filtros
function validarFiltros() {
    const fechaDesde = document.getElementById('filtroFecha').value;
    const horaDesde = document.getElementById('filtroHoraDesde').value;
    const horaHasta = document.getElementById('filtroHoraHasta').value;

    if (horaDesde && horaHasta) {
        const [horaD, minD] = horaDesde.split(':').map(Number);
        const [horaH, minH] = horaHasta.split(':').map(Number);

        const minutosDesde = horaD * 60 + minD;
        const minutosHasta = horaH * 60 + minH;

        if (minutosDesde >= minutosHasta) {
            alert('La hora "desde" debe ser anterior a la hora "hasta"');
            return false;
        }
    }

    return true;
}


function limpiarCacheNavegador() {
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => {
                caches.delete(name);
            });
        });
        console.log('✅ Caché limpiado');
        mostrarNotificacion('🔄 Caché limpiado - Recargando...');
        setTimeout(() => location.reload(true), 1000);
    }
}
// Atajo: Ctrl+Shift+R para limpiar caché
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        limpiarCacheNavegador();
    }
});
// Atajos de teclado
document.addEventListener('keydown', function (event) {
    // ESC para cerrar modal
    if (event.key === 'Escape' && mesaActual !== null) {
        cerrarModal();
    }
});
