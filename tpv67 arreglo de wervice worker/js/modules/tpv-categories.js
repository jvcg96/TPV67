// ========================================
// SISTEMA DE PESTAÑAS DE CATEGORÍAS TPV
// ========================================

let categoriaActivaTPV = null;

// Variables para paginación
let paginaActualProductos = 1;
let productosPorPagina = 9; // Por defecto 3x3
let totalPaginasProductos = 1;
let productosFiltradosActuales = [];


// Variables globales para paginación
window.paginaActualProductos = 1;
window.productosPorPagina = 9;
window.totalPaginasProductos = 1;
window.productosFiltradosActuales = [];

// Función para renderizar pestañas de categorías dinámicas
function renderizarPestanasCategorias() {
    const container = document.getElementById('categoriasTabs');
    container.innerHTML = '';

    // Obtener categorías activas que tienen productos
    const categoriasConProductos = categorias.filter(cat => {
        return cat.activa && productos.some(prod => prod.categoria === cat.id);
    });

    // Si no hay categorías, mostrar todos los productos
    if (categoriasConProductos.length === 0) {
        categoriaActivaTPV = null;
        renderizarProductosPorCategoria();
        return;
    }

    // Añadir pestaña "TODOS" al inicio
    const tabTodos = document.createElement('button');
    tabTodos.className = 'categoria-tab';
    tabTodos.textContent = '🍽️ TODOS';
    tabTodos.onclick = () => cambiarCategoriaTPV(null);
    container.appendChild(tabTodos);

    // Añadir pestañas de categorías
    categoriasConProductos.forEach(categoria => {
        const tab = document.createElement('button');
        tab.className = 'categoria-tab';

        // Emoji automático según categoría
        const emoji = obtenerEmojiCategoria(categoria.id, categoria.nombre);
        tab.textContent = `${emoji} ${categoria.nombre.toUpperCase()}`;
        tab.onclick = () => cambiarCategoriaTPV(categoria.id);

        container.appendChild(tab);
    });

    // Activar primera pestaña (TODOS)
    categoriaActivaTPV = null;
    tabTodos.classList.add('active');
    renderizarProductosPorCategoria();
}

// Función para obtener emoji automático según categoría
function obtenerEmojiCategoria(categoriaId, nombreCategoria) {
    const emojis = {
        'bebidas': '🥤',
        'comida': '🍔',
        'alcohol': '🍷',
        'aperitivos': '🥜',
        'postres': '🍰',
        'cafes': '☕',
        'refrescos': '🥤',
        'cervezas': '🍺',
        'vinos': '🍷',
        'cocktail': '🍹',
        'tapas': '🍤',
        'ensaladas': '🥗',
        'carnes': '🥩',
        'pescados': '🐟',
        'pizzas': '🍕',
        'pasta': '🍝',
        'bocadillos': '🥪',
        'hamburguesas': '🍔'
    };

    // Buscar por ID exacto
    if (emojis[categoriaId]) return emojis[categoriaId];

    // Buscar por nombre (contiene)
    const nombreLower = nombreCategoria.toLowerCase();
    for (const [key, emoji] of Object.entries(emojis)) {
        if (nombreLower.includes(key) || key.includes(nombreLower)) {
            return emoji;
        }
    }

    // Emoji por defecto
    return '📂';
}

