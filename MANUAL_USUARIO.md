# Manual de Usuario — Sistema de Gestión Ivi

> **Versión del Sistema:** 2.1 — Producción / Local  
> **Fecha de Actualización:** Octubre 2026  
> **Público Objetivo:** Operadores de venta, cajeros, responsables de atención al cliente y administradores.

---

## 1. Introducción y Bienvenida

El **Sistema de Gestión Ivi** es una plataforma integral diseñada para facilitar la operación comercial diaria en tiendas, perfumerías y distribuidores. Integra en un único entorno ágil y moderno:
- **Gestión de Ventas y Facturación**: Emisión de pedidos, cálculo automático de importes y control de estados.
- **CRM y Fidelización Inteligente**: Gestión de clientes, avisos automáticos de ofertas de cumpleaños por WhatsApp y seguimiento de compradores destacados.
- **Catálogo de Artículos y Stock**: Consulta en tiempo real de disponibilidad, precios y datos de proveedores.
- **Seguridad y Control de Acceso (Opción B)**: Autenticación federada (Google / Correo) con esquema de aprobación previa de usuarios.

La interfaz utiliza la metodología visual **"ADN Placas independientes"**, garantizando un diseño limpio, zonas táctiles amplias, navegación rápida por teclado y adaptabilidad total tanto en pantallas táctiles móviles como en computadoras de escritorio.

---

## 2. Acceso al Sistema y Gestión de Cuenta

### 2.1. Inicio de Sesión (`login.html`)
Para ingresar al sistema:
1. Abra el navegador web y acceda a la dirección del sistema (`http://localhost/ivi/login.html` o la URL configurada por su administrador).
2. Podrá iniciar sesión a través de:
   - **Botón Oficial de Google ("Continuar con Google")**: Acceso rápido y seguro mediante su cuenta corporativa o personal autorizada.
   - **Correo Electrónico y Contraseña**: Ingrese sus credenciales y presione **"Iniciar Sesión"**.

> [!NOTE]
> Si es la primera vez que ingresa con su cuenta de Google, el sistema registrará automáticamente su perfil bajo el esquema **Opción B** en estado `pendiente`. Un administrador del sistema deberá aprobar su acceso antes de que pueda visualizar los datos de la empresa.

---

### 2.2. Menú de Gestión de Equipo y Perfil
En la esquina superior derecha del tablero principal encontrará el acceso a su perfil. Al hacer clic, se despliega el menú contextual con:
- **Datos del Usuario**: Nombre completo, correo electrónico y rol asignado (`Administrador` o `Vendedor`).
- **Gestión de Solicitudes (Solo Administradores)**: Permite aprobar o rechazar solicitudes de nuevos usuarios en tiempo real.
- **Cerrar Sesión**: Finaliza de manera segura la sesión de trabajo actual.

---

## 3. Navegación General y Tablero de Control

Al ingresar al sistema se presenta la pantalla principal ([`/index.html`](/index.html)), dividida en áreas funcionales claras:

```text
┌────────────────────────────────────────────────────────────────────────┐
│  [Logo Ivi]  Sistema de Gestión Ivi            [Buscador]  [Usuario ▾] │
├────────────────────────────────────────────────────────────────────────┤
│  KPIs: [Ventas Mes]  [Pedidos Activos]  [Cumpleaños Hoy]  [Destacados] │
├──────────────────────────┬─────────────────────────────────────────────┤
│  BARRA LATERAL           │  ÁREA DE TRABAJO PRINCIPAL                  │
│  • 🛒 Ventas & Carrito   │  • Directorio / Historial de Pedidos        │
│  • 👥 CRM & Cumpleaños   │  • Carrito interactivo                      │
│  • 📦 Stock y Artículos  │  • Formularios modales contextuales         │
│  • 🏢 Proveedores        │                                             │
└──────────────────────────┴─────────────────────────────────────────────┘
```

### Indicadores Rápidos (KPIs):
- **Ventas del Mes**: Monto acumulado facturado en pesos argentinos ($).
- **Cumpleaños del Mes**: Cantidad de clientes que celebran su fecha de nacimiento este mes.
- **Clientes Destacados**: Clientes que registran 2 o más pedidos concretados en el período actual.

