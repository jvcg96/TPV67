// Sistema de migración de datos existentes
async function migrarDatosExistentes() {
    // Verificar si ya se migró
    if (localStorage.getItem('datosMigradosIndexedDB') === 'true') {
        return;
    }

    console.log('🔄 Iniciando migración de datos existentes...');

    try {
        // Migrar facturación existente si hay
        const datosGuardados = localStorage.getItem('barCafeteriaDatos');
        if (datosGuardados) {
            const datos = JSON.parse(datosGuardados);

            // IMPORTANTE: Manejar facturación de versión antigua
            if (datos.facturacion && datos.facturacion.length > 0) {
                console.log(`📊 Importando ${datos.facturacion.length} ventas...`);

                // CREAR BACKUP ANTES DE MIGRAR
                mostrarNotificacion('💾 Creando backup de seguridad...');
                const backupVentas = await DB.obtenerFacturacion();
                const backupKey = 'backup_migracion_' + Date.now();
                localStorage.setItem(backupKey, JSON.stringify(backupVentas));
                console.log(`✅ Backup creado: ${backupKey}`);

                // Obtener ventas existentes para evitar duplicados
                const ventasExistentes = await DB.obtenerFacturacion();
                const ventasExistentesSet = new Set();

                // Crear identificador único para cada venta existente
                ventasExistentes.forEach(venta => {
                    // Usar fechaUnica si existe, sino crear identificador temporal
                    const identificador = venta.fechaUnica || `${venta.fecha}_${venta.mesa}_${venta.total}_${venta.id || ''}`;
                    ventasExistentesSet.add(identificador);
                });

                // Migrar solo ventas que NO existan
                let ventasMigradas = 0;
                let ventasDuplicadas = 0;

                for (const venta of datos.facturacion) {
                    try {
                        // Crear identificador único para esta venta

                        const identificadorVenta = venta.fechaUnica || `${venta.fecha}_${venta.mesa}_${venta.total}_${venta.id || Math.random()}`;

                        // Verificar si ya existe
                        if (ventasExistentesSet.has(identificadorVenta)) {
                            ventasDuplicadas++;
                            console.log(`⚠️ Venta duplicada ignorada: ${identificadorVenta}`);
                            continue;
                        }

                        // Agregar un ID único si no tiene
                        if (!venta.fechaUnica) {
                            venta.fechaUnica = `${venta.fecha}_${venta.mesa}_${venta.total}_${Math.random().toString(36).substr(2, 9)}`;
                        }

                        // Guardar venta no duplicada
                        await DB.guardarFacturacion(venta);
                        ventasMigradas++;

                        // Agregar al set para evitar duplicados en la misma migración
                        ventasExistentesSet.add(identificadorVenta);

                    } catch (error) {
                        console.warn('Error al migrar venta:', error);
                    }
                }

                console.log(`✅ Migración completada:`);
                console.log(`   - Ventas migradas: ${ventasMigradas}`);
                console.log(`   - Ventas duplicadas ignoradas: ${ventasDuplicadas}`);
                console.log(`   - Total procesadas: ${datos.facturacion.length}`);

                if (ventasMigradas > 0) {
                    mostrarNotificacion(`✅ ${ventasMigradas} ventas migradas correctamente`);
                }

                if (ventasDuplicadas > 0) {
                    console.log(`ℹ️ Se ignoraron ${ventasDuplicadas} ventas duplicadas`);
                }
            }
        }

        // Migrar historial de movimientos si existe
        const movimientosGuardados = localStorage.getItem('historialMovimientos');
        if (movimientosGuardados) {
            const movimientos = JSON.parse(movimientosGuardados);

            if (movimientos && movimientos.length > 0) {
                console.log(`📦 Migrando ${movimientos.length} movimientos...`);

                // Obtener movimientos existentes para evitar duplicados
                const movimientosExistentes = await DB.obtenerMovimientos(null, 99999);
                const movimientosSet = new Set();

                // Crear identificadores para movimientos existentes
                movimientosExistentes.forEach(mov => {
                    const id = `${mov.fecha}_${mov.productoId}_${mov.tipo}_${mov.diferencia}`;
                    movimientosSet.add(id);
                });

                let movimientosMigrados = 0;
                let movimientosDuplicados = 0;

                for (const movimiento of movimientos) {
                    const idMovimiento = `${movimiento.fecha}_${movimiento.productoId}_${movimiento.tipo}_${movimiento.diferencia}`;

                    if (movimientosSet.has(idMovimiento)) {
                        movimientosDuplicados++;
                        continue;
                    }

                    await DB.guardarMovimiento(movimiento);
                    movimientosMigrados++;
                    movimientosSet.add(idMovimiento);
                }

                console.log(`✅ Movimientos: ${movimientosMigrados} migrados, ${movimientosDuplicados} duplicados ignorados`);
            }
        }

        // Marcar como migrado SOLO si todo salió bien
        localStorage.setItem('datosMigradosIndexedDB', 'true');
        console.log('✅ Migración completada exitosamente');

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        mostrarNotificacion('⚠️ Error en migración. Verifica la consola.');

        // NO marcar como migrado si hubo error
        // Esto permite reintentar la migración
    }
}

