// ========================================
// SISTEMA DE TECLADO VIRTUAL
// ========================================

// Variables para el teclado
let inputActivo = null;
let tipoTecladoActivo = null;

// Variable global para trackear inputs configurados
const inputsConfigurados = new WeakMap();
let configurandoTeclados = false;

// Función para detectar si es un dispositivo táctil
function esDispositivoTactil() {
    // Primero verificar si el usuario ha activado el teclado virtual
    const tecladoActivado = localStorage.getItem('tecladoVirtualActivado') === 'true';

    // Si está activado manualmente, siempre mostrar
    if (tecladoActivado) {
        return true;
    }

    // Si no está activado, no mostrar nunca
    return false;
}


// Función para toggle del teclado virtual
function toggleTecladoVirtual() {
    const checkbox = document.getElementById('toggleTecladoVirtual');
    const estado = checkbox.checked;

    // Guardar preferencia
    localStorage.setItem('tecladoVirtualActivado', estado);

    // Actualizar UI
    actualizarEstadoTecladoUI(estado);

    // Reconfigurar inputs
    configurarTecladosVirtuales();

    // Mostrar notificación
    if (estado) {
        mostrarNotificacion('⌨️ Teclado virtual activado');
    } else {
        mostrarNotificacion('❌ Teclado virtual desactivado');
        // Quitar readonly de los inputs si está desactivado
        quitarReadOnlyInputs();
    }
}

// Función para actualizar la UI del estado del teclado
function actualizarEstadoTecladoUI(activado) {
    const textoEstado = document.getElementById('textoEstadoTeclado');
    const contenedorEstado = document.getElementById('estadoTecladoVirtual');

    if (activado) {
        textoEstado.textContent = '🟢 Teclado Virtual Activado';
        contenedorEstado.style.background = 'rgba(34, 197, 94, 0.1)';
        contenedorEstado.style.border = '1px solid rgba(34, 197, 94, 0.3)';
    } else {
        textoEstado.textContent = '🔴 Teclado Virtual Desactivado';
        contenedorEstado.style.background = 'rgba(40, 40, 40, 0.5)';
        contenedorEstado.style.border = 'none';
    }
}
// Función para cargar estado del teclado al iniciar
function cargarEstadoTeclado() {
    const tecladoActivado = localStorage.getItem('tecladoVirtualActivado') === 'true';
    const checkbox = document.getElementById('toggleTecladoVirtual');

    if (checkbox) {
        checkbox.checked = tecladoActivado;
        actualizarEstadoTecladoUI(tecladoActivado);
    }
}


// Función para quitar readonly de inputs cuando se desactiva el teclado
function quitarReadOnlyInputs() {
    const todosLosInputs = document.querySelectorAll('input[readonly]');
    todosLosInputs.forEach(input => {
        // Solo quitar readonly si no es un campo que deba ser readonly por diseño
        if (!input.classList.contains('siempre-readonly')) {
            input.readOnly = false;
        }
    });

    // Limpiar el tracking de inputs configurados
    limpiarConfiguracionTeclados();
}


// Función para abrir teclado numérico
function abrirTecladoNumerico(input) {
    if (!esDispositivoTactil()) return;

    // Verificar si ya hay un teclado abierto
    if (inputActivo && inputActivo !== input) {
        cerrarTodosLosTeclados();
    }

    // Evitar abrir múltiples veces para el mismo input
    if (inputActivo === input && document.getElementById('tecladoNumerico').style.display === 'block') {
        return;
    }

    inputActivo = input;
    tipoTecladoActivo = 'numerico';

    // Establecer valor inicial
    document.getElementById('tecladoInput').value = input.value || '';

    // Mostrar teclado
    document.getElementById('tecladoNumerico').style.display = 'block';

    // Prevenir teclado nativo
    input.blur();
}


// Función para abrir teclado completo
function abrirTecladoCompleto(input) {
    if (!esDispositivoTactil()) return;

    // Verificar si ya hay un teclado abierto
    if (inputActivo && inputActivo !== input) {
        cerrarTodosLosTeclados();
    }

    // Evitar abrir múltiples veces
    if (inputActivo === input && document.getElementById('tecladoCompleto').style.display === 'block') {
        return;
    }

    inputActivo = input;
    tipoTecladoActivo = 'completo';

    // Establecer valor inicial
    document.getElementById('tecladoCompletoInput').value = input.value || '';

    // Mostrar teclado
    document.getElementById('tecladoCompleto').style.display = 'block';

    // Prevenir teclado nativo
    input.blur();
}
// Funciones del teclado numérico
function agregarNumero(num) {
    const input = document.getElementById('tecladoInput');
    input.value += num;
}

