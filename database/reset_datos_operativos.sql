-- ============================================================================
-- SISTEMA DE GESTIÓN IVI — RESET DE DATOS OPERATIVOS A ESTADO CERO
-- ============================================================================
-- Este script vacía todas las tablas de negocio operativas (clientes, ventas,
-- pedidos, catálogo de productos, proveedores y contactos de CRM) para
-- dejar el sistema 100% limpio y listo para el uso real de producción.
--
-- REGLA DE SEGURIDAD INQUEBRANTABLE:
-- PRESERVA INTACTA la tabla 'usuarios_autorizados' (credenciales y accesos)
-- y los registros de 'vendedores' vinculados al personal comercial.
-- ============================================================================

-- 1. Vaciar tablas de transacciones y negocio reiniciando secuencias de ID a 1
TRUNCATE TABLE 
    detalle_pedidos,
    pedidos,
    contactos_whatsapp,
    auditoria,
    productos,
    proveedores,
    clientes
RESTART IDENTITY CASCADE;

-- 2. Asegurar que las secuencias de autoincremento comiencen limpias en 1
ALTER SEQUENCE IF EXISTS detalle_pedidos_id_detalle_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS pedidos_id_pedido_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS contactos_whatsapp_id_contacto_wa_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS auditoria_id_auditoria_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS productos_id_producto_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS proveedores_id_proveedor_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS clientes_id_cliente_seq RESTART WITH 1;

-- 3. Verificación de integridad post-limpieza
-- 'usuarios_autorizados' debe conservar sus cuentas aprobadas.
-- El resto de tablas debe retornar exactamente 0.
SELECT 'usuarios_autorizados' AS tabla, count(*) AS total_registros FROM usuarios_autorizados
UNION ALL SELECT 'vendedores', count(*) FROM vendedores
UNION ALL SELECT 'clientes', count(*) FROM clientes
UNION ALL SELECT 'pedidos', count(*) FROM pedidos
UNION ALL SELECT 'detalle_pedidos', count(*) FROM detalle_pedidos
UNION ALL SELECT 'productos', count(*) FROM productos
UNION ALL SELECT 'proveedores', count(*) FROM proveedores
UNION ALL SELECT 'contactos_whatsapp', count(*) FROM contactos_whatsapp
UNION ALL SELECT 'auditoria', count(*) FROM auditoria;
