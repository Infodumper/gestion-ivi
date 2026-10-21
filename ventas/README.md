# Sector: Ventas y Facturación

> Directiva asociada: [`/directives/build_ventas.md`](/directives/build_ventas.md)  
> Skills de sector: `sales_manager` · `pricing_calculator` · `checkout_validator`

---

## Propósito del Sector

Este sector centraliza la emisión de presupuestos, órdenes de compra, control de cobranzas y facturación comercial del **Sistema de Gestión Ivi**.

## Estructura del Sector

```text
ventas/
├── README.md       # Documentación funcional y operacional del sector
├── index.html      # Tablero operativo y punto de venta (POS / Órdenes)
└── ventas.js       # Control de estado de pedidos, validaciones y cálculos
```

## Convenciones y Flujos

1. **Estados del Pedido**:
   - `COT` (Cotización)
   - `PEN` (Pendiente de pago)
   - `PAG` (Pagado)
   - `ENT` (Entregado)
   - `CAN` (Cancelado)
2. **Consumo de Estilos**:
   Utiliza la jerarquía de `/styles/styles.css` con el acento azul corporativo de Ventas (`--color-sector-ventas`).
