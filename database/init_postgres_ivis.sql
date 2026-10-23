-- ============================================================================
-- BASE DE DATOS IVI — ADAPTADA PARA POSTGRESQL & SUPABASE
-- Con Sistema de Aprobación de Usuarios (Opción B) y Políticas RLS
-- ============================================================================

-- 1. Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. TABLA DE USUARIOS Y AUTORIZACIÓN (Opción B: Solicitud + Aprobación)
-- ============================================================================
DROP TABLE IF EXISTS usuarios_autorizados CASCADE;
CREATE TABLE usuarios_autorizados (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(255),
    rol VARCHAR(50) DEFAULT 'vendedor',           -- 'admin', 'vendedor', 'operador'
    estado VARCHAR(20) DEFAULT 'pendiente',        -- 'pendiente', 'aprobado', 'rechazado'
    avatar_url TEXT,
    fecha_solicitud TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    fecha_aprobacion TIMESTAMPTZ,
    aprobado_por VARCHAR(255),
    notas TEXT
);

-- Índices para búsqueda rápida
CREATE INDEX idx_usuarios_email ON usuarios_autorizados(email);
CREATE INDEX idx_usuarios_estado ON usuarios_autorizados(estado);

-- Cargar usuarios iniciales de Ivi
INSERT INTO usuarios_autorizados (email, nombre, rol, estado, fecha_aprobacion) VALUES
('infodumper.au@gmail.com', 'Ignacio Vizoso', 'admin', 'aprobado', CURRENT_TIMESTAMP),
('ignacio.vizoso@gmail.com', 'Nacho', 'vendedor', 'aprobado', CURRENT_TIMESTAMP),
('perlanegracostaatlantica@gmail.com', 'Paola Estévez', 'admin', 'aprobado', CURRENT_TIMESTAMP);


-- ============================================================================
-- 3. TABLAS DE NEGOCIO (Migradas de MySQL ivis.sql)
-- ============================================================================

-- Proveedores
DROP TABLE IF EXISTS proveedores CASCADE;
CREATE TABLE proveedores (
    id_proveedor SERIAL PRIMARY KEY,
    nombre_comercial VARCHAR(100),
    cuit VARCHAR(20),
    contacto VARCHAR(100),
    telefono VARCHAR(50) DEFAULT '',
    email VARCHAR(255),
    direccion VARCHAR(255),
    estado BOOLEAN DEFAULT TRUE
);

INSERT INTO proveedores (id_proveedor, nombre_comercial, cuit, contacto, telefono, email, direccion, estado) VALUES
(1, 'Natura Cosméticos', '', 'María Gómez', '02235869878', 'pedidos@natura.com.ar', 'Avenida Colón 2134', TRUE),
(2, 'Monique Cosmética', '', 'Esteban López', '2235869878', 'ventas@monique.com', 'Av. Colon 2134', TRUE),
(3, 'AVON Argentina', '', 'Pepita Pérez', '225455812', 'contacto@avon.com', '', TRUE),
(4, 'L''Oréal Distribución', '', 'Carlos Rivas', '2234112233', 'info@loreal.com.ar', '', TRUE),
(5, 'Ignacio - Infodumper', '', 'Ignacio', '2235869878', 'ignacio@infodumper.net', '', TRUE);

-- Tablas en desuso de folletería/catálogo eliminadas para unificar el modelo
DROP TABLE IF EXISTS detalle_pedidos_catalogo, pedidos_catalogo, campanas_catalogo, campanas, cat_producto, proveedores_catalogo CASCADE;

-- Vendedores
DROP TABLE IF EXISTS vendedores CASCADE;
CREATE TABLE vendedores (
    id_vendedor SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    usuario VARCHAR(100)
);

INSERT INTO vendedores (id_vendedor, nombre, usuario) VALUES
(1, 'Ignacio Vizoso', 'admin'),
(2, 'Nacho', 'user'),
(3, 'Paola Estévez', 'admin');

-- Clientes
DROP TABLE IF EXISTS clientes CASCADE;
CREATE TABLE clientes (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(50),
    apellido VARCHAR(50),
    telefono VARCHAR(20),
    dni VARCHAR(15),
    fecha_nac DATE,
    acepta_promociones BOOLEAN DEFAULT FALSE,
    estado BOOLEAN DEFAULT TRUE,
    id_vendedor INT REFERENCES vendedores(id_vendedor)
);

