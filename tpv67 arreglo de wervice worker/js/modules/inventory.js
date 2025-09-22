// ========================================
// FUNCIONES DE GESTIÓN DE INVENTARIO
// ========================================

// Variable para almacenar historial de movimientos
let historialMovimientos = JSON.parse(localStorage.getItem('historialMovimientos')) || [];
let productoAjustandoId = null;
// Función para actualizar la pestaña de inventario
function actualizarTabInventario() {
    actualizarAlertasInventario();
    renderizarInventario();

    // Configurar teclado para el campo de búsqueda si está activado
    if (esDispositivoTactil()) {
        setTimeout(() => {
            const inputBusqueda = document.getElementById('buscarProducto');
            if (inputBusqueda) {
                inputBusqueda.readOnly = true;

                // Remover listeners anteriores
                const newInput = inputBusqueda.cloneNode(true);
                inputBusqueda.parentNode.replaceChild(newInput, inputBusqueda);

                // Agregar listener para teclado
                newInput.addEventListener('click', function (e) {
                    e.preventDefault();
                    this.blur();
                    abrirTecladoCompleto(this);
                });

                // También en focus por si acaso
                newInput.addEventListener('focus', function (e) {
                    e.preventDefault();
                    this.blur();
                    abrirTecladoCompleto(this);
                });
            }
        }, 200);
    }
}

// Función para mostrar alertas de inventario
function actualizarAlertasInventario() {
    const container = document.getElementById('alertasInventario');
    if (!container) return;

    const sinStock = obtenerProductosSinStock();
    const bajoStock = obtenerProductosBajoStock();

    container.innerHTML = '';

    if (sinStock.length > 0 || bajoStock.length > 0) {
        const alertCard = document.createElement('div');
        alertCard.style.cssText = `
            background: rgba(255, 107, 107, 0.1);
            border: 1px solid rgba(255, 107, 107, 0.3);
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 25px;
        `;

        let alertContent = '<h3 style="color: #ff6b6b; margin-bottom: 15px;">⚠️ Alertas de Inventario</h3>';

        if (sinStock.length > 0) {
            alertContent += `
                <div style="margin-bottom: 10px;">
                    <strong style="color: #ff6b6b;">🔴 Sin Stock (${sinStock.length}):</strong>
                    <span style="color: #e0e0e0;">${sinStock.map(p => p.nombre).join(', ')}</span>
                </div>
            `;
        }

        if (bajoStock.length > 0) {
            alertContent += `
                <div>
                    <strong style="color: #ffa502;">🟡 Stock Bajo (${bajoStock.length}):</strong>
                    <span style="color: #e0e0e0;">${bajoStock.map(p => `${p.nombre} (${p.stock})`).join(', ')}</span>
                </div>
            `;
        }

        alertCard.innerHTML = alertContent;
        container.appendChild(alertCard);
    }
}

