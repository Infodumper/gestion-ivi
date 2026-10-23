# Base de Datos `ivi_db` (PostgreSQL / Supabase)

La documentación completa de la base de datos se encuentra en:
👉 [**`/DATABASE.md`**](/DATABASE.md)

### Script Maestro de Inicialización
- [`/database/init_postgres_ivis.sql`](/database/init_postgres_ivis.sql): Contiene el DDL completo, datos migrados, secuencias sincronizadas y políticas RLS.

### Parámetros de Conexión
- **Motor:** PostgreSQL 18
- **Base de Datos:** `ivi_db`
- **Host / Puerto:** `localhost:5432`
- **Usuario:** `postgres`
- **Tablas:** 9 tablas activas consolidadas con auditoría unificada.
