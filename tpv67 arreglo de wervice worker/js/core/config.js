// Datos del sistema con emojis - Ahora modificable
window.productos = JSON.parse(localStorage.getItem('productosPersonalizados')) || [];
let mesas = {};
// ========================================
// SISTEMA DE USUARIOS
// ========================================
let usuarioActual = null;
let usuariosRegistrados = JSON.parse(localStorage.getItem('usuariosTPV')) || [
    // Usuarios por defecto
    {
        id: 1,
        nombre: 'DUEÑO',
        pin: '1234',
        rol: 'dueño',
        activo: true
    },
    {
        id: 2,
        nombre: 'ENCARGADO',
        pin: '2222',
        rol: 'encargado',
        activo: true
    },
    {
        id: 3,
        nombre: 'CAMARERO 1',
        pin: '1111',
        rol: 'camarero',
        activo: true
    }
];
let facturacion = [];
let mesaActual = null;
let pedidosFiltrados = [];
window.paginaActualProductos = 1;
window.productosPorPagina = 9;
window.totalPaginasProductos = 1;
window.productosFiltradosActuales = [];