// Función para mostrar alertas de stock al iniciar
function verificarStockGeneral() {
    const sinStock = obtenerProductosSinStock();
    const bajoStock = obtenerProductosBajoStock();

    if (sinStock.length > 0) {
        console.warn('🔴 Productos sin stock:', sinStock.map(p => p.nombre));
    }

    if (bajoStock.length > 0) {
        console.warn('🟡 Productos con stock bajo:', bajoStock.map(p => `${p.nombre} (${p.stock})`));
    }
}
// Función para renderizar inventario
function renderizarInventario() {
    const container = document.getElementById('listaInventario');
    if (!container) return;

    container.innerHTML = '';

    // Obtener productos filtrados
    const productosFiltrados = obtenerProductosFiltrados();

    if (productosFiltrados.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #888;">No hay productos que coincidan con los filtros</p>';
        return;
    }

    productosFiltrados.forEach(producto => {
        const item = document.createElement('div');
        item.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        `;

        const stockColor = producto.stock <= 0 ? '#ff6b6b' :
            producto.stock <= producto.stockMinimo ? '#ffa502' : '#22c55e';

        const stockIcon = producto.stock <= 0 ? '🔴' :
            producto.stock <= producto.stockMinimo ? '🟡' : '🟢';

        const stockStatus = producto.stock <= 0 ? 'SIN STOCK' :
            producto.stock <= producto.stockMinimo ? 'STOCK BAJO' : 'STOCK OK';

        item.innerHTML = `
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 8px;">
                    <span style="font-size: 1.5em;">${producto.emoji}</span>
                    <div>
                        <h4 style="color: #fff; margin: 0; font-size: 1.1em;">${producto.nombre}</h4>
                        <div style="font-size: 0.9em; color: #888; margin-top: 2px;">
                            Precio: €${producto.precio.toFixed(2)} • 
                            ${producto.area ? `📍 ${obtenerNombreArea(producto.area)} • ` : ''}
                            📂 ${obtenerNombreCategoria(producto.categoria)}
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 20px;">
                    <div>
                        <span style="color: ${stockColor}; font-weight: bold;">${stockIcon} ${producto.stock} unidades</span>
                        <span style="color: #666; margin-left: 10px;">(Mín: ${producto.stockMinimo})</span>
                    </div>
                    <div style="background: ${stockColor}20; color: ${stockColor}; padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold;">
                        ${stockStatus}
                    </div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <button onclick="ajustarStockRapido(${producto.id}, 'reducir')" 
                    style="background: #ef4444; color: white; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold;">➖</button>
                <button onclick="ajustarStockRapido(${producto.id}, 'agregar')" 
                    style="background: #22c55e; color: white; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold;">➕</button>
                <button onclick="abrirModalAjusteStockProducto(${producto.id})" 
                    style="background: #4a5568; color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-size: 14px;">⚖️ Ajustar</button>
            </div>
        `;

        item.onmouseover = () => {
            item.style.background = 'rgba(50, 50, 50, 0.5)';
        };
        item.onmouseout = () => {
            item.style.background = 'transparent';
        };

        container.appendChild(item);
    });
}

// Función para obtener productos filtrados
function obtenerProductosFiltrados() {
    const busqueda = document.getElementById('buscarProducto')?.value.toLowerCase() || '';
    const filtroStock = document.getElementById('filtroStock')?.value || 'todos';
    const filtroCategoria = document.getElementById('filtroCategoria')?.value || 'todos';
    const filtroArea = document.getElementById('filtroArea')?.value || 'todos';

    return productos.filter(producto => {
        // Filtro de búsqueda
        const coincideBusqueda = producto.nombre.toLowerCase().includes(busqueda);

        // Filtro de stock
        let coincideStock = true;
        if (filtroStock === 'agotado') {
            coincideStock = producto.stock <= 0;
        } else if (filtroStock === 'bajo') {
            coincideStock = producto.stock > 0 && producto.stock <= producto.stockMinimo;
        } else if (filtroStock === 'normal') {
            coincideStock = producto.stock > producto.stockMinimo;
        }

        // Filtro de categoría
        const coincideCategoria = filtroCategoria === 'todos' || producto.categoria === filtroCategoria;

        // Filtro de área
        let coincideArea = true;
        if (filtroArea === 'todos') {
            coincideArea = true;
        } else if (filtroArea === 'sin_area') {
            coincideArea = !producto.area || producto.area === '';
        } else {
            coincideArea = producto.area === filtroArea;
        }

        return coincideBusqueda && coincideStock && coincideCategoria && coincideArea;
    });
}


// Función para filtrar inventario
function filtrarInventario() {
    renderizarInventario();
}

// Función para limpiar filtros
function limpiarFiltrosInventario() {
    document.getElementById('buscarProducto').value = '';
    document.getElementById('filtroStock').value = 'todos';
    document.getElementById('filtroCategoria').value = 'todos';
    const filtroArea = document.getElementById('filtroArea');
    if (filtroArea) filtroArea.value = 'todos';
    renderizarInventario();
    mostrarNotificacion('🔄 Filtros de inventario limpiados');
}
// Función para ajuste rápido de stock
function ajustarStockRapido(productoId, tipo) {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;

    const stockAnterior = producto.stock;

    if (tipo === 'agregar') {
        producto.stock += 1;
    } else if (tipo === 'reducir' && producto.stock > 0) {
        producto.stock -= 1;
    } else {
        mostrarNotificacion('❌ No se puede reducir el stock por debajo de 0');
        return;
    }

    // Registrar movimiento
    registrarMovimientoStock(producto, stockAnterior, producto.stock, `Ajuste rápido: ${tipo === 'agregar' ? 'Agregar' : 'Reducir'} 1 unidad`);

    // Guardar y actualizar
    localStorage.setItem('productosPersonalizados', JSON.stringify(productos));
    renderizarInventario();
    actualizarAlertasInventario();

    const emoji = tipo === 'agregar' ? '📈' : '📉';
    mostrarNotificacion(`${emoji} ${producto.nombre}: ${stockAnterior} → ${producto.stock}`);
}

// Función para abrir modal de ajuste de stock
function abrirModalAjusteStockProducto(productoId) {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;

    productoAjustandoId = productoId;

    document.getElementById('nombreProductoAjuste').textContent = `${producto.emoji} ${producto.nombre}`;
    document.getElementById('stockActualAjuste').textContent = `Stock actual: ${producto.stock} unidades`;
    document.getElementById('tipoAjuste').value = 'establecer';
    document.getElementById('cantidadAjuste').value = '';
    document.getElementById('motivoAjuste').value = '';

    toggleCamposAjuste();
    document.getElementById('modalAjusteStock').style.display = 'block';

    // Configurar teclados virtuales si están activados
    if (esDispositivoTactil()) {
        setTimeout(() => {
            // Campo de cantidad - Teclado numérico
            const inputCantidad = document.getElementById('cantidadAjuste');
            if (inputCantidad) {
                inputCantidad.readOnly = true;
                const newInputCantidad = inputCantidad.cloneNode(true);
                inputCantidad.parentNode.replaceChild(newInputCantidad, inputCantidad);

                newInputCantidad.addEventListener('click', function (e) {
                    e.preventDefault();
                    this.blur();
                    abrirTecladoNumerico(this);
                });
            }

            // Campo de motivo - Teclado completo
            const inputMotivo = document.getElementById('motivoAjuste');
            if (inputMotivo) {
                inputMotivo.readOnly = true;
                const newInputMotivo = inputMotivo.cloneNode(true);
                inputMotivo.parentNode.replaceChild(newInputMotivo, inputMotivo);

                newInputMotivo.addEventListener('click', function (e) {
                    e.preventDefault();
                    this.blur();
                    abrirTecladoCompleto(this);
                });
            }
        }, 200);
    } else {
        // Si no es táctil, hacer focus normal
        setTimeout(() => {
            document.getElementById('cantidadAjuste').focus();
        }, 100);
    }
}
function editarStockProducto(id) {
    // Usar el modal de ajuste de stock en lugar de prompt
    abrirModalAjusteStockProducto(id);
}
// Función para mostrar modal de ajuste general
function abrirModalAjusteStock() {
    // Si no hay un producto específico, mostrar lista para seleccionar
    if (productos.length === 0) {
        alert('No hay productos registrados');
        return;
    }

    // Abrir con el primer producto como ejemplo
    abrirModalAjusteStockProducto(productos[0].id);
}

// Función para cambiar campos según tipo de ajuste
function toggleCamposAjuste() {
    const tipo = document.getElementById('tipoAjuste').value;
    const labelCantidad = document.getElementById('labelCantidad');

    if (tipo === 'establecer') {
        labelCantidad.textContent = '📦 Nueva cantidad total:';
    } else if (tipo === 'agregar') {
        labelCantidad.textContent = '➕ Cantidad a agregar:';
    } else if (tipo === 'reducir') {
        labelCantidad.textContent = '➖ Cantidad a reducir:';
    }

    actualizarPrevisualizacionAjuste();
}
// Función para actualizar previsualización
function actualizarPrevisualizacionAjuste() {
    if (!productoAjustandoId) return;

    const producto = productos.find(p => p.id === productoAjustandoId);
    if (!producto) return;

    const tipo = document.getElementById('tipoAjuste').value;
    const cantidad = parseInt(document.getElementById('cantidadAjuste').value) || 0;

    document.getElementById('stockPrevioAjuste').textContent = producto.stock;

    let nuevoStock = producto.stock;

    if (tipo === 'establecer') {
        nuevoStock = cantidad;
    } else if (tipo === 'agregar') {
        nuevoStock = producto.stock + cantidad;
    } else if (tipo === 'reducir') {
        nuevoStock = Math.max(0, producto.stock - cantidad);
    }

    const elemento = document.getElementById('stockResultanteAjuste');
    elemento.textContent = nuevoStock;

    // Cambiar color según el resultado
    if (nuevoStock <= 0) {
        elemento.style.color = '#ff6b6b';
    } else if (nuevoStock <= producto.stockMinimo) {
        elemento.style.color = '#ffa502';
    } else {
        elemento.style.color = '#22c55e';
    }
}

// Función para confirmar ajuste de stock
function confirmarAjusteStock() {
    if (!productoAjustandoId) return;

    const producto = productos.find(p => p.id === productoAjustandoId);
    if (!producto) return;

    const tipo = document.getElementById('tipoAjuste').value;
    const cantidad = parseInt(document.getElementById('cantidadAjuste').value);
    const motivo = document.getElementById('motivoAjuste').value.trim() || 'Ajuste manual';

    if (isNaN(cantidad) || cantidad < 0) {
        alert('Por favor ingresa una cantidad válida');
        return;
    }

    const stockAnterior = producto.stock;
    let nuevoStock = stockAnterior;

    if (tipo === 'establecer') {
        nuevoStock = cantidad;
    } else if (tipo === 'agregar') {
        nuevoStock = stockAnterior + cantidad;
    } else if (tipo === 'reducir') {
        nuevoStock = Math.max(0, stockAnterior - cantidad);
        if (stockAnterior - cantidad < 0) {
            if (!confirm(`La cantidad a reducir (${cantidad}) es mayor al stock actual (${stockAnterior}).\n¿Establecer stock en 0?`)) {
                return;
            }
        }
    }

    // Actualizar stock
    producto.stock = nuevoStock;

    // Registrar movimiento
    const descripcionMovimiento = `${tipo.charAt(0).toUpperCase() + tipo.slice(1)}: ${motivo}`;
    registrarMovimientoStock(producto, stockAnterior, nuevoStock, descripcionMovimiento);

    // Guardar y actualizar interfaces
    localStorage.setItem('productosPersonalizados', JSON.stringify(productos));
    renderizarInventario();
    actualizarAlertasInventario();
    renderizarListaProductos(); // Actualizar pestaña de configuración si está abierta

    // Cerrar modal
    cerrarModalAjusteStock();

    // Mostrar notificación
    const emoji = nuevoStock > stockAnterior ? '📈' : nuevoStock < stockAnterior ? '📉' : '📊';
    mostrarNotificacion(`${emoji} ${producto.nombre}: Stock ajustado de ${stockAnterior} a ${nuevoStock}`);
}

// Función para cerrar modal de ajuste
function cerrarModalAjusteStock() {
    document.getElementById('modalAjusteStock').style.display = 'none';
    productoAjustandoId = null;

    // Limpiar campos
    document.getElementById('cantidadAjuste').value = '';
    document.getElementById('motivoAjuste').value = '';
    document.getElementById('tipoAjuste').value = 'establecer';
    cerrarTodosLosTeclados();
}
// Función para registrar movimiento de stock
async function registrarMovimientoStock(producto, stockAnterior, stockNuevo, descripcion) {
    const movimiento = {
        fecha: new Date().toISOString(),
        productoId: producto.id,
        productoNombre: producto.nombre,
        productoEmoji: producto.emoji,
        stockAnterior: stockAnterior,
        stockNuevo: stockNuevo,
        diferencia: stockNuevo - stockAnterior,
        descripcion: descripcion,
        usuario: 'Sistema',
        tipo: stockNuevo > stockAnterior ? 'entrada' : 'salida'
    };

    try {
        // Guardar en IndexedDB
        await DB.guardarMovimiento(movimiento);

        // También mantener en memoria para compatibilidad
        historialMovimientos.unshift(movimiento);
        if (historialMovimientos.length > 500) {
            historialMovimientos = historialMovimientos.slice(0, 500);
        }
    } catch (error) {
        console.error('Error al guardar movimiento:', error);
    }
}


// Función para abrir modal de reabastecimiento
function abrirModalReabastecimiento() {
    const productosAReabastecer = productos.filter(p => p.stock <= p.stockMinimo);

    if (productosAReabastecer.length === 0) {
        alert('✅ No hay productos que necesiten reabastecimiento.\nTodos los productos tienen stock suficiente.');
        return;
    }

    // Actualizar lista de productos a reabastecer
    const lista = document.getElementById('listaReabastecimiento');
    lista.innerHTML = '';

    productosAReabastecer.forEach(producto => {
        const item = document.createElement('div');
        item.style.cssText = `
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;

        const stockColor = producto.stock <= 0 ? '#ff6b6b' : '#ffa502';

        item.innerHTML = `
            <span>${producto.emoji} ${producto.nombre}</span>
            <span style="color: ${stockColor};">Stock: ${producto.stock} (Mín: ${producto.stockMinimo})</span>
        `;

        lista.appendChild(item);
    });

    document.getElementById('modalReabastecimiento').style.display = 'block';

    setTimeout(() => {
        document.getElementById('cantidadObjetivo').focus();
        document.getElementById('cantidadObjetivo').select();
    }, 100);
}

