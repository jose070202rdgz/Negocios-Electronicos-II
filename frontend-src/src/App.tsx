import { useEffect, useState } from 'react';
import {
  api,
  ApiError,
  clearSession,
  getStoredUsuario,
  getToken,
  setSession,
  type Cliente,
  type Interaccion,
  type Metricas,
  type Producto,
  type UsuarioRegistrado,
  type UsuarioSesion,
} from './api';

type Screen =
  | 'login'
  | 'dashboard'
  | 'clients'
  | 'client-detail'
  | 'interaction-history'
  | 'evaluations'
  | 'users'
  | 'crm-stage'
  | 'settings'
  | 'my-activity'
  | 'my-profile'
  | 'reports'
  | 'catalog'
  | 'scm';

const ETAPAS = ['Prospecto', 'Activo', 'Frecuente', 'Inactivo'];

const ESTADO_LABEL: Record<string, string> = { activo: 'Activo', inactivo: 'Inactivo' };
const TIPO_LABEL: Record<string, string> = { llamada: 'Llamada', correo: 'Correo', reunion: 'Reunión' };
const TIPO_VALUE: Record<string, string> = { Llamada: 'llamada', Correo: 'correo', Reunión: 'reunion' };

const IcoGrid  = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x={3} y={3} width={7} height={7} rx={1}/><rect x={14} y={3} width={7} height={7} rx={1}/><rect x={3} y={14} width={7} height={7} rx={1}/><rect x={14} y={14} width={7} height={7} rx={1}/></svg>;
const IcoBox = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path strokeLinecap="round" strokeLinejoin="round" d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>;
const IcoUsers = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>;
const IcoChat  = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>;
const IcoStar  = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>;
const IcoPerson = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>;
const IcoClock  = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx={12} cy={12} r={9}/><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3"/></svg>;
const IcoGear   = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx={12} cy={12} r={3}/></svg>;
const IcoTruck = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v8H3V7zm11 3h4l3 3v2h-7v-5zM7 18.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm11 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg>;
const IcoPhone  = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>;
const IcoMail   = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>;
const IcoBack   = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>;
const IcoChevR  = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>;
const IcoX      = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>;
const IcoSearch = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx={11} cy={11} r={7}/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>;
const IcoBell   = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>;
const IcoChevD  = () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>;

function Initials({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const letters = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }[size];
  return <div className={`${sz} rounded-full bg-neutral-800 text-white flex items-center justify-center font-semibold shrink-0`}>{letters}</div>;
}

function EtapaBadge({ etapa }: { etapa: string }) {
  const cls: Record<string, string> = {
    Activo:    'bg-neutral-900 text-white',
    Prospecto: 'bg-neutral-200 text-neutral-700',
    Frecuente: 'bg-neutral-600 text-white',
    Inactivo:  'bg-white text-neutral-400 border border-neutral-300',
  };
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls[etapa] ?? 'bg-neutral-100 text-neutral-600'}`}>{etapa}</span>;
}

function StatusBadge({ estado }: { estado: string }) {
  const label = ESTADO_LABEL[estado] ?? estado;
  return estado === 'activo'
    ? <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-neutral-900 text-white">{label}</span>
    : <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-white text-neutral-400 border border-neutral-300">{label}</span>;
}

function TipoBadge({ tipo }: { tipo: string }) {
  const label = TIPO_LABEL[tipo] ?? tipo;
  const cls: Record<string, string> = {
    llamada: 'bg-neutral-900 text-white',
    correo:  'bg-neutral-400 text-white',
    reunion: 'bg-neutral-600 text-white',
  };
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls[tipo] ?? 'bg-neutral-100 text-neutral-600'}`}>{label}</span>;
}

function InteractionIcon({ tipo }: { tipo: string }) {
  const bg = tipo === 'llamada' ? 'bg-neutral-900' : tipo === 'correo' ? 'bg-neutral-400' : 'bg-neutral-600';
  const Ico = tipo === 'llamada' ? IcoPhone : tipo === 'correo' ? IcoMail : IcoUsers;
  return <div className={`w-9 h-9 rounded-full ${bg} text-white flex items-center justify-center shrink-0`}><Ico /></div>;
}

function InteractionRow({ int }: { int: Interaccion }) {
  return (
    <div className="flex gap-3 items-start">
      <InteractionIcon tipo={int.tipo} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-neutral-900">{TIPO_LABEL[int.tipo] ?? int.tipo}</span>
          <span className="text-xs text-neutral-400 shrink-0">{new Date(int.fecha).toLocaleString('es-MX')}</span>
        </div>
        <p className="text-sm text-neutral-600 mt-0.5 leading-snug">{int.descripcion}</p>
        <p className="text-xs text-neutral-400 mt-0.5">Usuario: {int.usuario?.nombre ?? '—'}</p>
      </div>
    </div>
  );
}

function DonutChart({ pct }: { pct: number }) {
  const r = 50, cx = 62, cy = 62, circ = 2 * Math.PI * r;
  const activeDash = (pct / 100) * circ;
  return (
    <svg width="124" height="124" viewBox="0 0 124 124">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e5e5" strokeWidth={18} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#171717" strokeWidth={18}
        strokeDasharray={`${activeDash} ${circ - activeDash}`}
        strokeDashoffset={circ / 4} />
    </svg>
  );
}

