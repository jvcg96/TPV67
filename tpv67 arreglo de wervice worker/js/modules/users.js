// ========================================
// FUNCIONES DE GESTIÓN DE USUARIOS
// ========================================
// Funciones para gestión de usuarios
function agregarUsuario() {
    const nombre = document.getElementById('nuevoUsuarioNombre').value.trim().toUpperCase();
    const pin = document.getElementById('nuevoUsuarioPin').value.trim();
    const rol = document.getElementById('nuevoUsuarioRol').value;

    if (!nombre || !pin) {
        alert('Por favor completa todos los campos');
        return;
    }

    if (pin.length !== 4 || isNaN(pin)) {
        alert('El PIN debe ser de 4 dígitos numéricos');
        return;
    }

    // Verificar PIN único
    if (usuariosRegistrados.some(u => u.pin === pin)) {
        alert('Ya existe un usuario con ese PIN');
        return;
    }

    const nuevoUsuario = {
        id: Date.now(),
        nombre: nombre,
        pin: pin,
        rol: rol,
        activo: true
    };

    usuariosRegistrados.push(nuevoUsuario);
    localStorage.setItem('usuariosTPV', JSON.stringify(usuariosRegistrados));

    // Limpiar formulario
    document.getElementById('nuevoUsuarioNombre').value = '';
    document.getElementById('nuevoUsuarioPin').value = '';

    renderizarListaUsuarios();
    mostrarNotificacion(`✅ Usuario ${nombre} creado`);
}

// Función para mostrar formulario de login en la pestaña
function mostrarFormularioLogin() {
    const loginSection = document.getElementById('loginSection');
    if (!loginSection) return;

    loginSection.innerHTML = `
        <h3 style="color: #ffa502; margin-bottom: 20px;">Introduce tu PIN</h3>
        <div id="pinDisplay" style="
            font-size: 2em;
            letter-spacing: 20px;
            background: rgba(40, 40, 40, 0.9);
            padding: 20px;
            border-radius: 15px;
            border: 1px solid rgba(255, 165, 2, 0.3);
            min-height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        ">
            <span id="pinDots">----</span>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 0 auto; max-width: 400px;">
            <button class="pin-btn" onclick="agregarDigitoPin('1')">1</button>
            <button class="pin-btn" onclick="agregarDigitoPin('2')">2</button>
            <button class="pin-btn" onclick="agregarDigitoPin('3')">3</button>
            <button class="pin-btn" onclick="agregarDigitoPin('4')">4</button>
            <button class="pin-btn" onclick="agregarDigitoPin('5')">5</button>
            <button class="pin-btn" onclick="agregarDigitoPin('6')">6</button>
            <button class="pin-btn" onclick="agregarDigitoPin('7')">7</button>
            <button class="pin-btn" onclick="agregarDigitoPin('8')">8</button>
            <button class="pin-btn" onclick="agregarDigitoPin('9')">9</button>
            <button class="pin-btn" onclick="limpiarPin()" style="background: #ef4444;">C</button>
            <button class="pin-btn" onclick="agregarDigitoPin('0')">0</button>
            <button class="pin-btn" onclick="confirmarPin()" style="background: #22c55e;">✓</button>
        </div>
        
        <button class="btn-primary" onclick="cancelarLogin()" style="margin-top: 20px;">
            Cancelar
        </button>
        
        <style>
            .pin-btn {
                padding: 25px;
                font-size: 24px;
                background: #4a5568;
                color: white;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .pin-btn:hover {
                transform: scale(1.05);
                background: #5a6578;
            }
        </style>
    `;

    limpiarPin();
}

// Función para cancelar login
function cancelarLogin() {
    actualizarSeccionLogin();
    limpiarPin();
}