function agregarDecimal() {
    const input = document.getElementById('tecladoInput');
    if (!input.value.includes('.')) {
        input.value += '.';
    }
}



function borrarUltimo() {
    const input = document.getElementById('tecladoInput');
    input.value = input.value.slice(0, -1);
}


function limpiarTeclado() {
    document.getElementById('tecladoInput').value = '';
}
function confirmarTeclado() {
    if (inputActivo) {
        inputActivo.value = document.getElementById('tecladoInput').value;
        inputActivo.dispatchEvent(new Event('input', { bubbles: true }));
        inputActivo.dispatchEvent(new Event('change', { bubbles: true }));

        // Si es el campo de cantidad recibida en cobro, calcular cambio
        if (inputActivo.id === 'cantidadRecibida') {
            calcularCambio();
        }
    }
    cerrarTeclado();
}



function cerrarTeclado() {
    document.getElementById('tecladoNumerico').style.display = 'none';
    inputActivo = null;
}


// Funciones del teclado completo
function agregarLetra(letra) {
    const input = document.getElementById('tecladoCompletoInput');
    input.value += letra;
}

function borrarUltimoCompleto() {
    const input = document.getElementById('tecladoCompletoInput');
    input.value = input.value.slice(0, -1);
}


function limpiarTecladoCompleto() {
    document.getElementById('tecladoCompletoInput').value = '';
}
function confirmarTecladoCompleto() {
    if (inputActivo) {
        inputActivo.value = document.getElementById('tecladoCompletoInput').value;
        inputActivo.dispatchEvent(new Event('input', { bubbles: true }));
        inputActivo.dispatchEvent(new Event('change', { bubbles: true }));
    }
    cerrarTecladoCompleto();
}


function cerrarTecladoCompleto() {
    document.getElementById('tecladoCompleto').style.display = 'none';
    inputActivo = null;
}

function configurarTecladosVirtuales() {
    if (!esDispositivoTactil()) return;

    // Evitar configuración múltiple simultánea
    if (configurandoTeclados) return;
    configurandoTeclados = true;

    // Dar tiempo al DOM para estabilizarse
    setTimeout(() => {
        configurarTecladosNumericosSeguro();
        configurarTecladosTextoSeguro();
        configurandoTeclados = false;
    }, 100);
}


function configurarTecladosNumericosSeguro() {
    // Inputs numéricos
    const inputsNumericos = [
        'cantidadRecibida',
        'nuevoPrecio',
        'editarPrecio',
        'nuevoStock',
        'nuevoStockMinimo',
        'cantidadAjuste',
        'gestionMesaCapacidad',
        'cantidadObjetivo'
    ];

    inputsNumericos.forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;

        // Verificar si ya está configurado usando WeakMap
        if (inputsConfigurados.has(input)) {
            return; // Ya está configurado, saltar
        }

        // Marcar como configurado
        inputsConfigurados.set(input, true);

        // Hacer readonly
        input.readOnly = true;

        // Crear función handler una sola vez
        const handleClick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.blur();

            // Cerrar cualquier teclado abierto antes de abrir uno nuevo
            cerrarTodosLosTeclados();

            // Pequeño delay para evitar race condition
            setTimeout(() => {
                abrirTecladoNumerico(this);
            }, 50);
        };

        // Remover listeners antiguos si existen
        input.removeEventListener('click', input._tecladoHandler);
        input.removeEventListener('touchstart', input._tecladoHandler);

        // Guardar referencia al handler
        input._tecladoHandler = handleClick;

        // Agregar nuevos listeners
        input.addEventListener('click', handleClick, { passive: false });
        input.addEventListener('touchstart', handleClick, { passive: false });

        // Prevenir focus
        input.addEventListener('focus', function (e) {
            e.preventDefault();
            this.blur();
        }, { passive: false });
    });
}

