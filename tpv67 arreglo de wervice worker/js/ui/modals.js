// Función para mostrar modal de login
function mostrarModalLogin() {
    let modal = document.getElementById('modalLogin');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalLogin';
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <h2 style="text-align: center; color: #ffa502; margin-bottom: 30px;">
                    🔐 Iniciar Sesión
                </h2>
                
                <div style="text-align: center; margin-bottom: 30px;">
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
                    ">
                        <span id="pinDots">----</span>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
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
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.style.display = 'block';
    limpiarPin();
}

// Función para agregar dígito al PIN
function agregarDigitoPin(digito) {
    if (pinActual.length < 4) {
        pinActual += digito;
        actualizarDisplayPin();

        // Auto-verificar cuando tenga 4 dígitos
        if (pinActual.length === 4) {
            setTimeout(confirmarPin, 300);
        }
    }
}

// Función para actualizar display del PIN
function actualizarDisplayPin() {
    const dots = document.getElementById('pinDots');
    if (dots) {
        let display = '';
        for (let i = 0; i < 4; i++) {
            if (i < pinActual.length) {
                display += '●';
            } else {
                display += '-';
            }
        }
        dots.textContent = display;
    }
}

// Función para limpiar PIN
function limpiarPin() {
    pinActual = '';
    actualizarDisplayPin();
}



// Función para confirmar PIN
function confirmarPin() {
    if (pinActual.length === 4) {
        if (verificarPIN(pinActual)) {
            // PIN correcto - cerrar formulario y actualizar vista
            limpiarPin();
            actualizarSeccionLogin();

            // Si es dueño, mostrar las secciones de gestión
            if (usuarioActual && usuarioActual.rol === 'dueño') {
                document.getElementById('seccionCrearUsuario').style.display = 'block';
                document.getElementById('seccionListaUsuarios').style.display = 'block';
                renderizarListaUsuarios();
            }
        } else {
            // PIN incorrecto - animación de error
            const display = document.getElementById('pinDisplay');
            if (display) {
                display.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    display.style.animation = '';
                    limpiarPin();
                }, 500);
            }
            mostrarNotificacion('❌ PIN incorrecto');
        }
    }
}

// Función para cerrar modal login
function cerrarModalLogin() {
    const modal = document.getElementById('modalLogin');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Función para mostrar modal de cambio de usuario
function mostrarModalCambioUsuario() {
    mostrarModalLogin();
}
// Cerrar modal si se hace clic fuera
window.onclick = function (event) {
    const modal = document.getElementById('mesaModal');
    if (event.target == modal) {
        cerrarModal();
    }
}

// Atajos de teclado para modal de edición
document.addEventListener('keydown', function (event) {
    // ESC para cerrar modal de edición
    if (event.key === 'Escape' && productoEditandoId !== null) {
        cerrarModalEditarProducto();
    }

    // Enter para guardar cambios
    if (event.key === 'Enter' && productoEditandoId !== null) {
        guardarEdicionProducto();
    }
});

// Atajos de teclado para modal de cobro
document.addEventListener('keydown', function (event) {
    const modalCobro = document.getElementById('modalCobro');
    if (modalCobro && modalCobro.style.display === 'block') {
        // ESC para cerrar modal de cobro
        if (event.key === 'Escape') {
            cerrarModalCobro();
        }

        // Enter para confirmar cobro
        if (event.key === 'Enter') {
            const confirmarBtn = document.getElementById('confirmarCobroBtn');
            if (!confirmarBtn.disabled) {
                confirmarCobro();
            }
        }
    }
});