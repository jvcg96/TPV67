// Variables para edición de productos
let productoEditandoId = null;
// Función para cambiar entre emoji e imagen
function toggleSelectorVisual(tipo) {
    tipoVisualSeleccionado = tipo;

    // Actualizar botones
    document.getElementById('btnEmoji').style.background = tipo === 'emoji' ? '#4a5568' : '#2d3748';
    document.getElementById('btnImagen').style.background = tipo === 'imagen' ? '#4a5568' : '#2d3748';

    // Mostrar/ocultar selectores
    document.getElementById('selectorEmoji').style.display = tipo === 'emoji' ? 'block' : 'none';
    document.getElementById('selectorImagen').style.display = tipo === 'imagen' ? 'block' : 'none';
}

// Función para mostrar/ocultar campos de stock
function toggleStockFields() {
    const controlStock = document.getElementById('nuevoControlStock').checked;
    const camposStock = document.getElementById('camposStock');
    const sinStockInfo = document.getElementById('sinStockInfo');

    if (controlStock) {
        camposStock.style.display = 'grid';
        sinStockInfo.style.display = 'none';
    } else {
        camposStock.style.display = 'none';
        sinStockInfo.style.display = 'block';
        // Limpiar valores de stock
        document.getElementById('nuevoStock').value = '0';
        document.getElementById('nuevoStockMinimo').value = '0';
    }
}


// Función para seleccionar emoji 
function seleccionarEmoji(emoji, elemento) {
    // Actualizar el valor del input
    document.getElementById('nuevoEmoji').value = emoji;

    // LIMPIAR todas las selecciones anteriores
    const todosLosEmojis = document.querySelectorAll('#selectorEmoji span');
    todosLosEmojis.forEach(span => {
        span.style.background = 'rgba(255,255,255,0.05)';
        span.style.transform = 'scale(1)';
    });

    // MARCAR solo el emoji actual
    if (elemento) {
        elemento.style.background = 'rgba(255, 107, 107, 0.3)';
        elemento.style.transform = 'scale(1.1)';

        // Efecto temporal
        setTimeout(() => {
            elemento.style.background = 'rgba(255, 107, 107, 0.2)';
            elemento.style.transform = 'scale(1.05)';
        }, 200);
    }

    // Mostrar notificación
    // mostrarNotificacion(`✅ Emoji ${emoji} seleccionado`);
}

