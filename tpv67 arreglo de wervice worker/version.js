// version.js - Control centralizado de versiones
const APP_VERSION = '5.7.2';
const BUILD_DATE = '2024-01-15';
const VERSION_CHECK_INTERVAL = 3600000; // 1 hora

// Función para verificar actualizaciones
function checkForUpdates() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'VERSION_CHECK',
            version: APP_VERSION
        });
    }
}

// Verificar al cargar
window.addEventListener('load', () => {
    // Mostrar versión en consola
    console.log(`📱 TPV Hostelería Pro v${APP_VERSION} (${BUILD_DATE})`);

    // Guardar versión actual
    localStorage.setItem('app_version', APP_VERSION);

    // Verificar actualizaciones periódicamente
    setInterval(checkForUpdates, VERSION_CHECK_INTERVAL);
});

// Escuchar mensajes del SW
navigator.serviceWorker?.addEventListener('message', event => {
    if (event.data.type === 'UPDATE_AVAILABLE') {
        if (confirm('🔄 Nueva versión disponible. ¿Actualizar ahora?')) {
            location.reload(true);
        }
    }
});