# Sistema de Gestión Ivi

Plataforma modular de gestión empresarial construida bajo el estándar de **Arquitectura de 4 Capas** y modelo de diseño **"ADN Placas independientes"**.

---

## Estructura del Repositorio

```text
c:/TGPN/Ivi/
├── AGENTS.md                  # Protocolos maestros de arquitectura y agentes
├── README.md                  # Documentación general del proyecto
├── MANUAL_USUARIO.md          # Manual del operador y usuario final
├── MANUAL_TECNICO.md          # Manual técnico de arquitectura e implementación
├── DATABASE.md                # Especificación del esquema PostgreSQL (ivi_db)
├── index.html                 # Tablero / Dashboard general integrador
│
├── directives/                # Capa 1: Directivas y reglas de negocio
│   ├── build_system.md        # Estándar técnico y de diseño
│   ├── build_ventas.md        # Directiva del sector Ventas
│   ├── build_crm.md           # Directiva del sector CRM
│   └── build_stock.md         # Directiva del sector Stock
│
├── .agents/skills/            # Capa 2: Skills para Antigravity IDE
│   ├── sales_manager/
│   ├── pricing_calculator/
│   ├── checkout_validator/
│   ├── customer_journey/
│   ├── lead_profiler/
│   ├── retention_guardian/
│   ├── inventory_tracker/
│   ├── stock_replenishment/
│   └── catalog_auditor/
│
├── skills/                    # Acceso directo a las 9 skills del sistema
│
├── styles/                    # Capa 3: Sistema visual unificado
│   ├── variables.css          # Tokens, paletas por sector y variables
│   ├── base.css               # Reset y tipografía
│   ├── layout.css             # Grid, sidebar, topbar y navegación móvil
│   ├── components.css         # Chapas, chapitas, botones, badges, tablas
│   └── styles.css             # Agregador maestro
│
├── ventas/                    # Sector Ventas & Facturación
│   ├── README.md
│   ├── index.html
│   └── ventas.js
│
├── crm/                       # Sector CRM & Clientes 360°
│   ├── README.md
│   ├── index.html
│   └── crm.js
│
└── stock/                     # Sector Stock & Almacenes
    ├── README.md
    ├── index.html
    └── stock.js
```

---

## Mapeo de Sectores y Skills (Regla 1:3)

1. **Ventas (`ventas/`)**:
   - Directiva: [`directives/build_ventas.md`](directives/build_ventas.md)
   - Skills: `sales_manager`, `pricing_calculator`, `checkout_validator`
2. **CRM (`crm/`)**:
   - Directiva: [`directives/build_crm.md`](directives/build_crm.md)
   - Skills: `customer_journey`, `lead_profiler`, `retention_guardian`
3. **Stock (`stock/`)**:
   - Directiva: [`directives/build_stock.md`](directives/build_stock.md)
   - Skills: `inventory_tracker`, `stock_replenishment`, `catalog_auditor`

---

## Uso Local

Para abrir el sistema localmente, abrir [`index.html`](index.html) en cualquier navegador web moderno o servir la carpeta mediante un servidor local (por ejemplo `npx serve .` o live-server).
