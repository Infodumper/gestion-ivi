/**
 * Sistema de Gestión Ivi — Sector CRM
 * Basado en directives/build_crm.md y skills de CRM.
 */

const CRMState = {
  clientes: JSON.parse(localStorage.getItem('ivi_clientes_data') || '[]')
};

const formatCurrency = (val) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(val);
};

const getEtapaBadge = (etapa) => {
  switch (etapa) {
    case "PROS": return '<span class="badge badge-neutral">Prospecto</span>';
    case "CONT": return '<span class="badge badge-info">Contactado</span>';
    case "CALI": return '<span class="badge badge-warning">Calificado</span>';
    case "PROP": return '<span class="badge badge-info">Propuesta</span>';
    case "GANA": return '<span class="badge badge-success">Cliente Activo</span>';
    case "PERD": return '<span class="badge badge-danger">Perdido</span>';
    default: return `<span class="badge badge-neutral">${etapa}</span>`;
  }
};

const getHealthBadge = (salud) => {
  switch (salud) {
    case "SALUDABLE": return '<span class="badge badge-success">🟢 Saludable</span>';
    case "OBSERVACION": return '<span class="badge badge-warning">🟡 En Observación</span>';
    case "RIESGO": return '<span class="badge badge-danger">🔴 En Riesgo Churn</span>';
    default: return "";
  }
};

const renderCRM = () => {
  const container = document.getElementById("crmList");
  if (!container) return;

  if (!CRMState.clientes || CRMState.clientes.length === 0) {
    container.innerHTML = `
      <div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">👥</div>
        <p style="font-size: 1rem; font-weight: 500; margin: 0 0 0.25rem 0;">No hay clientes ni prospectos registrados</p>
        <p style="font-size: 0.85rem; margin: 0;">Los nuevos clientes sincronizados desde Supabase aparecerán aquí automáticamente.</p>
      </div>
    `;
    actualizarMetricasCRM();
    return;
  }

  container.innerHTML = CRMState.clientes.map(c => `
      <div class="chapita-lead">
        <div class="chapita-avatar" style="background-color: var(--color-sector-crm-bg); color: var(--color-sector-crm);">
          ${c.nombre.substring(0, 2).toUpperCase()}
        </div>
        <div class="chapita-content">
          <div class="chapita-title">${c.nombre} <span class="text-xs text-muted">(${c.rubro})</span></div>
          <div class="chapita-meta">
            <span>👤 ${c.contacto}</span>
            <span>•</span>
            <span>📞 ${c.telefono}</span>
            <span>•</span>
            <span>Última vez: ${c.ultimaInteraccion}</span>
          </div>
        </div>
      </div>
      <div class="chapita-trail">
        <div style="text-align: right;">
          <div class="text-xs font-semibold" style="color: var(--color-sector-crm);">Lead Score: ${c.score}/100</div>
          <div style="display: flex; gap: 4px; justify-content: flex-end; margin-top: 4px;">
            ${getEtapaBadge(c.etapa)}
            ${getHealthBadge(c.salud)}
          </div>
        </div>
      </div>
    </div>
  `).join("");

  actualizarMetricasCRM();
};

const actualizarMetricasCRM = () => {
  const totalClientes = CRMState.clientes.length;
  const activos = CRMState.clientes.filter(c => c.etapa === "GANA").length;
  const enRiesgo = CRMState.clientes.filter(c => c.salud === "RIESGO").length;

  const elTotal = document.getElementById("metricTotalClientes");
  const elActivos = document.getElementById("metricActivos");
  const elRiesgo = document.getElementById("metricEnRiesgo");

  if (elTotal) elTotal.innerText = totalClientes;
  if (elActivos) elActivos.innerText = activos;
  if (elRiesgo) elRiesgo.innerText = enRiesgo;
};

window.verFicha360 = (id) => {
  const c = CRMState.clientes.find(cli => cli.id === id);
  if (!c) return;
  alert(`👤 Ficha 360° — [${c.id}]\nCliente: ${c.nombre}\nContacto: ${c.contacto} (${c.email})\nRubro: ${c.rubro}\nEtapa: ${c.etapa} | Lead Score: ${c.score}/100\nEstado de Retención: ${c.salud}\nLTV Acumulado: ${formatCurrency(c.ltv)}`);
};

window.abrirModalNuevoProspecto = () => {
  const nombre = prompt("Razón Social o Nombre del Prospecto:", "Comercializadora del Centro");
  if (!nombre) return;
  const contacto = prompt("Nombre del Contacto Principal:", "Esteban Morales");
  const rubro = prompt("Rubro / Industria:", "Ferretería & Construcción");

  const nuevo = {
    id: `CLI-00${CRMState.clientes.length + 1}`,
    nombre: nombre.trim(),
    contacto: contacto ? contacto.trim() : "Sin asignar",
    email: "contacto@empresa.com",
    telefono: "+54 11 5555-0100",
    etapa: "PROS",
    score: 60,
    salud: "SALUDABLE",
    ltv: 0.00,
    ultimaInteraccion: new Date().toLocaleDateString("es-AR"),
    rubro: rubro ? rubro.trim() : "General"
  };

  CRMState.clientes.unshift(nuevo);
  renderCRM();
};

document.addEventListener("DOMContentLoaded", () => {
  renderCRM();
});