---

## 4. Módulo de Ventas y Facturación

El módulo de Ventas ([`/ventas/index.html`](/ventas/index.html)) permite generar pedidos en menos de 30 segundos aprovechando la búsqueda predictiva y el teclado.

### 4.1. Selección de Cliente
1. Ubique el cursor en el campo **"Cliente"**.
2. Escriba las primeras **3 letras** del nombre, apellido o número de DNI.
3. Se desplegará instantáneamente una lista desplegable con las coincidencias:
   - Use las flechas **Arriba (↑)** y **Abajo (↓)** del teclado para desplazarse por la lista.
   - Presione **Enter** sobre el cliente deseado para seleccionarlo.
   - Los datos de teléfono, DNI y condición comercial se completarán de forma automática.
4. Si el cliente no existe, presione el botón verde **"Nuevo Cliente"** ubicado a la derecha del buscador. Se abrirá el formulario oficial de alta y, al guardar, el nuevo cliente quedará automáticamente seleccionado en la venta en curso.

---

### 4.2. Búsqueda y Carga de Productos al Carrito
Puede agregar productos al pedido utilizando dos métodos:
- **Por Código de Artículo / Barra**: Escriba desde **1 carácter** (ej. `93617` o `171`) y presione **Enter**. El artículo se añade directamente al carrito.
- **Por Descripción del Producto**: Escriba al menos **3 caracteres** del nombre (ej. `Perfu`, `Cherr`, `Crema`). Seleccione con las flechas del teclado y presione **Enter**.

> [!TIP]
> **Atajo de Teclado:** Si el producto ya se encuentra en el carrito, al volver a buscarlo e ingresar Enter, el sistema incrementará automáticamente en +1 la cantidad sin duplicar renglones.

---

### 4.3. Gestión del Carrito y Liquidación
En la tabla del pedido podrá:
- **Modificar Cantidades**: Aumente o disminuya unidades con los botones `+` y `-` o digitando la cantidad directamente.
- **Eliminar Renglones**: Clic en el botón con icono de papelera.
- **Aplicar Descuentos / Recargos**: Puede ingresar porcentajes especiales pactados con el comprador.
- **Totales**: El subtotal, descuentos e importe total a abonar se actualizan en tiempo real.

---

### 4.4. Cierre del Pedido y Selección de Estado
Al presionar el botón **"Registrar Pedido"** (o **"Guardar Cambios"** en modo edición), seleccione el estado correspondiente:
- **`PEN` (Pendiente)**: Pedido registrado y reservado pendiente de cobro. **En este estado se da de baja automáticamente el stock** correspondiente en el catálogo e inventario para asegurar la disponibilidad física de los artículos al cliente.
- **`PAG` (Pagado)**: Pedido cobrado y cancelado en el acto (efectivo, transferencia o tarjeta). El stock ya se encuentra descontado desde que ingresó como Pendiente (o se da de baja inmediatamente si se registra directamente como Pagado).
- **`COT` (Cotización)**: Presupuesto emitido preliminar que no afecta el stock físico hasta su confirmación y pase a estado Pendiente o Pagado.
- **`CAN` (Cancelado)**: Operación anulada. Si el pedido se encontraba previamente en estado Pendiente o Pagado, el sistema reintegra automáticamente las unidades al stock disponible del inventario.

---

### 4.5. Facturación (Próximamente)
La opción **"Facturación"** se encuentra integrada en la botonera principal de Ventas en estado **difuminado** (no operativo por el momento), reservada para la futura vinculación de comprobantes fiscales electrónicos (AFIP / Factura B/C). Al pulsar sobre ella, el sistema notifica amigablemente su próxima disponibilidad.

---

## 5. Módulo CRM y Fidelización Inteligente

El módulo CRM ([`/crm/index.html`](/crm/index.html) o a través del botón **"CRM & Cumpleaños"** del menú) es el núcleo de retención y fidelización de clientes de Ivi.

### 5.1. Pestaña: Cumpleaños del Mes
Presenta la nómina de clientes ordenados cronológicamente por día de nacimiento en el mes en curso (o el mes seleccionado en el desplegable).

