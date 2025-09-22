// Sistema de categorías personalizables
let areas = JSON.parse(localStorage.getItem('areasPersonalizadas')) || [];


// Sistema de categorías (tipo de producto)
let categorias = JSON.parse(localStorage.getItem('categoriasPersonalizadas')) || [];

// Detectar tamaño de pantalla y ajustar grid
window.calcularProductosPorPagina = function () {
    // SIEMPRE 9 productos (3x3)
    window.productosPorPagina = 9;
}

// Funciones de navegación globales
window.paginaAnteriorCategoria = function () {
    if (window.paginaActualProductos > 1) {
        window.paginaActualProductos--;
        renderizarProductosPorCategoria();
    }
}

window.paginaSiguienteCategoria = function () {
    if (window.paginaActualProductos < window.totalPaginasProductos) {
        window.paginaActualProductos++;
        renderizarProductosPorCategoria();
    }
}

window.irAPaginaCategoria = function (pagina) {
    if (pagina >= 1 && pagina <= window.totalPaginasProductos) {
        window.paginaActualProductos = pagina;
        renderizarProductosPorCategoria();
    }
}
// Event listener para redimensionar ventana
window.addEventListener('resize', () => {
    const mesasPorPaginaAnterior = mesasPorPagina;
    calcularMesasPorPagina();

    if (mesasPorPaginaAnterior !== mesasPorPagina) {
        renderizarMesasPorArea();
    }
});
