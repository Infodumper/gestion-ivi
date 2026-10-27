# Registro de Memoria y Decisiones Arquitectónicas (Engram)
# Sistema de Gestión Ivi

> **Protocolo:** Este archivo actúa como bitácora permanente (Engram Ledger) de decisiones de diseño, correcciones de seguridad, contratos de datos y evolución del sistema, conforme al apartado 6 de [`/AGENTS.md`](/AGENTS.md).

---

## [ENGRAM-20261025-001] Blindaje de Seguridad, Supabase Auth Real, Políticas RLS y Gobernanza de Datos Sensibles

- **Fecha:** 25 de Octubre de 2026
- **Sector Afectado:** Capa 4 (Seguridad y Persistencia) + Capa 3 (UI Login & Auth Guard)
- **Estado:** Implementado, Validado y Desplegado en Netlify / Supabase Cloud
- **Autor / Responsable:** Ignacio Vizoso / Agente Orquestador

---

### 1. Contexto y Diagnóstico de Vulnerabilidad

Al preparar el sistema para su despliegue público en Netlify con backend en Supabase Cloud (`bhdvktbxirouocywkkvc.supabase.co`), se detectaron tres riesgos críticos de seguridad y privacidad:

1. **Autenticación Incompleta en Cliente:**
   - La pantalla [`/login.html`](/login.html) realizaba un matching simple del campo `email` contra la tabla `usuarios_autorizados`, omitiendo la verificación criptográfica de contraseñas. Cualquier usuario que conociera un correo administrativo (`infodumper.au@gmail.com`) podía ingresar al sistema.
2. **Políticas RLS Abiertas en Base de Datos:**
   - La base de datos contaba con políticas temporales `FOR ALL USING (true)`, exponiendo las tablas (`clientes`, `productos`, `pedidos`) a cualquier petición realizada con la `anonKey` pública.
3. **Persistencia de Sesión Frágil:**
   - La protección de rutas en `index.html`, `ventas/`, `crm/` y `stock/` dependía exclusivamente del objeto `localStorage.getItem('ivi_session_user')`, sin validación de token JWT activo contra el servidor.
4. **Exposición de Datos Personales (PII) en Git:**
   - La carpeta `/database/` contenía scripts SQL con datos reales de clientes migrados de IviS (nombres, teléfonos particulares, números de DNI, domicilios y correos).

---

### 2. Decisiones Arquitectónicas Implementadas (ADR)

#### ADR-1: Adopción de Supabase Auth (JWT + bcrypt)
- Se descartó el acceso por coincidencia de texto plano.
- Se implementó el flujo oficial con `window.IviSupabase.signIn(email, password)` y `window.IviSupabase.signUp(email, password, nombre)`.
- Las contraseñas se almacenan y autentican de forma segura en `auth.users` utilizando hash bcrypt nativo de PostgreSQL / GoTrue.

#### ADR-2: Modelo Híbrido de Control de Acceso (Opción B)
- **Separación de Identidad y Autorización:**
  - `auth.users` gestiona la autenticación (email + contraseña válida).
  - `public.usuarios_autorizados` gobierna los permisos de negocio (`rol`: `'admin'` | `'vendedor'`, `estado`: `'pendiente'` | `'aprobado'` | `'rechazado'`).
- **Trigger de Sincronización Automática:**
  - Se configuró el trigger `on_auth_user_created` en PostgreSQL para que todo nuevo registro en `auth.users` genere automáticamente su fila correspondiente en `public.usuarios_autorizados` en estado `'pendiente'`.
- Si un usuario tiene contraseña válida pero su estado es `'pendiente'` o `'rechazado'`, el conector revoca la sesión de inmediato con `signOut()` y bloquea el acceso en la interfaz.

#### ADR-3: Blindaje de Base de Datos con Row Level Security (RLS)
- Se crearon dos funciones deterministas con `SECURITY DEFINER` e inspección de claims JWT:
  ```sql
  public.es_usuario_aprobado() -> BOOLEAN (Verifica auth.jwt()->>'email' con estado = 'aprobado')
  public.es_admin()            -> BOOLEAN (Verifica auth.jwt()->>'email' con estado = 'aprobado' y rol = 'admin')
  ```
