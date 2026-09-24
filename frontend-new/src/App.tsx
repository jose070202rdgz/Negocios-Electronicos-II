import { useEffect, useState } from 'react';
import {
  api, ApiError, clearSession, getStoredUsuario, getToken, setSession,
  type Cliente as ApiCliente,
  type Interaccion as ApiInteraccion,
  type Metricas,
  type Usuario as ApiUsuario,
  type UsuarioSesion,
  type Producto as ApiProducto,
  type Proveedor as ApiProveedor,
  type MovimientoInventario as ApiMovimiento,
  type Pedido as ApiPedido,
  type MetricasScm,
  type MadurezScm,
} from './api';

type Screen =
  | 'login' | 'register'
  | 'dashboard' | 'clients' | 'client-detail'
  | 'interaction-history' | 'global-interactions' | 'crm-stage'
  | 'my-activity' | 'reports'
  | 'evaluaciones' | 'usuarios' | 'configuracion' | 'catalogo'
  | 'scm-home' | 'scm-productos' | 'scm-proveedores'
  | 'scm-inventario' | 'scm-movimientos' | 'scm-logistica'
  | 'scm-pedidos' | 'scm-madurez' | 'scm-reportes';

type Role = 'admin' | 'usuario';

const ESTADO_LABEL: Record<string, 'Activo' | 'Inactivo'> = { activo: 'Activo', inactivo: 'Inactivo' };
const ESTADO_VALUE: Record<string, 'activo' | 'inactivo'> = { Activo: 'activo', Inactivo: 'inactivo' };
const TIPO_LABEL: Record<string, string> = { llamada: 'Llamada', correo: 'Correo', reunion: 'Reunión' };
const TIPO_VALUE: Record<string, string> = { Llamada: 'llamada', Correo: 'correo', Reunión: 'reunion' };
const MOV_TIPO_LABEL: Record<string, 'Entrada' | 'Salida'> = { entrada: 'Entrada', salida: 'Salida' };
const MOV_TIPO_VALUE: Record<string, 'entrada' | 'salida'> = { Entrada: 'entrada', Salida: 'salida' };
const PED_TIPO_LABEL: Record<string, 'Reposición' | 'Venta'> = { reposicion: 'Reposición', venta: 'Venta' };
const PED_TIPO_VALUE: Record<string, 'reposicion' | 'venta'> = { 'Reposición': 'reposicion', Venta: 'venta' };
const PED_ESTADO_LABEL: Record<string, string> = { pendiente: 'Pendiente', en_proceso: 'En proceso', surtido: 'Surtido', cancelado: 'Cancelado' };
const PED_ESTADO_VALUE: Record<string, string> = { Pendiente: 'pendiente', 'En proceso': 'en_proceso', Surtido: 'surtido', Cancelado: 'cancelado' };
const fmtFecha = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtFechaHora = (iso: string) => new Date(iso).toLocaleString('es-MX');

interface AppUser {
  id: number;
  nombre: string;
  correo: string;
  rol: Role;
  estado: 'Activo' | 'Inactivo';
  fechaRegistro: string;
}
const mapUsuario = (u: ApiUsuario): AppUser => ({ id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol, estado: ESTADO_LABEL[u.estado ?? 'activo'], fechaRegistro: fmtFecha(u.createdAt) });

interface Client {
  id: number; nombre: string; empresa: string; correo: string; telefono: string;
  etapaCRM: string; estado: 'Activo' | 'Inactivo'; fechaRegistro: string;
}
const mapCliente = (c: ApiCliente): Client => ({
  id: c.id, nombre: c.nombre, empresa: c.empresa ?? '', correo: c.correo, telefono: c.telefono ?? '',
  etapaCRM: c.etapa_crm, estado: ESTADO_LABEL[c.estado], fechaRegistro: fmtFecha(c.fecha_registro),
});

interface Interaction {
  id: number;
  tipo: string;
  descripcion: string;
  fecha: string;
  usuario: string;
  clienteId: number;
  clienteNombre?: string;
}
const mapInteraccion = (i: ApiInteraccion): Interaction => ({
  id: i.id, tipo: TIPO_LABEL[i.tipo] ?? i.tipo, descripcion: i.descripcion,
  fecha: fmtFechaHora(i.fecha), usuario: i.usuario?.nombre ?? '', clienteId: i.cliente_id,
  clienteNombre: i.cliente?.nombre,
});

const ETAPAS = ['Prospecto', 'Activo', 'Frecuente', 'Inactivo'];

const PRODUCTOS = [
  {
    id: 1,
    nombre: 'Detergente Industrial BrilloMax Pro',
    precio: 349.00,
    unidad: 'Cubeta 20L',
    descripcion: 'Fórmula concentrada de alto rendimiento para superficies industriales. Elimina grasa, aceite y suciedad pesada. Rinde hasta 200 aplicaciones.',
    tags: ['Desengrasante', 'Alta concentración', 'Biodegradable'],
    emoji: '🧴',
    color: 'sky',
  },
  {
    id: 2,
    nombre: 'Desinfectante Hospitalario CleanSafe',
    precio: 189.50,
    unidad: 'Botella 5L',
    descripcion: 'Desinfectante de amplio espectro certificado para uso en clínicas, hospitales y cocinas industriales. Elimina el 99.9% de bacterias y virus.',
    tags: ['Antibacterial', 'Sin enjuague', 'Aroma cítrico'],
    emoji: '🏥',
    color: 'emerald',
  },
  {
    id: 3,
    nombre: 'Multiusos Superficies BrilloShine',
    precio: 95.00,
    unidad: 'Galón 4L',
    descripcion: 'Limpiador multiusos para vidrios, acero inoxidable, mármol y plásticos. Deja superficies brillantes sin residuos ni rayaduras.',
    tags: ['Multiusos', 'Sin alcohol', 'Fragancia lavanda'],
    emoji: '✨',
    color: 'violet',
  },
];

interface ScmProducto {
  id: number; nombre: string; categoria: string; proveedor: string; proveedorId: number | null;
  stock: number; stockMin: number; estrategia: 'PUSH' | 'PULL'; costo: number; descripcion: string;
}
interface ScmProveedor {
  id: number; nombre: string; contacto: string; correo: string; telefono: string; direccion: string;
}
interface ScmMovimiento {
  id: number; fecha: string; producto: string; tipo: 'Entrada' | 'Salida';
  cantidad: number; motivo: string; usuario: string;
}
interface ScmPedido {
  id: number; folio: string; fecha: string; producto: string; cantidad: number;
  tipo: 'Reposición' | 'Venta'; proveedor: string; estado: string; notas: string;
}

const mapScmProducto = (p: ApiProducto): ScmProducto => ({
  id: p.id, nombre: p.nombre, categoria: p.categoria ?? '', proveedor: p.proveedor?.nombre ?? '',
  proveedorId: p.proveedor_id, stock: p.stock_actual, stockMin: p.stock_minimo,
  estrategia: p.estrategia_logistica, costo: Number(p.costo_unitario), descripcion: p.descripcion ?? '',
});
const mapScmProveedor = (p: ApiProveedor): ScmProveedor => ({
  id: p.id, nombre: p.nombre, contacto: p.contacto ?? '', correo: p.correo ?? '', telefono: p.telefono ?? '', direccion: p.direccion ?? '',
});
const mapScmMovimiento = (m: ApiMovimiento): ScmMovimiento => ({
  id: m.id, fecha: fmtFecha(m.fecha), producto: m.producto?.nombre ?? '', tipo: MOV_TIPO_LABEL[m.tipo],
  cantidad: m.cantidad, motivo: m.motivo ?? '', usuario: m.usuario?.nombre ?? '',
});
const mapScmPedido = (p: ApiPedido): ScmPedido => ({
  id: p.id, folio: p.folio, fecha: fmtFecha(p.fecha), producto: p.producto?.nombre ?? '', cantidad: p.cantidad,
  tipo: PED_TIPO_LABEL[p.tipo], proveedor: p.proveedor?.nombre ?? '', estado: PED_ESTADO_LABEL[p.estado], notas: p.notas ?? '',
});

const SCM_CATEGORIAS = ['Cerámica', 'Textil', 'Decoración', 'Joyería'];
const SCM_MOTIVOS    = ['Compra', 'Venta', 'Ajuste', 'Pedido', 'Devolución'];

const nameOk  = (n: string) => n.trim().length >= 3 && !/\d/.test(n);
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const passReqs = (p: string) => ({
  len:     p.length >= 8,
  upper:   /[A-Z]/.test(p),
  number:  /[0-9]/.test(p),
  special: /[!@#$%^&*()\-_=+[\]{}|;:'",.<>?/\\`~]/.test(p),
});
const passOk = (p: string) => Object.values(passReqs(p)).every(Boolean);

function BrilloLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 3C16 3 6 15 6 21a10 10 0 0020 0C26 15 16 3 16 3z" fill="currentColor"/>
      <ellipse cx="12.5" cy="19.5" rx="2.5" ry="3.5" fill="white" opacity="0.2"/>
      <path d="M25 5l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z" fill="currentColor" opacity="0.65"/>
      <circle cx="5.5" cy="10.5" r="1.3" fill="currentColor" opacity="0.4"/>
      <circle cx="20" cy="4"    r="0.9" fill="currentColor" opacity="0.35"/>
    </svg>
  );
}

const IcoGrid     = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x={3} y={3} width={7} height={7} rx={1}/><rect x={14} y={3} width={7} height={7} rx={1}/><rect x={3} y={14} width={7} height={7} rx={1}/><rect x={14} y={14} width={7} height={7} rx={1}/></svg>;
const IcoBriefcase= () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>;
const IcoChat     = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>;
const IcoStar     = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>;
const IcoPeople   = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>;
const IcoClock    = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx={12} cy={12} r={9}/><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3"/></svg>;
const IcoGear     = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx={12} cy={12} r={3}/></svg>;
const IcoPerson   = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>;
const IcoPhone    = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>;
const IcoMail     = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>;
const IcoUsers2   = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>;
const IcoBack     = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>;
const IcoChevR    = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>;
const IcoX        = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>;
const IcoSearch   = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx={11} cy={11} r={7}/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>;
const IcoBell     = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>;
const IcoChevD    = () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>;
const IcoLock     = () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>;
const IcoCheck    = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>;
const IcoEye      = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>;
const IcoEyeOff   = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>;
const IcoPencil   = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>;
const IcoTrash    = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>;
const IcoSpray    = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75H15a.75.75 0 01.75.75v1.5A.75.75 0 0115 6.75H9.75A.75.75 0 019 6V4.5a.75.75 0 01.75-.75z"/><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h10.5a.75.75 0 01.75.75v12a.75.75 0 01-.75.75H6.75A.75.75 0 016 19.5v-12a.75.75 0 01.75-.75z"/><path strokeLinecap="round" strokeLinejoin="round" d="M9 11.25h6M9 14.25h6M9 17.25h3"/></svg>;

function Initials({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const letters = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }[size];
  return <div className={`${sz} rounded-full bg-sky-700 text-white flex items-center justify-center font-semibold shrink-0`}>{letters}</div>;
}

function EtapaBadge({ etapa }: { etapa: string }) {
  const cls: Record<string, string> = {
    Activo:    'bg-emerald-500 text-white',
    Prospecto: 'bg-amber-100 text-amber-600',
    Frecuente: 'bg-sky-700 text-white',
    Inactivo:  'bg-slate-100 text-slate-400',
  };
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${cls[etapa] ?? 'bg-sky-50 text-sky-600'}`}>{etapa}</span>;
}

function StatusBadge({ estado }: { estado: string }) {
  return estado === 'Activo'
    ? <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500 text-white">Activo</span>
    : <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-400">Inactivo</span>;
}

function TipoBadge({ tipo }: { tipo: string }) {
  const cls: Record<string, string> = {
    Llamada: 'bg-sky-900 text-white',
    Correo:  'bg-sky-400 text-white',
    Reunión: 'bg-sky-600 text-white',
  };
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls[tipo] ?? 'bg-sky-50 text-sky-700'}`}>{tipo}</span>;
}

function InteractionIcon({ tipo }: { tipo: string }) {
  const bg = tipo === 'Llamada' ? 'bg-sky-900' : tipo === 'Correo' ? 'bg-sky-400' : 'bg-sky-600';
  const Ic = tipo === 'Llamada' ? IcoPhone : tipo === 'Correo' ? IcoMail : IcoUsers2;
  return <div className={`w-9 h-9 rounded-full ${bg} text-white flex items-center justify-center shrink-0`}><Ic /></div>;
}

function InteractionRow({ tipo, descripcion, fecha, usuario }: { tipo: string; descripcion: string; fecha: string; usuario: string }) {
  return (
    <div className="flex gap-3 items-start">
      <InteractionIcon tipo={tipo} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-sky-900">{tipo}</span>
          <span className="text-xs text-slate-400 shrink-0">{fecha}</span>
        </div>
        <p className="text-sm text-slate-600 mt-0.5 leading-snug">{descripcion}</p>
        <p className="text-xs text-slate-400 mt-0.5">Usuario: {usuario}</p>
      </div>
    </div>
  );
}

function PassReq({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${ok ? 'text-sky-600' : 'text-slate-400'}`}>
      <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${ok ? 'bg-sky-600 text-white' : 'bg-slate-200'}`}>
        {ok ? <IcoCheck /> : null}
      </span>
      {label}
    </div>
  );
}

function DonutChart({ pct = 75 }: { pct?: number }) {
  const r = 50, cx = 62, cy = 62, circ = 2 * Math.PI * r;
  const active = (pct / 100) * circ;
  return (
    <svg width="124" height="124" viewBox="0 0 124 124">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e0f2fe" strokeWidth={18} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#0284c7" strokeWidth={18}
        strokeDasharray={`${active} ${circ - active}`} strokeDashoffset={circ / 4} />
    </svg>
  );
}

function BarChart() {
  const bars = [{ l: 'Llamada', v: 20 }, { l: 'Correo', v: 15 }, { l: 'Reunión', v: 10 }, { l: 'Otro', v: 5 }];
  const fills = ['#0c4a6e', '#0284c7', '#7dd3fc', '#e0f2fe'];
  const H = 72, max = 25;
  return (
    <svg width="200" height="110" viewBox="0 0 200 110">
      {bars.map((b, i) => {
        const bh = (b.v / max) * H;
        const x = 8 + i * 48;
        return (
          <g key={b.l}>
            <rect x={x} y={82 - bh} width={36} height={bh} fill={fills[i]} rx={2} />
            <text x={x + 18} y={98}      textAnchor="middle" fontSize={9} fill="#64748b">{b.l}</text>
            <text x={x + 18} y={78 - bh} textAnchor="middle" fontSize={9} fill="#0369a1">{b.v}</text>
          </g>
        );
      })}
    </svg>
  );
}