function PieChart({ data }: { data: { label: string; val: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.val, 0) || 1;
  const cx = 55, cy = 55, r = 48;
  let angle = -Math.PI / 2;
  const slices = data.map(d => {
    const sweep = (d.val / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    return { ...d, path: `M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z` };
  });
  return (
    <div className="flex gap-5 items-start">
      <svg width="110" height="110" viewBox="0 0 110 110">
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth={1.5} />)}
      </svg>
      <div className="flex flex-col gap-2 pt-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-neutral-600">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: d.color }} />
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function InteractionBarChart({ data }: { data: Metricas['interacciones_por_tipo'] }) {
  const labels: Record<string, string> = { llamada: 'Llamada', correo: 'Correo', reunion: 'Reunión' };
  const colors: Record<string, string> = { llamada: '#f59e0b', correo: '#5b9bd5', reunion: '#46b5d1' };
  const values = ['llamada', 'correo', 'reunion'].map(tipo => ({
    tipo,
    label: labels[tipo],
    total: Number(data.find(item => item.tipo === tipo)?.total ?? 0),
    color: colors[tipo],
  }));
  const max = Math.max(...values.map(item => item.total), 1);
  const tick = Math.max(1, Math.ceil(max / 4));
  const top = Math.ceil(max / tick) * tick;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <h2 className="text-sm font-semibold text-neutral-800 mb-4">Interacciones por tipo</h2>
      {values.every(item => item.total === 0) ? (
        <div className="h-48 flex items-center justify-center text-sm text-neutral-400">Aún no hay interacciones registradas.</div>
      ) : (
        <div className="flex gap-3 h-52">
          <div className="h-44 flex flex-col justify-between text-[10px] text-neutral-400 pt-1 pb-6">
            {[top, Math.round(top * 0.75), Math.round(top * 0.5), Math.round(top * 0.25), 0].map((value, index) => <span key={`${value}-${index}`}>{value}</span>)}
          </div>
          <div className="relative flex-1 h-44 border-b border-neutral-200 bg-[linear-gradient(to_bottom,transparent_24%,#e5e7eb_25%,transparent_26%,transparent_49%,#e5e7eb_50%,transparent_51%,transparent_74%,#e5e7eb_75%,transparent_76%)]">
            <div className="absolute inset-x-0 bottom-0 flex h-full items-end justify-around px-4">
              {values.map(item => (
                <div key={item.tipo} className="h-full flex flex-col items-center justify-end gap-2">
                  <span className="text-xs font-medium text-neutral-600">{item.total}</span>
                  <div className="w-12 max-w-[20vw] rounded-t-sm transition-all" style={{ height: `${Math.max((item.total / top) * 76, 2)}%`, backgroundColor: item.color }} />
                  <span className="absolute translate-y-7 text-[11px] text-neutral-600">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const NAV = [
  { label: 'Catálogo',     screen: 'catalog'              as Screen, Icon: IcoBox,   soloAdmin: false },
  { label: 'Dashboard',    screen: 'dashboard'           as Screen, Icon: IcoGrid,   soloAdmin: true  },
  { label: 'Clientes',     screen: 'clients'             as Screen, Icon: IcoUsers,  soloAdmin: true  },
  { label: 'Interacciones',screen: 'interaction-history' as Screen, Icon: IcoChat,   soloAdmin: true  },
  { label: 'SCM',          screen: 'scm'                  as Screen, Icon: IcoTruck,  soloAdmin: true  },
  { label: 'Evaluaciones', screen: 'evaluations' as Screen,          Icon: IcoStar,   soloAdmin: true  },
  { label: 'Usuarios',     screen: 'users' as Screen,                Icon: IcoPerson, soloAdmin: true  },
  { label: 'Mi actividad', screen: 'my-activity'         as Screen, Icon: IcoClock,  soloAdmin: false },
  { label: 'Mi perfil',    screen: 'my-profile'          as Screen, Icon: IcoPerson, soloAdmin: false },
  { label: 'Configuración',screen: 'settings' as Screen,             Icon: IcoGear,   soloAdmin: false },
];

function Sidebar({ screen, setScreen, esAdmin }: { screen: Screen; setScreen: (s: Screen) => void; esAdmin: boolean }) {
  const isActive = (s: Screen | null) => {
    if (!s) return false;
    if (s === 'clients' && ['clients', 'client-detail', 'crm-stage'].includes(screen)) return true;
    if (s === 'interaction-history' && screen === 'interaction-history') return true;
    return s === screen;
  };
  const items = NAV.filter(item => esAdmin || !item.soloAdmin);
  return (
    <aside className="w-48 bg-neutral-950 text-neutral-100 flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-neutral-800">
        <div className="text-base font-bold tracking-[0.2em] text-white">INFINITY</div>
        <div className="text-[10px] text-neutral-500 tracking-[0.15em] mt-0.5">CRM</div>
      </div>
      <nav className="flex-1 py-3">
        {items.map(({ label, screen: s, Icon }) => (
          <button
            key={label}
            onClick={() => s && setScreen(s)}
            className={`w-full text-left flex items-center gap-3 px-5 py-2.5 text-[13px] transition-colors ${
              isActive(s)
                ? 'bg-neutral-800 text-white border-l-2 border-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border-l-2 border-transparent'
            } ${!s ? 'opacity-40 cursor-default' : 'cursor-pointer'}`}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

function TopNav({ screen, setScreen, usuario, onLogout }: { screen: Screen; setScreen: (s: Screen) => void; usuario: UsuarioSesion | null; onLogout: () => void }) {
  const esAdmin = usuario?.rol === 'admin';
  const tabs = [
    { label: 'Catálogo',     s: 'catalog'              as Screen, soloAdmin: false },
    { label: 'Dashboard',    s: 'dashboard'           as Screen, soloAdmin: true },
    { label: 'Clientes',     s: 'clients'             as Screen, soloAdmin: true },
    { label: 'Interacciones',s: 'interaction-history' as Screen, soloAdmin: true },
    { label: 'SCM',          s: 'scm'                  as Screen, soloAdmin: true },
    { label: 'Reportes',     s: 'reports'             as Screen, soloAdmin: true },
    { label: 'Mi actividad', s: 'my-activity'         as Screen, soloAdmin: false },
  ].filter(t => esAdmin || !t.soloAdmin);
  const active = (s: Screen) => {
    if (s === 'clients' && ['clients', 'client-detail', 'crm-stage'].includes(screen)) return true;
    if (s === 'interaction-history' && screen === 'interaction-history') return true;
    return s === screen;
  };
  return (
    <header className="h-12 bg-white border-b border-neutral-200 flex items-center px-5 gap-6 shrink-0">
      <div className="flex gap-5 items-center h-full">
        {tabs.map(t => (
          <button
            key={t.label}
            onClick={() => setScreen(t.s)}
            className={`text-[13px] h-full flex items-center transition-colors ${
              active(t.s)
                ? 'text-neutral-900 font-medium border-b-2 border-neutral-900'
                : 'text-neutral-500 hover:text-neutral-800 border-b-2 border-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-1">
        <button className="w-8 h-8 flex items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"><IcoSearch /></button>
        <button className="w-8 h-8 flex items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"><IcoBell /></button>
        <button className="w-8 h-8 flex items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"><IcoPerson /></button>
        <button onClick={onLogout} title="Cerrar sesión" className="flex items-center gap-1 text-[13px] text-neutral-700 hover:text-neutral-900 px-2 py-1 rounded hover:bg-neutral-100 transition-colors">
          {usuario?.nombre ?? 'Usuario'} <IcoChevD />
        </button>
      </div>
    </header>
  );
}

export default function App() {
  const [usuario, setUsuario]   = useState<UsuarioSesion | null>(getStoredUsuario());
  const [screen, setScreen]     = useState<Screen>(() => {
    if (!getToken()) return 'login';
    return getStoredUsuario()?.rol === 'admin' ? 'dashboard' : 'my-activity';
  });

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [authMode, setAuthMode]   = useState<'login' | 'register'>('login');
  const [registerForm, setRegisterForm] = useState({ nombre: '', apellido_paterno: '', apellido_materno: '', telefono: '' });
  const [remember, setRemember]   = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const nombreValido = (value: string) => /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '’-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/.test(value.trim());
  const passwordValida = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);

  const [clientes, setClientes]       = useState<Cliente[]>([]);
  const [clientesLoading, setClientesLoading] = useState(false);
  const [search, setSearch]           = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [clientTab, setClientTab]     = useState<'informacion' | 'interacciones' | 'evaluaciones'>('interacciones');

  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [clientForm, setClientForm] = useState<{ nombre: string; correo: string; telefono: string; empresa: string; estado: 'activo' | 'inactivo' }>({ nombre: '', correo: '', telefono: '', empresa: '', estado: 'activo' });
  const [clientFormError, setClientFormError] = useState('');

  const [interacciones, setInteracciones] = useState<Interaccion[]>([]);
  const [interaccionesLoading, setInteraccionesLoading] = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [intForm, setIntForm]       = useState({ tipo: 'Llamada', descripcion: '' });
  const [intFormError, setIntFormError] = useState('');

  const [newStage, setNewStage]       = useState('Prospecto');
  const [stageFilter, setStageFilter] = useState('Todas');

  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [metricasLoading, setMetricasLoading] = useState(false);

  const [miActividad, setMiActividad] = useState<Interaccion[]>([]);
  const [actividadLoading, setActividadLoading] = useState(false);

  const [miPerfil, setMiPerfil] = useState<(UsuarioSesion & { createdAt: string }) | null>(null);
  const [perfilLoading, setPerfilLoading] = useState(false);
  const [settingsName, setSettingsName] = useState('');
  const [settingsEmail, setSettingsEmail] = useState('');
  const [passwordForm, setPasswordForm] = useState({ passwordActual: '', passwordNueva: '', confirmacion: '' });
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [usuarios, setUsuarios] = useState<UsuarioRegistrado[]>([]);
  const [usuariosLoading, setUsuariosLoading] = useState(false);

  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosLoading, setProductosLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('');
  const scmKpis = [
    { label: 'Inventario total', value: '4,280', detail: 'unidades', tone: 'bg-cyan-50 text-cyan-800' },
    { label: 'Pedidos pendientes', value: '18', detail: 'por entregar', tone: 'bg-amber-50 text-amber-700' },
    { label: 'Proveedores activos', value: '12', detail: 'vinculados', tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'Rotación', value: '91%', detail: 'eficiencia', tone: 'bg-neutral-900 text-white' },
  ];
  const scmOrdenes = [
    { id: 'PO-1042', proveedor: 'LimpiaMax', producto: 'Detergente industrial', eta: '12 sep', estado: 'En ruta' },
    { id: 'PO-1048', proveedor: 'Químicos del Norte', producto: 'Desinfectante 20L', eta: '14 sep', estado: 'Confirmado' },
    { id: 'PO-1051', proveedor: 'EcoClean', producto: 'Guantes nitrilo', eta: '17 sep', estado: 'Pendiente' },
  ];
  const scmProveedores = [
    { nombre: 'LimpiaMax', nivel: 'Crítico', entrega: '2 días', riesgo: 'Bajo' },
    { nombre: 'QN Solutions', nivel: 'Estable', entrega: '4 días', riesgo: 'Medio' },
    { nombre: 'EcoClean', nivel: 'Estrategia', entrega: '5 días', riesgo: 'Bajo' },
  ];
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [productForm, setProductForm] = useState({ nombre: '', categoria: 'Limpieza industrial', presentacion: '', descripcion: '', precio: '', imagen: '', etiquetas: '' });
  const [productFormError, setProductFormError] = useState('');

  const [globalError, setGlobalError] = useState('');

  async function reloadClientes() {
    setClientesLoading(true);
    setGlobalError('');
    try {
      const data = await api.getClientes({ busqueda: search, estado: filterEstado });
      setClientes(data.clientes);
    } catch (err) {
      setGlobalError(err instanceof ApiError ? err.message : 'No se pudo cargar la lista de clientes');
    } finally {
      setClientesLoading(false);
    }
  }

  async function reloadInteracciones(clienteId: number) {
    setInteraccionesLoading(true);
    try {
      const data = await api.getInteraccionesDeCliente(clienteId);
      setInteracciones(data);
    } catch (err) {
      setGlobalError(err instanceof ApiError ? err.message : 'No se pudieron cargar las interacciones');
    } finally {
      setInteraccionesLoading(false);
    }
  }

  async function reloadMetricas() {
    setMetricasLoading(true);
    try {
      const data = await api.getMetricas();
      setMetricas(data);
    } catch (err) {
      setGlobalError(err instanceof ApiError ? err.message : 'No se pudieron cargar las métricas');
    } finally {
      setMetricasLoading(false);
    }
  }

  async function reloadMiActividad() {
    setActividadLoading(true);
    try {
      const data = await api.getMiActividad();
      setMiActividad(data);
    } catch (err) {
      setGlobalError(err instanceof ApiError ? err.message : 'No se pudo cargar tu actividad');
    } finally {
      setActividadLoading(false);
    }
  }

  async function reloadMiPerfil() {
    setPerfilLoading(true);
    try {
      const data = await api.getMiPerfil();
      setMiPerfil(data);
      setSettingsName(data.nombre);
      setSettingsEmail(data.correo);
    } catch (err) {
      setGlobalError(err instanceof ApiError ? err.message : 'No se pudo cargar tu perfil');
    } finally {
      setPerfilLoading(false);
    }
  }

  async function reloadUsuarios() {
    setUsuariosLoading(true);
    try {
      setUsuarios(await api.getUsuarios());
    } catch (err) {
      setGlobalError(err instanceof ApiError ? err.message : 'No se pudo cargar la lista de usuarios');
    } finally {
      setUsuariosLoading(false);
    }
  }

  async function reloadProductos() {
    setProductosLoading(true);
    try {
      setProductos(await api.getProductos({ busqueda: catalogSearch, categoria: catalogCategory }));
    } catch (err) {
      setGlobalError(err instanceof ApiError ? err.message : 'No se pudo cargar el catálogo');
    } finally {
      setProductosLoading(false);
    }
  }

  async function handleSaveProfile() {
    setSettingsError('');
    setSettingsMessage('');
    try {
      const actualizado = await api.actualizarPerfil({ nombre: settingsName, correo: settingsEmail });
      setMiPerfil(prev => prev ? { ...prev, ...actualizado } : prev);
      setUsuario(prev => prev ? { ...prev, ...actualizado } : prev);
      if (actualizado) setSession(getToken() ?? '', { ...actualizado });
      setSettingsMessage('Perfil actualizado correctamente.');
    } catch (err) {
      setSettingsError(err instanceof ApiError ? err.message : 'No se pudo actualizar el perfil');
    }
  }

  async function handleChangePassword() {
    setSettingsError('');
    setSettingsMessage('');
    if (passwordForm.passwordNueva !== passwordForm.confirmacion) {
      setSettingsError('La confirmación no coincide con la nueva contraseña');
      return;
    }
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(passwordForm.passwordNueva)) {
      setSettingsError('La nueva contraseña debe tener 8 caracteres, una mayúscula, un número y un carácter especial');
      return;
    }
    try {
      await api.actualizarPassword({ passwordActual: passwordForm.passwordActual, passwordNueva: passwordForm.passwordNueva });
      setPasswordForm({ passwordActual: '', passwordNueva: '', confirmacion: '' });
      setSettingsMessage('Contraseña actualizada correctamente.');
    } catch (err) {
      setSettingsError(err instanceof ApiError ? err.message : 'No se pudo actualizar la contraseña');
    }
  }

  useEffect(() => {
    if (screen === 'clients' && usuario?.rol === 'admin') reloadClientes();
  }, [screen, search, filterEstado, usuario]);

  useEffect(() => {
    if ((screen === 'dashboard' || screen === 'reports') && usuario?.rol === 'admin') reloadMetricas();
  }, [screen, usuario]);

  useEffect(() => {
    if ((screen === 'client-detail' || screen === 'interaction-history') && selectedClient) {
      reloadInteracciones(selectedClient.id);
    }
  }, [screen, selectedClient]);

  useEffect(() => {
    if (screen === 'my-activity') reloadMiActividad();
  }, [screen]);

  useEffect(() => {
    if (screen === 'my-profile' || screen === 'settings') reloadMiPerfil();
  }, [screen]);

  useEffect(() => {
    if (screen === 'users' && usuario?.rol === 'admin') reloadUsuarios();
  }, [screen, usuario]);

  useEffect(() => {
    if (screen === 'catalog' && usuario) reloadProductos();
  }, [screen, catalogSearch, catalogCategory, usuario]);

  function openClient(c: Cliente) {
    setSelectedClient(c);
    setClientTab('interacciones');
    setScreen('client-detail');
  }

  async function handleLogin() {
    setLoginError('');
    setLoginLoading(true);
    try {
      const { token, usuario: u } = await api.login(email, password);
      setSession(token, u);
      setUsuario(u);
      setScreen(u.rol === 'admin' ? 'dashboard' : 'my-activity');
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister() {
    setLoginError('');
    const nombres = [registerForm.nombre, registerForm.apellido_paterno, registerForm.apellido_materno];
    if (nombres.some((value) => !value.trim()) || !email.trim() || !registerForm.telefono || !password) {
      setLoginError('Completa todos los campos');
      return;
    }
    if (nombres.some((value) => !nombreValido(value))) {
      setLoginError('Los nombres y apellidos solo pueden contener letras');
      return;
    }
    if (!/^\d{10}$/.test(registerForm.telefono)) {
      setLoginError('El teléfono debe tener exactamente 10 dígitos');
      return;
    }
    if (!passwordValida) {
      setLoginError('La contraseña debe tener 8 caracteres, una mayúscula, un número y un carácter especial');
      return;
    }
    setLoginLoading(true);
    try {
      await api.register({ ...registerForm, correo: email.trim(), password });
      setAuthMode('login');
      setPassword('');
      setLoginError('Cuenta creada. Ahora puedes iniciar sesión.');
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : 'No se pudo crear la cuenta');
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    clearSession();
    setUsuario(null);
    setSelectedClient(null);
    setScreen('login');
  }

  function openNewClientModal() {
    setEditingClient(null);
    setClientForm({ nombre: '', correo: '', telefono: '', empresa: '', estado: 'activo' });
    setClientFormError('');
    setShowClientModal(true);
  }

  function openNewProductModal() {
    setEditingProduct(null);
    setProductForm({ nombre: '', categoria: 'Limpieza industrial', presentacion: '', descripcion: '', precio: '', imagen: '', etiquetas: '' });
    setProductFormError('');
    setShowProductModal(true);
  }

  function openEditProductModal(producto: Producto) {
    setEditingProduct(producto);
    setProductForm({ nombre: producto.nombre, categoria: producto.categoria, presentacion: producto.presentacion, descripcion: producto.descripcion, precio: String(producto.precio), imagen: producto.imagen ?? '', etiquetas: producto.etiquetas.join(', ') });
    setProductFormError('');
    setShowProductModal(true);
  }

  async function handleSaveProduct() {
    if (!productForm.nombre.trim() || !productForm.presentacion.trim() || !productForm.descripcion.trim() || !productForm.precio) {
      setProductFormError('Completa nombre, presentación, descripción y precio');
      return;
    }
    try {
      const payload = { ...productForm, precio: Number(productForm.precio), etiquetas: productForm.etiquetas };
      if (editingProduct) await api.actualizarProducto(editingProduct.id, payload);
      else await api.crearProducto(payload);
      setShowProductModal(false);
      reloadProductos();
    } catch (err) {
      setProductFormError(err instanceof ApiError ? err.message : 'No se pudo guardar el producto');
    }
  }

  async function handleDeleteProduct(producto: Producto) {
    if (!window.confirm(`¿Ocultar ${producto.nombre} del catálogo?`)) return;
    try {
      await api.eliminarProducto(producto.id);
      reloadProductos();
    } catch (err) {
      setGlobalError(err instanceof ApiError ? err.message : 'No se pudo ocultar el producto');
    }
  }

  function openEditClientModal(c: Cliente) {
    setEditingClient(c);
    setClientForm({ nombre: c.nombre, correo: c.correo, telefono: c.telefono ?? '', empresa: c.empresa ?? '', estado: c.estado });
    setClientFormError('');
    setShowClientModal(true);
  }

  async function handleSaveClient() {
    if (!clientForm.nombre || !clientForm.correo) {
      setClientFormError('Nombre y correo son obligatorios');
      return;
    }
    try {
      if (editingClient) {
        const actualizado = await api.actualizarCliente(editingClient.id, clientForm);
        if (selectedClient?.id === editingClient.id) setSelectedClient(actualizado);
      } else {
        await api.crearCliente(clientForm);
      }
      setShowClientModal(false);
      reloadClientes();
    } catch (err) {
      setClientFormError(err instanceof ApiError ? err.message : 'No se pudo guardar el cliente');
    }
  }

  async function handleDeleteClient(c: Cliente) {
    if (!window.confirm(`¿Eliminar a ${c.nombre}? Esta acción no se puede deshacer.`)) return;
    try {
      await api.eliminarCliente(c.id);
      reloadClientes();
    } catch (err) {
      setGlobalError(err instanceof ApiError ? err.message : 'No se pudo eliminar el cliente');
    }
  }

  async function handleSaveInteraction() {
    if (!selectedClient) return;
    if (!intForm.descripcion.trim()) {
      setIntFormError('La descripción es obligatoria');
      return;
    }
    try {
      await api.crearInteraccion({
        cliente_id: selectedClient.id,
        tipo: TIPO_VALUE[intForm.tipo] ?? 'llamada',
        descripcion: intForm.descripcion,
      });
      setShowModal(false);
      setIntForm({ tipo: 'Llamada', descripcion: '' });
      setIntFormError('');
      reloadInteracciones(selectedClient.id);
    } catch (err) {
      setIntFormError(err instanceof ApiError ? err.message : 'No se pudo registrar la interacción');
    }
  }

  async function handleSaveStage() {
    if (!selectedClient) return;
    try {
      const actualizado = await api.actualizarEtapa(selectedClient.id, newStage);
      setSelectedClient(actualizado);
      setScreen('client-detail');
      reloadClientes();
    } catch (err) {
      setGlobalError(err instanceof ApiError ? err.message : 'No se pudo cambiar la etapa');
    }
  }

  function openStageScreen() {
    if (!selectedClient) return;
    setNewStage(selectedClient.etapa_crm);
    setScreen('crm-stage');
  }

  if (screen === 'login') return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
      <div className="w-full max-w-sm bg-white rounded-xl border border-neutral-200 shadow-sm p-8">
        <div className="text-center mb-7">
          <div className="text-2xl font-bold tracking-[0.2em] text-cyan-950">BRILLOMAX</div>
          <div className="text-[10px] text-neutral-400 tracking-[0.15em] mt-0.5">CRM</div>
          <p className="text-sm text-neutral-500 mt-4">{authMode === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta'}</p>
        </div>
        <div className="space-y-4">
          {authMode === 'register' && <>
            {([['nombre', 'Nombre'], ['apellido_paterno', 'Apellido paterno'], ['apellido_materno', 'Apellido materno']] as const).map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">{label}</label>
                <input value={registerForm[key]} onChange={e => setRegisterForm({ ...registerForm, [key]: e.target.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ '’-]/g, '') })} placeholder={label}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-700 focus:ring-1 focus:ring-cyan-700 transition placeholder:text-neutral-300" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">Número de teléfono</label>
              <input type="tel" inputMode="numeric" maxLength={10} value={registerForm.telefono} onChange={e => setRegisterForm({ ...registerForm, telefono: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="10 dígitos"
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-700 focus:ring-1 focus:ring-cyan-700 transition placeholder:text-neutral-300" />
            </div>
          </>}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">Correo electrónico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@ejemplo.com"
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800 transition placeholder:text-neutral-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800 transition placeholder:text-neutral-400" />
          </div>
          {authMode === 'login' && <div className="flex items-center gap-2">
            <input id="rem" type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 accent-neutral-900" />
            <label htmlFor="rem" className="text-xs text-neutral-600">Recordarme</label>
          </div>}
          {loginError && <p className="text-xs text-red-600">{loginError}</p>}
          {authMode === 'register' && <p className="text-[11px] text-neutral-500">La contraseña debe incluir una mayúscula, un número y un carácter especial.</p>}
          <button onClick={authMode === 'login' ? handleLogin : handleRegister} disabled={loginLoading}
            className="w-full bg-cyan-800 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-cyan-900 transition-colors disabled:opacity-50">
            {loginLoading ? 'Procesando...' : authMode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </div>
        <p className="text-center text-xs text-neutral-500 mt-5">
          {authMode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setLoginError(''); }} className="text-cyan-800 underline cursor-pointer hover:text-cyan-950 transition-colors">
            {authMode === 'login' ? 'Regístrate aquí' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      <Sidebar screen={screen} setScreen={setScreen} esAdmin={usuario?.rol === 'admin'} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav screen={screen} setScreen={setScreen} usuario={usuario} onLogout={handleLogout} />
        <main className="flex-1 overflow-auto">

          {globalError && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 flex items-center justify-between">
              {globalError}
              <button onClick={() => setGlobalError('')} className="text-red-400 hover:text-red-700"><IcoX /></button>
            </div>
          )}

          {screen === 'dashboard' && (
            <div className="p-6 max-w-5xl">
              <h1 className="text-xl font-semibold text-neutral-900 mb-0.5">Resumen CRM</h1>
              <p className="text-sm text-neutral-400 mb-5">Vista general de indicadores clave</p>
              {metricasLoading && <p className="text-sm text-neutral-400 mb-4">Cargando métricas…</p>}
              {metricas && (
                <>
                  <div className="grid grid-cols-4 gap-4 mb-5">
                    {[
                      { label: 'Total de clientes',         value: metricas.total_clientes,    sub: 'Todos los clientes', dim: false },
                      { label: 'Clientes activos',          value: metricas.clientes_activos,  sub: metricas.total_clientes ? `${Math.round((metricas.clientes_activos / metricas.total_clientes) * 100)}% del total` : '', dim: false },
                      { label: 'Clientes inactivos',        value: metricas.clientes_inactivos, sub: '', dim: false },
                      { label: 'Clientes sin interacción',  value: metricas.clientes_sin_interaccion_reciente.length, sub: 'Últimos 30 días', dim: true },
                    ].map(s => (
                      <div key={s.label} className="bg-white rounded-lg border border-neutral-200 p-4">
                        <p className="text-xs text-neutral-500 leading-snug mb-2">{s.label}</p>
                        <p className={`text-3xl font-bold ${s.dim ? 'text-neutral-400' : 'text-neutral-900'}`}>{s.value}</p>
                        {s.sub && <p className="text-xs text-neutral-400 mt-1">{s.sub}</p>}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg border border-neutral-200 p-4">
                      <h2 className="text-sm font-semibold text-neutral-800 mb-4">Clientes activos vs inactivos</h2>
                      <div className="flex items-center gap-5">
                        <DonutChart pct={metricas.total_clientes ? (metricas.clientes_activos / metricas.total_clientes) * 100 : 0} />
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2.5 text-sm">
                            <div className="w-3 h-3 rounded-sm bg-neutral-900" />
                            <span className="text-neutral-700">Activos <strong>{metricas.clientes_activos}</strong></span>
                          </div>
                          <div className="flex items-center gap-2.5 text-sm">
                            <div className="w-3 h-3 rounded-sm bg-neutral-200 border border-neutral-300" />
                            <span className="text-neutral-700">Inactivos <strong>{metricas.clientes_inactivos}</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-neutral-200 p-4">
                      <h2 className="text-sm font-semibold text-neutral-800 mb-3">Clientes en riesgo</h2>
                      <div className="space-y-0">
                        {metricas.clientes_sin_interaccion_reciente.length === 0 && (
                          <p className="text-xs text-neutral-400 py-2">Ningún cliente en riesgo por ahora.</p>
                        )}
                        {metricas.clientes_sin_interaccion_reciente.slice(0, 5).map((c, i, arr) => (
                          <div key={c.id} className={`flex items-start justify-between py-2.5 ${i < arr.length - 1 ? 'border-b border-neutral-100' : ''}`}>
                            <div>
                              <p className="text-sm font-medium text-neutral-800">{c.nombre}</p>
                              <p className="text-xs text-neutral-400">{c.empresa ?? 'Sin empresa'} · sin interacción reciente</p>
                            </div>
                            <IcoChevR />
                          </div>
                        ))}
                      </div>
                    </div>
                    <InteractionBarChart data={metricas.interacciones_por_tipo} />
                  </div>
                </>
              )}
            </div>
          )}

          {screen === 'catalog' && (
            <div className="p-6 max-w-6xl">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-semibold text-neutral-900">Catálogo de productos</h1>
                  <p className="text-sm text-neutral-500 mt-1">Productos de limpieza y desinfección industrial</p>
                </div>
                {usuario?.rol === 'admin' && <button onClick={openNewProductModal} className="bg-neutral-950 text-white text-sm px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors">+ Nuevo producto</button>}
              </div>
              <div className="flex gap-3 mb-5">
                <input value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} placeholder="Buscar producto..." className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800 placeholder:text-neutral-300" />
                <select value={catalogCategory} onChange={e => setCatalogCategory(e.target.value)} className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white text-neutral-700 outline-none">
                  <option value="">Todas las categorías</option>
                  {[...new Set(productos.map(producto => producto.categoria))].map(categoria => <option key={categoria} value={categoria}>{categoria}</option>)}
                </select>
              </div>
              {productosLoading && <p className="text-sm text-neutral-400 mb-4">Cargando catálogo...</p>}
              {!productosLoading && productos.length === 0 && <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center text-sm text-neutral-400">No hay productos disponibles.</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {productos.map(producto => (
                  <article key={producto.id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm flex flex-col">
                    <div className="h-32 bg-cyan-50 flex items-center justify-center text-6xl">{producto.imagen ? <img src={producto.imagen} alt={producto.nombre} className="h-full w-full object-cover" /> : '🧴'}</div>
                    <div className="p-5 flex flex-col flex-1">
                      <p className="text-xs text-cyan-700 font-medium mb-1">{producto.categoria}</p>
                      <h2 className="text-base font-semibold text-cyan-950">{producto.nombre}</h2>
                      <p className="text-sm text-cyan-700 mt-1">{producto.presentacion}</p>
                      <p className="text-sm text-neutral-500 leading-relaxed mt-3 flex-1">{producto.descripcion}</p>
                      <div className="flex flex-wrap gap-1.5 mt-4">{producto.etiquetas.map(etiqueta => <span key={etiqueta} className="rounded-full bg-cyan-50 text-cyan-700 px-2.5 py-1 text-[11px]">{etiqueta}</span>)}</div>
                      <div className="flex items-end justify-between mt-5 pt-4 border-t border-neutral-100">
                        <div><p className="text-xl font-bold text-cyan-950">${Number(producto.precio).toFixed(2)}</p><p className="text-xs text-neutral-400">por {producto.presentacion}</p></div>
                        {usuario?.rol === 'admin' && <div className="flex gap-2"><button onClick={() => openEditProductModal(producto)} className="text-xs text-neutral-600 underline">Editar</button><button onClick={() => handleDeleteProduct(producto)} className="text-xs text-red-500 underline">Ocultar</button></div>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {screen === 'clients' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-semibold text-neutral-900">Clientes</h1>
                <button onClick={openNewClientModal} className="bg-neutral-950 text-white text-sm px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors">+ Nuevo cliente</button>
              </div>
              <div className="flex gap-3 mb-4">
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, empresa, correo..."
                  className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800 placeholder:text-neutral-300" />
                <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
                  className="border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800 bg-white text-neutral-700">
                  <option value="">Filtrar por estado</option>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
              <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      {['ID', 'Nombre', 'Empresa', 'Correo', 'Teléfono', 'Etapa CRM', 'Estado', 'Acciones'].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-neutral-500 px-4 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clientesLoading && (
                      <tr><td colSpan={8} className="px-4 py-6 text-center text-neutral-400 text-sm">Cargando clientes…</td></tr>
                    )}
                    {!clientesLoading && clientes.length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-6 text-center text-neutral-400 text-sm">No hay clientes que coincidan con la búsqueda.</td></tr>
                    )}
                    {clientes.map(c => (
                      <tr key={c.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-3 text-neutral-400">{c.id}</td>
                        <td className="px-4 py-3 font-medium text-neutral-900 whitespace-nowrap">{c.nombre}</td>
                        <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{c.empresa}</td>
                        <td className="px-4 py-3 text-neutral-600">{c.correo}</td>
                        <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{c.telefono}</td>
                        <td className="px-4 py-3"><EtapaBadge etapa={c.etapa_crm} /></td>
                        <td className="px-4 py-3"><StatusBadge estado={c.estado} /></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => openClient(c)} className="text-xs text-neutral-600 hover:text-neutral-900 underline transition-colors">Ver</button>
                            <button onClick={() => openEditClientModal(c)} className="text-xs text-neutral-600 hover:text-neutral-900 underline transition-colors">Editar</button>
                            <button onClick={() => handleDeleteClient(c)} className="text-xs text-neutral-400 hover:text-neutral-700 underline transition-colors">Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-3 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Mostrando {clientes.length} cliente(s)</span>
                </div>
              </div>
            </div>
          )}

          {screen === 'client-detail' && selectedClient && (
            <div className="p-6">
              <button onClick={() => setScreen('clients')} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors mb-4">
                <IcoBack /> Volver a clientes
              </button>
              <div className="bg-white rounded-lg border border-neutral-200 p-5 mb-4">
                <div className="flex items-center gap-4 mb-5">
                  <Initials name={selectedClient.nombre} size="lg" />
                  <div>
                    <h1 className="text-lg font-semibold text-neutral-900">{selectedClient.nombre}</h1>
                    <p className="text-sm text-neutral-500">{selectedClient.empresa ?? 'Sin empresa'}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <EtapaBadge etapa={selectedClient.etapa_crm} />
                      <StatusBadge estado={selectedClient.estado} />
                    </div>
                    <p className="text-xs text-neutral-400 mt-1.5">{selectedClient.correo} · {selectedClient.telefono ?? 'Sin teléfono'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditClientModal(selectedClient)} className="px-4 py-2 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50 text-neutral-700 transition-colors">Editar cliente</button>
                  <button onClick={openStageScreen} className="px-4 py-2 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50 text-neutral-700 transition-colors">Cambiar etapa</button>
                </div>
              </div>
              <div className="flex border-b border-neutral-200 mb-4">
                {(['informacion', 'interacciones', 'evaluaciones'] as const).map(tab => (
                  <button key={tab} onClick={() => setClientTab(tab)}
                    className={`px-4 py-2.5 text-sm capitalize transition-colors ${
                      clientTab === tab
                        ? 'text-neutral-900 font-medium border-b-2 border-neutral-900 -mb-px'
                        : 'text-neutral-500 hover:text-neutral-700 border-b-2 border-transparent'
                    }`}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              {clientTab === 'interacciones' && (
                <div className="space-y-0 bg-white rounded-lg border border-neutral-200 p-5">
                  {interaccionesLoading && <p className="text-sm text-neutral-400">Cargando interacciones…</p>}
                  {!interaccionesLoading && interacciones.length === 0 && (
                    <p className="text-sm text-neutral-400">Este cliente todavía no tiene interacciones registradas.</p>
                  )}
                  {interacciones.slice(0, 3).map((int, i) => (
                    <div key={int.id}>
                      <InteractionRow int={int} />
                      {i < Math.min(interacciones.length, 3) - 1 && <div className="border-b border-neutral-100 my-4" />}
                    </div>
                  ))}
                  <div className="border-t border-neutral-100 mt-4 pt-3">
                    <button onClick={() => setScreen('interaction-history')} className="text-xs text-neutral-500 hover:text-neutral-800 underline transition-colors">Ver historial completo →</button>
                  </div>
                </div>
              )}
              {clientTab === 'informacion' && (
                <div className="bg-white rounded-lg border border-neutral-200 p-5 text-sm text-neutral-600 space-y-1.5">
                  <p><strong>Correo:</strong> {selectedClient.correo}</p>
                  <p><strong>Teléfono:</strong> {selectedClient.telefono ?? '—'}</p>
                  <p><strong>Empresa:</strong> {selectedClient.empresa ?? '—'}</p>
                  <p><strong>Fecha de registro:</strong> {new Date(selectedClient.fecha_registro).toLocaleDateString('es-MX')}</p>
                </div>
              )}
              {clientTab === 'evaluaciones' && (
                <div className="bg-white rounded-lg border border-neutral-200 p-5 text-sm text-neutral-500">
                  No hay evaluaciones registradas para este cliente.
                </div>
              )}
            </div>
          )}

          {screen === 'client-detail' && !selectedClient && (
            <div className="p-6 text-sm text-neutral-500">Selecciona un cliente desde la lista.</div>
          )}

          {screen === 'interaction-history' && selectedClient && (
            <div className="p-6">
              <button onClick={() => setScreen('client-detail')} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors mb-4">
                <IcoBack /> Volver a cliente
              </button>
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-semibold text-neutral-900">Historial de interacciones – {selectedClient.nombre}</h1>
                <button onClick={() => { setIntFormError(''); setShowModal(true); }} className="bg-neutral-950 text-white text-sm px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors">+ Nueva Interacción</button>
              </div>
              <div className="bg-white rounded-lg border border-neutral-200 p-5">
                {interaccionesLoading && <p className="text-sm text-neutral-400">Cargando…</p>}
                {!interaccionesLoading && interacciones.length === 0 && (
                  <p className="text-sm text-neutral-400">Aún no hay interacciones registradas para este cliente.</p>
                )}
                <div className="space-y-0">
                  {interacciones.map((int, i) => (
                    <div key={int.id}>
                      <InteractionRow int={int} />
                      {i < interacciones.length - 1 && <div className="border-b border-neutral-100 my-4" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {screen === 'interaction-history' && !selectedClient && (
            <div className="p-6 text-sm text-neutral-500">Selecciona un cliente desde la lista para ver su historial.</div>
          )}

          {screen === 'evaluations' && (
            <div className="p-6">
              <h1 className="text-xl font-semibold text-neutral-900">Evaluaciones</h1>
              <p className="text-sm text-neutral-500 mt-1">Evaluaciones de calidad y satisfacción de clientes</p>
              <div className="bg-white rounded-lg border border-neutral-200 p-5 mt-8 min-h-[440px] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-cyan-50 text-cyan-400 flex items-center justify-center mb-7">
                  <IcoStar />
                </div>
                <h2 className="text-xl font-medium text-cyan-950">Sin evaluaciones registradas</h2>
                <p className="text-base text-neutral-500 mt-2 max-w-sm">Las evaluaciones de clientes aparecerán aquí una vez que sean registradas.</p>
                <button className="mt-8 bg-cyan-700 text-white text-base font-medium px-7 py-3 rounded-lg hover:bg-cyan-800 transition-colors">
                  + Nueva evaluación
                </button>
              </div>
            </div>
          )}

          {screen === 'scm' && (
            <div className="p-6 max-w-6xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-semibold text-neutral-900">SCM y logística</h1>
                  <p className="text-sm text-neutral-500 mt-1">Control de inventario, proveedores y entregas</p>
                </div>
                <button className="bg-neutral-950 text-white text-sm px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors">+ Nuevo pedido</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {scmKpis.map(item => (
                  <div key={item.label} className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
                    <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${item.tone}`}>{item.label}</div>
                    <div className="mt-4 text-3xl font-bold text-neutral-900">{item.value}</div>
                    <div className="mt-1 text-xs text-neutral-500">{item.detail}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-5">
                <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-neutral-800">Pedidos por entregar</h2>
                    <span className="text-xs text-neutral-500">Últimos 3</span>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {scmOrdenes.map(order => (
                      <div key={order.id} className="px-5 py-4 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium text-neutral-900">{order.id}</div>
                          <div className="text-xs text-neutral-500 mt-1">{order.producto} · {order.proveedor}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-neutral-500">ETA</div>
                          <div className="text-sm text-neutral-800">{order.eta}</div>
                        </div>
                        <span className="inline-flex rounded-full bg-neutral-100 text-neutral-700 px-2.5 py-1 text-[11px] font-medium">{order.estado}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-neutral-200 p-5">
                  <h2 className="text-sm font-semibold text-neutral-800 mb-4">Proveedores clave</h2>
                  <div className="space-y-3">
                    {scmProveedores.map(prov => (
                      <div key={prov.nombre} className="rounded-lg bg-neutral-50 border border-neutral-200 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-neutral-800">{prov.nombre}</span>
                          <span className="text-[11px] px-2 py-1 rounded-full bg-cyan-100 text-cyan-800">{prov.nivel}</span>
                        </div>
                        <div className="text-xs text-neutral-500">Entrega: {prov.entrega}</div>
                        <div className="text-xs text-neutral-500 mt-1">Riesgo: {prov.riesgo}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {screen === 'scm' && (
            <div className="p-6 max-w-6xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-semibold text-neutral-900">SCM y logística</h1>
                  <p className="text-sm text-neutral-500 mt-1">Control de inventario, proveedores y entregas</p>
                </div>
                <button className="bg-neutral-950 text-white text-sm px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors">+ Nuevo pedido</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {scmKpis.map(item => (
                  <div key={item.label} className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
                    <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${item.tone}`}>{item.label}</div>
                    <div className="mt-4 text-3xl font-bold text-neutral-900">{item.value}</div>
                    <div className="mt-1 text-xs text-neutral-500">{item.detail}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-5">
                <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-neutral-800">Pedidos por entregar</h2>
                    <span className="text-xs text-neutral-500">Últimos 3</span>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {scmOrdenes.map(order => (
                      <div key={order.id} className="px-5 py-4 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium text-neutral-900">{order.id}</div>
                          <div className="text-xs text-neutral-500 mt-1">{order.producto} · {order.proveedor}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-neutral-500">ETA</div>
                          <div className="text-sm text-neutral-800">{order.eta}</div>
                        </div>
                        <span className="inline-flex rounded-full bg-neutral-100 text-neutral-700 px-2.5 py-1 text-[11px] font-medium">{order.estado}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-neutral-200 p-5">
                  <h2 className="text-sm font-semibold text-neutral-800 mb-4">Proveedores clave</h2>
                  <div className="space-y-3">
                    {scmProveedores.map(prov => (
                      <div key={prov.nombre} className="rounded-lg bg-neutral-50 border border-neutral-200 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-neutral-800">{prov.nombre}</span>
                          <span className="text-[11px] px-2 py-1 rounded-full bg-cyan-100 text-cyan-800">{prov.nivel}</span>
                        </div>
                        <div className="text-xs text-neutral-500">Entrega: {prov.entrega}</div>
                        <div className="text-xs text-neutral-500 mt-1">Riesgo: {prov.riesgo}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {screen === 'users' && (
            <div className="p-6">
              <div className="flex items-start justify-between mb-7">
                <div>
                  <h1 className="text-xl font-semibold text-neutral-900">Usuarios</h1>
                  <p className="text-sm text-neutral-500 mt-1">Gestión de cuentas registradas</p>
                </div>
                <span className="rounded-full bg-cyan-50 text-cyan-700 px-4 py-1.5 text-sm font-medium">
                  {usuarios.length} {usuarios.length === 1 ? 'usuario' : 'usuarios'}
                </span>
              </div>
              <div className="bg-white rounded-lg border border-neutral-200 overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-cyan-100 bg-cyan-50/60 text-cyan-800">
                      {['ID', 'Nombre', 'Correo', 'Rol', 'Estado', 'Registro', 'Acciones'].map((heading) => (
                        <th key={heading} className="text-left font-medium px-5 py-4 whitespace-nowrap">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosLoading && <tr><td colSpan={7} className="px-5 py-8 text-center text-neutral-400">Cargando usuarios...</td></tr>}
                    {!usuariosLoading && usuarios.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-neutral-400">Aún no hay usuarios registrados.</td></tr>}
                    {!usuariosLoading && usuarios.map((item) => {
                      const nombreCompleto = [item.nombre, item.apellido_paterno, item.apellido_materno].filter(Boolean).join(' ');
                      return (
                        <tr key={item.id} className="border-b border-neutral-100 last:border-0 hover:bg-cyan-50/40 transition-colors">
                          <td className="px-5 py-4 text-neutral-500">{item.id}</td>
                          <td className="px-5 py-4 font-medium text-neutral-900 whitespace-nowrap">{nombreCompleto}</td>
                          <td className="px-5 py-4 text-neutral-600 whitespace-nowrap">{item.correo}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-block rounded px-2.5 py-1 font-medium ${item.rol === 'admin' ? 'bg-cyan-900 text-white' : 'bg-cyan-50 text-cyan-700'}`}>
                              {item.rol === 'admin' ? 'Admin' : 'Usuario'}
                            </span>
                          </td>
                          <td className="px-5 py-4"><span className="inline-block rounded-full bg-emerald-500 text-white px-3 py-1 font-medium">Activo</span></td>
                          <td className="px-5 py-4 text-neutral-500 whitespace-nowrap">{new Date(item.createdAt).toLocaleDateString('es-MX')}</td>
                          <td className="px-5 py-4 text-neutral-400">{item.id === usuario?.id ? 'Tú' : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {screen === 'crm-stage' && selectedClient && (
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 max-w-2xl">
                <div className="bg-white rounded-lg border border-neutral-200 p-5">
                  <h1 className="text-base font-semibold text-neutral-900 mb-0.5">Editar etapa CRM</h1>
                  <p className="text-sm text-neutral-400 mb-5">{selectedClient.nombre}</p>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">Nueva etapa</label>
                  <select value={newStage} onChange={e => setNewStage(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800 bg-white mb-4">
                    {ETAPAS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs text-neutral-500 mb-5 leading-relaxed">
                    Los cambios en la etapa ayudan a dar mejor seguimiento y priorizar a tus clientes.
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setScreen('client-detail')} className="flex-1 py-2 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50 text-neutral-700 transition-colors">Cancelar</button>
                    <button onClick={handleSaveStage} className="flex-1 py-2 text-sm bg-neutral-950 text-white rounded-lg hover:bg-neutral-800 transition-colors">Guardar cambios</button>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-neutral-200 p-5">
                  <h2 className="text-sm font-semibold text-neutral-800 mb-3">Filtrar por etapa</h2>
                  <div className="space-y-1">
                    {['Todas', ...ETAPAS].map(s => (
                      <button key={s} onClick={() => setStageFilter(s)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          stageFilter === s ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'
                        }`}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {screen === 'my-activity' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-semibold text-neutral-900">Mi actividad</h1>
              </div>
              <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      {['Fecha', 'Cliente', 'Tipo', 'Descripción'].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-neutral-500 px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {actividadLoading && (
                      <tr><td colSpan={4} className="px-4 py-6 text-center text-neutral-400 text-sm">Cargando…</td></tr>
                    )}
                    {!actividadLoading && miActividad.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-6 text-center text-neutral-400 text-sm">Todavía no has registrado interacciones.</td></tr>
                    )}
                    {miActividad.map(a => (
                      <tr key={a.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">{new Date(a.fecha).toLocaleString('es-MX')}</td>
                        <td className="px-4 py-3 font-medium text-neutral-800 whitespace-nowrap">{a.cliente?.nombre ?? '—'}</td>
                        <td className="px-4 py-3"><TipoBadge tipo={a.tipo} /></td>
                        <td className="px-4 py-3 text-neutral-600">{a.descripcion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-3 border-t border-neutral-100">
                  <span className="text-xs text-neutral-400">Mostrando {miActividad.length} actividad(es)</span>
                </div>
              </div>
            </div>
          )}

          {screen === 'my-profile' && (
            <div className="p-6 max-w-md">
              <h1 className="text-xl font-semibold text-neutral-900 mb-5">Mi perfil</h1>
              <div className="bg-white rounded-lg border border-neutral-200 p-5">
                {perfilLoading && <p className="text-sm text-neutral-400">Cargando…</p>}
                {miPerfil && (
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <Initials name={`${miPerfil.nombre} ${miPerfil.apellido_paterno ?? ''}`} size="lg" />
                      <div>
                        <p className="text-base font-semibold text-neutral-900">{miPerfil.nombre}</p>
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-xs font-medium bg-neutral-200 text-neutral-700 capitalize">{miPerfil.rol}</span>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div><p className="text-xs text-neutral-400">Apellido paterno</p><p className="text-neutral-800">{miPerfil.apellido_paterno || '—'}</p></div>
                      <div><p className="text-xs text-neutral-400">Apellido materno</p><p className="text-neutral-800">{miPerfil.apellido_materno || '—'}</p></div>
                      <div><p className="text-xs text-neutral-400">Teléfono</p><p className="text-neutral-800">{miPerfil.telefono || '—'}</p></div>
                      <div><p className="text-xs text-neutral-400">Correo electrónico</p><p className="text-neutral-800">{miPerfil.correo}</p></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {screen === 'settings' && (
            <div className="p-6 max-w-4xl">
              <h1 className="text-xl font-semibold text-neutral-900">Configuración</h1>
              <p className="text-sm text-neutral-500 mt-1 mb-7">Perfil y seguridad de tu cuenta</p>

              <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-cyan-900 mb-6">Información de perfil</h2>
                <div className="flex items-center gap-4 mb-7">
                  <Initials name={settingsName || miPerfil?.nombre || 'Usuario'} size="lg" />
                  <div>
                    <p className="text-lg font-semibold text-neutral-900">{settingsName || miPerfil?.nombre || 'Usuario'}</p>
                    <p className="text-sm text-neutral-500">{settingsEmail || miPerfil?.correo || ''}</p>
                    {miPerfil && <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-xs font-medium bg-cyan-100 text-cyan-800 capitalize">{miPerfil.rol === 'admin' ? 'Administrador' : 'Usuario'}</span>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <label className="block text-sm font-medium text-neutral-700">
                    Nombre completo
                    <input value={settingsName} onChange={e => setSettingsName(e.target.value)} className="mt-2 w-full border border-cyan-200 rounded-lg px-4 py-3 text-base outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" />
                  </label>
                  <label className="block text-sm font-medium text-neutral-700">
                    Correo electrónico
                    <input type="email" value={settingsEmail} onChange={e => setSettingsEmail(e.target.value)} className="mt-2 w-full border border-cyan-200 rounded-lg px-4 py-3 text-base outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" />
                  </label>
                </div>
                <button onClick={handleSaveProfile} className="mt-6 bg-cyan-700 text-white rounded-lg px-5 py-3 text-sm font-medium hover:bg-cyan-800 transition-colors">Guardar cambios</button>
              </div>

              <div className="bg-white rounded-lg border border-neutral-200 p-6">
                <h2 className="text-lg font-semibold text-cyan-900 mb-6">Cambiar contraseña</h2>
                <div className="space-y-5">
                  <label className="block text-sm font-medium text-neutral-700">
                    Contraseña actual
                    <input type="password" value={passwordForm.passwordActual} onChange={e => setPasswordForm({ ...passwordForm, passwordActual: e.target.value })} className="mt-2 w-full border border-cyan-200 rounded-lg px-4 py-3 text-base outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" />
                  </label>
                  <label className="block text-sm font-medium text-neutral-700">
                    Nueva contraseña
                    <input type="password" value={passwordForm.passwordNueva} onChange={e => setPasswordForm({ ...passwordForm, passwordNueva: e.target.value })} placeholder="Mín. 8 caracteres con mayúscula, número y especial" className="mt-2 w-full border border-cyan-200 rounded-lg px-4 py-3 text-base outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 placeholder:text-neutral-300" />
                  </label>
                  <label className="block text-sm font-medium text-neutral-700">
                    Confirmar nueva contraseña
                    <input type="password" value={passwordForm.confirmacion} onChange={e => setPasswordForm({ ...passwordForm, confirmacion: e.target.value })} className="mt-2 w-full border border-cyan-200 rounded-lg px-4 py-3 text-base outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" />
                  </label>
                </div>
                <button onClick={handleChangePassword} className="mt-6 bg-cyan-700 text-white rounded-lg px-5 py-3 text-sm font-medium hover:bg-cyan-800 transition-colors">Actualizar contraseña</button>
              </div>
              {(settingsMessage || settingsError) && <p className={`mt-4 text-sm ${settingsError ? 'text-red-600' : 'text-emerald-600'}`}>{settingsError || settingsMessage}</p>}
            </div>
          )}

          {screen === 'reports' && metricas && (
            <div className="p-6 max-w-5xl">
              <h1 className="text-xl font-semibold text-neutral-900 mb-5">Reportes y métricas</h1>
              <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                  { label: 'Total de clientes',        value: metricas.total_clientes },
                  { label: 'Clientes activos',         value: metricas.clientes_activos },
                  { label: 'Clientes sin interacción', value: metricas.clientes_sin_interaccion_reciente.length },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-lg border border-neutral-200 p-4">
                    <p className="text-xs text-neutral-500 leading-snug mb-2">{s.label}</p>
                    <p className="text-3xl font-bold text-neutral-900">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-lg border border-neutral-200 p-5">
                <h2 className="text-sm font-semibold text-neutral-800 mb-4">Interacciones por cliente</h2>
                {metricas.interacciones_por_cliente.length === 0 && (
                  <p className="text-sm text-neutral-400">Aún no hay interacciones registradas.</p>
                )}
                <div className="space-y-2">
                  {metricas.interacciones_por_cliente.slice(0, 10).map(row => (
                    <div key={row.cliente_id} className="flex items-center justify-between text-sm border-b border-neutral-100 last:border-0 py-1.5">
                      <span className="text-neutral-700">{row.cliente?.nombre ?? `Cliente #${row.cliente_id}`}</span>
                      <span className="font-medium text-neutral-900">{row.total_interacciones}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setShowProductModal(false); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
              <h2 className="text-base font-semibold text-neutral-900">{editingProduct ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button onClick={() => setShowProductModal(false)} className="text-neutral-400 hover:text-neutral-700 transition-colors"><IcoX /></button>
            </div>
            <div className="p-5 space-y-4">
              {([
                ['nombre', 'Nombre del producto', 'Ej. Detergente Industrial BrilloMax Pro'],
                ['categoria', 'Categoría', 'Limpieza industrial'],
                ['presentacion', 'Presentación', 'Cubeta 20L'],
                ['precio', 'Precio', '349.00'],
                ['imagen', 'URL de imagen (opcional)', 'https://...'],
                ['etiquetas', 'Etiquetas', 'Desengrasante, Biodegradable'],
              ] as const).map(([key, label, placeholder]) => (
                <label key={key} className="block text-xs font-medium text-neutral-700">{label}
                  <input type={key === 'precio' ? 'number' : 'text'} min={key === 'precio' ? '0' : undefined} step={key === 'precio' ? '0.01' : undefined} value={productForm[key]} onChange={e => setProductForm(form => ({ ...form, [key]: e.target.value }))} placeholder={placeholder} className="mt-1.5 w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800 placeholder:text-neutral-300" />
                </label>
              ))}
              <label className="block text-xs font-medium text-neutral-700">Descripción
                <textarea value={productForm.descripcion} onChange={e => setProductForm(form => ({ ...form, descripcion: e.target.value }))} rows={3} placeholder="Describe el uso y beneficios del producto" className="mt-1.5 w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800 resize-none placeholder:text-neutral-300" />
              </label>
              {productFormError && <p className="text-xs text-red-600">{productFormError}</p>}
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setShowProductModal(false)} className="flex-1 py-2 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50 text-neutral-700 transition-colors">Cancelar</button>
              <button onClick={handleSaveProduct} className="flex-1 py-2 text-sm bg-neutral-950 text-white rounded-lg hover:bg-neutral-800 transition-colors">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setShowClientModal(false); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
              <h2 className="text-base font-semibold text-neutral-900">{editingClient ? 'Editar cliente' : 'Nuevo cliente'}</h2>
              <button onClick={() => setShowClientModal(false)} className="text-neutral-400 hover:text-neutral-700 transition-colors"><IcoX /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">Nombre</label>
                <input type="text" value={clientForm.nombre} onChange={e => setClientForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800" />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">Correo</label>
                <input type="email" value={clientForm.correo} onChange={e => setClientForm(f => ({ ...f, correo: e.target.value }))}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">Teléfono</label>
                  <input type="text" value={clientForm.telefono} onChange={e => setClientForm(f => ({ ...f, telefono: e.target.value }))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">Empresa</label>
                  <input type="text" value={clientForm.empresa} onChange={e => setClientForm(f => ({ ...f, empresa: e.target.value }))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800" />
                </div>
              </div>
              {editingClient && (
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">Estado</label>
                  <select value={clientForm.estado} onChange={e => setClientForm(f => ({ ...f, estado: e.target.value as 'activo' | 'inactivo' }))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800 bg-white">
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              )}
              {clientFormError && <p className="text-xs text-red-600">{clientFormError}</p>}
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setShowClientModal(false)} className="flex-1 py-2 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50 text-neutral-700 transition-colors">Cancelar</button>
              <button onClick={handleSaveClient} className="flex-1 py-2 text-sm bg-neutral-950 text-white rounded-lg hover:bg-neutral-800 transition-colors">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
              <h2 className="text-base font-semibold text-neutral-900">Nueva Interacción</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-700 transition-colors"><IcoX /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">Tipo de interacción</label>
                <select value={intForm.tipo} onChange={e => setIntForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800 bg-white">
                  {['Llamada', 'Correo', 'Reunión'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">Descripción</label>
                <textarea value={intForm.descripcion} onChange={e => setIntForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Se confirmó el pedido de 50 piezas para entrega en junio." rows={3}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800 resize-none placeholder:text-neutral-300" />
              </div>
              {intFormError && <p className="text-xs text-red-600">{intFormError}</p>}
              <p className="text-xs text-neutral-400">La fecha y el responsable se registran automáticamente (ahora / tu usuario).</p>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50 text-neutral-700 transition-colors">Cancelar</button>
              <button onClick={handleSaveInteraction} className="flex-1 py-2 text-sm bg-neutral-950 text-white rounded-lg hover:bg-neutral-800 transition-colors">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
