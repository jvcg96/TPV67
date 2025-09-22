function calcularTotalMesa(numMesa) {
    return mesas[numMesa].reduce((total, item) => total + item.precio, 0);
}

async function abrirMesa(mesaId) {
    const mesaConfig = mesasConfig.find(m => m.id === mesaId);
    if (!mesaConfig) return;

    // Esperar a que IndexedDB esté lista
    try {
        await DB.waitForReady();
    } catch (error) {
        console.error('Error: IndexedDB no está lista:', error);
        // Continuar de todos modos, las imágenes usarán emoji como fallback
    }

    mesaActual = mesaId;
    document.getElementById('mesaTitulo').textContent = mesaConfig.nombre;

    // Crear estructura de dos columnas si no existe
    let modalContent = document.querySelector('#mesaModal .modal-content');
    let modalBody = modalContent.querySelector('.modal-body');

    if (!modalBody) {
        // Crear estructura de columnas
        const titulo = modalContent.querySelector('h2');
        const ticketActual = modalContent.querySelector('.ticket');
        const botones = modalContent.querySelector('div[style*="margin-top: 30px"]');

        // Limpiar modal
        modalContent.innerHTML = '';

        // Reconstruir con layout de columnas
        modalContent.appendChild(titulo);

        // NUEVO: Añadir contenedor de pestañas de categorías
        const pestañasContainer = document.createElement('div');
        pestañasContainer.id = 'categoriasTabs';
        pestañasContainer.className = 'categorias-tabs';
        modalContent.appendChild(pestañasContainer);

        modalBody = document.createElement('div');
        modalBody.className = 'modal-body';

        // Sección de productos (izquierda)
        const productosSection = document.createElement('div');
        productosSection.className = 'productos-section';
        productosSection.innerHTML = `
        <div class="productos-grid" id="productosGrid"></div>
    `;

        // Sección de ticket (derecha)
        const ticketSection = document.createElement('div');
        ticketSection.className = 'ticket-section';
        ticketSection.appendChild(ticketActual);

        modalBody.appendChild(productosSection);
        modalBody.appendChild(ticketSection);
        modalContent.appendChild(modalBody);
        modalContent.appendChild(botones);
    }

    // NUEVO: Renderizar pestañas de categorías dinámicas
    renderizarPestanasCategorias();

    actualizarTicket();
    document.getElementById('mesaModal').style.display = 'block';
    paginaActualProductos = 1;
}

function agregarProducto(producto) {
    // Si el producto NO tiene control de stock, agregarlo directamente
    if (producto.controlStock === false) {
        // Agregar sin restricciones
        mesas[mesaActual].push({
            ...producto,
            timestamp: new Date().toISOString()
        });

        actualizarTicket();
        renderizarMesas();
        guardarEstadoMesas();
        return;
    }

    // Si TIENE control de stock, aplicar todas las validaciones
    const stockReservado = calcularStockReservado(producto.id);
    const stockDisponible = producto.stock - stockReservado;

    if (stockDisponible <= 0) {
        mostrarNotificacion(`❌ ${producto.nombre} agotado (todo el stock está reservado en mesas)`);
        return;
    }

    if (stockDisponible <= 1 && producto.stock > producto.stockMinimo) {
        mostrarNotificacion(`⚠️ Último ${producto.nombre} disponible`);
    }

    // AGREGAR PRODUCTO UNA SOLA VEZ
    mesas[mesaActual].push({
        ...producto,  // Esto copia TODAS las propiedades incluidas categoria y area
        timestamp: new Date().toISOString(),
        reservado: true
    });

    actualizarTicket();
    renderizarMesas();
    actualizarStockEnProductos();
    guardarEstadoMesas();

    const nuevoStockDisponible = stockDisponible - 1;
    // mostrarNotificacion(`✅ ${producto.emoji} ${producto.nombre} agregado (Quedan: ${nuevoStockDisponible})`);
}

// NUEVA FUNCIÓN: Calcular stock reservado en todas las mesas
function calcularStockReservado(productoId) {
    let reservado = 0;
    Object.values(mesas).forEach(mesa => {
        mesa.forEach(item => {
            if (item.id === productoId) {
                reservado++;
            }
        });
    });
    return reservado;
}

