
// ========================================
// GESTIÓN DE CATEGORÍAS
// ===============================================================================

// Función para renderizar lista de categorías
function renderizarListaCategorias() {
    const lista = document.getElementById('listaCategorias');
    if (!lista) return;

    lista.innerHTML = '';

    const categoriasActivas = categorias.filter(c => c.activa);

    if (categoriasActivas.length === 0) {
        lista.innerHTML = '<p style="text-align: center; padding: 20px; color: #888;">No hay categorías registradas</p>';
        return;
    }

    categoriasActivas.forEach(categoria => {
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
                <span style="font-size: 1.2em;">🏷️</span>
                <span style="font-weight: 600; color: #fff;">${categoria.nombre}</span>
                <span style="color: #666; font-size: 0.9em;">(${contarProductosPorCategoria(categoria.id)} productos)</span>
            </div>
            <div style="display: flex; gap: 10px;">
                               <button onclick="editarCategoria('${categoria.id}')" style="background: #4a5568; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; margin-right: 8px;">✏️ Editar</button>
                ${categoria.id !== 'barra' && categoria.id !== 'cocina' ?
                `<button onclick="eliminarCategoria('${categoria.id}')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px;">🗑️ Eliminar</button>` :
                '<span style="color: #666; font-size: 0.9em;">(Base)</span>'
            }
            </div>
        `;

        item.onmouseover = () => item.style.background = 'rgba(255, 255, 255, 0.05)';
        item.onmouseout = () => item.style.background = 'transparent';

        lista.appendChild(item);
    });
}

// Función para contar productos por categoría
function contarProductosPorCategoria(categoriaId) {
    return productos.filter(p => p.categoria === categoriaId).length;
}

// Función para agregar nueva categoría
function agregarCategoria() {
    const nombre = document.getElementById('nuevaCategoriaNombre').value.trim();

    if (!nombre) {
        alert('Por favor ingresa un nombre para la categoría');
        return;
    }

    // Verificar si ya existe
    if (categorias.some(c => c.nombre.toLowerCase() === nombre.toLowerCase() && c.activa)) {
        alert('Ya existe una categoría con ese nombre');
        return;
    }

    // Crear ID único basado en el nombre
    const id = nombre.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Agregar categoría
    categorias.push({
        id: id,
        nombre: nombre,
        activa: true
    });

    // Guardar en localStorage
    localStorage.setItem('categoriasPersonalizadas', JSON.stringify(categorias));

    // Limpiar campo
    document.getElementById('nuevaCategoriaNombre').value = '';

    // Actualizar listas
    renderizarListaCategorias();
    actualizarSelectoresCategorias();

    mostrarNotificacion(`✅ Categoría "${nombre}" agregada correctamente`);
}

// Función para eliminar categoría
function eliminarCategoria(id) {
    const categoria = categorias.find(c => c.id === id);
    if (!categoria) return;

    // Verificar si hay productos en esta categoría
    const productosEnCategoria = contarProductosPorCategoria(id);

    let mensaje = `¿Estás seguro de eliminar la categoría "${categoria.nombre}"?`;
    if (productosEnCategoria > 0) {
        mensaje += `\n\n⚠️ ATENCIÓN: Hay ${productosEnCategoria} productos en esta categoría.\nSe cambiarán automáticamente a la categoría "Barra".`;
    }

    if (confirm(mensaje)) {
        // Cambiar productos de esta categoría a "barra"
        productos.forEach(producto => {
            if (producto.categoria === id) {
                producto.categoria = 'barra';
            }
        });

        // Marcar categoría como inactiva
        const categoriaIndex = categorias.findIndex(c => c.id === id);
        if (categoriaIndex !== -1) {
            categorias[categoriaIndex].activa = false;
        }

        // Guardar cambios
        localStorage.setItem('categoriasPersonalizadas', JSON.stringify(categorias));
        localStorage.setItem('productosPersonalizados', JSON.stringify(productos));

        // Actualizar interfaces
        renderizarListaCategorias();
        actualizarSelectoresCategorias();
        renderizarListaProductos();

        mostrarNotificacion(`🗑️ Categoría "${categoria.nombre}" eliminada`);
    }
}



// Función para editar categoría
function editarCategoria(id) {
    const categoria = categorias.find(c => c.id === id && c.activa);
    if (!categoria) return;

    // Si hay teclado virtual activado, usar un modal en lugar de prompt
    if (esDispositivoTactil()) {
        // Crear un modal temporal para editar
        const modalHTML = `
            <div id="modalEditarCategoria" class="modal" style="display: block;">
                <div class="modal-content" style="max-width: 400px;">
                    <span class="close" onclick="document.getElementById('modalEditarCategoria').remove()">&times;</span>
                    <h2 style="margin-bottom: 20px; color: #fff;">✏️ Editar Categoría</h2>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; color: #888;">Nombre de la categoría:</label>
                        <input type="text" id="editarCategoriaNombre" value="${categoria.nombre}"
                            style="width: 100%; padding: 12px; background: rgba(40, 40, 40, 0.9); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: white; font-size: 16px;">
                    </div>
                    
                    <div style="text-align: center;">
                        <button class="btn-success" onclick="guardarEdicionCategoria('${id}')">💾 Guardar</button>
                        <button class="btn-primary" onclick="document.getElementById('modalEditarCategoria').remove()">Cancelar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Configurar teclado virtual
        setTimeout(() => {
            const input = document.getElementById('editarCategoriaNombre');
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
        const nuevoNombre = prompt(`Editar nombre de categoría:\n\nNombre actual: ${categoria.nombre}`, categoria.nombre);

        if (nuevoNombre && nuevoNombre.trim() !== '') {
            actualizarNombreCategoria(id, nuevoNombre.trim());
        }
    }
}

// Nueva función para guardar edición desde modal
function guardarEdicionCategoria(id) {
    const nuevoNombre = document.getElementById('editarCategoriaNombre').value.trim();

    if (nuevoNombre) {
        actualizarNombreCategoria(id, nuevoNombre);
        document.getElementById('modalEditarCategoria').remove();
    }
}
// Función auxiliar para actualizar nombre de categoría
function actualizarNombreCategoria(id, nuevoNombre) {
    // Verificar que no exista otra categoría con ese nombre
    if (categorias.some(c => c.nombre.toLowerCase() === nuevoNombre.toLowerCase() && c.id !== id && c.activa)) {
        alert('Ya existe una categoría con ese nombre');
        return;
    }

    // Encontrar y actualizar categoría
    const categoria = categorias.find(c => c.id === id);
    if (categoria) {
        categoria.nombre = nuevoNombre;

        // Guardar cambios
        localStorage.setItem('categoriasPersonalizadas', JSON.stringify(categorias));

        // Actualizar interfaces
        renderizarListaCategorias();
        actualizarSelectoresCategorias();

        mostrarNotificacion(`✅ Categoría renombrada a "${nuevoNombre}"`);
    }
}

// Función para actualizar todos los selectores de categorías
function actualizarSelectoresCategorias() {
    // Actualizar selector en nuevo producto
    const selectNuevo = document.getElementById('nuevaCategoria');
    if (selectNuevo) {
        actualizarSelectorCategoria(selectNuevo);
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

// Función auxiliar para actualizar un selector específico
function actualizarSelectorCategoria(selector) {
    const valorActual = selector.value;
    selector.innerHTML = '';

    const categoriasActivas = categorias.filter(c => c.activa);
    categoriasActivas.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.nombre;
        selector.appendChild(option);
    });

    // Mantener selección si todavía existe
    if (valorActual && Array.from(selector.options).some(opt => opt.value === valorActual)) {
        selector.value = valorActual;
    }
}
