import React, { useState, useEffect } from 'react';
import { 
  Wrench, LayoutDashboard, ClipboardList, Box, 
  Package, CheckSquare, Users, Menu, X, Plus, 
  Search, Activity, Clock, Hammer, DollarSign,
  Wifi, WifiOff, Edit, Printer, FileText, Filter, Trash2, Eye,
  CheckCircle, AlertCircle, FilePlus, UserPlus, Image as ImageIcon,
  BookOpen, ChevronRight, HardHat, Info
} from 'lucide-react';

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  // --- ESTADOS UI ---
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'asset', 'wo', 'item', 'user'
  const [isEditing, setIsEditing] = useState(false); 
  
  // --- ESTADOS DE DATOS ---
  const [dbAssets, setDbAssets] = useState([]);      
  const [dbWorkOrders, setDbWorkOrders] = useState([]); 
  const [dbInventory, setDbInventory] = useState([]);
  const [dbStaff, setDbStaff] = useState([]); 
  
  // --- FILTROS Y BÚSQUEDA ---
  const [searchTerm, setSearchTerm] = useState(''); 

  // --- FORMULARIOS ---
  const [formAsset, setFormAsset] = useState({ 
    id: '', project_name: '', model_name: '', serial_number: '', fixture_name: '', 
    production_line: '', station: '', description: '', image_url: '', documentation_url: '' 
  });
  
  const [formWO, setFormWO] = useState({
    id: '', asset_id: '', location: '', type: 'Correctivo', priority: 'Media',
    start_date: '', end_date: '', material_id: '', material_qty: 0, tech_id: '',
    authorized_by: '', status: 'Programado', description: '', project_filter: '', model_filter: ''
  });

  const [formItem, setFormItem] = useState({ id: '', part_code: '', name: '', stock_quantity: 0, min_stock_level: 5, unit_cost: 0, location_in_warehouse: '' });
  const [formUser, setFormUser] = useState({ id: '', employee_number: '', full_name: '', email: '', role: 'Tecnico' });

  const BASE_URL = 'http://localhost:3000/api';
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');

  // --- CARGA DINÁMICA DE LIBRERÍAS (SOLUCIÓN AL ERROR DE COMPILACIÓN) ---
  useEffect(() => {
    const scriptJsPDF = document.createElement('script');
    scriptJsPDF.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    scriptJsPDF.async = true;
    document.body.appendChild(scriptJsPDF);

    const scriptAutoTable = document.createElement('script');
    scriptAutoTable.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js";
    scriptAutoTable.async = true;
    document.body.appendChild(scriptAutoTable);

    return () => {
      document.body.removeChild(scriptJsPDF);
      document.body.removeChild(scriptAutoTable);
    };
  }, []);

  // --- CARGA INICIAL DE DATOS ---
  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.allSettled([fetchAssets(), fetchWorkOrders(), fetchInventory(), fetchUsers()]);
    setLoading(false);
  };

  // --- FETCHERS ---
  const fetchAssets = async () => {
    try {
      const res = await fetch(`${BASE_URL}/assets?search=${searchTerm}`);
      if(res.ok) { setDbAssets(await res.json()); setServerStatus('online'); }
    } catch(e) { setServerStatus('offline'); }
  };
  
  // Búsqueda funcional por Serial Number con retraso (Debounce)
  useEffect(() => {
    const timer = setTimeout(() => fetchAssets(), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchWorkOrders = async () => { const res = await fetch(`${BASE_URL}/work-orders`); if(res.ok) setDbWorkOrders(await res.json()); };
  const fetchInventory = async () => { const res = await fetch(`${BASE_URL}/inventory`); if(res.ok) setDbInventory(await res.json()); };
  const fetchUsers = async () => { const res = await fetch(`${BASE_URL}/users`); if(res.ok) setDbStaff(await res.json()); };

  // --- GENERACIÓN DE PDF PROFESIONAL ---
  const printOrderPDF = (ot) => {
    if (!window.jspdf) {
        alert("La librería de PDF aún se está cargando. Por favor, intente de nuevo en un segundo.");
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const primaryColor = [41, 128, 185]; 

    // Encabezado
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("ORDEN DE MANTENIMIENTO", 105, 20, null, null, "center");
    doc.setFontSize(10);
    doc.text(`ID: #${ot.wo_id} | EMISIÓN: ${new Date().toLocaleDateString()}`, 105, 30, null, null, "center");

    // Datos del Activo
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text("1. INFORMACIÓN TÉCNICA DEL EQUIPO", 14, 50);
    
    doc.autoTable({
        startY: 55,
        body: [
            ["Activo/Fixtura:", ot.fixture_name, "Serial Number:", ot.serial_number],
            ["Línea / Estación:", ot.location || 'N/A', "Tipo de Orden:", ot.maintenance_type],
            ["Nivel Prioridad:", ot.priority, "Estado Actual:", ot.status]
        ],
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 }
    });

    // Fechas y Responsables
    doc.setFontSize(12);
    doc.text("2. PROGRAMACIÓN Y PERSONAL", 14, doc.lastAutoTable.finalY + 10);
    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 15,
        head: [['FECHA INICIO', 'FECHA FINALIZACIÓN', 'TÉCNICO', 'AUTORIZÓ']],
        body: [[
          new Date(ot.scheduled_start).toLocaleDateString(), 
          new Date(ot.scheduled_end).toLocaleDateString(),
          ot.tech_name || 'Sin asignar',
          ot.authorized_by || 'Supervisor Pendiente'
        ]],
        theme: 'grid',
        headStyles: { fillColor: primaryColor }
    });

    // Materiales Utilizados
    doc.setFontSize(12);
    doc.text("3. REPUESTOS Y MATERIALES", 14, doc.lastAutoTable.finalY + 10);
    const materials = ot.materials_used ? ot.materials_used.split(',').map(m => [m.trim()]) : [["No se registraron materiales utilizados"]];
    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 15,
        head: [['DESCRIPCIÓN DEL REPUESTO']],
        body: materials,
        theme: 'striped',
        headStyles: { fillColor: [52, 73, 94] }
    });

    // Descripción del Trabajo
    doc.setFontSize(12);
    doc.text("4. DESCRIPCIÓN DEL TRABAJO", 14, doc.lastAutoTable.finalY + 10);
    doc.setFontSize(10);
    const splitDesc = doc.splitTextToSize(ot.title || ot.description || 'Sin descripción.', 180);
    doc.text(splitDesc, 14, doc.lastAutoTable.finalY + 17);

    // Firmas
    const footerY = 270;
    doc.line(20, footerY, 80, footerY);
    doc.text("FIRMA DEL TÉCNICO", 35, footerY + 5);
    doc.line(130, footerY, 190, footerY);
    doc.text("FIRMA DE AUTORIZACIÓN", 140, footerY + 5);

    doc.save(`OT_${ot.wo_id}_${ot.serial_number}.pdf`);
  };

  // --- API HANDLERS ---
  const apiRequest = async (url, method, body) => {
    try {
      const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if(res.ok) { setActiveModal(null); setIsEditing(false); loadAllData(); return true; }
      else { const err = await res.json(); alert('Error: ' + err.error); return false; }
    } catch(e) { alert('Error de conexión.'); return false; }
  };

  const handleSaveAsset = (e) => {
    e.preventDefault();
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${BASE_URL}/assets/${formAsset.id}` : `${BASE_URL}/assets`;
    apiRequest(url, method, formAsset);
  };

  const handleSaveWO = (e) => {
    e.preventDefault();
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${BASE_URL}/work-orders/${formWO.id}` : `${BASE_URL}/work-orders`;
    apiRequest(url, method, formWO);
  };

  const handleSaveItem = (e) => {
    e.preventDefault();
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${BASE_URL}/inventory/${formItem.id}` : `${BASE_URL}/inventory`;
    apiRequest(url, method, formItem);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${BASE_URL}/users/${formUser.id}` : `${BASE_URL}/users`;
    apiRequest(url, method, formUser);
  };

  // --- HELPERS CASCADA ---
  const getProjects = () => [...new Set(dbAssets.map(a => a.project_name))].filter(Boolean);
  const getModels = (p) => [...new Set(dbAssets.filter(a => !p || a.project_name === p).map(a => a.model_name))].filter(Boolean);
  const getFilteredAssets = (p, m) => dbAssets.filter(a => (!p || a.project_name === p) && (!m || a.model_name === m));

  // --- VISTAS ---

  const AssetsView = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-1/2">
           <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
           <input className="pl-12 border-slate-200 border rounded-xl py-2.5 text-sm w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
             placeholder="Búsqueda por Serial Number (Ej. M230...)" 
             value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => { setIsEditing(false); setFormAsset({ project_name: '', model_name: '', serial_number: '', fixture_name: '', production_line: '', station: '', description: '', image_url: '', documentation_url: '' }); setActiveModal('asset'); }} 
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl shadow-lg hover:bg-blue-700 flex items-center font-bold">
          <Plus className="w-5 h-5 mr-2"/> Registrar Activo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {dbAssets.map(a => (
           <div key={a.asset_id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 relative hover:shadow-md transition-all group">
              <div className="absolute top-5 right-5 hidden group-hover:flex gap-2">
                 <button onClick={() => { setFormAsset({...a, id: a.asset_id}); setIsEditing(true); setActiveModal('asset'); }} className="p-2 bg-slate-50 rounded-lg hover:bg-blue-50 text-blue-600"><Edit className="w-4 h-4"/></button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-3 rounded-2xl"><Box className="w-6 h-6 text-blue-600"/></div>
                <div>
                   <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{a.project_name}</span>
                   <h3 className="text-base font-bold text-slate-800">{a.fixture_name}</h3>
                </div>
              </div>
              <div className="space-y-2 border-t border-slate-50 pt-3">
                 <div className="flex justify-between text-xs"><span className="text-slate-400">SERIAL:</span><span className="font-mono font-bold text-blue-600">{a.serial_number}</span></div>
                 <div className="flex justify-between text-xs"><span className="text-slate-400">MODELO:</span><span className="font-semibold text-slate-700">{a.model_name}</span></div>
                 <div className="flex justify-between text-xs items-center">
                    <span className="text-slate-400">DOCS:</span>
                    {a.documentation_url ? <a href={a.documentation_url} target="_blank" className="text-green-600 text-[10px] font-black border border-green-200 px-2 rounded-full">VER PDF</a> : <span className="text-slate-300 italic">VACÍO</span>}
                 </div>
              </div>
           </div>
        ))}
      </div>
    </div>
  );

  const WorkOrdersView = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full overflow-hidden animate-in fade-in">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
        <h2 className="text-lg font-bold text-slate-800">Historial de Órdenes de Trabajo</h2>
        <button onClick={() => { setIsEditing(false); setFormWO({ asset_id: '', location: '', type: 'Correctivo', priority: 'Media', start_date: '', end_date: '', material_id: '', material_qty: 0, tech_id: '', authorized_by: '', status: 'Programado', project_filter: '', model_filter: '' }); setActiveModal('wo'); }} 
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 transition-all flex items-center">
          <FilePlus className="w-4 h-4 mr-2"/> Crear Orden
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-400 uppercase font-black border-b">
            <tr>
              <th className="px-5 py-4">ID</th>
              <th className="px-5 py-4">Activo / Serial</th>
              <th className="px-5 py-4">Ubicación</th>
              <th className="px-5 py-4">Inicio</th>
              <th className="px-5 py-4">Fin</th>
              <th className="px-5 py-4">Prioridad</th>
              <th className="px-5 py-4">Materiales</th>
              <th className="px-5 py-4">Técnico</th>
              <th className="px-5 py-4 text-center">Gestión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dbWorkOrders.map((ot) => (
              <tr key={ot.wo_id} className="hover:bg-blue-50/10 transition-colors">
                <td className="px-5 py-5 font-black text-blue-600">#{ot.wo_id}</td>
                <td className="px-5 py-5">
                   <div className="font-bold text-slate-800">{ot.fixture_name}</div>
                   <div className="text-slate-400 font-mono text-[10px]">{ot.serial_number}</div>
                </td>
                <td className="px-5 py-5 text-slate-500 font-medium">{ot.location || 'N/A'}</td>
                <td className="px-5 py-5 text-slate-700">{new Date(ot.scheduled_start).toLocaleDateString()}</td>
                <td className="px-5 py-5 text-slate-700">{new Date(ot.scheduled_end).toLocaleDateString()}</td>
                <td className="px-5 py-5">
                    <span className={`px-2 py-1 rounded-lg font-black text-[10px] ${ot.priority==='Critica'?'bg-red-50 text-red-600 border border-red-100':'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                        {ot.priority.toUpperCase()}
                    </span>
                </td>
                <td className="px-5 py-5 text-slate-400 italic max-w-[120px] truncate">{ot.materials_used || 'Ninguno'}</td>
                <td className="px-5 py-5 text-slate-800 font-bold">{ot.tech_name || '---'}</td>
                <td className="px-5 py-5 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => { setFormWO({...ot, id: ot.wo_id, start_date: ot.scheduled_start?.split('T')[0], end_date: ot.scheduled_end?.split('T')[0]}); setIsEditing(true); setActiveModal('wo'); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Edit className="w-3.5 h-3.5"/></button>
                    <button onClick={() => printOrderPDF(ot)} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-800 hover:text-white transition-all"><Printer className="w-3.5 h-3.5"/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const TeamView = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Equipo de Mantenimiento</h2>
        <button onClick={() => { setIsEditing(false); setFormUser({ employee_number: '', full_name: '', email: '', role: 'Tecnico' }); setActiveModal('user'); }} 
          className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold shadow-lg hover:bg-blue-700 flex items-center">
          <UserPlus className="w-5 h-5 mr-2"/> Nuevo Integrante
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dbStaff.filter(s => s.role !== 'Administrador').map(s => (
          <div key={s.user_id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col relative group">
            <button onClick={() => { setFormUser({...s, id: s.user_id}); setIsEditing(true); setActiveModal('user'); }} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"><Edit className="w-4 h-4"/></button>
            <div className="flex items-center gap-4 mb-6">
               <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg">
                  {s.full_name.charAt(0)}
               </div>
               <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{s.full_name}</h3>
                  <p className="text-xs text-slate-400 font-medium">{s.email}</p>
               </div>
            </div>
            <div className="flex justify-between items-center border-t border-slate-50 pt-4">
               <div>
                  <span className="text-[10px] font-black text-slate-300 uppercase block mb-1">Actividades</span>
                  <div className="flex items-center">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black mr-2 ${s.active_tasks > 0 ? 'bg-orange-100 text-orange-600 animate-pulse' : 'bg-green-100 text-green-600'}`}>
                        {s.active_tasks || 0}
                     </div>
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Pendientes</span>
                  </div>
               </div>
               <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">{s.role}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 font-sans text-slate-800 h-screen flex overflow-hidden">
      {/* SIDEBAR */}
      <aside className={`bg-white w-72 flex-shrink-0 border-r border-slate-200 flex flex-col transition-transform duration-300 absolute z-30 h-full md:relative ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-20 flex items-center px-8 border-b border-slate-100">
          <div className="bg-blue-600 p-2 rounded-xl mr-3"><Wrench className="text-white w-6 h-6" /></div>
          <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">PME CMMS</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <NavButton icon={<LayoutDashboard />} label="Dashboard" view="dashboard" current={currentView} set={setCurrentView} />
          <NavButton icon={<Box />} label="Activos" view="assets" current={currentView} set={setCurrentView} />
          <NavButton icon={<ClipboardList />} label="Órdenes Trabajo" view="workorders" current={currentView} set={setCurrentView} />
          <NavButton icon={<Package />} label="Inventario" view="inventory" current={currentView} set={setCurrentView} />
          <NavButton icon={<BookOpen />} label="Bitácora" view="bitacora" current={currentView} set={setCurrentView} />
          <NavButton icon={<Users />} label="Equipo" view="team" current={currentView} set={setCurrentView} />
          <NavButton icon={<CheckSquare />} label="Checklist" view="checklist" current={currentView} set={setCurrentView} />
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 flex-shrink-0 z-10">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 mr-3 bg-slate-50 rounded-lg text-slate-600"><Menu className="w-6 h-6"/></button>
            <h1 className="text-xl font-bold text-slate-800 capitalize tracking-tight">{currentView === 'workorders' ? 'Gestión de Órdenes' : currentView === 'team' ? 'Nuestro Equipo' : currentView}</h1>
          </div>
          <div className={`px-4 py-2 rounded-full text-[10px] font-black flex items-center gap-2 ${serverStatus === 'online' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              <div className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`}></div>
              SISTEMA {serverStatus.toUpperCase()}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8 bg-slate-50 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
               <Activity className="w-12 h-12 animate-spin mb-4"/>
               <span className="font-black uppercase tracking-widest text-xs">Sincronizando Base de Datos...</span>
            </div>
          ) : (
            <>
              {currentView === 'assets' && <AssetsView />}
              {currentView === 'workorders' && <WorkOrdersView />}
              {currentView === 'team' && <TeamView />}
              {currentView === 'inventory' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-slate-800">Control de Inventario</h2><button onClick={() => { setIsEditing(false); setFormItem({ part_code: '', name: '', stock_quantity: 0, min_stock_level: 5, unit_cost: 0, location_in_warehouse: '' }); setActiveModal('item'); }} className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold">Agregar Repuesto</button></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {dbInventory.map(i => (
                            <div key={i.item_id} className="bg-white p-6 rounded-3xl border border-slate-200 relative group">
                                <button onClick={() => { setFormItem({...i, id: i.item_id}); setIsEditing(true); setActiveModal('item'); }} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"><Edit className="w-4 h-4"/></button>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{i.part_code}</span>
                                <h3 className="font-bold text-slate-800 text-lg mb-4 leading-tight">{i.name}</h3>
                                <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                                    <div><p className="text-[10px] text-slate-400 font-bold uppercase mb-1">En Stock</p><div className={`text-2xl font-black ${i.stock_quantity <= i.min_stock_level ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>{i.stock_quantity}</div></div>
                                    <div className="text-right text-xs font-bold text-slate-400 uppercase tracking-tighter">{i.location_in_warehouse}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              )}
              {currentView === 'dashboard' && <div className="text-center py-20 text-slate-300 font-black italic opacity-50 uppercase tracking-widest">Dashboard V3 en desarrollo...</div>}
              {currentView === 'bitacora' && <div className="text-center py-20 text-slate-300 font-black italic opacity-50 uppercase tracking-widest">Módulo de Bitácora próximamente...</div>}
              {currentView === 'checklist' && <div className="text-center py-20 text-slate-300 font-black italic opacity-50 uppercase tracking-widest">Módulo de Checklist próximamente...</div>}
            </>
          )}
        </main>
      </div>

      {/* --- MODALES CON FORMULARIOS MEJORADOS --- */}

      {/* MODAL ACTIVO */}
      {activeModal === 'asset' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl p-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4">
               <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">{isEditing ? 'Editar Activo' : 'Nuevo Registro de Activo'}</h3>
               <button onClick={()=>setActiveModal(null)} className="p-3 bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-all"><X/></button>
            </div>
            <form onSubmit={handleSaveAsset} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1"><label className="text-[11px] font-black text-blue-600 uppercase tracking-widest">Nombre del Proyecto</label><input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600 transition-all" placeholder="Ej. Monica" value={formAsset.project_name} onChange={e=>setFormAsset({...formAsset, project_name:e.target.value})}/></div>
                 <div className="space-y-1"><label className="text-[11px] font-black text-blue-600 uppercase tracking-widest">Modelo Técnico</label><input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600 transition-all" placeholder="Ej. A2030" value={formAsset.model_name} onChange={e=>setFormAsset({...formAsset, model_name:e.target.value})}/></div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Serial Number</label><input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-600 transition-all" placeholder="Ej. M23007E0..." value={formAsset.serial_number} onChange={e=>setFormAsset({...formAsset, serial_number:e.target.value})}/></div>
                 <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nombre Fixtura/Equipo</label><input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600 transition-all" placeholder="Ej. Prensa Neumática" value={formAsset.fixture_name} onChange={e=>setFormAsset({...formAsset, fixture_name:e.target.value})}/></div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Link de Fotografía</label><input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs" placeholder="Ej. http://imgur.com/foto.jpg" value={formAsset.image_url} onChange={e=>setFormAsset({...formAsset, image_url:e.target.value})}/></div>
                 <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Link Manual/PDF</label><input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs" placeholder="Ej. http://docs.com/manual.pdf" value={formAsset.documentation_url} onChange={e=>setFormAsset({...formAsset, documentation_url:e.target.value})}/></div>
               </div>
               <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Descripción / Especificaciones</label><textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm h-24 outline-none focus:ring-2 focus:ring-blue-600 transition-all" placeholder="Detalles de mantenimiento o uso..." value={formAsset.description} onChange={e=>setFormAsset({...formAsset, description:e.target.value})}/></div>
               <button className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98]">Confirmar Guardado</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ORDEN DE TRABAJO */}
      {activeModal === 'wo' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl p-10 my-8">
            <h3 className="text-2xl font-black text-slate-800 mb-8 uppercase tracking-tighter">{isEditing ? 'Editar Actividad' : 'Nueva Orden de Mantenimiento'}</h3>
            <form onSubmit={handleSaveWO} className="space-y-5">
               
               {!isEditing && (
                 <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-blue-400 uppercase">1. Filtrar Proyecto</label>
                          <select className="w-full border rounded-xl p-2.5 text-xs font-bold" value={formWO.project_filter} onChange={e=>setFormWO({...formWO, project_filter:e.target.value, model_filter: '', asset_id: ''})}>
                             <option value="">-- Todos --</option>
                             {getProjects().map(p=><option key={p} value={p}>{p}</option>)}
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-blue-400 uppercase">2. Filtrar Modelo</label>
                          <select className="w-full border rounded-xl p-2.5 text-xs font-bold" value={formWO.model_filter} onChange={e=>setFormWO({...formWO, model_filter:e.target.value, asset_id: ''})}>
                             <option value="">-- Todos --</option>
                             {getModels(formWO.project_filter).map(m=><option key={m} value={m}>{m}</option>)}
                          </select>
                       </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">3. Seleccionar Activo</label>
                        <select required className="w-full bg-white border border-blue-200 rounded-xl p-3 text-sm font-black text-blue-700" value={formWO.asset_id} onChange={e=>setFormWO({...formWO, asset_id:e.target.value})}>
                            <option value="">-- Seleccionar Fixtura/Equipo --</option>
                            {getFilteredAssets(formWO.project_filter, formWO.model_filter).map(a=><option key={a.asset_id} value={a.asset_id}>{a.serial_number} - {a.fixture_name}</option>)}
                        </select>
                    </div>
                 </div>
               )}

               <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase">Ubicación (Línea/Estación)</label><input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" placeholder="Ej. L1 - Est 4" value={formWO.location} onChange={e=>setFormWO({...formWO, location:e.target.value})}/></div>
                  <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase">Tipo Trabajo</label><select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" value={formWO.type} onChange={e=>setFormWO({...formWO, type:e.target.value})}><option>Correctivo</option><option>Preventivo</option></select></div>
               </div>

               <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase">Fecha Inicio</label><input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" value={formWO.start_date} onChange={e=>setFormWO({...formWO, start_date:e.target.value})}/></div>
                  <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase">Fecha Fin</label><input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" value={formWO.end_date} onChange={e=>setFormWO({...formWO, end_date:e.target.value})}/></div>
               </div>

               <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase">Prioridad</label><select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" value={formWO.priority} onChange={e=>setFormWO({...formWO, priority:e.target.value})}><option>Baja</option><option>Media</option><option>Alta</option><option>Critica</option></select></div>
                  <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase">Autorizado por</label><input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" placeholder="Nombre de Ingeniero" value={formWO.authorized_by} onChange={e=>setFormWO({...formWO, authorized_by:e.target.value})}/></div>
               </div>

               <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 space-y-2">
                  <label className="text-[11px] font-black text-orange-600 uppercase">Material / Repuesto (Descuento Automático)</label>
                  <div className="flex gap-2">
                     <select className="flex-1 border rounded-xl p-3 text-sm font-bold" value={formWO.material_id} onChange={e=>setFormWO({...formWO, material_id:e.target.value})}>
                        <option value="">-- Seleccionar Repuesto --</option>
                        {dbInventory.map(i=><option key={i.item_id} value={i.item_id}>{i.name} (Stock: {i.stock_quantity})</option>)}
                     </select>
                     <input type="number" className="w-24 border rounded-xl p-3 text-sm font-bold text-center" placeholder="Cant." value={formWO.material_qty} onChange={e=>setFormWO({...formWO, material_qty:e.target.value})}/>
                  </div>
               </div>

               <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Técnico Asignado</label><select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-black" value={formWO.tech_id} onChange={e=>setFormWO({...formWO, tech_id:e.target.value})}><option value="">-- Seleccionar Técnico --</option>{dbStaff.map(s=><option key={s.user_id} value={s.user_id}>{s.full_name}</option>)}</select></div>

               <button className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase shadow-xl hover:bg-blue-700 transition-all">Guardar Actividad</button>
               <button type="button" onClick={()=>setActiveModal(null)} className="w-full text-slate-400 text-[10px] font-black uppercase py-2">Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INVENTARIO */}
      {activeModal === 'item' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10">
            <h3 className="text-2xl font-black text-slate-800 mb-8 uppercase tracking-tighter">{isEditing ? 'Editar Repuesto' : 'Nuevo Repuesto'}</h3>
            <form onSubmit={handleSaveItem} className="space-y-5">
               <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase">Código de Parte (ID)</label><input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-600" value={formItem.part_code} onChange={e=>setFormItem({...formItem, part_code:e.target.value})}/></div>
               <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase">Nombre del Material</label><input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600" value={formItem.name} onChange={e=>setFormItem({...formItem, name:e.target.value})}/></div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase">Cantidad</label><input type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" value={formItem.stock_quantity} onChange={e=>setFormItem({...formItem, stock_quantity:e.target.value})}/></div>
                 <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase">Cant. Mínima</label><input type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" value={formItem.min_stock_level} onChange={e=>setFormItem({...formItem, min_stock_level:e.target.value})}/></div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase">Costo Unitario ($)</label><input type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" value={formItem.unit_cost} onChange={e=>setFormItem({...formItem, unit_cost:e.target.value})}/></div>
                 <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase">Ubicación</label><input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" placeholder="Ej. Bin A-2" value={formItem.location_in_warehouse} onChange={e=>setFormItem({...formItem, location_in_warehouse:e.target.value})}/></div>
               </div>
               <button className="w-full bg-slate-800 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl">Confirmar Registro</button>
               <button type="button" onClick={()=>setActiveModal(null)} className="w-full text-slate-400 text-xs font-black uppercase py-2">Cerrar</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL USUARIO */}
      {activeModal === 'user' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10">
            <h3 className="text-2xl font-black text-slate-800 mb-8 uppercase tracking-tighter">{isEditing ? 'Editar Integrante' : 'Nuevo Integrante'}</h3>
            <form onSubmit={handleSaveUser} className="space-y-5">
               <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase"># Empleado</label><input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-black outline-none focus:ring-2 focus:ring-blue-600" value={formUser.employee_number} onChange={e=>setFormUser({...formUser, employee_number:e.target.value})}/></div>
               <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase">Nombre Completo</label><input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600" value={formUser.full_name} onChange={e=>setFormUser({...formUser, full_name:e.target.value})}/></div>
               <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase">Email</label><input type="email" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600" value={formUser.email} onChange={e=>setFormUser({...formUser, email:e.target.value})}/></div>
               <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase">Rol de Trabajo</label><select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" value={formUser.role} onChange={e=>setFormUser({...formUser, role:e.target.value})}><option>Tecnico</option><option>Ingeniero</option><option>Supervisor</option></select></div>
               <button className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl">Registrar</button>
               <button type="button" onClick={()=>setActiveModal(null)} className="w-full text-slate-400 text-xs font-black uppercase py-2">Cancelar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // --- SUBMÓDULOS API (HANDLERS) ---
  async function handleSaveAsset(e) { e.preventDefault(); const method = isEditing ? 'PUT' : 'POST'; const url = isEditing ? `${BASE_URL}/assets/${formAsset.id}` : `${BASE_URL}/assets`; await apiRequest(url, method, formAsset); }
  async function handleSaveWO(e) { e.preventDefault(); const method = isEditing ? 'PUT' : 'POST'; const url = isEditing ? `${BASE_URL}/work-orders/${formWO.id}` : `${BASE_URL}/work-orders`; await apiRequest(url, method, formWO); }
  async function handleSaveItem(e) { e.preventDefault(); const method = isEditing ? 'PUT' : 'POST'; const url = isEditing ? `${BASE_URL}/inventory/${formItem.id}` : `${BASE_URL}/inventory`; await apiRequest(url, method, formItem); }
  async function handleSaveUser(e) { e.preventDefault(); const method = isEditing ? 'PUT' : 'POST'; const url = isEditing ? `${BASE_URL}/users/${formUser.id}` : `${BASE_URL}/users`; await apiRequest(url, method, formUser); }
}

// --- COMPONENTES DE NAVEGACIÓN ---
const NavButton = ({ icon, label, view, current, set }) => (
  <button onClick={() => set(view)} className={`w-full flex items-center px-6 py-4 text-sm font-bold transition-all rounded-2xl group ${current === view ? 'text-blue-700 bg-blue-50/50' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}>
    <span className={`mr-4 transition-transform group-hover:scale-110 ${current === view ? 'text-blue-600' : 'text-slate-300'}`}>{icon}</span>
    {label}
    {current === view && <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full shadow-sm"></div>}
  </button>
);