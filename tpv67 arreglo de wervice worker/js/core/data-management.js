
async function actualizarFacturacion() {
    // NUEVO: Obtener TODAS las ventas para totales reales
    let todasLasVentas = [];
    try {
        // Usar función que obtiene TODO sin filtros
        todasLasVentas = await DB.obtenerFacturacion();
    } catch (error) {
        console.error('Error al obtener facturación:', error);
        todasLasVentas = [];
    }

    // Para las tablas de detalles, obtener solo lo permitido por licencia
    try {
        facturacion = await DB.obtenerFacturacion();
    } catch (error) {
        console.error('Error al obtener facturación:', error);
        facturacion = [];
    }

    // Verificar licencia
    const licenciaActual = obtenerEstadoLicencia();

    // Cargar y mostrar gráficos para Pro/Premium
    if (licenciaActual.tipo === 'pro' || licenciaActual.tipo === 'premium') {
        console.log('📊 Iniciando carga de gráficos Pro/Premium...');

        // Asegurar que Chart.js esté cargado
        const chartCargado = await cargarChartJS();

        if (chartCargado) {
            // Asegurar que el contenedor esté visible
            const contenedor = document.getElementById('graficosProPremium');
            if (contenedor) {
                contenedor.style.display = 'block';

                // Forzar reflow del DOM
                contenedor.offsetHeight;

                // Generar gráficos con un pequeño delay
                setTimeout(async () => {
                    try {
                        await mostrarGraficosAvanzados(todasLasVentas);

                        // Forzar redibujado de todos los gráficos
                        Object.keys(graficos).forEach(key => {
                            if (graficos[key]) {
                                graficos[key].update();
                            }
                        });

                    } catch (error) {
                        console.error('❌ Error al generar gráficos:', error);
                    }
                }, 200);
            }
        } else {
            console.error('❌ Chart.js no se pudo cargar');
            document.getElementById('graficosProPremium').style.display = 'none';
        }
    } else {
        // Ocultar para licencias standard
        const contenedor = document.getElementById('graficosProPremium');
        if (contenedor) {
            contenedor.style.display = 'none';
        }
    }


    // Si no es premium, mostrar versión standard
    if (licenciaActual.tipo === 'standard') {
        mostrarFacturacionStandard();
        return;
    }

    // Si es trial, mostrar aviso
    if (licenciaActual.tipo === 'trial') {
        mostrarAvisoTrial();
    }

    // Continuar con facturación premium...
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1);
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    // Calcular totales CON TODAS LAS VENTAS (sin restricción de licencia)
    let totalHoy = 0;
    let totalSemana = 0;
    let totalMes = 0;
    let totalTrimestre = 0;
    const trimestreActual = getTrimestreActual();
    const totalesPorAño = {}; // NUEVO: Totales por año

    // Usar TODAS las ventas para totales reales
    todasLasVentas.forEach(venta => {
        const fechaVenta = new Date(venta.fecha);
        const año = fechaVenta.getFullYear();

        // Acumular por año
        if (!totalesPorAño[año]) {
            totalesPorAño[año] = {
                total: 0,
                ventas: 0
            };
        }
        totalesPorAño[año].total += venta.total;
        totalesPorAño[año].ventas++;

        // Totales normales
        if (fechaVenta.toDateString() === hoy.toDateString()) {
            totalHoy += venta.total;
        }
        if (fechaVenta >= inicioSemana) {
            totalSemana += venta.total;
        }
        if (fechaVenta >= inicioMes) {
            totalMes += venta.total;
        }
        if (fechaVenta >= trimestreActual.inicio) {
            totalTrimestre += venta.total;
        }
    });

    // Para las tablas de detalles, usar solo ventas filtradas por licencia
    const facturacionPorDia = {};
    const facturacionPorSemana = {};

    facturacion.forEach(venta => {
        const fechaVenta = new Date(venta.fecha);
        const dia = fechaVenta.toLocaleDateString('es-ES');
        const semana = getNumeroSemana(fechaVenta);

        // Por día
        if (!facturacionPorDia[dia]) {
            facturacionPorDia[dia] = 0;
        }
        facturacionPorDia[dia] += venta.total;

        // Por semana
        const keySemana = `Semana ${semana} - ${fechaVenta.getFullYear()}`;
        if (!facturacionPorSemana[keySemana]) {
            facturacionPorSemana[keySemana] = 0;
        }
        facturacionPorSemana[keySemana] += venta.total;
    });

    // Actualizar UI
    document.getElementById('facturacionHoy').textContent = `€${totalHoy.toFixed(2)}`;
    document.getElementById('facturacionSemana').textContent = `€${totalSemana.toFixed(2)}`;
    document.getElementById('facturacionMes').textContent = `€${totalMes.toFixed(2)}`;

    // Actualizar total del trimestre
    document.getElementById('facturacionTrimestre').textContent = `€${totalTrimestre.toFixed(2)}`;

    // Actualizar nombre del trimestre
    const nombresTrimestres = {
        1: 'Q1 (Ene-Mar)',
        2: 'Q2 (Abr-Jun)',
        3: 'Q3 (Jul-Sep)',
        4: 'Q4 (Oct-Dic)'
    };

    const elemNombreTrimestre = document.getElementById('nombreTrimestre');
    if (elemNombreTrimestre) {
        elemNombreTrimestre.textContent = nombresTrimestres[trimestreActual.numero];
    }

    // Mostrar totales por año
    mostrarTotalesPorAño(totalesPorAño);

    // Tabla diaria
    const tbodyDiaria = document.getElementById('facturacionDiaria');
    tbodyDiaria.innerHTML = '';

    // Últimos 7 días
    const diasMostrar = [];
    for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        diasMostrar.push(fecha.toLocaleDateString('es-ES'));
    }

    diasMostrar.forEach(dia => {
        const tr = document.createElement('tr');
        const total = facturacionPorDia[dia] || 0;
        tr.innerHTML = `
            <td>${dia}</td>
            <td><strong>€${total.toFixed(2)}</strong></td>
        `;
        tbodyDiaria.appendChild(tr);
    });

    // Tabla semanal
    const tbodySemanal = document.getElementById('facturacionSemanal');
    tbodySemanal.innerHTML = '';

    Object.entries(facturacionPorSemana).slice(-4).forEach(([semana, total]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${semana}</td>
            <td><strong>€${total.toFixed(2)}</strong></td>
        `;
        tbodySemanal.appendChild(tr);
    });
}




function mostrarTotalesPorAño(totalesPorAño) {
    // Buscar o crear contenedor
    let contenedorAños = document.getElementById('totalesPorAño');

    if (!contenedorAños) {
        // Crear contenedor si no existe
        const statsGrid = document.querySelector('#facturacion .stats-grid');
        if (!statsGrid) return;

        contenedorAños = document.createElement('div');
        contenedorAños.id = 'totalesPorAño';
        contenedorAños.style.cssText = `
            background: linear-gradient(135deg, rgba(30, 30, 30, 0.9), rgba(40, 40, 40, 0.9));
            border: 2px solid rgba(255, 165, 2, 0.3);
            padding: 25px;
            border-radius: 20px;
            margin: 30px 0;
            position: relative;
            overflow: hidden;
        `;

        // Insertar después de stats-grid
        statsGrid.parentNode.insertBefore(contenedorAños, statsGrid.nextSibling);
    }

    // Ordenar años de más reciente a más antiguo
    const añosOrdenados = Object.keys(totalesPorAño).sort((a, b) => b - a);

    // Generar HTML
    let html = `
        <div style="position: absolute; top: -30px; right: -30px; font-size: 120px; opacity: 0.05; transform: rotate(-15deg);">
            📊
        </div>
        <h3 style="color: #ffa502; margin-bottom: 20px; font-size: 1.3em;">
            💰 Facturación por Año Fiscal
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
    `;

    añosOrdenados.forEach(año => {
        const datos = totalesPorAño[año];
        const esAñoActual = año == new Date().getFullYear();

        html += `
            <div style="
                background: ${esAñoActual ? 'rgba(255, 165, 2, 0.1)' : 'rgba(50, 50, 50, 0.5)'};
                border: 1px solid ${esAñoActual ? 'rgba(255, 165, 2, 0.5)' : 'rgba(255, 255, 255, 0.1)'};
                padding: 20px;
                border-radius: 15px;
                text-align: center;
                transition: all 0.3s ease;
                cursor: default;
                position: relative;
            " 
            onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0,0,0,0.3)'"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                ${esAñoActual ? '<div style="position: absolute; top: 5px; right: 10px; background: #ffa502; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7em;">ACTUAL</div>' : ''}
                <h4 style="color: ${esAñoActual ? '#ffa502' : '#fff'}; font-size: 1.4em; margin-bottom: 10px;">
                    ${año}
                </h4>
                <div style="font-size: 2em; font-weight: bold; color: ${esAñoActual ? '#ffa502' : '#22c55e'}; margin-bottom: 5px;">
                    €${datos.total.toFixed(2)}
                </div>
                <div style="color: #888; font-size: 0.9em;">
                    ${datos.ventas.toLocaleString()} ventas
                </div>
            </div>
        `;
    });

    html += `</div>`;

    // Agregar nota según licencia
    const licencia = obtenerEstadoLicencia();
    if (licencia.tipo === 'standard' && !licencia.pagada) {
        html += `
            <div style="margin-top: 20px; padding: 15px; background: rgba(255, 165, 2, 0.1); border: 1px solid rgba(255, 165, 2, 0.3); border-radius: 10px; text-align: center;">
                <p style="color: #ffa502; margin: 0;">
                    📌 <strong>Nota:</strong> Los totales incluyen todo tu histórico. 
                    Con la versión gratuita solo puedes ver el detalle de los últimos 6 meses.
                </p>
            </div>
        `;
    }

    contenedorAños.innerHTML = html;
}

// Función para mostrar facturación standard
async function mostrarFacturacionStandard() {
    // Asegurar que facturacion esté cargada
    if (!facturacion || facturacion.length === 0) {
        facturacion = await DB.obtenerFacturacion();
    }

    const contenedor = document.querySelector('#facturacion');

    // Calcular totales básicos
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1);
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    let totalHoy = 0;
    let totalSemana = 0;
    let totalMes = 0;

    facturacion.forEach(venta => {
        const fechaVenta = new Date(venta.fecha);
        if (fechaVenta.toDateString() === hoy.toDateString()) {
            totalHoy += venta.total;
        }
        if (fechaVenta >= inicioSemana) {
            totalSemana += venta.total;
        }
        if (fechaVenta >= inicioMes) {
            totalMes += venta.total;
        }
    });

    // Actualizar solo los totales básicos
    document.getElementById('facturacionHoy').textContent = `€${totalHoy.toFixed(2)}`;
    document.getElementById('facturacionSemana').textContent = `€${totalSemana.toFixed(2)}`;
    document.getElementById('facturacionMes').textContent = `€${totalMes.toFixed(2)}`;

    // NUEVO: Mostrar datos archivados si existen
    const datosArchivados = localStorage.getItem('datosArchivados');
    if (datosArchivados) {
        const { ventasOcultas, totalOculto } = JSON.parse(datosArchivados);

        if (ventasOcultas > 0) {
            // Crear mensaje persuasivo
            let mensajeArchivado = document.getElementById('mensajeArchivado');
            if (!mensajeArchivado) {
                mensajeArchivado = document.createElement('div');
                mensajeArchivado.id = 'mensajeArchivado';
                mensajeArchivado.style.cssText = `
                    background: linear-gradient(135deg, rgba(255, 165, 2, 0.1), rgba(255, 215, 0, 0.1));
                    border: 1px solid rgba(255, 165, 2, 0.3);
                    padding: 20px;
                    border-radius: 15px;
                    margin: 20px 0;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                `;

                mensajeArchivado.innerHTML = `
                    <div style="position: absolute; top: -50px; right: -50px; font-size: 100px; opacity: 0.1; transform: rotate(-15deg);">
                        🔒
                    </div>
                    <h3 style="color: #ffa502; margin-bottom: 15px;">
                        💎 Tu histórico completo está seguro
                    </h3>
                    <p style="color: #e0e0e0; margin-bottom: 15px;">
                        Tienes <strong>${ventasOcultas} ventas</strong> anteriores a los 6 meses visibles.
                        Todos tus totales anuales incluyen el histórico completo.
                    </p>
                    <div style="margin: 20px 0; padding: 15px; background: rgba(40, 40, 40, 0.5); border-radius: 10px;">
                        <p style="color: #22c55e; font-size: 1.1em; margin: 0;">
                            ✅ Tus totales por año son REALES y COMPLETOS
                        </p>
                        <p style="color: #888; font-size: 0.9em; margin: 5px 0 0 0;">
                            Solo el detalle diario está limitado a 6 meses
                        </p>
                    </div>
                    <button class="btn-warning" onclick="mostrarModalPremium()" 
                            style="padding: 12px 30px; font-size: 16px; font-weight: bold;">
                        🔓 Desbloquear Detalle Completo
                    </button>
                    <p style="color: #888; margin-top: 10px; font-size: 0.9em;">
                        Solo 69€/mes - Accede a todo el historial detallado
                    </p>
                `;

                const statsGrid = document.querySelector('#facturacion .stats-grid');
                if (statsGrid) {
                    statsGrid.parentNode.insertBefore(mensajeArchivado, statsGrid);
                }
            }
        }
    }

    // Mostrar el banner apropiado según la licencia
    const licencia = obtenerEstadoLicencia();

    if (licencia.tipo === 'standard' && !licencia.pagada) {
        // Usuario gratuito - mostrar upgrade a Standard pagado
        mostrarBannerUpgradeStandard();
    } else if (licencia.tipo === 'standard' && licencia.pagada) {
        // Usuario con Standard pagado - mostrar upgrade a Pro
        mostrarBannerUpgradePro();
    }
}


// Banner para usuarios gratuitos -> Standard 49€
function mostrarBannerUpgradeStandard() {
    let bannerContainer = document.getElementById('bannerUpgrade');

    if (!bannerContainer) {
        bannerContainer = document.createElement('div');
        bannerContainer.id = 'bannerUpgrade';
        bannerContainer.style.cssText = `
            background: linear-gradient(135deg, rgba(74, 85, 104, 0.1), rgba(74, 85, 104, 0.2));
            border: 2px solid rgba(74, 85, 104, 0.5);
            padding: 30px;
            border-radius: 20px;
            margin: 30px 0;
            text-align: center;
        `;

        bannerContainer.innerHTML = `
            <h3 style="color: #e0e0e0; margin-bottom: 20px;">📊 Desbloquea Facturación Completa</h3>
            <p style="color: #e0e0e0; margin-bottom: 20px;">
                Obtén acceso a reportes detallados, exportación de datos y soporte técnico.
            </p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
                <div style="background: rgba(40, 40, 40, 0.5); padding: 15px; border-radius: 10px;">
                    <h4 style="color: #e0e0e0;">📊 Reportes Completos</h4>
                    <p style="color: #888; font-size: 0.9em;">Accede a todos tus datos históricos</p>
                </div>
                <div style="background: rgba(40, 40, 40, 0.5); padding: 15px; border-radius: 10px;">
                    <h4 style="color: #e0e0e0;">💾 Exportación</h4>
                    <p style="color: #888; font-size: 0.9em;">Descarga tus datos cuando quieras</p>
                </div>
                <div style="background: rgba(40, 40, 40, 0.5); padding: 15px; border-radius: 10px;">
                    <h4 style="color: #e0e0e0;">🛟 Soporte</h4>
                    <p style="color: #888; font-size: 0.9em;">Ayuda técnica cuando la necesites</p>
                </div>
            </div>
            <div style="margin-top: 30px;">
                <button class="btn-primary" onclick="mostrarModalPremium()" style="padding: 15px 40px; font-size: 18px;">
                    🔓 Ver Planes de Pago
                </button>
                <p style="color: #888; margin-top: 10px; font-size: 0.9em;">
                    Desde solo 49€/mes
                </p>
            </div>
        `;

        const statsGrid = document.querySelector('#facturacion .stats-grid');
        if (statsGrid) {
            statsGrid.parentNode.insertBefore(bannerContainer, statsGrid.nextSibling);
        }
    }
}


// Banner para usuarios Standard 49€ -> Pro 69€
function mostrarBannerUpgradePro() {
    let bannerContainer = document.getElementById('bannerUpgrade');

    if (!bannerContainer) {
        bannerContainer = document.createElement('div');
        bannerContainer.id = 'bannerUpgrade';
        bannerContainer.style.cssText = `
            background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 165, 2, 0.1));
            border: 2px solid rgba(255, 165, 2, 0.5);
            padding: 30px;
            border-radius: 20px;
            margin: 30px 0;
            text-align: center;
            position: relative;
            overflow: hidden;
        `;

        // Badge "RECOMENDADO"
        bannerContainer.innerHTML = `
            <div style="position: absolute; top: 20px; right: 20px; background: #ffa502; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 0.9em;">
                🔥 RECOMENDADO
            </div>
            <h3 style="color: #ffa502; margin-bottom: 20px; font-size: 1.8em;">⭐ Desbloquea Análisis Avanzado PRO</h3>
            <p style="color: #e0e0e0; margin-bottom: 25px; font-size: 1.1em;">
                Lleva tu negocio al siguiente nivel con herramientas profesionales de análisis
            </p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 25px 0;">
                <div style="background: rgba(40, 40, 40, 0.8); padding: 20px; border-radius: 15px; border: 1px solid rgba(255, 165, 2, 0.3);">
                    <h4 style="color: #ffa502; font-size: 1.2em;">📊 Gráficos Interactivos</h4>
                    <p style="color: #e0e0e0; font-size: 0.95em; margin-top: 10px;">Visualiza tus ventas con gráficos dinámicos y personalizables</p>
                </div>
                <div style="background: rgba(40, 40, 40, 0.8); padding: 20px; border-radius: 15px; border: 1px solid rgba(255, 165, 2, 0.3);">
                    <h4 style="color: #ffa502; font-size: 1.2em;">🔍 Filtros Avanzados</h4>
                    <p style="color: #e0e0e0; font-size: 0.95em; margin-top: 10px;">Analiza por producto individual, categoría y período personalizado</p>
                </div>
                <div style="background: rgba(40, 40, 40, 0.8); padding: 20px; border-radius: 15px; border: 1px solid rgba(255, 165, 2, 0.3);">
                    <h4 style="color: #ffa502; font-size: 1.2em;">📈 Predicción de Tendencias</h4>
                    <p style="color: #e0e0e0; font-size: 0.95em; margin-top: 10px;">Identifica productos estrella y patrones de venta</p>
                </div>
            </div>
            
            <div style="background: rgba(255, 165, 2, 0.1); padding: 20px; border-radius: 15px; margin: 20px 0;">
                <p style="color: #ffa502; font-size: 1.3em; font-weight: bold; margin: 0;">
                                       🎯 Oferta Especial: Solo 20€ más al mes
                </p>
                <p style="color: #e0e0e0; margin: 5px 0 0 0;">
                    Actualiza de Standard (49€) a Pro (69€)
                </p>
            </div>
            
            <div style="margin-top: 30px;">
                <button class="btn-warning" onclick="mostrarModalPremium()" style="padding: 15px 40px; font-size: 18px; font-weight: bold; animation: pulse 2s infinite;">
                    🚀 Actualizar a PRO ahora
                </button>
                <p style="color: #888; margin-top: 10px; font-size: 0.9em;">
                    Cancela cuando quieras • Sin compromisos
                </p>
            </div>
        `;

        const statsGrid = document.querySelector('#facturacion .stats-grid');
        if (statsGrid) {
            statsGrid.parentNode.insertBefore(bannerContainer, statsGrid.nextSibling);
        }
    }
}

// Función para mostrar botón de upgrade
function mostrarBotonUpgrade() {
    // Buscar si ya existe el contenedor de upgrade
    let upgradeContainer = document.getElementById('upgradeContainer');

    if (!upgradeContainer) {
        upgradeContainer = document.createElement('div');
        upgradeContainer.id = 'upgradeContainer';
        upgradeContainer.style.cssText = `
            background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 165, 2, 0.1));
            border: 2px solid rgba(255, 165, 2, 0.5);
            padding: 30px;
            border-radius: 20px;
            margin: 30px 0;
            text-align: center;
        `;

        upgradeContainer.innerHTML = `
            <h3 style="color: #ffa502; margin-bottom: 20px;">🌟 Desbloquea Análisis Avanzado</h3>
            <p style="color: #e0e0e0; margin-bottom: 20px;">
                Obtén acceso a gráficos detallados, filtros por producto, análisis de tendencias y mucho más.
            </p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
                <div style="background: rgba(40, 40, 40, 0.5); padding: 15px; border-radius: 10px;">
                    <h4 style="color: #ffa502;">📊 Gráficos Interactivos</h4>
                    <p style="color: #888; font-size: 0.9em;">Visualiza tus ventas con gráficos dinámicos</p>
                </div>
                                <div style="background: rgba(40, 40, 40, 0.5); padding: 15px; border-radius: 10px;">
                    <h4 style="color: #ffa502;">🔍 Filtros Avanzados</h4>
                    <p style="color: #888; font-size: 0.9em;">Analiza por producto, categoría y período</p>
                </div>
                <div style="background: rgba(40, 40, 40, 0.5); padding: 15px; border-radius: 10px;">
                    <h4 style="color: #ffa502;">📈 Tendencias</h4>
                    <p style="color: #888; font-size: 0.9em;">Identifica productos estrella y patrones</p>
                </div>
            </div>
            <div style="margin-top: 30px;">
                <button class="btn-warning" onclick="mostrarModalPremium()" style="padding: 15px 40px; font-size: 18px; font-weight: bold;">
                    ⭐ Probar Premium Gratis (30 días)
                </button>
                <p style="color: #888; margin-top: 10px; font-size: 0.9em;">
                    Después ${LICENCIA_CONFIG.PRECIO_PREMIUM}
                </p>
            </div>
        `;

        // Insertar después de los stats-grid
        const statsGrid = document.querySelector('#facturacion .stats-grid');
        if (statsGrid) {
            statsGrid.parentNode.insertBefore(upgradeContainer, statsGrid.nextSibling);
        }
    }
}

// Función para mostrar aviso de trial
function mostrarAvisoTrial() {
    const diasRestantes = licenciaActual.diasRestantes;

    let trialBanner = document.getElementById('trialBanner');
    if (!trialBanner) {
        trialBanner = document.createElement('div');
        trialBanner.id = 'trialBanner';
        trialBanner.style.cssText = `
            background: linear-gradient(135deg, #22c55e, #10b981);
            color: white;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
            font-weight: bold;
        `;

        const facturacionDiv = document.getElementById('facturacion');
        facturacionDiv.insertBefore(trialBanner, facturacionDiv.firstChild.nextSibling);
    }

    trialBanner.innerHTML = `
        🎉 Versión Premium de Prueba - ${diasRestantes} días restantes
        <button onclick="mostrarModalPremium()" style="background: white; color: #22c55e; border: none; padding: 5px 15px; border-radius: 5px; margin-left: 20px; cursor: pointer; font-weight: bold;">
            Activar Licencia Completa
        </button>
    `;
}

function getNumeroSemana(fecha) {
    const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}



// Función para obtener el trimestre actual
function getTrimestreActual() {
    const mes = new Date().getMonth(); // 0-11
    const trimestre = Math.floor(mes / 3) + 1; // 1-4

    const inicioTrimestre = new Date();
    inicioTrimestre.setMonth((trimestre - 1) * 3); // Mes inicio (0, 3, 6, 9)
    inicioTrimestre.setDate(1);
    inicioTrimestre.setHours(0, 0, 0, 0);

    return {
        numero: trimestre,
        inicio: inicioTrimestre,
        nombre: `Q${trimestre}`
    };
}

// Funciones de almacenamiento
function guardarDatos() {
    const datos = {
        mesas: mesas,
        // NO guardamos facturacion aquí - solo está en IndexedDB
        // facturacion: [], // Vacío para compatibilidad
        mesasConfig: mesasConfig,
        ultimaActualizacion: new Date().toISOString()
    };
    localStorage.setItem('barCafeteriaDatos', JSON.stringify(datos));
    if (document.getElementById('ultimaActualizacion')) {
        document.getElementById('ultimaActualizacion').textContent = new Date().toLocaleString('es-ES');
    }
}

async function cargarDatos() {
    // Primero intentar cargar datos básicos de localStorage
    const datosGuardados = localStorage.getItem('barCafeteriaDatos');
    if (datosGuardados) {
        const datos = JSON.parse(datosGuardados);
        mesas = datos.mesas || {};
        mesasConfig = datos.mesasConfig || [];

        if (datos.ultimaActualizacion && document.getElementById('ultimaActualizacion')) {
            document.getElementById('ultimaActualizacion').textContent =
                new Date(datos.ultimaActualizacion).toLocaleString('es-ES');
        }
    }



    // Verificar que mesasConfig esté inicializado
    if (!mesasConfig) {
        mesasConfig = [];
    }

    // Inicializar el objeto mesas para todas las mesas configuradas
    mesasConfig.forEach(mesa => {
        if (!mesas[mesa.id]) {
            mesas[mesa.id] = [];
        }
    });
    // IMPORTANTE: Limpiar array en memoria antes de cargar
    facturacion = [];
    // Cargar facturación desde IndexedDB
    try {
        facturacion = await DB.obtenerFacturacion();
        console.log(`📊 Cargadas ${facturacion.length} ventas desde la base de datos`);
    } catch (error) {
        console.error('Error al cargar facturación:', error);
        facturacion = [];
    }

    // Optimización para tablets lentas
    function optimizarParaTablet() {
        const isTablet = /tablet|ipad|playbook|silk/i.test(navigator.userAgent) ||
            (window.screen.width <= 1024 && window.screen.height <= 768);

        if (isTablet) {
            // Reducir productos por página en tablets
            window.productosPorPagina = 6; // 2x3 en lugar de 3x3

            // Desactivar algunas animaciones
            document.body.classList.add('tablet-mode');

            console.log('🚧 Modo tablet activado - Rendimiento optimizado');
            mostrarNotificacion('📱 Modo tablet: Rendimiento optimizado');
        }
    }

    // Llamar al cargar
    window.addEventListener('load', optimizarParaTablet);
}

async function exportarDatos() {
    try {
        // Obtener TODOS los datos, incluyendo los de IndexedDB
        const datosDB = await DB.exportarDatos();

        const datos = {
            // Datos de configuración
            productos: productos,
            mesasConfig: mesasConfig,
            categorias: categorias,

            // Estado actual
            mesas: mesas,

            // Datos de IndexedDB
            facturacion: datosDB.facturacion || facturacion,
            movimientos: datosDB.movimientos || historialMovimientos,
            estadisticas: datosDB.estadisticas || [],

            // Metadatos
            fechaExportacion: new Date().toISOString(),
            version: '2.0',

            // Configuraciones
            tecladoVirtual: localStorage.getItem('tecladoVirtualActivado') === 'true'
        };

        const dataStr = JSON.stringify(datos, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `bar_cafeteria_backup_${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        mostrarNotificacion('📥 Datos exportados correctamente');
    } catch (error) {
        console.error('Error al exportar datos:', error);
        mostrarNotificacion('❌ Error al exportar datos');
    }
}
// NUEVA FUNCIÓN: Crear backup de seguridad antes de importar
async function crearBackupSeguridad() {
    try {
        mostrarNotificacion('🔄 Creando backup de seguridad...');

        const backupDatos = {
            fecha: new Date().toISOString(),
            facturacion: await DB.obtenerFacturacion(),
            movimientos: await DB.obtenerMovimientos(null, 99999),
            productos: productos,
            mesasConfig: mesasConfig,
            categorias: categorias,
            areas: areas
        };

        // Guardar en localStorage temporal
        localStorage.setItem('backupEmergencia', JSON.stringify(backupDatos));

        return true;
    } catch (error) {
        console.error('Error al crear backup:', error);
        return false;
    }
}

