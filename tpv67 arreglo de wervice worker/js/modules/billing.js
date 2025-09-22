function cobrarMesa() {
    const total = calcularTotalMesa(mesaActual);
    if (total === 0) {
        alert('La mesa está vacía');
        return;
    }

    // Abrir modal de cobro en lugar de confirm simple
    abrirModalCobro(total);
}

// Nueva función para abrir modal de cobro
function abrirModalCobro(total) {
    // Resetear todos los valores del modal
    document.getElementById('totalACobrar').textContent = `€${total.toFixed(2)}`;
    document.getElementById('cantidadRecibida').value = '';
    document.getElementById('cambioCalculado').textContent = '€0.00';
    document.getElementById('metodoPago').value = 'efectivo';

    // Resetear estado de los botones y secciones
    const confirmarBtn = document.getElementById('confirmarCobroBtn');
    confirmarBtn.disabled = true;
    confirmarBtn.style.opacity = '0.5';

    // Asegurar que las secciones correctas estén visibles
    document.getElementById('seccionEfectivo').style.display = 'block';
    document.getElementById('seccionCambio').style.display = 'block';

    // Mostrar modal
    document.getElementById('modalCobro').style.display = 'block';


    // Establecer efectivo como método por defecto y configurar correctamente
    setTimeout(() => {
        document.getElementById('metodoPago').value = 'efectivo';
        toggleCantidadRecibida();
    }, 50);

    // Configurar teclado virtual para el campo de cantidad si es dispositivo táctil
    if (esDispositivoTactil()) {
        setTimeout(() => {
            const inputCantidad = document.getElementById('cantidadRecibida');
            inputCantidad.readOnly = true;

            // Remover listeners anteriores para evitar duplicados
            const newInput = inputCantidad.cloneNode(true);
            inputCantidad.parentNode.replaceChild(newInput, inputCantidad);

            // Agregar nuevo listener
            newInput.addEventListener('click', function (e) {
                e.preventDefault();
                this.blur();
                abrirTecladoNumerico(this);
            });
        }, 200);
    } else {
        // Solo hacer focus si NO es dispositivo táctil
        setTimeout(() => {
            document.getElementById('cantidadRecibida').focus();
            document.getElementById('cantidadRecibida').select();
        }, 100);
    }
    // Configurar checkbox de impresión
    const seccionImprimir = document.getElementById('seccionImprimir');
    const checkImprimir = document.getElementById('imprimirTicketCheck');

    if (window.printConfig && window.printConfig.enabled) {
        // Mostrar sección solo si impresión está habilitada
        seccionImprimir.style.display = 'block';

        // Por defecto DESMARCADO (el cliente debe pedirlo)
        checkImprimir.checked = false;
        checkImprimir.disabled = false; // Siempre editable
    } else {
        // Ocultar si impresión está deshabilitada
        seccionImprimir.style.display = 'none';
    }

}


// Función para calcular cambio en tiempo real
function calcularCambio() {
    const metodoPago = document.getElementById('metodoPago').value;

    // Solo calcular cambio para efectivo
    if (metodoPago !== 'efectivo') {
        return;
    }

    const total = parseFloat(document.getElementById('totalACobrar').textContent.replace('€', ''));
    const recibido = parseFloat(document.getElementById('cantidadRecibida').value) || 0;
    const cambio = recibido - total;

    const cambioElement = document.getElementById('cambioCalculado');
    const confirmarBtn = document.getElementById('confirmarCobroBtn');

    if (recibido === 0) {
        cambioElement.textContent = '€0.00';
        cambioElement.style.color = '#888';
        confirmarBtn.disabled = true;
        confirmarBtn.style.opacity = '0.5';
    } else if (recibido >= total) {
        cambioElement.textContent = `€${cambio.toFixed(2)}`;
        cambioElement.style.color = '#22c55e';
        cambioElement.style.fontWeight = 'bold';
        confirmarBtn.disabled = false;
        confirmarBtn.style.opacity = '1';

        // Si el cambio es exacto, indicarlo
        if (cambio === 0) {
            cambioElement.textContent = '✓ EXACTO';
            cambioElement.style.color = '#22c55e';
        }
    } else {
        const falta = Math.abs(cambio);
        cambioElement.textContent = `Falta: €${falta.toFixed(2)}`;
        cambioElement.style.color = '#ff6b6b';
        cambioElement.style.fontWeight = 'bold';
        confirmarBtn.disabled = true;
        confirmarBtn.style.opacity = '0.5';
    }
}

