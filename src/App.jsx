import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wrench, LayoutDashboard, ClipboardList, Box, 
  Package, CheckSquare, Users, Menu, X, Plus, 
  Search, Activity, Clock, Hammer, DollarSign,
  Wifi, WifiOff, Edit, Printer, FileText, Filter, Trash2, Eye,
  CheckCircle, AlertCircle, FilePlus, UserPlus, Image as ImageIcon,
  BookOpen, ChevronRight, HardHat, Info, Upload, File as FileIcon,
  Phone, ListTodo, History
} from 'lucide-react';

export default function App() {
  // --- ESTADOS UI ---
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); 
  const [isEditing, setIsEditing] = useState(false); 
  
  // Estado para el Modal de Historial Técnico
  const [techHistoryModal, setTechHistoryModal] = useState({ show: false, tech: null, type: 'pending' });

  // --- ESTADOS DE DATOS ---
  const [dbAssets, setDbAssets] = useState([]);      
  const [dbWorkOrders, setDbWorkOrders] = useState([]); 
  const [dbInventory, setDbInventory] = useState([]);
  const [dbStaff, setDbStaff] = useState([]); 
  
  // --- ESTADOS DE FILTRADO (ACTIVOS) ---
  const [searchTerm, setSearchTerm] = useState(''); 
  const [projectFilter, setProjectFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');

  // --- FORMULARIOS ---
  const initialAsset = { 
    id: '', project_name: '', model_name: '', serial_number: '', fixture_name: '', 
    production_line: '', station: '', description: '', condition_status: 'Activo',
    image_file: null, doc_file: null 
  };
  const initialWO = { 
    id: '', asset_id: '', location: '', type: 'Correctivo', priority: 'Media', 
    start_date: '', end_date: '', material_id: '', material_qty: 0, tech_id: '', 
    authorized_by: '', status: 'Programado', description: '', 
    project_filter: '', model_filter: '',
    fixture_name: '', serial_number: ''
  };
  const initialItem = { id: '', part_code: '', name: '', stock_quantity: 0, min_stock_level: 5, unit_cost: 0, location_in_warehouse: '' };
  const initialUser = { id: '', employee_number: '', full_name: '', email: '', phone_number: '', role: 'Tecnico' };

  const [formAsset, setFormAsset] = useState(initialAsset);
  const [formWO, setFormWO] = useState(initialWO);
  const [formItem, setFormItem] = useState(initialItem);
  const [formUser, setFormUser] = useState(initialUser);

  const BASE_URL = 'http://localhost:3000/api';
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');

  // --- ESTILOS ESTANDARIZADOS (MEJORADOS PARA VISIBILIDAD MÓVIL) ---
  const UI = {
    modalOverlay: "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto",
    modalBox: "bg-white rounded-[2.5rem] shadow-2xl w-full p-8 sm:p-10 my-8 transition-all relative overflow-hidden",
    modalHeader: "text-2xl font-black text-slate-800 mb-8 uppercase tracking-tighter border-b border-slate-100 pb-4 flex justify-between items-center",
    // CAMBIO: Color más oscuro (text-slate-700) y tamaño estándar (text-xs) para mejor lectura
    label: "text-xs font-black text-slate-700 uppercase tracking-widest mb-2 block",
    input: "w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-300",
    select: "w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none",
    btnPrimary: "w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all active:scale-[0.98]",
    btnSecondary: "w-full bg-slate-100 text-slate-400 py-3 rounded-xl font-bold uppercase tracking-wide hover:bg-slate-200 hover:text-slate-600 transition-all",
    closeBtn: "p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
  };

  // --- CARGA DINÁMICA DE LIBRERÍAS PDF ---
  useEffect(() => {
    if (!document.getElementById('jspdf-script')) {
      const s1 = document.createElement('script');
      s1.id = 'jspdf-script';
      s1.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      document.body.appendChild(s1);
      
      s1.onload = () => {
          const s2 = document.createElement('script');
          s2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js";
          document.body.appendChild(s2);
      };
    }
  }, []);

  // --- CARGA INICIAL ---
  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.allSettled([fetchAssets(), fetchWorkOrders(), fetchInventory(), fetchUsers()]);
    setLoading(false);
  };

  // --- FETCHERS ---
  const fetchAssets = async () => {
    try {
      const res = await fetch(`${BASE_URL}/assets`);
      if(res.ok) { setDbAssets(await res.json()); setServerStatus('online'); }
    } catch(e) { setServerStatus('offline'); }
  };

  const fetchWorkOrders = async () => { 
    try { 
      const res = await fetch(`${BASE_URL}/work-orders`); 
      if(res.ok) {
        const data = await res.json();
        data.sort((a, b) => a.wo_id - b.wo_id); 
        setDbWorkOrders(data); 
      }
    } catch(e){} 
  };
  const fetchInventory = async () => { try { const res = await fetch(`${BASE_URL}/inventory`); if(res.ok) setDbInventory(await res.json()); } catch(e){} };
  const fetchUsers = async () => { try { const res = await fetch(`${BASE_URL}/users`); if(res.ok) setDbStaff(await res.json()); } catch(e){} };

  // --- HELPERS ---
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const d = new Date(dateString);
        return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
    } catch (e) { return '-'; }
  };

  // --- LÓGICA DE FILTRADO ---
  const uniqueProjects = useMemo(() => [...new Set(dbAssets.map(a => a.project_name))].filter(Boolean), [dbAssets]);
  
  const availableModels = useMemo(() => {
    const assets = projectFilter ? dbAssets.filter(a => a.project_name === projectFilter) : dbAssets;
    return [...new Set(assets.map(a => a.model_name))].filter(Boolean);
  }, [dbAssets, projectFilter]);

  const filteredAssets = useMemo(() => {
    return dbAssets.filter(asset => {
      const matchSearch = asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
      const matchProject = projectFilter ? asset.project_name === projectFilter : true;
      const matchModel = modelFilter ? asset.model_name === modelFilter : true;
      return matchSearch && matchProject && matchModel;
    });
  }, [dbAssets, searchTerm, projectFilter, modelFilter]);

  useEffect(() => { setModelFilter(''); }, [projectFilter]);

  const getProjectsForModal = () => [...new Set(dbAssets.map(a => a.project_name))].filter(Boolean);
  const getModelsForModal = (p) => {
     const assets = p ? dbAssets.filter(a => a.project_name === p) : dbAssets;
     return [...new Set(assets.map(a => a.model_name))].filter(Boolean);
  };
  const getAssetsForModal = (p, m) => dbAssets.filter(a => (!p || a.project_name === p) && (!m || a.model_name === m));

  // --- FUNCIONES HISTORIAL TÉCNICO ---
  const openTechHistory = (tech, type) => {
    fetchWorkOrders().then(() => setTechHistoryModal({ show: true, tech, type }));
  };

  const closeTechHistory = () => {
    setTechHistoryModal({ show: false, tech: null, type: 'pending' });
  };

  const handleUpdateStatusFromTable = async (woId, newStatus) => {
    const originalWO = dbWorkOrders.find(w => w.wo_id === woId);
    if (!originalWO) return;
    const payload = {
        description: originalWO.title || originalWO.description,
        priority: originalWO.priority,
        status: newStatus,
        authorized_by: originalWO.authorized_by,
        location: originalWO.location,
        scheduled_start: originalWO.scheduled_start,
        scheduled_end: originalWO.scheduled_end,
        assigned_user_id: originalWO.assigned_user_id
    };
    try {
        const res = await fetch(`${BASE_URL}/work-orders/${woId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) { fetchWorkOrders(); fetchUsers(); alert(`Estado actualizado a: ${newStatus}`); } 
        else { alert('Error al actualizar estado'); }
    } catch (e) { alert('Error de conexión'); }
  };

  // --- GENERACIÓN PDF ---
  const printOrderPDF = (ot) => {
    if (!window.jspdf || !window.jspdf.jsPDF) return alert("Motor de PDF cargando...");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const blue = [41, 128, 185];

    doc.setFillColor(...blue);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255);
    doc.setFontSize(22);
    doc.text("ORDEN DE MANTENIMIENTO", 105, 20, null, null, "center");
    doc.setFontSize(10);
    doc.text(`FOLIO: OT-${ot.wo_id} | FECHA: ${new Date().toLocaleDateString()}`, 105, 30, null, null, "center");

    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text("1. DATOS DEL EQUIPO", 14, 50);
    doc.autoTable({
        startY: 55,
        body: [
            ["Activo:", ot.fixture_name, "S/N:", ot.serial_number],
            ["Ubicación:", ot.location || 'N/A', "Tipo:", ot.maintenance_type],
            ["Prioridad:", ot.priority, "Estado:", ot.status]
        ],
        theme: 'plain', styles: { fontSize: 9 }
    });

    doc.text("2. DETALLE DE ACTIVIDAD", 14, doc.lastAutoTable.finalY + 10);
    const splitDesc = doc.splitTextToSize(ot.title || ot.description || 'Sin descripción.', 180);
    doc.text(splitDesc, 14, doc.lastAutoTable.finalY + 17);

    let nextY = doc.lastAutoTable.finalY + 20 + (splitDesc.length * 5);

    doc.text("3. PROGRAMACIÓN", 14, nextY);
    doc.autoTable({
        startY: nextY + 5,
        head: [['INICIO', 'FIN', 'TÉCNICO', 'AUTORIZÓ']],
        body: [[formatDate(ot.scheduled_start), formatDate(ot.scheduled_end), ot.tech_name || 'N/A', ot.authorized_by || 'N/A']],
        theme: 'grid', headStyles: { fillColor: blue }
    });

    doc.text("4. MATERIALES", 14, doc.lastAutoTable.finalY + 10);
    const matList = ot.materials_used ? ot.materials_used.split(',').map(m => [m.trim()]) : [['Ninguno']];
    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 15,
        head: [['MATERIAL / CANTIDAD']],
        body: matList,
        theme: 'striped', headStyles: { fillColor: [50, 50, 50] }
    });

    const finalY = doc.lastAutoTable.finalY + 30;
    doc.line(20, finalY, 80, finalY);
    doc.text("FIRMA TÉCNICO", 35, finalY + 5);
    doc.line(130, finalY, 190, finalY);
    doc.text("FIRMA SUPERVISOR", 145, finalY + 5);

    doc.save(`OT-${ot.wo_id}.pdf`);
  };

  // --- API HANDLER ---
  const apiRequest = async (url, method, body) => {
    try {
      const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const data = await res.json();
      if(res.ok) { setActiveModal(null); setIsEditing(false); loadAllData(); alert('Guardado correctamente.'); } 
      else { alert('Error: ' + (data.error || 'Error desconocido')); }
    } catch(e) { alert('Error de conexión con el servidor.'); }
  };

  // --- HANDLERS ---
  const handleSaveAsset = (e) => {
    e.preventDefault();
    const url = isEditing ? `${BASE_URL}/assets/${formAsset.id}` : `${BASE_URL}/assets`;
    const payload = { ...formAsset }; delete payload.image_file; delete payload.doc_file;
    apiRequest(url, isEditing ? 'PUT' : 'POST', payload);
  };

  const handleSaveWO = (e) => {
    e.preventDefault();
    if (!formWO.asset_id && !isEditing) return alert("Seleccione un activo.");
    const url = isEditing ? `${BASE_URL}/work-orders/${formWO.id}` : `${BASE_URL}/work-orders`;
    const payload = {
        asset_id: formWO.asset_id,
        maintenance_type: formWO.type,
        priority: formWO.priority,
        description: formWO.description || `Mantenimiento ${formWO.type}`,
        assigned_user_id: formWO.tech_id || null,
        material_id: formWO.material_id || null,
        material_qty: parseInt(formWO.material_qty) || 0,
        location: formWO.location,
        scheduled_start: formWO.start_date || null,
        scheduled_end: formWO.end_date || null,
        authorized_by: formWO.authorized_by,
        status: formWO.status
    };
    apiRequest(url, isEditing ? 'PUT' : 'POST', payload);
  };

  const handleSaveItem = (e) => {
    e.preventDefault();
    const url = isEditing ? `${BASE_URL}/inventory/${formItem.id}` : `${BASE_URL}/inventory`;
    apiRequest(url, isEditing ? 'PUT' : 'POST', formItem);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    const url = isEditing ? `${BASE_URL}/users/${formUser.id}` : `${BASE_URL}/users`;
    apiRequest(url, isEditing ? 'PUT' : 'POST', formUser);
  };

  // --- VISTAS ---

  const renderAssetsView = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="space-y-1">
          <label className={UI.label}>Filtrar Proyecto</label>
          <select className={UI.select} value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
            <option value="">-- Todos --</option>
            {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className={UI.label}>Filtrar Modelo</label>
          <select className={UI.select} value={modelFilter} onChange={e => setModelFilter(e.target.value)}>
            <option value="">-- Todos --</option>
            {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className={UI.label}>Buscar Serial</label>
          <div className="relative">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            <input className={`${UI.input} pl-9`} placeholder="..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <button onClick={() => { setIsEditing(false); setFormAsset(initialAsset); setActiveModal('asset'); }} className={UI.btnPrimary}><Plus className="w-5 h-5 mr-2 inline"/> Nuevo</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAssets.map(a => (
           <div key={a.asset_id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 relative hover:shadow-md group transition-all">
              <button onClick={() => { setFormAsset({...a, id: a.asset_id}); setIsEditing(true); setActiveModal('asset'); }} className="absolute top-5 right-5 p-2 bg-slate-50 rounded-lg text-blue-600 hidden group-hover:block"><Edit className="w-4 h-4"/></button>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-3 rounded-2xl"><Box className="w-6 h-6 text-blue-600"/></div>
                <div><span className="text-[10px] uppercase font-black text-slate-400">{a.project_name}</span><h3 className="text-base font-bold text-slate-800">{a.fixture_name}</h3></div>
              </div>
              <div className="space-y-2 border-t pt-3">
                 <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold">SERIAL:</span><span className="font-mono font-bold text-blue-600">{a.serial_number}</span></div>
                 <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold">MODELO:</span><span className="font-semibold text-slate-700">{a.model_name}</span></div>
                 <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold">ESTADO:</span><span className={`font-black text-[10px] px-2 rounded-full ${a.condition_status === 'Activo' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>{a.condition_status || 'ACTIVO'}</span></div>
              </div>
           </div>
        ))}
      </div>
    </div>
  );

  const renderWorkOrdersView = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full overflow-hidden animate-in fade-in">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
        <h2 className="text-lg font-bold text-slate-800">Órdenes de Trabajo</h2>
        <button onClick={() => { setIsEditing(false); setFormWO(initialWO); setActiveModal('wo'); }} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 flex items-center"><FilePlus className="w-4 h-4 mr-2"/> Crear Orden</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase font-black border-b tracking-widest">
            <tr>
                <th className="px-5 py-4">OT #</th>
                <th className="px-5 py-4">Activo / Serial</th>
                <th className="px-5 py-4">Ubicación</th>
                <th className="px-5 py-4">Programación</th>
                <th className="px-5 py-4">Actividad</th>
                <th className="px-4 py-4 text-center">Prioridad</th>
                <th className="px-5 py-4">Materiales</th>
                <th className="px-5 py-4">Técnico</th>
                <th className="px-5 py-4 text-center">Estado</th>
                <th className="px-5 py-4 text-center">Gestión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {dbWorkOrders.map((ot) => (
              <tr key={ot.wo_id} className="hover:bg-blue-50/10 transition-colors">
                <td className="px-5 py-5 font-black text-blue-600">#{ot.wo_id}</td>
                <td className="px-5 py-5">
                   <div className="font-bold text-slate-800">{ot.fixture_name || 'Desconocido'}</div>
                   <div className="text-slate-400 font-mono text-[10px]">{ot.serial_number || 'N/A'}</div>
                </td>
                <td className="px-5 py-5 text-slate-500">{ot.location || 'N/A'}</td>
                <td className="px-5 py-5">
                  <div className="text-slate-700 font-bold">{formatDate(ot.scheduled_start)}</div>
                  <div className="text-[10px] text-slate-400 italic">Fin: {formatDate(ot.scheduled_end)}</div>
                </td>
                <td className="px-5 py-5 text-slate-600 max-w-xs truncate" title={ot.title || ot.description}>{ot.title || ot.description}</td>
                <td className="px-4 py-5 text-center">
                    <span className={`px-2 py-1 rounded-lg font-black text-[10px] ${ot.priority==='Critica'?'bg-red-50 text-red-600 border border-red-100':'bg-blue-50 text-blue-600 border border-blue-100'}`}>{ot.priority ? ot.priority.toUpperCase() : 'MEDIA'}</span>
                </td>
                <td className="px-5 py-5 text-slate-500 italic max-w-[150px] truncate">{ot.materials_used || 'Ninguno'}</td>
                <td className="px-5 py-5 text-slate-800 font-bold">{ot.tech_name || 'Sin asignar'}</td>
                <td className="px-5 py-5 text-center">
                   <span className={`px-2 py-1 rounded-full font-bold text-[10px] uppercase border ${ot.status === 'Programado' ? 'bg-gray-100 text-black border-gray-300' : ot.status === 'Reprogramado' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ot.status === 'Completado' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>{ot.status}</span>
                </td>
                <td className="px-5 py-5 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => { 
                        setFormWO({
                          ...ot, 
                          id: ot.wo_id, 
                          start_date: ot.scheduled_start?.split('T')[0], 
                          end_date: ot.scheduled_end?.split('T')[0],
                          description: ot.title || ot.description,
                          fixture_name: ot.fixture_name,
                          serial_number: ot.serial_number,
                          tech_id: ot.assigned_user_id 
                        }); 
                        setIsEditing(true); 
                        setActiveModal('wo'); 
                    }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Edit className="w-3.5 h-3.5"/></button>
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

  const renderInventoryView = () => (
    <div className="space-y-6">
        <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-slate-800">Almacén</h2><button onClick={() => { setIsEditing(false); setFormItem(initialItem); setActiveModal('item'); }} className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold shadow-lg hover:bg-blue-700">Nuevo Ítem</button></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dbInventory.map(i => (
                <div key={i.item_id} className="bg-white p-6 rounded-3xl border border-slate-200 relative group hover:shadow-md transition-all">
                    <button onClick={() => { setFormItem({...i, id: i.item_id}); setIsEditing(true); setActiveModal('item'); }} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"><Edit className="w-4 h-4"/></button>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{i.part_code}</span>
                    <h3 className="font-bold text-slate-800 mb-4">{i.name}</h3>
                    <div className="flex justify-between border-t pt-4"><div><p className="text-[10px] text-slate-400 font-bold uppercase">Stock</p><div className={`text-2xl font-black ${i.stock_quantity <= i.min_stock_level ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>{i.stock_quantity}</div></div><div className="text-right text-xs font-bold text-slate-400 uppercase">{i.location_in_warehouse}</div></div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderTeamView = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-slate-800">Equipo</h2><button onClick={() => { setIsEditing(false); setFormUser(initialUser); setActiveModal('user'); }} className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold shadow-lg hover:bg-blue-700"><UserPlus className="w-5 h-5 mr-2"/> Registrar</button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dbStaff.filter(s => s.role !== 'Administrador').map(s => (
          <div key={s.user_id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col relative group hover:shadow-md">
            <button onClick={() => { setFormUser({...s, id: s.user_id}); setIsEditing(true); setActiveModal('user'); }} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"><Edit className="w-4 h-4"/></button>
            <div className="flex items-center gap-4 mb-4">
               <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg">{s.full_name.charAt(0)}</div>
               <div><h3 className="font-bold text-slate-800 text-lg">{s.full_name}</h3><p className="text-xs text-slate-400 font-medium">{s.email}</p><p className="text-xs text-slate-500 font-medium flex items-center mt-1"><Phone className="w-3 h-3 mr-1"/> {s.phone_number || 'N/A'}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
               <button onClick={() => openTechHistory(s, 'pending')} className="flex items-center justify-center bg-orange-50 text-orange-600 text-xs font-bold py-2 rounded-xl hover:bg-orange-100 border border-orange-200"><ListTodo className="w-3 h-3 mr-2"/> Pendientes ({s.active_tasks || 0})</button>
               <button onClick={() => openTechHistory(s, 'all')} className="flex items-center justify-center bg-blue-50 text-blue-600 text-xs font-bold py-2 rounded-xl hover:bg-blue-100 border border-blue-200"><History className="w-3 h-3 mr-2"/> Historial</button>
            </div>
            <div className="flex justify-between items-center border-t pt-4">
               <span className="text-[10px] font-black text-slate-300 uppercase">Eficiencia: {s.completed_tasks || 0} OTs</span>
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
      <aside className={`bg-white w-72 flex-shrink-0 border-r border-slate-200 flex flex-col absolute z-30 h-full md:relative transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-20 flex items-center px-8 border-b border-slate-100"><Wrench className="text-blue-600 mr-2" /><span className="text-xl font-black text-slate-900 tracking-tighter uppercase">PME CMMS</span></div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <NavButton icon={<LayoutDashboard />} label="Dashboard" view="dashboard" current={currentView} set={setCurrentView} />
          <NavButton icon={<Box />} label="Activos" view="assets" current={currentView} set={setCurrentView} />
          <NavButton icon={<ClipboardList />} label="Órdenes Trabajo" view="workorders" current={currentView} set={setCurrentView} />
          <NavButton icon={<Package />} label="Inventario" view="inventory" current={currentView} set={setCurrentView} />
          <NavButton icon={<Users />} label="Equipo" view="team" current={currentView} set={setCurrentView} />
        </nav>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        <header className="h-20 bg-white border-b flex items-center justify-between px-8 flex-shrink-0 z-10">
          <div className="flex items-center"><button onClick={() => setIsSidebarOpen(true)} className="md:hidden mr-3 p-2 bg-slate-50 rounded-lg"><Menu/></button><h1 className="text-xl font-bold text-slate-800 capitalize tracking-tight">{currentView}</h1></div>
          <div className={`px-4 py-2 rounded-full text-[10px] font-black flex items-center gap-2 border ${serverStatus==='online'?'bg-green-50 text-green-600 border-green-100':'bg-red-50 text-red-600 border-red-100'}`}>SISTEMA {serverStatus.toUpperCase()}</div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-50">
          {loading ? <div className="text-center py-20 text-slate-400 font-black animate-pulse">SINCRONIZANDO...</div> : (
            <>
              {currentView === 'assets' && renderAssetsView()}
              {currentView === 'workorders' && renderWorkOrdersView()}
              {currentView === 'team' && renderTeamView()}
              {currentView === 'inventory' && renderInventoryView()}
              {currentView === 'dashboard' && <div className="text-center py-20 text-slate-300 font-black italic uppercase tracking-widest">Dashboard V3 Próximamente...</div>}
            </>
          )}
        </main>
      </div>

      {/* --- MODALES --- */}

      {/* MODAL ACTIVO */}
      {activeModal === 'asset' && (
        <div className={UI.modalOverlay}>
          <div className={`${UI.modalBox} max-w-2xl`}>
            <div className={UI.modalHeader}>
               <h3>{isEditing ? 'Actualizar Activo' : 'Nuevo Activo'}</h3>
               <button onClick={()=>setActiveModal(null)} className={UI.closeBtn}><X/></button>
            </div>
            <form onSubmit={handleSaveAsset} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div><label className={UI.label}>Proyecto</label>
                  <input list="projects" required className={UI.input} value={formAsset.project_name} onChange={e=>setFormAsset({...formAsset,project_name:e.target.value})}/>
                  <datalist id="projects">{uniqueProjects.map(p=><option key={p} value={p}/>)}</datalist>
                 </div>
                 <div><label className={UI.label}>Modelo</label>
                  <input list="models" required className={UI.input} value={formAsset.model_name} onChange={e=>setFormAsset({...formAsset,model_name:e.target.value})}/>
                  <datalist id="models">{availableModels.map(m=><option key={m} value={m}/>)}</datalist>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div><label className={UI.label}>Serial</label><input required className={UI.input} value={formAsset.serial_number} onChange={e=>setFormAsset({...formAsset,serial_number:e.target.value})}/></div>
                 <div><label className={UI.label}>Nombre</label><input required className={UI.input} value={formAsset.fixture_name} onChange={e=>setFormAsset({...formAsset,fixture_name:e.target.value})}/></div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div><label className={UI.label}>Línea</label><input required className={UI.input} value={formAsset.production_line} onChange={e=>setFormAsset({...formAsset,production_line:e.target.value})}/></div>
                 <div><label className={UI.label}>Estación</label><input required className={UI.input} value={formAsset.station} onChange={e=>setFormAsset({...formAsset,station:e.target.value})}/></div>
               </div>
               <div><label className={UI.label}>Estado</label><select className={UI.select} value={formAsset.condition_status} onChange={e=>setFormAsset({...formAsset,condition_status:e.target.value})}><option>Activo</option><option>Inactivo</option><option>En Mantenimiento</option></select></div>
               <div className="grid grid-cols-2 gap-4">
                 <div><label className={UI.label}>Foto (PNG)</label><input type="file" accept="image/png" className="w-full text-xs" onChange={e => setFormAsset({...formAsset, image_file: e.target.files[0]})}/></div>
                 <div><label className={UI.label}>Doc (PDF)</label><input type="file" accept="application/pdf" className="w-full text-xs" onChange={e => setFormAsset({...formAsset, doc_file: e.target.files[0]})}/></div>
               </div>
               <div><label className={UI.label}>Descripción</label><textarea className={UI.input} value={formAsset.description} onChange={e=>setFormAsset({...formAsset,description:e.target.value})}/></div>
               <div className="flex gap-2">
                 <button type="submit" className={UI.btnPrimary}>Guardar</button>
                 <button type="button" onClick={()=>setActiveModal(null)} className={UI.btnSecondary}>Cancelar</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ORDEN */}
      {activeModal === 'wo' && (
        <div className={UI.modalOverlay}>
          <div className={`${UI.modalBox} max-w-2xl`}>
            <div className={UI.modalHeader}>
               <h3>{isEditing ? 'Editar Orden' : 'Nueva Orden'}</h3>
               <button onClick={()=>setActiveModal(null)} className={UI.closeBtn}><X/></button>
            </div>
            <form onSubmit={handleSaveWO} className="space-y-4">
               {/* Sección de Selección de Activo */}
               {!isEditing ? (
                 <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div><label className={UI.label}>1. Proyecto</label><select className={UI.select} value={formWO.project_filter} onChange={e=>setFormWO({...formWO, project_filter:e.target.value, model_filter:'', asset_id:''})}><option value="">-- Todos --</option>{getProjectsForModal().map(p=><option key={p} value={p}>{p}</option>)}</select></div>
                       <div><label className={UI.label}>2. Modelo</label><select className={UI.select} value={formWO.model_filter} onChange={e=>setFormWO({...formWO, model_filter:e.target.value, asset_id:''})}><option value="">-- Todos --</option>{getModelsForModal(formWO.project_filter).map(m=><option key={m} value={m}>{m}</option>)}</select></div>
                    </div>
                    <div><label className={UI.label}>3. Activo</label><select required className={`${UI.select} border-blue-200 text-blue-700`} value={formWO.asset_id} onChange={e=>setFormWO({...formWO, asset_id:e.target.value})}><option value="">-- Seleccionar --</option>{getAssetsForModal(formWO.project_filter, formWO.model_filter).map(a=><option key={a.asset_id} value={a.asset_id}>{a.serial_number} - {a.fixture_name}</option>)}</select></div>
                 </div>
               ) : (
                 <div className="bg-slate-100 p-4 rounded-3xl border border-slate-200">
                    <label className={UI.label}>Activo Vinculado </label>
                    <div className="text-sm font-bold text-slate-700">
                        {formWO.fixture_name || 'Sin Nombre'} 
                        <span className="text-slate-400 font-normal ml-2">({formWO.serial_number || 'S/N'})</span>
                    </div>
                 </div>
               )}
               
               <div className="grid grid-cols-2 gap-4">
                  <div><label className={UI.label}>Ubicación</label><input className={UI.input} value={formWO.location} onChange={e=>setFormWO({...formWO, location:e.target.value})}/></div>
                  <div><label className={UI.label}>Tipo</label><select className={UI.select} value={formWO.type} onChange={e=>setFormWO({...formWO, type:e.target.value})}><option>Correctivo</option><option>Preventivo</option></select></div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div><label className={UI.label}>Inicio</label><input type="date" required className={UI.input} value={formWO.start_date} onChange={e=>setFormWO({...formWO, start_date:e.target.value})}/></div>
                  <div><label className={UI.label}>Fin</label><input type="date" required className={UI.input} value={formWO.end_date} onChange={e=>setFormWO({...formWO, end_date:e.target.value})}/></div>
               </div>
               
               <div><label className={UI.label}>Descripción de Actividad</label><textarea className={UI.input} placeholder="Detalle el trabajo a realizar..." value={formWO.description} onChange={e=>setFormWO({...formWO, description:e.target.value})}/></div>

               <div className="grid grid-cols-2 gap-4">
                  <div><label className={UI.label}>Prioridad</label><select className={UI.select} value={formWO.priority} onChange={e=>setFormWO({...formWO, priority:e.target.value})}><option>Baja</option><option>Media</option><option>Alta</option><option>Critica</option></select></div>
                  <div><label className={UI.label}>Autorizado Por</label><select className={UI.select} value={formWO.authorized_by} onChange={e=>setFormWO({...formWO, authorized_by:e.target.value})}><option value="">-- Seleccionar --</option>{dbStaff.filter(s=>['Ingeniero','Supervisor'].includes(s.role)).map(s=><option key={s.user_id} value={s.full_name}>{s.full_name}</option>)}</select></div>
               </div>
               
               <div className="bg-orange-50 p-4 rounded-3xl border border-orange-100 space-y-2"><label className="text-[11px] font-black text-orange-600 uppercase">Materiales (Autodescuento)</label><div className="flex gap-2"><select className="flex-1 border rounded-xl p-3 text-sm font-bold" value={formWO.material_id} onChange={e=>setFormWO({...formWO, material_id:e.target.value})}><option value="">-- Ninguno --</option>{dbInventory.map(i=><option key={i.item_id} value={i.item_id}>{i.name} (S: {i.stock_quantity})</option>)}</select><input type="number" className="w-20 border rounded-xl p-3 text-sm font-bold text-center" placeholder="Cant." value={formWO.material_qty} onChange={e=>setFormWO({...formWO, material_qty:e.target.value})}/></div></div>
               
               {isEditing && (
                 <div><label className={UI.label}>Estado</label><select className={`${UI.select} text-blue-600`} value={formWO.status} onChange={e=>setFormWO({...formWO, status:e.target.value})}><option>Programado</option><option>Reprogramado</option><option>Completado</option><option>No Completado</option></select></div>
               )}
               
               <div><label className={UI.label}>Técnico</label><select className={UI.select} value={formWO.tech_id} onChange={e=>setFormWO({...formWO, tech_id:e.target.value})}><option value="">-- Seleccionar --</option>{dbStaff.map(s=><option key={s.user_id} value={s.user_id}>{s.full_name}</option>)}</select></div>
               
               <div className="flex gap-2">
                 <button type="submit" className={UI.btnPrimary}>Confirmar</button>
                 <button type="button" onClick={()=>setActiveModal(null)} className={UI.btnSecondary}>Cancelar</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INVENTARIO */}
      {activeModal === 'item' && (
        <div className={UI.modalOverlay}>
          <div className={`${UI.modalBox} max-w-md`}>
            <div className={UI.modalHeader}>
              <h3>{isEditing?'Editar':'Nuevo'} Repuesto</h3>
              <button onClick={()=>setActiveModal(null)} className={UI.closeBtn}><X/></button>
            </div>
            <form onSubmit={handleSaveItem} className="space-y-4">
               <div><label className={UI.label}>Código de Parte (ID)</label><input required className={UI.input} value={formItem.part_code} onChange={e=>setFormItem({...formItem,part_code:e.target.value})}/></div>
               <div><label className={UI.label}>Nombre del Repuesto</label><input required className={UI.input} value={formItem.name} onChange={e=>setFormItem({...formItem,name:e.target.value})}/></div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div><label className={UI.label}>Stock Actual</label><input type="number" required className={UI.input} value={formItem.stock_quantity} onChange={e=>setFormItem({...formItem,stock_quantity:e.target.value})}/></div>
                 <div><label className={UI.label}>Nivel Mínimo</label><input type="number" required className={UI.input} value={formItem.min_stock_level} onChange={e=>setFormItem({...formItem,min_stock_level:e.target.value})}/></div>
               </div>
               <div><label className={UI.label}>Costo Unitario ($)</label><input type="number" required className={UI.input} value={formItem.unit_cost} onChange={e=>setFormItem({...formItem,unit_cost:e.target.value})}/></div>
               <div><label className={UI.label}>Ubicación Almacén</label><input className={UI.input} placeholder="Ej. Bin A-2" value={formItem.location_in_warehouse} onChange={e=>setFormItem({...formItem,location_in_warehouse:e.target.value})}/></div>
               <div className="flex gap-2">
                 <button className={UI.btnPrimary}>Confirmar Registro</button>
                 <button type="button" onClick={()=>setActiveModal(null)} className={UI.btnSecondary}>Cancelar</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL USUARIO */}
      {activeModal === 'user' && (
        <div className={UI.modalOverlay}>
          <div className={`${UI.modalBox} max-w-md`}>
            <div className={UI.modalHeader}>
               <h3>{isEditing?'Editar':'Nuevo'} Personal</h3>
               <button onClick={()=>setActiveModal(null)} className={UI.closeBtn}><X/></button>
            </div>
            <form onSubmit={handleSaveUser} className="space-y-4">
               <div><label className={UI.label}># Empleado</label><input required className={UI.input} value={formUser.employee_number} onChange={e=>setFormUser({...formUser,employee_number:e.target.value})}/></div>
               <div><label className={UI.label}>Nombre Completo</label><input required className={UI.input} value={formUser.full_name} onChange={e=>setFormUser({...formUser,full_name:e.target.value})}/></div>
               <div><label className={UI.label}>Email Corporativo</label><input type="email" required className={UI.input} value={formUser.email} onChange={e=>setFormUser({...formUser,email:e.target.value})}/></div>
               <div><label className={UI.label}>Teléfono de Contacto</label><input type="tel" className={UI.input} placeholder="Ej. 555-1234-5678" value={formUser.phone_number} onChange={e=>setFormUser({...formUser,phone_number:e.target.value})}/></div>
               <div><label className={UI.label}>Rol Técnico</label><select className={UI.select} value={formUser.role} onChange={e=>setFormUser({...formUser,role:e.target.value})}><option>Tecnico</option><option>Ingeniero</option><option>Supervisor</option></select></div>
               <div className="flex gap-2">
                 <button className={UI.btnPrimary}>Confirmar</button>
                 <button type="button" onClick={()=>setActiveModal(null)} className={UI.btnSecondary}>Cancelar</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL HISTORIAL TÉCNICO --- */}
      {techHistoryModal.show && (
         <div className={UI.modalOverlay}>
            <div className={`${UI.modalBox} max-w-4xl`}>
                <div className={UI.modalHeader}>
                    <div>
                        <h3>{techHistoryModal.type === 'pending' ? 'ACTIVIDADES PENDIENTES' : 'HISTORIAL COMPLETO'}</h3>
                        <p className="text-slate-400 font-bold text-sm mt-1">{techHistoryModal.tech?.full_name} ({techHistoryModal.tech?.employee_number})</p>
                    </div>
                    <button onClick={closeTechHistory} className={UI.closeBtn}><X/></button>
                </div>
                
                {(() => {
                    const techOrders = dbWorkOrders.filter(wo => wo.assigned_user_id == techHistoryModal.tech?.user_id);
                    const displayedOrders = techHistoryModal.type === 'pending' 
                        ? techOrders.filter(wo => !['Completado', 'No Completado'].includes(wo.status))
                        : techOrders;
                    
                    if (displayedOrders.length === 0) return <div className="text-center py-20 text-slate-300 font-black italic">NO HAY REGISTROS DISPONIBLES</div>;

                    return (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 text-slate-400 uppercase font-black">
                                    <tr><th className="p-4">OT #</th><th className="p-4">Activo</th><th className="p-4">Tarea</th><th className="p-4">Fechas</th><th className="p-4">Prioridad</th><th className="p-4">Estado</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                                    {displayedOrders.map(ot => (
                                        <tr key={ot.wo_id} className="hover:bg-blue-50/20">
                                            <td className="p-4 font-black text-blue-600">#{ot.wo_id}</td>
                                            <td className="p-4 font-bold">{ot.fixture_name}</td>
                                            <td className="p-4 max-w-xs truncate">{ot.title || ot.description}</td>
                                            <td className="p-4">{formatDate(ot.scheduled_start)} - {formatDate(ot.scheduled_end)}</td>
                                            <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-black ${ot.priority==='Critica'?'bg-red-100 text-red-600':'bg-blue-50 text-blue-600'}`}>{ot.priority}</span></td>
                                            <td className="p-4">
                                                {techHistoryModal.type === 'pending' ? (
                                                    <select className="border rounded p-2 text-xs font-bold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-blue-500" value={ot.status} onChange={(e) => handleUpdateStatusFromTable(ot.wo_id, e.target.value)}>
                                                        <option>Programado</option><option>Reprogramado</option><option>En Progreso</option><option>Completado</option><option>No Completado</option>
                                                    </select>
                                                ) : <span className={`px-2 py-1 rounded-full font-bold text-[10px] uppercase border ${ot.status === 'Completado' ? 'bg-green-100 text-green-800 border-green-200' : ot.status === 'No Completado' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{ot.status}</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                })()}
            </div>
         </div>
      )}

    </div>
  );
}

const NavButton = ({ icon, label, view, current, set }) => (
  <button onClick={() => set(view)} className={`w-full flex items-center px-6 py-4 text-sm font-bold transition-all rounded-2xl group border-l-4 ${current === view ? 'text-blue-700 bg-blue-50/50 shadow-sm border-blue-600' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}>
    <span className={`mr-4 ${current === view ? 'text-blue-600' : 'text-slate-300'}`}>{icon}</span>{label}
  </button>
);