function actualizarSeccionLogin() {
    const estadoSesion = document.getElementById('estadoSesion');
    const loginSection = document.getElementById('loginSection');
    const seccionCrear = document.getElementById('seccionCrearUsuario');
    const seccionLista = document.getElementById('seccionListaUsuarios');

    if (!estadoSesion || !loginSection) return;

    if (usuarioActual) {
        const rolEmoji = {
            'dueño': '💼',
            'encargado': '👔',
            'camarero': '🍽️'
        };

        const rolColor = {
            'dueño': '#ffd700',
            'encargado': '#4a9eff',
            'camarero': '#22c55e'
        };

        // Actualizar estado de sesión
        estadoSesion.innerHTML = `
            <h4 style="color: #22c55e; margin: 0;">✅ Sesión Activa</h4>
            <div style="margin: 10px 0; padding: 15px; background: rgba(40, 40, 40, 0.5); border-radius: 10px;">
                <span style="font-size: 2em;">${rolEmoji[usuarioActual.rol]}</span>
                <div style="margin-top: 10px;">
                    <strong style="font-size: 1.3em; color: #fff;">${usuarioActual.nombre}</strong>
                    <div style="color: ${rolColor[usuarioActual.rol]}; margin-top: 5px; font-weight: 600;">
                        ${usuarioActual.rol.toUpperCase()}
                    </div>
                </div>
            </div>
        `;

        // SIEMPRE mostrar botón de cambiar usuario
        loginSection.innerHTML = `
            <button class="btn-primary" onclick="mostrarFormularioLogin()" style="padding: 15px 40px; font-size: 18px;">
                👤 ${usuarioActual.nombre} - Cambiar Usuario
            </button>
            <button class="btn-danger" onclick="cerrarSesion()" style="padding: 15px 40px; font-size: 18px; margin-left: 10px;">
                🚪 Cerrar Sesión
            </button>
        `;

        // Mostrar secciones según rol
        if (usuarioActual.rol === 'dueño') {
            if (seccionCrear) seccionCrear.style.display = 'block';
            if (seccionLista) seccionLista.style.display = 'block';
        } else {
            if (seccionCrear) seccionCrear.style.display = 'none';
            if (seccionLista) seccionLista.style.display = 'block'; // Encargados y camareros ven lista
        }

        renderizarListaUsuarios();

    } else {
        // Sin sesión activa - Modo invitado (como camarero)
        estadoSesion.innerHTML = `
            <h4 style="color: #888; margin: 0;">🔓 Modo Invitado</h4>
            <p style="margin: 10px 0; color: #666;">Inicia sesión para gestionar usuarios</p>
        `;

        loginSection.innerHTML = `
            <button class="btn-primary" onclick="mostrarFormularioLogin()" style="padding: 15px 40px; font-size: 18px;">
                🔐 Iniciar Sesión
            </button>
        `;

        // Ocultar sección de crear, mostrar lista en modo limitado
        if (seccionCrear) seccionCrear.style.display = 'none';
        if (seccionLista) {
            seccionLista.style.display = 'block';
            renderizarListaUsuariosVistaLimitada();
        }
    }
}



function renderizarListaUsuarios() {
    const lista = document.getElementById('listaUsuarios');
    if (!lista) return;

    lista.innerHTML = '';

    // Si no hay sesión, mostrar vista limitada
    if (!usuarioActual) {
        renderizarListaUsuariosVistaLimitada();
        return;
    }

    usuariosRegistrados.forEach(usuario => {
        const item = document.createElement('div');
        item.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;

        const rolEmoji = {
            'dueño': '💼',
            'encargado': '👔',
            'camarero': '🍽️'
        };

        // Determinar si mostrar PIN real o ****
        let pinMostrar = '****';
        let puedeEditarEsteUsuario = false;

        if (usuarioActual.rol === 'dueño') {
            // Dueño ve todos los PINs
            pinMostrar = usuario.pin;
            puedeEditarEsteUsuario = true;
        } else if (usuarioActual.id === usuario.id) {
            // Usuario ve su propio PIN
            pinMostrar = usuario.pin;
            puedeEditarEsteUsuario = true; // Solo puede cambiar su PIN
        }

        item.innerHTML = `
            <div style="flex: 1;">
                <span style="font-size: 1.2em; margin-right: 10px;">${rolEmoji[usuario.rol]}</span>
                <span style="font-weight: 600;">${usuario.nombre}</span>
                ${usuarioActual.rol === 'dueño' ? `
                    <button onclick="cambiarNombreUsuario(${usuario.id})" 
                            style="background: transparent; color: #888; border: none; padding: 2px 8px; cursor: pointer; font-size: 12px; margin-left: 5px;" 
                            title="Editar nombre">✏️</button>
                ` : ''}
                <span style="color: #888; margin-left: 15px;">PIN: ${pinMostrar}</span>
                <span style="color: #ffa502; margin-left: 15px;">${usuario.rol.toUpperCase()}</span>
                ${usuario.id === 1 ? '<span style="color: #666; margin-left: 10px; font-size: 0.85em;">(Usuario principal)</span>' : ''}
            </div>
            <div>
                ${puedeEditarEsteUsuario ? `
                    <button onclick="cambiarPinUsuario(${usuario.id})" 
                            style="background: #4a5568; color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; margin-right: 10px;">
                        🔑 ${usuarioActual.id === usuario.id && usuarioActual.rol !== 'dueño' ? 'Cambiar MI PIN' : 'Cambiar PIN'}
                    </button>
                ` : ''}
                ${usuarioActual.rol === 'dueño' && usuario.id !== 1 ? `
                    <button onclick="eliminarUsuario(${usuario.id})" 
                            style="background: #ef4444; color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer;">
                        🗑️ Eliminar
                    </button>
                ` : ''}
            </div>
        `;

        lista.appendChild(item);
    });

    // Mensaje según rol
    if (usuarioActual.rol !== 'dueño') {
        const mensaje = document.createElement('div');
        mensaje.style.cssText = `
            margin-top: 20px;
            padding: 15px;
            background: rgba(255, 165, 2, 0.1);
            border: 1px solid rgba(255, 165, 2, 0.3);
            border-radius: 10px;
            text-align: center;
        `;
        mensaje.innerHTML = `<p style="color: #ffa502;">💡 Solo puedes cambiar tu propio PIN</p>`;
        lista.appendChild(mensaje);
    }
}

