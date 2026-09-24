
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'crm_token';
const USER_KEY = 'crm_usuario';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setSession(token: string, usuario: UsuarioSesion) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
export function getStoredUsuario(): UsuarioSesion | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export interface UsuarioSesion {
  id: number;
  nombre: string;
  correo: string;
  rol: 'admin' | 'usuario';
  estado?: 'activo' | 'inactivo';
}

export interface Usuario extends UsuarioSesion {
  estado: 'activo' | 'inactivo';
  createdAt: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  correo: string;
  telefono: string | null;
  empresa: string | null;
  fecha_registro: string;
  estado: 'activo' | 'inactivo';
  etapa_crm: 'Prospecto' | 'Activo' | 'Frecuente' | 'Inactivo';
  interacciones?: Interaccion[];
}

export interface Interaccion {
  id: number;
  cliente_id: number;
  tipo: 'llamada' | 'correo' | 'reunion';
  descripcion: string;
  fecha: string;
  usuario_id: number;
  usuario?: { id: number; nombre: string; correo: string };
  cliente?: { id: number; nombre: string; empresa: string | null };
}

export interface Metricas {
  total_clientes: number;
  clientes_activos: number;
  clientes_inactivos: number;
  interacciones_por_cliente: Array<{ cliente_id: number; total_interacciones: string; cliente: { nombre: string; empresa: string | null } }>;
  clientes_sin_interaccion_reciente: Array<{ id: number; nombre: string; empresa: string | null; etapa_crm: string }>;
}

export interface Proveedor {
  id: number;
  nombre: string;
  contacto: string | null;
  correo: string | null;
  telefono: string | null;
  direccion: string | null;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  imagen_url: string | null;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: string | number;
  estrategia_logistica: 'PUSH' | 'PULL';
  proveedor_id: number | null;
  proveedor?: { id: number; nombre: string };
  estado_inventario?: 'Normal' | 'Stock bajo';
}

export interface MovimientoInventario {
  id: number;
  producto_id: number;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  motivo: string | null;
  fecha: string;
  usuario_id: number;
  producto?: { id: number; nombre: string };
  usuario?: { id: number; nombre: string };
}

export interface Pedido {
  id: number;
  folio: string;
  producto_id: number;
  proveedor_id: number | null;
  cantidad: number;
  tipo: 'reposicion' | 'venta';
  estado: 'pendiente' | 'en_proceso' | 'surtido' | 'cancelado';
  fecha: string;
  notas: string | null;
  producto?: { id: number; nombre: string };
  proveedor?: { id: number; nombre: string };
}

export interface MetricasScm {
  total_productos: number;
  total_proveedores: number;
  pedidos_en_proceso: number;
  productos_stock_bajo: Array<{ id: number; nombre: string; stock_actual: number; stock_minimo: number }>;
  productos_mas_vendidos: Array<{ producto_id: number; nombre: string; total_vendido: number }>;
  rotacion_inventario: { porcentaje_general: number; alta_rotacion: number; rotacion_media: number; rotacion_baja: number };
  comparativa_push_pull: { push: number; pull: number };
}

export interface MadurezScm {
  productos_proveedores_integrados: boolean;
  inventario_funcionando: boolean;
  trazabilidad_movimientos: boolean;
  estrategia_push_pull_implementada: boolean;
  reportes_y_metricas: boolean;
  nivel: 'Inicial' | 'En desarrollo' | 'Optimizado';
}

class ApiError extends Error {}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let mensaje = `Error ${res.status}`;
    try { const data = await res.json(); mensaje = data.error || mensaje; } catch { }
    throw new ApiError(mensaje);
  }
  if (res.status === 204) return null as T;
  return res.json();
}

