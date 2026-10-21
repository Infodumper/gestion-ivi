/**
 * Sistema de Gestión Ivi — Sector Stock
 * Basado en directives/build_stock.md y skills de Stock.
 */

const StockState = {
  articulos: [
    {
      id: "PRD-001",
      sku: "SEN-MOD-01",
      nombre: "Sensor Térmico Modbus RS485",
      categoria: "Sensores & Automatización",
      almacen: "Depósito Central",
      stockActual: 42,
      puntoReorden: 15,
      costoUnitario: 28500.00,
      precioVenta: 45000.00
    },
    {
      id: "PRD-002",
      sku: "VALV-SOL-02",
      nombre: "Válvula Solenoide 24V 1/2 pulgada",
      categoria: "Válvulas & Neumática",
      almacen: "Depósito Central",
      stockActual: 6,
      puntoReorden: 10,
      costoUnitario: 14200.00,
      precioVenta: 22800.00
    },
    {
      id: "PRD-003",
      sku: "PLC-IO-08",
      nombre: "Módulo Expansión PLC 8 I/O Digital",
      categoria: "Controladores",
      almacen: "Almacén Sucursal Sur",
      stockActual: 0,
      puntoReorden: 5,
      costoUnitario: 89000.00,
      precioVenta: 135000.00
    },
    {
      id: "PRD-004",
      sku: "CAB-APAT-04",
      nombre: "Cable Apatallado Par Trenzado 100m",
      categoria: "Conectividad & Cables",
      almacen: "Depósito Central",
      stockActual: 75,
      puntoReorden: 20,
      costoUnitario: 18000.00,
      precioVenta: 31000.00
    }
  ],
  filtroStock: "TODOS"
};

const formatCurrency = (val) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(val);
};

const getStockBadge = (actual, reorden) => {
  if (actual === 0) {
    return '<span class="badge badge-danger">🔴 Quiebre de Stock</span>';
  } else if (actual <= reorden) {
    return '<span class="badge badge-warning">🟡 Reposición Necesaria</span>';
  } else {
    return '<span class="badge badge-success">🟢 Óptimo</span>';
  }
};

const renderStock = () => {
  const container = document.getElementById("stockList");
  if (!container) return;

  const filtered = StockState.filtroStock === "TODOS"
    ? StockState.articulos
    : StockState.articulos.filter(a => {
        if (StockState.filtroStock === "QUIEBRE") return a.stockActual === 0;
        if (StockState.filtroStock === "REORDEN") return a.stockActual > 0 && a.stockActual <= a.puntoReorden;
        if (StockState.filtroStock === "OPTIMO") return a.stockActual > a.puntoReorden;
        return true;
      });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
        No se encontraron artículos con el criterio seleccionado.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(a => `
    <div class="chapita" onclick="verKardexArticulo('${a.id}')">
      <div class="chapita-lead">
        <div class="chapita-avatar" style="background-color: var(--color-sector-stock-bg); color: var(--color-sector-stock);">
          📦
        </div>
        <div class="chapita-content">
          <div class="chapita-title">${a.nombre} <span class="text-xs text-muted">[SKU: ${a.sku}]</span></div>
          <div class="chapita-meta">
            <span>🏭 ${a.almacen}</span>
            <span>•</span>
            <span>📂 ${a.categoria}</span>
            <span>•</span>
            <span>P. Venta: ${formatCurrency(a.precioVenta)}</span>
          </div>
        </div>
      </div>
      <div class="chapita-trail">
        <div style="text-align: right;">
          <div class="chapita-value">${a.stockActual} u. disponibles</div>
          <div class="text-xs text-muted">Mín: ${a.puntoReorden} u.</div>
          <div style="margin-top: 4px;">${getStockBadge(a.stockActual, a.puntoReorden)}</div>
        </div>
      </div>
    </div>
  `).join("");

  actualizarMetricasStock();
};

const actualizarMetricasStock = () => {
  const totalArticulos = StockState.articulos.length;
  const quiebres = StockState.articulos.filter(a => a.stockActual === 0).length;
  const reposicion = StockState.articulos.filter(a => a.stockActual > 0 && a.stockActual <= a.puntoReorden).length;
  const valorizacion = StockState.articulos.reduce((acc, a) => acc + (a.stockActual * a.costoUnitario), 0);

  const elTotal = document.getElementById("metricTotalArticulos");
  const elQuiebres = document.getElementById("metricQuiebres");
  const elReposicion = document.getElementById("metricReposicion");
  const elVal = document.getElementById("metricValorizacion");

  if (elTotal) elTotal.innerText = totalArticulos;
  if (elQuiebres) elQuiebres.innerText = quiebres;
  if (elReposicion) elReposicion.innerText = reposicion;
  if (elVal) elVal.innerText = formatCurrency(valorizacion);
};

window.filtrarStock = (tipo, btn) => {
  StockState.filtroStock = tipo;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderStock();
};

window.verKardexArticulo = (id) => {
  const art = StockState.articulos.find(a => a.id === id);
  if (!art) return;
  alert(`📦 Ficha Kardex [${art.sku}]\nArtículo: ${art.nombre}\nAlmacén: ${art.almacen}\nStock Actual: ${art.stockActual} u.\nPunto Reorden: ${art.puntoReorden} u.\nCosto Unitario: ${formatCurrency(art.costoUnitario)}\nPrecio de Venta: ${formatCurrency(art.precioVenta)}`);
};

window.abrirModalAjusteStock = () => {
  const sku = prompt("SKU o Nombre del artículo a registrar:", "SEN-MOD-01");
  if (!sku) return;
  const cantidad = prompt("Cantidad a ingresar (+ entradas, - salidas):", "10");
  if (!cantidad || isNaN(cantidad)) return;

  const cantNum = parseInt(cantidad);
  const art = StockState.articulos.find(a => a.sku.toLowerCase() === sku.toLowerCase()) || StockState.articulos[0];
  
  if (art) {
    if (art.stockActual + cantNum < 0) {
      alert("⚠️ Error: No se puede registrar stock negativo sin autorización.");
      return;
    }
    art.stockActual += cantNum;
    alert(`✅ Movimiento asentado en Kardex. Nuevo stock de ${art.sku}: ${art.stockActual} u.`);
    renderStock();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  renderStock();
});