INSERT INTO clientes (id_cliente, nombre, apellido, telefono, dni, fecha_nac, acepta_promociones, estado, id_vendedor) VALUES
(1, 'José Ignacio', 'Vizoso Martínez', '2235869878', '95003856', '2000-02-17', TRUE, TRUE, NULL),
(2, 'Paola Adriana', 'Estévez', '2233012095', '28642892', '2000-01-13', TRUE, FALSE, NULL),
(3, 'Mariana', 'Montenegro', '2235170307', '', '2000-05-09', TRUE, TRUE, NULL),
(4, 'Nachi', 'Vizoso', '2235359942', '', NULL, FALSE, FALSE, NULL),
(5, 'Juan', 'López', '2233012095', '', '2000-02-10', TRUE, TRUE, NULL),
(6, 'Pedro', 'Pérez', '2233012095', '', NULL, TRUE, TRUE, NULL),
(7, 'Manuel', 'González', '2233012095', '', '2000-02-04', TRUE, TRUE, NULL),
(8, 'María', 'Martínez', '2233012095', '', NULL, TRUE, TRUE, NULL),
(9, 'Pepita', 'Benítez', '2233012095', '', '2000-02-16', TRUE, TRUE, NULL),
(10, 'Paola', 'Sánchez', '2233012095', '', '2000-02-08', TRUE, TRUE, NULL),
(11, 'José', 'García', '2233012095', '', '2000-02-13', TRUE, TRUE, NULL),
(12, 'mariana', 'montenegro', '2233012095', '', '2000-05-09', TRUE, TRUE, NULL);

-- Productos
DROP TABLE IF EXISTS productos CASCADE;
CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    cod_producto VARCHAR(50),
    nombre_producto VARCHAR(255),
    id_proveedor INT REFERENCES proveedores(id_proveedor),
    descripcion VARCHAR(255),
    presentacion VARCHAR(50) DEFAULT '',
    precio NUMERIC(12, 2) DEFAULT 0.00,
    stock INT DEFAULT 0,
    familia_olfativa VARCHAR(255),
    stock_max INT DEFAULT 0,
    marca VARCHAR(100),
    publico VARCHAR(20),                          -- 'Masculino', 'Femenino', 'Unisex'
    fecha_modificacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    estado BOOLEAN DEFAULT TRUE,
    CONSTRAINT unique_prod_prov UNIQUE (cod_producto, id_proveedor)
);

INSERT INTO productos (id_producto, cod_producto, nombre_producto, id_proveedor, descripcion, presentacion, precio, stock, familia_olfativa, stock_max, marca, publico, fecha_modificacion, estado) VALUES
(1, '93617', 'Essencial exclusivo eau de parfum', 1, 'En una caja fea', '100', 71470.00, 2, 'Amaderado', 15, 'Natura', 'Masculino', '2026-02-11 22:30:26', TRUE),
(2, '171', 'Cherry', 2, 'Caja', '50', 15990.00, 9, 'Floral,Frutal', 10, 'Monique', 'Femenino', '2026-02-11 22:26:03', TRUE),
(3, 'NAT002', 'Humor Propio', 3, 'Humor Propio', '50', 17500.00, 2, 'Floral,Frutal,Intenso', 5, 'NATURA', 'Femenino', '2026-02-13 15:53:20', TRUE),
(4, 'NAT002', 'Natura Humor', 1, 'Está "Unisex" por probar...', '100', 1.00, 5, 'Floral', 5, 'NATURA', 'Unisex', '2026-02-11 23:26:37', TRUE);

-- Pedidos (Ventas)
DROP TABLE IF EXISTS pedidos CASCADE;
CREATE TABLE pedidos (
    id_pedido SERIAL PRIMARY KEY,
    id_vendedor INT REFERENCES vendedores(id_vendedor),
    id_cliente INT REFERENCES clientes(id_cliente),
    fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(12, 2) DEFAULT 0.00,
    estado VARCHAR(30) DEFAULT 'Activo'
);