// Función para cambiar categoría activa
function cambiarCategoriaTPV(categoriaId) {
    categoriaActivaTPV = categoriaId;

    // IMPORTANTE: Resetear a página 1
    window.paginaActualProductos = 1;

    // Actualizar pestañas activas
    const tabs = document.querySelectorAll('.categoria-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Activar pestaña clickeada
    if (event && event.target) {
        event.target.classList.add('active');
    }

    // Renderizar productos filtrados
    renderizarProductosPorCategoria();

    // Mostrar notificación
    const nombreCategoria = categoriaId ?
        categorias.find(c => c.id === categoriaId)?.nombre || 'Categoría' :
        'Todos los productos';
    // mostrarNotificacion(`📂 Mostrando: ${nombreCategoria}`);
}
// Detectar tamaño de pantalla y ajustar productos por página
function calcularProductosPorPagina() {
    // FORZAR SIEMPRE 3x3 = 9 productos para TPV táctil
    window.productosPorPagina = 9;
    productosPorPagina = 9;
}

// Función para renderizar productos filtrados por categoría con paginación TPV
async function renderizarProductosPorCategoria() {
    const grid = document.getElementById('productosGrid');
    if (!grid) return;

    // Calcular productos por página según dispositivo
    window.calcularProductosPorPagina();

    // Filtrar productos por categoría
    window.productosFiltradosActuales = categoriaActivaTPV ?
        productos.filter(p => p.categoria === categoriaActivaTPV) :
        productos;

    // Calcular total de páginas
    window.totalPaginasProductos = Math.ceil(window.productosFiltradosActuales.length / window.productosPorPagina);

    if (window.totalPaginasProductos === 0) {
        window.totalPaginasProductos = 1;
    }

    // Validar página actual
    if (window.paginaActualProductos > window.totalPaginasProductos) {
        window.paginaActualProductos = 1;
    }

    // Actualizar controles de paginación
    actualizarControlesPaginacion();

    // Limpiar grid
    grid.innerHTML = '';

    // Si no hay productos
    if (window.productosFiltradosActuales.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #888;">
                <h3>😔 No hay productos</h3>
                <p>Ve a Configuración</p>
            </div>
        `;
        return;
    }

    // Calcular índices para esta página
    const inicio = (window.paginaActualProductos - 1) * window.productosPorPagina;
    const fin = Math.min(inicio + window.productosPorPagina, window.productosFiltradosActuales.length);

    // Renderizar productos
    for (let i = 0; i < window.productosPorPagina; i++) {
        const productoIndex = inicio + i;
        const producto = window.productosFiltradosActuales[productoIndex];

        if (producto) {
            // Crear botón de producto
            const btn = document.createElement('button');
            btn.className = 'producto-btn-tpv';
            btn.setAttribute('data-producto-id', producto.id);

            // Calcular stock disponible
            let stockInfo = '';
            let stockColor = '#888';
            let habilitado = true;

            if (producto.controlStock === false) {
                stockInfo = '♾️';
                stockColor = '#22c55e';
            } else {
                const stockReservado = calcularStockReservado(producto.id);
                const stockDisponible = producto.stock - stockReservado;

                if (stockDisponible <= 0) {
                    stockInfo = 'AGOTADO';
                    stockColor = '#ff6b6b';
                    habilitado = false;
                    btn.classList.add('agotado');
                } else if (stockDisponible <= producto.stockMinimo) {
                    stockInfo = `Stock: ${stockDisponible}`;
                    stockColor = '#ffa502';
                } else {
                    stockInfo = `Stock: ${stockDisponible}`;
                    stockColor = '#888';
                }
            }

            // Crear estructura del botón con soporte para imágenes
            let visualElement = `<div class="producto-emoji">${producto.emoji}</div>`;

            // Si el producto tiene imagen, cargarla
            if (producto.tieneImagen) {
                try {
                    const imagenBase64 = await DB.obtenerImagen(producto.id);
                    if (imagenBase64) {
                        visualElement = `<img src="${imagenBase64}" alt="${producto.nombre}" 
                                       style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; 
                                              box-shadow: 0 2px 8px rgba(0,0,0,0.3);">`;
                    }
                } catch (error) {
                    console.error(`Error al cargar imagen del producto ${producto.id}:`, error);
                    // Mantener emoji como fallback
                }
            }

            // Estructura del botón
            btn.innerHTML = `
                ${visualElement}
                <div class="producto-nombre">${producto.nombre}</div>
                <div class="producto-precio">€${producto.precio.toFixed(2)}</div>
                <div class="producto-stock" style="color: ${stockColor};">${stockInfo}</div>
            `;

            // Configurar evento click
            if (habilitado) {
                btn.onclick = () => {
                    agregarProducto(producto);
                    // Efecto visual
                    btn.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        btn.style.transform = 'scale(1)';
                    }, 150);
                };
            } else {
                btn.onclick = () => {

                };
            }

            grid.appendChild(btn);
        } else {
            // Crear celda vacía para mantener el grid
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'producto-empty';
            emptyDiv.style.visibility = 'hidden';
            grid.appendChild(emptyDiv);
        }
    }
}


