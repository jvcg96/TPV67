// Función para mostrar estadísticas adicionales
function mostrarEstadisticasDetalladas() {
    if (pedidosFiltrados.length === 0) return;

    const productosVendidos = {};
    let totalItems = 0;

    pedidosFiltrados.forEach(pedido => {
        pedido.items.forEach(item => {
            if (!productosVendidos[item.nombre]) {
                productosVendidos[item.nombre] = {
                    cantidad: 0,
                    total: 0,
                    emoji: item.emoji
                };
            }
            productosVendidos[item.nombre].cantidad++;
            productosVendidos[item.nombre].total += item.precio;
            totalItems++;
        });
    });

    // Producto más vendido
    const productoMasVendido = Object.entries(productosVendidos)
        .sort((a, b) => b[1].cantidad - a[1].cantidad)[0];

    if (productoMasVendido) {
        console.log(`📊 Producto más vendido: ${productoMasVendido[1].emoji} ${productoMasVendido[0]} (${productoMasVendido[1].cantidad} unidades)`);
    }

    console.log(`📊 Total de items vendidos: ${totalItems}`);
    console.log(`📊 Promedio por pedido: ${(totalItems / pedidosFiltrados.length).toFixed(2)} items`);
}
// Función para mostrar estadísticas adicionales
function mostrarEstadisticasDetalladas() {
    if (!pedidosFiltrados || pedidosFiltrados.length === 0) return;

    const productosVendidos = {};
    let totalItems = 0;

    try {
        pedidosFiltrados.forEach(pedido => {
            if (pedido && pedido.items && Array.isArray(pedido.items)) {
                pedido.items.forEach(item => {
                    if (item && item.nombre) {
                        if (!productosVendidos[item.nombre]) {
                            productosVendidos[item.nombre] = {
                                cantidad: 0,
                                total: 0,
                                emoji: item.emoji || '🍽️'
                            };
                        }
                        productosVendidos[item.nombre].cantidad++;
                        productosVendidos[item.nombre].total += item.precio || 0;
                        totalItems++;
                    }
                });
            }
        });

        // Producto más vendido
        const productosArray = Object.entries(productosVendidos);
        if (productosArray.length > 0) {
            const productoMasVendido = productosArray
                .sort((a, b) => b[1].cantidad - a[1].cantidad)[0];

            if (productoMasVendido) {
                console.log(`📊 Producto más vendido: ${productoMasVendido[1].emoji} ${productoMasVendido[0]} (${productoMasVendido[1].cantidad} unidades)`);
            }
        }

        console.log(`📊 Total de items vendidos: ${totalItems}`);
        if (pedidosFiltrados.length > 0) {
            console.log(`📊 Promedio por pedido: ${(totalItems / pedidosFiltrados.length).toFixed(2)} items`);
        }
    } catch (error) {
        console.error('Error en estadísticas detalladas:', error);
    }
}
;

function aplicarFiltrosPedidosConValidacion() {
    if (!validarFiltros()) return;
    aplicarFiltrosPedidos();
}

// Función para limpiar filtros con animación
const limpiarFiltrosPedidosOriginal = limpiarFiltrosPedidos;
limpiarFiltrosPedidos = function () {
    // Mostrar notificación
    mostrarNotificacion('🔄 Filtros limpiados');

    // Ejecutar función original
    limpiarFiltrosPedidosOriginal();

    // Establecer fecha actual nuevamente
    const hoy = new Date();
    if (document.getElementById('filtroFecha')) {
        document.getElementById('filtroFecha').value = hoy.toISOString().split('T')[0];
    }

    // Aplicar filtros
    aplicarFiltrosPedidos();
};

// Asegurar que la función cobrarMesa actualice los pedidos
if (typeof cobrarMesa === 'function') {
    const cobrarMesaOriginal = cobrarMesa;
    cobrarMesa = function () {
        cobrarMesaOriginal();
        // resto del código...
    };
}
// Event listeners para filtros en tiempo real
document.addEventListener('DOMContentLoaded', function () {
    // Agregar event listeners cuando se cargue la página
    setTimeout(() => {
        const filtroFecha = document.getElementById('filtroFecha');
        const filtroMesa = document.getElementById('filtroMesa');
        const filtroHoraDesde = document.getElementById('filtroHoraDesde');
        const filtroHoraHasta = document.getElementById('filtroHoraHasta');

        if (filtroFecha) {
            filtroFecha.addEventListener('change', aplicarFiltrosPedidos);
        }
        if (filtroMesa) {
            filtroMesa.addEventListener('change', aplicarFiltrosPedidos);
        }
        if (filtroHoraDesde) {
            filtroHoraDesde.addEventListener('change', aplicarFiltrosPedidos);
        }
        if (filtroHoraHasta) {
            filtroHoraHasta.addEventListener('change', aplicarFiltrosPedidos);
        }
    }, 1000);
});