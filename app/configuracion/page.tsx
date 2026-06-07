"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Settings, 
  User, 
  Clock, 
  CreditCard, 
  Save, 
  Loader2,
  Plus,
  Trash2,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Users, // <-- NUEVO ÍCONO
  X
} from "lucide-react";

export const dynamic = 'force-dynamic';

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<any>({
    profesional_nombre: "",
    profesional_matricula: "",
    duracion_sesion: 50,
    valor_sesion_defecto: "",
    cuentas_cobro: [] 
  });
  
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [configId, setConfigId] = useState<number | null>(null);
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState("");

  // --- NUEVOS ESTADOS PARA GESTIÓN DE SECRETARIAS ---
  const [secretarias, setSecretarias] = useState<any[]>([]);
  const [modalSecretaria, setModalSecretaria] = useState(false);
  const [creandoSecretaria, setCreandoSecretaria] = useState(false);
  const [nuevaSecretaria, setNuevaSecretaria] = useState({
    nombre: "",
    email: "",
    password: ""
  });

  const traerDatos = async () => {
    // 1. Traer configuración general
    const { data: configData } = await supabase.from("configuracion").select("*").limit(1).single();
    if (configData) {
      setConfig({
        ...configData,
        cuentas_cobro: Array.isArray(configData.cuentas_cobro) ? configData.cuentas_cobro : [],
        profesional_nombre: configData.profesional_nombre === "Mi Consultorio" ? "" : configData.profesional_nombre
      });
      setConfigId(configData.id);
    }

    // 2. Traer la lista de secretarias (Usuarios creados con ese rol)
    // Nota: Como no tenemos acceso directo a la tabla auth.users desde el frontend por seguridad,
    // buscamos en una tabla pública si la tenés, o en este caso simulamos la lista
    // (En un SaaS real, tendrías una tabla 'perfiles_equipo' vinculada).
    // Por ahora, dejamos la estructura preparada visualmente.
    
    setCargando(false);
  };

  useEffect(() => { traerDatos(); }, []);

  const guardarConfiguracion = async () => {
    if (!config.profesional_nombre?.trim() || !config.profesional_matricula?.trim()) {
      setErrorValidacion("El nombre del profesional y la matrícula son obligatorios.");
      setTimeout(() => setErrorValidacion(""), 4000);
      return;
    }

    setGuardando(true);
    setErrorValidacion("");

    if (configId) {
      await supabase.from("configuracion").update(config).eq("id", configId);
    } else {
      const { data } = await supabase.from("configuracion").insert([config]).select().single();
      if (data) setConfigId(data.id);
    }
    
    setGuardando(false);
    setGuardadoOk(true);
    setTimeout(() => setGuardadoOk(false), 3000);
  };

  const agregarCuenta = () => {
    const nuevasCuentas = [...config.cuentas_cobro, { banco: "", alias: "", cbu: "", descripcion: "" }];
    setConfig({ ...config, cuentas_cobro: nuevasCuentas });
  };

  const actualizarCuenta = (index: number, campo: string, valor: string) => {
    const nuevas = config.cuentas_cobro.map((c: any, i: number) => 
      i === index ? { ...c, [campo]: valor } : c
    );
    setConfig({ ...config, cuentas_cobro: nuevas });
  };

  const eliminarCuenta = (index: number) => {
    setConfig({ ...config, cuentas_cobro: config.cuentas_cobro.filter((_: any, i: number) => i !== index) });
  };

  // --- NUEVA FUNCIÓN: CREAR SECRETARIA ---
  const crearAccesoSecretaria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaSecretaria.nombre || !nuevaSecretaria.email || !nuevaSecretaria.password) return;
    
    setCreandoSecretaria(true);
    
    try {
      // 1. Creamos el usuario en Auth
      const { data, error } = await supabase.auth.signUp({
        email: nuevaSecretaria.email,
        password: nuevaSecretaria.password,
        options: {
          data: { 
            nombre_completo: nuevaSecretaria.nombre, 
            rol: 'secretaria',
            // Acá el id del profesional actual para vincularlos
          } 
        }
      });

      if (error) throw error;

      alert(`¡Acceso creado para ${nuevaSecretaria.nombre}! Ya puede iniciar sesión.`);
      setModalSecretaria(false);
      setNuevaSecretaria({ nombre: "", email: "", password: "" });
      
      // (Opcional) Acá deberías recargar la lista de secretarias
      
    } catch (err: any) {
      alert("Error al crear el acceso: " + err.message);
    } finally {
      setCreandoSecretaria(false);
    }
  };

  if (cargando) return (
    <div className="flex items-center justify-center h-[70vh] text-[#8C9C8E]">
      <Loader2 className="animate-spin" size={40} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-32">
      
      {/* MODAL DE NUEVA SECRETARIA */}
      {modalSecretaria && (
        <div className="fixed inset-0 z-[100] bg-[#4A443C]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-[#E8E3D9] animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6 border-b border-[#F2EFE9] pb-4">
              <h2 className="text-xl font-black text-[#4A443C] flex items-center gap-2">
                <Users className="text-[#6B806F]" /> Nuevo Acceso
              </h2>
              <button onClick={() => setModalSecretaria(false)} className="text-[#A49A8D] hover:text-[#B06043] bg-[#F2EFE9] p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <p className="text-[#8A8175] text-sm font-medium mb-6">Generá un usuario y contraseña para que tu asistente pueda gestionar la agenda y pacientes.</p>

            <form onSubmit={crearAccesoSecretaria} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-[#A49A8D] uppercase tracking-widest mb-1.5 ml-1">Nombre de la Asistente</label>
                <input 
                  type="text" required placeholder="Ej: María Gómez"
                  className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none focus:border-[#6B806F] font-medium text-[#4A443C]"
                  value={nuevaSecretaria.nombre} onChange={(e) => setNuevaSecretaria({...nuevaSecretaria, nombre: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#A49A8D] uppercase tracking-widest mb-1.5 ml-1">Email (Usuario)</label>
                <input 
                  type="email" required placeholder="maria@consultorio.com"
                  className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none focus:border-[#6B806F] font-medium text-[#4A443C]"
                  value={nuevaSecretaria.email} onChange={(e) => setNuevaSecretaria({...nuevaSecretaria, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#A49A8D] uppercase tracking-widest mb-1.5 ml-1">Contraseña Inicial</label>
                <input 
                  type="password" required placeholder="Mínimo 6 caracteres" minLength={6}
                  className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none focus:border-[#6B806F] font-medium text-[#4A443C]"
                  value={nuevaSecretaria.password} onChange={(e) => setNuevaSecretaria({...nuevaSecretaria, password: e.target.value})}
                />
              </div>

              <button 
                type="submit" disabled={creandoSecretaria}
                className="w-full bg-[#4A443C] text-white py-4 rounded-2xl font-bold text-base shadow-sm hover:bg-[#312d28] transition-colors mt-4 flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {creandoSecretaria ? <Loader2 className="animate-spin" size={20} /> : "Crear y Enviar Acceso"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CABECERA Y BOTÓN GUARDAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-[#E8E3D9] pb-8">
        <div className="flex items-center gap-5">
          <div className="bg-[#6B806F] p-4 rounded-3xl text-white shadow-md">
            <Settings size={36} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-[#4A443C] tracking-tight">Configuración</h1>
            <p className="text-[#8A8175] font-medium mt-1">Ajustes de consultorio y datos de cobro.</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <button 
            onClick={guardarConfiguracion}
            disabled={guardando}
            className={`px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-sm w-full md:w-auto justify-center ${guardadoOk ? 'bg-[#E8F0E9] text-[#556B5A]' : 'bg-[#4A443C] text-white hover:bg-[#312d28]'}`}
          >
            {guardando ? <Loader2 className="animate-spin" size={20} /> : guardadoOk ? <CheckCircle2 size={20} /> : <Save size={20} />}
            <span>{guardadoOk ? 'Guardado con éxito' : 'Guardar Cambios'}</span>
          </button>
          
          {errorValidacion && (
            <div className="flex items-center gap-1.5 text-[#B06043] text-xs font-bold animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={14} /> {errorValidacion}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* PERFIL PROFESIONAL */}
        <div className="bg-white border-2 border-[#E8E3D9] p-8 rounded-[2.5rem] shadow-sm md:col-span-2">
          <h2 className="text-xl font-bold text-[#4A443C] flex items-center gap-2 mb-6">
            <User className="text-[#8C9C8E]" size={24} /> Perfil del Profesional
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-[#A49A8D] uppercase tracking-widest mb-2">
                Nombre y Apellido <span className="text-[#B06043] text-sm">*</span>
              </label>
              <input 
                type="text" 
                placeholder="Ej: Lic. Juan Pérez"
                className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none focus:border-[#6B806F] font-bold text-[#4A443C]" 
                value={config.profesional_nombre || ""} 
                onChange={e => setConfig({...config, profesional_nombre: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-[#A49A8D] uppercase tracking-widest mb-2">
                Matrícula Nacional/Provincial <span className="text-[#B06043] text-sm">*</span>
              </label>
              <input 
                type="text" 
                placeholder="Ej: MN 12345"
                className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none focus:border-[#6B806F] font-bold text-[#4A443C]" 
                value={config.profesional_matricula || ""} 
                onChange={e => setConfig({...config, profesional_matricula: e.target.value})} 
              />
            </div>
          </div>
        </div>

        {/* PARÁMETROS DE CONSULTA */}
        <div className="bg-white border-2 border-[#E8E3D9] p-8 rounded-[2.5rem] shadow-sm">
          <h2 className="text-xl font-bold text-[#4A443C] flex items-center gap-2 mb-6">
            <Clock className="text-[#8C9C8E]" size={24} /> Encuadre General
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-[#A49A8D] uppercase tracking-widest mb-2">Duración de Sesión (min)</label>
              <select className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none focus:border-[#6B806F] font-medium text-[#4A443C]" value={config.duracion_sesion} onChange={e => setConfig({...config, duracion_sesion: parseInt(e.target.value)})}>
                <option value={45}>45 minutos</option>
                <option value={50}>50 minutos</option>
                <option value={60}>60 minutos</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-[#A49A8D] uppercase tracking-widest mb-2">Valor Actual de Sesión ($)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#8A8175]">$</span>
                <input type="number" className="w-full p-4 pl-10 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none focus:border-[#6B806F] font-black text-[#6B806F] text-lg" value={config.valor_sesion_defecto || ""} onChange={e => setConfig({...config, valor_sesion_defecto: e.target.value})} />
              </div>
              <p className="text-[10px] text-[#A49A8D] font-bold mt-2 italic uppercase">Nota: Cambiar este valor no afectará turnos ya creados o cobrados.</p>
            </div>
          </div>
        </div>

        {/* MÚLTIPLES CUENTAS DE COBRO */}
        <div className="bg-white border-2 border-[#E8E3D9] p-8 rounded-[2.5rem] shadow-sm flex flex-col h-fit">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#4A443C] flex items-center gap-2">
              <Wallet className="text-[#B06043]" size={24} /> Opciones de Cobro
            </h2>
            <button onClick={agregarCuenta} className="p-2 bg-[#FCEEE9] text-[#B06043] rounded-xl hover:bg-[#B06043] hover:text-white transition-all" title="Añadir nueva cuenta"><Plus size={20}/></button>
          </div>

          <div className="space-y-4">
            {config.cuentas_cobro.length === 0 && (
                <p className="text-center py-6 text-sm text-[#A49A8D] italic border-2 border-dashed border-[#E8E3D9] rounded-2xl">No hay cuentas cargadas.</p>
            )}
            {config.cuentas_cobro.map((cta: any, idx: number) => (
              <div key={idx} className="bg-[#FBF9F6] p-4 rounded-2xl border border-[#E8E3D9] relative group">
                <button onClick={() => eliminarCuenta(idx)} className="absolute -top-2 -right-2 bg-white border border-[#E8E3D9] text-[#8A8175] p-1.5 rounded-full hover:text-[#B06043] shadow-sm"><Trash2 size={14}/></button>
                <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Banco/App (Ej: OSDE, MercadoPago)" className="col-span-2 bg-transparent border-b border-[#E8E3D9] pb-1 text-sm font-bold text-[#4A443C] outline-none focus:border-[#B06043] placeholder-[#A49A8D]" value={cta.banco} onChange={e => actualizarCuenta(idx, 'banco', e.target.value)} />
                    <input placeholder="Alias" className="bg-transparent border-b border-[#E8E3D9] pb-1 text-xs text-[#4A443C] outline-none focus:border-[#B06043] placeholder-[#A49A8D]" value={cta.alias} onChange={e => actualizarCuenta(idx, 'alias', e.target.value)} />
                    <input placeholder="CBU/CVU" className="bg-transparent border-b border-[#E8E3D9] pb-1 text-xs text-[#4A443C] outline-none focus:border-[#B06043] placeholder-[#A49A8D]" value={cta.cbu} onChange={e => actualizarCuenta(idx, 'cbu', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- NUEVA SECCIÓN: GESTIÓN DE EQUIPO --- */}
        <div className="bg-[#FBF9F6] border-2 border-dashed border-[#D3DDD4] p-8 rounded-[2.5rem] md:col-span-2 shadow-inner">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-[#556B5A] flex items-center gap-2">
                <Users size={24} /> Gestión de Equipo (Secretaría)
              </h2>
              <p className="text-[#8A8175] text-sm font-medium mt-1">Dale acceso a tu asistente para gestionar turnos y pacientes.</p>
            </div>
            <button 
              onClick={() => setModalSecretaria(true)}
              className="bg-white border border-[#D3DDD4] text-[#556B5A] px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#E8F0E9] transition-all shadow-sm whitespace-nowrap"
            >
              <Plus size={18} /> Invitar Asistente
            </button>
          </div>

          {secretarias.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-[#E8E3D9] text-center">
              <p className="text-[#A49A8D] font-bold">Aún no invitaste a nadie a tu consultorio.</p>
              <p className="text-[#A49A8D] text-sm font-medium mt-1">Tu secretaria podrá ver la agenda, pero NO tendrá acceso a historias clínicas ni finanzas.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#E8E3D9] overflow-hidden">
              {/* Acá se mapearían las secretarias reales en el futuro */}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}