// Función para confirmar el cobro
async function confirmarCobro() {
    if (!mesaActual || !mesas[mesaActual]) {
        alert('Error: No hay mesa seleccionada');
        cerrarModalCobro();
        return;
    }

    const total = parseFloat(document.getElementById('totalACobrar').textContent.replace('€', ''));
    const metodoPago = document.getElementById('metodoPago').value;
    let recibido = 0;
    let cambio = 0;

    // Validación específica según método de pago
    if (metodoPago === 'efectivo') {
        recibido = parseFloat(document.getElementById('cantidadRecibida').value) || 0;

        if (recibido < total) {
            alert(`❌ Cantidad insuficiente\n\nTotal: €${total.toFixed(2)}\nRecibido: €${recibido.toFixed(2)}\nFalta: €${(total - recibido).toFixed(2)}`);
            return;
        }

        cambio = recibido - total;

    } else {
        // Para pagos digitales, el "recibido" es exactamente el total
        recibido = total;
        cambio = 0;

        // Validación adicional para pagos digitales
        const confirmacionPago = confirm(
            `📲 Confirmar pago digital\n\n` +
            `Método: ${metodoPago.toUpperCase()}\n` +
            `Total: €${total.toFixed(2)}\n\n` +
            `¿El cliente ha completado el pago?`
        );

        if (!confirmacionPago) {
            return;
        }
    }

    // Crear objeto de venta con validación completa
    // IMPORTANTE: Enriquecer items con categoría y área correctas
    const itemsEnriquecidos = mesas[mesaActual].map(item => {
        // Buscar el producto original para obtener categoría y área actualizadas
        const productoOriginal = productos.find(p => p.id === item.id);
        return {
            ...item,
            categoria: productoOriginal ? productoOriginal.categoria : item.categoria,
            area: productoOriginal ? productoOriginal.area : item.area
        };
    });
    // DEBUG: Ver qué se está guardando
    console.log('=== DEBUG VENTA ===');
    console.log('Items enriquecidos:', itemsEnriquecidos);
    itemsEnriquecidos.forEach(item => {
        console.log(`Producto: ${item.nombre}`);
        console.log(`  - Categoría: ${item.categoria}`);
        console.log(`  - Área: ${item.area}`);
        const prod = productos.find(p => p.id === item.id);
        if (prod) {
            console.log(`  - Producto original tiene:`);
            console.log(`    * Categoría: ${prod.categoria}`);
            console.log(`    * Área: ${prod.area}`);
        }
    });
    console.log('==================');
    const venta = {
        fecha: obtenerFechaLocal(),  //  Usar hora local de España
        mesa: mesaActual,
        total: total,
        items: itemsEnriquecidos,
        metodoPago: metodoPago,
        cantidadRecibida: recibido,
        cambio: cambio,
    };

    // Verificar productos con control de stock
    const productosConStock = {};
    mesas[mesaActual].forEach(item => {
        // Solo contar productos CON control de stock
        if (item.controlStock !== false) {
            if (!productosConStock[item.id]) {
                productosConStock[item.id] = 0;
            }
            productosConStock[item.id]++;
        }
    });

    // Reducir stock SOLO de productos con control
    Object.entries(productosConStock).forEach(([productoId, cantidad]) => {
        const producto = productos.find(p => p.id === parseInt(productoId));
        if (producto && producto.controlStock !== false) {
            const stockAnterior = producto.stock;
            producto.stock = Math.max(0, producto.stock - cantidad);

            // Registrar movimiento de stock
            registrarMovimientoStock(
                producto,
                stockAnterior,
                producto.stock,
                `Venta confirmada - Mesa ${obtenerNombreMesa(mesaActual)} - ${metodoPago}`
            );
        }
    });

    // Guardar cambios de productos
    localStorage.setItem('productosPersonalizados', JSON.stringify(productos));

    try {
        // Guardar en IndexedDB
        await DB.guardarFacturacion(venta);

        // Agregar al array local
        facturacion.push(venta);

        // Limitar array local
        if (facturacion.length > 1000) {
            facturacion = facturacion.slice(-1000);
        }

    } catch (error) {
        console.error('Error al guardar venta:', error);

        // Intentar guardar en localStorage como backup
        try {
            const ventasBackup = JSON.parse(localStorage.getItem('ventasBackup') || '[]');
            ventasBackup.push(venta);
            localStorage.setItem('ventasBackup', JSON.stringify(ventasBackup));

            mostrarNotificacion('⚠️ Venta guardada en backup local');
        } catch (backupError) {
            alert('❌ Error crítico al procesar la venta. Por favor, anota los detalles manualmente.');
            console.error('Error en backup:', backupError);
        }

        return;
    }

    // Limpiar mesa
    mesas[mesaActual] = [];
    cerrarModalCobro();
    cerrarModal();
    renderizarMesas();
    guardarDatos();
    guardarEstadoMesas();

    // ============ CÓDIGO DE IMPRESIÓN MEJORADO ============
    // Verificar si debe imprimir
    if (window.printConfig && window.printConfig.enabled) {
        const checkImpresion = document.getElementById('imprimirTicketCheck');
        const debeImprimir = checkImpresion ? checkImpresion.checked : false;

        if (debeImprimir) {
            const ticketData = {
                mesa: obtenerNombreMesa(mesaActual) || mesaActual,
                productos: itemsEnriquecidos.map(item => ({
                    nombre: item.nombre,
                    cantidad: item.cantidad || 1,
                    precio: item.precio,
                    opciones: item.opciones || []
                })),
                total: total,
                metodoPago: metodoPago === 'efectivo' ? 'Efectivo' :
                    metodoPago === 'tarjeta' ? 'Tarjeta' :
                        metodoPago === 'bizum' ? 'Bizum' :
                            'Transferencia',
                cambio: cambio,
                fecha: new Date().toLocaleString('es-ES'),
                numeroTicket: Date.now(),
                usuario: window.usuarioActual?.nombre || 'Usuario'
            };

            setTimeout(() => {
                window.printTicket(ticketData);
            }, 100);
        }
    }
    // ============ FIN DEL CÓDIGO DE IMPRESIÓN ============
    // Resetear modal
    setTimeout(() => {
        resetearModalCobro();
    }, 100);

    // Si hay cambio en efectivo, mostrar alerta adicional
    if (metodoPago === 'efectivo' && cambio > 0) {
        setTimeout(() => {
            alert(`💱 ENTREGAR CAMBIO\n\n€${cambio.toFixed(2)}`);
        }, 500);
    }
}

