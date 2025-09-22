// ========================================
// BÚSQUEDAS AVANZADAS PARA PREMIUM
// ========================================

// Función de búsqueda avanzada para usuarios Premium
async function busquedaAvanzadaPremium(criterios) {
    const licencia = obtenerEstadoLicencia();

    if (licencia.tipo !== 'premium' && licencia.tipo !== 'pro') {
        mostrarModalPremium();
        return [];
    }

    try {
        const resultados = await DB.busquedaAvanzada(criterios);
        return resultados;
    } catch (error) {
        console.error('Error en búsqueda avanzada:', error);
        alert(error.message);
        return [];
    }
}
// Función para mostrar panel de búsqueda avanzada
function mostrarPanelBusquedaAvanzada() {
    const licencia = obtenerEstadoLicencia();

    if (licencia.tipo === 'standard' || licencia.tipo === 'standard-pagado') {
        const contenedor = document.createElement('div');
        contenedor.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 165, 2, 0.1)); 
                        border: 2px solid rgba(255, 165, 2, 0.5); 
                        padding: 30px; 
                        border-radius: 20px; 
                        text-align: center; 
                        margin: 20px 0;">
                <h3 style="color: #ffa502; margin-bottom: 20px;">🔍 Búsquedas Avanzadas</h3>
                <p style="color: #e0e0e0; margin-bottom: 20px;">
                    Encuentra exactamente lo que buscas con filtros avanzados por producto, 
                    rango de precios, horarios y más.
                </p>
                <button class="btn-warning" onclick="mostrarModalPremium()">
                    ⭐ Desbloquear con Pro/Premium
                </button>
            </div>
        `;
        return contenedor;
    }

    // Si es Pro o Premium, mostrar el panel completo
    const panel = document.createElement('div');
    panel.innerHTML = `
        <div style="background: rgba(30, 30, 30, 0.9); padding: 20px; border-radius: 15px; margin: 20px 0;">
            <h3 style="color: #ffa502; margin-bottom: 20px;">🔍 Búsqueda Avanzada</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div>
                    <label>Producto específico:</label>
                    <select id="busquedaProducto" style="width: 100%; padding: 10px; background: rgba(40, 40, 40, 0.9); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: white;">
                        <option value="">Todos</option>
                        ${productos.map(p => `<option value="${p.id}">${p.emoji} ${p.nombre}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label>Rango de total:</label>
                    <div style="display: flex; gap: 10px;">
                        <input type="number" id="totalMin" placeholder="Min" style="width: 50%; padding: 10px; background: rgba(40, 40, 40, 0.9); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: white;">
                        <input type="number" id="totalMax" placeholder="Max" style="width: 50%; padding: 10px; background: rgba(40, 40, 40, 0.9); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: white;">
                    </div>
                </div>
                <div>
                    <label>Método de pago:</label>
                    <select id="busquedaMetodoPago" style="width: 100%; padding: 10px; background: rgba(40, 40, 40, 0.9); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: white;">
                        <option value="">Todos</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="bizum">Bizum</option>
                        <option value="transferencia">Transferencia</option>
                    </select>
                </div>
                <button class="btn-success" onclick="ejecutarBusquedaAvanzada()">🔍 Buscar</button>
            </div>
        </div>
    `;
    return panel;
}



// Función para ejecutar búsqueda avanzada
async function ejecutarBusquedaAvanzada() {
    const productoId = parseInt(document.getElementById('busquedaProducto').value) || null;
    const totalMin = parseFloat(document.getElementById('totalMin').value) || null;
    const totalMax = parseFloat(document.getElementById('totalMax').value) || null;
    const metodoPago = document.getElementById('busquedaMetodoPago').value || null;

    const criterios = {};

    if (productoId) criterios.productoId = productoId;
    if (totalMin !== null || totalMax !== null) {
        criterios.rangoTotal = {
            min: totalMin || 0,
            max: totalMax || 999999
        };
    }
    if (metodoPago) criterios.metodoPago = metodoPago;

    const resultados = await busquedaAvanzadaPremium(criterios);

    // Mostrar resultados
    pedidosFiltrados = resultados;
    renderizarListaPedidos();
    actualizarEstadisticasHora();

    mostrarNotificacion(`🔍 Se encontraron ${resultados.length} resultados`);
}
// Funciones para modal premium
function mostrarModalPremium() {
    document.getElementById('modalPremium').style.display = 'block';

    // Verificar si ya tiene trial o premium
    const licencia = obtenerEstadoLicencia();
    if (licencia.tipo === 'trial') {
        document.getElementById('opcionesPremium').querySelector('button').textContent =
            `🎁 Trial Activo (${licencia.diasRestantes} días restantes)`;
        document.getElementById('opcionesPremium').querySelector('button').disabled = true;
    }
}

function cerrarModalPremium() {
    document.getElementById('modalPremium').style.display = 'none';
    cerrarTodosLosTeclados();
}


function seleccionarPlan(plan) {
    const formulario = document.getElementById('formularioActivacion');
    formulario.style.display = 'block';

    let titulo, precio, prefijo, color;

    switch (plan) {
        case 'standard':
            titulo = '📋 Activar Plan Standard';
            precio = '49€';
            prefijo = 'STD-';
            color = '#4a5568';
            break;
        case 'pro':
            titulo = '🚀 Activar Plan Pro';
            precio = '69€';
            prefijo = 'PRO-';
            color = '#ffa502';
            break;
        case 'premium':
            titulo = '👑 Activar Plan Premium';
            precio = '130€';
            prefijo = 'PREM-';
            color = '#ffd700';
            break;
    }

    formulario.innerHTML = `
        <div style="background: rgba(40, 40, 40, 0.9); padding: 30px; border-radius: 15px; border: 2px solid ${color};">
            <h3 style="color: ${color}; margin-bottom: 20px; text-align: center;">
                ${titulo}
            </h3>
            
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="font-size: 2em; font-weight: bold; color: ${color};">
                    ${precio}/mes
                </div>
            </div>
            
            <div style="display: grid; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #888;">Código de Licencia:</label>
                    <input type="text" id="codigoLicencia${plan}" placeholder="${prefijo}XXXX-XXXX-XXXX"
                        style="width: 100%; padding: 15px; background: rgba(30, 30, 30, 0.9); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: white; font-family: monospace; font-size: 16px; text-align: center;">
                </div>
                
                <button class="${plan === 'standard' ? 'btn-primary' : plan === 'pro' ? 'btn-warning' : 'btn-success'}" onclick="activarLicenciaPlan('${plan}')" style="width: 100%; padding: 15px; font-size: 16px; font-weight: bold;">
                    ✅ Activar ${plan.charAt(0).toUpperCase() + plan.slice(1)}
                </button>
                
                <button class="btn-primary" onclick="document.getElementById('formularioActivacion').style.display='none'" style="width: 100%;">
                    Cancelar
                </button>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 10px;">
                <p style="color: #888; margin: 0; font-size: 0.9em; text-align: center;">
                    💡 ¿No tienes código? Contacta con ventas@tuprograma.com
                </p>
            </div>
        </div>
    `;

    // Scroll suave hacia el formulario
    formulario.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
// Función para activar licencia de un plan específico
function activarLicenciaPlan(plan) {
    const codigo = document.getElementById(`codigoLicencia${plan}`).value.trim();

    if (!codigo) {
        alert('Por favor ingresa un código de licencia');
        return;
    }

    // Validar formato del código según el plan
    let prefijo;
    switch (plan) {
        case 'standard':
            prefijo = 'STD-';
            break;
        case 'pro':
            prefijo = 'PRO-';
            break;
        case 'premium':
            prefijo = 'PREM-';
            break;
    }

    if (!codigo.startsWith(prefijo) || codigo.length < 16) {
        alert('Código de licencia inválido. Verifica el formato.');
        return;
    }


    if (activarLicencia(codigo, plan)) {
        mostrarNotificacion(`⭐ Plan ${plan.toUpperCase()} activado correctamente`);

        setTimeout(() => {
            location.reload();
        }, 2000);
    } else {
        alert('Código de licencia inválido.');
    }
}
function activarTrial() {
    if (iniciarTrial()) {
        document.getElementById('opcionesPremium').style.display = 'none';
        document.getElementById('mensajeExito').style.display = 'block';
        document.getElementById('mensajeExitoTexto').textContent =
            '¡Tu prueba gratuita de 30 días ha comenzado! Disfruta de todas las características premium.';

        mostrarNotificacion('🎉 Trial Premium activado por 30 días');
    } else {
        alert('Ya has utilizado tu período de prueba anteriormente.');
    }
}

function validarLicencia() {
    const key = document.getElementById('licenciaInput').value.trim();

    if (activarLicencia(key)) {
        document.getElementById('opcionesPremium').style.display = 'none';
        document.getElementById('mensajeExito').style.display = 'block';

        // Mensaje personalizado según tipo
        let mensaje = '¡Licencia activada correctamente!';
        if (key.startsWith('STD-')) mensaje = '¡Licencia Standard activada! Ahora tienes soporte técnico.';
        else if (key.startsWith('PRO-')) mensaje = '¡Licencia Pro activada! Disfruta de análisis avanzados.';
        else if (key.startsWith('PREM-')) mensaje = '¡Licencia Premium activada! Acceso completo desbloqueado.';

        document.getElementById('mensajeExitoTexto').textContent = mensaje;
        mostrarNotificacion('⭐ Licencia activada');
    } else {
        alert('Licencia inválida. Por favor verifica el código.');
    }
}

// Agregar al event listener de window click
window.addEventListener('click', function (event) {
    const modalPremium = document.getElementById('modalPremium');
    if (event.target == modalPremium) {
        cerrarModalPremium();
    }
});
