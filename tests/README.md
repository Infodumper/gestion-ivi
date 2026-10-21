# Suite de Pruebas Automatizadas de Regresión — Sistema de Gestión Ivi

Este directorio contiene las herramientas y pruebas automatizadas destinadas a asegurar que ninguna modificación posterior rompa las directivas de negocio, estándares de UI ni la experiencia de usuario establecida antes de publicar a **producción**.

---

## 1. Acceso y Ejecución de Pruebas

Para correr la suite de pruebas completa en el navegador:
1. Con el servidor local activo (Apache/XAMPP):
   - Navegar a: `http://localhost/ivi/tests/index.html`
2. Las pruebas se ejecutan automáticamente al cargar la página y presentan un reporte en tiempo real de:
   - Total de pruebas ejecutadas.
   - Cantidad de pruebas pasadas (`PASÓ`) y falladas (`FALLÓ`).
   - Tiempo de ejecución en milisegundos.
   - Insignia de autorización para producción (`✓ SUITE APROBADA — LISTO PARA PRODUCCIÓN`).

---

## 2. Cobertura de Directivas Auditadas

La suite valida de forma rigurosa los requerimientos estipulados en [`/directives/build_ventas.md`](/directives/build_ventas.md) y [`/directives/build_system.md`](/directives/build_system.md):

| Suite | Directiva Auditada | Criterio de Aceptación |
|---|---|---|
| **Suite 1** | Directiva 6.1: Búsqueda Predictiva | • Cliente: no despliega con < 3 letras; filtra con >= 3 letras.<br>• Descripción: no despliega con < 3 letras; filtra con >= 3 letras.<br>• Código: se activa con 1 carácter y muestra **únicamente el código** sin texto secundario. |
| **Suite 2** | Directiva 6.2: Navegación de Teclado | • `ArrowDown`: desplaza el foco secuencialmente y aplica `.active`.<br>• `ArrowUp`: cicla hacia arriba y salta al último elemento al llegar al tope.<br>• `Enter`: selecciona el elemento `.active` ejecutando su método de selección. |
| **Suite 3** | Directiva 6.3: Consolidación Duplicados | • Al introducir el mismo código o descripción dos veces, suma las cantidades y no genera líneas duplicadas. |
| **Suite 4** | Directiva 6.4: Cero Alerts Nativos | • Inspección de código: cero llamadas nativas a `alert()`, `confirm()` o `prompt()`.<br>• Presencia de `#toastContainer` y `#modalExitoVenta`. |
| **Suite 5** | Directiva 4: Liquidación y Precios | • Cálculo exacto de subtotal `(precio * cantidad)`.<br>• Formateo de moneda en pesos argentinos (`$ XX.XXX,XX ARS`). |

---

## 3. Checklist de Salida a Producción

Antes de fusionar código o subir a producción:
- [ ] Ejecutar `http://localhost/ivi/tests/index.html` y verificar que el 100% de las pruebas estén en estado verde (`✓ PASÓ`).
- [ ] Comprobar que no existan errores de consola (`F12 -> Console`).
- [ ] Realizar una prueba visual con `browser_subagent` verificando el modal de venta y el flujo de navegación con flechas.