// Función para cerrar modal de cobro
function cerrarModalCobro() {
    // Resetear completamente el modal al cerrarlo
    document.getElementById('cantidadRecibida').value = '';
    document.getElementById('cambioCalculado').textContent = '€0.00';
    document.getElementById('metodoPago').value = 'efectivo';

    const confirmarBtn = document.getElementById('confirmarCobroBtn');
    confirmarBtn.disabled = true;
    confirmarBtn.style.opacity = '0.5';

    // Asegurar que las secciones estén en estado por defecto (efectivo)
    document.getElementById('seccionEfectivo').style.display = 'block';
    document.getElementById('seccionCambio').style.display = 'block';

    // Cerrar modal
    cerrarTodosLosTeclados();
    document.getElementById('modalCobro').style.display = 'none';

}

// Función para resetear completamente el modal de cobro
function resetearModalCobro() {
    const metodoPago = document.getElementById('metodoPago');
    const cantidadRecibida = document.getElementById('cantidadRecibida');
    const cambioCalculado = document.getElementById('cambioCalculado');
    const confirmarBtn = document.getElementById('confirmarCobroBtn');
    const seccionEfectivo = document.getElementById('seccionEfectivo');
    const seccionCambio = document.getElementById('seccionCambio');

    // Resetear valores
    metodoPago.value = 'efectivo';
    cantidadRecibida.value = '';
    cambioCalculado.textContent = '€0.00';
    cambioCalculado.style.color = '#22c55e';

    // Resetear estado del botón
    confirmarBtn.disabled = true;
    confirmarBtn.style.opacity = '0.5';

    // Mostrar secciones de efectivo por defecto
    seccionEfectivo.style.display = 'block';
    seccionCambio.style.display = 'block';
}