// Función para preview de imagen
function previewImagen(event) {
    const file = event.target.files[0];
    if (file) {
        // Verificar tamaño (máximo 500KB)
        if (file.size > 500000) {
            alert('La imagen es muy grande. Por favor selecciona una imagen menor a 500KB');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            // Comprimir imagen
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Tamaño máximo 150x150
                const maxSize = 150;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                const compressedImage = canvas.toDataURL('image/jpeg', 0.8);
                document.getElementById('previewImagen').src = compressedImage;
                document.getElementById('previewImagen').style.display = 'block';
                document.getElementById('nuevoImagen').value = compressedImage;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Funciones para gestión de productos
async function agregarNuevoProducto() {
    const nombre = document.getElementById('nuevoNombre').value.trim();
    const precio = parseFloat(document.getElementById('nuevoPrecio').value);
    const controlStock = document.getElementById('nuevoControlStock').checked;
    const stock = controlStock ? (parseInt(document.getElementById('nuevoStock').value) || 0) : 0;
    const stockMinimo = controlStock ? (parseInt(document.getElementById('nuevoStockMinimo').value) || 5) : 0;
    const area = document.getElementById('nuevaArea').value || '';
    const categoria = document.getElementById('nuevaCategoria').value;

    let visual = {};
    if (tipoVisualSeleccionado === 'emoji') {
        visual.tipo = 'emoji';
        visual.valor = document.getElementById('nuevoEmoji').value.trim() || '🍽️';
    } else {
        const imagen = document.getElementById('nuevoImagen').value;
        if (!imagen) {
            alert('Por favor selecciona una imagen');
            return;
        }
        visual.tipo = 'imagen';
        visual.valor = imagen;
    }

    if (!nombre) {
        alert('Por favor ingresa un nombre para el producto');
        return;
    }

    if (isNaN(precio) || precio <= 0) {
        alert('Por favor ingresa un precio válido');
        return;
    }

    if (!categoria) {
        alert('Por favor selecciona una categoría para el producto');
        return;
    }

    // Generar nuevo ID
    const nuevoId = productos.length > 0 ? Math.max(...productos.map(p => p.id)) + 1 : 1;

    // Crear producto con campo de control de stock
    const nuevoProducto = {
        id: nuevoId,
        nombre: nombre,
        precio: precio,
        emoji: visual.tipo === 'emoji' ? visual.valor : '🍽️',
        stock: stock,
        stockMinimo: stockMinimo,
        controlStock: controlStock,  // NUEVO CAMPO
        area: area,
        categoria: categoria
    };

    // Si es imagen, guardarla en IndexedDB
    // Si es imagen, guardarla en IndexedDB
    if (visual.tipo === 'imagen') {
        try {
            await DB.guardarImagen(nuevoId, visual.valor);
            nuevoProducto.tieneImagen = true;
            console.log(`✅ Imagen guardada para producto ${nuevoId}: ${nuevoProducto.nombre}`);
        } catch (error) {
            console.error('❌ Error al guardar imagen:', error);
            alert('Error al guardar la imagen. Se usará emoji por defecto.');
            nuevoProducto.emoji = '🍽️';
            nuevoProducto.tieneImagen = false;
        }
    } else {
        nuevoProducto.tieneImagen = false;
    }

    // Agregar producto
    productos.push(nuevoProducto);

    // Guardar en localStorage
    localStorage.setItem('productosPersonalizados', JSON.stringify(productos));

    // Limpiar campos
    document.getElementById('nuevoNombre').value = '';
    document.getElementById('nuevoPrecio').value = '';
    document.getElementById('nuevoEmoji').value = '🍽️';
    document.getElementById('nuevoStock').value = '';
    document.getElementById('nuevoStockMinimo').value = '';
    document.getElementById('nuevoImagen').value = '';
    document.getElementById('previewImagen').style.display = 'none';
    document.getElementById('nuevoImagenFile').value = '';
    document.getElementById('nuevaArea').value = '';
    document.getElementById('nuevaCategoria').value = '';
    document.getElementById('nuevoControlStock').checked = true;
    toggleStockFields();

    // Resetear a emoji por defecto
    toggleSelectorVisual('emoji');

    // Actualizar lista
    renderizarListaProductos();

    const tipoProducto = controlStock ? '📦' : '♾️';
    mostrarNotificacion(`✅ Producto "${nombre}" agregado ${tipoProducto}`);
}

function eliminarProducto(id) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        productos = productos.filter(p => p.id !== id);
        localStorage.setItem('productosPersonalizados', JSON.stringify(productos));
        renderizarListaProductos();
        mostrarNotificacion('🗑️ Producto eliminado');
    }
}

function renderizarListaProductos() {
    const lista = document.getElementById('listaProductos');
    if (!lista) return;

    lista.innerHTML = '';

    if (productos.length === 0) {
        lista.innerHTML = '<p style="text-align: center; padding: 20px; color: #888;">No hay productos registrados</p>';
        return;
    }

    productos.forEach(producto => {
        const item = document.createElement('div');
        item.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            transition: background 0.3s ease;
        `;

        let stockColor, stockIcon, stockInfo;

        if (producto.controlStock === false) {
            stockColor = '#22c55e';
            stockIcon = '♾️';
            stockInfo = `<span style="color: ${stockColor};">${stockIcon} Sin control de stock</span>`;
        } else {
            stockColor = producto.stock <= 0 ? '#ff6b6b' :
                producto.stock <= producto.stockMinimo ? '#ffa502' : '#22c55e';
            stockIcon = producto.stock <= 0 ? '🔴' :
                producto.stock <= producto.stockMinimo ? '🟡' : '🟢';
            stockInfo = `
        <span style="color: ${stockColor};">${stockIcon} Stock: ${producto.stock}</span>
        <span style="color: #888; margin-left: 15px;">Mín: ${producto.stockMinimo}</span>
    `;
        }

        item.innerHTML = `
            <div style="flex: 1;">
                <span style="font-size: 1.2em; margin-right: 10px;">${producto.emoji}</span>
                <span style="font-weight: 600;">${producto.nombre}</span>
                <div style="font-size: 0.8em; margin-top: 5px;">
    ${stockInfo}
</div>
                <div style="font-size: 0.75em; margin-top: 3px; color: #666;">
                    ${producto.area ? `📍 ${obtenerNombreArea(producto.area)}` : ''} 
                    ${producto.area && producto.categoria ? ' • ' : ''}
                    📂 ${obtenerNombreCategoria(producto.categoria)}
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="color: #ffa502; font-weight: 600;">€${producto.precio.toFixed(2)}</span>
                <button onclick="editarStockProducto(${producto.id})" style="background: #4a5568; color: white; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; transition: all 0.3s ease;">📦 Stock</button>
                <button onclick="abrirModalEditarProducto(${producto.id})" style="background: #4a5568; color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-size: 14px; transition: all 0.3s ease;">✏️ Editar</button>
                <button onclick="eliminarProducto(${producto.id})" style="background: #ef4444; color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-size: 14px; transition: all 0.3s ease;">🗑️ Eliminar</button>
            </div>
        `;

        lista.appendChild(item);
    });
}

// ========================================
// FUNCIONES AUXILIARES PARA ÁREAS Y CATEGORÍAS
// ========================================

// Función para obtener el nombre de un área por su ID
function obtenerNombreArea(areaId) {
    const area = areas.find(a => a.id === areaId && a.activa);
    return area ? area.nombre : areaId;
}

// Función para obtener el nombre de una categoría por su ID
function obtenerNombreCategoria(categoriaId) {
    const categoria = categorias.find(c => c.id === categoriaId && c.activa);
    return categoria ? categoria.nombre : categoriaId;
}


// Cerrar modal de edición si se hace clic fuera
window.addEventListener('click', function (event) {
    const modal = document.getElementById('editarProductoModal');
    if (event.target == modal) {
        cerrarModalEditarProducto();
    }
});

// Función para abrir modal de edición
function abrirModalEditarProducto(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;

    productoEditandoId = id;

    // Llenar campos con datos actuales
    document.getElementById('editarNombre').value = producto.nombre;
    document.getElementById('editarPrecio').value = producto.precio;
    document.getElementById('editarEmoji').value = producto.emoji;

    // Mostrar modal
    document.getElementById('editarProductoModal').style.display = 'block';
    // Configurar teclados virtuales para este modal
    if (esDispositivoTactil()) {
        setTimeout(() => {
            // Campo de nombre
            const inputNombre = document.getElementById('editarNombre');
            if (inputNombre) {
                inputNombre.readOnly = true;
                const newInputNombre = inputNombre.cloneNode(true);
                inputNombre.parentNode.replaceChild(newInputNombre, inputNombre);
                newInputNombre.addEventListener('click', function (e) {
                    e.preventDefault();
                    this.blur();
                    abrirTecladoCompleto(this);
                });
            }

            // Campo de precio
            const inputPrecio = document.getElementById('editarPrecio');
            if (inputPrecio) {
                inputPrecio.readOnly = true;
                const newInputPrecio = inputPrecio.cloneNode(true);
                inputPrecio.parentNode.replaceChild(newInputPrecio, inputPrecio);
                newInputPrecio.addEventListener('click', function (e) {
                    e.preventDefault();
                    this.blur();
                    abrirTecladoNumerico(this);
                });
            }
        }, 200);
    }
}

// Función para cerrar modal de edición
function cerrarModalEditarProducto() {
    document.getElementById('editarProductoModal').style.display = 'none';
    productoEditandoId = null;

    // Limpiar campos
    document.getElementById('editarNombre').value = '';
    document.getElementById('editarPrecio').value = '';
    document.getElementById('editarEmoji').value = '';
    cerrarTodosLosTeclados();
}

// Función para guardar la edición
function guardarEdicionProducto() {
    const nombre = document.getElementById('editarNombre').value.trim();
    const precio = parseFloat(document.getElementById('editarPrecio').value);
    const emoji = document.getElementById('editarEmoji').value.trim() || '🍽️';

    if (!nombre) {
        alert('Por favor ingresa un nombre para el producto');
        return;
    }

    if (isNaN(precio) || precio <= 0) {
        alert('Por favor ingresa un precio válido');
        return;
    }

    // Encontrar y actualizar el producto
    const productoIndex = productos.findIndex(p => p.id === productoEditandoId);
    if (productoIndex !== -1) {
        const nombreAnterior = productos[productoIndex].nombre;

        productos[productoIndex] = {
            ...productos[productoIndex],
            nombre: nombre,
            precio: precio,
            emoji: emoji
        };

        // Guardar en localStorage
        localStorage.setItem('productosPersonalizados', JSON.stringify(productos));

        // Actualizar lista
        renderizarListaProductos();

        // Cerrar modal
        cerrarModalEditarProducto();

        // Mostrar notificación
        mostrarNotificacion(`✅ Producto "${nombreAnterior}" actualizado correctamente`);
    }
}