// Restaurar desde backup de emergencia
async function restaurarBackupEmergencia() {
    const backupStr = localStorage.getItem('backupEmergencia');
    if (!backupStr) {
        alert('No hay backup de emergencia disponible');
        return false;
    }

    try {
        const backup = JSON.parse(backupStr);
        mostrarNotificacion('🔄 Restaurando backup de emergencia...');

        // Restaurar cada tipo de datos
        for (const venta of backup.facturacion) {
            await DB.guardarFacturacion(venta);
        }

        for (const movimiento of backup.movimientos) {
            await DB.guardarMovimiento(movimiento);
        }

        // Restaurar configuraciones
        productos = backup.productos;
        mesasConfig = backup.mesasConfig;
        categorias = backup.categorias;
        areas = backup.areas;

        // Guardar en localStorage
        localStorage.setItem('productosPersonalizados', JSON.stringify(productos));
        localStorage.setItem('mesasConfiguracion', JSON.stringify(mesasConfig));
        localStorage.setItem('categoriasPersonalizadas', JSON.stringify(categorias));
        localStorage.setItem('areasPersonalizadas', JSON.stringify(areas));

        mostrarNotificacion('✅ Backup restaurado correctamente');
        return true;
    } catch (error) {
        console.error('Error al restaurar backup:', error);
        alert('Error crítico al restaurar backup. Contacta soporte.');
        return false;
    }
}

