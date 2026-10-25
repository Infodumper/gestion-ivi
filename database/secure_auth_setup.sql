-- ============================================================================
-- SISTEMA DE GESTIÓN IVI — BLINDAJE Y AUTENTICACIÓN SEGURA SUPABASE AUTH
-- Ejecutar este script completo en el SQL Editor de Supabase (app.supabase.com)
-- ============================================================================

-- 1. EXTENSIÓN Y FUNCIONES DE SEGURIDAD RLS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Función 1: Verifica si el usuario autenticado tiene estado 'aprobado'
CREATE OR REPLACE FUNCTION public.es_usuario_aprobado()
RETURNS BOOLEAN AS $$
DECLARE
    v_email TEXT;
    v_estado TEXT;
BEGIN
    -- Extrae el correo verificado del token JWT firmado por Supabase Auth
    v_email := auth.jwt()->>'email';

    IF v_email IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT estado INTO v_estado
    FROM public.usuarios_autorizados
    WHERE LOWER(email) = LOWER(v_email);

    RETURN (v_estado = 'aprobado');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función 2: Verifica si el usuario autenticado es un 'admin' aprobado
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_email TEXT;
    v_rol TEXT;
    v_estado TEXT;
BEGIN
    v_email := auth.jwt()->>'email';

    IF v_email IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT rol, estado INTO v_rol, v_estado
    FROM public.usuarios_autorizados
    WHERE LOWER(email) = LOWER(v_email);

    RETURN (v_estado = 'aprobado' AND v_rol = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. TRIGGER AUTOMÁTICO: SINCRONIZACIÓN AL CREAR USUARIOS EN SUPABASE AUTH
-- ----------------------------------------------------------------------------
-- Cuando un usuario se registra o es creado en Authentication > Users,
-- este trigger lo inserta automáticamente en la tabla usuarios_autorizados.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios_autorizados (email, nombre, rol, estado, fecha_solicitud)
  VALUES (
    LOWER(NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    'vendedor',
    'pendiente',
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (email) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 3. HABILITACIÓN DE ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
-- ----------------------------------------------------------------------------
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contactos_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_autorizados ENABLE ROW LEVEL SECURITY;

-- 4. LIMPIEZA DE POLÍTICAS INSEGURAS PREVIAS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Permitir lectura y escritura anon en clientes" ON public.clientes;
DROP POLICY IF EXISTS "Permitir lectura y escritura anon en productos" ON public.productos;
DROP POLICY IF EXISTS "Permitir lectura y escritura anon en pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir lectura y escritura anon en detalle_pedidos" ON public.detalle_pedidos;
DROP POLICY IF EXISTS "Permitir lectura y escritura anon en proveedores" ON public.proveedores;
DROP POLICY IF EXISTS "Permitir lectura y escritura anon en contactos_whatsapp" ON public.contactos_whatsapp;
DROP POLICY IF EXISTS "Permitir lectura y escritura anon en usuarios_autorizados" ON public.usuarios_autorizados;

DROP POLICY IF EXISTS "Acceso clientes solo aprobados" ON public.clientes;
DROP POLICY IF EXISTS "Acceso productos solo aprobados" ON public.productos;
DROP POLICY IF EXISTS "Acceso pedidos solo aprobados" ON public.pedidos;
DROP POLICY IF EXISTS "Acceso detalle_pedidos solo aprobados" ON public.detalle_pedidos;
DROP POLICY IF EXISTS "Acceso proveedores solo aprobados" ON public.proveedores;
DROP POLICY IF EXISTS "Acceso vendedores solo aprobados" ON public.vendedores;
DROP POLICY IF EXISTS "Acceso contactos_whatsapp solo aprobados" ON public.contactos_whatsapp;
DROP POLICY IF EXISTS "Acceso auditoria solo aprobados" ON public.auditoria;

DROP POLICY IF EXISTS "Lectura de usuarios autorizados propio o admin" ON public.usuarios_autorizados;
DROP POLICY IF EXISTS "Gestion total de usuarios para administradores" ON public.usuarios_autorizados;
DROP POLICY IF EXISTS "Auto-registro inicial de usuario" ON public.usuarios_autorizados;

-- 5. POLÍTICAS RLS BLINDADAS (Solo usuarios con JWT y estado 'aprobado')
-- ----------------------------------------------------------------------------

-- Clientes
CREATE POLICY "Acceso clientes solo aprobados" ON public.clientes
    FOR ALL TO authenticated
    USING (public.es_usuario_aprobado())
    WITH CHECK (public.es_usuario_aprobado());

-- Productos
CREATE POLICY "Acceso productos solo aprobados" ON public.productos
    FOR ALL TO authenticated
    USING (public.es_usuario_aprobado())
    WITH CHECK (public.es_usuario_aprobado());

-- Pedidos (Ventas)
CREATE POLICY "Acceso pedidos solo aprobados" ON public.pedidos
    FOR ALL TO authenticated
    USING (public.es_usuario_aprobado())
    WITH CHECK (public.es_usuario_aprobado());

-- Detalle de Pedidos
CREATE POLICY "Acceso detalle_pedidos solo aprobados" ON public.detalle_pedidos
    FOR ALL TO authenticated
    USING (public.es_usuario_aprobado())
    WITH CHECK (public.es_usuario_aprobado());

-- Proveedores
CREATE POLICY "Acceso proveedores solo aprobados" ON public.proveedores
    FOR ALL TO authenticated
    USING (public.es_usuario_aprobado())
    WITH CHECK (public.es_usuario_aprobado());

-- Vendedores
CREATE POLICY "Acceso vendedores solo aprobados" ON public.vendedores
    FOR ALL TO authenticated
    USING (public.es_usuario_aprobado())
    WITH CHECK (public.es_usuario_aprobado());

-- Contactos WhatsApp
CREATE POLICY "Acceso contactos_whatsapp solo aprobados" ON public.contactos_whatsapp
    FOR ALL TO authenticated
    USING (public.es_usuario_aprobado())
    WITH CHECK (public.es_usuario_aprobado());

-- Auditoría
CREATE POLICY "Acceso auditoria solo aprobados" ON public.auditoria
    FOR ALL TO authenticated
    USING (public.es_usuario_aprobado())
    WITH CHECK (public.es_usuario_aprobado());

-- 6. POLÍTICAS PARA LA TABLA USUARIOS_AUTORIZADOS
-- ----------------------------------------------------------------------------
-- Cada usuario autenticado puede leer su propio registro (para saber su rol y si está aprobado)
-- O los administradores pueden leer todos los registros para gestionarlos
CREATE POLICY "Lectura de usuarios autorizados propio o admin" ON public.usuarios_autorizados
    FOR SELECT TO authenticated
    USING (LOWER(email) = LOWER(auth.jwt()->>'email') OR public.es_admin());

-- Solo los administradores pueden modificar roles o aprobar solicitudes
CREATE POLICY "Gestion total de usuarios para administradores" ON public.usuarios_autorizados
    FOR ALL TO authenticated
    USING (public.es_admin())
    WITH CHECK (public.es_admin());

-- Permitir a un nuevo usuario autenticado registrar su solicitud si no existiera
CREATE POLICY "Auto-registro inicial de usuario" ON public.usuarios_autorizados
    FOR INSERT TO authenticated
    WITH CHECK (LOWER(email) = LOWER(auth.jwt()->>'email'));

-- 7. REFRENDAR USUARIOS ADMINISTRADORES INICIALES
-- ----------------------------------------------------------------------------
INSERT INTO public.usuarios_autorizados (email, nombre, rol, estado, fecha_aprobacion) VALUES
('infodumper.au@gmail.com', 'Ignacio Vizoso', 'admin', 'aprobado', CURRENT_TIMESTAMP),
('perlanegracostaatlantica@gmail.com', 'Paola Estévez', 'admin', 'aprobado', CURRENT_TIMESTAMP)
ON CONFLICT (email) DO UPDATE 
SET rol = 'admin', estado = 'aprobado';
