SET client_encoding = 'UTF8';
UPDATE proveedores SET nombre_comercial = 'Natura Cosméticos', contacto = 'María Gómez', email = 'pedidos@natura.com.ar' WHERE id_proveedor = 1;
UPDATE proveedores SET nombre_comercial = 'Monique Cosmética', contacto = 'Esteban López', email = 'ventas@monique.com' WHERE id_proveedor = 2;
UPDATE proveedores SET nombre_comercial = 'AVON Argentina', contacto = 'Pepita Pérez', email = 'contacto@avon.com' WHERE id_proveedor = 3;
UPDATE proveedores SET nombre_comercial = 'L''Oréal Distribución', contacto = 'Carlos Rivas', telefono = '2234112233', email = 'info@loreal.com.ar' WHERE id_proveedor = 4;
INSERT INTO proveedores (id_proveedor, nombre_comercial, cuit, contacto, telefono, email, direccion, estado)
VALUES (5, 'Ignacio - Infodumper', '', 'Ignacio', '2235869878', 'ignacio@infodumper.net', '', TRUE)
ON CONFLICT (id_proveedor) DO UPDATE 
SET nombre_comercial = EXCLUDED.nombre_comercial, contacto = EXCLUDED.contacto, telefono = EXCLUDED.telefono, email = EXCLUDED.email;
SELECT setval('proveedores_id_proveedor_seq', (SELECT MAX(id_proveedor) FROM proveedores));