// Función para confirmar reabastecimiento masivo
function confirmarReabastecimiento() {
    const cantidadObjetivo = parseInt(document.getElementById('cantidadObjetivo').value);
    const motivo = document.getElementById('motivoReabastecimiento').value.trim() || 'Reabastecimiento automático';

    if (isNaN(cantidadObjetivo) || cantidadObjetivo <= 0) {
        alert('Por favor ingresa una cantidad objetivo válida');
        return;
    }

    const productosAReabastecer = productos.filter(p => p.stock <= p.stockMinimo);

    if (productosAReabastecer.length === 0) {
        alert('No hay productos que necesiten reabastecimiento');
        return;
    }

    if (!confirm(`¿Reabastecer ${productosAReabastecer.length} productos a ${cantidadObjetivo} unidades cada uno?`)) {
        return;
    }

    let productosActualizados = 0;

    productosAReabastecer.forEach(producto => {
        const stockAnterior = producto.stock;
        producto.stock = cantidadObjetivo;

        registrarMovimientoStock(producto, stockAnterior, cantidadObjetivo, `Reabastecimiento masivo: ${motivo}`);
        productosActualizados++;
    });

    // Guardar y actualizar
    localStorage.setItem('productosPersonalizados', JSON.stringify(productos));
    renderizarInventario();
    actualizarAlertasInventario();
    renderizarListaProductos();

    // Cerrar modal
    cerrarModalReabastecimiento();

    // Mostrar notificación
    mostrarNotificacion(`📈 Reabastecimiento completado: ${productosActualizados} productos actualizados a ${cantidadObjetivo} unidades`);
}

