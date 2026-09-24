import { useState } from 'react';

interface ScmProducto {
  id: number; nombre: string; categoria: string;
  stock: number; stockMin: number; estrategia: 'PUSH' | 'PULL';
  costo: number; proveedorId: number; emoji: string;
}
interface ScmProveedor {
  id: number; nombre: string; contacto: string;
  correo: string; telefono: string; direccion: string;
}
interface ScmMovimiento {
  id: number; fecha: string; productoId: number;
  tipo: 'Entrada' | 'Salida'; cantidad: number; motivo: string; usuario: string;
}
interface ScmPedido {
  folio: string; fecha: string; productoId: number; cantidad: number;
  tipo: 'Reposición' | 'Venta'; estado: 'Pendiente' | 'En proceso' | 'Surtido' | 'Cancelado';
  proveedorId: number; notas: string;
}

const INIT_PRODUCTOS: ScmProducto[] = [
  { id: 1, nombre: 'Vasija de barro',  categoria: 'Cerámica',   stock: 25, stockMin: 10, estrategia: 'PUSH', costo: 280, proveedorId: 1, emoji: '🏺' },
  { id: 2, nombre: 'Textil bordado',   categoria: 'Textil',     stock: 12, stockMin: 10, estrategia: 'PULL', costo: 450, proveedorId: 2, emoji: '🧶' },
  { id: 3, nombre: 'Alebrije',         categoria: 'Decoración', stock: 8,  stockMin: 5,  estrategia: 'PUSH', costo: 320, proveedorId: 4, emoji: '🦎' },
  { id: 4, nombre: 'Collar artesanal', categoria: 'Joyería',    stock: 30, stockMin: 15, estrategia: 'PULL', costo: 180, proveedorId: 3, emoji: '📿' },
  { id: 5, nombre: 'Figura de barro',  categoria: 'Cerámica',   stock: 6,  stockMin: 10, estrategia: 'PUSH', costo: 210, proveedorId: 1, emoji: '🏺' },
];
const INIT_PROVEEDORES: ScmProveedor[] = [
  { id: 1, nombre: 'Artesanías del Sur',  contacto: 'Juan Pérez',  correo: 'juan@sur.com',      telefono: '55 1234 5678', direccion: 'Av. Oaxaca 100' },
  { id: 2, nombre: 'Textiles Oaxaqueños', contacto: 'María López', correo: 'maria@oax.com',     telefono: '55 8765 4321', direccion: 'Calle Telar 45' },
  { id: 3, nombre: 'Barros y Tradición',  contacto: 'Carlos Ruiz', correo: 'carlos@barro.com',  telefono: '55 2222 3333', direccion: 'Blvd. Artesanos 8' },
  { id: 4, nombre: 'Alebrijos García',    contacto: 'Ana Torres',  correo: 'ana@alebrijos.com', telefono: '55 4444 5555', direccion: 'Mercado 20 Nov. Local 12' },
];
const INIT_MOVIMIENTOS: ScmMovimiento[] = [
  { id: 1, fecha: '10/04/2025', productoId: 1, tipo: 'Entrada', cantidad: 50, motivo: 'Compra',     usuario: 'Admin' },
  { id: 2, fecha: '09/04/2025', productoId: 2, tipo: 'Salida',  cantidad: 5,  motivo: 'Pedido',     usuario: 'Usuario1' },
  { id: 3, fecha: '08/04/2025', productoId: 3, tipo: 'Entrada', cantidad: 20, motivo: 'Ajuste',     usuario: 'Admin' },
  { id: 4, fecha: '07/04/2025', productoId: 4, tipo: 'Salida',  cantidad: 10, motivo: 'Venta',      usuario: 'Usuario2' },
  { id: 5, fecha: '05/04/2025', productoId: 5, tipo: 'Entrada', cantidad: 30, motivo: 'Compra',     usuario: 'Admin' },
];
const INIT_PEDIDOS: ScmPedido[] = [
  { folio: 'PC-001', fecha: '10/04/2025', productoId: 1, cantidad: 50, tipo: 'Reposición', estado: 'Pendiente',  proveedorId: 1, notas: '' },
  { folio: 'PC-002', fecha: '08/04/2025', productoId: 2, cantidad: 30, tipo: 'Reposición', estado: 'En proceso', proveedorId: 2, notas: '' },
  { folio: 'PC-003', fecha: '05/04/2025', productoId: 3, cantidad: 20, tipo: 'Venta',      estado: 'Surtido',    proveedorId: 4, notas: '' },
  { folio: 'PC-004', fecha: '03/04/2025', productoId: 5, cantidad: 40, tipo: 'Reposición', estado: 'Cancelado',  proveedorId: 1, notas: '' },
];
const CATEGORIAS = ['Cerámica', 'Textil', 'Decoración', 'Joyería', 'Madera', 'Vidrio'];
const MOTIVOS    = ['Compra', 'Venta', 'Ajuste', 'Pedido', 'Devolución', 'Merma'];

