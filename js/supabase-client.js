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

      return this.client;
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
    async getClientes() {
      if (!this.client) return null;
      try {
        const { data, error } = await this.client
          .from('clientes')
          .select('*')
          .order('id_cliente', { ascending: true });

        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('[Supabase] Error al obtener clientes:', err.message);
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

        if (error) {
          const { data: dataDirecta, error: err2 } = await this.client
            .from('productos')
            .select('*')
            .order('id_producto', { ascending: true });
          if (err2) throw err2;
          return dataDirecta;
        }
        return data;
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