- Se aplicaron políticas estrictas en las 9 tablas maestras:
  - Tablas operativas (`clientes`, `productos`, `pedidos`, `detalle_pedidos`, `proveedores`, `vendedores`, `contactos_whatsapp`, `auditoria`): solo accesibles `TO authenticated USING (es_usuario_aprobado())`.
  - Tabla `usuarios_autorizados`: lectura permitida únicamente al propio usuario (`LOWER(email) = LOWER(auth.jwt()->>'email')`) o a usuarios con rol `admin`. La modificación de roles y aprobaciones queda restringida exclusivamente a `es_admin()`.

#### ADR-4: Guardián de Ruta en Tiempo Real (`requireAuth`)
- Se implementó `window.IviSupabase.requireAuth()` en los 4 módulos del sistema ([`index.html`](/index.html), [`ventas/index.html`](/ventas/index.html), [`stock/index.html`](/stock/index.html), [`crm/index.html`](/crm/index.html)).
- En cada carga de página, se verifica asíncronamente con Supabase si la sesión JWT sigue activa y si el usuario continúa aprobado en la base de datos. Ante revocaciones, la sesión local se purga y el operador es redirigido a `/login.html`.

#### ADR-5: Protocolo Seguro de Limpieza de Datos (`TRUNCATE`)
- Se documentó la regla inquebrantable de **NUNCA ejecutar TRUNCATE sobre `usuarios_autorizados` ni `vendedores`**.
- Para vaciar datos operativos de prueba sin violar claves foráneas:
  ```sql
  TRUNCATE TABLE detalle_pedidos, pedidos, contactos_whatsapp, auditoria RESTART IDENTITY CASCADE;
  ```

#### ADR-6: Política de Datos Sensibles en Entornos Públicos
- En Netlify: el archivo [`.netlifyignore`](/.netlifyignore) ya previene la publicación de `/database` y archivos `*.sql`.
- En Git: los scripts de base de datos con datos personales (PII) deben ser desindexados o sanitizados con placeholders (`ejemplo@correo.com`, DNI ficticio) para cumplir con normativas de protección de datos.

---

### 3. Inventario de Archivos Modificados

| Archivo | Modificación |
|---|---|
| [`/js/supabase-client.js`](/js/supabase-client.js) | Implementación de `signIn`, `signUp`, `signOut`, `getSession`, `requireAuth` y `resetPassword`. |
| [`/login.html`](/login.html) | Nueva interfaz con pestañas "Iniciar Sesión" y "Solicitar Acceso", feedback en tiempo real y recuperación. |
| [`/index.html`](/index.html) | Guardián reactivo `requireAuth` y cierre de sesión seguro sincronizado con Supabase. |
| [`/ventas/index.html`](/ventas/index.html) | Guardián reactivo `requireAuth` y cierre de sesión seguro. |
| [`/stock/index.html`](/stock/index.html) | Guardián reactivo `requireAuth` y cierre de sesión seguro. |
| [`/crm/index.html`](/crm/index.html) | Guardián reactivo `requireAuth` y cierre de sesión seguro. |
| [`/database/secure_auth_setup.sql`](/database/secure_auth_setup.sql) | DDL maestro de RLS, funciones `es_usuario_aprobado()`, `es_admin()` y trigger `on_auth_user_created`. |
| [`/database/supabase_setup.sql`](/database/supabase_setup.sql) | Sincronización del script maestro con las políticas RLS blindadas. |
| [`/ENGRAM.md`](/ENGRAM.md) | Creación de este registro de decisiones arquitectónicas. |

---

### 4. Checklist de Validación Operativa

- [x] Contraseñas cifradas mediante Supabase Auth.
- [x] Solicitudes de nuevos usuarios entran en estado `pendiente`.
- [x] Usuarios con estado `pendiente` o `rechazado` no pueden ver ni consultar datos.
- [x] Peticiones anónimas o sin token JWT son bloqueadas por RLS a nivel motor PostgreSQL.
- [x] Cierre de sesión revoca tokens activos tanto en Supabase como en `localStorage`.
- [x] Código sincronizado y publicado en Netlify a través de GitHub branch `main`.

