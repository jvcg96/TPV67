// ========================================
// TPV HOSTELERÍA - SISTEMA MODULAR
// ========================================
// Archivo principal que carga todos los módulos en orden correcto

console.log('🚀 Iniciando TPV Hostelería - Sistema Modular');

// ========================================
// FUNCIÓN DE CARGA SECUENCIAL DE SCRIPTS
// ========================================
function cargarScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            console.log(`✅ Cargado: ${src}`);
            resolve();
        };
        script.onerror = () => {
            console.error(`❌ Error cargando: ${src}`);
            reject(new Error(`Error cargando ${src}`));
        };
        document.head.appendChild(script);
    });
}

// ========================================
// CARGA SECUENCIAL DE MÓDULOS
// ========================================
async function inicializarTPV() {
    try {
        console.log('📦 Cargando módulos CORE...');

        // 1. CORE - Funcionalidades fundamentales
        await cargarScript('js/core/config.js');
        await cargarScript('js/core/licenses.js');
        await cargarScript('js/core/migrations.js');
        await cargarScript('js/core/data-management.js');
        await cargarScript('js/core/charts.js');
        await cargarScript('js/core/utils.js');
        await cargarScript('js/core/admin-panel.js');
        await cargarScript('js/core/global-functions.js');

        console.log('📦 Cargando módulos BUSINESS...');

        // 2. MODULES - Lógica de negocio
        await cargarScript('js/modules/users.js');
        await cargarScript('js/modules/categories.js');
        await cargarScript('js/modules/areas.js');
        await cargarScript('js/modules/products.js');
        await cargarScript('js/modules/tables.js');
        await cargarScript('js/modules/table-management.js');
        await cargarScript('js/modules/orders.js');
        await cargarScript('js/modules/orders-extensions.js');
        await cargarScript('js/modules/billing.js');
        await cargarScript('js/modules/printing.js')
        await cargarScript('js/modules/inventory.js');
        await cargarScript('js/modules/tpv-categories.js');
        await cargarScript('js/modules/premium-features.js');

        console.log('📦 Cargando módulos UI...');

        // 3. UI - Interfaz de usuario
        await cargarScript('js/ui/notifications.js');
        await cargarScript('js/ui/navigation.js');
        await cargarScript('js/ui/modals.js');
        await cargarScript('js/ui/virtual-keyboard.js');

        console.log('📦 Cargando inicialización...');

        // 4. INITIALIZATION - Inicialización final
        await cargarScript('js/core/window-init.js');
        await cargarScript('js/core/initialization-hooks.js');

        // Completado
        console.log('🎉 Todos los módulos cargados correctamente');
        verificarSistema();

    } catch (error) {
        console.error('💥 Error cargando módulos:', error);
        alert(`Error cargando el sistema: ${error.message}\n\nRevisa que todos los archivos existan en las carpetas correctas.`);
    }
}

// ========================================
// VERIFICACIÓN DE CARGA
// ========================================
function verificarSistema() {
    console.log('🔍 Verificando módulos cargados...');

    // Verificar módulos críticos
    const modulosCriticos = [
        { nombre: 'mesasConfig', existe: typeof window.mesasConfig !== 'undefined' },
        { nombre: 'productos', existe: typeof window.productos !== 'undefined' },
        { nombre: 'facturacion', existe: typeof window.facturacion !== 'undefined' },
        { nombre: 'obtenerEstadoLicencia', existe: typeof obtenerEstadoLicencia === 'function' },
        { nombre: 'mostrarNotificacion', existe: typeof mostrarNotificacion === 'function' },
        { nombre: 'showTab', existe: typeof showTab === 'function' }
    ];

    let modulosOK = 0;
    modulosCriticos.forEach(modulo => {
        if (modulo.existe) {
            modulosOK++;
            console.log(`✅ ${modulo.nombre}`);
        } else {
            console.error(`❌ ${modulo.nombre} no encontrado`);
        }
    });

    if (modulosOK === modulosCriticos.length) {
        console.log('🎉 Todos los módulos críticos cargados correctamente');

        // Mostrar notificación de sistema listo
        setTimeout(() => {
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion('🚀 TPV Sistema modular cargado');
            }
        }, 1000);
    } else {
        console.error(`⚠️ Solo ${modulosOK}/${modulosCriticos.length} módulos críticos cargados`);
        alert('Error: No todos los módulos se cargaron correctamente. Revisa la consola.');
    }
}

// Iniciar carga cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarTPV);
} else {
    inicializarTPV();
}

// ========================================
// MANEJO DE ERRORES GLOBAL
// ========================================
window.addEventListener('error', function (e) {
    console.error('💥 Error global capturado:', {
        mensaje: e.message,
        archivo: e.filename,
        linea: e.lineno,
        columna: e.colno
    });
});

// ========================================
// INFORMACIÓN DE DEBUG
// ========================================
window.TPV_DEBUG = {
    version: '2.0.0-modular',
    modulos: 26,
    iniciado: new Date(),
    verificarEstado: function () {
        console.log('=== ESTADO TPV MODULAR ===');
        console.log('Versión:', this.version);
        console.log('Módulos:', this.modulos);
        console.log('Iniciado:', this.iniciado);
        console.log('Licencia:', typeof obtenerEstadoLicencia === 'function' ? obtenerEstadoLicencia() : 'No disponible');
        console.log('========================');
    }
};

console.log('📋 TPV_DEBUG.verificarEstado() disponible para diagnósticos');