const X    = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>;
const Pen  = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>;
const Bin  = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>;
const Eye  = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>;
const Chk  = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>;

function EstrategiaBadge({ e }: { e: 'PUSH' | 'PULL' }) {
  return e === 'PUSH'
    ? <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-700">PUSH</span>
    : <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-700">PULL</span>;
}
function EstadoPedidoBadge({ estado }: { estado: ScmPedido['estado'] }) {
  const cls: Record<string, string> = {
    'Pendiente':  'bg-amber-100 text-amber-700',
    'En proceso': 'bg-sky-100 text-sky-700',
    'Surtido':    'bg-emerald-100 text-emerald-700',
    'Cancelado':  'bg-red-100 text-red-500',
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls[estado]}`}>{estado}</span>;
}
function StockBadge({ stock, stockMin }: { stock: number; stockMin: number }) {
  const ok = stock >= stockMin;
  return ok
    ? <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />Normal</span>
    : <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />Stock bajo</span>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-slate-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors"><X /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
const inp = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white placeholder:text-slate-300";

function TH({ children }: { children: React.ReactNode }) {
  return <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 whitespace-nowrap">{children}</th>;
}

export default function ScmModule({ screen, setScreen }: { screen: string; setScreen: (s: string) => void }) {
  const [productos,   setProductos]   = useState<ScmProducto[]>(INIT_PRODUCTOS);
  const [proveedores, setProveedores] = useState<ScmProveedor[]>(INIT_PROVEEDORES);
  const [movimientos, setMovimientos] = useState<ScmMovimiento[]>(INIT_MOVIMIENTOS);
  const [pedidos,     setPedidos]     = useState<ScmPedido[]>(INIT_PEDIDOS);

  const [modal, setModal] = useState<'prod' | 'prov' | 'mov' | 'ped' | null>(null);
  const [editId, setEditId] = useState<number | string | null>(null);

  const emptyProd = { nombre: '', categoria: CATEGORIAS[0], stock: 0, stockMin: 0, estrategia: 'PUSH' as 'PUSH' | 'PULL', costo: 0, proveedorId: 1, emoji: '📦' };
  const [pf, setPf] = useState<typeof emptyProd>(emptyProd);

  const emptyProv = { nombre: '', contacto: '', correo: '', telefono: '', direccion: '' };
  const [pvf, setPvf] = useState(emptyProv);

  const emptyMov = { productoId: productos[0]?.id ?? 1, tipo: 'Entrada' as 'Entrada' | 'Salida', cantidad: 0, motivo: MOTIVOS[0], fecha: '', usuario: '' };
  const [mf, setMf] = useState<typeof emptyMov>(emptyMov);

  const emptyPed = { productoId: productos[0]?.id ?? 1, cantidad: 0, tipo: 'Reposición' as 'Reposición' | 'Venta', estado: 'Pendiente' as ScmPedido['estado'], proveedorId: 1, notas: '' };
  const [pedf, setPedf] = useState<typeof emptyPed>(emptyPed);

  const [prodSearch,    setProdSearch]    = useState('');
  const [prodCat,       setProdCat]       = useState('');
  const [movTipo,       setMovTipo]       = useState('');
  const [movProd,       setMovProd]       = useState('');
  const [pedEstado,     setPedEstado]     = useState('');
  const [pedTipo,       setPedTipo]       = useState('');
  const [invSearch,     setInvSearch]     = useState('');
  const [provSearch,    setProvSearch]    = useState('');

  const [logProdId, setLogProdId] = useState(1);
  const [logEst,    setLogEst]    = useState<'PUSH' | 'PULL'>('PUSH');

  const prodNombre  = (id: number) => productos.find(p => p.id === id)?.nombre ?? '-';
  const provNombre  = (id: number) => proveedores.find(p => p.id === id)?.nombre ?? '-';

  function openProd(p?: ScmProducto) {
    setPf(p ? { nombre: p.nombre, categoria: p.categoria, stock: p.stock, stockMin: p.stockMin, estrategia: p.estrategia, costo: p.costo, proveedorId: p.proveedorId, emoji: p.emoji } : emptyProd);
    setEditId(p?.id ?? null);
    setModal('prod');
  }
  function saveProd() {
    if (!pf.nombre.trim()) return;
    if (editId !== null) {
      setProductos(prev => prev.map(p => p.id === editId ? { ...p, ...pf } : p));
    } else {
      setProductos(prev => [...prev, { id: Date.now(), ...pf }]);
    }
    setModal(null);
  }

  function openProv(p?: ScmProveedor) {
    setPvf(p ? { nombre: p.nombre, contacto: p.contacto, correo: p.correo, telefono: p.telefono, direccion: p.direccion } : emptyProv);
    setEditId(p?.id ?? null);
    setModal('prov');
  }
  function saveProv() {
    if (!pvf.nombre.trim()) return;
    if (editId !== null) {
      setProveedores(prev => prev.map(p => p.id === editId ? { ...p, ...pvf } : p));
    } else {
      setProveedores(prev => [...prev, { id: Date.now(), ...pvf }]);
    }
    setModal(null);
  }

  function openMov() {
    setMf({ ...emptyMov, productoId: productos[0]?.id ?? 1 });
    setModal('mov');
  }
  function saveMov() {
    if (!mf.fecha || mf.cantidad <= 0) return;
    setMovimientos(prev => [{ id: Date.now(), ...mf }, ...prev]);
    setModal(null);
  }

  function openPed() {
    setPedf({ ...emptyPed, productoId: productos[0]?.id ?? 1 });
    setModal('ped');
  }
  function savePed() {
    if (!pedf.productoId || pedf.cantidad <= 0) return;
    const folio = `PC-${String(pedidos.length + 1).padStart(3, '0')}`;
    const today = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    setPedidos(prev => [{ folio, fecha: today, ...pedf }, ...prev]);
    setModal(null);
  }

  const checklist = [
    { label: 'Productos y proveedores integrados',   done: productos.length > 0 && proveedores.length > 0 },
    { label: 'Inventario funcionando',               done: movimientos.length > 0 },
    { label: 'Trazabilidad de movimientos',          done: movimientos.length >= 3 },
    { label: 'Estrategia Push/Pull implementada',    done: productos.some(p => p.estrategia === 'PUSH') && productos.some(p => p.estrategia === 'PULL') },
    { label: 'Reportes y métricas',                  done: pedidos.length > 0 },
  ];
  const doneCount = checklist.filter(c => c.done).length;
  const nivelIdx  = doneCount <= 1 ? 0 : doneCount <= 3 ? 1 : 2;
  const niveles   = ['Inicial', 'En desarrollo', 'Optimizado'];
  const nivelDesc = [
    'Procesos básicos. El sistema está en etapa inicial.',
    'Integración de procesos. El sistema cuenta con los módulos principales funcionando. Se están implementando estrategias logísticas y reportes.',
    'Procesos avanzados. El sistema está completamente integrado y optimizado.',
  ];

  const subNav = [
    { label: 'Inicio',      s: 'scm-home' },
    { label: 'Productos',   s: 'scm-productos' },
    { label: 'Proveedores', s: 'scm-proveedores' },
    { label: 'Inventario',  s: 'scm-inventario' },
    { label: 'Movimientos', s: 'scm-movimientos' },
    { label: 'Logística',   s: 'scm-logistica' },
    { label: 'Pedidos',     s: 'scm-pedidos' },
    { label: 'Madurez',     s: 'scm-madurez' },
    { label: 'Reportes',    s: 'scm-reportes' },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="bg-emerald-950 flex items-center gap-0 px-2 shrink-0 overflow-x-auto">
        {subNav.map(t => (
          <button key={t.s} onClick={() => setScreen(t.s)}
            className={`px-3.5 py-2.5 text-[12px] whitespace-nowrap transition-colors border-b-2 ${
              screen === t.s ? 'text-white font-semibold border-emerald-400' : 'text-emerald-400 hover:text-white border-transparent'
            }`}>{t.label}</button>
        ))}
      </div>

      <div className="flex-1 overflow-auto bg-slate-50">

        {screen === 'scm-home' && (
          <div className="p-6 max-w-4xl">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-slate-800">SCM</h1>
              <p className="text-sm text-slate-400">Cadena de Suministros</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Productos',   sub: 'Gestión de catálogo',       s: 'scm-productos',   emoji: '📦', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700' },
                { label: 'Proveedores', sub: 'Administrar proveedores',    s: 'scm-proveedores', emoji: '🤝', bg: 'bg-sky-50',     border: 'border-sky-100',     text: 'text-sky-700' },
                { label: 'Inventario',  sub: 'Control de existencias',     s: 'scm-inventario',  emoji: '🏬', bg: 'bg-violet-50',  border: 'border-violet-100',  text: 'text-violet-700' },
                { label: 'Pedidos',     sub: 'Reposición y suministro',    s: 'scm-pedidos',     emoji: '📋', bg: 'bg-amber-50',   border: 'border-amber-100',   text: 'text-amber-700' },
                { label: 'Logística',   sub: 'Push / Pull',                s: 'scm-logistica',   emoji: '🚚', bg: 'bg-rose-50',    border: 'border-rose-100',    text: 'text-rose-700' },
                { label: 'Reportes',    sub: 'Métricas y análisis',        s: 'scm-reportes',    emoji: '📊', bg: 'bg-teal-50',    border: 'border-teal-100',    text: 'text-teal-700' },
              ].map(c => (
                <button key={c.s} onClick={() => setScreen(c.s)}
                  className={`${c.bg} border ${c.border} rounded-2xl p-6 text-left hover:shadow-md transition-all group`}>
                  <div className="text-4xl mb-3">{c.emoji}</div>
                  <p className={`text-base font-semibold ${c.text}`}>{c.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === 'scm-productos' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-slate-800">Productos</h1>
              <button onClick={() => openProd()} className="bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">+ Nuevo producto</button>
            </div>
            <div className="flex gap-3 mb-4">
              <input value={prodSearch} onChange={e => setProdSearch(e.target.value)} placeholder="Buscar producto..."
                className={`${inp} flex-1`} />
              <select value={prodCat} onChange={e => setProdCat(e.target.value)} className={inp + ' w-44'}>
                <option value="">Categoría — Todas</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 bg-slate-50">
                  <TH>Imagen</TH><TH>Nombre</TH><TH>Categoría</TH><TH>Stock</TH><TH>Stock mín.</TH><TH>Estrategia</TH><TH>Acciones</TH>
                </tr></thead>
                <tbody>
                  {productos.filter(p =>
                    (!prodSearch || p.nombre.toLowerCase().includes(prodSearch.toLowerCase())) &&
                    (!prodCat || p.categoria === prodCat)
                  ).map(p => (
                    <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-2xl">{p.emoji}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{p.nombre}</td>
                      <td className="px-4 py-3 text-slate-500">{p.categoria}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{p.stock}</td>
                      <td className="px-4 py-3 text-slate-500">{p.stockMin}</td>
                      <td className="px-4 py-3"><EstrategiaBadge e={p.estrategia} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openProd(p)} className="text-amber-400 hover:text-amber-600 transition-colors"><Pen /></button>
                          <button onClick={() => setProductos(prev => prev.filter(x => x.id !== p.id))} className="text-slate-300 hover:text-red-400 transition-colors"><Bin /></button>
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
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-slate-800">Proveedores</h1>
              <button onClick={() => openProv()} className="bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">+ Nuevo proveedor</button>
            </div>
            <input value={provSearch} onChange={e => setProvSearch(e.target.value)} placeholder="Buscar proveedor..."
              className={`${inp} w-72 mb-4`} />
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 bg-slate-50">
                  <TH>Nombre</TH><TH>Contacto</TH><TH>Correo</TH><TH>Teléfono</TH><TH>Acciones</TH>
                </tr></thead>
                <tbody>
                  {proveedores.filter(p => !provSearch || p.nombre.toLowerCase().includes(provSearch.toLowerCase())).map(p => (
                    <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{p.nombre}</td>
                      <td className="px-4 py-3 text-slate-500">{p.contacto}</td>
                      <td className="px-4 py-3 text-slate-500">{p.correo}</td>
                      <td className="px-4 py-3 text-slate-500">{p.telefono}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openProv(p)} className="text-amber-400 hover:text-amber-600 transition-colors"><Pen /></button>
                          <button onClick={() => setProveedores(prev => prev.filter(x => x.id !== p.id))} className="text-slate-300 hover:text-red-400 transition-colors"><Bin /></button>
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
            <h1 className="text-xl font-semibold text-slate-800 mb-4">Inventario</h1>
            <input value={invSearch} onChange={e => setInvSearch(e.target.value)} placeholder="Buscar producto..."
              className={`${inp} w-72 mb-4`} />
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 bg-slate-50">
                  <TH>Producto</TH><TH>Stock actual</TH><TH>Stock mínimo</TH><TH>Estado</TH><TH>Acciones</TH>
                </tr></thead>
                <tbody>
                  {productos.filter(p => !invSearch || p.nombre.toLowerCase().includes(invSearch.toLowerCase())).map(p => (
                    <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{p.emoji} {p.nombre}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{p.stock}</td>
                      <td className="px-4 py-3 text-slate-500">{p.stockMin}</td>
                      <td className="px-4 py-3"><StockBadge stock={p.stock} stockMin={p.stockMin} /></td>
                      <td className="px-4 py-3">
                        <button onClick={() => setScreen('scm-movimientos')} className="text-slate-400 hover:text-emerald-600 transition-colors"><Eye /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {screen === 'scm-movimientos' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-slate-800">Movimientos de inventario</h1>
              <button onClick={openMov} className="bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">+ Nuevo movimiento</button>
            </div>
            <div className="flex gap-3 mb-4">
              <select value={movTipo} onChange={e => setMovTipo(e.target.value)} className={inp + ' w-40'}>
                <option value="">Tipo — Todos</option>
                <option value="Entrada">Entrada</option>
                <option value="Salida">Salida</option>
              </select>
              <select value={movProd} onChange={e => setMovProd(e.target.value)} className={inp + ' w-48'}>
                <option value="">Producto — Todos</option>
                {productos.map(p => <option key={p.id} value={String(p.id)}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 bg-slate-50">
                  <TH>Fecha</TH><TH>Producto</TH><TH>Tipo</TH><TH>Cantidad</TH><TH>Motivo</TH><TH>Usuario</TH>
                </tr></thead>
                <tbody>
                  {movimientos.filter(m =>
                    (!movTipo || m.tipo === movTipo) &&
                    (!movProd || m.productoId === Number(movProd))
                  ).map(m => (
                    <tr key={m.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{m.fecha}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{prodNombre(m.productoId)}</td>
                      <td className="px-4 py-3">
                        {m.tipo === 'Entrada'
                          ? <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">Entrada</span>
                          : <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-500">Salida</span>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{m.tipo === 'Salida' ? `-${m.cantidad}` : `+${m.cantidad}`}</td>
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
            <h1 className="text-xl font-semibold text-slate-800 mb-6">Logística – Estrategia de reposición</h1>
            <div className="grid grid-cols-2 gap-5 mb-6">
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-700 mb-4">Configurar estrategia</h2>
                <Field label="Producto">
                  <select value={logProdId} onChange={e => {
                    const id = Number(e.target.value);
                    setLogProdId(id);
                    setLogEst(productos.find(p => p.id === id)?.estrategia ?? 'PUSH');
                  }} className={inp}>
                    {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </Field>
                <div className="mt-4 mb-5">
                  <label className="block text-xs font-medium text-slate-600 mb-2">Estrategia</label>
                  <div className="space-y-2">
                    {(['PUSH', 'PULL'] as const).map(e => (
                      <label key={e} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${logEst === e ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <input type="radio" checked={logEst === e} onChange={() => setLogEst(e)} className="accent-emerald-600" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{e} {e === 'PUSH' ? '(producción/compra anticipada)' : '(demanda real)'}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {e === 'PUSH' ? 'Se genera pedido automáticamente cuando el stock llega al mínimo.' : 'Se genera pedido solo bajo pedido o demanda.'}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <button onClick={() => setProductos(prev => prev.map(p => p.id === logProdId ? { ...p, estrategia: logEst } : p))}
                  className="w-full bg-emerald-600 text-white text-sm py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                  Guardar
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {(['PUSH', 'PULL'] as const).map(est => {
                  const count = productos.filter(p => p.estrategia === est).length;
                  return (
                    <div key={est} className={`bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4 ${est === 'PUSH' ? 'border-amber-100' : 'border-sky-100'}`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${est === 'PUSH' ? 'bg-amber-100' : 'bg-sky-100'}`}>
                        {est === 'PUSH' ? '📦' : '🔄'}
                      </div>
                      <div>
                        <p className={`text-lg font-bold ${est === 'PUSH' ? 'text-amber-700' : 'text-sky-700'}`}>{est}</p>
                        <p className="text-sm text-slate-500">{count} producto{count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="px-5 py-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-700">Productos por estrategia</h2>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 bg-slate-50">
                  <TH>Producto</TH><TH>Categoría</TH><TH>Stock</TH><TH>Stock mín.</TH><TH>Estrategia</TH>
                </tr></thead>
                <tbody>
                  {productos.map(p => (
                    <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{p.emoji} {p.nombre}</td>
                      <td className="px-4 py-3 text-slate-500">{p.categoria}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{p.stock}</td>
                      <td className="px-4 py-3 text-slate-500">{p.stockMin}</td>
                      <td className="px-4 py-3"><EstrategiaBadge e={p.estrategia} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {screen === 'scm-pedidos' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-slate-800">Pedidos</h1>
              <button onClick={openPed} className="bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">+ Generar pedido</button>
            </div>
            <div className="flex gap-3 mb-4">
              <select value={pedEstado} onChange={e => setPedEstado(e.target.value)} className={inp + ' w-44'}>
                <option value="">Estado — Todos</option>
                {['Pendiente', 'En proceso', 'Surtido', 'Cancelado'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={pedTipo} onChange={e => setPedTipo(e.target.value)} className={inp + ' w-40'}>
                <option value="">Tipo — Todos</option>
                <option value="Reposición">Reposición</option>
                <option value="Venta">Venta</option>
              </select>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 bg-slate-50">
                  <TH>Folio</TH><TH>Fecha</TH><TH>Producto</TH><TH>Cantidad</TH><TH>Tipo</TH><TH>Estado</TH><TH>Acciones</TH>
                </tr></thead>
                <tbody>
                  {pedidos.filter(p =>
                    (!pedEstado || p.estado === pedEstado) &&
                    (!pedTipo   || p.tipo   === pedTipo)
                  ).map(p => (
                    <tr key={p.folio} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{p.folio}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{p.fecha}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{prodNombre(p.productoId)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{p.cantidad}</td>
                      <td className="px-4 py-3 text-slate-500">{p.tipo}</td>
                      <td className="px-4 py-3"><EstadoPedidoBadge estado={p.estado} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setPedidos(prev => prev.map(x => x.folio === p.folio ? { ...x, estado: 'En proceso' } : x))}
                            className="text-amber-400 hover:text-amber-600 transition-colors" title="Procesar"><Pen /></button>
                          <button onClick={() => setPedidos(prev => prev.filter(x => x.folio !== p.folio))}
                            className="text-slate-300 hover:text-red-400 transition-colors"><Bin /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {screen === 'scm-madurez' && (
          <div className="p-6 max-w-2xl">
            <h1 className="text-xl font-semibold text-slate-800 mb-6">Nivel de madurez SCM</h1>
            <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-500">Nivel actual</p>
                <span className="text-sm font-semibold text-emerald-700">{niveles[nivelIdx]}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-5">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${((nivelIdx + 1) / 3) * 100}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {niveles.map((n, i) => (
                  <div key={n} className={`p-3 rounded-lg text-center text-xs font-medium border transition-colors ${i === nivelIdx ? 'bg-emerald-600 text-white border-emerald-600' : i < nivelIdx ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                    <p className="font-semibold">{n}</p>
                    <p className="opacity-70 mt-0.5">{i === 0 ? 'Procesos básicos.' : i === 1 ? 'Integración de procesos.' : 'Procesos avanzados.'}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-sm font-semibold text-slate-700 mb-3">Checklist de avance</h3>
              <div className="space-y-2 mb-5">
                {checklist.map((c, i) => (
                  <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg ${c.done ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${c.done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-300'}`}>
                      {c.done ? <Chk /> : null}
                    </div>
                    <span className={`text-sm ${c.done ? 'text-emerald-800' : 'text-slate-400'}`}>{c.label}</span>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-600 mb-1">Descripción del nivel</p>
                <p className="text-sm text-slate-500 leading-relaxed">{nivelDesc[nivelIdx]}</p>
              </div>
            </div>
          </div>
        )}

        {screen === 'scm-reportes' && (() => {
          const enProceso   = pedidos.filter(p => p.estado === 'En proceso').length;
          const stockBajos  = productos.filter(p => p.stock < p.stockMin);
          const pushCount   = productos.filter(p => p.estrategia === 'PUSH').length;
          const pullCount   = productos.filter(p => p.estrategia === 'PULL').length;

          const ventasProd: Record<number, number> = {};
          movimientos.filter(m => m.tipo === 'Salida').forEach(m => {
            ventasProd[m.productoId] = (ventasProd[m.productoId] ?? 0) + m.cantidad;
          });
          const topVentas = [...productos].map(p => ({ ...p, ventas: ventasProd[p.id] ?? 0 }))
            .sort((a, b) => b.ventas - a.ventas).slice(0, 4);
          const maxVentas = Math.max(...topVentas.map(p => p.ventas), 1);

          const totalVentas = Object.values(ventasProd).reduce((s, v) => s + v, 0);
          const totalStock  = productos.reduce((s, p) => s + p.stock, 0);
          const rotPct      = totalStock > 0 ? Math.round((totalVentas / totalStock) * 100) : 0;

          const meses   = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
          const pushBar = [20, 30, 25, 40, 35, pushCount * 10];
          const pullBar = [15, 20, 30, 25, 40, pullCount * 10];
          const maxBar  = Math.max(...pushBar, ...pullBar, 1);

          return (
            <div className="p-6 max-w-5xl">
              <h1 className="text-xl font-semibold text-slate-800 mb-5">Reportes y métricas SCM</h1>

              <div className="grid grid-cols-4 gap-4 mb-5">
                {[
                  { label: 'Productos',         value: productos.length,   emoji: '📦', color: 'text-emerald-600' },
                  { label: 'Proveedores',        value: proveedores.length, emoji: '🤝', color: 'text-sky-600' },
                  { label: 'Pedidos en proceso', value: enProceso,          emoji: '📋', color: 'text-violet-600' },
                  { label: 'Productos stock bajo',value: stockBajos.length, emoji: '⚠️', color: 'text-amber-500' },
                ].map(k => (
                  <div key={k.label} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
                    <span className="text-2xl">{k.emoji}</span>
                    <div>
                      <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                      <p className="text-xs text-slate-400 leading-tight">{k.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-slate-700 mb-4">Productos más vendidos</h2>
                  {topVentas.length === 0
                    ? <p className="text-sm text-slate-400">Sin movimientos de salida aún.</p>
                    : <div className="space-y-3">
                        {topVentas.map(p => (
                          <div key={p.id}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-600">{p.nombre}</span>
                              <span className="font-semibold text-slate-800">{p.ventas}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(p.ventas / maxVentas) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                  }
                </div>

                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-slate-700 mb-4">Rotación de inventario</h2>
                  <div className="flex items-center gap-5">
                    <div className="relative w-24 h-24 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="4"
                          strokeDasharray={`${(rotPct / 100) * 87.96} 87.96`} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-slate-800">{rotPct}%</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      {[['Alta rotación', '#10b981'], ['Rotación media', '#f59e0b'], ['Rotación baja', '#ef4444']].map(([l, c]) => (
                        <div key={l} className="flex items-center gap-2 text-slate-500">
                          <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: c as string }} />{l}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-slate-700 mb-3">Inventario crítico</h2>
                  {stockBajos.length === 0
                    ? <p className="text-sm text-slate-400">No hay productos en stock bajo.</p>
                    : (
                      <table className="w-full text-sm">
                        <thead><tr className="text-left text-xs text-slate-400">
                          <th className="pb-2">Producto</th><th className="pb-2">Stock</th><th className="pb-2">Mínimo</th>
                        </tr></thead>
                        <tbody>
                          {stockBajos.map(p => (
                            <tr key={p.id} className="border-t border-slate-50">
                              <td className="py-2 text-slate-700 font-medium">{p.nombre}</td>
                              <td className="py-2 text-red-500 font-bold">{p.stock}</td>
                              <td className="py-2 text-slate-400">{p.stockMin}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  }
                </div>

                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-slate-700 mb-3">Comparativa PUSH vs PULL</h2>
                  <svg width="100%" viewBox="0 0 260 110" preserveAspectRatio="xMidYMid meet">
                    {meses.map((mes, i) => {
                      const x   = 10 + i * 40;
                      const bh1 = (pushBar[i] / maxBar) * 70;
                      const bh2 = (pullBar[i] / maxBar) * 70;
                      return (
                        <g key={mes}>
                          <rect x={x}      y={80 - bh1} width={14} height={bh1} fill="#f59e0b" rx={2} />
                          <rect x={x + 16} y={80 - bh2} width={14} height={bh2} fill="#0284c7"  rx={2} />
                          <text x={x + 14} y={95} textAnchor="middle" fontSize={8} fill="#94a3b8">{mes}</text>
                        </g>
                      );
                    })}
                  </svg>
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-3 h-3 rounded-sm bg-amber-400" />PUSH</div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-3 h-3 rounded-sm bg-sky-500" />PULL</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      </div>


      {modal === 'prod' && (
        <Modal title={editId ? 'Editar producto' : 'Nuevo producto'} onClose={() => setModal(null)}>
          <div className="p-5 space-y-3">
            <Field label="Nombre del producto">
              <input value={pf.nombre} onChange={e => setPf(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre del producto" className={inp} />
            </Field>
            <Field label="Categoría">
              <select value={pf.categoria} onChange={e => setPf(f => ({ ...f, categoria: e.target.value }))} className={inp}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Proveedor">
              <select value={pf.proveedorId} onChange={e => setPf(f => ({ ...f, proveedorId: Number(e.target.value) }))} className={inp}>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stock actual">
                <input type="number" min={0} value={pf.stock} onChange={e => setPf(f => ({ ...f, stock: Number(e.target.value) }))} className={inp} />
              </Field>
              <Field label="Stock mínimo">
                <input type="number" min={0} value={pf.stockMin} onChange={e => setPf(f => ({ ...f, stockMin: Number(e.target.value) }))} className={inp} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Estrategia logística">
                <select value={pf.estrategia} onChange={e => setPf(f => ({ ...f, estrategia: e.target.value as 'PUSH' | 'PULL' }))} className={inp}>
                  <option value="PUSH">PUSH</option>
                  <option value="PULL">PULL</option>
                </select>
              </Field>
              <Field label="Costo unitario">
                <input type="number" min={0} step={0.01} value={pf.costo} onChange={e => setPf(f => ({ ...f, costo: Number(e.target.value) }))} className={inp} />
              </Field>
            </div>
          </div>
          <div className="flex gap-2 px-5 pb-5">
            <button onClick={() => setModal(null)} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">Cancelar</button>
            <button onClick={saveProd} className="flex-1 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Guardar</button>
          </div>
        </Modal>
      )}

      {modal === 'prov' && (
        <Modal title={editId ? 'Editar proveedor' : 'Nuevo proveedor'} onClose={() => setModal(null)}>
          <div className="p-5 space-y-3">
            {(['nombre', 'contacto', 'correo', 'telefono', 'direccion'] as const).map(field => (
              <Field key={field} label={field.charAt(0).toUpperCase() + field.slice(1)}>
                <input value={pvf[field]} onChange={e => setPvf(f => ({ ...f, [field]: e.target.value }))}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)} className={inp} />
              </Field>
            ))}
          </div>
          <div className="flex gap-2 px-5 pb-5">
            <button onClick={() => setModal(null)} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">Cancelar</button>
            <button onClick={saveProv} className="flex-1 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Guardar</button>
          </div>
        </Modal>
      )}

      {modal === 'mov' && (
        <Modal title="Nuevo movimiento" onClose={() => setModal(null)}>
          <div className="p-5 space-y-3">
            <Field label="Producto">
              <select value={mf.productoId} onChange={e => setMf(f => ({ ...f, productoId: Number(e.target.value) }))} className={inp}>
                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </Field>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Tipo</label>
              <div className="flex gap-3">
                {(['Entrada', 'Salida'] as const).map(t => (
                  <label key={t} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${mf.tipo === t ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'}`}>
                    <input type="radio" checked={mf.tipo === t} onChange={() => setMf(f => ({ ...f, tipo: t }))} className="accent-emerald-600" />
                    <span className="text-sm text-slate-700">{t}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cantidad">
                <input type="number" min={1} value={mf.cantidad} onChange={e => setMf(f => ({ ...f, cantidad: Number(e.target.value) }))} className={inp} />
              </Field>
              <Field label="Motivo">
                <select value={mf.motivo} onChange={e => setMf(f => ({ ...f, motivo: e.target.value }))} className={inp}>
                  {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha">
                <input type="date" onChange={e => setMf(f => ({ ...f, fecha: new Date(e.target.value).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) }))} className={inp} />
              </Field>
              <Field label="Usuario">
                <input value={mf.usuario} onChange={e => setMf(f => ({ ...f, usuario: e.target.value }))} placeholder="Usuario" className={inp} />
              </Field>
            </div>
          </div>
          <div className="flex gap-2 px-5 pb-5">
            <button onClick={() => setModal(null)} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">Cancelar</button>
            <button onClick={saveMov} className="flex-1 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Guardar</button>
          </div>
        </Modal>
      )}

      {modal === 'ped' && (
        <Modal title="Nuevo pedido" onClose={() => setModal(null)}>
          <div className="p-5 space-y-3">
            <Field label="Producto">
              <select value={pedf.productoId} onChange={e => setPedf(f => ({ ...f, productoId: Number(e.target.value) }))} className={inp}>
                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cantidad">
                <input type="number" min={1} value={pedf.cantidad} onChange={e => setPedf(f => ({ ...f, cantidad: Number(e.target.value) }))} className={inp} />
              </Field>
              <Field label="Tipo">
                <select value={pedf.tipo} onChange={e => setPedf(f => ({ ...f, tipo: e.target.value as 'Reposición' | 'Venta' }))} className={inp}>
                  <option value="Reposición">Reposición</option>
                  <option value="Venta">Venta</option>
                </select>
              </Field>
            </div>
            <Field label="Proveedor">
              <select value={pedf.proveedorId} onChange={e => setPedf(f => ({ ...f, proveedorId: Number(e.target.value) }))} className={inp}>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </Field>
            <Field label="Notas">
              <textarea value={pedf.notas} onChange={e => setPedf(f => ({ ...f, notas: e.target.value }))}
                placeholder="Notas..." rows={2} className={`${inp} resize-none`} />
            </Field>
          </div>
          <div className="flex gap-2 px-5 pb-5">
            <button onClick={() => setModal(null)} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">Cancelar</button>
            <button onClick={savePed} className="flex-1 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Guardar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