async function importarDatos(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            const datos = JSON.parse(e.target.result);

            // Detectar versión del backup
            const esVersionAntigua = !datos.version;

            if (confirm(`¿Estás seguro de importar estos datos${esVersionAntigua ? ' (versión antigua)' : ''}? Se sobrescribirán los datos actuales.`)) {

                // NUEVO: Crear backup de emergencia ANTES de hacer cualquier cambio
                const backupCreado = await crearBackupSeguridad();
                if (!backupCreado) {
                    if (!confirm('⚠️ No se pudo crear backup de seguridad. ¿Continuar de todos modos?')) {
                        return;
                    }
                }

                // Mensaje de progreso
                mostrarNotificacion('⏳ Importando datos...');

                // Importar datos básicos
                mesas = datos.mesas || {};

                // Importar configuración de mesas (compatible con versión antigua)
                if (datos.mesasConfig) {
                    mesasConfig = datos.mesasConfig;
                } else {
                    // Si no hay mesasConfig, mantener la actual
                    console.log('📌 Manteniendo configuración de mesas actual');
                }

                // Importar productos si existen
                if (datos.productos) {
                    productos = datos.productos;
                    localStorage.setItem('productosPersonalizados', JSON.stringify(productos));
                } else {
                    console.log('📌 No hay productos en el backup, manteniendo actuales');
                }

                // Importar categorías si existen
                if (datos.categorias) {
                    categorias = datos.categorias;
                    localStorage.setItem('categoriasPersonalizadas', JSON.stringify(categorias));
                } else {
                    console.log('📌 No hay categorías en el backup, manteniendo actuales');
                }

                // Importar configuración de teclado si existe
                if (datos.tecladoVirtual !== undefined) {
                    localStorage.setItem('tecladoVirtualActivado', datos.tecladoVirtual);
                }

                // NUEVO: Primero intentar importar a una tabla temporal
                mostrarNotificacion('📥 Validando datos a importar...');

                // Validar que los datos sean correctos
                let datosValidos = true;
                let ventasAImportar = [];

                if (datos.facturacion && datos.facturacion.length > 0) {
                    // Validar cada venta antes de importar
                    for (const venta of datos.facturacion) {
                        if (venta.total !== undefined && venta.fecha && venta.mesa !== undefined) {
                            ventasAImportar.push(venta);
                        } else {
                            console.warn('Venta inválida ignorada:', venta);
                        }
                    }

                    if (ventasAImportar.length === 0) {
                        throw new Error('No hay ventas válidas para importar');
                    }

                    mostrarNotificacion(`✅ ${ventasAImportar.length} ventas válidas encontradas`);
                }

                // AHORA SÍ: Limpiar datos antiguos SOLO si hay datos válidos
                if (ventasAImportar.length > 0) {
                    mostrarNotificacion('🔄 Reemplazando datos anteriores...');

                    try {
                        await new Promise((resolve, reject) => {
                            const transaction = DB.db.transaction(['facturacion'], 'readwrite');
                            const store = transaction.objectStore('facturacion');
                            const request = store.clear();

                            request.onsuccess = () => resolve();
                            request.onerror = () => reject(request.error);
                        });

                        // Limpiar array local también
                        facturacion = [];

                    } catch (error) {
                        console.error('Error al limpiar datos:', error);
                        // Si falla el borrado, restaurar backup
                        await restaurarBackupEmergencia();
                        throw new Error('Error al preparar la importación. Backup restaurado.');
                    }
                }

                // Importar las ventas validadas
                let ventasImportadas = 0;
                let erroresImportacion = 0;

                for (const venta of ventasAImportar) {
                    try {
                        await DB.guardarFacturacion(venta);
                        ventasImportadas++;
                    } catch (error) {
                        console.error('Error al importar venta:', error);
                        erroresImportacion++;
                    }
                }

                // Verificar resultado
                if (ventasImportadas === 0 && ventasAImportar.length > 0) {
                    // Si no se importó nada, restaurar backup
                    await restaurarBackupEmergencia();
                    throw new Error('No se pudo importar ninguna venta. Backup restaurado.');
                }

                console.log(`✅ ${ventasImportadas} de ${ventasAImportar.length} ventas importadas`);

                if (erroresImportacion > 0) {
                    mostrarNotificacion(`⚠️ ${erroresImportacion} ventas no se pudieron importar`);
                }

                // Si hay movimientos, importarlos
                if (datos.movimientos && datos.movimientos.length > 0) {
                    console.log(`📦 Importando ${datos.movimientos.length} movimientos...`);

                    // Limpiar movimientos anteriores también
                    try {
                        await new Promise((resolve, reject) => {
                            const transaction = DB.db.transaction(['movimientos'], 'readwrite');
                            const store = transaction.objectStore('movimientos');
                            const request = store.clear();

                            request.onsuccess = () => resolve();
                            request.onerror = () => reject(request.error);
                        });
                    } catch (error) {
                        console.error('Error al limpiar movimientos:', error);
                    }

                    // Importar nuevos movimientos
                    for (const movimiento of datos.movimientos) {
                        try {
                            await DB.guardarMovimiento(movimiento);
                        } catch (error) {
                            console.error('Error al guardar movimiento:', error);
                        }
                    }
                }

                // Guardar configuración de mesas
                if (mesasConfig && mesasConfig.length > 0) {
                    localStorage.setItem('mesasConfiguracion', JSON.stringify(mesasConfig));
                }

                // Guardar datos básicos
                guardarDatos();

                // Actualizar todas las interfaces
                renderizarMesas();
                await actualizarFacturacion(); // Hacer async
                renderizarListaProductos();
                renderizarListaMesas();
                renderizarListaCategorias();
                actualizarSelectoresCategorias();
                renderizarListaAreas();
                actualizarSelectoresAreas();

                // Mensaje de éxito con detalles
                let mensaje = '✅ Datos importados correctamente';
                if (esVersionAntigua) {
                    mensaje += '\n⚠️ Backup de versión antigua - algunos datos podrían faltar';
                }

                // NUEVO: Limpiar backup de emergencia si todo salió bien
                localStorage.removeItem('backupEmergencia');
                console.log('✅ Backup de emergencia eliminado (ya no es necesario)');

                mostrarNotificacion(mensaje);

                // MODIFICADO: Para TPV no recargar página, solo actualizar interfaces
                setTimeout(() => {
                    // Actualizar todo sin recargar
                    actualizarTabInventario();
                    if (document.getElementById('pedidos').classList.contains('active')) {
                        actualizarTabPedidos();
                    }

                    // Mostrar mensaje de éxito más largo
                    mostrarNotificacion('✅ Importación completada. Sistema actualizado.');
                }, 1000);
            }
        } catch (error) {
            console.error('Error durante importación:', error);

            // Intentar restaurar backup si existe
            const backupDisponible = localStorage.getItem('backupEmergencia');
            if (backupDisponible) {
                if (confirm(`❌ Error al importar: ${error.message}\n\n¿Deseas restaurar el backup de seguridad?`)) {
                    const restaurado = await restaurarBackupEmergencia();
                    if (restaurado) {
                        // Para TPV, actualizar interfaces sin recargar
                        renderizarMesas();
                        await actualizarFacturacion();
                        renderizarListaProductos();
                        renderizarListaMesas();
                        mostrarNotificacion('✅ Backup restaurado. Sistema operativo.');
                    }
                }
            } else {
                alert(`❌ Error al importar los datos:\n${error.message}\n\nNo hay backup disponible para restaurar.`);
            }
        }
    };

    reader.onerror = function () {
        alert('Error al leer el archivo');
    };

    reader.readAsText(file);
}

