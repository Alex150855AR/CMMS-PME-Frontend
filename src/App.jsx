import React, { useState, useEffect } from 'react';
import { 
  Wrench, LayoutDashboard, CalendarClock, ClipboardList, Box, 
  Package, CheckSquare, Users, Menu, X, Plus, 
  Search, Activity, Clock, Hammer, DollarSign,
  Wifi, WifiOff, ChevronDown, Eye, ArrowUp, Edit, Printer, CheckCircle, XCircle
} from 'lucide-react';

// --- DATOS ESTÁTICOS (Respaldo) ---
const INITIAL_STATIC_DATA = { checklists: [] };

export default function App() {
  // --- ESTADOS UI ---
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'asset', 'item', 'plan', 'user', 'withdraw'
  
  // --- ESTADOS DE DATOS (CONECTADOS A MYSQL) ---
  const [dbAssets, setDbAssets] = useState([]);      
  const [dbWorkOrders, setDbWorkOrders] = useState([]); 
  const [dbInventory, setDbInventory] = useState([]);
  const [dbPlans, setDbPlans] = useState([]); 
  const [dbStaff, setDbStaff] = useState([]); 
  
  // --- ESTADOS CHECKLIST ---
  const [selectedWO, setSelectedWO] = useState(null); 
  const [checklistTasks, setChecklistTasks] = useState([]); 

  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState('checking');

  // --- FORMULARIOS ---
  const [newAsset, setNewAsset] = useState({ serial_number: '', fixture_name: '', production_line: 'Línea 1', model_id: 1 });
  const [newItem, setNewItem] = useState({ part_code: '', name: '', stock_quantity: 0, min_stock_level: 5, location_in_warehouse: 'General' });
  const [newPlan, setNewPlan] = useState({ asset_id: '', activity: '', frequency_type: 'Semanal', next_due_date: '' });
  const [newUser, setNewUser] = useState({ employee_number: '', full_name: '', email: '', role: 'Tecnico' });
  const [newTaskDesc, setNewTaskDesc] = useState(''); 
  
  // Estado para retiro de material
  const [withdrawData, setWithdrawData] = useState({ item_id: '', quantity: 1, reason: '' });

  // --- API URL ---
  const BASE_URL = 'http://localhost:3000/api';

  // --- CARGA INICIAL ---
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchAssets(), fetchWorkOrders(), fetchInventory(), fetchPlans(), fetchUsers()]);
      setLoading(false);
    };
    initData();
  }, []);

  // --- FETCHERS ---
  const fetchAssets = async () => { try { const res = await fetch(`${BASE_URL}/assets`); if(res.ok) { setDbAssets(await res.json()); setServerStatus('online'); } } catch(e){ console.error(e); setServerStatus('offline'); } };
  const fetchWorkOrders = async () => { try { const res = await fetch(`${BASE_URL}/work-orders`); if(res.ok) setDbWorkOrders(await res.json()); } catch(e){ console.error(e); } };
  const fetchInventory = async () => { try { const res = await fetch(`${BASE_URL}/inventory`); if(res.ok) setDbInventory(await res.json()); } catch(e){ console.error(e); } };
  const fetchPlans = async () => { try { const res = await fetch(`${BASE_URL}/plans`); if(res.ok) setDbPlans(await res.json()); } catch(e){ console.error(e); } };
  const fetchUsers = async () => { try { const res = await fetch(`${BASE_URL}/users`); if(res.ok) setDbStaff(await res.json()); } catch(e){ console.error(e); } };
  
  const fetchChecklist = async (woId) => {
    if (!woId) return;
    try {
      const res = await fetch(`${BASE_URL}/checklists/${woId}`);
      if(res.ok) setChecklistTasks(await res.json());
    } catch(e) { console.error("Error checklist", e); }
  };

  // --- HANDLERS GENÉRICOS ---
  const postData = async (url, data, refreshFn, resetFn, close = true) => {
    try {
      const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
      if(res.ok) { refreshFn(); if(resetFn) resetFn(); if(close) setActiveModal(null); else alert('Guardado'); } 
      else { const err = await res.json(); alert(`Error: ${err.error}`); }
    } catch(e) { alert('Error de conexión'); }
  };

  // --- HANDLERS ESPECÍFICOS ---
  const handleCreateAsset = (e) => { e.preventDefault(); postData(`${BASE_URL}/assets`, {...newAsset, model_id:1, station:'Móvil', condition_status:'Activo'}, fetchAssets, () => setNewAsset({serial_number:'', fixture_name:'', production_line:'Línea 1', model_id:1})); };
  const handleCreateItem = (e) => { e.preventDefault(); postData(`${BASE_URL}/inventory`, newItem, fetchInventory, () => setNewItem({part_code:'', name:'', stock_quantity:0, min_stock_level:5, location_in_warehouse:'General'})); };
  const handleCreatePlan = (e) => { e.preventDefault(); postData(`${BASE_URL}/plans`, newPlan, fetchPlans, () => setNewPlan({asset_id:'', activity:'', frequency_type:'Semanal', next_due_date:''})); };
  const handleCreateUser = (e) => { e.preventDefault(); postData(`${BASE_URL}/users`, newUser, fetchUsers, () => setNewUser({employee_number:'', full_name:'', email:'', role:'Tecnico'})); };

  const handleAddTask = async () => {
    if(!selectedWO || !newTaskDesc) return;
    await postData(`${BASE_URL}/checklists`, { wo_id: selectedWO, description: newTaskDesc }, () => fetchChecklist(selectedWO), () => setNewTaskDesc(''), false);
  };

  const handleUpdateTask = async (taskId, result) => {
    try {
      await fetch(`${BASE_URL}/checklists/${taskId}`, {
        method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ result, comments: '' })
      });
      fetchChecklist(selectedWO); 
    } catch(e) { alert('Error actualizando tarea'); }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    try {
      // Usamos el endpoint de ajuste (Step 3 Inventory) con cantidad negativa
      const res = await fetch(`${BASE_URL}/inventory/${withdrawData.item_id}/adjust`, {
        method: 'PUT', 
        headers: {'Content-Type':'application/json'}, 
        body: JSON.stringify({ adjustment: -withdrawData.quantity }) // Negativo para resta
      });
      if(res.ok) {
        fetchInventory();
        setActiveModal(null);
        alert('✅ Retiro registrado');
      } else {
        alert('Error al retirar');
      }
    } catch(e) { alert('Error de conexión'); }
  };

  // Función simulada de imprimir
  const printOT = (ot) => {
    alert(`🖨️ Imprimiendo Orden de Trabajo #${ot.id}\nActivo: ${ot.assetName}\nTarea: ${ot.title}`);
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
        <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center ${serverStatus === 'online' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
             {serverStatus === 'online' ? <Wifi className="w-3 h-3 mr-1"/> : <WifiOff className="w-3 h-3 mr-1"/>} {serverStatus === 'online' ? 'Online' : 'Offline'}
        </span>
      </div>
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="Disponibilidad" value="98.5%" icon={<Activity />} color="blue" sub="Tiempo Operativo" />
        <KpiCard title="Cumplimiento" value={`${completionRate}%`} icon={<CheckSquare />} color="green" sub={`${kpis.done} Ejecutadas`} />
        <KpiCard title="Pendientes" value={kpis.pending} icon={<Clock />} color="orange" sub="Backlog" />
        <KpiCard title="Total" value={kpis.total} icon={<ClipboardList />} color="purple" sub="Órdenes" />
      </div>

      {/* CHARTS (RESTAURADOS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 col-span-1">
           <h3 className="text-sm font-bold text-gray-700 mb-4">MP vs Correctivo</h3>
           <div className="flex items-end justify-center gap-4 h-48 border-b border-gray-100 pb-2">
              <div className="w-16 bg-blue-500 rounded-t-lg relative group transition-all hover:bg-blue-600" style={{height: '70%'}}>
                 <span className="absolute -top-6 left-0 w-full text-center text-xs font-bold text-blue-600">70%</span>
                 <p className="absolute bottom-2 w-full text-center text-white text-xs">Prev</p>
              </div>
              <div className="w-16 bg-red-500 rounded-t-lg relative group transition-all hover:bg-red-600" style={{height: '30%'}}>
                 <span className="absolute -top-6 left-0 w-full text-center text-xs font-bold text-red-600">30%</span>
                 <p className="absolute bottom-2 w-full text-center text-white text-xs">Corr</p>
              </div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 col-span-1 lg:col-span-2">
           <h3 className="text-sm font-bold text-gray-700 mb-4">Tendencia Anual</h3>
           <div className="flex items-end justify-between gap-2 h-48 border-b border-gray-100 pb-2">
              {[40, 60, 45, 80, 55, 90, 65, 75, 50, 85, 95, 70].map((h, i) => (
                <div key={i} className="w-full bg-emerald-400/80 hover:bg-emerald-500 rounded-t-sm transition-all relative group" style={{height: `${h}%`}}>
                </div>
              ))}
           </div>
           <div className="flex justify-between text-[10px] text-gray-400 mt-2 uppercase font-bold">
              <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span>
              <span>Jul</span><span>Ago</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dic</span>
           </div>
        </div>
      </div>
    </div>
  );

  const AssetsView = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800">Activos</h2>
        <button onClick={() => setActiveModal('asset')} className="bg-green-600 text-white px-4 py-2 rounded-md shadow flex items-center"><Plus className="w-4 h-4 mr-2"/> Nuevo</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dbAssets.map(a => (
           <div key={a.asset_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 relative hover:shadow-md">
              <div className="flex justify-between mb-2"><div className="bg-blue-50 p-2 rounded-full"><Box className="w-5 h-5 text-blue-600"/></div><span className="text-[10px] font-bold px-2 py-1 rounded border bg-green-50 text-green-700">{a.condition_status}</span></div>
              <h3 className="text-sm font-bold text-gray-900">{a.fixture_name}</h3>
              <p className="text-xs text-gray-500 font-mono">SN: {a.serial_number}</p>
              <p className="text-xs text-blue-600 mt-1">{a.model_name || 'Genérico'}</p>
           </div>
        ))}
      </div>
    </div>
  );

  const WorkOrdersView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full overflow-hidden animate-in fade-in duration-300">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Órdenes de Trabajo</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase font-bold">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Tarea</th>
              <th className="px-4 py-3">Activo</th>
              <th className="px-4 py-3">Prioridad</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dbWorkOrders.map((ot) => (
              <tr key={ot.id} className="hover:bg-blue-50/50">
                <td className="px-4 py-4 font-bold text-blue-600">#{ot.id}</td>
                <td className="px-4 py-4 font-medium">{ot.title}</td>
                <td className="px-4 py-4 text-gray-500">{ot.assetName}</td>
                <td className="px-4 py-4"><span className={`px-2 py-1 rounded font-bold ${ot.priority==='Alta'?'bg-red-100 text-red-800':'bg-green-100 text-green-800'}`}>{ot.priority}</span></td>
                <td className="px-4 py-4"><span className="px-2 py-1 rounded font-bold bg-yellow-100 text-yellow-800">{ot.status}</span></td>
                <td className="px-4 py-4 text-center">
                  <button onClick={() => printOT(ot)} className="text-gray-500 hover:text-blue-600" title="Imprimir"><Printer className="w-4 h-4"/></button>
                </td>
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
        <button onClick={() => setActiveModal('item')} className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-blue-700 flex items-center"><Plus className="w-4 h-4 mr-2"/> Nuevo</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dbInventory.map(i => (
          <div key={i.item_id} className="border border-gray-200 p-4 rounded-lg bg-white relative">
            <div className="flex justify-between font-bold text-gray-800 mb-1"><span>{i.name}</span><span className="text-xs bg-gray-100 p-1 rounded font-mono text-gray-500">{i.part_code}</span></div>
            <div className="flex justify-between items-center text-sm font-bold mt-2 mb-4"><span className="text-red-500 text-xs">Min: {i.min_stock_level}</span><span className="bg-green-50 text-green-600 px-2 py-0.5 rounded">Stock: {i.stock_quantity}</span></div>
            <div className="border-t pt-2 mt-2">
               <button onClick={() => { setWithdrawData({...withdrawData, item_id: i.item_id}); setActiveModal('withdraw'); }} className="w-full text-center text-xs font-bold text-orange-600 border border-orange-200 bg-orange-50 py-1 rounded hover:bg-orange-100">Retirar Material</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const PlanningView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 fade-in w-full overflow-hidden animate-in duration-300">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Planificación</h2>
        <button onClick={() => setActiveModal('plan')} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 flex items-center shadow-sm"><Plus className="w-4 h-4 mr-2"/> Programar</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold"><tr><th className="px-6 py-3">Activo</th><th className="px-6 py-3">Actividad</th><th className="px-6 py-3">Frecuencia</th><th className="px-6 py-3">Fecha</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {dbPlans.map(p => (
              <tr key={p.plan_id} className="hover:bg-gray-50">
                <td className="px-6 py-4"><div className="font-bold text-xs text-blue-600">{p.assetName}</div></td>
                <td className="px-6 py-4 text-gray-700 font-medium">{p.activity}</td>
                <td className="px-6 py-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{p.frequency_type}</span></td>
                <td className="px-6 py-4 text-gray-800 font-bold">{new Date(p.next_due_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const TeamView = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 fade-in animate-in duration-300">
      <div className="flex justify-between items-center mb-6"><h2 className="text-lg font-bold">Personal</h2><button onClick={() => setActiveModal('user')} className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-blue-700 flex items-center"><Plus className="w-4 h-4 mr-2"/> Agregar</button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dbStaff.map(s => (
          <div key={s.user_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center"><div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mr-3">{s.full_name.charAt(0)}</div><div><p className="font-bold text-gray-900">{s.full_name}</p><p className="text-xs text-gray-500">{s.role}</p></div></div>
            <span className="text-xs font-mono text-gray-400 bg-white border px-2 py-1 rounded">{s.employee_number}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const ChecklistView = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 fade-in animate-in duration-300">
        <h2 className="text-xl font-bold mb-4 flex items-center"><CheckSquare className="mr-2 text-blue-600" /> Bitácora / Checklist</h2>
        <div className="mb-6">
           <label className="block text-sm font-bold text-gray-700 mb-2">Seleccionar Orden de Trabajo:</label>
           <select className="border p-2 rounded w-full md:w-1/2 bg-gray-50" onChange={(e) => { setSelectedWO(e.target.value); fetchChecklist(e.target.value); }} value={selectedWO || ''}>
              <option value="">-- Seleccionar --</option>
              {dbWorkOrders.map(ot => <option key={ot.id} value={ot.id}>#{ot.id} - {ot.title}</option>)}
           </select>
        </div>
        {selectedWO ? (
          <div className="space-y-4">
             <div className="flex gap-2">
                <input type="text" placeholder="Escribe una tarea de inspección..." className="border p-2 rounded w-full" value={newTaskDesc} onChange={e=>setNewTaskDesc(e.target.value)} />
                <button onClick={handleAddTask} className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 font-bold">Agregar</button>
             </div>
             {checklistTasks.length === 0 ? <p className="text-gray-400 text-center py-8 border-2 border-dashed rounded">No hay puntos de inspección registrados.</p> : (
               <div className="border rounded-lg overflow-hidden">
                 {checklistTasks.map(task => (
                   <div key={task.task_id} className="flex flex-col md:flex-row justify-between items-center p-3 border-b hover:bg-gray-50 bg-white gap-2">
                      <span className="font-medium text-gray-700 w-full">{task.description}</span>
                      <div className="flex gap-2 w-full md:w-auto justify-end">
                         <button onClick={()=>handleUpdateTask(task.task_id, 'OK')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${task.result==='OK'?'bg-green-600 text-white':'bg-gray-100 text-gray-600 hover:bg-green-100'}`}>OK</button>
                         <button onClick={()=>handleUpdateTask(task.task_id, 'Fallo')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${task.result==='Fallo'?'bg-red-600 text-white':'bg-gray-100 text-gray-600 hover:bg-red-100'}`}>Fallo</button>
                         <button onClick={()=>handleUpdateTask(task.task_id, 'N/A')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${task.result==='N/A'?'bg-gray-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>N/A</button>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-xl bg-gray-50"><ArrowUp className="mx-auto h-8 w-8 mb-2 opacity-50"/><p>Seleccione una Orden para iniciar la inspección.</p></div>
        )}
    </div>
  );

  return (
    <div className="bg-gray-100 font-sans text-gray-800 h-screen flex overflow-hidden">
      {/* SIDEBAR */}
      <aside className={`bg-white w-64 flex-shrink-0 border-r border-gray-200 flex flex-col transition-transform duration-300 absolute z-20 h-full md:relative ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Wrench className="text-blue-600 mr-2 h-7 w-7" /><span className="text-xl font-bold text-gray-900">PME CMMS</span>
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
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-400">v9.5 Ultimate</div>
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

      {/* MODALES */}
      {activeModal === 'asset' && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="bg-white rounded p-4 w-96"><h3 className="font-bold mb-4">Nuevo Activo</h3><form onSubmit={handleCreateAsset} className="space-y-4"><input className="border w-full p-2" placeholder="Nombre" value={newAsset.fixture_name} onChange={e=>setNewAsset({...newAsset, fixture_name:e.target.value})}/><input className="border w-full p-2" placeholder="Serial" value={newAsset.serial_number} onChange={e=>setNewAsset({...newAsset, serial_number:e.target.value})}/><button className="bg-blue-600 text-white w-full py-2">Guardar</button><button type="button" onClick={()=>setActiveModal(null)} className="w-full text-gray-500 py-1">Cancelar</button></form></div></div>}
      {activeModal === 'item' && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="bg-white rounded p-4 w-96"><h3 className="font-bold mb-4">Nuevo Ítem</h3><form onSubmit={handleCreateItem} className="space-y-4"><input className="border w-full p-2" placeholder="SKU" value={newItem.part_code} onChange={e=>setNewItem({...newItem, part_code:e.target.value})}/><input className="border w-full p-2" placeholder="Nombre" value={newItem.name} onChange={e=>setNewItem({...newItem, name:e.target.value})}/><input className="border w-full p-2" type="number" placeholder="Stock" value={newItem.stock_quantity} onChange={e=>setNewItem({...newItem, stock_quantity:e.target.value})}/><button className="bg-blue-600 text-white w-full py-2">Guardar</button><button type="button" onClick={()=>setActiveModal(null)} className="w-full text-gray-500 py-1">Cancelar</button></form></div></div>}
      {activeModal === 'plan' && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="bg-white rounded p-4 w-96"><h3 className="font-bold mb-4">Nuevo Plan</h3><form onSubmit={handleCreatePlan} className="space-y-4"><select className="border w-full p-2" value={newPlan.asset_id} onChange={e=>setNewPlan({...newPlan, asset_id:e.target.value})}><option value="">Activo...</option>{dbAssets.map(a=><option key={a.asset_id} value={a.asset_id}>{a.fixture_name}</option>)}</select><input className="border w-full p-2" placeholder="Actividad" value={newPlan.activity} onChange={e=>setNewPlan({...newPlan, activity:e.target.value})}/><input type="date" className="border w-full p-2" value={newPlan.next_due_date} onChange={e=>setNewPlan({...newPlan, next_due_date:e.target.value})}/><button className="bg-blue-600 text-white w-full py-2">Guardar</button><button type="button" onClick={()=>setActiveModal(null)} className="w-full text-gray-500 py-1">Cancelar</button></form></div></div>}
      {activeModal === 'user' && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="bg-white rounded p-4 w-96"><h3 className="font-bold mb-4">Nuevo Usuario</h3><form onSubmit={handleCreateUser} className="space-y-4"><input className="border w-full p-2" placeholder="# Empleado" value={newUser.employee_number} onChange={e=>setNewUser({...newUser, employee_number:e.target.value})}/><input className="border w-full p-2" placeholder="Nombre" value={newUser.full_name} onChange={e=>setNewUser({...newUser, full_name:e.target.value})}/><button className="bg-blue-600 text-white w-full py-2">Guardar</button><button type="button" onClick={()=>setActiveModal(null)} className="w-full text-gray-500 py-1">Cancelar</button></form></div></div>}
      
      {/* MODAL RETIRAR STOCK (NUEVO) */}
      {activeModal === 'withdraw' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded p-4 w-96">
            <h3 className="font-bold mb-4">Retirar Material</h3>
            <form onSubmit={handleWithdraw} className="space-y-4">
               <div><label className="text-xs">ID Ítem</label><input disabled className="border w-full p-2 bg-gray-100" value={withdrawData.item_id}/></div>
               <div><label className="text-xs">Cantidad</label><input type="number" min="1" className="border w-full p-2" value={withdrawData.quantity} onChange={e=>setWithdrawData({...withdrawData, quantity:e.target.value})}/></div>
               <div><label className="text-xs">Motivo</label><input className="border w-full p-2" placeholder="Ej. OT-1001" value={withdrawData.reason} onChange={e=>setWithdrawData({...withdrawData, reason:e.target.value})}/></div>
               <button className="bg-orange-600 text-white w-full py-2 rounded font-bold hover:bg-orange-700">Confirmar Retiro</button>
               <button type="button" onClick={()=>setActiveModal(null)} className="w-full text-gray-500 py-1">Cancelar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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