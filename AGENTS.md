# Arquitectura y Estándares de Sistema – "Sistema de Gestión Ivi"

> Este documento contiene los protocolos técnicos, normativas de arquitectura y directrices de orquestación de agentes para el desarrollo y mantenimiento del **Sistema de Gestión Ivi**. Aplica a todo entorno de orquestación (Antigravity, Claude, Gemini, etc.).

---

## 1. Alcance Operativo

El **Sistema de Gestión Ivi** es una plataforma modular de administración empresarial concebida bajo arquitectura desacoplada, alta disponibilidad, consistencia transaccional e interfaces centradas en el usuario (móvil y escritorio).

El sistema organiza sus operaciones de negocio en sectores claramente delimitados:
1. **Ventas**: Gestión del ciclo comercial, órdenes de venta, cotizaciones, cobros y facturación.
2. **CRM**: Visión 360° del cliente, pipeline comercial, seguimiento de interacciones y retención.
3. **Stock**: Control de inventario multialmacén, movimientos (kardex), puntos de reposición y auditoría de catálogo.

---

## 2. Arquitectura de 4 Capas

El ecosistema sigue la metodología probada de cuatro capas operativas:

```mermaid
graph TD
    subgraph Capa 1: Directivas
        D1[build_system.md]
        D2[build_ventas.md]
        D3[build_crm.md]
        D4[build_stock.md]
    end

    subgraph Capa 2: Orquestación & Skills
        S1[Ventas: sales_manager / pricing_calculator / checkout_validator]
        S2[CRM: lead_profiler / customer_journey / retention_guardian]
        S3[Stock: inventory_tracker / stock_replenishment / catalog_auditor]
    end

    subgraph Capa 3: Ejecución & Sectores
        E1[ventas/]
        E2[crm/]
        E3[stock/]
        E4[styles/ y componentes UI]
    end

    subgraph Capa 4: Observabilidad & Auditoría
        O1[Logs transaccionales / Métricas de negocio / Telemetría]
    end

    Capa 1 --> Capa 2
    Capa 2 --> Capa 3
    Capa 3 --> Capa 4
```

### Capa 1: Gestión de Directivas (Reglas de Negocio)
- Almacenadas en `/directives/`.
- Cada sector de negocio cuenta con su directiva rectora (`build_ventas.md`, `build_crm.md`, `build_stock.md`) complementada por la directiva técnica global (`build_system.md`).
- Define contratos de datos, flujos de transición de estados y reglas inquebrantables.

### Capa 2: Orquestación (Skills de Agentes)
- Almacenadas en `.agents/skills/` (y vinculadas en `/skills/`).
- **Regla Estricta 1:3**: Cada directiva de sector se apoya en exactamente **3 Skills especializadas** (un Gestor Operativo, un Calculador/Analista Lógico, y un Guardián/Validador de Integridad).
- Cada skill posee su propio `SKILL.md` con frontmatter YAML, mandato, patrones de código y checklist de aprobación.

### Capa 3: Ejecución de Servicios y Sectores
- Código fuente distribuido en carpetas independientes para cada sector (`ventas/`, `crm/`, `stock/`).
- Capa visual estandarizada en `/styles/` con centralización de tokens (`variables.css`), reset (`base.css`), maquetación (`layout.css`) y componentes (`components.css`).

### Capa 4: Observabilidad y Auditoría
- Trazabilidad estricta de cambios de estado (e.g. pedidos facturados, ajustes manuales de stock, cambios de etapa en leads).
- Manejo determinista de errores con logs estructurados y retroalimentación clara al usuario.

---

## 3. Matriz de Sectores y Skills (Regla 1:3)

| Sector | Directiva Rectora | Skill 1 (Gestor Operativo) | Skill 2 (Lógica & Cálculo) | Skill 3 (Guardián & Validador) |
|---|---|---|---|---|
| **Ventas** | [`/directives/build_ventas.md`](/directives/build_ventas.md) | `sales_manager` | `pricing_calculator` | `checkout_validator` |
| **CRM** | [`/directives/build_crm.md`](/directives/build_crm.md) | `customer_journey` | `lead_profiler` | `retention_guardian` |
| **Stock** | [`/directives/build_stock.md`](/directives/build_stock.md) | `inventory_tracker` | `stock_replenishment` | `catalog_auditor` |