function PieChart() {
  const data = [
    { label: 'Prospecto (20)', val: 20, color: '#7dd3fc' },
    { label: 'Activo (56)',    val: 56, color: '#0284c7' },
    { label: 'Frecuente (28)',val: 28, color: '#0c4a6e' },
    { label: 'Inactivo (24)', val: 24, color: '#e0f2fe' },
  ];
  const total = data.reduce((s, d) => s + d.val, 0);
  const cx = 55, cy = 55, r = 48;
  let angle = -Math.PI / 2;
  const slices = data.map(d => {
    const sweep = (d.val / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle), y2 = cy + r * Math.sin(angle);
    return { ...d, path: `M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z` };
  });
  return (
    <div className="flex gap-5 items-start">
      <svg width="110" height="110" viewBox="0 0 110 110">
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth={1.5} />)}
      </svg>
      <div className="flex flex-col gap-2 pt-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: d.color }} />{d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

const IcoShop = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>;
const IcoBox  = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11"/></svg>;
const IcoTruck = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1"/></svg>;
const IcoChart = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>;

const NAV = [
  { label: 'Dashboard',     s: 'dashboard'           as Screen, Icon: IcoGrid,      adminOnly: true  },
  { label: 'Clientes',      s: 'clients'             as Screen, Icon: IcoBriefcase, adminOnly: true  },
  { label: 'Catálogo',      s: 'catalogo'            as Screen, Icon: IcoShop,      adminOnly: false },
  { label: 'SCM',           s: 'scm-home'            as Screen, Icon: IcoBox,       adminOnly: true  },
  { label: 'Interacciones', s: 'global-interactions' as Screen, Icon: IcoChat,      adminOnly: true  },
  { label: 'Evaluaciones',  s: 'evaluaciones'        as Screen, Icon: IcoStar,      adminOnly: true  },
  { label: 'Usuarios',      s: 'usuarios'            as Screen, Icon: IcoPeople,    adminOnly: true  },
  { label: 'Mi actividad',  s: 'my-activity'         as Screen, Icon: IcoClock,     adminOnly: false },
  { label: 'Configuración', s: 'configuracion'       as Screen, Icon: IcoGear,      adminOnly: false },
];

