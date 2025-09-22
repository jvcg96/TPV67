TPV Hostelería - Arquitectura Modular
Sistema de 26 módulos organizados en 4 capas:
🏗️ CORE (8 archivos) - Funcionalidades fundamentales

config.js: Variables globales (window.productos, window.mesasConfig, window.facturacion)
licenses.js: Gestión de licencias y hardware fingerprinting
migrations.js: Migración y limpieza de datos
data-management.js: Estadísticas, exports e imports
charts.js: Gráficos Chart.js para Pro/Premium
utils.js: Funciones utilitarias (fechas, formateo)
admin-panel.js: Panel de administración con clave
window-init.js: Inicialización principal del sistema

🔧 MODULES (12 archivos) - Lógica de negocio

users.js: CRUD usuarios, login, permisos
products.js: CRUD productos, stock, imágenes
categories.js: CRUD categorías de productos
areas.js: CRUD áreas del restaurante
tables.js: Lógica de mesas y productos por mesa
table-management.js: Configuración física de mesas
orders.js: Historial de pedidos y filtros
orders-extensions.js: Filtros avanzados de pedidos
billing.js: Sistema de cobro y cálculo de cambio
inventory.js: Control de stock, alertas, reabastecimiento
tpv-categories.js: Grid de productos del TPV con paginación
premium-features.js: Funciones exclusivas Pro/Premium

🎨 UI (4 archivos) - Interfaz de usuario

navigation.js: Función showTab() y navegación entre pestañas
notifications.js: Sistema de alertas visuales
modals.js: Gestión de ventanas modales
virtual-keyboard.js: Teclado táctil para móviles/tablets

🚀 INIT (2 archivos) - Inicialización

global-functions.js: Funciones window.* globales
initialization-hooks.js: Hooks finales de carga

Variables globales críticas:

window.mesasConfig - Configuración de mesas
window.productos - Array de productos
window.facturacion - Historial de ventas
usuarioActual - Usuario logueado
mesaActual - Mesa seleccionada

Para agregar funciones:

Productos → products.js
Mesas/TPV → tables.js o tpv-categories.js
Cobros → billing.js
UI/Navegación → navigation.js
Notificaciones → notifications.js
Stock → inventory.js

Orden de carga:

Core (config.js primero)
Modules
UI (navigation.js temprano para showTab)
Init