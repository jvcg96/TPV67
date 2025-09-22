// ========================================
// GESTIÓN DE ÁREAS
// ========================================

// Función para renderizar lista de áreas
function renderizarListaAreas() {
    const lista = document.getElementById('listaAreas');
    if (!lista) return;

    lista.innerHTML = '';

    const areasActivas = areas.filter(a => a.activa);

    if (areasActivas.length === 0) {
        lista.innerHTML = '<p style="text-align: center; padding: 20px; color: #888;">No hay áreas registradas</p>';
        return;
    }

    areasActivas.forEach(area => {
        const item = document.createElement('div');
        item.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        `;

        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.2em;">🏢</span>
                <span style="font-weight: 600; color: #fff;">${area.nombre}</span>
                <span style="color: #666; font-size: 0.9em;">(${contarProductosPorArea(area.id)} productos)</span>
            </div>
            <div style="display: flex; gap: 10px;">
                <button onclick="editarArea('${area.id}')" style="background: #4a5568; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px;">✏️ Editar</button>
                ${area.id !== 'barra' && area.id !== 'cocina' && area.id !== 'terraza' ?
                `<button onclick="eliminarArea('${area.id}')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px;">🗑️ Eliminar</button>` :
                '<span style="color: #666; font-size: 0.9em;">(Base)</span>'
            }
            </div>
        `;

        item.onmouseover = () => item.style.background = 'rgba(255, 255, 255, 0.05)';
        item.onmouseout = () => item.style.background = 'transparent';

        lista.appendChild(item);
    });
}


// Función para contar productos por área
function contarProductosPorArea(areaId) {
    return productos.filter(p => p.area === areaId).length;
}


// Función para agregar nueva área
function agregarArea() {
    const nombre = document.getElementById('nuevaAreaNombre').value.trim();

    if (!nombre) {
        alert('Por favor ingresa un nombre para el área');
        return;
    }

    // Verificar si ya existe
    if (areas.some(a => a.nombre.toLowerCase() === nombre.toLowerCase() && a.activa)) {
        alert('Ya existe un área con ese nombre');
        return;
    }

    // Crear ID único basado en el nombre
    const id = nombre.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Agregar área
    areas.push({
        id: id,
        nombre: nombre,
        activa: true
    });

    // Guardar en localStorage
    localStorage.setItem('areasPersonalizadas', JSON.stringify(areas));

    // Limpiar campo
    document.getElementById('nuevaAreaNombre').value = '';

    // Actualizar listas
    renderizarListaAreas();
    actualizarSelectoresAreas();

    mostrarNotificacion(`✅ Área "${nombre}" agregada correctamente`);
}

// Función para eliminar área
function eliminarArea(id) {
    const area = areas.find(a => a.id === id);
    if (!area) return;

    const productosEnArea = contarProductosPorArea(id);

    let mensaje = `¿Estás seguro de eliminar el área "${area.nombre}"?`;
    if (productosEnArea > 0) {
        mensaje += `\n\n⚠️ ATENCIÓN: Hay ${productosEnArea} productos en esta área.\nSe cambiarán a "Sin área asignada".`;
    }

    if (confirm(mensaje)) {
        // Cambiar productos de esta área a vacío
        productos.forEach(producto => {
            if (producto.area === id) {
                producto.area = '';
            }
        });

        // Marcar área como inactiva
        const areaIndex = areas.findIndex(a => a.id === id);
        if (areaIndex !== -1) {
            areas[areaIndex].activa = false;
        }

        // Guardar cambios
        localStorage.setItem('areasPersonalizadas', JSON.stringify(areas));
        localStorage.setItem('productosPersonalizados', JSON.stringify(productos));

        // Actualizar interfaces
        renderizarListaAreas();
        actualizarSelectoresAreas();
        renderizarListaProductos();

        mostrarNotificacion(`🗑️ Área "${area.nombre}" eliminada`);
    }
}

