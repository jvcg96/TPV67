
window.onload = async function () {

    // Inicializar IndexedDB
    try {
        await DB.init();
        console.log('✅ Sistema de base de datos iniciado correctamente');

        // Migrar datos existentes si es necesario
        await migrarDatosExistentes();

    } catch (error) {
        console.error('❌ Error al iniciar base de datos:', error);
        alert('Error al iniciar el sistema. Por favor recarga la página.');
        return;
    }

    // Cargar productos personalizados si existen
    const productosGuardados = localStorage.getItem('productosPersonalizados');
    if (productosGuardados) {
        productos = JSON.parse(productosGuardados);
    }

    // Migración de productos para agregar campo controlStock
    let necesitaMigracion = false;
    productos = productos.map(producto => {
        if (producto.controlStock === undefined) {
            producto.controlStock = true;
            necesitaMigracion = true;
        }
        return producto;
    });

    if (necesitaMigracion) {
        localStorage.setItem('productosPersonalizados', JSON.stringify(productos));
        console.log('✅ Productos migrados: agregado campo controlStock');
    }

    // Cargar estado del teclado virtual
    setTimeout(() => {
        cargarEstadoTeclado();
    }, 500);

    // Mostrar indicador si el teclado está activado
    if (esDispositivoTactil()) {
        console.log('🔧 Teclado virtual activado');
        document.body.classList.add('dispositivo-tactil');
    }

    // Cargar datos
    await cargarDatos();

    // Recuperar mesas no cobradas
    const mesasRecuperadas = recuperarEstadoMesas();
    if (mesasRecuperadas) {
        let hayMesasConProductos = false;
        let mesasValidas = {};

        Object.entries(mesasRecuperadas).forEach(([mesaId, productos]) => {
            if (mesaId && Array.isArray(productos) && productos.length > 0) {
                const productosValidos = productos.filter(producto =>
                    producto &&
                    typeof producto.id !== 'undefined' &&
                    producto.nombre &&
                    typeof producto.precio === 'number'
                );

                if (productosValidos.length > 0) {
                    mesasValidas[mesaId] = productosValidos;
                    hayMesasConProductos = true;
                }
            }
        });

        if (hayMesasConProductos) {
            if (confirm('⚠️ Se detectaron mesas con productos sin cobrar de una sesión anterior.\n\n¿Deseas recuperarlas?')) {
                mesas = mesasValidas;
                renderizarMesas();
                mostrarNotificacion('✅ Mesas recuperadas correctamente');
            } else {
                localStorage.removeItem('mesasTemporales');
            }
        } else {
            localStorage.removeItem('mesasTemporales');
            console.log('🧹 Datos de mesas temporales corruptos eliminados automáticamente');
        }
    }

    // Cargar historial de movimientos desde IndexedDB
    try {
        historialMovimientos = await DB.obtenerMovimientos();
        console.log(`📦 Cargados ${historialMovimientos.length} movimientos de inventario`);
    } catch (error) {
        console.error('Error al cargar movimientos:', error);
        historialMovimientos = [];
    }

    renderizarMesas();
    actualizarFacturacion();
    renderizarListaProductos();
    renderizarListaMesas();
    renderizarListaCategorias();
    actualizarSelectoresCategorias();
    renderizarListaAreas();
    actualizarSelectoresAreas();

    // Inicializar filtros de pedidos
    setTimeout(() => {
        if (document.getElementById('filtroFecha')) {
            inicializarFiltrosPedidos();
        }
    }, 100);

    setInterval(guardarDatos, 5000); // Guardar cada 5 segundos

    // Limpiar datos antiguos automáticamente
    const ultimaLimpieza = localStorage.getItem('ultimaLimpiezaDB');
    const hoy = new Date().toDateString();

    if (ultimaLimpieza !== hoy) {
        setTimeout(async () => {
            try {
                await DB.limpiarDatosAntiguos();
                DB.limpiarCacheLocal();
                localStorage.setItem('ultimaLimpiezaDB', hoy);
                console.log('✅ Limpieza automática completada');
            } catch (error) {
                console.error('Error en limpieza automática:', error);
            }
        }, 5000);
    }



    // Detectar instalación
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        setTimeout(() => {
            if (confirm('🚀 ¿Quieres instalar TPV como aplicación?')) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        mostrarNotificacion('🎉 ¡TPV instalado correctamente!');
                    }
                    deferredPrompt = null;
                });
            }
        }, 5000);
    });

    // Listener para redimensionar
    window.addEventListener('resize', () => {
        if (mesaActual !== null) {
            const productosPorPaginaAnterior = window.productosPorPagina;
            window.calcularProductosPorPagina();

            if (productosPorPaginaAnterior !== window.productosPorPagina) {
                renderizarProductosPorCategoria();
            }
        }
    });

    // IMPORTANTE: Aplicar restricciones al cargar
    // Sin sesión = Modo invitado (como camarero)
    actualizarInterfazSegunRol();
    actualizarSeccionLogin();

    // Forzar vista de Mesas al inicio
    setTimeout(() => {
        if (!usuarioActual) {
            showTab('mesas');
        }
    }, 100);
};