function configurarTecladosTextoSeguro() {
    // Inputs de texto
    const inputsTexto = [
        'nuevoNombre',
        'editarNombre',
        'gestionMesaNombre',
        'gestionMesaDescripcion',
        'buscarProducto',
        'nuevaCategoriaNombre',
        'nuevaAreaNombre',
        'motivoAjuste',
        'motivoReabastecimiento'
    ];

    inputsTexto.forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;

        // Verificar si ya está configurado
        if (inputsConfigurados.has(input)) {
            return;
        }

        // Marcar como configurado
        inputsConfigurados.set(input, true);

        // Hacer readonly
        input.readOnly = true;

        // Crear handler
        const handleClick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.blur();

            // Cerrar cualquier teclado abierto
            cerrarTodosLosTeclados();

            // Delay para evitar race condition
            setTimeout(() => {
                abrirTecladoCompleto(this);
            }, 50);
        };

        // Remover listeners antiguos
        input.removeEventListener('click', input._tecladoHandler);
        input.removeEventListener('touchstart', input._tecladoHandler);

        // Guardar referencia
        input._tecladoHandler = handleClick;

        // Agregar nuevos listeners
        input.addEventListener('click', handleClick, { passive: false });
        input.addEventListener('touchstart', handleClick, { passive: false });

        // Prevenir focus
        input.addEventListener('focus', function (e) {
            e.preventDefault();
            this.blur();
        }, { passive: false });
    });
}

// Nueva función para cerrar todos los teclados
function cerrarTodosLosTeclados() {
    const tecladoNum = document.getElementById('tecladoNumerico');
    const tecladoComp = document.getElementById('tecladoCompleto');

    if (tecladoNum) {
        tecladoNum.style.display = 'none';
    }
    if (tecladoComp) {
        tecladoComp.style.display = 'none';
    }

    inputActivo = null;
    tipoTecladoActivo = null;
}

// Función para limpiar configuración cuando se desactiva el teclado

function limpiarConfiguracionTeclados() {
    // WeakMap se limpia automáticamente cuando los elementos se eliminan del DOM
    configurandoTeclados = false;

    // Quitar readonly de todos los inputs
    document.querySelectorAll('input[readonly]').forEach(input => {
        if (!input.classList.contains('siempre-readonly')) {
            input.readOnly = false;

            // Remover handlers
            if (input._tecladoHandler) {
                input.removeEventListener('click', input._tecladoHandler);
                input.removeEventListener('touchstart', input._tecladoHandler);
                delete input._tecladoHandler;
            }
        }
    });
}

// Cerrar teclados al hacer clic fuera
window.addEventListener('click', function (event) {
    const tecladoNum = document.getElementById('tecladoNumerico');
    const tecladoComp = document.getElementById('tecladoCompleto');

    if (event.target == tecladoNum || event.target == tecladoComp) {
        cerrarTeclado();
        cerrarTecladoCompleto();
    }
});

// Inicializar teclados cuando se carga la página
const initTecladosOriginal = window.onload;
window.onload = function () {
    if (initTecladosOriginal) initTecladosOriginal();

    // Esperar un poco para asegurar que todos los elementos estén cargados
    setTimeout(() => {
        configurarTecladosVirtuales();

        // Re-configurar cuando se abren modales
        let observerTimeout = null;
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.attributeName === 'style') {
                    // Cancelar timeout anterior si existe
                    clearTimeout(observerTimeout);

                    // Esperar a que termine la animación del modal
                    observerTimeout = setTimeout(() => {
                        // Solo configurar si el modal está visible
                        const modal = mutation.target;
                        if (modal && modal.style.display === 'block') {
                            configurarTecladosVirtuales();
                        }
                    }, 300); // Esperar más tiempo para animaciones
                }
            });
        });

        // Observar cambios en modales
        const modales = document.querySelectorAll('.modal');
        modales.forEach(modal => {
            observer.observe(modal, {
                attributes: true,
                attributeFilter: ['style']
            });
        });

        // Limpiar al cambiar de pestaña para evitar memory leaks
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                cerrarTodosLosTeclados();
            }
        });

        // Cerrar teclados si se hace click fuera
        document.addEventListener('click', (e) => {
            const tecladoNum = document.getElementById('tecladoNumerico');
            const tecladoComp = document.getElementById('tecladoCompleto');

            // Si el click es fuera de los teclados y no es en un input
            if (inputActivo &&
                !tecladoNum?.contains(e.target) &&
                !tecladoComp?.contains(e.target) &&
                e.target !== inputActivo) {

                // Pequeño delay para no interferir con otros eventos
                setTimeout(() => {
                    if (!e.target.readOnly) {
                        cerrarTodosLosTeclados();
                    }
                }, 100);
            }
        });

    }, 1000);
};