---

## 4. Estándares de Diseño y UI/UX ("ADN Placas independientes")

1. **Topología Visual**:
   - **Chapas (Contenedores Maestros)**: Secciones elevadas con fondo de superficie, bordes limpios y cabecera con acciones contextuales.
   - **Chapitas (Elementos de Lista / Tarjetas Atómicas)**: Registros individuales clicables con badge de estado, valores numéricos formateados y acciones rápidas.
2. **Filosofía Mobile-First**:
   - Navegación optimizada para pantallas táctiles y escritorios con sidebar colapsable y barra inferior de navegación en móviles.
   - Zonas táctiles amplias (mínimo 44x44px).
3. **Cero Estilos Inline**:
   - Todo estilo visual debe derivar exclusivamente de `/styles/` y sus variables maestras de diseño.
4. **Paleta y Tipografía**:
   - Paleta sobria y moderna (Slate / Indigo / Emerald / Amber / Rose).
   - Tipografía limpia del sistema (`system-ui`, `-apple-system`, `Segoe UI`, `Roboto`).
5. **Idioma**:
   - Textos de interfaz, mensajes de error, comentarios funcionales y directivas 100% en **español**. Código fuente y variables en nomenclatura descriptiva estándar.

---

## 5. Estructura de Directorios

```text
/
├── AGENTS.md                  # Especificación maestra de arquitectura y agentes
├── README.md                  # Resumen del proyecto y guía de inicio
├── index.html                 # Portal principal / Dashboard integrador
├── directives/                # Capa 1: Reglas de negocio y especificaciones
│   ├── build_system.md        # Estándar técnico y de diseño
│   ├── build_ventas.md        # Directiva del sector Ventas
│   ├── build_crm.md           # Directiva del sector CRM
│   └── build_stock.md         # Directiva del sector Stock
├── .agents/skills/            # Capa 2: Habilidades especializadas de agentes
│   ├── sales_manager/
│   ├── pricing_calculator/
│   ├── checkout_validator/
│   ├── customer_journey/
│   ├── lead_profiler/
│   ├── retention_guardian/
│   ├── inventory_tracker/
│   ├── stock_replenishment/
│   └── catalog_auditor/
├── skills/                    # Acceso directo a las skills del sistema
├── styles/                    # Capa 3: Sistema visual unificado
│   ├── variables.css          # Tokens, paleta, espaciado, tipografía
│   ├── base.css               # Reset y utilidades generales
│   ├── layout.css             # Estructuras de rejilla, sidebar, topbar, bottom nav
│   ├── components.css         # Chapas, chapitas, botones, badges, tablas, modales
│   └── styles.css             # Agregador maestro de estilos
├── ventas/                    # Sector Ventas: Pedidos, cotizaciones, cobros
│   ├── index.html
│   ├── ventas.js
│   └── README.md
├── crm/                       # Sector CRM: Leads, clientes 360°, embudo
│   ├── index.html
│   ├── crm.js
│   └── README.md
└── stock/                     # Sector Stock: Inventario, almacenes, movimientos
    ├── index.html
    ├── stock.js
    └── README.md
```

---

## 6. Procedimientos Obligatorios para Agentes

1. **Lectura Previa**: Antes de modificar o extender cualquier sector, el agente DEBE leer la directiva correspondiente en `directives/` y las skills asociadas.
2. **Preservación Modular**: Ningún archivo del sector `ventas/` debe tener dependencias acopladas de manera directa con archivos internos de `stock/` o `crm/` sin pasar por contratos definidos.
3. **Persistencia Transaccional**: Toda operación que involucre cabecera + detalle (ej. venta con ítems de stock) debe concebirse como atómica.
4. **Registro en Memoria (Engram)**: Conforme a las directrices de memoria, cada decisión arquitectónica, corrección o aprendizaje debe registrarse con `mem_save`.