async function limpiarTodo() {
    // Confirmar con más detalle
    const confirmacion1 = confirm('⚠️ ADVERTENCIA: Esta acción borrará TODOS los datos:\n\n' +
        '• Todas las ventas y facturación\n' +
        '• TODOS los productos (volverán los 10 de fábrica)\n' +
        '• TODAS las categorías personalizadas\n' +
        '• Configuración de mesas\n' +
        '• Historial de inventario\n' +
        '• TODO volverá a los valores de fábrica\n\n' +
        '¿Estás seguro?');

    if (!confirmacion1) return;

    // Segunda confirmación para estar seguros
    const confirmacion2 = confirm('🚨 ÚLTIMA CONFIRMACIÓN:\n\n' +
        'Esta acción NO se puede deshacer.\n' +
        'Se recomienda exportar un backup antes.\n\n' +
        '¿Realmente quieres restablecer TODO a valores de fábrica?');

    if (!confirmacion2) return;

    mostrarNotificacion('🔄 Restableciendo valores de fábrica...');

    try {
        // 1. Limpiar toda la base de datos IndexedDB
        console.log('🗑️ Limpiando base de datos...');

        // Limpiar facturación
        await new Promise((resolve) => {
            const transaction = DB.db.transaction(['facturacion'], 'readwrite');
            const store = transaction.objectStore('facturacion');
            store.clear();
            transaction.oncomplete = resolve;
        });

        // Limpiar movimientos
        await new Promise((resolve) => {
            const transaction = DB.db.transaction(['movimientos'], 'readwrite');
            const store = transaction.objectStore('movimientos');
            store.clear();
            transaction.oncomplete = resolve;
        });

        // Limpiar estadísticas
        await new Promise((resolve) => {
            const transaction = DB.db.transaction(['estadisticas'], 'readwrite');
            const store = transaction.objectStore('estadisticas');
            store.clear();
            transaction.oncomplete = resolve;
        });

        // Limpiar imágenes
        await new Promise((resolve) => {
            const transaction = DB.db.transaction(['imagenes'], 'readwrite');
            const store = transaction.objectStore('imagenes');
            store.clear();
            transaction.oncomplete = resolve;
        });

        // 2. Limpiar todo localStorage excepto licencia
        const licenciaBackup = localStorage.getItem('lic_data');
        const keysToRemove = [
            'barCafeteriaDatos',
            'productosPersonalizados',
            'mesasConfiguracion',
            'categoriasPersonalizadas',
            'historialMovimientos',
            'tecladoVirtualActivado',
            'datosMigradosIndexedDB'
        ];

        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Restaurar licencia si existía
        if (licenciaBackup) {
            localStorage.setItem('lic_data', licenciaBackup);
        }

        // 2.5 FORZAR limpieza completa de productos y categorías
        console.log('🗑️ Limpiando productos personalizados...');

        // Eliminar del localStorage
        localStorage.removeItem('productosPersonalizados');
        localStorage.removeItem('categoriasPersonalizadas');

        // Limpiar cualquier rastro en localStorage
        const keysToDelete = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('producto') || key.includes('categoria') || key.includes('Product') || key.includes('Categor'))) {
                if (key !== 'lic_data') {
                    keysToDelete.push(key);
                }
            }
        }
        keysToDelete.forEach(key => localStorage.removeItem(key));

        // 3. Restablecer valores de fábrica (todo vacío)
        // IMPORTANTE: Vaciar TODOS los arrays
        productos = [];
        categorias = [];
        areas = [];
        mesasConfig = [];

        // Asegurar que también están vacíos en window
        window.productos = [];
        window.categorias = [];
        window.areas = [];

        // Reinicializar mesas vacías
        mesas = {};

        // Reinicializar arrays de datos
        facturacion = [];
        historialMovimientos = [];

        // 4. Guardar configuración por defecto

        localStorage.setItem('productosPersonalizados', JSON.stringify(productos));
        localStorage.setItem('areasPersonalizadas', JSON.stringify(areas));
        localStorage.setItem('categoriasPersonalizadas', JSON.stringify(categorias));
        localStorage.setItem('mesasConfiguracion', JSON.stringify(mesasConfig));

        // 5. Actualizar todas las interfaces
        renderizarMesas();
        await actualizarFacturacion();
        renderizarListaProductos();
        renderizarListaMesas();
        renderizarListaCategorias();
        actualizarSelectoresCategorias();
        renderizarListaAreas();
        actualizarSelectoresAreas();

        // Forzar guardado de valores de fábrica
        localStorage.setItem('productosPersonalizados', JSON.stringify(productos));
        localStorage.setItem('categoriasPersonalizadas', JSON.stringify(categorias));
        localStorage.setItem('mesasConfiguracion', JSON.stringify(mesasConfig));

        // Verificar que se guardó correctamente
        console.log('✅ Productos restablecidos:', productos.length);
        console.log('✅ Categorías restablecidas:', categorias.length);

        mostrarNotificacion('✅ Sistema restablecido a valores de fábrica');

        // Recargar página después de 2 segundos
        setTimeout(() => {
            location.reload();
        }, 2000);

    } catch (error) {
        console.error('Error al limpiar:', error);
        alert('Hubo un error al restablecer el sistema. Por favor, recarga la página.');
    }
}