// Función auxiliar para crear botón de producto
async function crearBotonProducto(producto) {
    const btn = document.createElement('button');
    btn.className = 'producto-btn';
    btn.setAttribute('data-producto-id', producto.id);

    // Determinar texto de stock
    let stockText = '';
    let stockColor = '#888';
    let habilitado = true;

    if (producto.controlStock === false) {
        stockText = '♾️ Ilimitado';
        stockColor = '#22c55e';
        habilitado = true;
    } else {
        const stockReservado = calcularStockReservado(producto.id);
        const stockDisponible = producto.stock - stockReservado;

        if (stockDisponible <= 0) {
            stockText = 'AGOTADO';
            stockColor = '#ff6b6b';
            habilitado = false;
        } else if (stockDisponible <= producto.stockMinimo) {
            stockText = `Quedan: ${stockDisponible}`;
            stockColor = '#ffa502';
        } else {
            stockText = `Stock: ${stockDisponible}`;
            stockColor = '#888';
        }
    }

    // Crear contenido del botón
    let visualElement = `<span style="font-size: 40px; line-height: 1;">${producto.emoji}</span>`;

    // Si tiene imagen, intentar cargarla
    if (producto.tieneImagen) {
        try {
            const imagenBase64 = await DB.obtenerImagen(producto.id);
            if (imagenBase64) {
                visualElement = `<img src="${imagenBase64}" alt="${producto.nombre}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">`;
            }
        } catch (error) {
            console.error(`Error al cargar imagen del producto ${producto.id}:`, error);
        }
    }

    btn.innerHTML = `
        ${visualElement}
        <div style="font-weight: 700; margin: 5px 0; font-size: 14px;">${producto.nombre}</div>
        <div style="font-size: 1.2em; color: #ffa502; font-weight: bold;">€${producto.precio.toFixed(2)}</div>
        <span class="stock-info" style="font-size: 0.75em; color: ${stockColor}; font-weight: 600;">${stockText}</span>
    `;

    // Configurar el onclick
    if (!habilitado) {
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btn.onclick = () => {
            mostrarNotificacion(`❌ ${producto.nombre} agotado`);
        };
    } else {
        btn.onclick = () => {
            agregarProducto(producto);
            // Efecto visual de agregado
            btn.style.transform = 'scale(0.9)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 200);
        };
    }

    return btn;
}

// Funciones de navegación de páginas
function paginaAnteriorCategoria() {
    if (paginaActualProductos > 1) {
        paginaActualProductos--;
        renderizarProductosPorCategoria();
    }
}
function paginaSiguienteCategoria() {
    if (paginaActualProductos < totalPaginasProductos) {
        paginaActualProductos++;
        renderizarProductosPorCategoria();
    }
}



function irAPaginaCategoria(pagina) {
    if (pagina >= 1 && pagina <= totalPaginasProductos) {
        paginaActualProductos = pagina;
        renderizarProductosPorCategoria();
    }
}
// Actualizar indicadores de paginación
function actualizarIndicadoresPaginacion() {
    // Actualizar números
    const paginaActualElem = document.getElementById('paginaActualCategoria');
    const totalPaginasElem = document.getElementById('totalPaginasCategoria');

    if (paginaActualElem) paginaActualElem.textContent = paginaActualProductos;
    if (totalPaginasElem) totalPaginasElem.textContent = totalPaginasProductos;

    // Actualizar botones
    const btnPrev = document.getElementById('btnPrevCategoria');
    const btnNext = document.getElementById('btnNextCategoria');

    if (btnPrev) btnPrev.disabled = paginaActualProductos === 1;
    if (btnNext) btnNext.disabled = paginaActualProductos === totalPaginasProductos;

    // Actualizar dots
    actualizarDotsPaginacion();
}

