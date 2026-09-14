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
  apellido_paterno?: string;
  apellido_materno?: string;
  telefono?: string;
  correo: string;
  rol: 'admin' | 'usuario';
}

export interface UsuarioRegistrado extends UsuarioSesion {
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
  interacciones_por_tipo: Array<{ tipo: 'llamada' | 'correo' | 'reunion'; total: string }>;
  interacciones_por_cliente: Array<{
    cliente_id: number;
    total_interacciones: string;
    cliente: { nombre: string; empresa: string | null };
  }>;
  clientes_sin_interaccion_reciente: Array<{
    id: number;
    nombre: string;
    empresa: string | null;
    etapa_crm: string;
  }>;
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
    try {
      const data = await res.json();
      mensaje = data.error || mensaje;
    } catch {
    }
    throw new ApiError(mensaje);
  }

  if (res.status === 204) return null as T;
  return res.json();
}

export const api = {
  login: (correo: string, password: string) =>
    request<{ token: string; usuario: UsuarioSesion }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, password }),
    }),
  register: (payload: { nombre: string; apellido_paterno: string; apellido_materno: string; correo: string; telefono: string; password: string; rol?: string }) =>
    request<UsuarioSesion>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

  getClientes: (params: { busqueda?: string; estado?: string; etapa_crm?: string } = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v) as [string, string][]
    ).toString();
    return request<{ total: number; clientes: Cliente[] }>(`/clientes${query ? `?${query}` : ''}`);
  },
  getCliente: (id: number) => request<Cliente>(`/clientes/${id}`),
  crearCliente: (payload: Partial<Cliente>) =>
    request<Cliente>('/clientes', { method: 'POST', body: JSON.stringify(payload) }),
  actualizarCliente: (id: number, payload: Partial<Cliente>) =>
    request<Cliente>(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  eliminarCliente: (id: number) => request<null>(`/clientes/${id}`, { method: 'DELETE' }),
  actualizarEtapa: (id: number, etapa_crm: string) =>
    request<Cliente>(`/clientes/${id}/etapa`, { method: 'PUT', body: JSON.stringify({ etapa_crm }) }),

  getInteraccionesDeCliente: (clienteId: number) =>
    request<Interaccion[]>(`/clientes/${clienteId}/interacciones`),
  crearInteraccion: (payload: { cliente_id: number; tipo: string; descripcion: string; fecha?: string }) =>
    request<Interaccion>('/interacciones', { method: 'POST', body: JSON.stringify(payload) }),
  getMiActividad: () => request<Interaccion[]>('/interacciones/mine'),

  getMiPerfil: () => request<UsuarioSesion & { createdAt: string }>('/auth/me'),
  actualizarPerfil: (payload: { nombre: string; correo: string }) =>
    request<UsuarioSesion>('/auth/me', { method: 'PUT', body: JSON.stringify(payload) }),
  actualizarPassword: (payload: { passwordActual: string; passwordNueva: string }) =>
    request<{ mensaje: string }>('/auth/password', { method: 'PUT', body: JSON.stringify(payload) }),
  getUsuarios: () => request<UsuarioRegistrado[]>('/auth/users'),

  getMetricas: () => request<Metricas>('/metricas'),
};

export { ApiError };