function actualizarStockEnProductos() {
    // Solo actualizar si el modal de mesa está abierto
    if (document.getElementById('mesaModal').style.display !== 'block') return;

    const grid = document.getElementById('productosGrid');
    if (!grid) return;

    // Actualizar cada botón de producto
    productos.forEach(producto => {
        const btn = grid.querySelector(`[data-producto-id="${producto.id}"]`);
        if (!btn) return;

        const stockSpan = btn.querySelector('.stock-info');
        if (!stockSpan) return;

        // Si no tiene control de stock, mantener como ilimitado
        if (producto.controlStock === false) {
            stockSpan.textContent = '♾️ Ilimitado';
            stockSpan.style.color = '#22c55e';
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            return;
        }

        // Si tiene control de stock, calcular disponibilidad
        const stockReservado = calcularStockReservado(producto.id);
        const stockDisponible = producto.stock - stockReservado;

        if (stockDisponible <= 0) {
            stockSpan.textContent = 'AGOTADO';
            stockSpan.style.color = '#ff6b6b';
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.onclick = () => {
                mostrarNotificacion(`❌ ${producto.nombre} agotado`);
            };
        } else if (stockDisponible <= producto.stockMinimo) {
            stockSpan.textContent = `Quedan: ${stockDisponible}`;
            stockSpan.style.color = '#ffa502';
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.onclick = () => agregarProducto(producto);
        } else {
            stockSpan.textContent = `Stock: ${stockDisponible}`;
            stockSpan.style.color = '#888';
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.onclick = () => agregarProducto(producto);
        }
    });
}
function reducirStock(productoId) {
    const producto = productos.find(p => p.id === productoId);
    if (producto && producto.stock > 0) {
        const stockAnterior = producto.stock;
        producto.stock--;

        // Registrar movimiento de stock
        registrarMovimientoStock(producto, stockAnterior, producto.stock, 'Venta - Reducción automática');

        localStorage.setItem('productosPersonalizados', JSON.stringify(productos));

        // Actualizar visualización si estamos en productos
        if (document.getElementById('listaProductos')) {
            renderizarListaProductos();
        }

        // Actualizar productos en modal si está abierto
        if (mesaActual !== null) {
            const grid = document.getElementById('productosGrid');
            if (grid) {
                const btn = grid.querySelector(`[data-producto-id="${productoId}"]`);
                if (btn) {
                    const stockSpan = btn.querySelector('.stock-info');
                    if (stockSpan) {
                        stockSpan.textContent = `Stock: ${producto.stock}`;
                        stockSpan.style.color = producto.stock <= producto.stockMinimo ? '#ff6b6b' : '#888';
                    }
                }
            }
        }
    }
}

function obtenerProductosBajoStock() {
    return productos.filter(p => p.stock <= p.stockMinimo && p.stock > 0);
}

function obtenerProductosSinStock() {
    return productos.filter(p => p.stock <= 0);
}
function actualizarTicket() {
    const container = document.getElementById('ticketItems');
    container.innerHTML = '';

    // Agrupar productos
    const grupos = {};
    mesas[mesaActual].forEach(item => {
        if (!grupos[item.id]) {
            grupos[item.id] = {
                nombre: item.nombre,
                precio: item.precio,
                cantidad: 0,
                emoji: item.emoji
            };
        }
        grupos[item.id].cantidad++;
    });

    // Mostrar productos agrupados de forma COMPACTA
    Object.values(grupos).forEach(grupo => {
        const div = document.createElement('div');
        div.className = 'ticket-item';

        // Formato compacto: cantidad + emoji + nombre en una línea
        const nombreCompleto = grupo.cantidad > 1 ?
            `${grupo.cantidad}x ${grupo.emoji} ${grupo.nombre}` :
            `${grupo.emoji} ${grupo.nombre}`;

        div.innerHTML = `
            <span class="producto-info">${nombreCompleto}</span>
            <span class="precio-info">€${(grupo.precio * grupo.cantidad).toFixed(2)}</span>
        `;
        container.appendChild(div);
    });

    // Actualizar total
    const total = calcularTotalMesa(mesaActual);
    document.getElementById('totalMesa').textContent = `Total: €${total.toFixed(2)}`;
}

function limpiarMesa() {
    // PRIMERO verificar que hay productos
    if (!mesas[mesaActual] || mesas[mesaActual].length === 0) {
        alert('La mesa ya está vacía');
        return;
    }

    if (confirm('¿Limpiar todos los productos de la mesa?')) {
        // Con el nuevo sistema, NO restauramos stock porque nunca se redujo
        // El stock solo se reduce al COBRAR, no al agregar a la mesa

        // Obtener info para la notificación
        const totalItems = mesas[mesaActual].length;
        const productosUnicos = new Set(mesas[mesaActual].map(item => item.id)).size;

        // Limpiar la mesa
        mesas[mesaActual] = [];
        actualizarTicket();
        renderizarMesas();

        // NUEVO: Actualizar estado temporal de mesas
        guardarEstadoMesas();

        // Actualizar vista de productos si el modal está abierto
        if (document.getElementById('mesaModal').style.display === 'block') {
            abrirMesa(mesaActual);
        }

        // Mostrar notificación
        mostrarNotificacion(`🔄 Mesa limpiada: ${totalItems} items (${productosUnicos} productos diferentes)`);
    }
}

function cerrarModal() {
    document.getElementById('mesaModal').style.display = 'none';
    mesaActual = null;
    cerrarTodosLosTeclados();
}

// NUEVA FUNCIÓN: Guardar estado de mesas temporalmente
function guardarEstadoMesas() {
    const estadoMesas = {
        mesas: mesas,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('mesasTemporales', JSON.stringify(estadoMesas));
}

// NUEVA FUNCIÓN: Recuperar estado de mesas
function recuperarEstadoMesas() {
    const estadoGuardado = localStorage.getItem('mesasTemporales');
    if (estadoGuardado) {
        try {
            const estado = JSON.parse(estadoGuardado);
            // Solo recuperar si los datos son de las últimas 24 horas
            const hace24Horas = new Date();
            hace24Horas.setHours(hace24Horas.getHours() - 24);

            if (new Date(estado.timestamp) > hace24Horas) {
                return estado.mesas;
            }
        } catch (error) {
            console.error('Error al recuperar estado de mesas:', error);
        }
    }
    return null;
}
