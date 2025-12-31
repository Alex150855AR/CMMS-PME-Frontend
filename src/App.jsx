import React, { useState, useEffect } from 'react';
import { 
  Wrench, LayoutDashboard, CalendarClock, ClipboardList, Box, 
  Package, CheckSquare, Users, Menu, X, Plus, 
  Search, Activity, Clock, Hammer, DollarSign,
  Wifi, WifiOff, ChevronDown, Eye, ArrowUp, Edit, Printer
} from 'lucide-react';

// --- DATOS ESTÁTICOS (Respaldo visual para módulos sin Backend) ---
const INITIAL_STATIC_DATA = {
  staff: [
      { id: 'S-01', name: 'Juan Pérez', role: 'Técnico Senior' },
      { id: 'S-02', name: 'Maria Garcia', role: 'Técnico Mecánico' },
      { id: 'S-03', name: 'Carlos Lopez', role: 'Supervisor' },
      { id: 'S-04', name: 'Ana Diaz', role: 'Electricista' }
  ],
  checklists: [] 
};

export default function App() {
  // --- ESTADOS DE UI ---
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'asset', 'item', 'plan'
  
  // --- ESTADOS DE DATOS (CONECTADOS A MYSQL) ---
  const [dbAssets, setDbAssets] = useState([]);      
  const [dbWorkOrders, setDbWorkOrders] = useState([]); 
  const [dbInventory, setDbInventory] = useState([]);
  const [dbPlans, setDbPlans] = useState([]); // <--- NUEVO: PLANES
  
  const [staticData] = useState(INITIAL_STATIC_DATA);
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState('checking');

  // --- FORMULARIOS ---
  const [newAsset, setNewAsset] = useState({
    serial_number: '', fixture_name: '', production_line: 'Línea 1', model_id: 1
  });
  
  const [newItem, setNewItem] = useState({
    part_code: '', name: '', stock_quantity: 0, min_stock_level: 5, location_in_warehouse: 'General'
  });

  const [newPlan, setNewPlan] = useState({
    asset_id: '', activity: '', frequency_type: 'Semanal', next_due_date: ''
  });

  // --- API URL ---
  const BASE_URL = 'http://localhost:3000/api';

  // --- CARGA INICIAL ---
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchAssets(), fetchWorkOrders(), fetchInventory(), fetchPlans()]);
      setLoading(false);
    };
    initData();
  }, []);

  // --- FETCHERS ---
  const fetchAssets = async () => {
    try {
      const res = await fetch(`${BASE_URL}/assets`);
      if (res.ok) {
        setDbAssets(await res.json());
        setServerStatus('online');
      }
    } catch (e) { console.error("Error assets", e); setServerStatus('offline'); }
  };

  const fetchWorkOrders = async () => {
    try {
      const res = await fetch(`${BASE_URL}/work-orders`);
      if (res.ok) setDbWorkOrders(await res.json());
    } catch (e) { console.error("Error OT", e); }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${BASE_URL}/inventory`);
      if (res.ok) setDbInventory(await res.json());
    } catch (e) { console.error("Error Inv", e); }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${BASE_URL}/plans`);
      if (res.ok) setDbPlans(await res.json());
    } catch (e) { console.error("Error Plans", e); }
  };

  // --- HANDLERS (CREAR) ---
  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newAsset, model_id: 1, station: 'Móvil', condition_status: 'Activo' };
      const res = await fetch(`${BASE_URL}/assets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (res.ok) {
        setActiveModal(null);
        setNewAsset({ serial_number: '', fixture_name: '', production_line: 'Línea 1', model_id: 1 });
        fetchAssets();
        alert('✅ Activo creado');
      } else alert('Error al crear activo');
    } catch (e) { alert('Error de conexión'); }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/inventory`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newItem)
      });
      if (res.ok) {
        setActiveModal(null);
        setNewItem({ part_code: '', name: '', stock_quantity: 0, min_stock_level: 5, location_in_warehouse: 'General' });
        fetchInventory();
        alert('✅ Ítem creado');
      } else alert('Error al crear ítem');
    } catch (e) { alert('Error de conexión'); }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/plans`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPlan)
      });
      if (res.ok) {
        setActiveModal(null);
        setNewPlan({ asset_id: '', activity: '', frequency_type: 'Semanal', next_due_date: '' });
        fetchPlans();
        alert('✅ Plan programado');
      } else alert('Error al crear plan');
    } catch (e) { alert('Error de conexión'); }
  };

  // --- KPIS ---
  const kpis = {
    total: dbWorkOrders.length,
    done: dbWorkOrders.filter(w => ['Completado', 'Ejecutado'].includes(w.status)).length,
    pending: dbWorkOrders.filter(w => w.status === 'Pendiente').length
  };
  const completionRate = kpis.total > 0 ? ((kpis.done / kpis.total) * 100).toFixed(1) : 0;

  // --- VISTAS ---

  const DashboardView = () => (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Dashboard General</h2>
        <div className="flex items-center gap-2">
           <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center ${serverStatus === 'online' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
             {serverStatus === 'online' ? <Wifi className="w-3 h-3 mr-1"/> : <WifiOff className="w-3 h-3 mr-1"/>}
             {serverStatus === 'online' ? 'Conectado a MySQL' : 'Sin Conexión'}
           </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="Disponibilidad" value="98.5%" icon={<Activity />} color="blue" sub="Tiempo Operativo" />
        <KpiCard title="Cumplimiento" value={`${completionRate}%`} icon={<CheckSquare />} color="green" sub={`${kpis.done} Ejecutadas`} />
        <KpiCard title="Pendientes" value={kpis.pending} icon={<Clock />} color="orange" sub="Backlog Actual" />
        <KpiCard title="Total Histórico" value={kpis.total} icon={<ClipboardList />} color="purple" sub="Órdenes Creadas" />
      </div>
    </div>
  );

  const AssetsView = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800">Activos</h2>
        <button onClick={() => setActiveModal('asset')} className="bg-green-600 text-white px-4 py-2 rounded-md shadow hover:bg-green-700 flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Nuevo
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dbAssets.map(a => (
           <div key={a.asset_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="bg-blue-50 p-2 rounded-full"><Box className="w-5 h-5 text-blue-600" /></div>
                <span className="text-[10px] font-bold px-2 py-1 rounded border bg-green-50 text-green-700 border-green-200">{a.condition_status}</span>
              </div>
              <h3 className="text-sm font-bold text-gray-900">{a.fixture_name}</h3>
              <p className="text-xs text-gray-500 font-mono">SN: {a.serial_number}</p>
              <p className="text-xs text-blue-600 mt-1">{a.model_name}</p>
           </div>
        ))}
      </div>
    </div>
  );

  const WorkOrdersView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full overflow-hidden animate-in fade-in duration-300">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Órdenes de Trabajo</h2>
        <button className="text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 font-bold shadow-sm">Crear OT</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase font-bold">
            <tr><th className="px-4 py-3">ID</th><th className="px-4 py-3">Tarea</th><th className="px-4 py-3">Activo</th><th className="px-4 py-3">Prioridad</th><th className="px-4 py-3">Estado</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dbWorkOrders.map((ot) => (
              <tr key={ot.id} className="hover:bg-blue-50/50">
                <td className="px-4 py-4 font-bold text-blue-600">#{ot.id}</td>
                <td className="px-4 py-4 font-medium">{ot.title}</td>
                <td className="px-4 py-4 text-gray-500">{ot.assetName}</td>
                <td className="px-4 py-4"><span className={`px-2 py-1 rounded font-bold ${ot.priority === 'Alta' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{ot.priority}</span></td>
                <td className="px-4 py-4"><span className={`px-2 py-1 rounded font-bold ${ot.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{ot.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const InventoryView = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 fade-in animate-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">Inventario</h2>
        <button onClick={() => setActiveModal('item')} className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-blue-700 flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Ítem
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dbInventory.map(i => (
          <div key={i.item_id || i.id} className="border border-gray-200 p-4 rounded-lg hover:shadow-md bg-white">
            <div className="flex justify-between font-bold text-gray-800 mb-1">
              <span>{i.name}</span>
              <span className="text-xs bg-gray-100 p-1 rounded font-mono text-gray-500">{i.part_code}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold mt-2">
              <span className="text-red-500 text-xs">Min: {i.min_stock_level}</span>
              <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded">Stock: {i.stock_quantity}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // --- VISTA PLANIFICACIÓN (NUEVA) ---
  const PlanningView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 fade-in w-full overflow-hidden animate-in duration-300">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Programa de Mantenimiento</h2>
        <button onClick={() => setActiveModal('plan')} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 flex items-center shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Programar Tarea
        </button>
      </div>
      {dbPlans.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
           <CalendarClock className="w-12 h-12 mx-auto mb-2 opacity-20"/>
           <p>No hay planes registrados.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
              <tr><th className="px-6 py-3">Activo</th><th className="px-6 py-3">Actividad</th><th className="px-6 py-3">Frecuencia</th><th className="px-6 py-3">Próxima Fecha</th><th className="px-6 py-3">Acción</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dbPlans.map(plan => (
                <tr key={plan.plan_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-xs text-blue-600">{plan.assetName}</div>
                    <div className="text-[10px] text-gray-500 font-mono">{plan.assetId}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 font-medium">{plan.activity}</td>
                  <td className="px-6 py-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600 font-bold">{plan.frequency_type}</span></td>
                  <td className="px-6 py-4 text-gray-800 font-bold">{new Date(plan.next_due_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4"><button className="text-blue-600 text-xs hover:underline font-bold">Generar OT</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const TeamView = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 fade-in animate-in duration-300">
      <h2 className="text-lg font-bold mb-4">Personal Técnico</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {staticData.staff.map(s => (
          <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mr-3">{s.name.charAt(0)}</div>
              <div><p className="font-bold text-gray-900">{s.name}</p><p className="text-xs text-gray-500">{s.role}</p></div>
            </div>
            <span className="text-xs font-mono text-gray-400 bg-white border px-2 py-1 rounded">{s.id}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const ChecklistView = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 fade-in animate-in duration-300 text-center py-10">
        <CheckSquare className="mx-auto h-12 w-12 text-gray-300 mb-2"/>
        <p className="text-gray-500">Módulo de Checklist (Próximamente)</p>
    </div>
  );

  return (
    <div className="bg-gray-100 font-sans text-gray-800 h-screen flex overflow-hidden">
      {/* SIDEBAR */}
      <aside className={`bg-white w-64 flex-shrink-0 border-r border-gray-200 flex flex-col transition-transform duration-300 absolute z-20 h-full md:relative ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Wrench className="text-blue-600 mr-2 h-7 w-7" />
          <span className="text-xl font-bold text-gray-900">PME CMMS</span>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden ml-auto text-gray-500"><X className="w-6 h-6"/></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          <NavButton icon={<LayoutDashboard />} label="Dashboard" view="dashboard" current={currentView} set={setCurrentView} />
          <NavButton icon={<Box />} label="Activos" view="assets" current={currentView} set={setCurrentView} />
          <NavButton icon={<ClipboardList />} label="Órdenes Trabajo" view="workorders" current={currentView} set={setCurrentView} />
          <NavButton icon={<Package />} label="Inventario" view="inventory" current={currentView} set={setCurrentView} />
          <NavButton icon={<CalendarClock />} label="Planificación" view="planning" current={currentView} set={setCurrentView} />
          <NavButton icon={<CheckSquare />} label="Checklist" view="checklist" current={currentView} set={setCurrentView} />
          <NavButton icon={<Users />} label="Personal" view="team" current={currentView} set={setCurrentView} />
        </nav>
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-400">v6.0 Full Stack</div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        <header className="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-10">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 mr-2 text-gray-600"><Menu className="w-6 h-6"/></button>
            <h1 className="text-xl font-semibold text-gray-800 capitalize">{currentView === 'workorders' ? 'Órdenes de Trabajo' : currentView}</h1>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8 bg-gray-100 relative">
          {loading ? <div className="text-center py-20 text-gray-400"><Activity className="animate-spin mx-auto w-8 h-8 mb-2"/>Cargando sistema...</div> : (
            <>
              {currentView === 'dashboard' && <DashboardView />}
              {currentView === 'assets' && <AssetsView />}
              {currentView === 'workorders' && <WorkOrdersView />}
              {currentView === 'inventory' && <InventoryView />}
              {currentView === 'planning' && <PlanningView />}
              {currentView === 'team' && <TeamView />}
              {currentView === 'checklist' && <ChecklistView />}
            </>
          )}
        </main>
      </div>

      {/* MODAL PLANIFICACIÓN (NUEVO) */}
      {activeModal === 'plan' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold">Programar Mantenimiento</h3>
              <button onClick={() => setActiveModal(null)}><X className="w-5 h-5 text-gray-500"/></button>
            </div>
            <form onSubmit={handleCreatePlan} className="p-4 space-y-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Activo</label>
                  <select className="w-full border border-gray-300 rounded p-2" required value={newPlan.asset_id} onChange={e => setNewPlan({...newPlan, asset_id: e.target.value})}>
                     <option value="">Seleccione equipo...</option>
                     {dbAssets.map(a => <option key={a.asset_id} value={a.asset_id}>{a.fixture_name}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Actividad</label>
                  <input type="text" className="w-full border border-gray-300 rounded p-2" placeholder="Ej. Limpieza General" required value={newPlan.activity} onChange={e => setNewPlan({...newPlan, activity: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Frecuencia</label>
                    <select className="w-full border border-gray-300 rounded p-2" value={newPlan.frequency_type} onChange={e => setNewPlan({...newPlan, frequency_type: e.target.value})}>
                       <option>Diario</option><option>Semanal</option><option>Quincenal</option><option>Mensual</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inicio</label>
                    <input type="date" required className="w-full border border-gray-300 rounded p-2" value={newPlan.next_due_date} onChange={e => setNewPlan({...newPlan, next_due_date: e.target.value})} />
                 </div>
               </div>
               <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Guardar Plan</button>
            </form>
          </div>
        </div>
      )}

      {/* OTROS MODALES (ACTIVO, ITEM) */}
      {activeModal === 'asset' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold">Nuevo Activo</h3>
              <button onClick={() => setActiveModal(null)}><X className="w-5 h-5 text-gray-500"/></button>
            </div>
            <form onSubmit={handleCreateAsset} className="p-4 space-y-4">
               <input type="text" placeholder="Nombre" required className="w-full border p-2 rounded" value={newAsset.fixture_name} onChange={e => setNewAsset({...newAsset, fixture_name: e.target.value})} />
               <input type="text" placeholder="Serial" required className="w-full border p-2 rounded" value={newAsset.serial_number} onChange={e => setNewAsset({...newAsset, serial_number: e.target.value})} />
               <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold">Guardar</button>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'item' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold">Nuevo Ítem</h3>
              <button onClick={() => setActiveModal(null)}><X className="w-5 h-5 text-gray-500"/></button>
            </div>
            <form onSubmit={handleCreateItem} className="p-4 space-y-4">
               <input type="text" placeholder="Código (SKU)" required className="w-full border p-2 rounded" value={newItem.part_code} onChange={e => setNewItem({...newItem, part_code: e.target.value})} />
               <input type="text" placeholder="Nombre" required className="w-full border p-2 rounded" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
               <input type="number" placeholder="Stock Inicial" required className="w-full border p-2 rounded" value={newItem.stock_quantity} onChange={e => setNewItem({...newItem, stock_quantity: parseInt(e.target.value)})} />
               <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold">Guardar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- COMPONENTES UI REUTILIZABLES ---
const NavButton = ({ icon, label, view, current, set }) => (
  <button onClick={() => set(view)} className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors border-l-4 ${current === view ? 'text-blue-700 bg-blue-50 border-blue-600' : 'text-gray-600 hover:bg-gray-50 border-transparent hover:text-gray-900'}`}>
    <span className="mr-3">{icon}</span>{label}
  </button>
);

const KpiCard = ({ title, value, icon, color, sub }) => {
  const colors = { blue: 'border-blue-500 text-blue-600 bg-blue-50', green: 'border-green-500 text-green-600 bg-green-50', orange: 'border-orange-500 text-orange-600 bg-orange-50', purple: 'border-purple-500 text-purple-600 bg-purple-50' };
  return (
    <div className={`bg-white p-5 rounded-lg border-l-4 shadow-sm ${colors[color].split(' ')[0]}`}>
      <div className="flex justify-between items-start">
        <div><p className="text-xs text-gray-500 uppercase font-bold">{title}</p><h3 className="text-2xl font-bold text-gray-800">{value}</h3></div>
        <div className={`p-2 rounded ${colors[color].split(' ').slice(1).join(' ')}`}>{icon}</div>
      </div>
      <p className="text-xs text-gray-400 mt-2">{sub}</p>
    </div>
  );
};