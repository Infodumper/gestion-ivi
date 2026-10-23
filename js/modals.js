/**
 * Sistema de Gestión Ivi — Controlador de Formularios Modales
 * Nuevo Cliente & Nuevo Proveedor (Estilo IviS / CliP26)
 */

const ModalManager = {
  // Inicialización de datos locales sincronizados con PostgreSQL
  clientes: JSON.parse(localStorage.getItem('ivi_clientes_data') || 'null') || [
    { id: 1, nombre: "José Ignacio", apellido: "Vizoso Martínez", telefono: "2235869878", dni: "95003856", dia_nac: 17, mes_nac: 2, promociones: true, estado: true },
    { id: 2, nombre: "Paola Adriana", apellido: "Estévez", telefono: "2233012095", dni: "28642892", dia_nac: 13, mes_nac: 1, promociones: true, estado: false },
    { id: 3, nombre: "Mariana", apellido: "Montenegro", telefono: "2235170307", dni: "", dia_nac: 9, mes_nac: 5, promociones: true, estado: true }
  ],
  proveedores: JSON.parse(localStorage.getItem('ivi_proveedores_data') || 'null') || [
    { id: 1, nombreComercial: "Natura", cuit: "30-70889900-1", contacto: "María Gómez", telefono: "02235869878", email: "pedidos@natura.com.ar", direccion: "Avenida Colón 2134", estado: true },
    { id: 2, nombreComercial: "Monique", cuit: "30-65443322-9", contacto: "Esteban López", telefono: "2235869878", email: "ventas@monique.com", direccion: "Av. Colón 2134", estado: true },
    { id: 3, nombreComercial: "AVON", cuit: "33-50112233-4", contacto: "Pepita Pérez", telefono: "225455812", email: "contacto@avon.com", direccion: "Calle 14 n° 880", estado: true }
  ],

  guardarEnStorage() {
    localStorage.setItem('ivi_clientes_data', JSON.stringify(this.clientes));
    localStorage.setItem('ivi_proveedores_data', JSON.stringify(this.proveedores));
  }
};

// ==========================================
// Modal Nuevo Cliente
// ==========================================
window.abrirModalNuevoCliente = function() {
  const modal = document.getElementById('modalNuevoCliente');
  if (modal) {
    modal.classList.add('is-active');
    const inputNombre = document.getElementById('clienteNombre');
    if (inputNombre) inputNombre.focus();
  }
};

window.cerrarModalNuevoCliente = function() {
  const modal = document.getElementById('modalNuevoCliente');
  if (modal) {
    modal.classList.remove('is-active');
    const form = document.getElementById('formNuevoCliente');
    if (form) form.reset();
  }
};

window.guardarNuevoCliente = function(e) {
  e.preventDefault();
  const form = e.target;
  const nuevoCliente = {
    id: ModalManager.clientes.length + 1,
    nombre: form.nombre.value.trim(),
    apellido: form.apellido.value.trim(),
    telefono: form.telefono.value.trim(),
    dni: form.dni.value.trim(),
    dia_nac: form.dia_nac.value ? parseInt(form.dia_nac.value) : null,
    mes_nac: form.mes_nac.value ? parseInt(form.mes_nac.value) : null,
    promociones: form.acepta_promociones.checked,
    estado: form.estado.checked
  };

  ModalManager.clientes.unshift(nuevoCliente);
  ModalManager.guardarEnStorage();

  alert(`✅ Cliente registrado con éxito:\n${nuevoCliente.nombre} ${nuevoCliente.apellido}\nTel: ${nuevoCliente.telefono || 'Sin teléfono'}`);
  cerrarModalNuevoCliente();

  // Si existe función de renderizado en la página, refrescar
  if (typeof renderClientesTable === 'function') {
    renderClientesTable();
  }
};

// ==========================================
// Modal Nuevo Proveedor
// ==========================================
window.abrirModalNuevoProveedor = function() {
  const modal = document.getElementById('modalNuevoProveedor');
  if (modal) {
    modal.classList.add('is-active');
    const inputNombre = document.getElementById('provNombreComercial');
    if (inputNombre) inputNombre.focus();
  }
};

window.cerrarModalNuevoProveedor = function() {
  const modal = document.getElementById('modalNuevoProveedor');
  if (modal) {
    modal.classList.remove('is-active');
    const form = document.getElementById('formNuevoProveedor');
    if (form) form.reset();
  }
};

window.guardarNuevoProveedor = function(e) {
  e.preventDefault();
  const form = e.target;
  const nuevoProveedor = {
    id: ModalManager.proveedores.length + 1,
    nombreComercial: form.nombre_comercial.value.trim(),
    cuit: form.cuit.value.trim(),
    contacto: form.contacto.value.trim(),
    telefono: form.telefono.value.trim(),
    email: form.email.value.trim(),
    direccion: form.direccion.value.trim(),
    estado: form.estado.checked
  };

  ModalManager.proveedores.unshift(nuevoProveedor);
  ModalManager.guardarEnStorage();

  alert(`✅ Proveedor registrado con éxito:\n${nuevoProveedor.nombreComercial}\nContacto: ${nuevoProveedor.contacto || 'Sin contacto'}\nTel: ${nuevoProveedor.telefono || 'Sin teléfono'}`);
  cerrarModalNuevoProveedor();

  // Si existe función de renderizado en la página, refrescar
  if (typeof renderProveedoresTable === 'function') {
    renderProveedoresTable();
  }
};

// Cerrar modales con tecla Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    cerrarModalNuevoCliente();
    cerrarModalNuevoProveedor();
  }
});
