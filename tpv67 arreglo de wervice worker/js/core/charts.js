// ========================================
// SISTEMA DE CARGA DINÁMICA DE CHART.JS
// ========================================
let chartJSCargado = false;



// Variables globales para gráficos
let graficos = {
    ventasLineas: null,
    ventasCategorias: null,
    ventasHoras: null,
    topProductos: null
};
// Limpieza automática de gráficos al cambiar de pestaña
let tabAnterior = 'mesas';
let tipoAgrupacionActual = 'categoria'; // - Recuerda si estamos viendo categorías o áreas

async function cargarChartJS() {
    // Si ya está cargado, verificar que realmente funcione
    if (typeof Chart !== 'undefined') {
        console.log('✅ Chart.js ya está disponible');
        chartJSCargado = true;
        return true;
    }

    // Solo cargar para Pro y Premium
    const licencia = obtenerEstadoLicencia();
    if (licencia.tipo !== 'pro' && licencia.tipo !== 'premium') {
        console.log('📊 Chart.js no necesario para licencia:', licencia.tipo);
        return false;
    }

    console.log('🔄 Cargando Chart.js...');

    return new Promise((resolve) => {
        // Verificar si ya existe un script de Chart.js
        const existingScript = document.querySelector('script[src*="chart.js"]');
        if (existingScript) {
            existingScript.remove();
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';

        script.onload = () => {
            // Verificar que Chart esté realmente disponible
            setTimeout(() => {
                if (typeof Chart !== 'undefined') {
                    chartJSCargado = true;
                    console.log('✅ Chart.js cargado correctamente');
                    resolve(true);
                } else {
                    console.error('❌ Chart.js cargado pero no disponible');
                    resolve(false);
                }
            }, 100);
        };

        script.onerror = () => {
            console.error('❌ Error cargando Chart.js');
            chartJSCargado = false;
            resolve(false);
        };

        document.head.appendChild(script);
    });
}

// ========================================
// MÓDULO DE GRÁFICOS AVANZADOS PRO/PREMIUM
// ========================================


// Función principal para mostrar gráficos avanzados
async function mostrarGraficosAvanzados(todasLasVentas) {
    const licencia = obtenerEstadoLicencia();

    if (licencia.tipo !== 'pro' && licencia.tipo !== 'premium') {
        return;
    }

    // IMPORTANTE: Destruir gráficos anteriores CORRECTAMENTE
    console.log('🧹 Limpiando gráficos anteriores...');

    // Destruir cada gráfico si existe
    if (graficos.ventasLineas) {
        try {
            graficos.ventasLineas.destroy();
            graficos.ventasLineas = null;
        } catch (e) {
            console.log('Error destruyendo ventasLineas:', e);
        }
    }

    if (graficos.ventasCategorias) {
        try {
            graficos.ventasCategorias.destroy();
            graficos.ventasCategorias = null;
        } catch (e) {
            console.log('Error destruyendo ventasCategorias:', e);
        }
    }

    if (graficos.ventasHoras) {
        try {
            graficos.ventasHoras.destroy();
            graficos.ventasHoras = null;
        } catch (e) {
            console.log('Error destruyendo ventasHoras:', e);
        }
    }

    if (graficos.topProductos) {
        try {
            graficos.topProductos.destroy();
            graficos.topProductos = null;
        } catch (e) {
            console.log('Error destruyendo topProductos:', e);
        }
    }

    // Limpiar los canvas existentes
    const canvasIds = ['graficoVentasLineas', 'graficoVentasCategorias', 'graficoVentasHoras', 'graficoTopProductos'];

    canvasIds.forEach(id => {
        const oldCanvas = document.getElementById(id);
        if (oldCanvas) {
            const parent = oldCanvas.parentNode;
            const newCanvas = document.createElement('canvas');
            newCanvas.id = id;
            parent.replaceChild(newCanvas, oldCanvas);
        }
    });

    // Verificar que Chart.js esté disponible
    if (typeof Chart === 'undefined') {
        console.error('❌ Chart.js no está disponible');
        const chartCargado = await cargarChartJS();
        if (!chartCargado) {
            console.error('❌ No se pudo cargar Chart.js');
            return;
        }
    }

    // Mostrar contenedor de gráficos
    const contenedor = document.getElementById('graficosProPremium');
    if (contenedor) {
        contenedor.style.display = 'block';
    } else {
        console.error('❌ No se encontró el contenedor de gráficos');
        return;
    }

    // Pequeño delay para asegurar que el DOM esté listo
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generar todos los gráficos
    try {
        console.log('📊 Generando gráfico de líneas...');
        await generarGraficoVentasLineas(todasLasVentas);

        console.log('📊 Generando gráfico de categorías/áreas...');
        if (tipoAgrupacionActual === 'area') {
            await generarGraficoVentasAreas(todasLasVentas);
        } else {
            await generarGraficoVentasCategorias(todasLasVentas);
        }

        console.log('📊 Generando gráfico de horas...');
        await generarGraficoVentasHoras(todasLasVentas);

        console.log('📊 Generando top productos...');
        await generarGraficoTopProductos(todasLasVentas);

        console.log('📊 Actualizando métricas...');
        await actualizarMetricasRapidas(todasLasVentas);

        console.log('✅ Todos los gráficos generados correctamente');

    } catch (error) {
        console.error('❌ Error generando gráficos:', error);
    }

    // Sincronizar el selector con el estado actual
    const selectorAgrupacion = document.getElementById('tipoAgrupacion');
    if (selectorAgrupacion) {
        selectorAgrupacion.value = tipoAgrupacionActual;
    }
}


// Función para reiniciar y recargar gráficos
async function reiniciarGraficos() {
    console.log('🔄 Reiniciando sistema de gráficos...');

    // Destruir gráficos existentes
    if (graficos.ventasLineas) {
        graficos.ventasLineas.destroy();
        graficos.ventasLineas = null;
    }
    if (graficos.ventasCategorias) {
        graficos.ventasCategorias.destroy();
        graficos.ventasCategorias = null;
    }
    if (graficos.ventasHoras) {
        graficos.ventasHoras.destroy();
        graficos.ventasHoras = null;
    }
    if (graficos.topProductos) {
        graficos.topProductos.destroy();
        graficos.topProductos = null;
    }

    // Resetear flag de carga
    chartJSCargado = false;

    // Recargar Chart.js
    const cargado = await cargarChartJS();

    if (cargado) {
        // Actualizar facturación (que incluye los gráficos)
        await actualizarFacturacion();
        mostrarNotificacion('✅ Gráficos reiniciados correctamente');
    } else {
        mostrarNotificacion('❌ Error al reiniciar gráficos');
    }
}

// Función de debug para verificar estado
function debugGraficos() {
    console.log('=== DEBUG GRÁFICOS ===');
    console.log('Chart.js disponible:', typeof Chart !== 'undefined');
    console.log('chartJSCargado:', chartJSCargado);
    console.log('Licencia actual:', obtenerEstadoLicencia());
    console.log('Gráficos activos:', {
        ventasLineas: graficos.ventasLineas !== null,
        ventasCategorias: graficos.ventasCategorias !== null,
        ventasHoras: graficos.ventasHoras !== null,
        topProductos: graficos.topProductos !== null
    });
    console.log('Elementos canvas:', {
        ventasLineas: document.getElementById('graficoVentasLineas') !== null,
        ventasCategorias: document.getElementById('graficoVentasCategorias') !== null,
        ventasHoras: document.getElementById('graficoVentasHoras') !== null,
        topProductos: document.getElementById('graficoTopProductos') !== null
    });
    console.log('===================');
}


async function generarGraficoVentasLineas(ventas) {
    // Verificar que Chart.js esté disponible
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js no está disponible');
        return;
    }

    const ctx = document.getElementById('graficoVentasLineas');
    if (!ctx) return;

    const periodo = parseInt(document.getElementById('periodoGrafico')?.value || 30);
    const tipoGrafico = document.getElementById('tipoGrafico')?.value || 'lineas';

    // Destruir gráfico anterior si existe
    if (graficos.ventasLineas) {
        graficos.ventasLineas.destroy();
    }

    // Calcular fechas - INCLUIR HOY
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999); // Incluir todo el día de hoy
    const fechaInicio = new Date(hoy);
    fechaInicio.setDate(hoy.getDate() - periodo + 1); // Incluir hoy en el rango
    fechaInicio.setHours(0, 0, 0, 0);

    // Procesar datos por día
    const ventasPorDia = {};

    // Inicializar todos los días con 0 (INCLUIDO HOY)
    for (let i = 0; i <= periodo; i++) {  // <= para incluir hoy
        const fecha = new Date(fechaInicio);
        fecha.setDate(fechaInicio.getDate() + i);
        const key = fecha.toISOString().split('T')[0];
        ventasPorDia[key] = 0;
    }

    // Asegurar que HOY esté incluido
    const hoyKey = hoy.toISOString().split('T')[0];
    if (!ventasPorDia.hasOwnProperty(hoyKey)) {
        ventasPorDia[hoyKey] = 0;
    }

    // Agregar ventas reales
    ventas.forEach(venta => {
        const fechaVenta = new Date(venta.fecha);
        const key = fechaVenta.toISOString().split('T')[0];

        // Incluir si está en el rango
        if (ventasPorDia.hasOwnProperty(key)) {
            ventasPorDia[key] += venta.total;
        }
    });

    // Log para verificar
    console.log(`Ventas de hoy (${hoyKey}): €${ventasPorDia[hoyKey] || 0}`);

    // Preparar datos para Chart.js
    const labels = Object.keys(ventasPorDia).map(fecha => {
        const date = new Date(fecha);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit'
        });
    });

    const data = Object.values(ventasPorDia);

    // Configurar tipo de gráfico
    let chartType = 'line';
    let fill = false;
    let tension = 0.4;

    if (tipoGrafico === 'barras') {
        chartType = 'bar';
    } else if (tipoGrafico === 'area') {
        fill = true;
        tension = 0.4;
    }

    // Crear gráfico
    graficos.ventasLineas = new Chart(ctx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: 'Ventas Diarias (€)',
                data: data,
                borderColor: '#22c55e',
                backgroundColor: fill ? 'rgba(34, 197, 94, 0.2)' : '#22c55e',
                borderWidth: 3,
                fill: fill,
                tension: tension,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#22c55e',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#22c55e',
                    borderWidth: 1,
                    callbacks: {
                        label: function (context) {
                            return `💰 €${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#888',
                        callback: function (value) {
                            return '€' + value.toFixed(0);
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#888',
                        maxTicksLimit: 10
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// 🥧 Gráfico circular - Ventas por categorías
async function generarGraficoVentasCategorias(ventas) {
    const ctx = document.getElementById('graficoVentasCategorias');
    if (!ctx) return;

    // Destruir gráfico anterior
    if (graficos.ventasCategorias) {
        graficos.ventasCategorias.destroy();
    }

    // Agrupar ventas SOLO por categoría de producto (NO por área)
    const ventasPorCategoria = {};

    ventas.forEach(venta => {
        venta.items.forEach(item => {
            // Primero intentar usar la categoría del item si existe
            let categoriaId = item.categoria;

            // Si no tiene categoría, buscar el producto original
            if (!categoriaId) {
                const productoCompleto = productos.find(p => p.id === item.id || p.nombre === item.nombre);
                categoriaId = productoCompleto ? productoCompleto.categoria : null;
            }

            // Obtener el nombre real de la categoría
            let categoriaReal = 'Sin categoría';
            if (categoriaId) {
                const categoria = categorias.find(c => c.id === categoriaId && c.activa);
                categoriaReal = categoria ? categoria.nombre : categoriaId;
            }

            // IMPORTANTE: Inicializar si no existe
            if (!ventasPorCategoria[categoriaReal]) {
                ventasPorCategoria[categoriaReal] = 0;
            }
            ventasPorCategoria[categoriaReal] += item.precio;
        });
    });

    const labels = Object.keys(ventasPorCategoria);
    const data = Object.values(ventasPorCategoria);

    // Colores específicos por categoría
    const coloresCategoria = {
        'Bebidas': '#4ecdc4',
        'Comida': '#ff6b6b',
        'Alcohol': '#feca57',
        'CAFE': '#8b4513',
        'postres': '#ff9ff3',
        'Sin categoría': '#666666'
    };

    // Asignar colores o usar por defecto
    const colores = labels.map(label =>
        coloresCategoria[label] || `hsl(${Math.random() * 360}, 70%, 60%)`
    );

    graficos.ventasCategorias = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colores,
                borderWidth: 2,
                borderColor: '#1a1a1a',
                hoverBorderWidth: 3,
                hoverBorderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e0e0e0',
                        padding: 15,
                        font: {
                            size: 12
                        },
                        generateLabels: function (chart) {
                            const data = chart.data;
                            return data.labels.map((label, i) => ({
                                text: `${label}: €${data.datasets[0].data[i].toFixed(0)}`,
                                fillStyle: data.datasets[0].backgroundColor[i],
                                strokeStyle: data.datasets[0].backgroundColor[i],
                                lineWidth: 2,
                                index: i
                            }));
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#22c55e',
                    borderWidth: 1,
                    callbacks: {
                        label: function (context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: €${context.parsed.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// 🏢 Gráfico circular - Ventas por áreas (de MESAS, no productos)
async function generarGraficoVentasAreas(ventas) {
    const ctx = document.getElementById('graficoVentasCategorias');
    if (!ctx) return;

    // Verificar que Chart.js esté disponible
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js no está disponible para áreas');
        return;
    }

    // Destruir gráfico anterior
    if (graficos.ventasCategorias) {
        graficos.ventasCategorias.destroy();
    }

    // Agrupar ventas por área de la MESA donde se vendió
    const ventasPorArea = {};

    ventas.forEach(venta => {
        // Obtener el área de la MESA, no del producto
        const mesaId = venta.mesa;
        const mesaConfig = mesasConfig.find(m => m.id === mesaId);

        let areaNombre = 'Sin área';
        if (mesaConfig && mesaConfig.area) {
            // Buscar el nombre del área
            const area = areas.find(a => a.id === mesaConfig.area && a.activa);
            areaNombre = area ? area.nombre : 'Sin área';
        }

        // Sumar todas las ventas de esta mesa a su área
        venta.items.forEach(item => {
            if (!ventasPorArea[areaNombre]) {
                ventasPorArea[areaNombre] = 0;
            }
            ventasPorArea[areaNombre] += item.precio;
        });
    });

    const labels = Object.keys(ventasPorArea);
    const data = Object.values(ventasPorArea);

    // Colores específicos por área
    const coloresArea = {
        'Barra': '#ff6b6b',
        'Cocina': '#4ecdc4',
        'Terraza': '#96ceb4',
        'Salón': '#feca57',
        'Salon': '#feca57',  // Por si acaso está sin tilde
        'Sin área': '#666666'
    };

    const colores = labels.map(label =>
        coloresArea[label] || `hsl(${Math.random() * 360}, 70%, 60%)`
    );

    graficos.ventasCategorias = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colores,
                borderWidth: 2,
                borderColor: '#1a1a1a',
                hoverBorderWidth: 3,
                hoverBorderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e0e0e0',
                        padding: 15,
                        font: {
                            size: 12
                        },
                        generateLabels: function (chart) {
                            const data = chart.data;
                            return data.labels.map((label, i) => ({
                                text: `${label}: €${data.datasets[0].data[i].toFixed(0)}`,
                                fillStyle: data.datasets[0].backgroundColor[i],
                                strokeStyle: data.datasets[0].backgroundColor[i],
                                lineWidth: 2,
                                index: i
                            }));
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#22c55e',
                    borderWidth: 1,
                    callbacks: {
                        label: function (context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: €${context.parsed.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// Función para cambiar entre categorías y áreas
async function cambiarAgrupacion() {
    console.log('🔄 Cambiando agrupación...');

    try {
        const tipoAgrupacion = document.getElementById('tipoAgrupacion')?.value || 'categoria';

        // IMPORTANTE: Guardar la selección actual
        tipoAgrupacionActual = tipoAgrupacion;

        // Obtener datos actualizados
        let datosVentas = [];
        try {
            datosVentas = await DB.obtenerFacturacion();
        } catch (error) {
            console.error('Error al obtener datos:', error);
            datosVentas = facturacion || [];
        }

        console.log('Tipo agrupación:', tipoAgrupacion);
        console.log('Datos disponibles:', datosVentas.length);

        // Verificar que Chart.js esté disponible
        if (typeof Chart === 'undefined') {
            console.error('Chart.js no está disponible');
            mostrarNotificacion('❌ Error: Chart.js no disponible');
            return;
        }

        // Cambiar el título del gráfico
        const titulos = document.querySelectorAll('#graficosProPremium h4');
        titulos.forEach(titulo => {
            if (titulo.textContent.includes('Categoría') || titulo.textContent.includes('Área')) {
                if (tipoAgrupacion === 'categoria') {
                    titulo.textContent = '🥧 Ventas por Categoría';
                } else {
                    titulo.textContent = '🏢 Ventas por Área';
                }
            }
        });

        // Generar el gráfico correspondiente
        if (tipoAgrupacion === 'categoria') {
            console.log('Generando gráfico por categorías...');
            await generarGraficoVentasCategorias(datosVentas);
        } else {
            console.log('Generando gráfico por áreas...');
            await generarGraficoVentasAreas(datosVentas);
        }

        mostrarNotificacion(`📊 Mostrando ventas por ${tipoAgrupacion === 'categoria' ? 'categorías' : 'áreas'}`);

    } catch (error) {
        console.error('Error en cambiarAgrupacion:', error);
        mostrarNotificacion('❌ Error al cambiar vista');
    }
}


// ⏰ Gráfico de ventas por horas
async function generarGraficoVentasHoras(ventas) {

    // Verificar que Chart.js esté disponible
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js no está disponible');
        return;
    }

    const ctx = document.getElementById('graficoVentasHoras');
    if (!ctx) return;

    if (graficos.ventasHoras) {
        graficos.ventasHoras.destroy();
    }

    // Obtener fecha de hoy
    const hoy = new Date();
    const hoyStr = hoy.toDateString();

    console.log('Buscando ventas del día:', hoyStr);

    // Filtrar ventas del día actual (compatible con ambos formatos)
    const ventasHoy = ventas.filter(venta => {
        try {
            const fechaVenta = new Date(venta.fecha);
            return fechaVenta.toDateString() === hoyStr;
        } catch (error) {
            return false;
        }
    });

    console.log(`Ventas encontradas hoy: ${ventasHoy.length}`);

    // Agrupar por hora
    const ventasPorHora = {};
    for (let i = 0; i < 24; i++) {
        ventasPorHora[i] = 0;
    }

    ventasHoy.forEach(venta => {
        try {
            let hora;

            // Intentar primero extraer la hora del string
            if (venta.fecha.includes('T')) {
                const parteHora = venta.fecha.split('T')[1];
                if (parteHora) {
                    hora = parseInt(parteHora.split(':')[0]);
                }
            }

            // Si no funciona, usar Date
            if (hora === undefined || isNaN(hora)) {
                const fechaVenta = new Date(venta.fecha);
                hora = fechaVenta.getHours();
            }

            if (!isNaN(hora) && hora >= 0 && hora < 24) {
                ventasPorHora[hora] += venta.total;
                console.log(`Sumando venta a las ${hora}:00 - €${venta.total}`);
            }
        } catch (error) {
            console.error('Error procesando venta:', error);
        }
    });

    const labels = Object.keys(ventasPorHora).map(h => `${h.padStart(2, '0')}:00`);
    const data = Object.values(ventasPorHora);

    // Solo crear el gráfico si el canvas existe
    if (!ctx || !ctx.getContext) {
        console.error('Canvas no disponible para gráfico de horas');
        return;
    }

    try {
        graficos.ventasHoras = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ventas por Hora',
                    data: data,
                    backgroundColor: 'rgba(255, 107, 107, 0.8)',
                    borderColor: '#ff6b6b',
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#ff6b6b',
                        borderWidth: 1,
                        callbacks: {
                            label: function (context) {
                                return `💰 €${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#888',
                            callback: function (value) {
                                return '€' + value.toFixed(0);
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#888',
                            maxTicksLimit: 12
                        }
                    }
                }
            }
        });

        console.log('✅ Gráfico de horas creado correctamente');

    } catch (error) {
        console.error('Error al crear gráfico de horas:', error);
    }
}