// Función para mostrar lista de usuarios en modo solo lectura (encargados)
function renderizarListaUsuariosVistaLimitada() {
    const lista = document.getElementById('listaUsuarios');
    if (!lista) return;

    lista.innerHTML = '';

    usuariosRegistrados.forEach(usuario => {
        const item = document.createElement('div');
        item.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            opacity: 0.7;
        `;

        const rolEmoji = {
            'dueño': '💼',
            'encargado': '👔',
            'camarero': '🍽️'
        };

        item.innerHTML = `
            <div style="flex: 1;">
                <span style="font-size: 1.2em; margin-right: 10px;">${rolEmoji[usuario.rol]}</span>
                <span style="font-weight: 600;">${usuario.nombre}</span>
                <span style="color: #888; margin-left: 15px;">PIN: ****</span>
                <span style="color: #ffa502; margin-left: 15px;">${usuario.rol.toUpperCase()}</span>
            </div>
            <div>
                <span style="color: #666; font-style: italic;">Solo lectura</span>
            </div>
        `;

        lista.appendChild(item);
    });

    // Mensaje informativo
    const mensaje = document.createElement('div');
    mensaje.style.cssText = `
        margin-top: 20px;
        padding: 15px;
        background: rgba(255, 165, 2, 0.1);
        border: 1px solid rgba(255, 165, 2, 0.3);
        border-radius: 10px;
        text-align: center;
    `;
    mensaje.innerHTML = `<p style="color: #ffa502;">Como encargado puedes ver los usuarios pero no editarlos</p>`;
    lista.appendChild(mensaje);
}

// Función para cambiar PIN de usuario
function cambiarPinUsuario(userId) {
    const usuario = usuariosRegistrados.find(u => u.id === userId);
    if (!usuario) return;

    // Crear modal para cambiar PIN
    const modalHTML = `
        <div id="modalCambiarPin" class="modal" style="display: block;">
            <div class="modal-content" style="max-width: 400px;">
                <span class="close" onclick="document.getElementById('modalCambiarPin').remove()">&times;</span>
                <h2 style="margin-bottom: 20px; color: #ffa502;">🔑 Cambiar PIN</h2>
                <h3 style="color: #fff; margin-bottom: 20px;">${usuario.nombre}</h3>
                
                <div style="text-align: center;">
                    <div id="nuevoPinDisplay" style="
                        font-size: 2em;
                        letter-spacing: 20px;
                        background: rgba(40, 40, 40, 0.9);
                        padding: 20px;
                        border-radius: 15px;
                        border: 1px solid rgba(255, 165, 2, 0.3);
                        min-height: 80px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 20px;
                    ">
                        <span id="nuevoPinDots">----</span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 0 auto; max-width: 300px;">
                        <button class="pin-btn" onclick="agregarDigitoNuevoPin('1')">1</button>
                        <button class="pin-btn" onclick="agregarDigitoNuevoPin('2')">2</button>
                        <button class="pin-btn" onclick="agregarDigitoNuevoPin('3')">3</button>
                        <button class="pin-btn" onclick="agregarDigitoNuevoPin('4')">4</button>
                        <button class="pin-btn" onclick="agregarDigitoNuevoPin('5')">5</button>
                        <button class="pin-btn" onclick="agregarDigitoNuevoPin('6')">6</button>
                        <button class="pin-btn" onclick="agregarDigitoNuevoPin('7')">7</button>
                        <button class="pin-btn" onclick="agregarDigitoNuevoPin('8')">8</button>
                        <button class="pin-btn" onclick="agregarDigitoNuevoPin('9')">9</button>
                        <button class="pin-btn" onclick="limpiarNuevoPin()" style="background: #ef4444;">C</button>
                        <button class="pin-btn" onclick="agregarDigitoNuevoPin('0')">0</button>
                        <button class="pin-btn" onclick="confirmarNuevoPin(${userId})" style="background: #22c55e;">✓</button>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <button class="btn-primary" onclick="document.getElementById('modalCambiarPin').remove()">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    window.nuevoPinActual = '';
}

// Variables y funciones para el nuevo PIN
let nuevoPinActual = '';

function agregarDigitoNuevoPin(digito) {
    if (nuevoPinActual.length < 4) {
        nuevoPinActual += digito;
        actualizarDisplayNuevoPin();

        if (nuevoPinActual.length === 4) {
            setTimeout(() => confirmarNuevoPin(userId), 300);
        }
    }
}

function actualizarDisplayNuevoPin() {
    const dots = document.getElementById('nuevoPinDots');
    if (dots) {
        let display = '';
        for (let i = 0; i < 4; i++) {
            if (i < nuevoPinActual.length) {
                display += '●';
            } else {
                display += '-';
            }
        }
        dots.textContent = display;
    }
}

function limpiarNuevoPin() {
    nuevoPinActual = '';
    actualizarDisplayNuevoPin();
}

function confirmarNuevoPin(userId) {
    if (nuevoPinActual.length !== 4) {
        alert('El PIN debe tener 4 dígitos');
        return;
    }

    // Verificar PIN único
    if (usuariosRegistrados.some(u => u.pin === nuevoPinActual && u.id !== userId)) {
        alert('Ya existe un usuario con ese PIN');
        limpiarNuevoPin();
        return;
    }

    // Actualizar PIN
    const usuario = usuariosRegistrados.find(u => u.id === userId);
    if (usuario) {
        usuario.pin = nuevoPinActual;
        localStorage.setItem('usuariosTPV', JSON.stringify(usuariosRegistrados));

        // Si es el usuario actual, actualizar sesión
        if (usuarioActual && usuarioActual.id === userId) {
            usuarioActual.pin = nuevoPinActual;
            localStorage.setItem('usuarioActualTPV', JSON.stringify(usuarioActual));
        }

        renderizarListaUsuarios();
        mostrarNotificacion(`✅ PIN actualizado para ${usuario.nombre}`);

        // Cerrar modal
        const modal = document.getElementById('modalCambiarPin');
        if (modal) modal.remove();
    }
}
// Función para cambiar nombre de usuario
function cambiarNombreUsuario(userId) {
    const usuario = usuariosRegistrados.find(u => u.id === userId);
    if (!usuario) return;

    const nuevoNombre = prompt(`Cambiar nombre de ${usuario.nombre}:`, usuario.nombre);

    if (!nuevoNombre || !nuevoNombre.trim()) return;

    // Verificar nombre único
    if (usuariosRegistrados.some(u => u.nombre === nuevoNombre.trim().toUpperCase() && u.id !== userId)) {
        alert('Ya existe un usuario con ese nombre');
        return;
    }

    usuario.nombre = nuevoNombre.trim().toUpperCase();
    localStorage.setItem('usuariosTPV', JSON.stringify(usuariosRegistrados));

    // Si es el usuario actual, actualizar sesión
    if (usuarioActual && usuarioActual.id === userId) {
        usuarioActual.nombre = usuario.nombre;
        localStorage.setItem('usuarioActualTPV', JSON.stringify(usuarioActual));
        actualizarSeccionLogin();
        actualizarIndicadorUsuario();
    }

    renderizarListaUsuarios();
    mostrarNotificacion(`✅ Nombre actualizado a ${usuario.nombre}`);
}

// Función para cambiar rol de usuario (solo para dueño)
function cambiarRolUsuario(userId) {
    const usuario = usuariosRegistrados.find(u => u.id === userId);
    if (!usuario) return;

    // No permitir cambiar rol del dueño principal
    if (usuario.id === 1) {
        alert('No se puede cambiar el rol del dueño principal');
        return;
    }

    const roles = ['camarero', 'encargado', 'dueño'];
    const rolActualIndex = roles.indexOf(usuario.rol);
    const nuevoRol = roles[(rolActualIndex + 1) % roles.length];

    usuario.rol = nuevoRol;
    localStorage.setItem('usuariosTPV', JSON.stringify(usuariosRegistrados));

    // Si es el usuario actual, actualizar sesión
    if (usuarioActual && usuarioActual.id === userId) {
        usuarioActual.rol = usuario.rol;
        localStorage.setItem('usuarioActualTPV', JSON.stringify(usuarioActual));
        actualizarInterfazSegunRol();
        actualizarSeccionLogin();
    }

    renderizarListaUsuarios();
    mostrarNotificacion(`✅ Rol cambiado a ${nuevoRol.toUpperCase()}`);
}

function eliminarUsuario(userId) {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
        usuariosRegistrados = usuariosRegistrados.filter(u => u.id !== userId);
        localStorage.setItem('usuariosTPV', JSON.stringify(usuariosRegistrados));
        renderizarListaUsuarios();
        mostrarNotificacion('🗑️ Usuario eliminado');
    }
}
function verificarPIN(pin) {
    const usuario = usuariosRegistrados.find(u => u.pin === pin && u.activo);
    if (usuario) {
        usuarioActual = usuario;
        actualizarInterfazSegunRol();
        mostrarNotificacion(`✅ Bienvenido ${usuario.nombre}`);
        actualizarSeccionLogin();
        cerrarModalLogin();
        return true;
    }
    return false;
}

function cerrarSesion() {
    usuarioActual = null;

    // Actualizar interfaz inmediatamente
    actualizarInterfazSegunRol();
    actualizarSeccionLogin();

    mostrarNotificacion('👋 Sesión cerrada');

    // NO cambiar de pestaña si ya estamos en usuarios
    if (!document.getElementById('usuarios').classList.contains('active')) {
        showTab('mesas');
    }
}
// Función para actualizar interfaz según rol

function actualizarInterfazSegunRol() {
    // Obtener todas las pestañas
    const tabButtons = document.querySelectorAll('.tab-button');

    if (!usuarioActual) {
        // SIN USUARIO = MODO INVITADO (COMO CAMARERO)
        // Solo puede ver Mesas y Usuarios
        tabButtons.forEach((btn) => {
            if (!btn.textContent.includes('Mesas') && !btn.textContent.includes('Usuarios')) {
                btn.style.display = 'none';
            } else {
                btn.style.display = 'inline-block';
            }
        });
        actualizarIndicadorUsuario();
        return;
    }

    // CON USUARIO LOGEADO
    // Resetear todas las pestañas primero
    tabButtons.forEach(btn => btn.style.display = 'inline-block');

    // Aplicar restricciones según rol
    switch (usuarioActual.rol) {
        case 'camarero':
            // Camarero solo ve Mesas y Usuarios
            tabButtons.forEach((btn) => {
                if (!btn.textContent.includes('Mesas') && !btn.textContent.includes('Usuarios')) {
                    btn.style.display = 'none';
                }
            });
            break;

        case 'encargado':
            // Encargado ve todo menos Configuración
            tabButtons.forEach((btn) => {
                if (btn.textContent.includes('Configuración')) {
                    btn.style.display = 'none';
                }
            });
            break;

        case 'dueño':
            // Dueño ve todo
            break;
    }

    // Actualizar indicador de usuario
    actualizarIndicadorUsuario();
}

// Función para actualizar indicador de usuario (solo en pestaña usuarios)
function actualizarIndicadorUsuario() {
    let indicador = document.getElementById('indicadorUsuario');

    // Solo mostrar en la pestaña de usuarios
    const tabUsuariosActiva = document.getElementById('usuarios').classList.contains('active');

    if (!usuarioActual || !tabUsuariosActiva) {
        // Si no hay usuario o no estamos en pestaña usuarios, ocultar
        if (indicador) {
            indicador.style.display = 'none';
        }
        return;
    }

    if (!indicador) {
        // Crear indicador si no existe
        indicador = document.createElement('div');
        indicador.id = 'indicadorUsuario';
        indicador.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(40, 40, 40, 0.95);
            padding: 10px 20px;
            border-radius: 25px;
            border: 1px solid rgba(255, 165, 2, 0.3);
            color: white;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 15px;
        `;
        document.body.appendChild(indicador);
    }

    indicador.style.display = 'flex';

    const rolEmoji = {
        'dueño': '💼',
        'encargado': '👔',
        'camarero': '🍽️'
    };

    indicador.innerHTML = `
        <span style="font-size: 1.2em;">${rolEmoji[usuarioActual.rol]}</span>
        <span style="font-weight: bold;">${usuarioActual.nombre}</span>
        <button onclick="cerrarSesion()" style="background: #ef4444; color: white; border: none; padding: 5px 15px; border-radius: 15px; cursor: pointer;">
            🚪 Salir
        </button>
    `;
}