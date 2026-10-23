# Especificación y Guía de Base de Datos PostgreSQL — `ivi_db`

> **Estado:** Activo y Poblado en Local (PostgreSQL 18)  
> **Ubicación del Script Maestro:** [`/database/init_postgres_ivis.sql`](/database/init_postgres_ivis.sql)  
> **Fecha de Actualización:** Octubre 2026  

---

## 1. Parámetros de Conexión Local

> [!IMPORTANT]
> Las credenciales de acceso se gestionan de forma segura a través del archivo [`/.env`](/.env) (ignorado por Git). Consulte [`/.env.example`](/.env.example) para configurar un nuevo entorno.

| Parámetro | Variable en `.env` | Valor por Defecto / Local |
|---|---|---|
| **Motor** | `DB_ENGINE` | PostgreSQL 18.6 (x64) |
| **Host** | `DB_HOST` | `localhost` / `127.0.0.1` |
| **Puerto** | `DB_PORT` | `5432` |
| **Base de Datos** | `DB_NAME` | `ivi_db` |
| **Usuario Administrador** | `DB_USER` | `postgres` |
| **Contraseña Local** | `DB_PASSWORD` | *Definida en `.env`* |

---

## 2. Cómo visualizar y gestionar en pgAdmin 4

1. Abrir **pgAdmin 4**.
2. En el árbol de navegación izquierdo, desplegar:
   ```text
   Servers
   └── PostgreSQL 18
       └── Databases (Bases de datos)
   ```
3. Si `ivi_db` no aparece de inmediato, hacer clic derecho sobre **Databases** → **Refresh (Actualizar)**.
4. Desplegar la base de datos:
   ```text
   ivi_db
   └── Schemas (Esquemas)
       └── public
           ├── Tables (9 tablas)
           ├── Views (1 vista)
           └── Functions (1 función RLS)
   ```
5. Para ejecutar consultas interactivas:
   - Clic derecho sobre **`ivi_db`** → **Query Tool**.
   - Ejecutar la comprobación de integridad:
     ```sql
     SELECT current_database(), current_user, count(*) FROM clientes;
     ```

---

## 3. Inventario de Tablas y Datos Migrados (9 Tablas)

> **Nota de Arquitectura:** Se eliminaron las 6 tablas obsoletas de catálogo y se unificaron las tablas individuales de log en una única tabla centralizada de **`auditoria`** con clave primaria explícita `id_auditoria`, campo `tabla` y datos en JSONB.

| Tabla | Registros Iniciales | Estado en Sistema | Descripción y Responsabilidad de Negocio |
|---|:---:|:---:|---|
| **`usuarios_autorizados`** | 3 | **En Uso** | Control de acceso **Opción B** (Google OAuth y Email). Registra roles (`admin`, `vendedor`) y estados (`pendiente`, `aprobado`, `rechazado`). |
| **`clientes`** | 12 | **En Uso** | Maestro de clientes migrado de IviS. Incluye teléfonos, DNI, fechas de cumpleaños (`dia_nac`, `mes_nac`) y consentimiento de WhatsApp. |
| **`productos`** | 4 | **En Uso** | Catálogo maestro de artículos con precios de lista, stock actual y categoría. |
| **`pedidos`** | 19 | **En Uso** | Cabeceras de ventas históricas con fecha, ID de cliente, total facturado y estado comercial (`PAG`, `PEN`, `COT`, `CAN`). |
| **`detalle_pedidos`** | 19 | Conservada | Renglones/ítems de cada orden con referencia a producto, cantidad y precio unitario pactado. |
| **`proveedores`** | 4 | **En Uso** | Directorio de marcas, fabricantes y proveedores (Natura, Monique, AVON, etc.) con datos de contacto. |
| **`vendedores`** | 3 | Conservada | Personal comercial asignado a clientes y comisiones de venta. |
| **`contactos_whatsapp`** | 3 | Conservada / En Uso | Historial de interacciones y mensajes enviados a clientes (`id_contacto_wa`, `cliente_id`, `tipo`, `fecha_contacto`). Tipos de contacto: `oferta_cumple` (beneficio del mes de cumpleaños), `saludo_cumple` (felicitación en la fecha exacta) y `habitual` (fidelización a clientes recurrentes). |
| **`auditoria`** | 0 | Conservada (Unificada) | Registro central de auditoría transaccional para todas las entidades (`id_auditoria`, `tabla`, `id_registro`, `accion`, `usuario`, `datos_anteriores`, `datos_nuevos`). |

---

## 4. Vistas y Objetos de Negocio

### Vista: `vista_pedidos_detallados`
Combina cabecera y detalle en una sola consulta desnormalizada:
```sql
SELECT * FROM vista_pedidos_detallados LIMIT 10;
```
Retorna: `id_pedido`, `fecha`, `cliente` (Nombre + Apellido), `vendedor`, `producto`, `cantidad`, `precio_unitario`, `subtotal`.

---

## 5. Modelo de Seguridad RLS (Row Level Security)

La base `ivi_db` cuenta con la función de seguridad **`es_usuario_aprobado()`** configurada para operar en modo dual (Local y Supabase):

```sql
CREATE OR REPLACE FUNCTION es_usuario_aprobado()
RETURNS BOOLEAN AS $$
DECLARE
    v_email TEXT;
    v_estado TEXT;
BEGIN
    v_email := NULLIF(current_setting('app.current_user_email', true), '');
    IF v_email IS NULL THEN
        BEGIN
            v_email := auth.jwt()->>'email';
        EXCEPTION WHEN OTHERS THEN
            v_email := NULL;
        END;
    END IF;

    IF v_email IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT estado INTO v_estado
    FROM usuarios_autorizados
    WHERE LOWER(email) = LOWER(v_email);

    RETURN (v_estado = 'aprobado');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Tablas con RLS Habilitado:
- `clientes`
- `productos`
- `pedidos`
- `detalle_pedidos`
- `proveedores`

> [!NOTE]
> Cuando se suba a **Supabase**, el claim `auth.jwt()->>'email'` identificará de inmediato la cuenta de Google. Si el usuario está marcado como `pendiente`, la base deniega automáticamente la consulta a nivel motor.

---

## 6. Consultas SQL de Comprobación Rápida

### Conteo total por tabla (9 tablas)
```sql
SELECT 'usuarios_autorizados' AS tabla, count(*) FROM usuarios_autorizados
UNION ALL SELECT 'clientes', count(*) FROM clientes
UNION ALL SELECT 'productos', count(*) FROM productos
UNION ALL SELECT 'pedidos', count(*) FROM pedidos
UNION ALL SELECT 'detalle_pedidos', count(*) FROM detalle_pedidos
UNION ALL SELECT 'proveedores', count(*) FROM proveedores
UNION ALL SELECT 'vendedores', count(*) FROM vendedores
UNION ALL SELECT 'contactos_whatsapp', count(*) FROM contactos_whatsapp
UNION ALL SELECT 'auditoria', count(*) FROM auditoria;
```

### Listado de usuarios autorizados (Opción B)
```sql
SELECT id, email, nombre, rol, estado, fecha_solicitud 
FROM usuarios_autorizados 
ORDER BY id;
```

### Próximos cumpleaños de clientes (Sector CRM)
```sql
SELECT id_cliente, nombre, apellido, telefono, dia_nac, mes_nac
FROM clientes
WHERE dia_nac IS NOT NULL AND mes_nac IS NOT NULL
ORDER BY mes_nac, dia_nac;
```