// Función para cerrar modal de reabastecimiento
function cerrarModalReabastecimiento() {
    document.getElementById('modalReabastecimiento').style.display = 'none';

    // Resetear campos
    document.getElementById('cantidadObjetivo').value = '50';
    document.getElementById('motivoReabastecimiento').value = 'Reabastecimiento automático';
    cerrarTodosLosTeclados();
}

// Función para mostrar historial de movimientos
function mostrarHistorialMovimientos() {
    if (historialMovimientos.length === 0) {
        alert('📋 No hay movimientos de stock registrados');
        return;
    }

    // Crear ventana emergente con historial
    const ventana = window.open('', 'historial', 'width=800,height=600,scrollbars=yes');

    const movimientosRecientes = historialMovimientos.slice(0, 50); // Últimos 50 movimientos

    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Historial de Movimientos de Stock</title>
            <style>
                body { 
                    font-family: 'Inter', sans-serif; 
                    background: #0a0a0a; 
                    color: #e0e0e0; 
                    margin: 20px; 
                }
                h1 { 
                    color: #ffa502; 
                    text-align: center; 
                    margin-bottom: 30px; 
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    background: rgba(20, 20, 20, 0.9); 
                    border-radius: 10px; 
                    overflow: hidden;
                }
                th, td { 
                    padding: 12px; 
                    text-align: left; 
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1); 
                }
                th { 
                    background: rgba(255, 107, 107, 0.2); 
                    font-weight: bold; 
                }
                .positivo { color: #22c55e; }
                .negativo { color: #ff6b6b; }
                .neutro { color: #888; }
                .fecha { font-size: 0.9em; color: #888; }
            </style>
        </head>
        <body>
            <h1>📋 Historial de Movimientos de Stock</h1>
            <p style="text-align: center; color: #888; margin-bottom: 20px;">
                Mostrando los últimos ${movimientosRecientes.length} movimientos
            </p>
            <table>
                <thead>
                    <tr>
                        <th>Fecha/Hora</th>
                        <th>Producto</th>
                        <th>Stock Anterior</th>
                        <th>Stock Nuevo</th>
                        <th>Diferencia</th>
                        <th>Descripción</th>
                    </tr>
                </thead>
                <tbody>
    `;

    movimientosRecientes.forEach(mov => {
        const fecha = new Date(mov.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES') + ' ' + fecha.toLocaleTimeString('es-ES');
        const diferenciaClass = mov.diferencia > 0 ? 'positivo' : mov.diferencia < 0 ? 'negativo' : 'neutro';
        const diferenciaTexto = mov.diferencia > 0 ? `+${mov.diferencia}` : mov.diferencia.toString();

        html += `
            <tr>
                <td class="fecha">${fechaFormateada}</td>
                <td>${mov.productoEmoji} ${mov.productoNombre}</td>
                <td>${mov.stockAnterior}</td>
                <td>${mov.stockNuevo}</td>
                <td class="${diferenciaClass}"><strong>${diferenciaTexto}</strong></td>
                <td>${mov.descripcion}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="window.close()" style="
                    background: #4a5568; 
                    color: white; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 8px; 
                    cursor: pointer; 
                    font-size: 14px;
                ">Cerrar</button>
            </div>
        </body>
        </html>
    `;

    ventana.document.write(html);
    ventana.document.close();
}

// Función para exportar inventario a CSV
function exportarInventarioCSV() {
    if (productos.length === 0) {
        alert('No hay productos para exportar');
        return;
    }

    // Crear encabezados CSV
    const encabezados = ['ID', 'Nombre', 'Emoji', 'Precio', 'Stock Actual', 'Stock Mínimo', 'Categoría', 'Estado', 'Valor Total'];
    let csvContent = encabezados.join(',') + '\n';

    // Agregar datos de productos
    productos.forEach(producto => {
        const estado = producto.stock <= 0 ? 'SIN STOCK' :
            producto.stock <= producto.stockMinimo ? 'STOCK BAJO' : 'STOCK OK';
        const valorTotal = (producto.precio * producto.stock).toFixed(2);

        const fila = [
            producto.id,
            `"${producto.nombre}"`,
            producto.emoji,
            producto.precio.toFixed(2),
            producto.stock,
            producto.stockMinimo,
            producto.categoria,
            estado,
            valorTotal
        ];
        csvContent += fila.join(',') + '\n';
    });

    // Agregar resumen al final
    csvContent += '\n';
    csvContent += 'RESUMEN,,,,,,,\n';
    csvContent += `Total Productos,${productos.length},,,,,,\n`;
    csvContent += `Sin Stock,${obtenerProductosSinStock().length},,,,,,\n`;
    csvContent += `Stock Bajo,${obtenerProductosBajoStock().length},,,,,,\n`;

    const valorTotalInventario = productos.reduce((total, p) => total + (p.precio * p.stock), 0);
    csvContent += `Valor Total Inventario,€${valorTotalInventario.toFixed(2)},,,,,,\n`;

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);

    const fechaActual = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `inventario_${fechaActual}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    mostrarNotificacion('📥 Inventario exportado a CSV correctamente');
}
// Event listener para actualizar previsualización en tiempo real
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        const cantidadInput = document.getElementById('cantidadAjuste');
        if (cantidadInput) {
            cantidadInput.addEventListener('input', actualizarPrevisualizacionAjuste);
        }
    }, 1000);
});
// Event listeners para modales de inventario
window.addEventListener('click', function (event) {
    const modalAjuste = document.getElementById('modalAjusteStock');
    const modalReabastecimiento = document.getElementById('modalReabastecimiento');

    if (event.target == modalAjuste) {
        cerrarModalAjusteStock();
    }
    if (event.target == modalReabastecimiento) {
        cerrarModalReabastecimiento();
    }
});

// Atajos de teclado para modales de inventario
document.addEventListener('keydown', function (event) {
    // Modal de ajuste de stock
    const modalAjuste = document.getElementById('modalAjusteStock');
    if (modalAjuste && modalAjuste.style.display === 'block') {
        if (event.key === 'Escape') {
            cerrarModalAjusteStock();
        }
        if (event.key === 'Enter') {
            confirmarAjusteStock();
        }
    }

    // Modal de reabastecimiento
    const modalReabastecimiento = document.getElementById('modalReabastecimiento');
    if (modalReabastecimiento && modalReabastecimiento.style.display === 'block') {
        if (event.key === 'Escape') {
            cerrarModalReabastecimiento();
        }
        if (event.key === 'Enter') {
            confirmarReabastecimiento();
        }
    }
});