import React, { useState, useEffect } from 'react';
import { 
  Wrench, LayoutDashboard, CalendarClock, ClipboardList, Box, 
  Package, CheckSquare, Users, Menu, X, Plus, 
  Search, Activity, Clock, Hammer, DollarSign,
  Wifi, WifiOff, ChevronDown, Eye, ArrowUp, Edit, Printer
} from 'lucide-react';

// --- DATOS ESTÁTICOS (Respaldo para módulos sin Backend aún) ---
const INITIAL_STATIC_DATA = {
  maintenancePlans: [
      { id: 1, assetId: 'M23007E0D', activity: 'Limpieza General', freq: 'Semanal', nextDate: '2025-12-08', techId: 'S-01', deadline: '2025-12-10' },
      { id: 2, assetId: 'M23007D43', activity: 'Calibración Sensor', freq: 'Mensual', nextDate: '2025-12-15', techId: 'S-02', deadline: '2025-12-20' }
  ],
  staff: [
      { id: 'S-01', name: 'Juan Pérez', role: 'Técnico Senior' },
      { id: 'S-02', name: 'Maria Garcia', role: 'Técnico Mecánico' },
      { id: 'S-03', name: 'Carlos Lopez', role: 'Supervisor' },
      { id: 'S-04', name: 'Ana Diaz', role: 'Electricista' }
  ],
  inventory: [
      { id: 'P-101', name: 'Broca Tricónica 9"', desc: 'Acero', stock: 4, minStock: 2, location: 'Almacén' },
      { id: 'P-102', name: 'Filtro Aceite', desc: 'Standard', stock: 1, minStock: 5, location: 'Estante B3' },
      { id: 'P-103', name: 'Lubricante Industrial', desc: 'Sintético 5L', stock: 10, minStock: 8, location: 'Pasillo 4' }
  ],
  checklists: [] // Se puede poblar después
};

