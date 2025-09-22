
// ========================================
// PANEL DE ADMINISTRACIÓN SIMPLIFICADO
// ========================================

// Variable para controlar acceso
let intentosAcceso = 0;

// Abrir panel con contraseña
function abrirPanelAdmin() {
    const clave = prompt('Introduce la clave de administrador:');

    if (clave === 'jvcg96281296') { // Cambia esta clave
        document.getElementById('panelAdmin').style.display = 'block';
        actualizarEstadoLicenciaAdmin();
        intentosAcceso = 0;
    } else if (clave !== null) {
        intentosAcceso++;
        if (intentosAcceso >= 3) {
            alert('Demasiados intentos fallidos. Recarga la página.');
            intentosAcceso = 0;
        } else {
            alert('Clave incorrecta');
        }
    }
}

// Cerrar panel
function cerrarPanelAdmin() {
    document.getElementById('panelAdmin').style.display = 'none';
    document.getElementById('codigoLicenciaAdmin').value = '';
}


// Actualizar estado de licencia
function actualizarEstadoLicenciaAdmin() {
    const estado = obtenerEstadoLicencia();
    const container = document.getElementById('estadoLicenciaAdmin');

    let colorEstado = '#888';
    let textoEstado = 'Standard Gratuito';

    if (estado.tipo === 'premium') {
        colorEstado = '#ffd700';
        textoEstado = '👑 Premium Activo';
    } else if (estado.tipo === 'pro') {
        colorEstado = '#ffa502';
        textoEstado = '🚀 Pro Activo';
    } else if (estado.tipo === 'standard' && estado.pagada) {
        colorEstado = '#4a5568';
        textoEstado = '📋 Standard Pagado';
    }

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong style="color: ${colorEstado};">${textoEstado}</strong>
                <p style="color: #666; margin: 5px 0 0 0; font-size: 0.9em;">
                    Hardware ID: ${getHardwareFingerprint()}
                </p>
            </div>
            ${estado.key ? '<span style="color: #22c55e;">✓ Licencia Activa</span>' : ''}
        </div>
    `;
}


// Activar licencia desde admin 
function activarLicenciaAdmin(tipo) {
    console.log(`🔧 Activando licencia tipo: ${tipo}`);

    try {
        const codigo = document.getElementById('codigoLicenciaAdmin').value.trim();

        // Si hay código, validarlo primero
        if (codigo) {
            console.log('📝 Validando código personalizado...');
            if (activarLicencia(codigo, tipo)) {
                mostrarNotificacion(`✅ Licencia ${tipo.toUpperCase()} activada con código personalizado`);
                actualizarEstadoLicenciaAdmin();
                setTimeout(() => location.reload(), 2000);
                return;
            } else {
                alert('❌ Código de licencia inválido');
                return;
            }
        }

        // Si no hay código, generar y activar automáticamente
        console.log('🔄 Generando licencia automática...');

        // Confirmar activación
        const confirmar = confirm(`¿Activar licencia ${tipo.toUpperCase()} para este dispositivo?\n\nSe generará un código único vinculado a este TPV.`);
        if (!confirmar) {
            return;
        }

        const hardware = getHardwareFingerprint();
        const timestamp = Date.now().toString(36).substring(0, 4).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();

        const prefijo = tipo === 'standard' ? 'STD' : tipo === 'pro' ? 'PRO' : 'PREM';
        const licenciaGenerada = `${prefijo}-${hardware}-${timestamp}-${random}`;

        console.log(`🔑 Licencia generada: ${licenciaGenerada}`);

        // Activar la licencia
        if (activarLicencia(licenciaGenerada, tipo)) {
            console.log('✅ Licencia activada correctamente');

            // Mostrar la licencia generada en el campo
            document.getElementById('codigoLicenciaAdmin').value = licenciaGenerada;

            // Actualizar estado
            actualizarEstadoLicenciaAdmin();

            // Notificación de éxito
            mostrarNotificacion(`🎉 Licencia ${tipo.toUpperCase()} activada automáticamente`);

            // Mostrar confirmación detallada
            setTimeout(() => {
                alert(`🎉 ¡LICENCIA ACTIVADA CORRECTAMENTE!\n\n` +
                    `📋 Tipo: ${tipo.toUpperCase()}\n` +
                    `🔑 Código: ${licenciaGenerada}\n` +
                    `💻 Hardware ID: ${hardware}\n\n` +
                    `✅ Este código está vinculado a este dispositivo específico.\n\n` +
                    `La aplicación se recargará automáticamente...`);

                setTimeout(() => location.reload(), 2000);
            }, 1000);

        } else {
            console.error('❌ Error al activar la licencia');
            alert('❌ Error al activar la licencia automáticamente.\n\nPor favor, contacta con soporte técnico.');
        }

    } catch (error) {
        console.error('❌ Error en activarLicenciaAdmin:', error);
        alert(`❌ Error inesperado: ${error.message}\n\nPor favor, recarga la página e inténtalo de nuevo.`);
    }
}

// Limpiar caché de forma SEGURA
function limpiarCacheSeguro() {
    if (confirm('Esto actualizará el caché del sistema.\n\n¿Continuar?')) {
        // Actualizar versión del SW automáticamente
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(reg => {
                if (reg) {
                    reg.update();
                    mostrarNotificacion('✅ Caché actualizado. Recargando...');
                    setTimeout(() => location.reload(true), 1500);
                }
            });
        } else {
            location.reload(true);
        }
    }
}

// Resetear datos con confirmación doble
function resetearDatos() {
    const confirmar1 = confirm('⚠️ Esto borrará TODOS los datos:\n\n• Ventas\n• Productos\n• Configuración\n\n¿Estás seguro?');

    if (confirmar1) {
        const confirmar2 = prompt('Escribe "BORRAR" para confirmar:');

        if (confirmar2 === 'BORRAR') {
            // Limpiar todo EXCEPTO licencias
            const licenciaBackup = localStorage.getItem('lic_data');

            localStorage.clear();

            if (licenciaBackup) {
                localStorage.setItem('lic_data', licenciaBackup);
            }

            // Limpiar IndexedDB
            if (window.DB) {
                DB.limpiarDatosAntiguos();
            }

            mostrarNotificacion('✅ Datos reseteados. Recargando...');
            setTimeout(() => location.reload(), 2000);
        }
    }
}
// Exportar backup desde admin
function exportarDatosAdmin() {
    exportarDatos(); // Usa la función que ya tienes
    mostrarNotificacion('💾 Backup descargado');
}

// Función para verificar que todo esté conectado correctamente
function verificarSistemaAdmin() {
    console.log('🔍 Verificando sistema de administración...');
    console.log('✅ Hardware ID:', getHardwareFingerprint());
    console.log('✅ Estado licencia actual:', obtenerEstadoLicencia());
    console.log('✅ Función activarLicencia disponible:', typeof activarLicencia === 'function');
    console.log('✅ Panel admin cargado correctamente');
}

// Función para verificar imágenes guardadas
async function verificarImagenesProductos() {
    console.log('🖼️ Verificando imágenes de productos...');

    for (const producto of productos) {
        if (producto.tieneImagen) {
            try {
                const imagen = await DB.obtenerImagen(producto.id);
                if (imagen) {
                    console.log(`✅ ${producto.nombre}: Imagen cargada (${Math.round(imagen.length / 1024)}KB)`);
                } else {
                    console.log(`❌ ${producto.nombre}: Imagen no encontrada en BD`);
                }
            } catch (error) {
                console.log(`❌ ${producto.nombre}: Error al cargar imagen:`, error);
            }
        } else {
            console.log(`📝 ${producto.nombre}: Usando emoji ${producto.emoji}`);
        }
    }
}

// Cerrar con ESC
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && document.getElementById('panelAdmin').style.display === 'block') {
        cerrarPanelAdmin();
    }
});

// ========================================
// INSTALACIÓN PWA DESDE ADMIN
// ========================================
let deferredPrompt;

// Capturar el evento de instalación
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btnInstalar = document.getElementById('btnInstalarPWA');
    if (btnInstalar) {
        btnInstalar.style.display = 'block';
    }
});

// Función para instalar PWA
function instalarPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                mostrarNotificacion('✅ App instalada correctamente');
            } else {
                mostrarNotificacion('❌ Instalación cancelada');
            }
            deferredPrompt = null;
            document.getElementById('btnInstalarPWA').style.display = 'none';
        });
    } else {
        mostrarNotificacion('⚠️ La app ya está instalada o no es compatible');
    }
}