INSERT INTO pedidos (id_pedido, id_vendedor, id_cliente, fecha, total, estado) VALUES
(1, 1, 1, '2026-02-10 00:27:47', 71470.00, 'Activo'),
(2, 1, 1, '2026-02-10 00:27:58', 142940.00, 'Activo'),
(3, 1, 1, '2026-02-10 00:28:13', 285880.00, 'Anulado'),
(4, 1, 1, '2026-02-10 00:34:54', 71470.00, 'Anulado'),
(5, 2, 2, '2026-02-11 01:08:39', 71470.00, 'Activo'),
(6, 2, 2, '2026-02-11 01:08:57', 71470.00, 'Activo'),
(7, 2, 2, '2026-02-11 01:11:54', 142940.00, 'Activo'),
(8, 1, 2, '2026-02-11 18:43:31', 71470.00, 'Activo'),
(9, 3, 2, '2026-02-11 20:51:17', 500290.00, 'Activo'),
(10, 1, 7, '2026-02-11 21:04:48', 17500.00, 'Activo'),
(11, 1, 7, '2026-02-11 21:05:08', 17500.00, 'Activo'),
(12, 1, 7, '2026-02-11 21:05:19', 17500.00, 'Activo'),
(13, 1, 5, '2026-02-11 21:06:11', 71470.00, 'Activo'),
(14, 1, 5, '2026-02-11 21:07:05', 17500.00, 'Activo'),
(15, 1, 5, '2026-02-11 21:07:14', 71470.00, 'Activo'),
(16, 1, 10, '2026-02-11 21:07:54', 71470.00, 'Activo'),
(17, 1, 10, '2026-02-11 21:08:02', 35000.00, 'Activo'),
(18, 1, 10, '2026-02-11 21:08:16', 71470.00, 'Activo'),
(19, 3, 2, '2026-02-13 15:53:20', 17500.00, 'Activo');

-- Detalle Pedidos
DROP TABLE IF EXISTS detalle_pedidos CASCADE;
CREATE TABLE detalle_pedidos (
    id_detalle SERIAL PRIMARY KEY,
    id_pedido INT REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    id_producto INT REFERENCES productos(id_producto),
    cantidad INT DEFAULT 1,
    precio_unitario NUMERIC(12, 2),
    codigo_producto VARCHAR(100)
);

INSERT INTO detalle_pedidos (id_detalle, id_pedido, id_producto, cantidad, precio_unitario, codigo_producto) VALUES
(1, 1, 1, 1, 71470.00, '93617100'),
(2, 2, 1, 2, 71470.00, '93617100'),
(3, 3, 1, 4, 71470.00, '93617100'),
(4, 4, 1, 1, 71470.00, '93617100'),
(5, 5, 1, 1, 71470.00, '93617100'),
(6, 6, 1, 1, 71470.00, '93617100'),
(7, 7, 1, 2, 71470.00, '93617100'),
(8, 8, 1, 1, 71470.00, '93617100'),
(9, 9, 1, 7, 71470.00, 'NAT'),
(10, 10, 3, 1, 17500.00, 'NAT00250'),
(11, 11, 3, 1, 17500.00, 'NAT00250'),
(12, 12, 3, 1, 17500.00, 'NAT00250'),
(13, 13, 1, 1, 71470.00, '93617100'),
(14, 14, 3, 1, 17500.00, 'NAT00250'),
(15, 15, 1, 1, 71470.00, '93617100'),
(16, 16, 1, 1, 71470.00, '93617100'),
(17, 17, 3, 2, 17500.00, 'NAT00250'),
(18, 18, 1, 1, 71470.00, '93617100'),
(19, 19, 3, 1, 17500.00, 'NAT002');