export default function App() {
  // --- ESTADOS DE LA INTERFAZ ---
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  
  // --- ESTADOS DE DATOS (CONECTADOS) ---
  const [dbAssets, setDbAssets] = useState([]);      // Datos reales de MySQL
  const [dbWorkOrders, setDbWorkOrders] = useState([]); // Datos reales de MySQL
  const [staticData, setStaticData] = useState(INITIAL_STATIC_DATA);
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState('checking');

  // --- ESTADOS DE FORMULARIOS ---
  const [newAsset, setNewAsset] = useState({
    serial_number: '', fixture_name: '', production_line: 'Línea 1', model_id: 1
  });

  // --- CONFIGURACIÓN API ---
  const API_URL_ASSETS = 'http://localhost:3000/api/assets';
  const API_URL_WO = 'http://localhost:3000/api/work-orders';

  // --- INICIO: CARGA DE DATOS ---
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchAssets(), fetchWorkOrders()]);
      setLoading(false);
    };
    initData();
  }, []);

  // --- FUNCIONES DE CONEXIÓN AL BACKEND ---
  const fetchAssets = async () => {
    try {
      const response = await fetch(API_URL_ASSETS);
      if (response.ok) {
        setDbAssets(await response.json());
        setServerStatus('online');
      }
    } catch (error) {
      console.error("Error assets:", error);
      setServerStatus('offline');
    }
  };

  const fetchWorkOrders = async () => {
    try {
      const response = await fetch(API_URL_WO);
      if (response.ok) {
        setDbWorkOrders(await response.json());
      }
    } catch (error) {
      console.error("Error work orders:", error);
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newAsset, model_id: 1, station: 'Móvil', condition_status: 'Activo' };
      const response = await fetch(API_URL_ASSETS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setActiveModal(null);
        setNewAsset({ serial_number: '', fixture_name: '', production_line: 'Línea 1', model_id: 1 });
        fetchAssets(); 
        alert('✅ Activo guardado correctamente');
      } else {
        alert('❌ Error al guardar activo');
      }
    } catch (error) { alert('❌ Error de conexión'); }
  };

  // --- CÁLCULO DE KPIs ---
  const kpis = {
    totalOrders: dbWorkOrders.length,
    completed: dbWorkOrders.filter(w => w.status === 'Completado' || w.status === 'Ejecutado').length,
    pending: dbWorkOrders.filter(w => w.status === 'Pendiente').length,
    availability: 98.5, // Simulado
    mtbf: 720,          // Simulado
    mttr: 4.2           // Simulado
  };
  
  const completionRate = kpis.totalOrders > 0 
    ? ((kpis.completed / kpis.totalOrders) * 100).toFixed(1) 
    : 0;

  // --- VISTAS DEL SISTEMA ---

  // 1. DASHBOARD
  const DashboardView = () => (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Dashboard de Rendimiento</h2>
        <div className="flex gap-2">
           <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full border border-blue-100 flex items-center">
             {serverStatus === 'online' ? <Wifi className="w-3 h-3 mr-1"/> : <WifiOff className="w-3 h-3 mr-1"/>}
             {serverStatus === 'online' ? 'Datos en Tiempo Real' : 'Modo Offline (Datos Estáticos)'}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Disponibilidad" value={`${kpis.availability}%`} icon={<Activity />} color="blue" sub="Tiempo operativo" />
        <KpiCard title="Tasa Finalización" value={`${completionRate}%`} icon={<CheckSquare />} color="green" sub={`${kpis.completed} Órdenes cerradas`} />
        <KpiCard title="Pendientes" value={kpis.pending} icon={<Clock />} color="orange" sub="Requieren atención" />
        <KpiCard title="Total Histórico" value={kpis.totalOrders} icon={<ClipboardList />} color="purple" sub="Órdenes registradas" />
      </div>

      {/* Gráficos Visuales (Simulados con CSS) */}
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

  // 2. ACTIVOS (CONECTADO A BACKEND)
  const AssetsView = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm gap-4">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap mr-4">Flota de Equipos</h2>
          <div className="relative w-full md:w-64">
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
             <input type="text" placeholder="Buscar Serial..." className="border border-gray-300 rounded p-2 pl-9 text-sm w-full focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
        <button onClick={() => setActiveModal('asset')} className="bg-green-600 text-white px-4 py-2 rounded-md shadow hover:bg-green-700 flex items-center whitespace-nowrap transition-transform active:scale-95">
          <Plus className="w-4 h-4 mr-2" /> Agregar Activo
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20"><Activity className="w-10 h-10 animate-spin mx-auto text-blue-500" /><p className="mt-2 text-gray-500">Sincronizando...</p></div>
      ) : dbAssets.length === 0 ? (
        <div className="p-8 text-center text-gray-400 bg-gray-50 border border-dashed rounded-lg">No hay activos registrados en MySQL.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dbAssets.map(asset => (
             <div key={asset.asset_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all relative group">
                <div className="flex justify-between items-start mb-2">
                  <div className="bg-blue-50 p-2 rounded-full"><Box className="w-5 h-5 text-blue-600" /></div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase ${asset.condition_status === 'Activo' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {asset.condition_status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{asset.fixture_name}</h3>
                <p className="text-xs text-gray-500 mb-1 font-mono">SN: {asset.serial_number}</p>
                <p className="text-xs text-blue-600 mb-2">{asset.model_name || 'Modelo Genérico'}</p>
                <div className="mt-auto border-t pt-2 flex justify-between items-center text-xs text-gray-500">
                  <span>{asset.production_line}</span>
                  <button className="text-blue-600 hover:underline">Ver Historial</button>
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );

  // 3. ÓRDENES DE TRABAJO (CONECTADO A BACKEND)
  const WorkOrdersView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full overflow-hidden animate-in fade-in duration-300">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Gestión de Órdenes de Trabajo</h2>
        <button className="text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 font-bold shadow-sm flex items-center">
          <Plus className="w-3 h-3 mr-1"/> Crear Orden
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-10"><Activity className="w-8 h-8 animate-spin mx-auto text-blue-500"/></div>
      ) : dbWorkOrders.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
           <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-20"/>
           <p>No hay órdenes registradas en MySQL.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-gray-100 text-gray-600 uppercase font-bold">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Activo</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Prioridad</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dbWorkOrders.map((ot) => (
                <tr key={ot.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-4 font-bold text-blue-600 font-mono">#{ot.id}</td>
                  <td className="px-4 py-4 font-medium text-gray-700">{ot.title}</td>
                  <td className="px-4 py-4 text-gray-500">
                    <div className="font-bold text-xs">{ot.assetName}</div>
                    <div className="text-[10px]">{ot.assetId}</div>
                  </td>
                  <td className="px-4 py-4"><span className="bg-gray-100 px-2 py-1 rounded text-gray-600">{ot.type}</span></td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded font-bold ${
                      ot.priority === 'Alta' || ot.priority === 'Critico' ? 'bg-red-100 text-red-800' : 
                      ot.priority === 'Media' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {ot.priority}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full font-bold text-[10px] uppercase tracking-wide ${
                      ot.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 
                      'bg-green-100 text-green-800 border border-green-200'
                    }`}>
                      {ot.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button className="text-gray-400 hover:text-blue-600 mx-1"><Hammer className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // 4. INVENTARIO (DATOS ESTÁTICOS RESTAURADOS)
  const InventoryView = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 fade-in animate-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">Inventario de Repuestos</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center shadow-sm hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Agregar
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {staticData.inventory.map(i => (
          <div key={i.id} className="border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex justify-between font-bold text-gray-800 mb-1">
              <span>{i.name}</span>
              <span className="text-xs bg-gray-100 p-1 rounded font-mono text-gray-500">{i.id}</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">{i.desc}</p>
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-red-500">Min: {i.minStock}</span>
              <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded">Stock: {i.stock}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-400 flex items-center"><Box className="w-3 h-3 mr-1"/> {i.location}</span>
              <button className="text-orange-600 text-xs font-bold border border-orange-200 bg-orange-50 px-2 py-1 rounded hover:bg-orange-100">Retirar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 5. PLANIFICACIÓN (DATOS ESTÁTICOS RESTAURADOS)
  const PlanningView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 fade-in w-full overflow-hidden animate-in duration-300">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Programa de Mantenimiento</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 flex items-center shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Agregar Tarea
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr><th className="px-6 py-3">Activo</th><th className="px-6 py-3">Actividad</th><th className="px-6 py-3">Freq</th><th className="px-6 py-3">Próxima Fecha</th><th className="px-6 py-3">Responsable</th></tr>
          </thead>
          <tbody>
            {staticData.maintenancePlans.map(plan => (
              <tr key={plan.id} className="hover:bg-gray-50 border-b">
                <td className="px-6 py-4 font-mono text-xs text-blue-600 font-bold">{plan.assetId}</td>
                <td className="px-6 py-4 text-gray-700">{plan.activity}</td>
                <td className="px-6 py-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600 font-bold">{plan.freq}</span></td>
                <td className="px-6 py-4 text-gray-800">{plan.nextDate}</td>
                <td className="px-6 py-4 flex items-center text-xs text-gray-500"><Users className="w-3 h-3 mr-2"/> {plan.techId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 6. EQUIPO TÉCNICO (DATOS ESTÁTICOS RESTAURADOS)
  const TeamView = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 fade-in animate-in duration-300">
      <h2 className="text-lg font-bold mb-4">Personal Técnico</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {staticData.staff.map(s => (
          <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mr-3 shadow-md">
                {s.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-500">{s.role}</p>
              </div>
            </div>
            <span className="text-xs font-mono text-gray-400 bg-white border px-2 py-1 rounded">{s.id}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // 7. CHECKLIST (MANTENIDO SIMPLE)
  const ChecklistView = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 fade-in w-full overflow-hidden animate-in duration-300">
        <h2 className="text-xl font-bold mb-4 flex items-center"><CheckSquare className="mr-2 text-blue-600" /> Checklist: Mantenimiento</h2>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div><label className="block text-xs font-bold text-gray-500 uppercase">Fecha</label><input type="date" className="mt-1 w-full border border-gray-300 rounded p-2 text-sm bg-white"/></div>
          <div><label className="block text-xs font-bold text-gray-500 uppercase">Línea</label><input type="text" placeholder="Ej: Linea 1" className="mt-1 w-full border border-gray-300 rounded p-2 text-sm bg-white"/></div>
          <div className="col-span-2 text-xs text-gray-400 italic pb-2 flex items-end">Seleccione un modelo para cargar los puntos de inspección (Módulo estático por ahora).</div>
        </div>
        <div className="text-center py-10 text-gray-400 bg-gray-50 rounded border border-dashed border-gray-300 mt-4">
            <ArrowUp className="mx-auto h-8 w-8 mb-2 opacity-20"/>
            <p>Seleccione parámetros arriba para iniciar checklist.</p>
        </div>
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
        
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-xs">
           <div className={`flex items-center gap-2 font-bold ${serverStatus === 'online' ? 'text-green-600' : 'text-red-500'}`}>
              {serverStatus === 'online' ? <Wifi className="w-3 h-3"/> : <WifiOff className="w-3 h-3"/>} {serverStatus === 'online' ? 'ONLINE' : 'OFFLINE'}
           </div>
           <p className="text-[10px] text-gray-400 mt-1">v5.0 Enterprise</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        <header className="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-10">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 mr-2 text-gray-600 hover:bg-gray-100 rounded"><Menu className="w-6 h-6"/></button>
            <h1 className="text-xl font-semibold text-gray-800 capitalize">{currentView === 'workorders' ? 'Órdenes de Trabajo' : currentView}</h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">JS</div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8 bg-gray-100 relative">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'assets' && <AssetsView />}
          {currentView === 'workorders' && <WorkOrdersView />}
          {currentView === 'inventory' && <InventoryView />}
          {currentView === 'planning' && <PlanningView />}
          {currentView === 'team' && <TeamView />}
          {currentView === 'checklist' && <ChecklistView />}
        </main>
      </div>

      {/* MODAL CREAR ACTIVO */}
      {activeModal === 'asset' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold">Nuevo Activo</h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleCreateAsset} className="p-4 space-y-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Fixtura</label>
                  <input type="text" required className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" value={newAsset.fixture_name} onChange={e => setNewAsset({...newAsset, fixture_name: e.target.value})} />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Serial Number</label>
                  <input type="text" required className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" value={newAsset.serial_number} onChange={e => setNewAsset({...newAsset, serial_number: e.target.value})} />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Línea de Producción</label>
                  <select className="w-full border border-gray-300 rounded p-2 bg-white" value={newAsset.production_line} onChange={e => setNewAsset({...newAsset, production_line: e.target.value})}>
                     <option>Línea 1</option><option>Línea 2</option><option>Línea 3</option><option>Línea 4</option>
                  </select>
               </div>
               <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">Guardar en Base de Datos</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUBCOMPONENTES UI (Reutilizables) ---
const NavButton = ({ icon, label, view, current, set }) => (
  <button onClick={() => set(view)} className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors border-l-4 ${current === view ? 'text-blue-700 bg-blue-50 border-blue-600' : 'text-gray-600 hover:bg-gray-50 border-transparent hover:text-gray-900'}`}>
    <span className="mr-3">{icon}</span>{label}
  </button>
);

const KpiCard = ({ title, value, icon, color, sub }) => {
  const colors = { 
    blue: 'border-blue-500 text-blue-600 bg-blue-50', 
    green: 'border-green-500 text-green-600 bg-green-50', 
    orange: 'border-orange-500 text-orange-600 bg-orange-50', 
    purple: 'border-purple-500 text-purple-600 bg-purple-50' 
  };
  return (
    <div className={`bg-white p-5 rounded-lg border-l-4 shadow-sm hover:shadow-md transition-shadow ${colors[color].split(' ')[0]}`}>
      <div className="flex justify-between items-start">
        <div><p className="text-xs text-gray-500 uppercase font-bold tracking-wide">{title}</p><h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3></div>
        <div className={`p-2 rounded ${colors[color].split(' ').slice(1).join(' ')}`}>{icon}</div>
      </div>
      <p className="text-xs text-gray-400 mt-2 font-medium">{sub}</p>
    </div>
  );
};