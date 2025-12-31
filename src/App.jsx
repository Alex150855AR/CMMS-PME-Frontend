import React, { useState, useEffect } from 'react';
import { 
  Wrench, LayoutDashboard, ClipboardList, Box, 
  Package, CheckSquare, Users, Menu, X, Plus, 
  Search, Activity, Clock, Hammer, DollarSign,
  Wifi, WifiOff, Edit, Printer, FileText, Filter, Trash2
} from 'lucide-react';

// --- ESTADO INICIAL ---
export default function App() {
  // --- UI STATE ---
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); 
  
  // --- DATA STATE ---
  const [dbAssets, setDbAssets] = useState([]);      
  const [dbWorkOrders, setDbWorkOrders] = useState([]); 
  const [dbInventory, setDbInventory] = useState([]);
  const [dbStaff, setDbStaff] = useState([]); 
  
  // --- FILTROS ACTIVOS ---
  const [assetFilters, setAssetFilters] = useState({ search: '', project: '', model: '' });
  
  // --- FORMULARIOS ---
  const [formAsset, setFormAsset] = useState({ 
    project_name: '', model_name: '', serial_number: '', fixture_name: '', 
    production_line: '', station: '', description: '', image_url: '', documentation_url: '' 
  });
  
  const [formWO, setFormWO] = useState({
    project_filter: '', model_filter: '', asset_id: '', 
    location: '', type: 'Correctivo', priority: 'Media',
    start_date: '', end_date: '', material_id: '', material_qty: 0, tech_id: ''
  });

  const [formItem, setFormItem] = useState({ part_code: '', name: '', stock_quantity: 0, min_stock_level: 5, unit_cost: 0, location_in_warehouse: '' });
  const [formUser, setFormUser] = useState({ employee_number: '', full_name: '', email: '', role: 'Tecnico' });

  // --- API ---
  const BASE_URL = 'http://localhost:3000/api';
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');

  // --- INIT ---
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchAssets(), fetchWorkOrders(), fetchInventory(), fetchUsers()]);
    setLoading(false);
  };

  // --- FETCHERS ---
  const fetchAssets = async () => {
    try {
      // Construir query string para filtros
      const query = new URLSearchParams(assetFilters).toString();
      const res = await fetch(`${BASE_URL}/assets?${query}`);
      if(res.ok) { setDbAssets(await res.json()); setServerStatus('online'); }
    } catch(e) { setServerStatus('offline'); }
  };

  const fetchWorkOrders = async () => { 
    const res = await fetch(`${BASE_URL}/work-orders`); 
    if(res.ok) setDbWorkOrders(await res.json()); 
  };
  const fetchInventory = async () => { 
    const res = await fetch(`${BASE_URL}/inventory`); 
    if(res.ok) setDbInventory(await res.json()); 
  };
  const fetchUsers = async () => { 
    const res = await fetch(`${BASE_URL}/users`); 
    if(res.ok) setDbStaff(await res.json()); 
  };

  // --- ACTIONS ---
  const handleSaveAsset = async (e) => {
    e.preventDefault();
    const endpoint = formAsset.asset_id ? `${BASE_URL}/assets/${formAsset.asset_id}` : `${BASE_URL}/assets`;
    const method = formAsset.asset_id ? 'PUT' : 'POST';
    
    await apiRequest(endpoint, method, formAsset);
    setFormAsset({ project_name: '', model_name: '', serial_number: '', fixture_name: '', production_line: '', station: '', description: '', image_url: '', documentation_url: '' });
    fetchAssets();
  };

  const handleSaveWO = async (e) => {
    e.preventDefault();
    // Construir payload combinando campos
    const payload = {
      asset_id: formWO.asset_id,
      description: `Mantenimiento ${formWO.type} en ${formWO.location}`,
      maintenance_type: formWO.type,
      priority: formWO.priority,
      assigned_user_id: formWO.tech_id,
      material_id: formWO.material_id,
      material_qty: formWO.material_qty,
      scheduled_start: formWO.start_date,
      scheduled_end: formWO.end_date,
      location: formWO.location
    };
    await apiRequest(`${BASE_URL}/work-orders`, 'POST', payload);
    setFormWO({ project_filter: '', model_filter: '', asset_id: '', location: '', type: 'Correctivo', priority: 'Media', start_date: '', end_date: '', material_id: '', material_qty: 0, tech_id: '' });
    fetchWorkOrders();
    fetchInventory(); // Actualizar stock
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    await apiRequest(`${BASE_URL}/inventory`, 'POST', formItem);
    setFormItem({ part_code: '', name: '', stock_quantity: 0, min_stock_level: 5, unit_cost: 0, location_in_warehouse: '' });
    fetchInventory();
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    await apiRequest(`${BASE_URL}/users`, 'POST', formUser);
    setFormUser({ employee_number: '', full_name: '', email: '', role: 'Tecnico' });
    fetchUsers();
  };

  const apiRequest = async (url, method, body) => {
    try {
      const res = await fetch(url, {
        method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
      });
      if(res.ok) { setActiveModal(null); alert('Guardado exitosamente'); }
      else { const err = await res.json(); alert('Error: ' + err.error); }
    } catch(e) { alert('Error de conexión'); }
  };

  // --- HELPERS PARA DROPDOWNS EN CASCADA ---
  const getUniqueProjects = () => [...new Set(dbAssets.map(a => a.project_name))].filter(Boolean);
  
  // Filtrar modelos basado en el proyecto seleccionado en el filtro
  const getModelsForProject = (project) => {
    const assets = project ? dbAssets.filter(a => a.project_name === project) : dbAssets;
    return [...new Set(assets.map(a => a.model_name))].filter(Boolean);
  };

  const filteredAssetsForWO = dbAssets.filter(a => 
    (!formWO.project_filter || a.project_name === formWO.project_filter) &&
    (!formWO.model_filter || a.model_name === formWO.model_filter)
  );

  const printOrder = (ot) => {
    const content = `
      ORDEN DE TRABAJO #${ot.wo_id}
      --------------------------------
      Activo: ${ot.fixture_name} (${ot.serial_number})
      Técnico: ${ot.tech_name || 'Sin asignar'}
      Tipo: ${ot.maintenance_type}
      Prioridad: ${ot.priority}
      Ubicación: ${ot.location || 'N/A'}
      Fechas: ${new Date(ot.scheduled_start).toLocaleString()} - ${new Date(ot.scheduled_end).toLocaleString()}
      --------------------------------
      Descripción: ${ot.description}
    `;
    alert("Simulación de Impresión PDF:\n" + content);
  };

  // --- KPIS SIMPLES ---
  const kpis = {
    availability: 98.5,
    mtbf: 720,
    mttr: 4.2,
    totalCost: 0,
    completionRate: dbWorkOrders.length > 0 ? ((dbWorkOrders.filter(w => w.status === 'Completado').length / dbWorkOrders.length) * 100).toFixed(1) : 0,
    backlog: dbWorkOrders.filter(w => w.status === 'Pendiente').length
  };

  // --- VISTAS ---

  const AssetsView = () => (
    <div className="space-y-6 animate-in fade-in">
      {/* Barra de Herramientas */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
        <div className="flex gap-2 w-full md:w-auto flex-wrap">
          <div className="relative w-full md:w-48">
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
             <input className="pl-9 border rounded p-2 text-sm w-full" placeholder="Buscar Serial..." 
               value={assetFilters.search} onChange={e => setAssetFilters({...assetFilters, search: e.target.value})} />
          </div>
          <select className="border rounded p-2 text-sm" value={assetFilters.project} onChange={e => setAssetFilters({...assetFilters, project: e.target.value})}>
             <option value="">Todos Proyectos</option>
             {getUniqueProjects().map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="border rounded p-2 text-sm" value={assetFilters.model} onChange={e => setAssetFilters({...assetFilters, model: e.target.value})}>
             <option value="">Todos Modelos</option>
             {getModelsForProject(assetFilters.project).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button onClick={fetchAssets} className="bg-blue-100 text-blue-600 p-2 rounded hover:bg-blue-200"><Filter className="w-4 h-4"/></button>
        </div>
        <button onClick={() => { setFormAsset({}); setActiveModal('asset'); }} className="bg-green-600 text-white px-4 py-2 rounded-md shadow flex items-center whitespace-nowrap"><Plus className="w-4 h-4 mr-2"/> Nuevo Activo</button>
      </div>

      {/* Grid de Activos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dbAssets.map(a => (
           <div key={a.asset_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 relative hover:shadow-md group">
              <div className="absolute top-4 right-4 hidden group-hover:flex gap-2">
                 <button onClick={() => { setFormAsset({...a}); setActiveModal('asset'); }} className="p-1 bg-gray-100 rounded hover:bg-blue-100 text-blue-600"><Edit className="w-4 h-4"/></button>
              </div>
              <div className="flex justify-between mb-2">
                <div className="bg-blue-50 p-2 rounded-full"><Box className="w-5 h-5 text-blue-600"/></div>
                <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-gray-100 text-gray-600">{a.project_name}</span>
              </div>
              <h3 className="text-sm font-bold text-gray-900">{a.fixture_name}</h3>
              <p className="text-xs text-gray-500 font-mono mb-2">SN: {a.serial_number}</p>
              <div className="text-xs text-gray-400 space-y-1">
                 <p>Modelo: {a.model_name}</p>
                 <p>Ubicación: {a.production_line} - {a.station}</p>
              </div>
           </div>
        ))}
      </div>
    </div>
  );

  const WorkOrdersView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full overflow-hidden animate-in fade-in">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Órdenes de Trabajo</h2>
        <button onClick={() => setActiveModal('wo')} className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-bold shadow-sm flex items-center"><Plus className="w-4 h-4 mr-2"/> Nueva Orden</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase font-bold">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Activo / Serial</th>
              <th className="px-4 py-3">Ubicación</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Prioridad</th>
              <th className="px-4 py-3">Técnico</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dbWorkOrders.map((ot) => (
              <tr key={ot.wo_id} className="hover:bg-blue-50/50">
                <td className="px-4 py-4 font-bold text-blue-600">#{ot.wo_id}</td>
                <td className="px-4 py-4">
                   <div className="font-bold">{ot.fixture_name}</div>
                   <div className="text-gray-400">{ot.serial_number}</div>
                </td>
                <td className="px-4 py-4">{ot.location || 'N/A'}</td>
                <td className="px-4 py-4">{ot.maintenance_type}</td>
                <td className="px-4 py-4"><span className={`px-2 py-1 rounded font-bold ${ot.priority==='Critica'?'bg-red-100 text-red-800':'bg-green-100 text-green-800'}`}>{ot.priority}</span></td>
                <td className="px-4 py-4">{ot.tech_name || 'Sin asignar'}</td>
                <td className="px-4 py-4"><span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800">{ot.status}</span></td>
                <td className="px-4 py-4 text-center flex justify-center gap-2">
                  <button className="text-gray-400 hover:text-blue-600" title="Editar"><Edit className="w-4 h-4"/></button>
                  <button onClick={() => printOrder(ot)} className="text-gray-400 hover:text-blue-600" title="Imprimir PDF"><Printer className="w-4 h-4"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const InventoryView = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 fade-in animate-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">Inventario</h2>
        <button onClick={() => setActiveModal('item')} className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm flex items-center"><Plus className="w-4 h-4 mr-2"/> Nuevo Ítem</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dbInventory.map(i => (
          <div key={i.item_id} className="border border-gray-200 p-4 rounded-lg bg-white">
            <div className="flex justify-between font-bold text-gray-800 mb-1"><span>{i.name}</span><span className="text-xs bg-gray-100 p-1 rounded font-mono text-gray-500">{i.part_code}</span></div>
            <div className="flex justify-between items-center text-sm font-bold mt-2"><span className="text-gray-500 text-xs">Costo: ${i.unit_cost}</span><span className="bg-green-50 text-green-600 px-2 py-0.5 rounded">Stock: {i.stock_quantity}</span></div>
            <p className="text-xs text-gray-400 mt-2">Ubicación: {i.location_in_warehouse}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const StaffView = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 fade-in animate-in">
      <div className="flex justify-between items-center mb-6"><h2 className="text-lg font-bold">Personal</h2><button onClick={() => setActiveModal('user')} className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm flex items-center"><Plus className="w-4 h-4 mr-2"/> Agregar</button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dbStaff.map(s => (
          <div key={s.user_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center"><div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mr-3">{s.full_name.charAt(0)}</div><div><p className="font-bold text-gray-900">{s.full_name}</p><p className="text-xs text-gray-500">{s.email}</p></div></div>
            <div className="text-right"><span className="text-xs font-mono text-gray-400 block">{s.employee_number}</span><span className="text-xs bg-blue-100 text-blue-800 px-2 rounded">{s.role}</span></div>
          </div>
        ))}
      </div>
    </div>
  );

  // DASHBOARD RESTAURADO
  const DashboardView = () => (
    <div className="space-y-6 pb-10 animate-in fade-in">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center ${serverStatus === 'online' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
             {serverStatus === 'online' ? <Wifi className="w-3 h-3 mr-1"/> : <WifiOff className="w-3 h-3 mr-1"/>} {serverStatus === 'online' ? 'Online' : 'Offline'}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="Disponibilidad" value={`${kpis.availability}%`} icon={<Activity />} color="blue" sub="Tiempo Operativo" />
        <KpiCard title="Tasa Finalización" value={`${kpis.completionRate}%`} icon={<CheckSquare />} color="green" sub="Órdenes Cerradas" />
        <KpiCard title="Pendientes" value={kpis.backlog} icon={<Clock />} color="orange" sub="Backlog" />
        <KpiCard title="Total" value={dbWorkOrders.length} icon={<ClipboardList />} color="purple" sub="Histórico" />
      </div>
      {/* Gráficos Visuales CSS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 col-span-1">
           <h3 className="text-sm font-bold text-gray-700 mb-4">MP vs Correctivo</h3>
           <div className="flex items-end justify-center gap-4 h-48 border-b border-gray-100 pb-2">
              <div className="w-16 bg-blue-500 rounded-t-lg h-[70%] relative group"><span className="absolute -top-5 w-full text-center text-xs">70%</span></div>
              <div className="w-16 bg-red-500 rounded-t-lg h-[30%] relative group"><span className="absolute -top-5 w-full text-center text-xs">30%</span></div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 col-span-1 lg:col-span-2">
           <h3 className="text-sm font-bold text-gray-700 mb-4">Tendencia Anual</h3>
           <div className="flex items-end justify-between gap-2 h-48 border-b border-gray-100 pb-2">
              {[40, 60, 45, 80, 55, 90, 65, 75, 50, 85, 95, 70].map((h, i) => (
                <div key={i} className="w-full bg-emerald-400 rounded-t-sm" style={{height: `${h}%`}}></div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-100 font-sans text-gray-800 h-screen flex overflow-hidden">
      {/* SIDEBAR */}
      <aside className={`bg-white w-64 flex-shrink-0 border-r border-gray-200 flex flex-col transition-transform duration-300 absolute z-20 h-full md:relative ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-16 flex items-center px-6 border-b border-gray-200"><Wrench className="text-blue-600 mr-2 h-7 w-7" /><span className="text-xl font-bold text-gray-900">PME CMMS</span></div>
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          <NavButton icon={<LayoutDashboard />} label="Dashboard" view="dashboard" current={currentView} set={setCurrentView} />
          <NavButton icon={<Box />} label="Activos" view="assets" current={currentView} set={setCurrentView} />
          <NavButton icon={<ClipboardList />} label="Órdenes Trabajo" view="workorders" current={currentView} set={setCurrentView} />
          <NavButton icon={<Package />} label="Inventario" view="inventory" current={currentView} set={setCurrentView} />
          <NavButton icon={<FileText />} label="Bitácora" view="bitacora" current={currentView} set={setCurrentView} />
          <NavButton icon={<Users />} label="Personal" view="team" current={currentView} set={setCurrentView} />
          <NavButton icon={<CheckSquare />} label="Checklist" view="checklist" current={currentView} set={setCurrentView} />
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        <header className="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-10">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 mr-2"><Menu className="w-6 h-6"/></button>
            <h1 className="text-xl font-semibold text-gray-800 capitalize">{currentView}</h1>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8 bg-gray-100 relative">
          {loading ? <div className="text-center py-20 text-gray-400"><Activity className="animate-spin mx-auto w-8 h-8 mb-2"/>Cargando...</div> : (
            <>
              {currentView === 'dashboard' && <DashboardView />}
              {currentView === 'assets' && <AssetsView />}
              {currentView === 'workorders' && <WorkOrdersView />}
              {currentView === 'inventory' && <InventoryView />}
              {currentView === 'team' && <StaffView />}
              {currentView === 'bitacora' && <div className="text-center py-20 text-gray-400">Bitácora (Próximamente)</div>}
              {currentView === 'checklist' && <div className="text-center py-20 text-gray-400">Checklist (Próximamente)</div>}
            </>
          )}
        </main>
      </div>

      {/* --- MODALES --- */}

      {/* 1. CREAR/EDITAR ACTIVO */}
      {activeModal === 'asset' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{formAsset.asset_id ? 'Editar Activo' : 'Nuevo Activo'}</h3>
            <form onSubmit={handleSaveAsset} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div><label className="text-xs font-bold">Proyecto</label><input required className="border w-full p-2 rounded" placeholder="Ej. BMW" value={formAsset.project_name} onChange={e=>setFormAsset({...formAsset, project_name:e.target.value})}/></div>
                 <div><label className="text-xs font-bold">Modelo</label><input required className="border w-full p-2 rounded" placeholder="Ej. X5" value={formAsset.model_name} onChange={e=>setFormAsset({...formAsset, model_name:e.target.value})}/></div>
               </div>
               <div><label className="text-xs font-bold">Serial Number</label><input required className="border w-full p-2 rounded" value={formAsset.serial_number} onChange={e=>setFormAsset({...formAsset, serial_number:e.target.value})}/></div>
               <div><label className="text-xs font-bold">Nombre Fixtura</label><input required className="border w-full p-2 rounded" value={formAsset.fixture_name} onChange={e=>setFormAsset({...formAsset, fixture_name:e.target.value})}/></div>
               <div className="grid grid-cols-2 gap-4">
                 <div><label className="text-xs font-bold">Línea</label><input className="border w-full p-2 rounded" value={formAsset.production_line} onChange={e=>setFormAsset({...formAsset, production_line:e.target.value})}/></div>
                 <div><label className="text-xs font-bold">Estación</label><input className="border w-full p-2 rounded" value={formAsset.station} onChange={e=>setFormAsset({...formAsset, station:e.target.value})}/></div>
               </div>
               <div><label className="text-xs font-bold">Descripción</label><textarea className="border w-full p-2 rounded" value={formAsset.description} onChange={e=>setFormAsset({...formAsset, description:e.target.value})}/></div>
               <div><label className="text-xs font-bold">Documentación (URL)</label><input className="border w-full p-2 rounded" value={formAsset.documentation_url} onChange={e=>setFormAsset({...formAsset, documentation_url:e.target.value})}/></div>
               <button className="bg-blue-600 text-white w-full py-2 rounded font-bold">Guardar Activo</button>
               <button type="button" onClick={()=>setActiveModal(null)} className="w-full text-gray-500 py-1">Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {/* 2. CREAR ORDEN DE TRABAJO */}
      {activeModal === 'wo' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Nueva Orden de Trabajo</h3>
            <form onSubmit={handleSaveWO} className="space-y-4">
               {/* Cascada */}
               <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded">
                  <div>
                    <label className="text-xs font-bold">1. Filtrar Proyecto</label>
                    <select className="border w-full p-2 rounded bg-white" onChange={e=>setFormWO({...formWO, project_filter:e.target.value})}>
                       <option value="">Todos</option>{getUniqueProjects().map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold">2. Filtrar Modelo</label>
                    <select className="border w-full p-2 rounded bg-white" onChange={e=>setFormWO({...formWO, model_filter:e.target.value})}>
                       <option value="">Todos</option>{getModelsForProject(formWO.project_filter).map(m=><option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-blue-700">3. Seleccionar Activo</label>
                    <select required className="border w-full p-2 rounded border-blue-300" onChange={e=>setFormWO({...formWO, asset_id:e.target.value})}>
                       <option value="">-- Seleccionar Activo --</option>
                       {filteredAssetsForWO.map(a=><option key={a.asset_id} value={a.asset_id}>{a.serial_number} - {a.fixture_name}</option>)}
                    </select>
                  </div>
               </div>

               <div><label className="text-xs font-bold">Ubicación</label><input className="border w-full p-2 rounded" placeholder="Línea / Estación" value={formWO.location} onChange={e=>setFormWO({...formWO, location:e.target.value})}/></div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold">Tipo</label><select className="border w-full p-2 rounded" onChange={e=>setFormWO({...formWO, type:e.target.value})}><option>Correctivo</option><option>Preventivo</option></select></div>
                  <div><label className="text-xs font-bold">Prioridad</label><select className="border w-full p-2 rounded" onChange={e=>setFormWO({...formWO, priority:e.target.value})}><option>Baja</option><option>Media</option><option>Alta</option><option>Critica</option></select></div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold">Inicio</label><input type="datetime-local" className="border w-full p-2 rounded" onChange={e=>setFormWO({...formWO, start_date:e.target.value})}/></div>
                  <div><label className="text-xs font-bold">Fin</label><input type="datetime-local" className="border w-full p-2 rounded" onChange={e=>setFormWO({...formWO, end_date:e.target.value})}/></div>
               </div>

               <div className="bg-orange-50 p-3 rounded border border-orange-100">
                  <label className="text-xs font-bold text-orange-800">Material (Descuento Automático)</label>
                  <div className="flex gap-2 mt-1">
                     <select className="border w-3/4 p-2 rounded bg-white" onChange={e=>setFormWO({...formWO, material_id:e.target.value})}>
                        <option value="">-- Ninguno --</option>
                        {dbInventory.map(i=><option key={i.item_id} value={i.item_id}>{i.name} (Stock: {i.stock_quantity})</option>)}
                     </select>
                     <input type="number" className="border w-1/4 p-2 rounded" placeholder="Cant." onChange={e=>setFormWO({...formWO, material_qty:e.target.value})}/>
                  </div>
               </div>

               <div>
                  <label className="text-xs font-bold">Técnico</label>
                  <select className="border w-full p-2 rounded" onChange={e=>setFormWO({...formWO, tech_id:e.target.value})}>
                     <option value="">-- Seleccionar --</option>
                     {dbStaff.map(s=><option key={s.user_id} value={s.user_id}>{s.full_name}</option>)}
                  </select>
               </div>

               <button className="bg-blue-600 text-white w-full py-3 rounded font-bold hover:bg-blue-700">Crear Orden</button>
               <button type="button" onClick={()=>setActiveModal(null)} className="w-full text-gray-500 py-1">Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {/* 3. CREAR ITEM INVENTARIO */}
      {activeModal === 'item' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold mb-4">Nuevo Repuesto</h3>
            <form onSubmit={handleSaveItem} className="space-y-4">
               <input className="border w-full p-2 rounded" placeholder="Código Parte (ID)" required value={formItem.part_code} onChange={e=>setFormItem({...formItem, part_code:e.target.value})}/>
               <input className="border w-full p-2 rounded" placeholder="Nombre" required value={formItem.name} onChange={e=>setFormItem({...formItem, name:e.target.value})}/>
               <div className="grid grid-cols-2 gap-2">
                 <input type="number" className="border p-2 rounded" placeholder="Cantidad" required value={formItem.stock_quantity} onChange={e=>setFormItem({...formItem, stock_quantity:e.target.value})}/>
                 <input type="number" className="border p-2 rounded" placeholder="Mínimo" required value={formItem.min_stock_level} onChange={e=>setFormItem({...formItem, min_stock_level:e.target.value})}/>
               </div>
               <div className="grid grid-cols-2 gap-2">
                 <input type="number" className="border p-2 rounded" placeholder="Costo Unitario ($)" required value={formItem.unit_cost} onChange={e=>setFormItem({...formItem, unit_cost:e.target.value})}/>
                 <input className="border p-2 rounded" placeholder="Ubicación" value={formItem.location_in_warehouse} onChange={e=>setFormItem({...formItem, location_in_warehouse:e.target.value})}/>
               </div>
               <button className="bg-blue-600 text-white w-full py-2 rounded font-bold">Guardar</button>
               <button type="button" onClick={()=>setActiveModal(null)} className="w-full text-gray-500 py-1">Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {/* 4. CREAR USUARIO */}
      {activeModal === 'user' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold mb-4">Nuevo Personal</h3>
            <form onSubmit={handleSaveUser} className="space-y-4">
               <input className="border w-full p-2 rounded" placeholder="Número Empleado" required value={formUser.employee_number} onChange={e=>setFormUser({...formUser, employee_number:e.target.value})}/>
               <input className="border w-full p-2 rounded" placeholder="Nombre Completo" required value={formUser.full_name} onChange={e=>setFormUser({...formUser, full_name:e.target.value})}/>
               <input className="border w-full p-2 rounded" placeholder="Correo Electrónico" required value={formUser.email} onChange={e=>setFormUser({...formUser, email:e.target.value})}/>
               <select className="border w-full p-2 rounded" value={formUser.role} onChange={e=>setFormUser({...formUser, role:e.target.value})}>
                  <option>Tecnico</option><option>Ingeniero</option><option>Supervisor</option>
               </select>
               <button className="bg-blue-600 text-white w-full py-2 rounded font-bold">Registrar</button>
               <button type="button" onClick={()=>setActiveModal(null)} className="w-full text-gray-500 py-1">Cancelar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- UI COMPONENTS ---
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