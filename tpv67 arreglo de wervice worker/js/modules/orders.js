// Función para inicializar filtros de pedidos
function inicializarFiltrosPedidos() {
    // Establecer fecha actual
    const hoy = new Date();
    document.getElementById('filtroFecha').value = hoy.toISOString().split('T')[0];

    // Llenar select de mesas
    const selectMesa = document.getElementById('filtroMesa');
    selectMesa.innerHTML = '<option value="">Todas las mesas</option>';

    const mesasActivas = mesasConfig.filter(m => m.activa);
    mesasActivas.forEach(mesa => {
        const option = document.createElement('option');
        option.value = mesa.id;
        option.textContent = mesa.nombre;
        selectMesa.appendChild(option);
    });

    // Aplicar filtros iniciales
    aplicarFiltrosPedidos();
}

async function aplicarFiltrosPedidos() {
    const fecha = document.getElementById('filtroFecha').value;
    const mesa = document.getElementById('filtroMesa').value;
    const horaDesde = document.getElementById('filtroHoraDesde').value;
    const horaHasta = document.getElementById('filtroHoraHasta').value;

    try {
        // Obtener datos desde IndexedDB
        const todosLosPedidos = await DB.obtenerFacturacion();

        pedidosFiltrados = todosLosPedidos.filter(pedido => {
            const fechaPedido = new Date(pedido.fecha);
            const fechaStr = fechaPedido.toISOString().split('T')[0];

            // Filtro por fecha
            if (fecha && fechaStr !== fecha) return false;

            // Filtro por mesa
            if (mesa && pedido.mesa.toString() !== mesa) return false;

            // Filtro por hora
            if (horaDesde || horaHasta) {
                const horaPedido = fechaPedido.getHours() * 60 + fechaPedido.getMinutes();

                if (horaDesde) {
                    const [horaD, minD] = horaDesde.split(':');
                    const minutosDesde = parseInt(horaD) * 60 + parseInt(minD);
                    if (horaPedido < minutosDesde) return false;
                }

                if (horaHasta) {
                    const [horaH, minH] = horaHasta.split(':');
                    const minutosHasta = parseInt(horaH) * 60 + parseInt(minH);
                    if (horaPedido > minutosHasta) return false;
                }
            }

            return true;
        });

        actualizarEstadisticasHora();
        renderizarListaPedidos();

    } catch (error) {
        console.error('Error al filtrar pedidos:', error);
        pedidosFiltrados = [];
    }
}

// Función para limpiar filtros
function limpiarFiltrosPedidos() {
    document.getElementById('filtroFecha').value = '';
    document.getElementById('filtroMesa').value = '';
    document.getElementById('filtroHoraDesde').value = '';
    document.getElementById('filtroHoraHasta').value = '';
    aplicarFiltrosPedidos();
}

// Función para actualizar estadísticas por hora
function actualizarEstadisticasHora() {
    const container = document.getElementById('estadisticasHora');
    if (!container) return;

    container.innerHTML = '';

    // Agrupar por hora
    const ventasPorHora = {};
    let totalPedidos = 0;
    let totalVentas = 0;

    pedidosFiltrados.forEach(pedido => {
        const fecha = new Date(pedido.fecha);
        const hora = fecha.getHours();

        if (!ventasPorHora[hora]) {
            ventasPorHora[hora] = {
                pedidos: 0,
                total: 0
            };
        }

        ventasPorHora[hora].pedidos++;
        ventasPorHora[hora].total += pedido.total;
        totalPedidos++;
        totalVentas += pedido.total;
    });

    // Crear cards de resumen
    const cardResumen = document.createElement('div');
    cardResumen.style.cssText = `
        background: rgba(255, 107, 107, 0.1);
        border: 1px solid rgba(255, 107, 107, 0.3);
        padding: 15px;
        border-radius: 10px;
        text-align: center;
        grid-column: 1 / -1;
        margin-bottom: 15px;
    `;
    cardResumen.innerHTML = `
        <h4 style="color: #ffa502; margin-bottom: 10px;">📊 Resumen Total</h4>
        <div style="display: flex; justify-content: space-around; text-align: center;">
            <div>
                <div style="font-size: 1.5em; font-weight: bold; color: #fff;">${totalPedidos}</div>
                <div style="color: #888; font-size: 0.9em;">Pedidos</div>
            </div>
            <div>
                <div style="font-size: 1.5em; font-weight: bold; color: #ffa502;">€${totalVentas.toFixed(2)}</div>
                <div style="color: #888; font-size: 0.9em;">Total</div>
            </div>
        </div>
    `;
    container.appendChild(cardResumen);

    // Crear cards por hora (solo mostrar horas con datos)
    Object.keys(ventasPorHora).sort((a, b) => parseInt(a) - parseInt(b)).forEach(hora => {
        const datos = ventasPorHora[hora];

        const card = document.createElement('div');
        card.style.cssText = `
            background: rgba(40, 40, 40, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
        `;

        card.innerHTML = `
            <h4 style="color: #ffa502; margin-bottom: 10px;">⏰ ${hora.toString().padStart(2, '0')}:00</h4>
            <div style="color: #fff; font-size: 1.2em; font-weight: bold; margin-bottom: 5px;">${datos.pedidos} pedidos</div>
            <div style="color: #888; font-size: 0.9em;">€${datos.total.toFixed(2)}</div>
        `;

        card.onclick = () => filtrarPorHora(parseInt(hora));
        card.onmouseover = () => {
            card.style.transform = 'translateY(-3px)';
            card.style.borderColor = 'rgba(255, 107, 107, 0.5)';
        };
        card.onmouseout = () => {
            card.style.transform = 'translateY(0)';
            card.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        };

        container.appendChild(card);
    });
}