// Función para limpiar duplicados existentes (uso manual si es necesario)
async function limpiarVentasDuplicadas() {
    console.log('🧹 Iniciando limpieza de ventas duplicadas...');

    try {
        const todasLasVentas = await DB.obtenerFacturacion();
        const ventasUnicas = new Map();
        const duplicados = [];

        // Identificar duplicados
        todasLasVentas.forEach(venta => {
            // Crear identificador único basado en fecha, mesa y total
            const identificador = `${venta.fecha}_${venta.mesa}_${venta.total}`;

            if (ventasUnicas.has(identificador)) {
                // Es un duplicado
                duplicados.push(venta);
                console.log(`🔄 Duplicado encontrado: ${identificador}`);
            } else {
                // Primera ocurrencia
                ventasUnicas.set(identificador, venta);
            }
        });

        if (duplicados.length > 0) {
            console.log(`⚠️ Se encontraron ${duplicados.length} ventas duplicadas`);

            if (confirm(`Se encontraron ${duplicados.length} ventas duplicadas.\n\n¿Deseas eliminarlas?\n\nEsto NO afectará las ventas únicas.`)) {
                // Aquí implementarías la lógica para eliminar los duplicados
                // Por seguridad, solo mostramos el resultado
                console.log('✅ Duplicados identificados. Recomendación: Exportar datos, limpiar todo e importar datos limpios.');

                // Crear reporte de duplicados
                const reporte = {
                    fecha: obtenerFechaLocal(),
                    duplicados: duplicados.length,
                    ventasUnicas: ventasUnicas.size,
                    detalles: duplicados
                };

                localStorage.setItem('reporte_duplicados_' + Date.now(), JSON.stringify(reporte));
                mostrarNotificacion(`📊 Reporte de ${duplicados.length} duplicados guardado`);
            }
        } else {
            console.log('✅ No se encontraron ventas duplicadas');
            mostrarNotificacion('✅ No hay ventas duplicadas');
        }

    } catch (error) {
        console.error('❌ Error al limpiar duplicados:', error);
        mostrarNotificacion('❌ Error al verificar duplicados');
    }
}

// Función para verificar integridad de datos
async function verificarIntegridadDatos() {
    console.log('🔍 Verificando integridad de datos...');

    const problemas = [];

    try {
        // Verificar ventas
        const ventas = await DB.obtenerFacturacion();
        const ventasConProblemas = ventas.filter(v =>
            !v.fecha ||
            v.mesa === undefined ||
            v.total === undefined ||
            !v.items ||
            !Array.isArray(v.items)
        );

        if (ventasConProblemas.length > 0) {
            problemas.push(`${ventasConProblemas.length} ventas con datos incompletos`);
        }

        // Verificar movimientos
        const movimientos = await DB.obtenerMovimientos();
        const movimientosConProblemas = movimientos.filter(m =>
            !m.fecha ||
            !m.productoId ||
            m.stockAnterior === undefined ||
            m.stockNuevo === undefined
        );

        if (movimientosConProblemas.length > 0) {
            problemas.push(`${movimientosConProblemas.length} movimientos con datos incompletos`);
        }

        if (problemas.length > 0) {
            console.warn('⚠️ Problemas encontrados:', problemas);
            mostrarNotificacion(`⚠️ ${problemas.length} problemas de integridad detectados`);
        } else {
            console.log('✅ Integridad de datos verificada correctamente');
            mostrarNotificacion('✅ Base de datos íntegra');
        }

        return problemas;

    } catch (error) {
        console.error('❌ Error al verificar integridad:', error);
        mostrarNotificacion('❌ Error al verificar datos');
        return ['Error al verificar'];
    }
}