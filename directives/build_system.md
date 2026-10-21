# Directiva Técnica: Estándares Globales de Sistema y Diseño
> **Identificador:** `directives/build_system.md` · **Versión:** 1.0 · **Estado:** Activo
> **Aplica a:** Todo el ecosistema de gestión Ivi (Ventas, CRM, Stock, Infraestructura)

---

## 1. Misión Arquitectónica

Establecer las reglas de ingeniería, diseño de interfaces e integridad operativa para el **Sistema de Gestión Ivi**. Ningún desarrollo nuevo, refactorización o integración de agentes puede contradecir los preceptos de esta directiva.

---

## 2. Regla Inquebrantable 1:3 (Directivas y Skills)

Todo sector o módulo funcional dentro del ecosistema debe implementar:
1. **Una Directiva Rectora** en `/directives/` que defina el modelo de datos, los flujos de negocio y las restricciones operativas.
2. **Exactamente Tres Skills** especializadas:
   - **Skill Operativa / Gestor**: Conduce las acciones primarias del módulo (ej. registrar ventas, mover etapas, asentar stock).
   - **Skill Lógica / Calculador**: Ejecuta los algoritmos de pricing, scoring o reposición.
   - **Skill Validadora / Guardián**: Asegura la integridad transaccional, previene inconsistencias y audita cambios.

---

## 3. Modelo UI/UX "ADN Placas independientes"

El sistema adopta el estándar de interfaz estandarizado:
- **Chapas (Contenedores Maestros)**: Elementos estructurales con padding confortable, borde sutil (`var(--border-base)`), elevación suave y cabecera con acciones principales.
- **Chapitas (Elementos Atómicos de Lista)**: Bloques de datos clicables para cada registro (pedido, cliente, producto en stock) con avatar temático, metadatos claros y badge de estado.
- **Jerarquía Cromática y Paleta Sobria**:
  - Estilo visual sobrio: base en escala de grises modernos (`slate`/`zinc`) con acentos profesionales en azul (`#1d4ed8`, `#2563eb`) y verde esmeralda (`#10b981`, `#047857`). Se prohíben colores chillones o estéticas infantiles.
  - Ventas: Azul Royal / Marino (`var(--color-sector-ventas)`)
  - CRM: Púrpura / Violeta (`var(--color-sector-crm)`)
  - Stock: Esmeralda (`var(--color-sector-stock)`)
- **Iconografía Exclusiva Phosphor (Fill)**:
  - Todos los iconos del sistema provienen estrictamente de `C:\TGPN\phosphor-icons\PNGs\fill` (y su réplica local `/assets/icons/`).
  - No se permiten emojis como iconos principales ni librerías externas no homologadas.
- **Mobile First & Responsive**: En pantallas móviles (<992px), el sistema colapsa el sidebar y despliega una barra inferior fija (`.mobile-bottom-nav`) con accesos a Inicio, Ventas, CRM y Stock.

---

## 4. Integridad Transaccional y Reglas de Persistencia

1. **Atomicidad**: Si una transacción de ventas requiere descontar stock, ambas operaciones deben consolidarse bajo la misma unidad atómica. Si falla el descuento de stock, la venta debe cancelarse.
2. **Captura en Frío de Precios**: El precio de venta y costo unitario deben persistirse como una foto estática al momento de la transacción en el ítem de detalle, evitando recálculos con el precio actual del catálogo.
3. **Inmutabilidad de Estados Finales**: No se admiten transiciones retrógradas desde estados concluidos (ej. un pedido "Entregado" o "Cancelado" no puede revertirse a "Pendiente").
4. **Idempotencia en APIs y Operaciones**: Cualquier reintento de guardado debe estar protegido contra duplicidad mediante identificadores únicos o validación de tokens de envío.

---

## 5. Auditoría y Trazabilidad

Cada operación crítica debe registrar:
- Timestamp exacto (formato ISO 8601).
- Operador / ID de usuario o agente que ejecutó la acción.
- Estado previo y nuevo estado.
- Justificación en caso de ajustes manuales de stock o anulaciones de venta.

---

## 6. Estándar de Notificaciones y Feedback (Cero Diálogos Nativos)

1. **Prohibición Total de `alert()`, `confirm()` y `prompt()`**:
   - Bajo ninguna circunstancia se deben emplear ventanas emergentes nativas del navegador. Se consideran obsoletas, disruptivas e incompatibles con la experiencia de usuario corporativa.
2. **Notificaciones Efímeras (Toasts)**:
   - Para alertas, advertencias o avisos no bloqueantes, utilizar tarjetas toast flotantes (`.toast-card`) con desvanecimiento automático y botón de cierre.
3. **Modales de Confirmación y Comprobantes**:
   - Toda operación exitosa o destructiva debe presentarse mediante modales estilizados con la paleta sobria oficial, tipografía jerarquizada e iconografía Phosphor.

---

## 7. Protocolo de Pruebas de Regresión para Producción (`/tests/`)

Antes de autorizar y desplegar cualquier cambio al entorno productivo:
1. Se debe ejecutar la suite de pruebas automatizadas disponible en `/tests/` (`tests/index.html`).
2. La suite evalúa unitariamente e integralmente:
   - Umbrales de autocompletado (3 caracteres para Cliente/Descripción, 1 para Código).
   - Navegación vertical con flechas del teclado en desplegables y selección con Intro.
   - Detección y suma automática de ítems duplicados.
   - Comportamiento de cálculos matemáticos y formato de moneda ARS.
   - Cumplimiento de la regla de cero diálogos nativos.
3. Ningún release a producción es válido si presenta tests fallidos o advertencias de regresión.
