
const actualizarEstadoDevOriginal = window.onload;

const originalWindowOnload = window.onload;
window.onload = function () {
    if (originalWindowOnload) originalWindowOnload();
    setTimeout(verificarStockGeneral, 1000);
};


// Verificar sistema al cargar
setTimeout(verificarSistemaAdmin, 2000);