```text
┌────────────────────────────────────────────────────────────────────────┐
│  Alberto Gómez       #1   |  17 de Febrero  |  [ Avisar Oferta Mes ]   │
│  Andrea Morales      #6   |  18 de Octubre  |  [ 🎂 ¡Felicitar Hoy! ]   │
│  Sofía Méndez        #4   |  22 de Octubre  |  [ Oferta avisada ✓ ]    │
└────────────────────────────────────────────────────────────────────────┘
```

#### Los 2 Tipos de Contacto de Cumpleaños:

| Acción | Icono | Momento de Envío | Efecto Visual tras Envío | Registro en BD |
|---|:---:|---|---|:---:|
| **Avisar Oferta Mes** | 🎁 Regalo | Cualquier día del mes del cumpleaños | Pasa a estado **"Oferta avisada ✓"** con brillo atenuado (`inutilizado`). | `oferta_cumple` |
| **¡Felicitar Hoy!** | 🎂 Torta | **Únicamente el día exacto** del cumpleaños | Pasa a estado **"¡Felicitado hoy! ✓"** con brillo atenuado. | `saludo_cumple` |

#### ¿Cómo funciona el botón "Avisar Oferta Mes"?
1. Al hacer clic, el sistema genera automáticamente un enlace de WhatsApp Web / WhatsApp Desktop con el saludo y beneficio:
   > *"¡Hola Alberto! 🎁 En el mes de tu cumpleaños, desde Costa Atlántica queremos celebrarlo con vos. ¡Tenés un descuento y beneficio especial en tus pedidos durante este mes!"*
2. **Protección contra duplicados**: El botón queda inmediatamente **inutilizado** (atenuado y en escala de grises suave). Aunque recargue la página o ingrese desde otro dispositivo, el sistema recordará que ya fue avisado gracias a la sincronización en base de datos.

#### ¿Cómo funciona el botón "🎂 ¡Felicitar Hoy!"?
1. Se activa únicamente cuando la fecha del día coincide con el día de nacimiento del cliente.
2. Al presionarlo, redacta el saludo festivo del día exacto:
   > *"¡Feliz cumpleaños Andrea! 🎂🎉 Desde Costa Atlántica te deseamos un día extraordinario y lleno de alegrías. ¡Brindamos por vos!"*
3. Queda registrado como `saludo_cumple` en la base de datos y su botón se atemúa para no reiterar la salutación.

---

### 5.2. Pestaña: Clientes Más Compradores (Destacados)
El sistema analiza automáticamente el historial transaccional del mes en curso y clasifica a los clientes:

- **⭐ Cliente Destacado**: Todo cliente que registre **2 o más compras** finalizadas en el mes.
- **Acción "Contactar"**: Al hacer clic en el botón verde con el logo de WhatsApp, se inicia una conversación con el cliente ofreciéndole beneficios exclusivos por su lealtad:
  > *"¡Hola María! Desde Costa Atlántica queremos agradecerte por ser un cliente destacado de este mes. ¡Tenemos promociones y beneficios especiales para tu próximo pedido!"*
- Esta interacción queda registrada en la base de datos bajo el tipo `habitual`.

---

### 5.3. Directorio General de Clientes
Permite visualizar la ficha completa de todos los clientes registrados, buscar por nombre, teléfono o DNI, y consultar:
- Cumpleaños con badges visuales (`Oferta Mes`, `Avisado ✓`, `¡Hoy!`).
- Estado (`Activo` o `Inactivo`).
- Acceso directo para editar datos de contacto mediante el botón **"Editar"**.

---

## 6. Formularios de Alta y Edición de Entidades

Tanto en [`/index.html`](/index.html) como en [`/crm/index.html`](/crm/index.html), los formularios siguen el estándar de diseño unificado:

### 6.1. Alta / Edición de Cliente
- **Datos Personales**: Nombre, Apellido, DNI, Teléfono (con código de área sin 0 ni 15), Correo y Dirección.
- **Fecha de Nacimiento**: Selector independiente de **Día** (1 a 31) y **Mes** (Enero a Diciembre) para garantizar precisión en las alertas de CRM.
- **Consentimiento de WhatsApp**: Casilla de verificación para confirmar que el cliente desea recibir promociones y avisos comerciales.
- **Estado**: Activo / Inactivo.