---

## [ENGRAM-20261026-002] Erradicación de Datos Mock y Sincronización Real con Supabase Cloud

- **Fecha:** 26 de Octubre de 2026
- **Sector Afectado:** Capa 4 (Persistencia Supabase Cloud) + Capa 3 (Ventas, Stock, CRM)
- **Estado:** Implementado, Validado y Listo para Despliegue en Netlify
- **Autor / Responsable:** Ignacio Vizoso / Agente Orquestador

### 1. Diagnóstico
En la aplicación desplegada se visualizaban clientes y pedidos de prueba (*Distribuidora San Martín S.A.*, *Florencia Gómez*, *Extracto Puro 100ml*, *VTA-2026-0101*, etc.) debido a:
1. Arrays de fallback con datos mock hardcodeados que se guardaban en el `localStorage` del cliente.
2. Clientes y Pedidos nunca se consultaban a la API de Supabase en las vistas de Ventas y CRM.
3. El módulo Stock inicializaba productos mock si no existía caché previa.

### 2. Decisiones Arquitectónicas (ADR)
1. **Purga Automática de Caché Mock:** Implementación de `purgeMockCache()` en `js/supabase-client.js`, que detecta y elimina cualquier clave local heredada con datos falsos.
2. **Sincronización Total de Negocio con Supabase:**
   - `getClientes()` y `saveCliente()`: Sincronización bidireccional de clientes con PostgreSQL.
   - `getPedidos()`, `savePedido()` y `updateEstadoPedido()`: Sincronización de pedidos y detalle de líneas con la base de datos cloud.
   - `getProductos()` y `actualizarStockProducto()`: Consulta y baja de stock en tiempo real.
3. **Cero Datos Falsos en Fallback:** Se inicializan todas las entidades como `[]` en `index.html`, `ventas/index.html`, `stock/index.html` y `crm/index.html`.

---

## [ENGRAM-20261026-003] Protocolo de Estado Cero para Producción y Preservación de Accesos

- **Fecha:** 26 de Octubre de 2026
- **Sector Afectado:** Capa 1 (Directivas) + Capa 4 (Persistencia & Reset) + Capa 3 (UI Empty States)
- **Estado:** Implementado y Listo para Ejecución en Supabase SQL Editor
- **Autor / Responsable:** Ignacio Vizoso / Agente Orquestador

### 1. Requerimiento
El usuario solicita iniciar el sistema en producción sin ningún cliente, pedido, producto ni contacto cargado ("Estado Cero"), garantizando que la única tabla conservada sea `usuarios_autorizados` (control de acceso y roles).

### 2. Decisiones Arquitectónicas (ADR)
1. **Script de Vaciado Operativo Atómico (`database/reset_datos_operativos.sql`):**
   - Ejecuta `TRUNCATE TABLE detalle_pedidos, pedidos, contactos_whatsapp, auditoria, productos, proveedores, clientes RESTART IDENTITY CASCADE`.
   - Reinicia todas las secuencias a `1` para que las nuevas ventas y registros comiencen desde el primer ID.
   - Preserva `usuarios_autorizados` y la asignación comercial de `vendedores`.
2. **Erradicación de Fallbacks Residuales:**
   - Limpieza de `js/modals.js` (eliminados arrays de prueba de clientes y proveedores).
   - Limpieza de `ventas/index.html` (eliminado array residual de proveedores mock).
   - Ajuste de sincronización para que listas vacías `[]` desde Supabase sobreescriban limpiamente el almacenamiento local.
3. **Diseño de Estados Vacíos Intuitivos (Empty States):**
   - En Ventas, Directorio de Clientes, Stock y CRM se incorporaron tarjetas informativas con botones de llamada a la acción ("+ Nueva Venta", "+ Nuevo Cliente", "+ Nuevo Producto") para una experiencia visual limpia y profesional.