function toggleCantidadRecibida() {
    const metodoPago = document.getElementById('metodoPago').value;
    const seccionEfectivo = document.getElementById('seccionEfectivo');
    const seccionCambio = document.getElementById('seccionCambio');
    const confirmarBtn = document.getElementById('confirmarCobroBtn');
    const cantidadRecibida = document.getElementById('cantidadRecibida');
    const cambioCalculado = document.getElementById('cambioCalculado');
    const totalElement = document.getElementById('totalACobrar');

    if (metodoPago === 'efectivo') {
        // Mostrar secciones de efectivo
        seccionEfectivo.style.display = 'block';
        seccionCambio.style.display = 'block';

        // Resetear y preparar para entrada
        cantidadRecibida.value = '';
        cambioCalculado.textContent = '€0.00';
        cambioCalculado.style.color = '#22c55e';

        // Deshabilitar botón hasta que se ingrese cantidad válida
        confirmarBtn.disabled = true;
        confirmarBtn.style.opacity = '0.5';
        confirmarBtn.textContent = '✅ Confirmar Cobro';

        // Focus en input de cantidad (si no es táctil)
        if (!esDispositivoTactil()) {
            setTimeout(() => {
                cantidadRecibida.focus();
                cantidadRecibida.select();
            }, 50);
        }

    } else {
        // Para métodos digitales (tarjeta, bizum, transferencia)

        // Ocultar secciones de efectivo
        seccionEfectivo.style.display = 'none';
        seccionCambio.style.display = 'none';

        // IMPORTANTE: Establecer cantidad recibida = total automáticamente
        const total = parseFloat(totalElement.textContent.replace('€', ''));
        cantidadRecibida.value = total.toFixed(2);

        // Limpiar display de cambio
        cambioCalculado.textContent = '€0.00';
        cambioCalculado.style.color = '#888';

        // Habilitar botón inmediatamente para pagos digitales
        confirmarBtn.disabled = false;
        confirmarBtn.style.opacity = '1';

        // Cambiar texto del botón según método
        switch (metodoPago) {
            case 'tarjeta':
                confirmarBtn.textContent = '💳 Confirmar Pago con Tarjeta';
                break;
            case 'bizum':
                confirmarBtn.textContent = '📱 Confirmar Pago con Bizum';
                break;
            case 'transferencia':
                confirmarBtn.textContent = '🏦 Confirmar Transferencia';
                break;
            default:
                confirmarBtn.textContent = '✅ Confirmar Cobro';
        }
    }
}

// Función para establecer el importe exacto
function establecerImporteExacto() {
    const total = document.getElementById('totalACobrar').textContent.replace('€', '');
    document.getElementById('cantidadRecibida').value = total;
    calcularCambio();
}


window.addEventListener('click', function (event) {
    const modal = document.getElementById('modalCobro');
    if (event.target == modal) {
        cerrarModalCobro();
    }
});
