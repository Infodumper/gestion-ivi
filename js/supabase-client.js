/**
 * Sistema de Gestión Ivi — Conector y Adaptador Supabase Cloud
 * Provee autenticación real cifrada (Supabase Auth JWT), sincronización en tiempo real,
 * persistencia en Supabase (PostgreSQL Cloud) y fallback controlado a LocalStorage.
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'ivi_supabase_config';
  const SESSION_KEY = 'ivi_session_user';

  const IviSupabase = {
    client: null,
    url: '',
    anonKey: '',

    /**
     * Inicializa el cliente Supabase
     */
    init(customConfig = null) {
      let config = customConfig;
      if (!config) {
        try {
          config = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        } catch (e) {
          config = null;
        }
      }

      // Si hay variable global en window
      if (!config && window.IVI_SUPABASE_CONFIG) {
        config = window.IVI_SUPABASE_CONFIG;
      }

      if (config && config.url && config.anonKey) {
        this.url = config.url.trim();
        this.anonKey = config.anonKey.trim();

        if (window.supabase && typeof window.supabase.createClient === 'function') {
          try {
            this.client = window.supabase.createClient(this.url, this.anonKey, {
              auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
              }
            });
            console.log('[Supabase Cloud] Cliente inicializado correctamente:', this.url);

            // Escuchar cambios de estado en la autenticación
            this.client.auth.onAuthStateChange(async (event, session) => {
              if (event === 'SIGNED_OUT' || !session) {
                localStorage.removeItem(SESSION_KEY);
              }
            });
          } catch (err) {
            console.error('[Supabase Cloud] Error creando cliente:', err);
            this.client = null;
          }
        } else {
          console.warn('[Supabase Cloud] Librería @supabase/supabase-js no detectada en window. Cargue el CDN correspondiente.');
        }
      } else {
        console.info('[Supabase Cloud] Modo LocalStorage activo (credenciales Supabase no configuradas aún).');
      }

      // Purgar inmediatamente cualquier dato mock viejo que haya quedado en localStorage
      this.purgeMockCache();

      return this.client;
    },

    /**
     * Limpia datos mock heredados en localStorage para garantizar
     * que la app solo muestre datos reales de Supabase.
     */
    purgeMockCache() {
      try {
        const PURGE_TAG = 'ivi_real_supabase_sync_v2';
        if (localStorage.getItem(PURGE_TAG) !== 'true') {
          console.log('[Supabase Cloud] Purgando caché local con datos mock...');
          localStorage.removeItem('ivi_clientes_data');
          localStorage.removeItem('ivi_stock_data');
          localStorage.removeItem('ivi_pedidos');
          localStorage.removeItem('ivi_pedidos_data');
          localStorage.removeItem('ivi_proveedores_data');
          localStorage.setItem(PURGE_TAG, 'true');
        } else {
          // Chequeo secundario: si contiene nombres mock conocidos, limpiar
          const clis = localStorage.getItem('ivi_clientes_data');
          if (clis && (clis.includes('Distribuidora San Martín') || clis.includes('Florencia Gómez'))) {
            localStorage.removeItem('ivi_clientes_data');
          }
          const prods = localStorage.getItem('ivi_stock_data');
          if (prods && (prods.includes('Extracto Puro') || prods.includes('Difusor Aromático'))) {
            localStorage.removeItem('ivi_stock_data');
          }
          const peds = localStorage.getItem('ivi_pedidos') || localStorage.getItem('ivi_pedidos_data');
          if (peds && peds.includes('VTA-2026-0101')) {
            localStorage.removeItem('ivi_pedidos');
            localStorage.removeItem('ivi_pedidos_data');
          }
        }
      } catch (e) {
        console.warn('[Supabase Cloud] Error purgando caché mock:', e);
      }
    },

    /**
     * Guarda credenciales y reinicializa
     */
    setConfig(url, anonKey) {
      if (!url || !anonKey) {
        localStorage.removeItem(STORAGE_KEY);
        this.client = null;
        this.url = '';
        this.anonKey = '';
        console.log('[Supabase Cloud] Configuración eliminada.');
        return false;
      }

      const cfg = { url: url.trim(), anonKey: anonKey.trim() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      return this.init(cfg);
    },

    isConfigured() {
      return Boolean(this.client);
    },

    // =========================================================================
    // MÓDULO DE AUTENTICACIÓN SEGURA (SUPABASE AUTH JWT + ESTADOS DE ACCESO)
    // =========================================================================

    /**
     * Iniciar sesión con email y contraseña reales
     */
    async signIn(email, password) {
      if (!this.isConfigured()) {
        throw new Error('Supabase Cloud no está conectado. No se puede autenticar.');
      }

      const correo = email.trim().toLowerCase();

      // 1. Autenticar credenciales en Supabase Auth (cifrado con bcrypt)
      const { data: authData, error: authError } = await this.client.auth.signInWithPassword({
        email: correo,
        password: password
      });

      if (authError) {
        throw authError;
      }

      // 2. Verificar estado en la tabla usuarios_autorizados
      const { data: usuario, error: userError } = await this.client
        .from('usuarios_autorizados')
        .select('*')
        .ilike('email', correo)
        .maybeSingle();

      if (userError) {
        console.warn('[Auth] Error consultando perfil de usuario:', userError);
      }

      if (!usuario) {
        // El usuario está en auth.users pero no en usuarios_autorizados (caso atípico)
        await this.client.auth.signOut();
        throw new Error('PENDING_APPROVAL');
      }

      if (usuario.estado === 'pendiente') {
        await this.client.auth.signOut();
        const err = new Error('Tu cuenta está registrada pero pendiente de aprobación por el Administrador.');
        err.code = 'PENDING_APPROVAL';
        err.usuario = usuario;
        throw err;
      }

      if (usuario.estado === 'rechazado') {
        await this.client.auth.signOut();
        const err = new Error('Tu solicitud de acceso ha sido denegada por el Administrador.');
        err.code = 'ACCESS_DENIED';
        throw err;
      }

      if (usuario.estado === 'aprobado') {
        localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
        return {
          session: authData.session,
          user: authData.user,
          profile: usuario
        };
      }

      await this.client.auth.signOut();
      throw new Error('Estado de usuario no válido.');
    },

    /**
     * Registro de nueva cuenta de colaborador
     */
    async signUp(email, password, nombre) {
      if (!this.isConfigured()) {
        throw new Error('Supabase Cloud no está conectado.');
      }

      const correo = email.trim().toLowerCase();

      const { data, error } = await this.client.auth.signUp({
        email: correo,
        password: password,
        options: {
          data: {
            nombre: nombre || correo.split('@')[0]
          }
        }
      });

      if (error) {
        throw error;
      }

      return data;
    },

    /**
     * Cerrar sesión de forma segura y revocar tokens
     */
    async signOut() {
      try {
        if (this.client) {
          await this.client.auth.signOut();
        }
      } catch (err) {
        console.warn('[Auth] Error al cerrar sesión en Supabase:', err);
      } finally {
        localStorage.removeItem(SESSION_KEY);
      }
    },

    /**
     * Recuperación de contraseña por email
     */
    async resetPassword(email) {
      if (!this.isConfigured()) {
        throw new Error('Supabase no está conectado.');
      }
      return await this.client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: window.location.origin + '/login.html'
      });
    },

    /**
     * Obtener sesión activa actual de Supabase
     */
    async getSession() {
      if (!this.isConfigured()) return null;
      try {
        const { data: { session }, error } = await this.client.auth.getSession();
        if (error) throw error;
        return session;
      } catch (err) {
        console.warn('[Auth] Error obteniendo sesión:', err);
        return null;
      }
    },

    /**
     * Guardián de ruta: Verifica sesión activa y estado aprobado.
     * Si no es válido, redirige a login.
     */
    async requireAuth(redirectPath = './login.html') {
      if (this.isConfigured()) {
        try {
          const session = await this.getSession();
          if (!session || !session.user) {
            localStorage.removeItem(SESSION_KEY);
            window.location.href = redirectPath;
            return null;
          }

          // Verificar si sigue aprobado
          const { data: usuario, error } = await this.client
            .from('usuarios_autorizados')
            .select('*')
            .ilike('email', session.user.email)
            .maybeSingle();

          if (error || !usuario || usuario.estado !== 'aprobado') {
            await this.signOut();
            window.location.href = redirectPath;
            return null;
          }

          localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
          return usuario;
        } catch (e) {
          console.warn('[Auth Guard] Error validando sesión en Supabase:', e);
        }
      }

      // Verificación local secundaria
      const localUser = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (!localUser || localUser.estado !== 'aprobado') {
        window.location.href = redirectPath;
        return null;
      }
      return localUser;
    },

    // =========================================================================
    // MÓDULO DE NEGOCIO: PROVEEDORES, PRODUCTOS, CLIENTES Y MENSAJES
    // =========================================================================

    /**
     * PROVEEDORES: Sincronización
     */
    async getProveedores() {
      if (!this.client) return null;
      try {
        const { data, error } = await this.client
          .from('proveedores')
          .select('*')
          .order('id_proveedor', { ascending: true });

        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('[Supabase] Error al obtener proveedores:', err.message);
        return null;
      }
    },

    async saveProveedor(prov) {
      if (!this.client) return null;
      try {
        const payload = {
          nombre_comercial: prov.razon || prov.nombre_comercial,
          contacto: prov.contacto || '',
          telefono: prov.tel || prov.telefono || '',
          email: prov.email || '',
          cuit: prov.cuit || '',
          direccion: prov.direccion || '',
          estado: prov.estado !== false
        };

        if (prov.id && Number.isInteger(Number(prov.id))) {
          payload.id_proveedor = Number(prov.id);
        }

        const { data, error } = await this.client
          .from('proveedores')
          .upsert(payload)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('[Supabase] Error al guardar proveedor:', err.message);
        return null;
      }
    },

    /**
     * CONTACTOS WHATSAPP: Registro y Reversión
     */
    async getContactosWhatsApp() {
      if (!this.client) return null;
      try {
        const { data, error } = await this.client
          .from('contactos_whatsapp')
          .select('*')
          .order('fecha_contacto', { ascending: false })
          .limit(100);

        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('[Supabase] Error al obtener contactos WA:', err.message);
        return null;
      }
    },

    async registrarContactoWhatsApp(clienteId, tipo) {
      if (!this.client || !clienteId || !tipo) return null;
      try {
        const { data, error } = await this.client
          .from('contactos_whatsapp')
          .insert([{ cliente_id: Number(clienteId), tipo: tipo }])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('[Supabase] Error al registrar contacto WA:', err.message);
        return null;
      }
    },

    async revertirContactoWhatsApp(clienteId, tipo) {
      if (!this.client || !clienteId || !tipo) return null;
      try {
        const { data: ultimos, error: errSelect } = await this.client
          .from('contactos_whatsapp')
          .select('id_contacto_wa')
          .eq('cliente_id', Number(clienteId))
          .eq('tipo', tipo)
          .order('fecha_contacto', { ascending: false })
          .limit(1);

        if (errSelect) throw errSelect;
        if (!ultimos || ultimos.length === 0) return true;

        const { error: errDelete } = await this.client
          .from('contactos_whatsapp')
          .delete()
          .eq('id_contacto_wa', ultimos[0].id_contacto_wa);

        if (errDelete) throw errDelete;
        return true;
      } catch (err) {
        console.warn('[Supabase] Error al revertir contacto WA:', err.message);
        return null;
      }
    },

    /**
     * CLIENTES: Consulta y Sincronización
     */
    /**
     * CLIENTES: Consulta y Sincronización en tiempo real desde Supabase
     */
    async getClientes() {
      if (!this.client) return null;
      try {
        const { data, error } = await this.client
          .from('clientes')
          .select('*')
          .order('id_cliente', { ascending: true });

        if (error) throw error;
        if (!Array.isArray(data)) return [];

        const formateados = data.map(c => {
          let diaNac = null;
          let mesNac = null;
          if (c.fecha_nac) {
            const parts = String(c.fecha_nac).split('-');
            if (parts.length === 3) {
              mesNac = parseInt(parts[1], 10);
              diaNac = parseInt(parts[2], 10);
            }
          }
          return {
            id: c.id_cliente,
            id_cliente: c.id_cliente,
            nombre: c.nombre || '',
            apellido: c.apellido || '',
            telefono: c.telefono || '',
            dni: c.dni || '',
            fecha_nac: c.fecha_nac || null,
            dia_nac: diaNac,
            mes_nac: mesNac,
            promociones: c.acepta_promociones !== false,
            estado: c.estado !== false,
            id_vendedor: c.id_vendedor || null
          };
        });

        localStorage.setItem('ivi_clientes_data', JSON.stringify(formateados));
        return formateados;
      } catch (err) {
        console.warn('[Supabase] Error al obtener clientes:', err.message);
        return null;
      }
    },

    /**
     * CLIENTES: Guardar o actualizar cliente en Supabase
     */
    async saveCliente(cli) {
      if (!this.client) return null;
      try {
        let fechaNac = null;
        if (cli.dia_nac && cli.mes_nac) {
          const mes = String(cli.mes_nac).padStart(2, '0');
          const dia = String(cli.dia_nac).padStart(2, '0');
          fechaNac = `2000-${mes}-${dia}`;
        } else if (cli.fecha_nac) {
          fechaNac = cli.fecha_nac;
        }

        const payload = {
          nombre: cli.nombre || '',
          apellido: cli.apellido || '',
          telefono: cli.telefono || '',
          dni: cli.dni || '',
          fecha_nac: fechaNac,
          acepta_promociones: cli.promociones !== false,
          estado: cli.estado !== false
        };

        if (cli.id_vendedor) {
          payload.id_vendedor = Number(cli.id_vendedor);
        }

        let res;
        if (cli.id && Number.isInteger(Number(cli.id)) && Number(cli.id) < 1000000) {
          res = await this.client
            .from('clientes')
            .update(payload)
            .eq('id_cliente', Number(cli.id))
            .select();
        } else {
          res = await this.client
            .from('clientes')
            .insert([payload])
            .select();
        }

        if (res.error) throw res.error;
        return res.data ? res.data[0] : null;
      } catch (err) {
        console.warn('[Supabase] Error al guardar cliente:', err.message);
        return null;
      }
    },

    /**
     * PEDIDOS / VENTAS: Consulta en tiempo real desde Supabase
     */
    async getPedidos() {
      if (!this.client) return null;
      try {
        let { data, error } = await this.client
          .from('pedidos')
          .select(`
            id_pedido,
            fecha,
            total,
            estado,
            id_vendedor,
            id_cliente,
            clientes (id_cliente, nombre, apellido, telefono, dni),
            vendedores (id_vendedor, nombre),
            detalle_pedidos (id_detalle, id_producto, cantidad, precio_unitario, codigo_producto, productos(id_producto, nombre_producto, descripcion, cod_producto))
          `)
          .order('id_pedido', { ascending: false });

        if (error) {
          console.warn('[Supabase] Join falló, intentando consulta directa de pedidos:', error.message);
          const resPlana = await this.client
            .from('pedidos')
            .select('*')
            .order('id_pedido', { ascending: false });
          if (resPlana.error) throw resPlana.error;
          data = resPlana.data;
        }

        if (!Array.isArray(data)) return [];

        const pedidosFormateados = data.map(p => {
          let clienteNombre = 'Consumidor Final';
          if (p.clientes) {
            const nom = [p.clientes.nombre, p.clientes.apellido].filter(Boolean).join(' ');
            if (nom) clienteNombre = nom;
          }

          let fechaFormateada = '';
          if (p.fecha) {
            try {
              const d = new Date(p.fecha);
              const dia = String(d.getDate()).padStart(2, '0');
              const mes = String(d.getMonth() + 1).padStart(2, '0');
              const anio = d.getFullYear();
              fechaFormateada = `${dia}/${mes}/${anio}`;
            } catch (e) {
              fechaFormateada = p.fecha;
            }
          }

          let estadoNormalizado = p.estado || 'PAG';
          if (estadoNormalizado === 'Activo') estadoNormalizado = 'PAG';
          if (estadoNormalizado === 'Anulado') estadoNormalizado = 'ANU';
          if (estadoNormalizado === 'Presupuesto') estadoNormalizado = 'COT';

          const itemsFormateados = (p.detalle_pedidos || []).map(dp => ({
            id: dp.id_producto,
            id_producto: dp.id_producto,
            codigo: dp.codigo_producto || dp.productos?.cod_producto || '',
            descripcion: dp.productos?.nombre_producto || dp.productos?.descripcion || dp.codigo_producto || 'Producto',
            cantidad: dp.cantidad || 1,
            precio: parseFloat(dp.precio_unitario) || 0,
            subtotal: (dp.cantidad || 1) * (parseFloat(dp.precio_unitario) || 0)
          }));

          const descProductos = itemsFormateados.length > 0
            ? itemsFormateados.map(it => `${it.cantidad}x ${it.codigo ? '[' + it.codigo + '] ' : ''}${it.descripcion}`).join(', ')
            : 'Venta comercial';

          return {
            id: `VTA-2026-${String(p.id_pedido).padStart(4, '0')}`,
            id_pedido: p.id_pedido,
            fecha: fechaFormateada,
            fecha_iso: p.fecha,
            cliente: clienteNombre,
            id_cliente: p.id_cliente,
            vendedor: p.vendedores?.nombre || 'Vendedor',
            id_vendedor: p.id_vendedor,
            estado: estadoNormalizado,
            total: parseFloat(p.total) || 0,
            total_items: itemsFormateados.length,
            producto: descProductos,
            items: itemsFormateados
          };
        });

        localStorage.setItem('ivi_pedidos', JSON.stringify(pedidosFormateados));
        localStorage.setItem('ivi_pedidos_data', JSON.stringify(pedidosFormateados));
        return pedidosFormateados;
      } catch (err) {
        console.warn('[Supabase] Error al obtener pedidos:', err.message);
        return null;
      }
    },

    /**
     * PEDIDOS / VENTAS: Registrar pedido y sus items en Supabase
     */
    async savePedido(pedido, items = []) {
      if (!this.client) return null;
      try {
        const payload = {
          id_cliente: pedido.id_cliente || null,
          id_vendedor: pedido.id_vendedor || 1,
          fecha: new Date().toISOString(),
          total: parseFloat(pedido.total) || 0,
          estado: (pedido.estado === 'PAG' || pedido.estado === 'Activo') ? 'Activo' : (pedido.estado === 'COT' ? 'Presupuesto' : 'Pendiente')
        };

        const { data: nuevoPedido, error: errPed } = await this.client
          .from('pedidos')
          .insert([payload])
          .select()
          .single();

        if (errPed) throw errPed;

        if (items && items.length > 0) {
          const detalleRows = items.map(it => ({
            id_pedido: nuevoPedido.id_pedido,
            id_producto: (it.id && Number(it.id) < 1000000) ? Number(it.id) : null,
            cantidad: parseInt(it.cantidad) || 1,
            precio_unitario: parseFloat(it.precio) || 0,
            codigo_producto: it.codigo || ''
          }));

          const { error: errDet } = await this.client
            .from('detalle_pedidos')
            .insert(detalleRows);

          if (errDet) {
            console.warn('[Supabase] Error insertando items del pedido:', errDet.message);
          }
        }

        return nuevoPedido;
      } catch (err) {
        console.warn('[Supabase] Error al guardar pedido:', err.message);
        return null;
      }
    },

    /**
     * PEDIDOS / VENTAS: Actualizar estado de pedido en Supabase
     */
    async updateEstadoPedido(idPedido, nuevoEstado) {
      if (!this.client || !idPedido) return null;
      try {
        const idNum = Number(String(idPedido).replace(/\D/g, ''));
        const estadoDb = (nuevoEstado === 'PAG' || nuevoEstado === 'Activo') ? 'Activo' : (nuevoEstado === 'ANU' ? 'Anulado' : nuevoEstado);

        const { data, error } = await this.client
          .from('pedidos')
          .update({ estado: estadoDb })
          .eq('id_pedido', idNum)
          .select();

        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('[Supabase] Error al actualizar estado del pedido:', err.message);
        return null;
      }
    },

    /**
     * PRODUCTOS: Consulta de stock en tiempo real
     */
    async getProductos() {
      if (!this.client) return null;
      try {
        const { data, error } = await this.client
          .from('productos')
          .select('*, proveedores(id_proveedor, nombre_comercial, contacto)')
          .order('id_producto', { ascending: true });

        let productosRaw = data;
        if (error) {
          const { data: dataDirecta, error: err2 } = await this.client
            .from('productos')
            .select('*')
            .order('id_producto', { ascending: true });
          if (err2) throw err2;
          productosRaw = dataDirecta;
        }

        if (!Array.isArray(productosRaw)) return [];

        const formateados = productosRaw.map(p => {
          const provNombre = p.proveedores?.nombre_comercial || 'Natura Cosméticos';
          const st = parseInt(p.stock) || 0;
          const est = st <= 0 ? 'agotado' : (st <= 10 ? 'bajo' : 'optimo');
          return {
            id: p.id_producto,
            codigo: p.cod_producto || `PROD-${p.id_producto}`,
            descripcion: p.nombre_producto || p.descripcion || 'Sin nombre',
            precio: parseFloat(p.precio) || 0,
            stock: st,
            categoria: p.familia_olfativa || 'Perfumería',
            proveedor: provNombre,
            estado: est
          };
        });

        localStorage.setItem('ivi_stock_data', JSON.stringify(formateados));
        return formateados;
      } catch (err) {
        console.warn('[Supabase] Error al obtener productos:', err.message);
        return null;
      }
    },

    /**
     * PRODUCTOS: Guardar o actualizar producto en Supabase Cloud
     */
    async saveProducto(prod) {
      if (!this.client) return null;
      try {
        let idProveedor = prod.id_proveedor || 1;
        if (prod.proveedor && isNaN(prod.proveedor)) {
          const provs = await this.getProveedores();
          const matchProv = provs?.find(p => (p.nombre_comercial || p.razon) === prod.proveedor);
          if (matchProv) idProveedor = matchProv.id_proveedor || matchProv.id;
        }

        const payload = {
          cod_producto: prod.codigo || prod.cod_producto,
          nombre_producto: prod.descripcion || prod.nombre || prod.nombre_producto,
          descripcion: prod.descripcion || prod.nombre || prod.nombre_producto,
          precio: parseFloat(prod.precio) || 0,
          stock: parseInt(prod.stock) || 0,
          id_proveedor: idProveedor,
          estado: (parseInt(prod.stock) || 0) > 0
        };

        if (prod.id && Number(prod.id) < 100000000) {
          const { data, error } = await this.client
            .from('productos')
            .update(payload)
            .eq('id_producto', prod.id)
            .select();
          if (error) throw error;
          return data ? data[0] : null;
        } else {
          const { data, error } = await this.client
            .from('productos')
            .insert([payload])
            .select();
          if (error) throw error;
          return data ? data[0] : null;
        }
      } catch (err) {
        console.warn('[Supabase] Error al guardar producto:', err.message);
        return null;
      }
    },

    /**
     * PRODUCTOS: Actualizar stock de un producto
     */
    async actualizarStockProducto(idProducto, nuevoStock) {
      if (!this.client) return null;
      try {
        const { data, error } = await this.client
          .from('productos')
          .update({
            stock: parseInt(nuevoStock) || 0,
            estado: (parseInt(nuevoStock) || 0) > 0,
            fecha_modificacion: new Date().toISOString()
          })
          .eq('id_producto', idProducto)
          .select();

        if (error) throw error;
        return data ? data[0] : null;
      } catch (err) {
        console.warn('[Supabase] Error al actualizar stock:', err.message);
        return null;
      }
    }
  };

  // Inicializar inmediatamente si Supabase JS ya está cargado
  if (window.supabase) {
    IviSupabase.init();
  }

  // O inicializar en DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    if (!IviSupabase.client) {
      IviSupabase.init();
    }
  });

  window.IviSupabase = IviSupabase;
})(window);