---

### 6.2. Alta / Edición de Proveedor
- **Datos de la Empresa**: Nombre o Razón Social (ej. *Natura Cosméticos*, *Monique Cosmética*, *Ignacio - Infodumper*), CUIT/RUT, Dirección, Teléfono y Correo de pedidos.
- **Sincronización en Base de Datos**: Todo proveedor registrado o modificado se replica en tiempo real en la base de datos PostgreSQL (`ivi_db`) mediante el endpoint [`/api/proveedores.php`](/api/proveedores.php) y queda disponible de inmediato para ser seleccionado en la carga de productos.

---

### 6.3. Alta / Edición de Producto (Stock)
- **Acceso Directo**: Mediante el botón **"Nuevo Producto"** en la tarjeta de Stock del portal principal o en la cabecera de la **Gestión de Inventario**.
- **Campos de Ficha**: Código de producto (ej. `93617`), Proveedor oficial (desplegable dinámico sincronizado con el catálogo de proveedores y PostgreSQL: *Natura Cosméticos*, *Monique Cosmética*, *AVON Argentina*, *L'Oréal Distribución*, *Ignacio - Infodumper* y marcas añadidas), Descripción / Denominación, Precio Unitario ($ ARS) y Existencias físicas iniciales.
- **Estado de Inventario**: Selector de estado (*Óptimo*, *Stock Bajo*, *Agotado*), sincronizado con el círculo de color identificatorio.
- **Edición Rápida**: Al pulsar en cualquier fila de la tabla de inventario, se despliega este mismo formulario para actualizar existencias o precios al instante.

---

## 7. Atajos de Teclado y Consejos de Productividad

| Atajo / Acción | Tecla | Función |
|---|:---:|---|
| **Cerrar Ventana / Modal** | <kbd>Escape</kbd> | Cierra cualquier modal abierto (CRM, Nuevo Cliente, Edición, etc.). |
| **Navegar en Desplegables** | <kbd>↓</kbd> / <kbd>↑</kbd> | Mueve la selección entre las opciones predictivas de clientes y productos. |
| **Confirmar Selección** | <kbd>Enter</kbd> | Carga el elemento resaltado al pedido o ejecuta la búsqueda. |
| **Acceso Directo a CRM** | Enlace con `?crm=1` | Abre la pantalla directamente con el panel de fidelización desplegado. |

---

## 8. Preguntas Frecuentes y Solución de Inconvenientes

### ¿Por qué el botón de WhatsApp no abre la aplicación?
Asegúrese de que el cliente tenga cargado su número telefónico. Si el teléfono está vacío, el sistema mostrará una etiqueta *"Sin teléfono"* y deshabilitará temporalmente el botón hasta que edite la ficha del cliente.

### ¿Qué significa que un botón de oferta se vea "atenuado" o con menos brillo?
Significa que el cliente ya fue contactado este mes para su oferta de cumpleaños. El botón permanece visible pero inactivo (`inutilizado`) para evitar que otro vendedor vuelva a enviarle el mismo mensaje por error.

### ¿Puedo utilizar el sistema desde mi celular o tablet?
Sí. El sistema cuenta con diseño móvil adaptable ("ADN Placas independientes") con barra de navegación inferior, zonas táctiles cómodas de más de 44 píxeles y modales optimizados para pantallas verticales.

### ¿Cómo sé si mis registros se guardan en la base de datos?
Al hacer clic en cualquier acción de contacto o confirmación de pedido, el sistema emitirá un mensaje de confirmación en la parte superior derecha de la pantalla y sincronizará de inmediato con la base de datos PostgreSQL local.

### ¿En qué momento se descuenta el stock de un producto vendido?
El stock se da de baja automáticamente ni bien el pedido se registra en estado **`PEN` (Pendiente)**. De esta forma, las unidades quedan reservadas de inmediato y se previene la sobreventa de artículos antes de concretar el cobro final (`PAG`). Si el pedido es cancelado (`CAN`), el stock se reintegra al inventario al instante.
