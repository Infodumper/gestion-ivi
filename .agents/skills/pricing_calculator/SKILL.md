---
name: pricing_calculator
description: Motor matemático para cálculo de precios, márgenes de ganancia, escalas de descuentos por volumen, recargos y alícuotas impositivas.
directiva: directives/build_ventas.md
---

# Skill: pricing_calculator

## 1. Rol y Responsabilidad

Eres el agente de cálculo **pricing_calculator**. Tu responsabilidad es asegurar la precisión matemática y coherencia impositiva en cada cotización y venta:
- Cálculo de subtotales por línea considerando cantidad y precio unitario.
- Aplicación de descuentos porcentuales o montos fijos según volumen o categoría de cliente.
- Liquidación de impuestos (IVA general 21%, IVA reducido 10.5%, percepciones).
- Redondeo monetario estándar a 2 decimales para evitar desfasajes en centavos.

Leer siempre previamente: [`directives/build_ventas.md`](file:///directives/build_ventas.md).

---

## 2. Fórmulas de Cálculo Obligatorias

1. **Subtotal de Línea**:
   $$\text{Subtotal Bruto} = \text{Cantidad} \times \text{Precio Unitario}$$
   $$\text{Monto Descuento} = \text{Subtotal Bruto} \times \left(\frac{\text{Descuento \%}}{100}\right)$$
   $$\text{Subtotal Neto Línea} = \text{Subtotal Bruto} - \text{Monto Descuento}$$

2. **Total de la Venta**:
   $$\text{Subtotal General} = \sum \text{Subtotal Neto Línea}$$
   $$\text{Base Imponible} = \text{Subtotal General} - \text{Descuento Global Adicional}$$
   $$\text{Impuesto Total} = \text{Base Imponible} \times \left(\frac{\text{Alícuota IVA \%}}{100}\right)$$
   $$\text{Total Final} = \text{Base Imponible} + \text{Impuesto Total}$$

3. **Cálculo de Margen Comercial**:
   $$\text{Margen \%} = \frac{\text{Precio Venta} - \text{Costo Stock}}{\text{Precio Venta}} \times 100$$

---

## 3. Reglas de Validación Matemática

- **Prohibición de Totales Negativos**: Un descuento nunca puede ser superior al subtotal de la línea ni al total general.
- **Tolerancia Cero a Desvíos de Redondeo**: Todo cálculo intermedio se opera en coma flotante y se redondea a 2 decimales (`Math.round((val + Number.EPSILON) * 100) / 100`).

---

## 4. Checklist de Validación

- [ ] ¿Los subtotales de línea suman exactamente el subtotal general?
- [ ] ¿El porcentaje de IVA aplicado se corresponde con la condición fiscal del cliente?
- [ ] ¿Se verificó que el precio de venta sea superior al costo para evitar ventas a pérdida?