// 🏆 Gráfico top productos
async function generarGraficoTopProductos(ventas) {

    if (typeof Chart === 'undefined') {
        console.warn('Chart.js no está disponible');
        return;
    }

    const ctx = document.getElementById('graficoTopProductos');
    if (!ctx) return;

    if (graficos.topProductos) {
        graficos.topProductos.destroy();
    }

    // Agrupar ventas por producto
    const ventasPorProducto = {};

    ventas.forEach(venta => {
        venta.items.forEach(item => {
            const nombre = item.nombre;
            if (!ventasPorProducto[nombre]) {
                ventasPorProducto[nombre] = {
                    cantidad: 0,
                    total: 0
                };
            }
            ventasPorProducto[nombre].cantidad++;
            ventasPorProducto[nombre].total += item.precio;
        });
    });

    // Ordenar por cantidad vendida y tomar top 8
    const topProductos = Object.entries(ventasPorProducto)
        .sort((a, b) => b[1].cantidad - a[1].cantidad)
        .slice(0, 8);

    const labels = topProductos.map(([nombre]) => nombre.length > 15 ? nombre.substring(0, 15) + '...' : nombre);
    const data = topProductos.map(([, datos]) => datos.cantidad);

    graficos.topProductos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Unidades Vendidas',
                data: data,
                backgroundColor: 'rgba(255, 165, 2, 0.8)',
                borderColor: '#ffa502',
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#ffa502',
                    borderWidth: 1,
                    callbacks: {
                        label: function (context) {
                            const producto = topProductos[context.dataIndex];
                            return [
                                `📦 ${context.parsed.x} unidades`,
                                `💰 €${producto[1].total.toFixed(2)} total`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#888'
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#888',
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}


// 📊 Actualizar métricas rápidas
async function actualizarMetricasRapidas(ventas) {
    // Producto estrella
    const ventasPorProducto = {};
    ventas.forEach(venta => {
        venta.items.forEach(item => {
            if (!ventasPorProducto[item.nombre]) {
                ventasPorProducto[item.nombre] = { cantidad: 0, total: 0 };
            }
            ventasPorProducto[item.nombre].cantidad++;
            ventasPorProducto[item.nombre].total += item.precio;
        });
    });

    const productoEstrella = Object.entries(ventasPorProducto)
        .sort((a, b) => b[1].cantidad - a[1].cantidad)[0];

    if (productoEstrella) {
        document.getElementById('productoEstrella').textContent = productoEstrella[0];
        document.getElementById('ventasEstrella').textContent = `${productoEstrella[1].cantidad} unidades`;
    }

    // Pico de ventas por hora
    const ventasPorHora = {};
    ventas.forEach(venta => {
        const hora = new Date(venta.fecha).getHours();
        if (!ventasPorHora[hora]) ventasPorHora[hora] = 0;
        ventasPorHora[hora] += venta.total;
    });

    const horaPico = Object.entries(ventasPorHora)
        .sort((a, b) => b[1] - a[1])[0];

    if (horaPico) {
        document.getElementById('picoVentas').textContent = `€${horaPico[1].toFixed(2)}`;
        document.getElementById('horaPico').textContent = `${horaPico[0].padStart(2, '0')}:00h`;
    }

    // Mesa top
    const ventasPorMesa = {};
    ventas.forEach(venta => {
        const mesaNombre = obtenerNombreMesa(venta.mesa);
        if (!ventasPorMesa[mesaNombre]) ventasPorMesa[mesaNombre] = 0;
        ventasPorMesa[mesaNombre] += venta.total;
    });

    const mesaTop = Object.entries(ventasPorMesa)
        .sort((a, b) => b[1] - a[1])[0];

    if (mesaTop) {
        document.getElementById('mesaTop').textContent = mesaTop[0];
        document.getElementById('facturaciónMesaTop').textContent = `€${mesaTop[1].toFixed(2)}`;
    }

    // Ticket promedio
    const totalVentas = ventas.reduce((sum, venta) => sum + venta.total, 0);
    const ticketPromedio = ventas.length > 0 ? totalVentas / ventas.length : 0;

    document.getElementById('ticketPromedio').textContent = `€${ticketPromedio.toFixed(2)}`;
    document.getElementById('totalTickets').textContent = `${ventas.length} tickets`;
}

// 🔄 Funciones de control de gráficos
async function actualizarGraficos() {
    try {
        // Obtener datos actualizados desde la base de datos
        let datosVentas = [];
        try {
            datosVentas = await DB.obtenerFacturacion();
        } catch (error) {
            console.error('Error al obtener datos:', error);
            datosVentas = facturacion || [];
        }

        // Verificar que tengamos datos
        if (!datosVentas || datosVentas.length === 0) {
            mostrarNotificacion('⚠️ No hay datos para mostrar');
            return;
        }

        // Recargar todos los gráficos
        await mostrarGraficosAvanzados(datosVentas);
        mostrarNotificacion('📊 Gráficos actualizados');

    } catch (error) {
        console.error('Error al actualizar gráficos:', error);
        mostrarNotificacion('❌ Error al actualizar gráficos');
    }
}


async function cambiarTipoGrafico() {
    try {
        // Obtener datos actualizados
        let datosVentas = [];
        try {
            datosVentas = await DB.obtenerFacturacion();
        } catch (error) {
            console.error('Error al obtener datos:', error);
            datosVentas = facturacion || [];
        }

        // Solo actualizar el gráfico principal
        await generarGraficoVentasLineas(datosVentas);
        mostrarNotificacion('📈 Tipo de gráfico cambiado');

    } catch (error) {
        console.error('Error al cambiar tipo de gráfico:', error);
        mostrarNotificacion('❌ Error al cambiar gráfico');
    }
}

function exportarGraficos() {
    mostrarNotificacion('📊 Función de exportación en desarrollo');
    // TODO: Implementar exportación de gráficos a PDF/imagen
}

// NUEVA FUNCIÓN: Mostrar comparativas avanzadas Pro/Premium
async function mostrarComparativasAvanzadas(todasLasVentas) {
    const hoy = new Date();

    // Calcular fechas de comparación
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    const inicioSemanaActual = new Date(hoy);
    inicioSemanaActual.setDate(hoy.getDate() - hoy.getDay() + 1);

    const inicioSemanaAnterior = new Date(inicioSemanaActual);
    inicioSemanaAnterior.setDate(inicioSemanaAnterior.getDate() - 7);

    const inicioMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

    const inicioAñoActual = new Date(hoy.getFullYear(), 0, 1);
    const inicioAñoAnterior = new Date(hoy.getFullYear() - 1, 0, 1);
    const finAñoAnterior = new Date(hoy.getFullYear() - 1, 11, 31);

    // Calcular totales
    let ventasHoy = 0, ventasAyer = 0;
    let ventasSemanaActual = 0, ventasSemanaAnterior = 0;
    let ventasMesActual = 0, ventasMesAnterior = 0;
    let ventasAñoActual = 0, ventasAñoAnterior = 0;

    todasLasVentas.forEach(venta => {
        const fechaVenta = new Date(venta.fecha);

        // Hoy vs Ayer
        if (fechaVenta.toDateString() === hoy.toDateString()) {
            ventasHoy += venta.total;
        }
        if (fechaVenta.toDateString() === ayer.toDateString()) {
            ventasAyer += venta.total;
        }

        // Semana actual vs anterior
        if (fechaVenta >= inicioSemanaActual) {
            ventasSemanaActual += venta.total;
        }
        if (fechaVenta >= inicioSemanaAnterior && fechaVenta < inicioSemanaActual) {
            ventasSemanaAnterior += venta.total;
        }

        // Mes actual vs anterior
        if (fechaVenta >= inicioMesActual) {
            ventasMesActual += venta.total;
        }
        if (fechaVenta >= inicioMesAnterior && fechaVenta <= finMesAnterior) {
            ventasMesAnterior += venta.total;
        }

        // Año actual vs anterior
        if (fechaVenta >= inicioAñoActual) {
            ventasAñoActual += venta.total;
        }
        if (fechaVenta >= inicioAñoAnterior && fechaVenta <= finAñoAnterior) {
            ventasAñoAnterior += venta.total;
        }
    });

    // Actualizar UI con tendencias
    actualizarComparativa('Hoy', ventasHoy, ventasAyer, 'ventasHoy', 'ventasAyer', 'tendenciaHoy', 'porcentajeHoy');
    actualizarComparativa('Semana', ventasSemanaActual, ventasSemanaAnterior, 'ventasSemanaActual', 'ventasSemanaAnterior', 'tendenciaSemana', 'porcentajeSemana');
    actualizarComparativa('Mes', ventasMesActual, ventasMesAnterior, 'ventasMesActual', 'ventasMesAnterior', 'tendenciaMes', 'porcentajeMes');
    actualizarComparativa('Año', ventasAñoActual, ventasAñoAnterior, 'ventasAñoActual', 'ventasAñoAnterior', 'tendenciaAño', 'porcentajeAño');
}

// Función auxiliar para actualizar comparativas
function actualizarComparativa(periodo, actual, anterior, idActual, idAnterior, idTendencia, idPorcentaje) {
    // Actualizar valores
    document.getElementById(idActual).textContent = `€${actual.toFixed(2)}`;
    document.getElementById(idAnterior).textContent = `€${anterior.toFixed(2)}`;

    // Calcular porcentaje y tendencia
    let porcentaje = 0;
    let tendencia = '→';
    let color = '#888';

    if (anterior > 0) {
        porcentaje = ((actual - anterior) / anterior) * 100;

        if (porcentaje > 0) {
            tendencia = '↗️';
            color = '#22c55e';
        } else if (porcentaje < 0) {
            tendencia = '↘️';
            color = '#ff6b6b';
        }
    } else if (actual > 0) {
        porcentaje = 100;
        tendencia = '🚀';
        color = '#22c55e';
    }

    // Actualizar UI
    const elemTendencia = document.getElementById(idTendencia);
    const elemPorcentaje = document.getElementById(idPorcentaje);

    if (elemTendencia) {
        elemTendencia.textContent = tendencia;
    }

    if (elemPorcentaje) {
        elemPorcentaje.textContent = `${porcentaje >= 0 ? '+' : ''}${Math.abs(porcentaje).toFixed(1)}%`;
        elemPorcentaje.style.color = color;

        // Agregar clase para animación
        elemPorcentaje.style.fontWeight = 'bold';
        if (Math.abs(porcentaje) > 10) {
            elemPorcentaje.style.fontSize = '1.1em';
        }
    }
}

function limpiarGraficosAlCambiarTab() {
    // Solo limpiar si salimos de facturación
    if (tabAnterior === 'facturacion' && graficos) {
        console.log('🧹 Limpiando gráficos al cambiar de pestaña...');

        Object.keys(graficos).forEach(key => {
            if (graficos[key]) {
                try {
                    graficos[key].destroy();
                    graficos[key] = null;
                } catch (e) {
                    console.log(`Error limpiando ${key}:`, e);
                }
            }
        });
    }
}
// Modificar la función showTab existente (solo si existe)
if (typeof showTab === 'function') {
    const showTabOriginal = showTab;
    showTab = function (tabName) {
        limpiarGraficosAlCambiarTab();
        tabAnterior = document.querySelector('.tab-content.active')?.id || 'mesas';
        showTabOriginal(tabName);
    }
}





