# Sector: Stock & Almacenes

> Directiva asociada: [`/directives/build_stock.md`](/directives/build_stock.md)  
> Skills de sector: `inventory_tracker` · `stock_replenishment` · `catalog_auditor`

---

## Propósito del Sector

Garantizar el control integral de existencias, seguimiento de movimientos en el libro Kardex, control de stock mínimo/punto de reorden y auditoría física vs lógica de almacenes del **Sistema de Gestión Ivi**.

## Estructura del Sector

```text
stock/
├── README.md       # Documentación funcional y operacional del sector
├── index.html      # Tablero de inventario, existencias y movimientos
└── stock.js        # Lógica de Kardex, saldos y alertas de reorden
```

## Movimientos Soportados

- `ENT_COM`: Entrada por compra a proveedor
- `SAL_VEN`: Salida por venta facturada
- `AJU_POS`: Ajuste positivo (sobrante auditado)
- `AJU_NEG`: Ajuste negativo (merma o daño)
- `TRA_DEP`: Transferencia entre depósitos