// Función para filtrar por hora específica
function filtrarPorHora(hora) {
    if (!document.getElementById('filtroHoraDesde')) return;

    document.getElementById('filtroHoraDesde').value = `${hora.toString().padStart(2, '0')}:00`;
    document.getElementById('filtroHoraHasta').value = `${hora.toString().padStart(2, '0')}:59`;
    aplicarFiltrosPedidos();
}

// Función para renderizar lista de pedidos
function renderizarListaPedidos() {
    const container = document.getElementById('listaPedidos');
    if (!container) return;

    container.innerHTML = '';

    if (pedidosFiltrados.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #888;">No hay pedidos que coincidan con los filtros</p>';
        return;
    }

    // Ordenar por fecha más reciente primero
    const pedidosOrdenados = [...pedidosFiltrados].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    pedidosOrdenados.forEach(pedido => {
        const fecha = new Date(pedido.fecha);
        const mesaConfig = mesasConfig.find(m => m.id === pedido.mesa);
        const nombreMesa = mesaConfig ? mesaConfig.nombre : `Mesa ${pedido.mesa}`;

        const item = document.createElement('div');
        item.style.cssText = `
            background: rgba(40, 40, 40, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 15px;
            transition: all 0.3s ease;
        `;

        // Agrupar productos para mostrar
        const productosAgrupados = {};
        pedido.items.forEach(item => {
            if (!productosAgrupados[item.id]) {
                productosAgrupados[item.id] = {
                    nombre: item.nombre,
                    precio: item.precio,
                    emoji: item.emoji,
                    cantidad: 0
                };
            }
            productosAgrupados[item.id].cantidad++;
        });

        const productosHtml = Object.values(productosAgrupados).map(prod => `
            <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                <span>${prod.emoji} ${prod.cantidad}x ${prod.nombre}</span>
                <span style="color: #ffa502;">€${(prod.precio * prod.cantidad).toFixed(2)}</span>
            </div>
        `).join('');

        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="font-size: 1.2em;">🧾</span>
                    <div>
                        <h4 style="color: #fff; margin: 0; font-size: 1.1em;">${nombreMesa}</h4>
                        <p style="color: #888; margin: 0; font-size: 0.9em;">
                            📅 ${fecha.toLocaleDateString('es-ES')} - 
                            ⏰ ${fecha.toLocaleTimeString('es-ES')}
                        </p>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.3em; font-weight: bold; color: #ffa502;">€${pedido.total.toFixed(2)}</div>
                    <button onclick="verDetallePedido(${pedido.mesa}, '${pedido.fecha}')" style="background: #4a5568; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 12px; margin-top: 5px; transition: all 0.3s ease;">👁️ Ver Detalle</button>
                </div>
            </div>
            <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 15px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                    ${productosHtml}
                </div>
            </div>
        `;

        item.onmouseover = () => {
            item.style.background = 'rgba(50, 50, 50, 0.9)';
            item.style.borderColor = 'rgba(255, 107, 107, 0.3)';
        };
        item.onmouseout = () => {
            item.style.background = 'rgba(40, 40, 40, 0.9)';
            item.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        };

        container.appendChild(item);
    });
}

// Función para ver detalle de pedido
async function verDetallePedido(mesa, fecha) {
    // Primero intentar buscar en el array local
    let pedido = facturacion.find(p => p.mesa === mesa && p.fecha === fecha);

    // Si no está en memoria, buscarlo en IndexedDB
    if (!pedido) {
        try {
            const todosPedidos = await DB.obtenerFacturacion();
            pedido = todosPedidos.find(p => p.mesa === mesa && p.fecha === fecha);
        } catch (error) {
            console.error('Error al buscar pedido:', error);
            alert('Error al cargar el detalle del pedido');
            return;
        }
    }

    if (!pedido) {
        alert('No se encontró el pedido solicitado');
        return;
    }

    const fechaObj = new Date(pedido.fecha);
    const mesaConfig = mesasConfig.find(m => m.id === pedido.mesa);
    const nombreMesa = mesaConfig ? mesaConfig.nombre : `Mesa ${pedido.mesa}`;

    // Agrupar items por producto
    const itemsAgrupados = {};
    pedido.items.forEach(item => {
        if (!itemsAgrupados[item.id]) {
            itemsAgrupados[item.id] = {
                nombre: item.nombre,
                precio: item.precio,
                emoji: item.emoji,
                cantidad: 0
            };
        }
        itemsAgrupados[item.id].cantidad++;
    });

    const detalle = Object.values(itemsAgrupados).map(item =>
        `${item.emoji} ${item.cantidad}x ${item.nombre} - €${(item.precio * item.cantidad).toFixed(2)}`
    ).join('\n');

    const mensaje = `🧾 DETALLE DEL PEDIDO\n\n` +
        `🪑 Mesa: ${nombreMesa}\n` +
        `📅 Fecha: ${fechaObj.toLocaleDateString('es-ES')}\n` +
        `⏰ Hora: ${fechaObj.toLocaleTimeString('es-ES')}\n\n` +
        `📋 PRODUCTOS:\n${detalle}\n\n` +
        `💰 TOTAL: €${pedido.total.toFixed(2)}`;

    alert(mensaje);
}


// Función para actualizar la pestaña de pedidos
function actualizarTabPedidos() {
    inicializarFiltrosPedidos();

    // Mostrar panel de búsqueda avanzada según licencia
    const panelContainer = document.getElementById('panelBusquedaAvanzada');
    if (panelContainer) {
        const panel = mostrarPanelBusquedaAvanzada();
        if (panel) {
            panelContainer.innerHTML = '';
            panelContainer.appendChild(panel);
        }
    }
}

// Función para exportar pedidos a CSV
function exportarPedidosCSV() {
    if (pedidosFiltrados.length === 0) {
        alert('No hay pedidos para exportar con los filtros actuales');
        return;
    }

    // Crear encabezados CSV
    const encabezados = ['Fecha', 'Hora', 'Mesa', 'Producto', 'Emoji', 'Cantidad', 'Precio Unitario', 'Precio Total', 'Total Pedido'];
    let csvContent = encabezados.join(',') + '\n';

    // Agregar datos
    pedidosFiltrados.forEach(pedido => {
        const fecha = new Date(pedido.fecha);
        const fechaStr = fecha.toLocaleDateString('es-ES');
        const horaStr = fecha.toLocaleTimeString('es-ES');
        const mesaConfig = mesasConfig.find(m => m.id === pedido.mesa);
        const nombreMesa = mesaConfig ? mesaConfig.nombre : `Mesa ${pedido.mesa}`;

        // Agrupar productos
        const productosAgrupados = {};
        pedido.items.forEach(item => {
            if (!productosAgrupados[item.id]) {
                productosAgrupados[item.id] = {
                    nombre: item.nombre,
                    precio: item.precio,
                    emoji: item.emoji,
                    cantidad: 0
                };
            }
            productosAgrupados[item.id].cantidad++;
        });

        // Agregar cada producto agrupado
        Object.values(productosAgrupados).forEach(prod => {
            const fila = [
                fechaStr,
                horaStr,
                `"${nombreMesa}"`,
                `"${prod.nombre}"`,
                prod.emoji,
                prod.cantidad,
                prod.precio.toFixed(2),
                (prod.precio * prod.cantidad).toFixed(2),
                pedido.total.toFixed(2)
            ];
            csvContent += fila.join(',') + '\n';
        });
    });

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);

    const fechaActual = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `pedidos_${fechaActual}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    mostrarNotificacion('📥 Pedidos exportados a CSV correctamente');
}


