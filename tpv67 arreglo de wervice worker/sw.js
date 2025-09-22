// ============================================
// SERVICE WORKER TPV - VERSIÓN SINCRONIZADA
// ============================================
const APP_VERSION = '5.7.2'; // MANTENER SINCRONIZADO CON version.js
const CACHE_NAME = `tpv-hosteleria-v${APP_VERSION}`;

// Archivos a cachear
const CORE_CACHE_FILES = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './manifest.json',
    './DatabaseManager.js',

    // Core crítico para funcionamiento básico
    './js/core/config.js',
    './js/core/window-init.js',
    './js/core/global-functions.js',

    // UI esencial para navegación e interfaz
    './js/ui/navigation.js',
    './js/ui/notifications.js',
    './js/ui/modals.js',

    // Módulos críticos para funcionalidad básica
    './js/modules/users.js',
    './js/modules/tables.js'
];

// ============================================
// INSTALACIÓN
// ============================================
self.addEventListener('install', event => {
    console.log(`🚀 Instalando SW: v${APP_VERSION}`);

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Cacheando archivos core');
                return cache.addAll(CORE_CACHE_FILES);
            })
            .then(() => {
                console.log('✅ Instalación completa');
                return self.skipWaiting();
            })
    );
});

// ============================================
// ACTIVACIÓN
// ============================================
self.addEventListener('activate', event => {
    console.log(`⚡ Activando SW: v${APP_VERSION}`);

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Borrando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
            .then(() => {
                console.log('✅ SW activo y limpio');
                // Notificar a todos los clientes
                return self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'SW_ACTIVATED',
                            version: APP_VERSION
                        });
                    });
                });
            })
            .then(() => self.clients.claim())
    );
});

// ============================================
// FETCH - Network First para desarrollo
// ============================================
self.addEventListener('fetch', event => {
    // Ignorar peticiones que no sean GET
    if (event.request.method !== 'GET') return;

    // Para archivos JS/CSS, siempre intentar red primero
    if (event.request.url.includes('.js') || event.request.url.includes('.css')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Actualizar cache con la nueva versión
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                })
                .catch(() => {
                    // Si falla la red, usar cache
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Para otros recursos, cache first
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
            .catch(() => {
                return caches.match('./index.html');
            })
    );
});

// ============================================
// MENSAJES
// ============================================
self.addEventListener('message', event => {
    if (event.data.type === 'VERSION_CHECK') {
        if (event.data.version !== APP_VERSION) {
            event.source.postMessage({
                type: 'UPDATE_AVAILABLE',
                newVersion: APP_VERSION,
                oldVersion: event.data.version
            });
        }
    }

    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log(`✅ Service Worker v${APP_VERSION} cargado`);