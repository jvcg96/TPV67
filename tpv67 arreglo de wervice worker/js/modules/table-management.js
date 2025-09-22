
// Variables para gestión de mesas
let mesaEditandoId = null;
window.mesasConfig = JSON.parse(localStorage.getItem('mesasConfiguracion')) || [];

// Inicializar configuración de mesas si no existe
function inicializarMesasConfig() {
    // Cargar de localStorage si existe
    const mesasGuardadas = localStorage.getItem('mesasConfiguracion');
    if (mesasGuardadas) {
        mesasConfig = JSON.parse(mesasGuardadas);
    }

    // Si no hay mesas, dejar vacío
    if (!mesasConfig) {
        mesasConfig = [];
    }

    // MIGRACIÓN: Agregar campo 'area' a mesas existentes que no lo tengan
    let necesitaMigracion = false;
    mesasConfig = mesasConfig.map(mesa => {
        if (!mesa.area) {
            // Asignar área por defecto según el nombre
            if (mesa.nombre.toLowerCase().includes('barra')) {
                mesa.area = 'barra';
            } else if (mesa.nombre.toLowerCase().includes('terraza')) {
                mesa.area = 'terraza';
            } else {
                mesa.area = 'barra'; // Por defecto
            }
            necesitaMigracion = true;
        }
        return mesa;
    });

    // Guardar si hubo migración
    if (necesitaMigracion) {
        localStorage.setItem('mesasConfiguracion', JSON.stringify(mesasConfig));
        console.log('✅ Mesas migradas: agregado campo area');
    }
}

// Función para abrir modal de crear mesa
function abrirModalCrearMesa() {
    mesaEditandoId = null;
    document.getElementById('tituloModalMesa').textContent = '🪑 Crear Mesa';

    // Limpiar campos
    document.getElementById('gestionMesaNombre').value = '';
    document.getElementById('gestionMesaCapacidad').value = '4';
    document.getElementById('gestionMesaDescripcion').value = '';

    // Llenar selector de áreas
    const selectorArea = document.getElementById('gestionMesaArea');
    selectorArea.innerHTML = '';

    // Añadir opción por defecto
    const optionDefault = document.createElement('option');
    optionDefault.value = 'barra';
    optionDefault.textContent = 'Barra (por defecto)';
    selectorArea.appendChild(optionDefault);

    // Añadir áreas activas
    areas.filter(a => a.activa).forEach(area => {
        const option = document.createElement('option');
        option.value = area.id;
        option.textContent = area.nombre;
        selectorArea.appendChild(option);
    });

    // Mostrar modal
    document.getElementById('gestionMesaModal').style.display = 'block';
}


// Función para abrir modal de editar mesa
function abrirModalEditarMesa(id) {
    const mesa = mesasConfig.find(m => m.id === id);
    if (!mesa) return;

    mesaEditandoId = id;
    document.getElementById('tituloModalMesa').textContent = '✏️ Editar Mesa';

    // Llenar campos con datos actuales
    document.getElementById('gestionMesaNombre').value = mesa.nombre;
    document.getElementById('gestionMesaCapacidad').value = mesa.capacidad;
    document.getElementById('gestionMesaDescripcion').value = mesa.descripcion || '';

    // Llenar selector de áreas
    const selectorArea = document.getElementById('gestionMesaArea');
    selectorArea.innerHTML = '';

    // Añadir áreas activas
    areas.filter(a => a.activa).forEach(area => {
        const option = document.createElement('option');
        option.value = area.id;
        option.textContent = area.nombre;
        if (mesa.area === area.id) {
            option.selected = true;
        }
        selectorArea.appendChild(option);
    });

    // Si la mesa no tiene área, añadir opción por defecto
    if (!mesa.area) {
        const optionDefault = document.createElement('option');
        optionDefault.value = 'barra';
        optionDefault.textContent = 'Barra (por defecto)';
        optionDefault.selected = true;
        selectorArea.insertBefore(optionDefault, selectorArea.firstChild);
    }

    // Mostrar modal
    document.getElementById('gestionMesaModal').style.display = 'block';
}


// Función para cerrar modal de gestión de mesa
function cerrarModalGestionMesa() {
    document.getElementById('gestionMesaModal').style.display = 'none';
    mesaEditandoId = null;

    // Limpiar campos
    document.getElementById('gestionMesaNombre').value = '';
    document.getElementById('gestionMesaCapacidad').value = '4';
    document.getElementById('gestionMesaDescripcion').value = '';
    cerrarTodosLosTeclados();
}