// Actualizar indicadores de puntos
function actualizarDotsPaginacion() {
    const dotsContainer = document.getElementById('productsDots');
    if (!dotsContainer) return;

    dotsContainer.innerHTML = '';

    // Mostrar máximo 7 dots
    const maxDots = 7;
    if (totalPaginasProductos <= maxDots) {
        // Mostrar todos los dots
        for (let i = 1; i <= totalPaginasProductos; i++) {
            const dot = document.createElement('span');
            dot.className = 'dot-pagina';
            if (i === paginaActualProductos) dot.classList.add('active');
            dot.onclick = () => irAPaginaCategoria(i);
            dotsContainer.appendChild(dot);
        }
    } else {
        // Mostrar dots con elipsis
        if (paginaActualProductos <= 3) {
            for (let i = 1; i <= 4; i++) {
                const dot = document.createElement('span');
                dot.className = 'dot-pagina';
                if (i === paginaActualProductos) dot.classList.add('active');
                dot.onclick = () => irAPaginaCategoria(i);
                dotsContainer.appendChild(dot);
            }
            dotsContainer.innerHTML += '<span style="color: #888;">...</span>';
            const dotLast = document.createElement('span');
            dotLast.className = 'dot-pagina';
            dotLast.onclick = () => irAPaginaCategoria(totalPaginasProductos);
            dotsContainer.appendChild(dotLast);
        } else if (paginaActualProductos >= totalPaginasProductos - 2) {
            const dotFirst = document.createElement('span');
            dotFirst.className = 'dot-pagina';
            dotFirst.onclick = () => irAPaginaCategoria(1);
            dotsContainer.appendChild(dotFirst);
            dotsContainer.innerHTML += '<span style="color: #888;">...</span>';
            for (let i = totalPaginasProductos - 3; i <= totalPaginasProductos; i++) {
                const dot = document.createElement('span');
                dot.className = 'dot-pagina';
                if (i === paginaActualProductos) dot.classList.add('active');
                dot.onclick = () => irAPaginaCategoria(i);
                dotsContainer.appendChild(dot);
            }
        } else {
            const dotFirst = document.createElement('span');
            dotFirst.className = 'dot-pagina';
            dotFirst.onclick = () => irAPaginaCategoria(1);
            dotsContainer.appendChild(dotFirst);
            dotsContainer.innerHTML += '<span style="color: #888;">...</span>';
            for (let i = paginaActualProductos - 1; i <= paginaActualProductos + 1; i++) {
                const dot = document.createElement('span');
                dot.className = 'dot-pagina';
                if (i === paginaActualProductos) dot.classList.add('active');
                dot.onclick = () => irAPaginaCategoria(i);
                dotsContainer.appendChild(dot);
            }
            dotsContainer.innerHTML += '<span style="color: #888;">...</span>';
            const dotLast = document.createElement('span');
            dotLast.className = 'dot-pagina';
            dotLast.onclick = () => irAPaginaCategoria(totalPaginasProductos);
            dotsContainer.appendChild(dotLast);
        }
    }
}

// Recalcular productos por página cuando se redimensiona la ventana
window.addEventListener('resize', () => {
    const productosPorPaginaAnterior = productosPorPagina;
    calcularProductosPorPagina();

    // Solo re-renderizar si cambió el número de productos por página
    if (productosPorPaginaAnterior !== productosPorPagina) {
        renderizarProductosPorCategoria();
    }
});



// Nueva función auxiliar para actualizar controles
function actualizarControlesPaginacion() {
    // Actualizar números de página
    const paginaActual = document.getElementById('paginaActualCategoria');
    const totalPaginas = document.getElementById('totalPaginasCategoria');

    if (paginaActual) paginaActual.textContent = window.paginaActualProductos;
    if (totalPaginas) totalPaginas.textContent = window.totalPaginasProductos;

    // Actualizar botones
    const btnPrev = document.getElementById('btnPrevCategoria');
    const btnNext = document.getElementById('btnNextCategoria');

    if (btnPrev) {
        btnPrev.disabled = window.paginaActualProductos === 1;
        btnPrev.style.opacity = btnPrev.disabled ? '0.3' : '1';
    }

    if (btnNext) {
        btnNext.disabled = window.paginaActualProductos >= window.totalPaginasProductos;
        btnNext.style.opacity = btnNext.disabled ? '0.3' : '1';
    }

    // Mostrar/ocultar controles según haya productos
    const paginacionTop = document.querySelector('.productos-paginacion-top');
    if (paginacionTop) {
        paginacionTop.style.visibility = window.productosFiltradosActuales.length > 0 ? 'visible' : 'hidden';
    }
}

