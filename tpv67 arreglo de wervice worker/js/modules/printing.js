/**
 * printing.js - Sistema de impresión de tickets
 * Módulo para gestión de impresión de tickets de venta
 */

(function () {
    'use strict';

    // Configuración de impresión
    window.printConfig = {
        enabled: localStorage.getItem('printEnabled') !== 'false', // Por defecto true
        autoPrint: localStorage.getItem('autoPrintEnabled') !== 'false', // true por defecto
        printerName: localStorage.getItem('printerName') || '',
        paperWidth: localStorage.getItem('paperWidth') || '80mm',
        fontSize: localStorage.getItem('printFontSize') || '12px',
        showLogo: localStorage.getItem('printShowLogo') !== 'false',
        businessInfo: {
            name: localStorage.getItem('businessName') || 'Mi Restaurante',
            address: localStorage.getItem('businessAddress') || '',
            phone: localStorage.getItem('businessPhone') || '',
            nif: localStorage.getItem('businessNIF') || '',
            email: localStorage.getItem('businessEmail') || ''
        }
    };

    // Almacenar último ticket para reimpresión
    window.lastPrintedTicket = null;

    /**
     * Genera el HTML del ticket
     */
    window.generateTicketHTML = function (ticketData) {
        const {
            mesa,
            productos,
            total,
            metodoPago,
            cambio,
            fecha,
            numeroTicket,
            usuario
        } = ticketData;

        const fechaFormateada = fecha || new Date().toLocaleString('es-ES');
        const config = window.printConfig;

        let html = `
        <div class="ticket-container" style="
            width: ${config.paperWidth};
            font-family: 'Courier New', monospace;
            font-size: ${config.fontSize};
            padding: 10px;
            margin: 0;
        ">`;

        // Encabezado con información del negocio
        if (config.businessInfo.name) {
            html += `
            <div class="ticket-header" style="text-align: center; margin-bottom: 10px;">
                <h2 style="margin: 0; font-size: 1.3em;">${config.businessInfo.name}</h2>
                ${config.businessInfo.address ? `<p style="margin: 2px 0;">${config.businessInfo.address}</p>` : ''}
                ${config.businessInfo.phone ? `<p style="margin: 2px 0;">Tel: ${config.businessInfo.phone}</p>` : ''}
                ${config.businessInfo.nif ? `<p style="margin: 2px 0;">NIF: ${config.businessInfo.nif}</p>` : ''}
            </div>`;
        }

        html += `
            <div class="ticket-divider" style="border-top: 1px dashed #000; margin: 10px 0;"></div>
            
            <!-- Información del ticket -->
            <div class="ticket-info" style="margin-bottom: 10px;">
                <p style="margin: 2px 0;">Fecha: ${fechaFormateada}</p>
                ${numeroTicket ? `<p style="margin: 2px 0;">Ticket #: ${numeroTicket}</p>` : ''}
                ${mesa ? `<p style="margin: 2px 0;">Mesa: ${mesa}</p>` : ''}
                ${usuario ? `<p style="margin: 2px 0;">Atendido por: ${usuario}</p>` : ''}
            </div>
            
            <div class="ticket-divider" style="border-top: 1px dashed #000; margin: 10px 0;"></div>
            
            <!-- Productos -->
            <div class="ticket-products">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 1px solid #000;">
                            <th style="text-align: left; padding: 5px 0;">Cant.</th>
                            <th style="text-align: left; padding: 5px 0;">Producto</th>
                            <th style="text-align: right; padding: 5px 0;">P.Unit</th>
                            <th style="text-align: right; padding: 5px 0;">Total</th>
                        </tr>
                    </thead>
                    <tbody>`;

        // Listar productos
        productos.forEach(producto => {
            const subtotal = (producto.cantidad * producto.precio).toFixed(2);
            html += `
                        <tr>
                            <td style="padding: 3px 0;">${producto.cantidad}</td>
                            <td style="padding: 3px 0;">${producto.nombre}</td>
                            <td style="text-align: right; padding: 3px 0;">${producto.precio.toFixed(2)}€</td>
                            <td style="text-align: right; padding: 3px 0;">${subtotal}€</td>
                        </tr>`;

            // Agregar opciones si existen
            if (producto.opciones && producto.opciones.length > 0) {
                producto.opciones.forEach(opcion => {
                    html += `
                        <tr>
                            <td></td>
                            <td colspan="3" style="padding-left: 10px; font-size: 0.9em; font-style: italic;">
                                → ${opcion}
                            </td>
                        </tr>`;
                });
            }
        });

        html += `
                    </tbody>
                </table>
            </div>
            
            <div class="ticket-divider" style="border-top: 1px dashed #000; margin: 10px 0;"></div>
            
            <!-- Totales -->
            <div class="ticket-totals" style="margin-bottom: 10px;">
                <table style="width: 100%;">
                    <tr>
                        <td style="text-align: right; padding: 3px 0;"><strong>TOTAL:</strong></td>
                        <td style="text-align: right; padding: 3px 0; font-size: 1.2em;">
                            <strong>${total.toFixed(2)}€</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: right; padding: 3px 0;">Método de pago:</td>
                        <td style="text-align: right; padding: 3px 0;">${metodoPago}</td>
                    </tr>`;

        if (metodoPago === 'Efectivo' && cambio !== undefined) {
            html += `
                    <tr>
                        <td style="text-align: right; padding: 3px 0;">Entregado:</td>
                        <td style="text-align: right; padding: 3px 0;">${(total + cambio).toFixed(2)}€</td>
                    </tr>
                    <tr>
                        <td style="text-align: right; padding: 3px 0;">Cambio:</td>
                        <td style="text-align: right; padding: 3px 0;">${cambio.toFixed(2)}€</td>
                    </tr>`;
        }

        html += `
                </table>
            </div>
            
            <div class="ticket-divider" style="border-top: 1px dashed #000; margin: 10px 0;"></div>
            
            <!-- Pie del ticket -->
            <div class="ticket-footer" style="text-align: center; margin-top: 10px;">
                <p style="margin: 5px 0; font-size: 0.9em;">¡Gracias por su visita!</p>
                ${config.businessInfo.email ? `<p style="margin: 2px 0; font-size: 0.8em;">${config.businessInfo.email}</p>` : ''}
            </div>
        </div>`;

        return html;
    };

    /**
     * Imprime el ticket
     */
    window.printTicket = function (ticketData) {
        try {
            // Guardar último ticket
            window.lastPrintedTicket = {
                ...ticketData,
                fecha: new Date().toLocaleString('es-ES'),
                numeroTicket: Date.now()
            };

            // Generar HTML del ticket
            const ticketHTML = window.generateTicketHTML(window.lastPrintedTicket);

            // Crear iframe invisible para impresión
            const printFrame = document.createElement('iframe');
            printFrame.style.position = 'absolute';
            printFrame.style.width = '0';
            printFrame.style.height = '0';
            printFrame.style.border = 'none';
            document.body.appendChild(printFrame);

            // Escribir contenido en el iframe
            const printDocument = printFrame.contentWindow.document;
            printDocument.open();
            printDocument.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Ticket de Venta</title>
                    <style>
                        @page {
                            size: ${window.printConfig.paperWidth} auto;
                            margin: 0;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                        }
                        @media print {
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    ${ticketHTML}
                </body>
                </html>
            `);
            printDocument.close();

            // Esperar a que se cargue e imprimir
            setTimeout(() => {
                printFrame.contentWindow.focus();
                printFrame.contentWindow.print();

                // Limpiar después de imprimir
                setTimeout(() => {
                    document.body.removeChild(printFrame);
                }, 1000);
            }, 250);

            // Mostrar notificación de éxito
            if (window.mostrarNotificacion) {
                window.mostrarNotificacion('Ticket enviado a la impresora', 'success');
            }

            return true;
        } catch (error) {
            console.error('Error al imprimir ticket:', error);
            if (window.mostrarNotificacion) {
                window.mostrarNotificacion('Error al imprimir el ticket', 'error');
            }
            return false;
        }
    };

    /**
     * Reimprime el último ticket
     */
    window.reprintLastTicket = function () {
        if (!window.lastPrintedTicket) {
            if (window.mostrarNotificacion) {
                window.mostrarNotificacion('No hay ningún ticket para reimprimir', 'warning');
            }
            return false;
        }

        return window.printTicket(window.lastPrintedTicket);
    };

    /**
     * Muestra vista previa del ticket
     */
    window.showTicketPreview = function (ticketData) {
        const previewHTML = window.generateTicketHTML(ticketData);

        // Crear modal de vista previa
        const modal = document.createElement('div');
        modal.className = 'modal fade show';
        modal.style.display = 'block';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Vista Previa del Ticket</h5>
                        <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
                    </div>
                    <div class="modal-body" style="background: white; padding: 20px;">
                        ${previewHTML}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                            Cerrar
                        </button>
                        <button class="btn btn-primary" onclick="window.printTicket(window.lastPrintedTicket); this.closest('.modal').remove();">
                            <i class="fas fa-print"></i> Imprimir
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    /**
     * Panel de configuración de impresión
     */
    window.showPrintSettings = function () {
        const config = window.printConfig;

        const modal = document.createElement('div');
        modal.className = 'modal fade show';
        modal.style.display = 'block';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">⚙️ Configuración de Impresión</h5>
                        <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
                    </div>
                    <div class="modal-body">
                        <form id="printSettingsForm">
                            <div class="mb-3">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="printEnabled" 
                                           ${config.enabled ? 'checked' : ''}>
                                    <label class="form-check-label" for="printEnabled">
                                        Impresión habilitada
                                    </label>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="autoPrintEnabled" 
                                           ${config.autoPrint ? 'checked' : ''}>
                                    <label class="form-check-label" for="autoPrintEnabled">
                                        Imprimir automáticamente después del cobro
                                    </label>
                                </div>
                            </div>
                            
                            <hr>
                            
                            <h6>Información del Negocio</h6>
                            
                            <div class="mb-3">
                                <label class="form-label">Nombre del negocio</label>
                                <input type="text" class="form-control" id="businessName" 
                                       value="${config.businessInfo.name || ''}">
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Dirección</label>
                                <input type="text" class="form-control" id="businessAddress" 
                                       value="${config.businessInfo.address || ''}">
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Teléfono</label>
                                <input type="text" class="form-control" id="businessPhone" 
                                       value="${config.businessInfo.phone || ''}">
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">NIF/CIF</label>
                                <input type="text" class="form-control" id="businessNIF" 
                                       value="${config.businessInfo.nif || ''}">
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" id="businessEmail" 
                                       value="${config.businessInfo.email || ''}">
                            </div>
                            
                            <hr>
                            
                            <h6>Formato del Ticket</h6>
                            
                            <div class="mb-3">
                                <label class="form-label">Ancho del papel</label>
                                <select class="form-control" id="paperWidth">
                                    <option value="58mm" ${config.paperWidth === '58mm' ? 'selected' : ''}>58mm</option>
                                    <option value="80mm" ${config.paperWidth === '80mm' ? 'selected' : ''}>80mm (Estándar)</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Tamaño de fuente</label>
                                <select class="form-control" id="printFontSize">
                                    <option value="10px" ${config.fontSize === '10px' ? 'selected' : ''}>Pequeña</option>
                                    <option value="12px" ${config.fontSize === '12px' ? 'selected' : ''}>Normal</option>
                                    <option value="14px" ${config.fontSize === '14px' ? 'selected' : ''}>Grande</option>
                                </select>
                            </div>
                        </form>
                    </div>
                  <div class="modal-footer">
    <button class="btn btn-info" onclick="window.reprintLastTicket()">
        🔄 Reimprimir Último Ticket
    </button>
    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
        Cancelar
    </button>
                        <button class="btn btn-primary" onclick="window.savePrintSettings(this)">
                            Guardar Configuración
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    /**
      * Guardar configuración de impresión
      */
    window.savePrintSettings = function (button) {
        const modal = button.closest('.modal');

        // Guardar configuración
        localStorage.setItem('printEnabled', document.getElementById('printEnabled').checked);
        localStorage.setItem('autoPrintEnabled', document.getElementById('autoPrintEnabled').checked);
        localStorage.setItem('businessName', document.getElementById('businessName').value);
        localStorage.setItem('businessAddress', document.getElementById('businessAddress').value);
        localStorage.setItem('businessPhone', document.getElementById('businessPhone').value);
        localStorage.setItem('businessNIF', document.getElementById('businessNIF').value);
        localStorage.setItem('businessEmail', document.getElementById('businessEmail').value);
        localStorage.setItem('paperWidth', document.getElementById('paperWidth').value);
        localStorage.setItem('printFontSize', document.getElementById('printFontSize').value);

        // Actualizar configuración en memoria
        window.printConfig = {
            enabled: document.getElementById('printEnabled').checked,
            autoPrint: document.getElementById('autoPrintEnabled').checked,
            paperWidth: document.getElementById('paperWidth').value,
            fontSize: document.getElementById('printFontSize').value,
            businessInfo: {
                name: document.getElementById('businessName').value,
                address: document.getElementById('businessAddress').value,
                phone: document.getElementById('businessPhone').value,
                nif: document.getElementById('businessNIF').value,
                email: document.getElementById('businessEmail').value
            }
        };

        if (window.mostrarNotificacion) {
            window.mostrarNotificacion('Configuración guardada correctamente', 'success');
        }

        modal.remove();
    };

    /**
   * Inicialización del módulo
   */
    window.initPrintingModule = function () {
        console.log('📄 Módulo de impresión inicializado');

        // Buscar el panel de administración y agregar botón
        setTimeout(() => {
            const configTab = document.getElementById('configuracion'); // <-- CAMBIAR AQUÍ
            if (configTab && !document.getElementById('printSettingsBtn')) {
                // Buscar dónde colocar el botón
                let targetContainer = configTab.querySelector('.config-buttons, .form-group, .mb-3');

                if (!targetContainer) {
                    // Si no hay contenedor, crear uno
                    targetContainer = document.createElement('div');
                    targetContainer.className = 'mb-3';
                    targetContainer.style.marginTop = '20px';
                    configTab.insertBefore(targetContainer, configTab.firstChild);
                }

                // Crear botón de configuración
                const printButton = document.createElement('button');
                printButton.id = 'printSettingsBtn';
                printButton.className = 'btn btn-info me-2';
                printButton.innerHTML = '🖨️ Configuración de Impresión';
                printButton.onclick = window.showPrintSettings;

                // Si el contenedor tiene otros botones, agregarlo al lado
                if (targetContainer.tagName === 'DIV') {
                    targetContainer.appendChild(printButton);
                } else {
                    targetContainer.parentNode.insertBefore(printButton, targetContainer.nextSibling);
                }

                console.log('✅ Botón de configuración agregado en Configuración');
            }
        }, 500);

        // Re-inicializar cuando se navegue a Admin
        document.addEventListener('click', function (e) {
            if (e.target && (
                e.target.textContent === 'Configuración' ||
                e.target.textContent === 'configuracion' ||
                e.target.matches('[onclick*="configuracion"]')
            )) {
                setTimeout(() => {
                    window.initPrintingModule();
                }, 500);
            }
        }, { once: true });
    };

    // EJECUTAR UNA SOLA VEZ - con retraso para asegurar que el DOM esté listo
    setTimeout(function () {
        window.initPrintingModule();
    }, 2000);

})();