function Sidebar({ screen, setScreen, role }: { screen: Screen; setScreen: (s: Screen) => void; role: Role }) {
  const isActive = (s: Screen) => {
    if (s === 'clients'             && ['clients', 'client-detail', 'crm-stage'].includes(screen)) return true;
    if (s === 'global-interactions' && screen === 'interaction-history') return true;
    if (s === 'scm-home'            && screen.startsWith('scm-')) return true;
    return s === screen;
  };
  return (
    <aside className="w-52 bg-sky-950 text-sky-100 flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-sky-900">
        <div className="flex items-center gap-2.5 mb-1">
          <BrilloLogo size={26} />
          <div>
            <div className="text-sm font-bold tracking-[0.18em] text-white leading-tight">BRILLOMAX</div>
            <div className="text-[9px] text-sky-400 tracking-[0.12em] leading-tight">CRM · Limpieza</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 py-3">
        {NAV.filter(({ adminOnly }) => role === 'admin' || !adminOnly).map(({ label, s, Icon }) => {
          const active = isActive(s);
          return (
            <button key={label} onClick={() => setScreen(s)}
              className={`w-full text-left flex items-center gap-3 px-5 py-2.5 text-[13px] transition-colors border-l-2 ${
                active ? 'bg-sky-800 text-white border-sky-400' : 'text-sky-300 hover:text-white hover:bg-sky-900 border-transparent'
              }`}
            >
              <Icon />
              <span className="flex-1">{label}</span>
            </button>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-sky-900 text-[10px] text-sky-600 leading-relaxed">
        Productos de Limpieza<br/>y Desinfección Industrial
      </div>
    </aside>
  );
}

function TopNav({ screen, setScreen, role, currentUser, onLogout }: {
  screen: Screen; setScreen: (s: Screen) => void;
  role: Role; currentUser: UsuarioSesion | null; onLogout: () => void;
}) {
  const adminTabs = [
    { label: 'Dashboard',    s: 'dashboard'           as Screen },
    { label: 'Clientes',     s: 'clients'             as Screen },
    { label: 'Interacciones',s: 'global-interactions' as Screen },
    { label: 'Reportes',     s: 'reports'             as Screen },
  ];
  const userTabs = [
    { label: 'Catálogo',     s: 'catalogo'            as Screen },
    { label: 'Mi actividad', s: 'my-activity'         as Screen },
    { label: 'Configuración',s: 'configuracion'       as Screen },
  ];
  const tabs = role === 'admin' ? adminTabs : userTabs;
  const isActive = (s: Screen) => {
    if (s === 'clients' && ['clients', 'client-detail', 'crm-stage'].includes(screen)) return true;
    if (s === 'global-interactions' && screen === 'interaction-history') return true;
    return s === screen;
  };
  return (
    <header className="h-12 bg-white border-b border-sky-100 flex items-center px-5 gap-6 shrink-0 shadow-sm">
      <div className="flex gap-5 items-center h-full">
        {tabs.map(t => (
          <button key={t.label} onClick={() => setScreen(t.s)}
            className={`text-[13px] h-full flex items-center border-b-2 transition-colors ${
              isActive(t.s) ? 'text-sky-700 font-medium border-sky-600' : 'text-slate-500 hover:text-sky-700 border-transparent'
            }`}
          >{t.label}</button>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-1">
        <button className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:bg-sky-50 hover:text-sky-700 transition-colors"><IcoSearch /></button>
        <button className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:bg-sky-50 hover:text-sky-700 transition-colors"><IcoBell /></button>
        <button onClick={() => setScreen('configuracion')} className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:bg-sky-50 hover:text-sky-700 transition-colors"><IcoPerson /></button>
        <button onClick={onLogout} className="flex items-center gap-1 text-[13px] text-slate-700 hover:text-sky-700 px-2 py-1 rounded hover:bg-sky-50 transition-colors">
          {currentUser?.nombre.split(' ')[0] ?? (role === 'admin' ? 'Admin' : 'Usuario')} <IcoChevD />
        </button>
      </div>
    </header>
  );
}

export default function App() {
  const [screen, setScreen]       = useState<Screen>(getToken() ? 'dashboard' : 'login');
  const [currentUser, setCurrentUser] = useState<UsuarioSesion | null>(getStoredUsuario());
  const role: Role                = currentUser?.rol ?? 'usuario';

  const [loginEmail, setLoginEmail]   = useState('');
  const [loginPass,  setLoginPass]    = useState('');
  const [loginErr,   setLoginErr]     = useState('');
  const [showLoginP, setShowLoginP]   = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const [regNombre,   setRegNombre]   = useState('');
  const [regPaterno,  setRegPaterno]  = useState('');
  const [regMaterno,  setRegMaterno]  = useState('');
  const [regTel,      setRegTel]      = useState('');
  const [regCorreo,   setRegCorreo]   = useState('');
  const [regPass,     setRegPass]     = useState('');
  const [regErrors,   setRegErrors]   = useState<Record<string, string>>({});
  const [regOk,       setRegOk]       = useState(false);
  const [showRegP,    setShowRegP]    = useState(false);
  const [regLoading,  setRegLoading]  = useState(false);

  const EMPTY_CLIENT: Client = { id: 0, nombre: '', empresa: '', correo: '', telefono: '', etapaCRM: 'Prospecto', estado: 'Activo', fechaRegistro: '' };

  const [clients, setClients]           = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [search, setSearch]             = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const client = selectedClient ?? EMPTY_CLIENT;
  const [clientTab, setClientTab]       = useState<'informacion' | 'interacciones' | 'evaluaciones'>('interacciones');
  const [showModal, setShowModal]       = useState(false); // modal de nueva interacción
  const [carrito, setCarrito]           = useState<Record<number, number>>({});
  const [carritoOpen, setCarritoOpen]   = useState(false);

  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient]     = useState<Client | null>(null);
  const [clientForm, setClientForm]           = useState({ nombre: '', correo: '', telefono: '', empresa: '', estado: 'Activo' as 'Activo' | 'Inactivo' });
  const [clientFormError, setClientFormError] = useState('');

  const agregarAlCarrito = (id: number) => setCarrito(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  const quitarDelCarrito = (id: number) => setCarrito(prev => { const n = { ...prev }; if (n[id] > 1) n[id]--; else delete n[id]; return n; });
  const totalCarrito = Object.values(carrito).reduce((s, q) => s + q, 0);
  const totalPrecio  = Object.entries(carrito).reduce((s, [id, q]) => s + (PRODUCTOS.find(p => p.id === Number(id))?.precio ?? 0) * q, 0);

  const [clientInteractions, setClientInteractions] = useState<Interaction[]>([]);
  const [clientIntLoading, setClientIntLoading]     = useState(false);
  const [myInteractions, setMyInteractions]         = useState<Interaction[]>([]);
  const [myIntLoading, setMyIntLoading]             = useState(false);
  const [myActivities, setMyActivities]             = useState<Interaction[]>([]);
  const [myActLoading, setMyActLoading]             = useState(false);

  const [metricas, setMetricas]           = useState<Metricas | null>(null);
  const [metricasLoading, setMetricasLoading] = useState(false);

  const [users, setUsers]           = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [scmProductos,   setScmProductos]   = useState<ScmProducto[]>([]);
  const [scmProveedores, setScmProveedores] = useState<ScmProveedor[]>([]);
  const [scmMovimientos, setScmMovimientos] = useState<ScmMovimiento[]>([]);
  const [scmPedidos,     setScmPedidos]     = useState<ScmPedido[]>([]);
  const [scmMetricas,    setScmMetricas]    = useState<MetricasScm | null>(null);
  const [scmMadurez,     setScmMadurez]     = useState<MadurezScm | null>(null);
  const [scmLoading,     setScmLoading]     = useState(false);

  const [scmSearch,      setScmSearch]      = useState('');
  const [scmTipoMov,     setScmTipoMov]     = useState('Todos');
  const [scmProdMov,     setScmProdMov]     = useState('Todos');
  const [scmEstPed,      setScmEstPed]      = useState('Todos');
  const [scmTipoPed,     setScmTipoPed]     = useState('Todos');

  const [scmModal, setScmModal] = useState<'producto'|'proveedor'|'movimiento'|'pedido'|null>(null);
  const [editingScmProducto, setEditingScmProducto]   = useState<ScmProducto | null>(null);
  const [editingScmProveedor, setEditingScmProveedor] = useState<ScmProveedor | null>(null);
  const [editingScmPedido, setEditingScmPedido]       = useState<ScmPedido | null>(null);
  const [scmFormError, setScmFormError] = useState('');

  const [scmPF, setScmPF] = useState({ nombre:'', categoria:'Cerámica', proveedor:'', stock:0, stockMin:0, estrategia:'PUSH' as 'PUSH'|'PULL', costo:0, descripcion:'' });
  const [scmPrF, setScmPrF] = useState({ nombre:'', contacto:'', correo:'', telefono:'', direccion:'' });
  const [scmMF, setScmMF] = useState({ producto:'', tipo:'Entrada' as 'Entrada'|'Salida', cantidad:0, motivo:'Compra', fecha:'', usuario:'' });
  const [scmOF, setScmOF] = useState({ producto:'', cantidad:0, tipo:'Reposición' as 'Reposición'|'Venta', proveedor:'', fecha:'', notas:'' });
  const [logProd, setLogProd] = useState('');
  const [logEst,  setLogEst]  = useState<'PUSH'|'PULL'>('PUSH');
  const [logTab,  setLogTab]  = useState<'PUSH'|'PULL'>('PUSH');
  const [intForm, setIntForm]           = useState({ tipo: 'Llamada', descripcion: '', clienteId: 0 });
  const [intFormError, setIntFormError] = useState('');
  const [newStage, setNewStage]         = useState('Prospecto');
  const [stageFilter, setStageFilter]   = useState('Todas');

  const [cfgCurrent, setCfgCurrent]   = useState('');
  const [cfgNew,     setCfgNew]       = useState('');
  const [cfgConfirm, setCfgConfirm]   = useState('');
  const [cfgMsg,     setCfgMsg]       = useState('');
  const [cfgErr,     setCfgErr]       = useState('');

  const [globalError, setGlobalError] = useState('');

  const logout = () => {
    clearSession();
    setCurrentUser(null);
    setScreen('login');
    setLoginEmail(''); setLoginPass(''); setLoginErr('');
    setSelectedClient(null);
  };
  const goToClient = (c: Client) => { setSelectedClient(c); setClientTab('interacciones'); setScreen('client-detail'); };

  async function handleSaveClient() {
    if (!clientForm.nombre || !clientForm.correo) { setClientFormError('Nombre y correo son obligatorios'); return; }
    const payload = { nombre: clientForm.nombre, correo: clientForm.correo, telefono: clientForm.telefono, empresa: clientForm.empresa, estado: ESTADO_VALUE[clientForm.estado] };
    try {
      if (editingClient) {
        const actualizado = mapCliente(await api.actualizarCliente(editingClient.id, payload));
        if (selectedClient?.id === editingClient.id) setSelectedClient(actualizado);
      } else {
        await api.crearCliente(payload);
      }
      setShowClientModal(false);
      reloadClientes();
    } catch (err) {
      setClientFormError(err instanceof ApiError ? err.message : 'No se pudo guardar el cliente');
    }
  }
  async function handleDeleteClient(c: Client) {
    if (!window.confirm(`¿Eliminar a ${c.nombre}? Esta acción no se puede deshacer.`)) return;
    try { await api.eliminarCliente(c.id); reloadClientes(); }
    catch (err) { setGlobalError(err instanceof ApiError ? err.message : 'No se pudo eliminar el cliente'); }
  }
  function openEditClientModal(c: Client) {
    setEditingClient(c);
    setClientForm({ nombre: c.nombre, correo: c.correo, telefono: c.telefono, empresa: c.empresa, estado: c.estado });
    setClientFormError('');
    setShowClientModal(true);
  }

  function abrirNuevaInteraccion(clienteId?: number) {
    setIntForm({ tipo: 'Llamada', descripcion: '', clienteId: clienteId ?? client.id ?? 0 });
    setIntFormError('');
    if (clients.length === 0) reloadClientes();
    setShowModal(true);
  }

  async function handleSaveInteraction() {
    if (!intForm.clienteId) { setIntFormError('Selecciona un cliente'); return; }
    if (!intForm.descripcion.trim()) { setIntFormError('La descripción es obligatoria'); return; }
    try {
      await api.crearInteraccion({ cliente_id: intForm.clienteId, tipo: TIPO_VALUE[intForm.tipo] ?? 'llamada', descripcion: intForm.descripcion });
      setShowModal(false);
      if (screen === 'client-detail' || screen === 'interaction-history') { if (selectedClient) reloadClientInteractions(selectedClient.id); }
      if (screen === 'global-interactions') reloadGlobalInteractions();
    } catch (err) {
      setIntFormError(err instanceof ApiError ? err.message : 'No se pudo registrar la interacción');
    }
  }

  async function reloadClientes() {
    setClientsLoading(true); setGlobalError('');
    try {
      const data = await api.getClientes({ busqueda: search, estado: filterEstado ? ESTADO_VALUE[filterEstado] : undefined });
      setClients(data.clientes.map(mapCliente));
    } catch (err) { setGlobalError(err instanceof ApiError ? err.message : 'No se pudo cargar la lista de clientes'); }
    finally { setClientsLoading(false); }
  }
  async function reloadClientInteractions(clienteId: number) {
    setClientIntLoading(true);
    try { setClientInteractions((await api.getInteraccionesDeCliente(clienteId)).map(mapInteraccion)); }
    catch (err) { setGlobalError(err instanceof ApiError ? err.message : 'No se pudieron cargar las interacciones'); }
    finally { setClientIntLoading(false); }
  }
  async function reloadGlobalInteractions() {
    setMyIntLoading(true);
    try {
      const data = role === 'admin' ? await api.getTodasInteracciones() : await api.getMiActividad();
      setMyInteractions(data.map(mapInteraccion));
    } catch (err) { setGlobalError(err instanceof ApiError ? err.message : 'No se pudieron cargar las interacciones'); }
    finally { setMyIntLoading(false); }
  }
  async function reloadMyActivities() {
    setMyActLoading(true);
    try { setMyActivities((await api.getMiActividad()).map(mapInteraccion)); }
    catch (err) { setGlobalError(err instanceof ApiError ? err.message : 'No se pudo cargar tu actividad'); }
    finally { setMyActLoading(false); }
  }
  async function reloadMetricas() {
    setMetricasLoading(true);
    try { setMetricas(await api.getMetricas()); }
    catch (err) { setGlobalError(err instanceof ApiError ? err.message : 'No se pudieron cargar las métricas'); }
    finally { setMetricasLoading(false); }
  }
  async function reloadUsers() {
    setUsersLoading(true);
    try { setUsers((await api.getUsuarios()).map(mapUsuario)); }
    catch (err) { setGlobalError(err instanceof ApiError ? err.message : 'No se pudo cargar la lista de usuarios'); }
    finally { setUsersLoading(false); }
  }
  const [reportClientesAll, setReportClientesAll] = useState<Client[]>([]);
  const [reportInteraccionesAll, setReportInteraccionesAll] = useState<Interaction[]>([]);
  async function reloadReportesExtra() {
    try {
      const [clientesData, interaccionesData] = await Promise.all([api.getClientes({}), api.getTodasInteracciones()]);
      setReportClientesAll(clientesData.clientes.map(mapCliente));
      setReportInteraccionesAll(interaccionesData.map(mapInteraccion));
    } catch (err) {
      setGlobalError(err instanceof ApiError ? err.message : 'No se pudieron cargar los datos de reportes');
    }
  }

  async function reloadScmBase() {
    setScmLoading(true); setGlobalError('');
    try {
      const [productos, proveedores] = await Promise.all([api.getProductos(), api.getProveedores()]);
      setScmProductos(productos.map(mapScmProducto));
      setScmProveedores(proveedores.map(mapScmProveedor));
    } catch (err) { setGlobalError(err instanceof ApiError ? err.message : 'No se pudo cargar el catálogo SCM'); }
    finally { setScmLoading(false); }
  }
  async function reloadScmMovimientos() {
    setScmLoading(true);
    try { setScmMovimientos((await api.getMovimientos()).map(mapScmMovimiento)); }
    catch (err) { setGlobalError(err instanceof ApiError ? err.message : 'No se pudieron cargar los movimientos'); }
    finally { setScmLoading(false); }
  }
  async function reloadScmPedidos() {
    setScmLoading(true);
    try { setScmPedidos((await api.getPedidos()).map(mapScmPedido)); }
    catch (err) { setGlobalError(err instanceof ApiError ? err.message : 'No se pudieron cargar los pedidos'); }
    finally { setScmLoading(false); }
  }
  async function reloadScmMetricas() {
    setScmLoading(true);
    try { setScmMetricas(await api.getMetricasScm()); }
    catch (err) { setGlobalError(err instanceof ApiError ? err.message : 'No se pudieron cargar las métricas SCM'); }
    finally { setScmLoading(false); }
  }
  async function reloadScmMadurez() {
    setScmLoading(true);
    try { setScmMadurez(await api.getMadurezScm()); }
    catch (err) { setGlobalError(err instanceof ApiError ? err.message : 'No se pudo cargar el nivel de madurez'); }
    finally { setScmLoading(false); }
  }

  useEffect(() => { if (screen === 'clients') reloadClientes(); }, [screen, search, filterEstado]);
  useEffect(() => { if ((screen === 'client-detail' || screen === 'interaction-history') && selectedClient) reloadClientInteractions(selectedClient.id); }, [screen, selectedClient]);
  useEffect(() => { if (screen === 'global-interactions') reloadGlobalInteractions(); }, [screen]);
  useEffect(() => { if (screen === 'my-activity') reloadMyActivities(); }, [screen]);
  useEffect(() => { if (screen === 'dashboard' || screen === 'reports') reloadMetricas(); }, [screen]);
  useEffect(() => { if (screen === 'reports') reloadReportesExtra(); }, [screen]);
  useEffect(() => { if (screen === 'usuarios') reloadUsers(); }, [screen]);
  useEffect(() => {
    if (screen.startsWith('scm-') && screen !== 'scm-home') reloadScmBase();
  }, [screen]);
  useEffect(() => { if (screen === 'scm-movimientos') reloadScmMovimientos(); }, [screen]);
  useEffect(() => { if (screen === 'scm-pedidos') reloadScmPedidos(); }, [screen]);
  useEffect(() => { if (screen === 'scm-reportes') reloadScmMetricas(); }, [screen]);
  useEffect(() => { if (screen === 'scm-madurez') reloadScmMadurez(); }, [screen]);
  useEffect(() => {
    if (screen === 'scm-logistica' && scmProductos.length > 0 && !logProd) {
      setLogProd(scmProductos[0].nombre);
      setLogEst(scmProductos[0].estrategia);
    }
  }, [screen, scmProductos]);

  const handleLogin = async () => {
    setLoginErr('');
    if (!loginEmail.includes('@')) { setLoginErr('El correo debe incluir @'); return; }
    setLoginLoading(true);
    try {
      const { token, usuario } = await api.login(loginEmail, loginPass);
      setSession(token, usuario);
      setCurrentUser(usuario);
      setScreen(usuario.rol === 'admin' ? 'dashboard' : 'catalogo');
    } catch (err) {
      setLoginErr(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoginLoading(false);
    }
  };

  async function handleSaveStage() {
    if (!selectedClient) return;
    try {
      const actualizado = mapCliente(await api.actualizarEtapa(selectedClient.id, newStage));
      setSelectedClient(actualizado);
      setScreen('client-detail');
      reloadClientes();
    } catch (err) {
      setGlobalError(err instanceof ApiError ? err.message : 'No se pudo cambiar la etapa');
    }
  }

  async function handleSaveScmProducto() {
    if (!scmPF.nombre.trim()) { setScmFormError('El nombre es obligatorio'); return; }
    const proveedorSel = scmProveedores.find(p => p.nombre === scmPF.proveedor);
    const payload = {
      nombre: scmPF.nombre, descripcion: scmPF.descripcion, categoria: scmPF.categoria,
      stock_actual: scmPF.stock, stock_minimo: scmPF.stockMin, costo_unitario: scmPF.costo,
      estrategia_logistica: scmPF.estrategia, proveedor_id: proveedorSel?.id ?? null,
    };
    try {
      if (editingScmProducto) await api.actualizarProducto(editingScmProducto.id, payload);
      else await api.crearProducto(payload);
      setScmModal(null);
      reloadScmBase();
    } catch (err) { setScmFormError(err instanceof ApiError ? err.message : 'No se pudo guardar el producto'); }
  }

  async function handleSaveScmProveedor() {
    if (!scmPrF.nombre.trim()) { setScmFormError('El nombre es obligatorio'); return; }
    try {
      if (editingScmProveedor) await api.actualizarProveedor(editingScmProveedor.id, scmPrF);
      else await api.crearProveedor(scmPrF);
      setScmModal(null);
      reloadScmBase();
    } catch (err) { setScmFormError(err instanceof ApiError ? err.message : 'No se pudo guardar el proveedor'); }
  }

  async function handleSaveScmMovimiento() {
    const prod = scmProductos.find(p => p.nombre === scmMF.producto);
    if (!prod) { setScmFormError('Selecciona un producto'); return; }
    if (!scmMF.cantidad || scmMF.cantidad <= 0) { setScmFormError('La cantidad debe ser mayor a 0'); return; }
    try {
      await api.crearMovimiento({ producto_id: prod.id, tipo: MOV_TIPO_VALUE[scmMF.tipo], cantidad: scmMF.cantidad, motivo: scmMF.motivo, fecha: scmMF.fecha || undefined });
      setScmModal(null);
      reloadScmBase();
      if (screen === 'scm-movimientos') reloadScmMovimientos();
    } catch (err) { setScmFormError(err instanceof ApiError ? err.message : 'No se pudo registrar el movimiento'); }
  }

  async function handleSaveScmPedido() {
    const prod = scmProductos.find(p => p.nombre === scmOF.producto);
    if (!prod) { setScmFormError('Selecciona un producto'); return; }
    if (!scmOF.cantidad || scmOF.cantidad <= 0) { setScmFormError('La cantidad debe ser mayor a 0'); return; }
    const prov = scmProveedores.find(p => p.nombre === scmOF.proveedor);
    try {
      if (editingScmPedido) {
        await api.actualizarPedido(editingScmPedido.id, { cantidad: scmOF.cantidad, tipo: PED_TIPO_VALUE[scmOF.tipo] as 'reposicion' | 'venta', proveedor_id: prov?.id, notas: scmOF.notas });
      } else {
        await api.crearPedido({ producto_id: prod.id, proveedor_id: prov?.id, cantidad: scmOF.cantidad, tipo: PED_TIPO_VALUE[scmOF.tipo] as 'reposicion' | 'venta', fecha: scmOF.fecha || undefined, notas: scmOF.notas });
      }
      setScmModal(null);
      reloadScmPedidos();
    } catch (err) { setScmFormError(err instanceof ApiError ? err.message : 'No se pudo guardar el pedido'); }
  }

  if (screen === 'login') return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-sky-100 shadow-md p-8">
        <div className="text-center mb-7">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-sky-600"><BrilloLogo size={32} /></span>
            <div className="text-left">
              <div className="text-xl font-bold tracking-[0.18em] text-sky-900 leading-tight">BRILLOMAX</div>
              <div className="text-[10px] text-sky-400 tracking-widest">CRM · Limpieza</div>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-3">Inicia sesión para continuar</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Correo electrónico</label>
            <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
              placeholder="usuario@brillomax.com"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition placeholder:text-slate-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Contraseña</label>
            <div className="relative">
              <input type={showLoginP ? 'text' : 'password'} value={loginPass} onChange={e => setLoginPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition placeholder:text-slate-400" />
              <button type="button" onClick={() => setShowLoginP(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600">
                {showLoginP ? <IcoEyeOff /> : <IcoEye />}
              </button>
            </div>
          </div>
          {loginErr && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{loginErr}</p>}
          <button onClick={handleLogin} disabled={loginLoading}
            className="w-full bg-sky-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-sky-700 transition-colors disabled:opacity-50">
            {loginLoading ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </div>
        <div className="text-center mt-5">
          <span className="text-xs text-slate-500">¿No tienes cuenta?{' '}</span>
          <button onClick={() => { setRegOk(false); setRegErrors({}); setRegNombre(''); setRegPaterno(''); setRegMaterno(''); setRegTel(''); setRegCorreo(''); setRegPass(''); setScreen('register'); }}
            className="text-xs text-sky-600 font-medium hover:text-sky-800 underline transition-colors">
            Regístrate aquí
          </button>
        </div>
      </div>
    </div>
  );

  const onlyLetters = (v: string) => !/\d/.test(v);
  const handleRegister = async () => {
    const errs: Record<string, string> = {};

    if (!regNombre.trim())            errs.nombre   = 'El nombre es requerido';
    else if (!onlyLetters(regNombre)) errs.nombre   = 'Sin números';
    else if (regNombre.trim().length < 2) errs.nombre = 'Mínimo 2 caracteres';

    if (!regPaterno.trim())             errs.paterno = 'El apellido paterno es requerido';
    else if (!onlyLetters(regPaterno))  errs.paterno = 'Sin números';

    if (regMaterno.trim() && !onlyLetters(regMaterno)) errs.materno = 'Sin números';

    if (!regTel.trim())                errs.tel = 'El teléfono es requerido';
    else if (!/^\d+$/.test(regTel))   errs.tel = 'Solo se permiten números';
    else if (regTel.length !== 10)     errs.tel = 'Debe tener exactamente 10 dígitos';

    if (!regCorreo.trim())               errs.correo = 'El correo es requerido';
    else if (!regCorreo.includes('@'))   errs.correo = 'El correo debe incluir @';
    else if (!emailOk(regCorreo))        errs.correo = 'Ingresa un correo válido (ej. nombre@dominio.com)';

    if (!regPass)            errs.pass = 'La contraseña es requerida';
    else if (!passOk(regPass)) errs.pass = 'La contraseña no cumple los requisitos';

    setRegErrors(errs);
    if (Object.keys(errs).length) return;

    const nombreCompleto = [regNombre.trim(), regPaterno.trim(), regMaterno.trim()].filter(Boolean).join(' ');
    setRegLoading(true);
    try {
      await api.register({ nombre: nombreCompleto, correo: regCorreo.toLowerCase(), password: regPass, rol: 'usuario' });
      setRegOk(true);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo completar el registro';
      setRegErrors(prev => ({ ...prev, correo: msg }));
    } finally {
      setRegLoading(false);
    }
  };

  const pr = passReqs(regPass);

  if (screen === 'register') return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center py-8">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-sky-100 shadow-md p-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-sky-600"><BrilloLogo size={28} /></span>
            <div className="text-left">
              <div className="text-lg font-bold tracking-[0.18em] text-sky-900 leading-tight">BRILLOMAX</div>
              <div className="text-[9px] text-sky-400 tracking-widest">CRM · Limpieza</div>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-2">Crea tu cuenta</p>
        </div>

        {regOk ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-3 text-sky-600"><IcoCheck /></div>
            <p className="text-sm font-medium text-sky-900 mb-1">¡Registro exitoso!</p>
            <p className="text-xs text-slate-500 mb-5">Tu cuenta fue creada correctamente. Inicia sesión para continuar.</p>
            <button onClick={() => setScreen('login')}
              className="w-full bg-sky-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-sky-700 transition-colors">
              Ir al inicio de sesión
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nombre(s)</label>
              <input type="text" value={regNombre}
                onChange={e => { setRegNombre(e.target.value); if (regErrors.nombre) setRegErrors(p => ({ ...p, nombre: '' })); }}
                placeholder="Ej. Ana"
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 transition placeholder:text-slate-300 ${regErrors.nombre ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500'}`} />
              {regErrors.nombre && <p className="text-xs text-red-500 mt-0.5">{regErrors.nombre}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Apellido paterno</label>
                <input type="text" value={regPaterno}
                  onChange={e => { setRegPaterno(e.target.value); if (regErrors.paterno) setRegErrors(p => ({ ...p, paterno: '' })); }}
                  placeholder="Ej. García"
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 transition placeholder:text-slate-300 ${regErrors.paterno ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500'}`} />
                {regErrors.paterno && <p className="text-xs text-red-500 mt-0.5">{regErrors.paterno}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Apellido materno</label>
                <input type="text" value={regMaterno}
                  onChange={e => { setRegMaterno(e.target.value); if (regErrors.materno) setRegErrors(p => ({ ...p, materno: '' })); }}
                  placeholder="Ej. López"
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 transition placeholder:text-slate-300 ${regErrors.materno ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500'}`} />
                {regErrors.materno && <p className="text-xs text-red-500 mt-0.5">{regErrors.materno}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Número de teléfono</label>
              <input
                type="tel"
                inputMode="numeric"
                value={regTel}
                maxLength={10}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setRegTel(v);
                  if (regErrors.tel) setRegErrors(p => ({ ...p, tel: '' }));
                }}
                placeholder="10 dígitos"
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 transition placeholder:text-slate-300 ${regErrors.tel ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500'}`} />
              <div className="flex items-center justify-between mt-0.5">
                {regErrors.tel ? <p className="text-xs text-red-500">{regErrors.tel}</p> : <span />}
                <p className={`text-xs ${regTel.length === 10 ? 'text-sky-500' : 'text-slate-400'}`}>{regTel.length}/10</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Correo electrónico</label>
              <input type="email" value={regCorreo}
                onChange={e => { setRegCorreo(e.target.value); if (regErrors.correo) setRegErrors(p => ({ ...p, correo: '' })); }}
                placeholder="nombre@dominio.com"
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 transition placeholder:text-slate-300 ${regErrors.correo ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500'}`} />
              {regErrors.correo && <p className="text-xs text-red-500 mt-0.5">{regErrors.correo}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <input type={showRegP ? 'text' : 'password'} value={regPass}
                  onChange={e => { setRegPass(e.target.value); if (regErrors.pass) setRegErrors(p => ({ ...p, pass: '' })); }}
                  placeholder="Mín. 8 caracteres"
                  className={`w-full border rounded-lg px-3 py-2 pr-10 text-sm outline-none focus:ring-1 transition placeholder:text-slate-400 ${regErrors.pass ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500'}`} />
                <button type="button" onClick={() => setShowRegP(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600">
                  {showRegP ? <IcoEyeOff /> : <IcoEye />}
                </button>
              </div>
              {regErrors.pass && <p className="text-xs text-red-500 mt-0.5">{regErrors.pass}</p>}
              {regPass.length > 0 ? (
                <div className="mt-2 grid grid-cols-2 gap-1">
                  <PassReq ok={pr.len}     label="Mín. 8 caracteres" />
                  <PassReq ok={pr.upper}   label="Una mayúscula" />
                  <PassReq ok={pr.number}  label="Un número" />
                  <PassReq ok={pr.special} label="Un carácter especial (!@#$…)" />
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">Requiere mayúscula, número y carácter especial (!@#$…)</p>
              )}
            </div>

            <button onClick={handleRegister} disabled={regLoading}
              className="w-full bg-sky-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-sky-700 transition-colors disabled:opacity-50">
              {regLoading ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </div>
        )}

        {!regOk && (
          <div className="text-center mt-4">
            <span className="text-xs text-slate-500">¿Ya tienes cuenta?{' '}</span>
            <button onClick={() => setScreen('login')} className="text-xs text-sky-600 font-medium hover:text-sky-800 underline">Inicia sesión</button>
          </div>
        )}
      </div>
    </div>
  );

  const filteredClients = clients;

  return (
    <div className="flex h-screen bg-sky-50 overflow-hidden">
      <Sidebar screen={screen} setScreen={setScreen} role={role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav screen={screen} setScreen={setScreen} role={role} currentUser={currentUser} onLogout={logout} />
        <main className="flex-1 overflow-auto">

          {screen === 'dashboard' && (
            <div className="p-6 max-w-5xl">
              <h1 className="text-xl font-semibold text-sky-900 mb-0.5">Resumen CRM</h1>
              <p className="text-sm text-slate-400 mb-5">Vista general de indicadores clave · Productos de Limpieza</p>
              {metricasLoading && <p className="text-sm text-slate-400 mb-4">Cargando métricas…</p>}
              {metricas && (
                <>
                  <div className="grid grid-cols-4 gap-4 mb-5">
                    {[
                      { label: 'Total de clientes',         value: String(metricas.total_clientes), sub: 'Todos los clientes', hi: false, dim: false },
                      { label: 'Clientes activos',          value: String(metricas.clientes_activos), sub: metricas.total_clientes ? `${Math.round((metricas.clientes_activos / metricas.total_clientes) * 100)}% del total` : '', hi: true, dim: false },
                      { label: 'Interacciones registradas', value: String(metricas.interacciones_por_cliente.reduce((s, r) => s + Number(r.total_interacciones), 0)), sub: 'Total acumulado', hi: true, dim: false },
                      { label: 'Clientes sin interacción',  value: String(metricas.clientes_sin_interaccion_reciente.length), sub: 'Últimos 30 días', hi: false, dim: true },
                    ].map(s => (
                      <div key={s.label} className="bg-white rounded-xl border border-sky-100 p-4 shadow-sm">
                        <p className="text-xs text-slate-500 leading-snug mb-2">{s.label}</p>
                        <p className={`text-3xl font-bold ${s.dim ? 'text-amber-500' : s.hi ? 'text-sky-600' : 'text-sky-900'}`}>{s.value}</p>
                        <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-sky-100 p-4 shadow-sm">
                      <h2 className="text-sm font-semibold text-sky-900 mb-4">Clientes activos vs inactivos</h2>
                      <div className="flex items-center gap-5">
                        <DonutChart pct={metricas.total_clientes ? (metricas.clientes_activos / metricas.total_clientes) * 100 : 0} />
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2.5 text-sm"><div className="w-3 h-3 rounded-sm bg-sky-600" /><span className="text-slate-700">Activos <strong>{metricas.clientes_activos}</strong></span></div>
                          <div className="flex items-center gap-2.5 text-sm"><div className="w-3 h-3 rounded-sm bg-sky-100 border border-sky-200" /><span className="text-slate-700">Inactivos <strong>{metricas.clientes_inactivos}</strong></span></div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-sky-100 p-4 shadow-sm">
                      <h2 className="text-sm font-semibold text-sky-900 mb-3">Clientes en riesgo</h2>
                      {metricas.clientes_sin_interaccion_reciente.length === 0 && (
                        <p className="text-xs text-slate-400 py-2">Ningún cliente en riesgo por ahora.</p>
                      )}
                      {metricas.clientes_sin_interaccion_reciente.slice(0, 5).map((c, i, arr) => (
                        <div key={c.id} className={`flex items-start justify-between py-2.5 ${i < arr.length - 1 ? 'border-b border-sky-50' : ''}`}>
                          <div>
                            <p className="text-sm font-medium text-sky-900">{c.nombre}</p>
                            <p className="text-xs text-slate-400">{c.empresa ?? 'Sin empresa'} · sin interacción reciente</p>
                          </div>
                          <span className="text-sky-300"><IcoChevR /></span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {screen === 'clients' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-semibold text-sky-900">Clientes</h1>
                <button onClick={() => { setEditingClient(null); setClientForm({ nombre: '', correo: '', telefono: '', empresa: '', estado: 'Activo' }); setClientFormError(''); setShowClientModal(true); }}
                  className="bg-sky-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors shadow-sm">+ Nuevo cliente</button>
              </div>
              <div className="flex gap-3 mb-4">
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, empresa, correo..."
                  className="flex-1 border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-white placeholder:text-slate-300" />
                <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
                  className="border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 bg-white text-slate-600">
                  <option value="">Todos</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
              <div className="bg-white rounded-xl border border-sky-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sky-100 bg-sky-50">
                      {['ID', 'Nombre', 'Empresa', 'Correo', 'Teléfono', 'Etapa CRM', 'Estado', 'Acciones'].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-sky-600 px-4 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clientsLoading && (
                      <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400 text-sm">Cargando clientes…</td></tr>
                    )}
                    {!clientsLoading && filteredClients.length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400 text-sm">No hay clientes que coincidan con la búsqueda.</td></tr>
                    )}
                    {filteredClients.map(c => (
                      <tr key={c.id} className="border-b border-sky-50 last:border-0 hover:bg-sky-50 transition-colors">
                        <td className="px-4 py-3 text-slate-400">{c.id}</td>
                        <td className="px-4 py-3 font-medium text-sky-900 whitespace-nowrap">{c.nombre}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.empresa}</td>
                        <td className="px-4 py-3 text-slate-600">{c.correo}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.telefono}</td>
                        <td className="px-4 py-3"><EtapaBadge etapa={c.etapaCRM} /></td>
                        <td className="px-4 py-3"><StatusBadge estado={c.estado} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => goToClient(c)} title="Ver detalle" className="text-slate-400 hover:text-sky-600 transition-colors"><IcoEye /></button>
                            <button onClick={() => openEditClientModal(c)} title="Editar" className="text-amber-400 hover:text-amber-600 transition-colors"><IcoPencil /></button>
                            <button onClick={() => handleDeleteClient(c)} title="Eliminar" className="text-slate-300 hover:text-red-400 transition-colors"><IcoTrash /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-3 border-t border-sky-50 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Mostrando {filteredClients.length} cliente(s)</span>
                </div>
              </div>
            </div>
          )}

          {screen === 'client-detail' && (
            <div className="p-6">
              <button onClick={() => setScreen('clients')} className="flex items-center gap-1.5 text-sm text-sky-500 hover:text-sky-800 mb-4 transition-colors">
                <IcoBack /> Volver a clientes
              </button>
              <div className="bg-white rounded-xl border border-sky-100 p-5 mb-4 shadow-sm">
                <div className="flex items-center gap-4 mb-5">
                  <Initials name={client.nombre} size="lg" />
                  <div><h1 className="text-lg font-semibold text-sky-900">{client.nombre}</h1><div className="mt-1"><StatusBadge estado={client.estado} /></div></div>
                </div>
                <div className="grid grid-cols-3 gap-x-6 gap-y-4 mb-5">
                  {[
                    { label: 'Empresa', val: client.empresa },
                    { label: 'Etapa CRM', etapa: client.etapaCRM },
                    { label: 'Correo', val: client.correo },
                    { label: 'Fecha de registro', val: client.fechaRegistro },
                    { label: 'Teléfono', val: client.telefono },
                    { label: 'Estado', estado: client.estado },
                  ].map((f, i) => (
                    <div key={i}>
                      <p className="text-xs text-slate-400 mb-1">{f.label}</p>
                      {'etapa' in f ? <EtapaBadge etapa={f.etapa!} /> : 'estado' in f ? <StatusBadge estado={f.estado!} /> : <p className="text-sm text-sky-900">{f.val}</p>}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditClientModal(client)} className="px-4 py-2 text-sm border border-sky-200 rounded-lg hover:bg-sky-50 text-sky-700 transition-colors">Editar cliente</button>
                  <button onClick={() => { setNewStage(client.etapaCRM); setScreen('crm-stage'); }} className="px-4 py-2 text-sm border border-sky-200 rounded-lg hover:bg-sky-50 text-sky-700 transition-colors">Cambiar etapa</button>
                </div>
              </div>
              <div className="flex border-b border-sky-100 mb-4">
                {(['informacion', 'interacciones', 'evaluaciones'] as const).map(tab => (
                  <button key={tab} onClick={() => setClientTab(tab)}
                    className={`px-4 py-2.5 text-sm capitalize border-b-2 transition-colors ${clientTab === tab ? 'text-sky-700 font-medium border-sky-600 -mb-px' : 'text-slate-500 hover:text-sky-600 border-transparent'}`}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              {clientTab === 'interacciones' && (
                <div className="bg-white rounded-xl border border-sky-100 shadow-sm">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-sky-50">
                    <h2 className="text-sm font-semibold text-sky-900">Historial de interacciones – {client.nombre}</h2>
                    <button onClick={() => abrirNuevaInteraccion(client.id)}
                      className="bg-sky-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-sky-700 transition-colors">
                      + Nueva Interacción
                    </button>
                  </div>
                  <div className="p-5 space-y-0">
                    {clientIntLoading
                      ? <p className="text-sm text-slate-400 py-2">Cargando…</p>
                      : clientInteractions.length === 0
                      ? <p className="text-sm text-slate-400 py-2">No hay interacciones para este cliente.</p>
                      : clientInteractions.map((int, i) => (
                          <div key={int.id}>
                            <InteractionRow tipo={int.tipo} descripcion={int.descripcion} fecha={int.fecha} usuario={int.usuario} />
                            {i < clientInteractions.length - 1 && <div className="border-b border-sky-50 my-4" />}
                          </div>
                        ))}
                  </div>
                </div>
              )}
              {clientTab === 'informacion' && <div className="bg-white rounded-xl border border-sky-100 p-5 text-sm text-slate-400 shadow-sm">Información adicional del cliente.</div>}
              {clientTab === 'evaluaciones' && <div className="bg-white rounded-xl border border-sky-100 p-5 text-sm text-slate-400 shadow-sm">No hay evaluaciones registradas para este cliente.</div>}
            </div>
          )}

          {screen === 'interaction-history' && (
            <div className="p-6">
              <button onClick={() => setScreen('client-detail')} className="flex items-center gap-1.5 text-sm text-sky-500 hover:text-sky-800 mb-4 transition-colors"><IcoBack /> Volver a cliente</button>
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-semibold text-sky-900">Historial de interacciones – {client.nombre}</h1>
                <button onClick={() => abrirNuevaInteraccion(client.id)} className="bg-sky-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors shadow-sm">+ Nueva Interacción</button>
              </div>
              <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-sm">
                {clientIntLoading
                  ? <p className="text-sm text-slate-400">Cargando…</p>
                  : clientInteractions.length === 0
                  ? <p className="text-sm text-slate-400">No hay interacciones registradas.</p>
                  : clientInteractions.map((int, i) => (
                      <div key={int.id}>
                        <InteractionRow tipo={int.tipo} descripcion={int.descripcion} fecha={int.fecha} usuario={int.usuario} />
                        {i < clientInteractions.length - 1 && <div className="border-b border-sky-50 my-4" />}
                      </div>
                    ))}
              </div>
            </div>
          )}

          {screen === 'global-interactions' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h1 className="text-xl font-semibold text-sky-900">Interacciones</h1>
                  <p className="text-sm text-slate-400">{role === 'admin' ? 'Todas las interacciones' : 'Mis interacciones'}</p>
                </div>
                <button onClick={() => abrirNuevaInteraccion()} className="bg-sky-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors shadow-sm">+ Nueva Interacción</button>
              </div>
              <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-sm space-y-0">
                {myIntLoading
                  ? <p className="text-sm text-slate-400">Cargando…</p>
                  : myInteractions.length === 0
                  ? <p className="text-sm text-slate-400">No hay interacciones registradas.</p>
                  : myInteractions.map((int, i) => (
                      <div key={int.id}>
                        <InteractionRow tipo={int.tipo} descripcion={int.descripcion} fecha={int.fecha} usuario={int.usuario} />
                        {i < myInteractions.length - 1 && <div className="border-b border-sky-50 my-4" />}
                      </div>
                    ))}
              </div>
            </div>
          )}

          {screen === 'crm-stage' && (
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 max-w-2xl">
                <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-sm">
                  <h1 className="text-base font-semibold text-sky-900 mb-0.5">Editar etapa CRM</h1>
                  <p className="text-sm text-slate-400 mb-5">{client.nombre}</p>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Nueva etapa</label>
                  <select value={newStage} onChange={e => { setNewStage(e.target.value); setStageFilter(e.target.value); }}
                    className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-white mb-4">
                    {ETAPAS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 text-xs text-slate-500 mb-5 leading-relaxed">
                    Los cambios en la etapa ayudan a dar mejor seguimiento y priorizar a tus clientes.
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setScreen('client-detail')} className="flex-1 py-2 text-sm border border-sky-200 rounded-lg hover:bg-sky-50 text-sky-700 transition-colors">Cancelar</button>
                    <button onClick={handleSaveStage} className="flex-1 py-2 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">Guardar cambios</button>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-sky-900 mb-3">Filtrar por etapa</h2>
                  <div className="space-y-1">
                    {['Todas', ...ETAPAS].map(s => (
                      <button key={s} onClick={() => setStageFilter(s)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${stageFilter === s ? 'bg-sky-600 text-white' : 'text-slate-700 hover:bg-sky-50'}`}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {screen === 'my-activity' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-semibold text-sky-900">Mi actividad</h1>
                <div className="flex items-center gap-2">
                  <input type="date" defaultValue="2025-05-01" className="border border-sky-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-sky-500 bg-white text-slate-600" />
                  <span className="text-slate-300">–</span>
                  <input type="date" defaultValue="2025-05-16" className="border border-sky-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-sky-500 bg-white text-slate-600" />
                </div>
              </div>
              <div className="bg-white rounded-xl border border-sky-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sky-100 bg-sky-50">
                      {['Fecha', 'Cliente', 'Tipo', 'Descripción'].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-sky-600 px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myActLoading
                      ? <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">Cargando…</td></tr>
                      : myActivities.length === 0
                      ? <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">No hay actividades registradas.</td></tr>
                      : myActivities.map((a, i) => (
                          <tr key={i} className="border-b border-sky-50 last:border-0 hover:bg-sky-50 transition-colors">
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{a.fecha}</td>
                            <td className="px-4 py-3 font-medium text-sky-900 whitespace-nowrap">{a.clienteNombre ?? '—'}</td>
                            <td className="px-4 py-3"><TipoBadge tipo={a.tipo} /></td>
                            <td className="px-4 py-3 text-slate-600">{a.descripcion}</td>
                          </tr>
                        ))}
                  </tbody>
                </table>
                <div className="px-4 py-3 border-t border-sky-50">
                  <span className="text-xs text-slate-400">Mostrando {myActivities.length} actividades</span>
                </div>
              </div>
            </div>
          )}

          {screen === 'reports' && metricas && (() => {
            const totalClientes  = metricas.total_clientes;
            const activosCount   = metricas.clientes_activos;
            const activosPct     = totalClientes ? Math.round((activosCount / totalClientes) * 100) : 0;
            const intTotal       = metricas.interacciones_por_cliente.reduce((s, r) => s + Number(r.total_interacciones), 0);
            const sinInt         = metricas.clientes_sin_interaccion_reciente.length;
            const sinIntPct      = totalClientes ? Math.round((sinInt / totalClientes) * 100) : 0;

            const byTipo: Record<string, number> = {};
            reportInteraccionesAll.forEach(i => { byTipo[i.tipo] = (byTipo[i.tipo] ?? 0) + 1; });

            const byEtapa: Record<string, number> = {};
            reportClientesAll.forEach(c => { byEtapa[c.etapaCRM] = (byEtapa[c.etapaCRM] ?? 0) + 1; });

            const tipoEntries = Object.entries(byTipo);
            const maxTipo     = Math.max(...tipoEntries.map(([,v]) => v), 1);
            const etapaColors: Record<string, string> = { Prospecto: '#7dd3fc', Activo: '#0284c7', Frecuente: '#0c4a6e', Inactivo: '#e0f2fe' };
            const etapaEntries = ETAPAS.map(e => ({ label: e, val: byEtapa[e] ?? 0, color: etapaColors[e] }));
            const etapaTotal   = etapaEntries.reduce((s, e) => s + e.val, 0) || 1;

            let angle = -Math.PI / 2;
            const cx2 = 55, cy2 = 55, r2 = 48;
            const slices2 = etapaEntries.map(d => {
              const sweep = (d.val / etapaTotal) * 2 * Math.PI;
              const x1 = cx2 + r2 * Math.cos(angle), y1 = cy2 + r2 * Math.sin(angle);
              angle += sweep;
              const x2 = cx2 + r2 * Math.cos(angle), y2 = cy2 + r2 * Math.sin(angle);
              return { ...d, path: `M${cx2},${cy2} L${x1.toFixed(2)},${y1.toFixed(2)} A${r2},${r2} 0 ${sweep > Math.PI ? 1 : 0} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z` };
            });

            const barFills = ['#0c4a6e', '#0284c7', '#7dd3fc', '#e0f2fe'];
            const BAR_H = 72;

            return (
              <div className="p-6 max-w-5xl">
                <h1 className="text-xl font-semibold text-sky-900 mb-5">Reportes y métricas</h1>
                <div className="grid grid-cols-4 gap-4 mb-5">
                  <div className="bg-white rounded-xl border border-sky-100 p-4 shadow-sm">
                    <p className="text-xs text-slate-500 leading-snug mb-2">Total de clientes</p>
                    <p className="text-3xl font-bold text-sky-900">{totalClientes}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-sky-100 p-4 shadow-sm">
                    <p className="text-xs text-slate-500 leading-snug mb-2">Clientes activos</p>
                    <p className="text-3xl font-bold text-sky-600">{activosCount}</p>
                    <p className="text-xs text-sky-500 mt-1">{activosPct}%</p>
                  </div>
                  <div className="bg-white rounded-xl border border-sky-100 p-4 shadow-sm">
                    <p className="text-xs text-slate-500 leading-snug mb-2">Interacciones registradas</p>
                    <p className="text-3xl font-bold text-sky-600">{intTotal}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-sky-100 p-4 shadow-sm">
                    <p className="text-xs text-slate-500 leading-snug mb-2">Clientes sin interacción</p>
                    <p className="text-3xl font-bold text-amber-500">{sinInt}</p>
                    <p className="text-xs text-slate-400 mt-1">{sinIntPct}% del total</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-sky-900 mb-4">Interacciones por tipo</h2>
                    {tipoEntries.length === 0
                      ? <p className="text-sm text-slate-400">Sin datos aún.</p>
                      : (
                        <svg width="220" height="110" viewBox="0 0 220 110">
                          {tipoEntries.map(([tipo, val], i) => {
                            const bh = (val / maxTipo) * BAR_H;
                            const x  = 8 + i * 52;
                            return (
                              <g key={tipo}>
                                <rect x={x} y={82 - bh} width={38} height={bh} fill={barFills[i % barFills.length]} rx={2} />
                                <text x={x + 19} y={98} textAnchor="middle" fontSize={9} fill="#64748b">{tipo}</text>
                                <text x={x + 19} y={78 - bh} textAnchor="middle" fontSize={9} fill="#0369a1">{val}</text>
                              </g>
                            );
                          })}
                        </svg>
                      )}
                  </div>
                  <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-sky-900 mb-4">Clientes por etapa CRM</h2>
                    <div className="flex gap-5 items-start">
                      <svg width="110" height="110" viewBox="0 0 110 110">
                        {slices2.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth={1.5} />)}
                      </svg>
                      <div className="flex flex-col gap-2 pt-1">
                        {etapaEntries.map((d, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                            <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: d.color }} />
                            {d.label} ({d.val})
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {screen === 'catalogo' && (
            <div className="p-6 max-w-5xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-semibold text-sky-900">Catálogo de Productos</h1>
                  <p className="text-sm text-slate-400">Productos de limpieza y desinfección industrial</p>
                </div>
                <button onClick={() => setCarritoOpen(v => !v)}
                  className="relative flex items-center gap-2 bg-sky-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors shadow-sm">
                  <IcoShop />
                  Carrito
                  {totalCarrito > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {totalCarrito}
                    </span>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-5">
                {PRODUCTOS.map(p => {
                  const qty = carrito[p.id] ?? 0;
                  const accentBg: Record<string, string> = { sky: 'bg-sky-50', emerald: 'bg-emerald-50', violet: 'bg-violet-50' };
                  const accentText: Record<string, string> = { sky: 'text-sky-600', emerald: 'text-emerald-600', violet: 'text-violet-600' };
                  const accentBtn: Record<string, string> = { sky: 'bg-sky-600 hover:bg-sky-700', emerald: 'bg-emerald-600 hover:bg-emerald-700', violet: 'bg-violet-600 hover:bg-violet-700' };
                  const accentBorder: Record<string, string> = { sky: 'border-sky-100', emerald: 'border-emerald-100', violet: 'border-violet-100' };
                  return (
                    <div key={p.id} className={`bg-white rounded-2xl border ${accentBorder[p.color]} shadow-sm overflow-hidden flex flex-col`}>
                      <div className={`${accentBg[p.color]} flex items-center justify-center h-36 text-6xl`}>
                        {p.emoji}
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h2 className="text-sm font-semibold text-sky-900 leading-snug mb-1">{p.nombre}</h2>
                        <p className={`text-xs font-medium ${accentText[p.color]} mb-2`}>{p.unidad}</p>
                        <p className="text-xs text-slate-500 leading-relaxed mb-3 flex-1">{p.descripcion}</p>
                        <div className="flex flex-wrap gap-1 mb-4">
                          {p.tags.map(t => (
                            <span key={t} className={`text-[10px] px-2 py-0.5 rounded-full ${accentBg[p.color]} ${accentText[p.color]} font-medium`}>{t}</span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <div>
                            <p className="text-lg font-bold text-sky-900">${p.precio.toFixed(2)}</p>
                            <p className="text-[10px] text-slate-400">por {p.unidad}</p>
                          </div>
                          {qty === 0 ? (
                            <button onClick={() => agregarAlCarrito(p.id)}
                              className={`${accentBtn[p.color]} text-white text-xs px-3 py-1.5 rounded-lg transition-colors`}>
                              + Agregar
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button onClick={() => quitarDelCarrito(p.id)}
                                className="w-7 h-7 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center text-base leading-none transition-colors">−</button>
                              <span className="text-sm font-semibold text-sky-900 w-4 text-center">{qty}</span>
                              <button onClick={() => agregarAlCarrito(p.id)}
                                className={`w-7 h-7 rounded-full ${accentBtn[p.color]} text-white flex items-center justify-center text-base leading-none transition-colors`}>+</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {carritoOpen && (
                <div className="mt-6 bg-white rounded-2xl border border-sky-100 shadow-sm p-5">
                  <h2 className="text-base font-semibold text-sky-900 mb-4">Resumen del carrito</h2>
                  {totalCarrito === 0 ? (
                    <p className="text-sm text-slate-400">El carrito está vacío.</p>
                  ) : (
                    <>
                      <div className="space-y-3 mb-4">
                        {Object.entries(carrito).map(([id, qty]) => {
                          const prod = PRODUCTOS.find(p => p.id === Number(id))!;
                          return (
                            <div key={id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{prod.emoji}</span>
                                <div>
                                  <p className="font-medium text-sky-900 leading-tight">{prod.nombre}</p>
                                  <p className="text-xs text-slate-400">{prod.unidad}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-sky-900">${(prod.precio * qty).toFixed(2)}</p>
                                <p className="text-xs text-slate-400">×{qty} u.</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="border-t border-sky-50 pt-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400">{totalCarrito} producto(s)</p>
                          <p className="text-lg font-bold text-sky-900">Total: ${totalPrecio.toFixed(2)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setCarrito({})} className="text-xs text-slate-400 hover:text-red-500 underline transition-colors">Vaciar</button>
                          <button className="bg-sky-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors">Confirmar pedido</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {screen === 'evaluaciones' && (
            <div className="p-6">
              <h1 className="text-xl font-semibold text-sky-900 mb-1">Evaluaciones</h1>
              <p className="text-sm text-slate-400 mb-6">Evaluaciones de calidad y satisfacción de clientes</p>
              <div className="bg-white rounded-xl border border-sky-100 p-12 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center mb-4 text-sky-300"><IcoStar /></div>
                <p className="text-base font-medium text-sky-900 mb-1">Sin evaluaciones registradas</p>
                <p className="text-sm text-slate-400 max-w-xs">Las evaluaciones de clientes aparecerán aquí una vez que sean registradas.</p>
                <button className="mt-5 bg-sky-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-sky-700 transition-colors">+ Nueva evaluación</button>
              </div>
            </div>
          )}

          {screen === 'usuarios' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h1 className="text-xl font-semibold text-sky-900">Usuarios</h1>
                  <p className="text-sm text-slate-400">Gestión de cuentas registradas</p>
                </div>
                <span className="text-xs bg-sky-100 text-sky-700 px-3 py-1 rounded-full font-medium">{users.length} usuarios</span>
              </div>
              <div className="bg-white rounded-xl border border-sky-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sky-100 bg-sky-50">
                      {['ID', 'Nombre', 'Correo', 'Rol', 'Estado', 'Registro', 'Acciones'].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-sky-600 px-4 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading && (
                      <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400 text-sm">Cargando usuarios…</td></tr>
                    )}
                    {!usersLoading && users.map(u => (
                      <tr key={u.id} className="border-b border-sky-50 last:border-0 hover:bg-sky-50 transition-colors">
                        <td className="px-4 py-3 text-slate-400">{u.id}</td>
                        <td className="px-4 py-3 font-medium text-sky-900 whitespace-nowrap">{u.nombre}</td>
                        <td className="px-4 py-3 text-slate-600">{u.correo}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${u.rol === 'admin' ? 'bg-sky-900 text-white' : 'bg-sky-100 text-sky-700'}`}>
                            {u.rol === 'admin' ? 'Admin' : 'Usuario'}
                          </span>
                        </td>
                        <td className="px-4 py-3"><StatusBadge estado={u.estado} /></td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{u.fechaRegistro}</td>
                        <td className="px-4 py-3">
                          <button
                            disabled={u.id === currentUser?.id}
                            onClick={async () => {
                              try {
                                await api.actualizarEstadoUsuario(u.id, u.estado === 'Activo' ? 'inactivo' : 'activo');
                                reloadUsers();
                              } catch (err) { setGlobalError(err instanceof ApiError ? err.message : 'No se pudo actualizar el usuario'); }
                            }}
                            className={`text-xs underline transition-colors ${u.id === currentUser?.id ? 'text-slate-300 cursor-not-allowed' : u.estado === 'Activo' ? 'text-amber-500 hover:text-amber-700' : 'text-sky-600 hover:text-sky-900'}`}
                          >
                            {u.id === currentUser?.id ? 'Tú' : u.estado === 'Activo' ? 'Deshabilitar' : 'Habilitar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {screen === 'configuracion' && (
            <div className="p-6 max-w-xl">
              <h1 className="text-xl font-semibold text-sky-900 mb-1">Configuración</h1>
              <p className="text-sm text-slate-400 mb-6">Perfil y seguridad de tu cuenta</p>

              <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-sm mb-4">
                <h2 className="text-sm font-semibold text-sky-900 mb-4">Información de perfil</h2>
                <div className="flex items-center gap-4 mb-4">
                  <Initials name={currentUser?.nombre ?? 'U'} size="lg" />
                  <div>
                    <p className="text-base font-medium text-sky-900">{currentUser?.nombre}</p>
                    <p className="text-sm text-slate-400">{currentUser?.correo}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${currentUser?.rol === 'admin' ? 'bg-sky-900 text-white' : 'bg-sky-100 text-sky-700'}`}>
                      {currentUser?.rol === 'admin' ? 'Administrador' : 'Usuario'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Nombre completo</label>
                    <input type="text" defaultValue={currentUser?.nombre}
                      className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Correo electrónico</label>
                    <input type="email" defaultValue={currentUser?.correo}
                      className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-white" />
                  </div>
                </div>
                <button className="mt-4 bg-sky-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors">Guardar cambios</button>
              </div>

              <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-sky-900 mb-4">Cambiar contraseña</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Contraseña actual</label>
                    <input type="password" value={cfgCurrent} onChange={e => { setCfgCurrent(e.target.value); setCfgErr(''); setCfgMsg(''); }}
                      placeholder="••••••••"
                      className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 placeholder:text-slate-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Nueva contraseña</label>
                    <input type="password" value={cfgNew} onChange={e => { setCfgNew(e.target.value); setCfgErr(''); setCfgMsg(''); }}
                      placeholder="Mín. 8 caracteres con mayúscula, número y especial"
                      className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 placeholder:text-slate-300" />
                    {cfgNew.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-1">
                        {Object.entries(passReqs(cfgNew)).map(([k, ok]) => (
                          <PassReq key={k} ok={ok} label={k === 'len' ? 'Mín. 8 caracteres' : k === 'upper' ? 'Una mayúscula' : k === 'number' ? 'Un número' : 'Carácter especial'} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Confirmar nueva contraseña</label>
                    <input type="password" value={cfgConfirm} onChange={e => { setCfgConfirm(e.target.value); setCfgErr(''); setCfgMsg(''); }}
                      placeholder="••••••••"
                      className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 placeholder:text-slate-300" />
                  </div>
                  {cfgErr && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{cfgErr}</p>}
                  {cfgMsg && <p className="text-xs text-sky-600 bg-sky-50 px-3 py-2 rounded-lg">{cfgMsg}</p>}
                  <button onClick={async () => {
                    setCfgErr(''); setCfgMsg('');
                    if (!cfgCurrent)          { setCfgErr('Ingresa tu contraseña actual'); return; }
                    if (!passOk(cfgNew))      { setCfgErr('La nueva contraseña no cumple los requisitos'); return; }
                    if (cfgNew !== cfgConfirm){ setCfgErr('Las contraseñas no coinciden'); return; }
                    try {
                      await api.cambiarPassword(cfgCurrent, cfgNew);
                      setCfgCurrent(''); setCfgNew(''); setCfgConfirm('');
                      setCfgMsg('Contraseña actualizada correctamente.');
                    } catch (err) {
                      setCfgErr(err instanceof ApiError ? err.message : 'No se pudo actualizar la contraseña');
                    }
                  }} className="bg-sky-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors">
                    Actualizar contraseña
                  </button>
                </div>
              </div>
            </div>
          )}


          {screen === 'scm-home' && (
            <div className="p-6 max-w-4xl">
              <h1 className="text-xl font-semibold text-sky-900 mb-0.5">SCM</h1>
              <p className="text-sm text-slate-400 mb-6">Cadena de Suministros</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Productos',   sub: 'Gestión de catálogo',         s: 'scm-productos'  as Screen, emoji: '📦', color: 'bg-sky-50 border-sky-200 hover:bg-sky-100' },
                  { label: 'Proveedores', sub: 'Administrar proveedores',      s: 'scm-proveedores'as Screen, emoji: '🤝', color: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
                  { label: 'Inventario',  sub: 'Control de existencias',       s: 'scm-inventario' as Screen, emoji: '🗃️', color: 'bg-violet-50 border-violet-200 hover:bg-violet-100' },
                  { label: 'Pedidos',     sub: 'Reposición y suministro',      s: 'scm-pedidos'    as Screen, emoji: '🛒', color: 'bg-amber-50 border-amber-200 hover:bg-amber-100' },
                  { label: 'Logística',   sub: 'Push / Pull',                  s: 'scm-logistica'  as Screen, emoji: '🚚', color: 'bg-rose-50 border-rose-200 hover:bg-rose-100' },
                  { label: 'Reportes',    sub: 'Métricas y análisis',          s: 'scm-reportes'   as Screen, emoji: '📊', color: 'bg-teal-50 border-teal-200 hover:bg-teal-100' },
                ].map(item => (
                  <button key={item.label} onClick={() => setScreen(item.s)}
                    className={`${item.color} border rounded-2xl p-6 text-left transition-colors shadow-sm`}>
                    <div className="text-3xl mb-3">{item.emoji}</div>
                    <p className="text-sm font-semibold text-sky-900">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {screen === 'scm-productos' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-1">
                <button onClick={() => setScreen('scm-home')} className="text-sky-500 hover:text-sky-800 text-sm flex items-center gap-1 transition-colors"><IcoBack /> SCM</button>
                <span className="text-slate-300">/</span>
                <span className="text-sm text-slate-500">Productos</span>
              </div>
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-semibold text-sky-900">Productos</h1>
                <button onClick={() => { setEditingScmProducto(null); setScmFormError(''); setScmPF({ nombre:'', categoria:'Cerámica', proveedor:'', stock:0, stockMin:0, estrategia:'PUSH', costo:0, descripcion:'' }); setScmModal('producto'); }}
                  className="bg-sky-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors shadow-sm">+ Nuevo producto</button>
              </div>
              <div className="flex gap-3 mb-4">
                <input value={scmSearch} onChange={e => setScmSearch(e.target.value)} placeholder="Buscar producto..."
                  className="flex-1 border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 bg-white placeholder:text-slate-300" />
              </div>
              <div className="bg-white rounded-xl border border-sky-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-sky-100 bg-sky-50">
                    {['Nombre','Categoría','Stock','Stock mín.','Estrategia','Acciones'].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-sky-600 px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {scmLoading && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400 text-sm">Cargando…</td></tr>}
                    {!scmLoading && scmProductos.filter(p => !scmSearch || p.nombre.toLowerCase().includes(scmSearch.toLowerCase())).map(p => (
                      <tr key={p.id} className="border-b border-sky-50 last:border-0 hover:bg-sky-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-sky-900">{p.nombre}</td>
                        <td className="px-4 py-3 text-slate-500">{p.categoria}</td>
                        <td className="px-4 py-3 text-slate-700 font-medium">{p.stock}</td>
                        <td className="px-4 py-3 text-slate-500">{p.stockMin}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${p.estrategia === 'PUSH' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>{p.estrategia}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button title="Editar" onClick={() => { setEditingScmProducto(p); setScmFormError(''); setScmPF({ nombre: p.nombre, categoria: p.categoria, proveedor: p.proveedor, stock: p.stock, stockMin: p.stockMin, estrategia: p.estrategia, costo: p.costo, descripcion: p.descripcion }); setScmModal('producto'); }}
                              className="text-amber-400 hover:text-amber-600 transition-colors"><IcoPencil /></button>
                            <button title="Eliminar" onClick={async () => {
                              if (!window.confirm(`¿Eliminar "${p.nombre}"?`)) return;
                              try { await api.eliminarProducto(p.id); reloadScmBase(); }
                              catch (err) { setGlobalError(err instanceof ApiError ? err.message : 'No se pudo eliminar el producto'); }
                            }} className="text-slate-300 hover:text-red-400 transition-colors"><IcoTrash /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {screen === 'scm-proveedores' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-1">
                <button onClick={() => setScreen('scm-home')} className="text-sky-500 hover:text-sky-800 text-sm flex items-center gap-1 transition-colors"><IcoBack /> SCM</button>
                <span className="text-slate-300">/</span><span className="text-sm text-slate-500">Proveedores</span>
              </div>
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-semibold text-sky-900">Proveedores</h1>
                <button onClick={() => { setEditingScmProveedor(null); setScmFormError(''); setScmPrF({ nombre:'', contacto:'', correo:'', telefono:'', direccion:'' }); setScmModal('proveedor'); }}
                  className="bg-sky-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors shadow-sm">+ Nuevo proveedor</button>
              </div>
              <div className="mb-4">
                <input value={scmSearch} onChange={e => setScmSearch(e.target.value)} placeholder="Buscar proveedor..."
                  className="w-full max-w-sm border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 bg-white placeholder:text-slate-300" />
              </div>
              <div className="bg-white rounded-xl border border-sky-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-sky-100 bg-sky-50">
                    {['Nombre','Contacto','Correo','Teléfono','Acciones'].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-sky-600 px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {scmLoading && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400 text-sm">Cargando…</td></tr>}
                    {!scmLoading && scmProveedores.filter(p => !scmSearch || p.nombre.toLowerCase().includes(scmSearch.toLowerCase())).map(p => (
                      <tr key={p.id} className="border-b border-sky-50 last:border-0 hover:bg-sky-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-sky-900">{p.nombre}</td>
                        <td className="px-4 py-3 text-slate-600">{p.contacto}</td>
                        <td className="px-4 py-3 text-slate-500">{p.correo}</td>
                        <td className="px-4 py-3 text-slate-500">{p.telefono}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button title="Editar" onClick={() => { setEditingScmProveedor(p); setScmFormError(''); setScmPrF({ nombre: p.nombre, contacto: p.contacto, correo: p.correo, telefono: p.telefono, direccion: p.direccion }); setScmModal('proveedor'); }}
                              className="text-amber-400 hover:text-amber-600 transition-colors"><IcoPencil /></button>
                            <button title="Eliminar" onClick={async () => {
                              if (!window.confirm(`¿Eliminar a "${p.nombre}"?`)) return;
                              try { await api.eliminarProveedor(p.id); reloadScmBase(); }
                              catch (err) { setGlobalError(err instanceof ApiError ? err.message : 'No se pudo eliminar el proveedor'); }
                            }} className="text-slate-300 hover:text-red-400 transition-colors"><IcoTrash /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {screen === 'scm-inventario' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-1">
                <button onClick={() => setScreen('scm-home')} className="text-sky-500 hover:text-sky-800 text-sm flex items-center gap-1 transition-colors"><IcoBack /> SCM</button>
                <span className="text-slate-300">/</span><span className="text-sm text-slate-500">Inventario</span>
              </div>
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-semibold text-sky-900">Inventario</h1>
                <button onClick={() => setScreen('scm-movimientos')} className="border border-sky-200 text-sky-700 text-sm px-4 py-2 rounded-lg hover:bg-sky-50 transition-colors">Ver movimientos →</button>
              </div>
              <div className="mb-4">
                <input value={scmSearch} onChange={e => setScmSearch(e.target.value)} placeholder="Buscar producto..."
                  className="w-full max-w-sm border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 bg-white placeholder:text-slate-300" />
              </div>
              <div className="bg-white rounded-xl border border-sky-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-sky-100 bg-sky-50">
                    {['Producto','Stock actual','Stock mínimo','Estado','Acciones'].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-sky-600 px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {scmProductos.filter(p => !scmSearch || p.nombre.toLowerCase().includes(scmSearch.toLowerCase())).map(p => {
                      const bajo = p.stock <= p.stockMin;
                      return (
                        <tr key={p.id} className="border-b border-sky-50 last:border-0 hover:bg-sky-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-sky-900">{p.nombre}</td>
                          <td className="px-4 py-3 font-bold text-sky-900">{p.stock}</td>
                          <td className="px-4 py-3 text-slate-500">{p.stockMin}</td>
                          <td className="px-4 py-3">
                            {bajo
                              ? <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">⚠ Stock bajo</span>
                              : <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ Normal</span>}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => { setScmMF({ producto: p.nombre, tipo: 'Entrada', cantidad: 0, motivo: 'Compra', fecha: '', usuario: currentUser?.nombre ?? '' }); setScmModal('movimiento'); }}
                              className="text-xs text-sky-600 hover:text-sky-900 underline transition-colors">+ Movimiento</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {screen === 'scm-movimientos' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-1">
                <button onClick={() => setScreen('scm-inventario')} className="text-sky-500 hover:text-sky-800 text-sm flex items-center gap-1 transition-colors"><IcoBack /> Inventario</button>
                <span className="text-slate-300">/</span><span className="text-sm text-slate-500">Movimientos</span>
              </div>
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-semibold text-sky-900">Movimientos de inventario</h1>
                <button onClick={() => { setScmMF({ producto:'', tipo:'Entrada', cantidad:0, motivo:'Compra', fecha:'', usuario: currentUser?.nombre ?? '' }); setScmModal('movimiento'); }}
                  className="bg-sky-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors shadow-sm">+ Nuevo movimiento</button>
              </div>
              <div className="flex gap-3 mb-4">
                <select value={scmTipoMov} onChange={e => setScmTipoMov(e.target.value)}
                  className="border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none bg-white text-slate-600">
                  <option value="Todos">Tipo: Todos</option><option>Entrada</option><option>Salida</option>
                </select>
                <select value={scmProdMov} onChange={e => setScmProdMov(e.target.value)}
                  className="border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none bg-white text-slate-600">
                  <option value="Todos">Producto: Todos</option>
                  {scmProductos.map(p => <option key={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="bg-white rounded-xl border border-sky-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-sky-100 bg-sky-50">
                    {['Fecha','Producto','Tipo','Cantidad','Motivo','Usuario'].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-sky-600 px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {scmMovimientos
                      .filter(m => (scmTipoMov === 'Todos' || m.tipo === scmTipoMov) && (scmProdMov === 'Todos' || m.producto === scmProdMov))
                      .map(m => (
                        <tr key={m.id} className="border-b border-sky-50 last:border-0 hover:bg-sky-50 transition-colors">
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{m.fecha}</td>
                          <td className="px-4 py-3 font-medium text-sky-900">{m.producto}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${m.tipo === 'Entrada' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>{m.tipo}</span>
                          </td>
                          <td className="px-4 py-3 font-medium text-sky-900">{m.cantidad}</td>
                          <td className="px-4 py-3 text-slate-500">{m.motivo}</td>
                          <td className="px-4 py-3 text-slate-500">{m.usuario}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {screen === 'scm-logistica' && (
            <div className="p-6 max-w-5xl">
              <div className="flex items-center gap-3 mb-1">
                <button onClick={() => setScreen('scm-home')} className="text-sky-500 hover:text-sky-800 text-sm flex items-center gap-1 transition-colors"><IcoBack /> SCM</button>
                <span className="text-slate-300">/</span><span className="text-sm text-slate-500">Logística</span>
              </div>
              <h1 className="text-xl font-semibold text-sky-900 mb-5">Logística – Estrategia de reposición</h1>
              <div className="grid grid-cols-2 gap-5 mb-5">
                <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-sky-900 mb-4">Configurar estrategia</h2>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Producto</label>
                  <select value={logProd} onChange={e => { setLogProd(e.target.value); const p = scmProductos.find(x => x.nombre === e.target.value); if (p) setLogEst(p.estrategia); }}
                    className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 bg-white mb-3">
                    {scmProductos.map(p => <option key={p.id}>{p.nombre}</option>)}
                  </select>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Estrategia</label>
                  <div className="flex gap-3 mb-4">
                    {(['PUSH','PULL'] as const).map(e => (
                      <label key={e} className={`flex-1 flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer transition-colors ${logEst === e ? 'border-sky-500 bg-sky-50' : 'border-slate-200'}`}>
                        <input type="radio" checked={logEst === e} onChange={() => setLogEst(e)} className="accent-sky-600" />
                        <span className={`text-sm font-bold ${e === 'PUSH' ? 'text-amber-600' : 'text-sky-600'}`}>{e}</span>
                      </label>
                    ))}
                  </div>
                  <button onClick={async () => {
                    const p = scmProductos.find(x => x.nombre === logProd);
                    if (!p) return;
                    try { await api.actualizarEstrategia(p.id, logEst); reloadScmBase(); }
                    catch (err) { setGlobalError(err instanceof ApiError ? err.message : 'No se pudo actualizar la estrategia'); }
                  }}
                    className="w-full bg-sky-600 text-white text-sm py-2 rounded-lg hover:bg-sky-700 transition-colors">Guardar</button>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-sky-900 mb-3">Productos por estrategia</h2>
                <div className="flex gap-2 mb-4">
                  {(['PUSH','PULL'] as const).map(t => (
                    <button key={t} onClick={() => setLogTab(t)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${logTab === t ? (t === 'PUSH' ? 'bg-amber-500 text-white' : 'bg-sky-600 text-white') : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {t} · {scmProductos.filter(p => p.estrategia === t).length} productos
                    </button>
                  ))}
                </div>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-sky-50">
                    {['Producto','Categoría','Stock','Stock mín.','Estrategia'].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-sky-600 px-2 py-2">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {scmProductos.filter(p => p.estrategia === logTab).map(p => (
                      <tr key={p.id} className="border-b border-sky-50 last:border-0">
                        <td className="px-2 py-2 font-medium text-sky-900">{p.nombre}</td>
                        <td className="px-2 py-2 text-slate-500">{p.categoria}</td>
                        <td className="px-2 py-2 text-slate-700">{p.stock}</td>
                        <td className="px-2 py-2 text-slate-500">{p.stockMin}</td>
                        <td className="px-2 py-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${p.estrategia === 'PUSH' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>{p.estrategia}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {screen === 'scm-pedidos' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-1">
                <button onClick={() => setScreen('scm-home')} className="text-sky-500 hover:text-sky-800 text-sm flex items-center gap-1 transition-colors"><IcoBack /> SCM</button>
                <span className="text-slate-300">/</span><span className="text-sm text-slate-500">Pedidos</span>
              </div>
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-semibold text-sky-900">Pedidos</h1>
                <button onClick={() => { setEditingScmPedido(null); setScmFormError(''); setScmOF({ producto:'', cantidad:0, tipo:'Reposición', proveedor:'', fecha:'', notas:'' }); setScmModal('pedido'); }}
                  className="bg-sky-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors shadow-sm">+ Generar pedido</button>
              </div>
              <div className="flex gap-3 mb-4">
                <select value={scmEstPed} onChange={e => setScmEstPed(e.target.value)}
                  className="border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none bg-white text-slate-600">
                  {['Todos','Pendiente','En proceso','Surtido','Cancelado'].map(s => <option key={s}>{s}</option>)}
                </select>
                <select value={scmTipoPed} onChange={e => setScmTipoPed(e.target.value)}
                  className="border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none bg-white text-slate-600">
                  {['Todos','Reposición','Venta'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="bg-white rounded-xl border border-sky-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-sky-100 bg-sky-50">
                    {['Folio','Fecha','Producto','Cantidad','Tipo','Estado','Acciones'].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-sky-600 px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {scmLoading && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400 text-sm">Cargando…</td></tr>}
                    {!scmLoading && scmPedidos
                      .filter(p => (scmEstPed === 'Todos' || p.estado === scmEstPed) && (scmTipoPed === 'Todos' || p.tipo === scmTipoPed))
                      .map(p => {
                        const estadoCls: Record<string, string> = {
                          Pendiente: 'bg-amber-100 text-amber-700', 'En proceso': 'bg-sky-100 text-sky-700',
                          Surtido: 'bg-emerald-100 text-emerald-700', Cancelado: 'bg-red-100 text-red-600',
                        };
                        return (
                          <tr key={p.id} className="border-b border-sky-50 last:border-0 hover:bg-sky-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.folio}</td>
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{p.fecha}</td>
                            <td className="px-4 py-3 font-medium text-sky-900">{p.producto}</td>
                            <td className="px-4 py-3 text-slate-700">{p.cantidad}</td>
                            <td className="px-4 py-3 text-slate-500">{p.tipo}</td>
                            <td className="px-4 py-3">
                              <select value={p.estado} onChange={async e => {
                                try { await api.actualizarEstadoPedido(p.id, PED_ESTADO_VALUE[e.target.value] as any); reloadScmPedidos(); }
                                catch (err) { setGlobalError(err instanceof ApiError ? err.message : 'No se pudo cambiar el estado'); }
                              }} className={`text-xs font-medium rounded px-2 py-0.5 border-0 outline-none ${estadoCls[p.estado]}`}>
                                {['Pendiente','En proceso','Surtido','Cancelado'].map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button title="Editar" onClick={() => { setEditingScmPedido(p); setScmFormError(''); setScmOF({ producto: p.producto, cantidad: p.cantidad, tipo: p.tipo, proveedor: p.proveedor, fecha: '', notas: p.notas }); setScmModal('pedido'); }}
                                  className="text-amber-400 hover:text-amber-600 transition-colors"><IcoPencil /></button>
                                <button title="Eliminar" onClick={async () => {
                                  if (!window.confirm(`¿Eliminar el pedido ${p.folio}?`)) return;
                                  try { await api.eliminarPedido(p.id); reloadScmPedidos(); }
                                  catch (err) { setGlobalError(err instanceof ApiError ? err.message : 'No se pudo eliminar el pedido'); }
                                }} className="text-slate-300 hover:text-red-400 transition-colors"><IcoTrash /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {screen === 'scm-madurez' && (() => {
            const CHECKLIST: Array<{ key: keyof Omit<MadurezScm, 'nivel'>; label: string }> = [
              { key: 'productos_proveedores_integrados', label: 'Productos y proveedores integrados' },
              { key: 'inventario_funcionando', label: 'Inventario funcionando' },
              { key: 'trazabilidad_movimientos', label: 'Trazabilidad de movimientos' },
              { key: 'estrategia_push_pull_implementada', label: 'Estrategia Push/Pull implementada' },
              { key: 'reportes_y_metricas', label: 'Reportes y métricas' },
            ];
            const completados = scmMadurez ? CHECKLIST.filter(c => scmMadurez[c.key]).length : 0;
            const pct = Math.round((completados / CHECKLIST.length) * 100);
            const nivel = scmMadurez?.nivel ?? 'Inicial';
            const descripciones: Record<string, string> = {
              Inicial: 'El sistema apenas cuenta con los módulos básicos. Aún falta integrar la mayoría de los procesos.',
              'En desarrollo': 'El sistema cuenta con los módulos principales funcionando. Se están implementando estrategias logísticas y reportes.',
              Optimizado: 'El sistema tiene todos los procesos integrados: inventario, logística, pedidos y reportes funcionando de forma completa.',
            };
            async function toggleItem(key: keyof Omit<MadurezScm, 'nivel'>) {
              if (!scmMadurez) return;
              try {
                const actualizado = await api.actualizarMadurezScm({ [key]: !scmMadurez[key] });
                setScmMadurez(actualizado);
              } catch (err) { setGlobalError(err instanceof ApiError ? err.message : 'No se pudo actualizar el checklist'); }
            }
            return (
              <div className="p-6 max-w-2xl">
                <div className="flex items-center gap-3 mb-1">
                  <button onClick={() => setScreen('scm-home')} className="text-sky-500 hover:text-sky-800 text-sm flex items-center gap-1 transition-colors"><IcoBack /> SCM</button>
                  <span className="text-slate-300">/</span><span className="text-sm text-slate-500">Nivel de madurez</span>
                </div>
                <h1 className="text-xl font-semibold text-sky-900 mb-5">Nivel de madurez SCM</h1>
                {scmLoading && !scmMadurez && <p className="text-sm text-slate-400">Cargando…</p>}
                {scmMadurez && (
                  <>
                    <div className="bg-white rounded-xl border border-sky-100 p-6 shadow-sm mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600">Nivel actual</span>
                        <span className="text-xs font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">{nivel}</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Inicial', desc: 'Procesos básicos.' },
                          { label: 'En desarrollo', desc: 'Integración de procesos.' },
                          { label: 'Optimizado', desc: 'Procesos avanzados.' },
                        ].map(s => (
                          <div key={s.label} className={`rounded-lg p-3 text-center border ${nivel === s.label ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-100'}`}>
                            <p className={`text-xs font-semibold ${nivel === s.label ? 'text-emerald-700' : 'text-slate-500'}`}>{s.label}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{s.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-sm">
                      <h2 className="text-sm font-semibold text-sky-900 mb-3">Checklist de avance</h2>
                      <div className="space-y-2">
                        {CHECKLIST.map(item => {
                          const done = scmMadurez[item.key];
                          return (
                            <button key={item.key} onClick={() => toggleItem(item.key)} className="flex items-center gap-2.5 w-full text-left">
                              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500' : 'bg-slate-100 border border-slate-300'}`}>
                                {done && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                              </div>
                              <span className={`text-sm ${done ? 'text-slate-700' : 'text-slate-400'}`}>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-4 bg-sky-50 rounded-lg p-3 text-xs text-slate-500 leading-relaxed">
                        <strong className="text-sky-800">Descripción del nivel:</strong> {descripciones[nivel]}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {screen === 'scm-reportes' && (
            <div className="p-6 max-w-5xl">
              <div className="flex items-center gap-3 mb-1">
                <button onClick={() => setScreen('scm-home')} className="text-sky-500 hover:text-sky-800 text-sm flex items-center gap-1 transition-colors"><IcoBack /> SCM</button>
                <span className="text-slate-300">/</span><span className="text-sm text-slate-500">Reportes</span>
              </div>
              <h1 className="text-xl font-semibold text-sky-900 mb-5">Reportes SCM</h1>
              {scmLoading && !scmMetricas && <p className="text-sm text-slate-400">Cargando…</p>}
              {scmMetricas && (() => {
                const { total_productos, total_proveedores, pedidos_en_proceso, productos_stock_bajo, productos_mas_vendidos, rotacion_inventario, comparativa_push_pull } = scmMetricas;
                const maxVenta = Math.max(...productos_mas_vendidos.map(p => p.total_vendido), 1);
                const totalPP  = comparativa_push_pull.push + comparativa_push_pull.pull || 1;
                return (
                  <>
                    <div className="grid grid-cols-4 gap-4 mb-5">
                      {[
                        { label: 'Productos', value: total_productos, color: 'text-sky-600', emoji: '📦' },
                        { label: 'Proveedores', value: total_proveedores, color: 'text-emerald-600', emoji: '🤝' },
                        { label: 'Pedidos en proceso', value: pedidos_en_proceso, color: 'text-violet-600', emoji: '🛒' },
                        { label: 'Productos stock bajo', value: productos_stock_bajo.length, color: 'text-red-500', emoji: '⚠️' },
                      ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl border border-sky-100 p-4 shadow-sm">
                          <p className="text-lg mb-1">{s.emoji}</p>
                          <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                          <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-sky-900 mb-4">Productos más vendidos</h2>
                        {productos_mas_vendidos.length === 0
                          ? <p className="text-xs text-slate-400">Aún no hay salidas de inventario registradas.</p>
                          : (
                            <div className="space-y-2">
                              {productos_mas_vendidos.map(p => (
                                <div key={p.producto_id} className="flex items-center gap-2">
                                  <span className="text-xs text-slate-600 w-28 truncate">{p.nombre}</span>
                                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(p.total_vendido / maxVenta) * 100}%` }} />
                                  </div>
                                  <span className="text-xs font-medium text-sky-900 w-6 text-right">{p.total_vendido}</span>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                      <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-sky-900 mb-4">Comparativa PUSH vs PULL</h2>
                        <div className="flex gap-4 items-center mb-3">
                          <div className="flex-1 text-center bg-amber-50 rounded-lg p-3 border border-amber-100">
                            <p className="text-2xl font-bold text-amber-600">{comparativa_push_pull.push}</p>
                            <p className="text-xs text-amber-700 font-medium">PUSH</p>
                          </div>
                          <div className="flex-1 text-center bg-sky-50 rounded-lg p-3 border border-sky-100">
                            <p className="text-2xl font-bold text-sky-600">{comparativa_push_pull.pull}</p>
                            <p className="text-xs text-sky-700 font-medium">PULL</p>
                          </div>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(comparativa_push_pull.push / totalPP) * 100}%` }} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-amber-600">PUSH {Math.round((comparativa_push_pull.push / totalPP) * 100)}%</span>
                          <span className="text-[10px] text-sky-600">PULL {Math.round((comparativa_push_pull.pull / totalPP) * 100)}%</span>
                        </div>
                        <h3 className="text-xs font-semibold text-sky-900 mt-4 mb-1">Rotación de inventario</h3>
                        <p className="text-xs text-slate-500">General: <strong className="text-sky-700">{rotacion_inventario.porcentaje_general}%</strong> · Alta: {rotacion_inventario.alta_rotacion} · Media: {rotacion_inventario.rotacion_media} · Baja: {rotacion_inventario.rotacion_baja}</p>
                        <h3 className="text-xs font-semibold text-sky-900 mt-4 mb-2">Inventario crítico</h3>
                        {productos_stock_bajo.length === 0
                          ? <p className="text-xs text-slate-400">Sin productos en stock bajo.</p>
                          : productos_stock_bajo.map(p => (
                              <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-sky-50 last:border-0">
                                <span className="text-slate-700">{p.nombre}</span>
                                <span className="text-red-500 font-medium">{p.stock_actual} / {p.stock_minimo}</span>
                              </div>
                            ))}
                      </div>
                    </div>
                    <button onClick={() => setScreen('scm-madurez')} className="mt-4 text-xs text-sky-500 hover:text-sky-700 underline transition-colors">Ver nivel de madurez SCM →</button>
                  </>
                );
              })()}
            </div>
          )}

        </main>
      </div>

      {showClientModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setShowClientModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-sky-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-sky-100">
              <h2 className="text-base font-semibold text-sky-900">{editingClient ? 'Editar cliente' : 'Nuevo cliente'}</h2>
              <button onClick={() => setShowClientModal(false)} className="text-slate-400 hover:text-sky-700 transition-colors"><IcoX /></button>
            </div>
            <div className="p-5 space-y-3">
              <div><label className="block text-xs font-medium text-slate-700 mb-1">Nombre</label>
                <input value={clientForm.nombre} onChange={e => setClientForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
              <div><label className="block text-xs font-medium text-slate-700 mb-1">Correo</label>
                <input type="email" value={clientForm.correo} onChange={e => setClientForm(f => ({ ...f, correo: e.target.value }))}
                  className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Teléfono</label>
                  <input value={clientForm.telefono} onChange={e => setClientForm(f => ({ ...f, telefono: e.target.value }))}
                    className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Empresa</label>
                  <input value={clientForm.empresa} onChange={e => setClientForm(f => ({ ...f, empresa: e.target.value }))}
                    className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
              </div>
              {editingClient && (
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Estado</label>
                  <select value={clientForm.estado} onChange={e => setClientForm(f => ({ ...f, estado: e.target.value as 'Activo' | 'Inactivo' }))}
                    className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 bg-white">
                    <option>Activo</option><option>Inactivo</option>
                  </select></div>
              )}
              {clientFormError && <p className="text-xs text-red-500">{clientFormError}</p>}
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setShowClientModal(false)} className="flex-1 py-2 text-sm border border-sky-200 rounded-lg hover:bg-sky-50 text-sky-700 transition-colors">Cancelar</button>
              <button onClick={handleSaveClient} className="flex-1 py-2 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-sky-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-sky-100">
              <h2 className="text-base font-semibold text-sky-900">Nueva Interacción</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-sky-700 transition-colors"><IcoX /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Cliente</label>
                <select value={intForm.clienteId} onChange={e => setIntForm(f => ({ ...f, clienteId: Number(e.target.value) }))}
                  className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-white">
                  <option value={0}>Selecciona un cliente…</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Tipo de interacción</label>
                <select value={intForm.tipo} onChange={e => setIntForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-white">
                  {['Llamada', 'Correo', 'Reunión'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Descripción</label>
                <textarea value={intForm.descripcion} onChange={e => setIntForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Describe el detalle de la interacción..." rows={3}
                  className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none placeholder:text-slate-300" />
              </div>
              {intFormError && <p className="text-xs text-red-500">{intFormError}</p>}
              <p className="text-[11px] text-slate-400">La fecha y el responsable se registran automáticamente (ahora / tu usuario).</p>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 text-sm border border-sky-200 rounded-lg hover:bg-sky-50 text-sky-700 transition-colors">Cancelar</button>
              <button onClick={handleSaveInteraction} className="flex-1 py-2 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {scmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setScmModal(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-sky-100">

            {scmModal === 'producto' && (
              <>
                <div className="flex items-center justify-between px-5 py-4 border-b border-sky-100">
                  <h2 className="text-base font-semibold text-sky-900">{editingScmProducto ? 'Editar producto' : 'Nuevo producto'}</h2>
                  <button onClick={() => setScmModal(null)} className="text-slate-400 hover:text-sky-700"><IcoX /></button>
                </div>
                <div className="p-5 space-y-3">
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Nombre del producto</label>
                    <input value={scmPF.nombre} onChange={e => setScmPF(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre del producto"
                      className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Descripción</label>
                    <textarea value={scmPF.descripcion} onChange={e => setScmPF(f => ({ ...f, descripcion: e.target.value }))} rows={2} placeholder="Descripción..."
                      className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 resize-none" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-slate-700 mb-1">Categoría</label>
                      <select value={scmPF.categoria} onChange={e => setScmPF(f => ({ ...f, categoria: e.target.value }))}
                        className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 bg-white">
                        {SCM_CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                      </select></div>
                    <div><label className="block text-xs font-medium text-slate-700 mb-1">Proveedor</label>
                      <select value={scmPF.proveedor} onChange={e => setScmPF(f => ({ ...f, proveedor: e.target.value }))}
                        className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 bg-white">
                        <option value="">Selecciona un proveedor</option>
                        {scmProveedores.map(p => <option key={p.id}>{p.nombre}</option>)}
                      </select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-slate-700 mb-1">Stock actual</label>
                      <input type="number" value={scmPF.stock} onChange={e => setScmPF(f => ({ ...f, stock: Number(e.target.value) }))}
                        className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
                    <div><label className="block text-xs font-medium text-slate-700 mb-1">Stock mínimo</label>
                      <input type="number" value={scmPF.stockMin} onChange={e => setScmPF(f => ({ ...f, stockMin: Number(e.target.value) }))}
                        className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-slate-700 mb-1">Estrategia logística</label>
                      <select value={scmPF.estrategia} onChange={e => setScmPF(f => ({ ...f, estrategia: e.target.value as 'PUSH'|'PULL' }))}
                        className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 bg-white">
                        <option>PUSH</option><option>PULL</option>
                      </select></div>
                    <div><label className="block text-xs font-medium text-slate-700 mb-1">Costo unitario</label>
                      <input type="number" value={scmPF.costo} onChange={e => setScmPF(f => ({ ...f, costo: Number(e.target.value) }))}
                        className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
                  </div>
                </div>
                {scmFormError && <p className="px-5 text-xs text-red-500">{scmFormError}</p>}
                <div className="flex gap-2 px-5 pb-5">
                  <button onClick={() => setScmModal(null)} className="flex-1 py-2 text-sm border border-sky-200 rounded-lg hover:bg-sky-50 text-sky-700 transition-colors">Cancelar</button>
                  <button onClick={handleSaveScmProducto} className="flex-1 py-2 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">Guardar</button>
                </div>
              </>
            )}

            {scmModal === 'proveedor' && (
              <>
                <div className="flex items-center justify-between px-5 py-4 border-b border-sky-100">
                  <h2 className="text-base font-semibold text-sky-900">{editingScmProveedor ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
                  <button onClick={() => setScmModal(null)} className="text-slate-400 hover:text-sky-700"><IcoX /></button>
                </div>
                <div className="p-5 space-y-3">
                  {([['nombre','Nombre'],['contacto','Contacto'],['correo','Correo'],['telefono','Teléfono'],['direccion','Dirección']] as const).map(([k, label]) => (
                    <div key={k}><label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
                      <input value={scmPrF[k]} onChange={e => setScmPrF(f => ({ ...f, [k]: e.target.value }))} placeholder={label}
                        className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
                  ))}
                </div>
                {scmFormError && <p className="px-5 text-xs text-red-500">{scmFormError}</p>}
                <div className="flex gap-2 px-5 pb-5">
                  <button onClick={() => setScmModal(null)} className="flex-1 py-2 text-sm border border-sky-200 rounded-lg hover:bg-sky-50 text-sky-700 transition-colors">Cancelar</button>
                  <button onClick={handleSaveScmProveedor} className="flex-1 py-2 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">Guardar</button>
                </div>
              </>
            )}

            {scmModal === 'movimiento' && (
              <>
                <div className="flex items-center justify-between px-5 py-4 border-b border-sky-100">
                  <h2 className="text-base font-semibold text-sky-900">Nuevo movimiento</h2>
                  <button onClick={() => setScmModal(null)} className="text-slate-400 hover:text-sky-700"><IcoX /></button>
                </div>
                <div className="p-5 space-y-3">
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Producto</label>
                    <select value={scmMF.producto} onChange={e => setScmMF(f => ({ ...f, producto: e.target.value }))}
                      className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 bg-white">
                      <option value="">Selecciona un producto</option>
                      {scmProductos.map(p => <option key={p.id}>{p.nombre}</option>)}
                    </select></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-2">Tipo</label>
                    <div className="flex gap-4">
                      {(['Entrada','Salida'] as const).map(t => (
                        <label key={t} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" checked={scmMF.tipo === t} onChange={() => setScmMF(f => ({ ...f, tipo: t }))} className="accent-sky-600" />
                          <span className="text-sm text-slate-700">{t}</span>
                        </label>
                      ))}
                    </div></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Cantidad</label>
                    <input type="number" value={scmMF.cantidad} onChange={e => setScmMF(f => ({ ...f, cantidad: Number(e.target.value) }))}
                      className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Motivo</label>
                    <select value={scmMF.motivo} onChange={e => setScmMF(f => ({ ...f, motivo: e.target.value }))}
                      className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 bg-white">
                      {SCM_MOTIVOS.map(m => <option key={m}>{m}</option>)}
                    </select></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-slate-700 mb-1">Fecha</label>
                      <input type="date" value={scmMF.fecha} onChange={e => setScmMF(f => ({ ...f, fecha: e.target.value }))}
                        className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
                  </div>
                  <p className="text-[11px] text-slate-400">Si dejas la fecha vacía se usa el momento actual. El usuario responsable se registra automáticamente (tu sesión).</p>
                </div>
                {scmFormError && <p className="px-5 text-xs text-red-500">{scmFormError}</p>}
                <div className="flex gap-2 px-5 pb-5">
                  <button onClick={() => setScmModal(null)} className="flex-1 py-2 text-sm border border-sky-200 rounded-lg hover:bg-sky-50 text-sky-700 transition-colors">Cancelar</button>
                  <button onClick={handleSaveScmMovimiento} className="flex-1 py-2 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">Guardar</button>
                </div>
              </>
            )}

            {scmModal === 'pedido' && (
              <>
                <div className="flex items-center justify-between px-5 py-4 border-b border-sky-100">
                  <h2 className="text-base font-semibold text-sky-900">{editingScmPedido ? `Editar pedido ${editingScmPedido.folio}` : 'Nuevo pedido'}</h2>
                  <button onClick={() => setScmModal(null)} className="text-slate-400 hover:text-sky-700"><IcoX /></button>
                </div>
                <div className="p-5 space-y-3">
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Producto</label>
                    <select value={scmOF.producto} onChange={e => setScmOF(f => ({ ...f, producto: e.target.value }))}
                      className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 bg-white">
                      <option value="">Selecciona un producto</option>
                      {scmProductos.map(p => <option key={p.id}>{p.nombre}</option>)}
                    </select></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Cantidad</label>
                    <input type="number" value={scmOF.cantidad} onChange={e => setScmOF(f => ({ ...f, cantidad: Number(e.target.value) }))}
                      className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Tipo</label>
                    <select value={scmOF.tipo} onChange={e => setScmOF(f => ({ ...f, tipo: e.target.value as 'Reposición'|'Venta' }))}
                      className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 bg-white">
                      <option>Reposición</option><option>Venta</option>
                    </select></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Proveedor</label>
                    <select value={scmOF.proveedor} onChange={e => setScmOF(f => ({ ...f, proveedor: e.target.value }))}
                      className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 bg-white">
                      <option value="">Selecciona un proveedor</option>
                      {scmProveedores.map(p => <option key={p.id}>{p.nombre}</option>)}
                    </select></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Fecha</label>
                    <input type="date" value={scmOF.fecha} onChange={e => setScmOF(f => ({ ...f, fecha: e.target.value }))}
                      className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Notas</label>
                    <textarea value={scmOF.notas} onChange={e => setScmOF(f => ({ ...f, notas: e.target.value }))} rows={2} placeholder="Notas..."
                      className="w-full border border-sky-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500 resize-none" /></div>
                </div>
                {scmFormError && <p className="px-5 text-xs text-red-500">{scmFormError}</p>}
                <div className="flex gap-2 px-5 pb-5">
                  <button onClick={() => setScmModal(null)} className="flex-1 py-2 text-sm border border-sky-200 rounded-lg hover:bg-sky-50 text-sky-700 transition-colors">Cancelar</button>
                  <button onClick={handleSaveScmPedido} className="flex-1 py-2 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">Guardar</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