export const api = {
  login: (correo: string, password: string) =>
    request<{ token: string; usuario: UsuarioSesion }>('/auth/login', { method: 'POST', body: JSON.stringify({ correo, password }) }),
  register: (payload: { nombre: string; correo: string; password: string; rol?: string }) =>
    request<UsuarioSesion>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getMiPerfil: () => request<Usuario>('/auth/me'),
  cambiarPassword: (passwordActual: string, passwordNueva: string) =>
    request<{ mensaje: string }>('/auth/password', { method: 'PUT', body: JSON.stringify({ passwordActual, passwordNueva }) }),
  getUsuarios: () => request<Usuario[]>('/auth/usuarios'),
  actualizarEstadoUsuario: (id: number, estado: 'activo' | 'inactivo') =>
    request<Usuario>(`/auth/usuarios/${id}/estado`, { method: 'PUT', body: JSON.stringify({ estado }) }),

  getClientes: (params: { busqueda?: string; estado?: string; etapa_crm?: string } = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
    return request<{ total: number; clientes: Cliente[] }>(`/clientes${query ? `?${query}` : ''}`);
  },
  getCliente: (id: number) => request<Cliente>(`/clientes/${id}`),
  crearCliente: (payload: Partial<Cliente>) => request<Cliente>('/clientes', { method: 'POST', body: JSON.stringify(payload) }),
  actualizarCliente: (id: number, payload: Partial<Cliente>) => request<Cliente>(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  eliminarCliente: (id: number) => request<null>(`/clientes/${id}`, { method: 'DELETE' }),
  actualizarEtapa: (id: number, etapa_crm: string) => request<Cliente>(`/clientes/${id}/etapa`, { method: 'PUT', body: JSON.stringify({ etapa_crm }) }),

  getInteraccionesDeCliente: (clienteId: number) => request<Interaccion[]>(`/clientes/${clienteId}/interacciones`),
  crearInteraccion: (payload: { cliente_id: number; tipo: string; descripcion: string; fecha?: string }) =>
    request<Interaccion>('/interacciones', { method: 'POST', body: JSON.stringify(payload) }),
  getMiActividad: () => request<Interaccion[]>('/interacciones/mias'),
  getTodasInteracciones: () => request<Interaccion[]>('/interacciones'),

  getMetricas: () => request<Metricas>('/metricas'),

  getProveedores: (busqueda?: string) => request<Proveedor[]>(`/proveedores${busqueda ? `?busqueda=${encodeURIComponent(busqueda)}` : ''}`),
  crearProveedor: (payload: Partial<Proveedor>) => request<Proveedor>('/proveedores', { method: 'POST', body: JSON.stringify(payload) }),
  actualizarProveedor: (id: number, payload: Partial<Proveedor>) => request<Proveedor>(`/proveedores/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  eliminarProveedor: (id: number) => request<null>(`/proveedores/${id}`, { method: 'DELETE' }),

  getProductos: (params: { busqueda?: string; categoria?: string; estrategia_logistica?: string } = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
    return request<Producto[]>(`/productos${query ? `?${query}` : ''}`);
  },
  crearProducto: (payload: Partial<Producto>) => request<Producto>('/productos', { method: 'POST', body: JSON.stringify(payload) }),
  actualizarProducto: (id: number, payload: Partial<Producto>) => request<Producto>(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  eliminarProducto: (id: number) => request<null>(`/productos/${id}`, { method: 'DELETE' }),
  actualizarEstrategia: (id: number, estrategia_logistica: 'PUSH' | 'PULL') =>
    request<Producto>(`/productos/${id}/estrategia`, { method: 'PUT', body: JSON.stringify({ estrategia_logistica }) }),

  getMovimientos: (params: { tipo?: string; producto_id?: number } = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v).map(([k, v]) => [k, String(v)])).toString();
    return request<MovimientoInventario[]>(`/movimientos${query ? `?${query}` : ''}`);
  },
  crearMovimiento: (payload: { producto_id: number; tipo: 'entrada' | 'salida'; cantidad: number; motivo?: string; fecha?: string }) =>
    request<{ movimiento: MovimientoInventario; stock_actual: number }>('/movimientos', { method: 'POST', body: JSON.stringify(payload) }),

  getPedidos: (params: { estado?: string; tipo?: string } = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
    return request<Pedido[]>(`/pedidos${query ? `?${query}` : ''}`);
  },
  crearPedido: (payload: { producto_id: number; proveedor_id?: number; cantidad: number; tipo: 'reposicion' | 'venta'; fecha?: string; notas?: string }) =>
    request<Pedido>('/pedidos', { method: 'POST', body: JSON.stringify(payload) }),
  actualizarPedido: (id: number, payload: Partial<Pedido>) => request<Pedido>(`/pedidos/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  actualizarEstadoPedido: (id: number, estado: Pedido['estado']) => request<Pedido>(`/pedidos/${id}/estado`, { method: 'PUT', body: JSON.stringify({ estado }) }),
  eliminarPedido: (id: number) => request<null>(`/pedidos/${id}`, { method: 'DELETE' }),

  getMetricasScm: () => request<MetricasScm>('/scm/metricas'),
  getMadurezScm: () => request<MadurezScm>('/scm/madurez'),
  actualizarMadurezScm: (cambios: Partial<Record<keyof Omit<MadurezScm, 'nivel'>, boolean>>) =>
    request<MadurezScm>('/scm/madurez', { method: 'PUT', body: JSON.stringify(cambios) }),
};

export { ApiError };
