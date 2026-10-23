/**
 * Sistema de Gestión Ivi — Conector y Adaptador Supabase Cloud
 * Provee sincronización en tiempo real y persistencia en Supabase (PostgreSQL Cloud)
 * con fallback transparente a LocalStorage.
 */

(function (window) {
  'use strict';

  // Configuración predeterminada (puede sobreescribirse en runtime o localStorage)
  const STORAGE_KEY = 'ivi_supabase_config';

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
            this.client = window.supabase.createClient(this.url, this.anonKey);
            console.log('[Supabase Cloud] Cliente inicializado correctamente:', this.url);
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
        // Busca el último contacto de este cliente y tipo
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
     * PRODUCTOS: Consulta de stock
     */
    async getProductos() {
      if (!this.client) return null;
      try {
        const { data, error } = await this.client
          .from('productos')
          .select('*')
          .order('id_producto', { ascending: true });

        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('[Supabase] Error al obtener productos:', err.message);
        return null;
      }
    }
  };

  // Auto-inicializar si las credenciales existen
  document.addEventListener('DOMContentLoaded', () => {
    IviSupabase.init();
  });

  window.IviSupabase = IviSupabase;
})(window);