// Función para guardar mesa (crear o editar)
function guardarGestionMesa() {
    const nombre = document.getElementById('gestionMesaNombre').value.trim();
    const capacidad = parseInt(document.getElementById('gestionMesaCapacidad').value);
    const descripcion = document.getElementById('gestionMesaDescripcion').value.trim();
    const area = document.getElementById('gestionMesaArea').value || 'barra';

    if (!nombre) {
        alert('Por favor ingresa un nombre para la mesa');
        return;
    }

    if (isNaN(capacidad) || capacidad <= 0) {
        alert('Por favor ingresa una capacidad válida');
        return;
    }

    if (mesaEditandoId === null) {
        // Crear nueva mesa
        const nuevoId = mesasConfig.length > 0 ? Math.max(...mesasConfig.map(m => m.id)) + 1 : 1;

        // Verificar que no exista una mesa con el mismo nombre
        if (mesasConfig.some(m => m.nombre.toLowerCase() === nombre.toLowerCase() && m.activa)) {
            alert('Ya existe una mesa con ese nombre');
            return;
        }

        const nuevaMesa = {
            id: nuevoId,
            nombre: nombre,
            capacidad: capacidad,
            descripcion: descripcion,
            area: area,
            activa: true
        };

        mesasConfig.push(nuevaMesa);

        // Inicializar array de productos para la nueva mesa
        if (!mesas[nuevoId]) {
            mesas[nuevoId] = [];
        }

        mostrarNotificacion(`✅ Mesa "${nombre}" creada correctamente`);

    } else {
        // Editar mesa existente
        const mesaIndex = mesasConfig.findIndex(m => m.id === mesaEditandoId);
        if (mesaIndex !== -1) {
            const nombreAnterior = mesasConfig[mesaIndex].nombre;

            // Verificar que no exista otra mesa con el mismo nombre
            if (mesasConfig.some(m => m.nombre.toLowerCase() === nombre.toLowerCase() && m.id !== mesaEditandoId && m.activa)) {
                alert('Ya existe una mesa con ese nombre');
                return;
            }

            mesasConfig[mesaIndex] = {
                ...mesasConfig[mesaIndex],
                nombre: nombre,
                capacidad: capacidad,
                descripcion: descripcion,
                area: area
            };

            mostrarNotificacion(`✅ Mesa "${nombreAnterior}" actualizada correctamente`);
        }
    }

    // Guardar en localStorage
    localStorage.setItem('mesasConfiguracion', JSON.stringify(mesasConfig));

    // Actualizar interfaces
    renderizarListaMesas();
    renderizarMesas();

    // Cerrar modal
    cerrarModalGestionMesa();
}

// Función para eliminar mesa
function eliminarMesa(id) {
    const mesa = mesasConfig.find(m => m.id === id);
    if (!mesa) return;

    // Verificar si la mesa tiene productos
    const tieneProductos = mesas[id] && mesas[id].length > 0;

    const mensaje = tieneProductos
        ? `¿Estás seguro de eliminar "${mesa.nombre}"?\n\n⚠️ ATENCIÓN: Esta mesa tiene productos pendientes que se perderán.`
        : `¿Estás seguro de eliminar "${mesa.nombre}"?`;

    if (confirm(mensaje)) {
        // Marcar como inactiva en lugar de eliminar completamente
        const mesaIndex = mesasConfig.findIndex(m => m.id === id);
        if (mesaIndex !== -1) {
            mesasConfig[mesaIndex].activa = false;
        }

        // Limpiar productos de la mesa
        if (mesas[id]) {
            mesas[id] = [];
        }

        // Guardar cambios
        localStorage.setItem('mesasConfiguracion', JSON.stringify(mesasConfig));

        // Actualizar interfaces
        renderizarListaMesas();
        renderizarMesas();

        mostrarNotificacion(`🗑️ Mesa "${mesa.nombre}" eliminada`);
    }
}

// Función para renderizar lista de mesas en configuración
function renderizarListaMesas() {
    const lista = document.getElementById('listaMesas');
    if (!lista) return;

    lista.innerHTML = '';

    const mesasActivas = mesasConfig.filter(m => m.activa);

    if (mesasActivas.length === 0) {
        lista.innerHTML = '<p style="text-align: center; padding: 20px; color: #888;">No hay mesas registradas</p>';
        return;
    }

    mesasActivas.forEach(mesa => {
        const item = document.createElement('div');
        item.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            transition: background 0.3s ease;
        `;

        item.innerHTML = `
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.2em;">🪑</span>
                    <div>
                        <span style="font-weight: 600; color: #fff;">${mesa.nombre}</span>
                        <div style="font-size: 0.9em; color: #888; margin-top: 2px;">
                            Capacidad: ${mesa.capacidad} personas
                            ${mesa.descripcion ? ` • ${mesa.descripcion}` : ''}
                        </div>
                    </div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <button onclick="abrirModalEditarMesa(${mesa.id})" style="background: #4a5568; color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-size: 14px; transition: all 0.3s ease;">✏️ Editar</button>
                <button onclick="eliminarMesa(${mesa.id})" style="background: #ef4444; color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-size: 14px; transition: all 0.3s ease;">🗑️ Eliminar</button>
            </div>
        `;

        lista.appendChild(item);
    });
}

// Event listeners adicionales para modal de gestión de mesas
window.addEventListener('click', function (event) {
    const modal = document.getElementById('gestionMesaModal');
    if (event.target == modal) {
        cerrarModalGestionMesa();
    }
});

// Atajos de teclado para modal de gestión de mesas
document.addEventListener('keydown', function (event) {
    // ESC para cerrar modal de gestión de mesas
    if (event.key === 'Escape' && document.getElementById('gestionMesaModal').style.display === 'block') {
        cerrarModalGestionMesa();
    }

    // Enter para guardar mesa
    if (event.key === 'Enter' && document.getElementById('gestionMesaModal').style.display === 'block') {
        guardarGestionMesa();
    }
});

// Función para obtener el nombre de la mesa por ID
function obtenerNombreMesa(mesaId) {
    const mesaConfig = mesasConfig.find(m => m.id === mesaId);
    return mesaConfig ? mesaConfig.nombre : `Mesa ${mesaId}`;
}