// Función para editar área
function editarArea(id) {
    const area = areas.find(a => a.id === id && a.activa);
    if (!area) return;

    // Si hay teclado virtual activado, usar un modal en lugar de prompt
    if (esDispositivoTactil()) {
        // Crear un modal temporal para editar
        const modalHTML = `
            <div id="modalEditarArea" class="modal" style="display: block;">
                <div class="modal-content" style="max-width: 400px;">
                    <span class="close" onclick="document.getElementById('modalEditarArea').remove()">&times;</span>
                    <h2 style="margin-bottom: 20px; color: #fff;">✏️ Editar Área</h2>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; color: #888;">Nombre del área:</label>
                        <input type="text" id="editarAreaNombre" value="${area.nombre}"
                            style="width: 100%; padding: 12px; background: rgba(40, 40, 40, 0.9); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: white; font-size: 16px;">
                    </div>
                    
                    <div style="text-align: center;">
                        <button class="btn-success" onclick="guardarEdicionArea('${id}')">💾 Guardar</button>
                        <button class="btn-primary" onclick="document.getElementById('modalEditarArea').remove()">Cancelar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Configurar teclado virtual
        setTimeout(() => {
            const input = document.getElementById('editarAreaNombre');
            if (input) {
                input.readOnly = true;
                input.addEventListener('click', function (e) {
                    e.preventDefault();
                    this.blur();
                    abrirTecladoCompleto(this);
                });
            }
        }, 100);

    } else {
        // Usar prompt normal si no hay teclado táctil
        const nuevoNombre = prompt(`Editar nombre de área:\n\nNombre actual: ${area.nombre}`, area.nombre);

        if (nuevoNombre && nuevoNombre.trim() !== '') {
            actualizarNombreArea(id, nuevoNombre.trim());
        }
    }
}


// Nueva función para guardar edición desde modal
function guardarEdicionArea(id) {
    const nuevoNombre = document.getElementById('editarAreaNombre').value.trim();

    if (nuevoNombre) {
        actualizarNombreArea(id, nuevoNombre);
        document.getElementById('modalEditarArea').remove();
    }
}

// Función auxiliar para actualizar nombre de área
function actualizarNombreArea(id, nuevoNombre) {
    // Verificar que no exista otra área con ese nombre
    if (areas.some(a => a.nombre.toLowerCase() === nuevoNombre.toLowerCase() && a.id !== id && a.activa)) {
        alert('Ya existe un área con ese nombre');
        return;
    }

    // Encontrar y actualizar área
    const area = areas.find(a => a.id === id);
    if (area) {
        area.nombre = nuevoNombre;

        // Guardar cambios
        localStorage.setItem('areasPersonalizadas', JSON.stringify(areas));

        // Actualizar interfaces
        renderizarListaAreas();
        actualizarSelectoresAreas();

        mostrarNotificacion(`✅ Área renombrada a "${nuevoNombre}"`);
    }
}

// Función para actualizar todos los selectores de áreas
function actualizarSelectoresAreas() {
    // Actualizar selector en nuevo producto
    const selectNuevo = document.getElementById('nuevaArea');
    if (selectNuevo) {
        const valorActual = selectNuevo.value;
        selectNuevo.innerHTML = '<option value="">Sin área asignada</option>';  // Opción vacía

        const areasActivas = areas.filter(a => a.activa);
        areasActivas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.id;
            option.textContent = area.nombre;
            selectNuevo.appendChild(option);
        });

        // Mantener selección si todavía existe
        if (valorActual && Array.from(selectNuevo.options).some(opt => opt.value === valorActual)) {
            selectNuevo.value = valorActual;
        }
    }

    // Actualizar selector en filtros de inventario si existe
    const selectFiltroArea = document.getElementById('filtroArea');
    if (selectFiltroArea) {
        const valorActual = selectFiltroArea.value;
        selectFiltroArea.innerHTML = '<option value="todos">Todas las áreas</option>';

        const areasActivas = areas.filter(a => a.activa);
        areasActivas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.id;
            option.textContent = area.nombre;
            selectFiltroArea.appendChild(option);
        });

        // Opción para productos sin área
        const optionSinArea = document.createElement('option');
        optionSinArea.value = 'sin_area';
        optionSinArea.textContent = 'Sin área asignada';
        selectFiltroArea.appendChild(optionSinArea);

        // Mantener selección si todavía existe
        if (valorActual && Array.from(selectFiltroArea.options).some(opt => opt.value === valorActual)) {
            selectFiltroArea.value = valorActual;
        }
    }
}