-- Contactos WhatsApp
DROP TABLE IF EXISTS contactos_whatsapp CASCADE;
CREATE TABLE contactos_whatsapp (
    id_contacto_wa SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL,                    -- 'oferta_cumple', 'saludo_cumple', 'habitual'
    fecha_contacto TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO contactos_whatsapp (id_contacto_wa, cliente_id, tipo, fecha_contacto) VALUES
(5, 1, 'oferta_cumple', '2026-02-10 21:30:29'),
(11, 1, 'habitual', '2026-02-17 13:20:45'),
(10, 2, 'habitual', '2026-02-17 13:20:43');

-- Auditoría Transaccional Unificada
DROP TABLE IF EXISTS log_cambios_clientes, log_cambios_productos, auditoria CASCADE;
CREATE TABLE auditoria (
    id_auditoria SERIAL PRIMARY KEY,
    tabla VARCHAR(50) NOT NULL,                    -- 'clientes', 'productos', 'pedidos', etc.
    id_registro INT,
    accion VARCHAR(50) NOT NULL,                   -- 'ALTA', 'MODIFICACION', 'BAJA'
    usuario VARCHAR(100),
    fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    datos_anteriores JSONB,
    datos_nuevos JSONB
);

CREATE INDEX idx_auditoria_tabla ON auditoria(tabla);
CREATE INDEX idx_auditoria_fecha ON auditoria(fecha);


-- ============================================================================
-- 4. VISTA INTEGRADA DE PEDIDOS (Segura con RLS: security_invoker = true)
-- ============================================================================
CREATE OR REPLACE VIEW vista_pedidos_detallados
WITH (security_invoker = true) AS
SELECT 
    p.id_pedido,
    p.estado,
    v.nombre AS vendedor,
    TRIM(COALESCE(c.nombre, '') || ' ' || COALESCE(c.apellido, '')) AS cliente,
    p.fecha,
    p.total AS total_pedido,
    prod.cod_producto AS codigo,
    prod.descripcion AS descripcion,
    dp.cantidad,
    dp.precio_unitario
FROM pedidos p
LEFT JOIN vendedores v ON p.id_vendedor = v.id_vendedor
LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
LEFT JOIN detalle_pedidos dp ON p.id_pedido = dp.id_pedido
LEFT JOIN productos prod ON dp.id_producto = prod.id_producto
ORDER BY p.id_pedido DESC;


-- ============================================================================
-- 5. REAJUSTE DE SECUENCIAS (Para evitar colisiones al insertar nuevos registros)
-- ============================================================================
SELECT setval('usuarios_autorizados_id_seq', (SELECT COALESCE(MAX(id), 1) FROM usuarios_autorizados));
SELECT setval('proveedores_id_proveedor_seq', (SELECT COALESCE(MAX(id_proveedor), 1) FROM proveedores));
SELECT setval('vendedores_id_vendedor_seq', (SELECT COALESCE(MAX(id_vendedor), 1) FROM vendedores));
SELECT setval('clientes_id_cliente_seq', (SELECT COALESCE(MAX(id_cliente), 1) FROM clientes));
SELECT setval('productos_id_producto_seq', (SELECT COALESCE(MAX(id_producto), 1) FROM productos));
SELECT setval('pedidos_id_pedido_seq', (SELECT COALESCE(MAX(id_pedido), 1) FROM pedidos));
SELECT setval('detalle_pedidos_id_detalle_seq', (SELECT COALESCE(MAX(id_detalle), 1) FROM detalle_pedidos));
SELECT setval('contactos_whatsapp_id_contacto_wa_seq', (SELECT COALESCE(MAX(id_contacto_wa), 1) FROM contactos_whatsapp));
SELECT setval('auditoria_id_auditoria_seq', (SELECT COALESCE(MAX(id_auditoria), 1) FROM auditoria));


-- ============================================================================
-- 6. SEGURIDAD: POLÍTICAS RLS (Row Level Security) - Opción B
-- ============================================================================

-- Habilitar RLS en las tablas del negocio
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;

-- Función de ayuda: Verifica si el usuario actual autenticado está APROBADO
-- (Funciona tanto local con rol de sesión como en Supabase con auth.jwt())
CREATE OR REPLACE FUNCTION es_usuario_aprobado()
RETURNS BOOLEAN AS $$
DECLARE
    v_email TEXT;
    v_estado TEXT;
BEGIN
    -- En Supabase: auth.jwt() ->> 'email'
    -- En Postgres local: current_setting('request.jwt.claim.email', true) o variable de sesión
    v_email := NULLIF(current_setting('app.current_user_email', true), '');
    
    -- Fallback para Supabase si existe auth.jwt()
    IF v_email IS NULL THEN
        BEGIN
            v_email := auth.jwt()->>'email';
        EXCEPTION WHEN OTHERS THEN
            v_email := NULL;
        END;
    END IF;

    -- Si no hay contexto de usuario, por seguridad en modo RLS se deniega
    IF v_email IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT estado INTO v_estado
    FROM usuarios_autorizados
    WHERE LOWER(email) = LOWER(v_email);

    RETURN (v_estado = 'aprobado');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas de Acceso: Solo usuarios con estado 'aprobado' pueden leer y escribir
CREATE POLICY "Acceso clientes solo aprobados" ON clientes
    FOR ALL USING (es_usuario_aprobado());

CREATE POLICY "Acceso productos solo aprobados" ON productos
    FOR ALL USING (es_usuario_aprobado());

CREATE POLICY "Acceso pedidos solo aprobados" ON pedidos
    FOR ALL USING (es_usuario_aprobado());

CREATE POLICY "Acceso detalle_pedidos solo aprobados" ON detalle_pedidos
    FOR ALL USING (es_usuario_aprobado());

CREATE POLICY "Acceso proveedores solo aprobados" ON proveedores
    FOR ALL USING (es_usuario_aprobado());
