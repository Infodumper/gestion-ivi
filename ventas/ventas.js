/**
 * Sistema de Gestión Ivi — Sector Ventas
 * Basado en directives/build_ventas.md y skills de ventas.
 */

const VentasState = {
  pedidos: JSON.parse(localStorage.getItem('ivi_pedidos') || '[]'),
  filtroActual: "TODOS"
};

const formatCurrency = (val) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2
  }).format(val);
};

const getBadgeForStatus = (estado) => {
  switch (estado) {
    case "COT":
      return '<span class="badge badge-neutral">Cotización</span>';
    case "PEN":
      return '<span class="badge badge-warning">Pendiente</span>';
    case "PAG":
      return '<span class="badge badge-info">Pagado</span>';
    case "ENT":
      return '<span class="badge badge-success">Entregado</span>';
    case "CAN":
      return '<span class="badge badge-danger">Cancelado</span>';
    default:
      return `<span class="badge badge-neutral">${estado}</span>`;
  }
};

const renderPedidos = () => {
  const container = document.getElementById("pedidosList");
  if (!container) return;

  const filtered = VentasState.filtroActual === "TODOS"
    ? VentasState.pedidos
    : VentasState.pedidos.filter(p => p.estado === VentasState.filtroActual);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
        No se encontraron ventas registradas con el filtro seleccionado.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => `
    <div class="chapita" onclick="verDetallePedido('${p.id}')">
      <div class="chapita-lead">
        <div class="chapita-avatar" style="background-color: var(--color-sector-ventas-bg); color: var(--color-sector-ventas);">
          VT
        </div>
        <div class="chapita-content">
          <div class="chapita-title">${p.cliente} <span class="text-xs text-muted">(${p.id})</span></div>
          <div class="chapita-meta">
            <span>📅 ${p.fecha}</span>
            <span>•</span>
            <span>📦 ${p.items} ítems</span>
            <span>•</span>
            <span>💳 ${p.metodo}</span>
          </div>
        </div>
      </div>
      <div class="chapita-trail">
        <div>
          <div class="chapita-value">${formatCurrency(p.total)}</div>
          <div style="text-align: right; margin-top: 4px;">${getBadgeForStatus(p.estado)}</div>
        </div>
      </div>
    </div>
  `).join("");

  actualizarMetricas();
};

const actualizarMetricas = () => {
  const totalFacturado = VentasState.pedidos
    .filter(p => p.estado === "PAG" || p.estado === "ENT")
    .reduce((acc, p) => acc + p.total, 0);

  const pendientes = VentasState.pedidos.filter(p => p.estado === "PEN").length;
  const cotizaciones = VentasState.pedidos.filter(p => p.estado === "COT").length;

  const elTotal = document.getElementById("metricFacturado");
  const elPendientes = document.getElementById("metricPendientes");
  const elCotizaciones = document.getElementById("metricCotizaciones");

  if (elTotal) elTotal.innerText = formatCurrency(totalFacturado);
  if (elPendientes) elPendientes.innerText = pendientes;
  if (elCotizaciones) elCotizaciones.innerText = cotizaciones;
};

window.filtrarPorEstado = (estado, btn) => {
  VentasState.filtroActual = estado;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderPedidos();
};

window.verDetallePedido = (id) => {
  const pedido = VentasState.pedidos.find(p => p.id === id);
  if (!pedido) return;
  alert(`📋 Detalle de Venta [${pedido.id}]\nCliente: ${pedido.cliente}\nTotal: ${formatCurrency(pedido.total)}\nEstado: ${pedido.estado}\nMétodo: ${pedido.metodo}\nVendedor: ${pedido.vendedor}`);
};

window.abrirModalNuevaVenta = () => {
  const cliente = prompt("Ingrese Nombre / Razón Social del Cliente:", "Fábrica Argentina de Plásticos");
  if (!cliente) return;
  const monto = prompt("Ingrese Monto Total Bruto ($):", "150000");
  if (!monto || isNaN(monto)) return;

  const nuevo = {
    id: `VTA-2026-0${105 + VentasState.pedidos.length}`,
    cliente: cliente.trim(),
    cuit: "30-99887766-5",
    fecha: new Date().toLocaleDateString("es-AR"),
    estado: "PEN",
    items: 2,
    total: parseFloat(monto),
    metodo: "Transferencia",
    vendedor: "Martín López"
  };

  VentasState.pedidos.unshift(nuevo);
  renderPedidos();
};

document.addEventListener("DOMContentLoaded", () => {
  renderPedidos();
});
