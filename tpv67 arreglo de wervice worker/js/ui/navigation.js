// Variables globales para mesas TPV
let areaActivaMesas = null;
let paginaActualMesas = 1;
let mesasPorPagina = 12; // Base 4x3
let totalPaginasMesas = 1;
let mesasFiltradas = [];

function showTab(tabName, elemento = null) {
    // Solo aplicar restricciones si hay un usuario logueado
    if (usuarioActual) {
        // Restricciones según rol - PERMITIR USUARIOS PARA CAMBIAR
        if (usuarioActual.rol === 'camarero' && tabName !== 'mesas' && tabName !== 'usuarios') {
            mostrarNotificacion('❌ No tienes permisos para ver esta sección');
            return;
        }

        if (usuarioActual.rol === 'encargado' && tabName === 'configuracion') {
            mostrarNotificacion('❌ No tienes permisos para ver esta sección');
            return;
        }
    }

    const tabs = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.tab-button');

    tabs.forEach(tab => tab.classList.remove('active'));
    buttons.forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabName).classList.add('active');

    // Si se pasó el elemento (botón), activarlo
    if (elemento) {
        elemento.classList.add('active');
    } else if (event && event.target) {
        // Si hay un evento global, usarlo
        event.target.classList.add('active');
    } else {
        // Si no hay elemento ni evento, buscar el botón correcto
        buttons.forEach(btn => {
            if (btn.textContent.toLowerCase().includes(tabName.toLowerCase()) ||
                btn.onclick && btn.onclick.toString().includes(tabName)) {
                btn.classList.add('active');
            }
        });
    }

    // Actualizar indicador solo si estamos en usuarios
    actualizarIndicadorUsuario();

    if (tabName === 'facturacion') {
        actualizarFacturacion();
    } else if (tabName === 'configuracion') {
        renderizarListaProductos();
        renderizarListaMesas();
    } else if (tabName === 'pedidos') {
        setTimeout(() => {
            actualizarTabPedidos();
        }, 100);
    } else if (tabName === 'inventario') {
        setTimeout(() => {
            actualizarTabInventario();
        }, 100);
    } else if (tabName === 'usuarios') {
        renderizarListaUsuarios();
        actualizarSeccionLogin();

        // Configurar teclado virtual para campos de usuarios si está activado
        if (esDispositivoTactil()) {
            setTimeout(() => {
                const inputNombre = document.getElementById('nuevoUsuarioNombre');
                const inputPin = document.getElementById('nuevoUsuarioPin');

                if (inputNombre) {
                    inputNombre.readOnly = true;
                    inputNombre.addEventListener('click', function (e) {
                        e.preventDefault();
                        this.blur();
                        abrirTecladoCompleto(this);
                    });
                }

                if (inputPin) {
                    inputPin.readOnly = true;
                    inputPin.addEventListener('click', function (e) {
                        e.preventDefault();
                        this.blur();
                        abrirTecladoNumerico(this);
                    });
                }
            }, 200);
        }
    }
}
// Función para calcular mesas por página según pantalla
function calcularMesasPorPagina() {
    const width = window.innerWidth;
    if (width >= 1400) {
        mesasPorPagina = 15; // 5x3 para pantallas grandes
    } else if (width >= 768) {
        mesasPorPagina = 12; // 4x3 para tablets/desktop
    } else {
        mesasPorPagina = 12; // 3x4 para móviles
    }
}

// Función principal para renderizar mesas con sistema TPV
function renderizarMesas() {
    // Inicializar configuración si no existe
    inicializarMesasConfig();

    // Renderizar pestañas de áreas
    renderizarPestanasMesas();

    // Renderizar mesas con paginación
    renderizarMesasPorArea();
}

// Función para renderizar pestañas de áreas para mesas
function renderizarPestanasMesas() {
    const container = document.getElementById('areasMesasTabs');
    if (!container) return;

    container.innerHTML = '';

    // Mostrar TODAS las áreas activas (con o sin mesas)
    const areasActivas = areas.filter(area => area.activa);

    // Siempre agregar "TODAS LAS MESAS" al inicio
    const tabTodas = document.createElement('button');
    tabTodas.className = 'area-mesa-tab';
    tabTodas.textContent = '🪑 TODAS LAS MESAS';
    tabTodas.onclick = () => cambiarAreaMesas(null);
    container.appendChild(tabTodas);

    // Agregar pestañas por área
    areasActivas.forEach(area => {
        const tab = document.createElement('button');
        tab.className = 'area-mesa-tab';

        // Solo texto, sin emoji
        tab.textContent = area.nombre.toUpperCase();
        tab.onclick = () => cambiarAreaMesas(area.id);

        container.appendChild(tab);
    });

    // Si no hay área activa, activar "TODAS"
    if (!areaActivaMesas) {
        areaActivaMesas = null;
        tabTodas.classList.add('active');
    }
}

