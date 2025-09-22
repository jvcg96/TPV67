// ========================================
// SISTEMA DE HARDWARE ID Y LICENCIAS
// ========================================

function getHardwareFingerprint() {
    // Crear fingerprint único del dispositivo
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('TPV_HW_2024', 2, 2);

    const info = [
        navigator.userAgent,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        navigator.language,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 'NC'
    ].join('|');

    // Generar ID corto y legible
    const hash = btoa(info).replace(/[^A-Z0-9]/gi, '').substring(0, 8).toUpperCase();
    return hash;
}


// Verificar estado de licencia
function obtenerEstadoLicencia() {
    const licData = localStorage.getItem('lic_data');

    // Estructura base que SIEMPRE retornamos para consistencia
    const estructuraBase = {
        tipo: 'standard',
        activa: true,
        pagada: false,
        key: null,
        hardwareId: null,
        diasRestantes: null
    };

    if (!licData) {
        // Verificar formato antiguo por compatibilidad
        const tipoAntiguo = localStorage.getItem('licenciaTipo');
        if (tipoAntiguo) {
            // Migrar al nuevo formato
            const tipo = tipoAntiguo;
            const key = localStorage.getItem('licenciaKey');
            activarLicencia(key || `${tipo.toUpperCase()}-MIGRADO`, tipo);

            return {
                ...estructuraBase,
                tipo: tipo,
                pagada: !!key,
                key: key ? '****-****' : null
            };
        }
        return estructuraBase;
    }

    try {
        const datos = JSON.parse(atob(licData));
        const tipo = atob(datos.t);

        // Verificar que el hardware coincida
        const hardwareActual = getHardwareFingerprint();
        if (datos.h && datos.h !== hardwareActual) {
            console.warn('⚠️ Hardware ID no coincide');
            return estructuraBase;
        }

        return {
            ...estructuraBase,
            tipo: tipo,
            activa: true,
            key: '****-****', // No mostrar la key real
            pagada: true,
            hardwareId: datos.h
        };
    } catch (e) {
        return estructuraBase;
    }
}

// Función para activar premium
function activarPremium(key) {
    return activarLicencia(key, 'premium');
}

function activarLicencia(key, tipo) {
    // Determinar tipo por prefijo si no se especifica
    if (!tipo) {
        if (key.startsWith('STD-')) tipo = 'standard';
        else if (key.startsWith('PRO-')) tipo = 'pro';
        else if (key.startsWith('PREM-')) tipo = 'premium';
        else return false;
    }

    // Validar que la licencia sea para este hardware
    const hardwareId = getHardwareFingerprint();
    const partes = key.split('-');

    // Verificar formato: TIPO-HARDWARE-XXXX-XXXX
    if (partes.length >= 3 && partes[1] !== hardwareId && partes[1] !== 'TEST') {
        alert('⚠️ Esta licencia no es válida para este dispositivo');
        return false;
    }

    if (key && key.length >= 16) {
        // Ofuscar datos antes de guardar
        const datosLicencia = {
            t: btoa(tipo),
            k: btoa(key),
            h: hardwareId,
            f: new Date().toISOString()
        };

        localStorage.setItem('lic_data', btoa(JSON.stringify(datosLicencia)));
        return true;
    }
    return false;
}

// Función para iniciar trial
function iniciarTrial() {
    const licencia = obtenerEstadoLicencia();
    if (licencia.tipo === 'standard') {
        localStorage.setItem('licenciaTipo', 'trial');
        localStorage.setItem('licenciaFecha', new Date().toISOString());
        return true;
    }
    return false;
}


// Variable global para estado de licencia
let licenciaActual = obtenerEstadoLicencia();
// Sistema de licencias

const LICENCIA_CONFIG = {
    TRIAL_DIAS: 7,
    PRECIO_PRO: '69€/mes',
    PRECIO_PREMIUM: '130€/mes',
    FEATURES_PRO: [
        'Análisis básico de facturación',
        'Gráficos de ventas diarias',
        'Filtros por categoría',
        'Exportación CSV básica',
        'Historial 90 días',
        'Soporte por email'
    ],
    FEATURES_PREMIUM: [
        'Todo lo de Pro +',
        'Análisis avanzado completo',
        'Gráficos interactivos ilimitados',
        'Filtros por producto individual',
        'Exportación avanzada (CSV, PDF, Excel)',
        'Historial ilimitado',
        'API para integraciones',
        'Soporte prioritario 24/7',
        'Actualizaciones anticipadas'
    ]
};