// Función para cambiar área activa
function cambiarAreaMesas(areaId) {
    areaActivaMesas = areaId;
    paginaActualMesas = 1; // Resetear a página 1

    // Actualizar pestañas activas
    const tabs = document.querySelectorAll('.area-mesa-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Activar pestaña clickeada
    if (event && event.target) {
        event.target.classList.add('active');
    }

    // Renderizar mesas filtradas
    renderizarMesasPorArea();

}

// Función para renderizar mesas por área con paginación
function renderizarMesasPorArea() {
    const grid = document.getElementById('mesasGrid');
    if (!grid) return;

    // Calcular mesas por página
    calcularMesasPorPagina();

    // Filtrar mesas por área activa
    const mesasActivas = mesasConfig.filter(m => m.activa);

    if (areaActivaMesas) {
        mesasFiltradas = mesasActivas.filter(m => m.area === areaActivaMesas);
    } else {
        mesasFiltradas = mesasActivas;
    }

    // Calcular total de páginas
    totalPaginasMesas = Math.ceil(mesasFiltradas.length / mesasPorPagina);
    if (totalPaginasMesas === 0) totalPaginasMesas = 1;

    // Validar página actual
    if (paginaActualMesas > totalPaginasMesas) {
        paginaActualMesas = 1;
    }

    // Actualizar controles de paginación
    actualizarControlesPaginacionMesas();

    // Limpiar grid
    grid.innerHTML = '';
    grid.className = 'mesas-grid-tpv';

    // Si no hay mesas
    if (mesasFiltradas.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #888;">
                <h3>😔 No hay mesas en esta área</h3>
                <p>Ve a Configuración para agregar mesas</p>
            </div>
        `;
        return;
    }

    // Calcular índices para esta página
    const inicio = (paginaActualMesas - 1) * mesasPorPagina;
    const fin = Math.min(inicio + mesasPorPagina, mesasFiltradas.length);

    // Renderizar mesas
    for (let i = 0; i < mesasPorPagina; i++) {
        const mesaIndex = inicio + i;
        const mesaConfig = mesasFiltradas[mesaIndex];

        if (mesaConfig) {
            const mesaDiv = crearElementoMesa(mesaConfig);
            grid.appendChild(mesaDiv);
        } else {
            // Celda vacía
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'mesa-empty';
            grid.appendChild(emptyDiv);
        }
    }
}
// Función para crear elemento de mesa
function crearElementoMesa(mesaConfig) {
    const mesaId = mesaConfig.id;

    // Inicializar array si no existe
    if (!mesas[mesaId]) mesas[mesaId] = [];

    const total = calcularTotalMesa(mesaId);
    const div = document.createElement('div');
    div.className = `mesa-tpv ${total > 0 ? 'ocupada' : ''}`;
    div.onclick = () => abrirMesa(mesaId);

    // Información de la mesa
    let mesaInfo = '';
    if (mesaConfig.capacidad > 0) {
        mesaInfo += `👥 ${mesaConfig.capacidad}`;
    }
    if (mesaConfig.descripcion) {
        if (mesaInfo) mesaInfo += ' • ';
        mesaInfo += mesaConfig.descripcion;
    }

    div.innerHTML = `
        <h3>${mesaConfig.nombre}</h3>
        ${mesaInfo ? `<div class="mesa-info">${mesaInfo}</div>` : ''}
        <div class="mesa-total">${total > 0 ? `€${total.toFixed(2)}` : 'Libre'}</div>
    `;

    return div;
}

// Funciones de navegación de páginas para mesas
function paginaAnteriorMesas() {
    if (paginaActualMesas > 1) {
        paginaActualMesas--;
        renderizarMesasPorArea();
    }
}

function paginaSiguienteMesas() {
    if (paginaActualMesas < totalPaginasMesas) {
        paginaActualMesas++;
        renderizarMesasPorArea();
    }
}

function irAPaginaMesas(pagina) {
    if (pagina >= 1 && pagina <= totalPaginasMesas) {
        paginaActualMesas = pagina;
        renderizarMesasPorArea();
    }
}


// Función para actualizar controles de paginación
function actualizarControlesPaginacionMesas() {
    // Actualizar números
    const paginaActual = document.getElementById('paginaActualMesas');
    const totalPaginas = document.getElementById('totalPaginasMesas');

    if (paginaActual) paginaActual.textContent = paginaActualMesas;
    if (totalPaginas) totalPaginas.textContent = totalPaginasMesas;

    // Actualizar botones
    const btnPrev = document.getElementById('btnPrevMesas');
    const btnNext = document.getElementById('btnNextMesas');

    if (btnPrev) {
        btnPrev.disabled = paginaActualMesas === 1;
        btnPrev.style.opacity = btnPrev.disabled ? '0.3' : '1';
    }

    if (btnNext) {
        btnNext.disabled = paginaActualMesas >= totalPaginasMesas;
        btnNext.style.opacity = btnNext.disabled ? '0.3' : '1';
    }

    // Actualizar dots
    actualizarDotsPaginacionMesas();

    // Mostrar/ocultar controles según hay mesas
    const paginacionTop = document.querySelector('.mesas-paginacion-top');
    if (paginacionTop) {
        paginacionTop.style.visibility = mesasFiltradas.length > 0 ? 'visible' : 'hidden';
    }
}


// Función para actualizar dots de paginación
function actualizarDotsPaginacionMesas() {
    const dotsContainer = document.getElementById('mesasDots');
    if (!dotsContainer) return;

    dotsContainer.innerHTML = '';

    // Solo mostrar dots si hay más de una página
    if (totalPaginasMesas > 1) {
        for (let i = 1; i <= Math.min(totalPaginasMesas, 10); i++) {
            const dot = document.createElement('span');
            dot.className = 'dot-mesa';
            if (i === paginaActualMesas) dot.classList.add('active');
            dot.onclick = () => irAPaginaMesas(i);
            dotsContainer.appendChild(dot);
        }
    }
}