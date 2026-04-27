"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Calendar, 
  Clock, 
  User, 
  Save, 
  ArrowLeft, 
  Search, 
  Video, 
  MapPin, 
  Check, 
  FileText, 
  Loader2, 
  Plus,
  AlertCircle 
} from "lucide-react";
import Link from "next/link";

export default function NuevoTurno() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  
  // 1. ESTADO COMPLETO (Cerebro)
  const [form, setForm] = useState({
    paciente_id: "",
    fecha: new Date().toISOString().split('T')[0],
    hora: "16:00",
    tipo_sesion: "presencial",
    valor_sesion: "",
    pagado: false,
    motivo: ""
  });

  const [busqueda, setBusqueda] = useState("");
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);

  // 2. DETECTOR DE FIN DE SEMANA (Corregido para que no falle por zona horaria)
  const esFinDeSemana = (fechaStr: string) => {
    if (!fechaStr) return false;
    // Dividimos la fecha manualmente para que no se mueva de día
    const [y, m, d] = fechaStr.split('-').map(Number);
    const fecha = new Date(y, m - 1, d, 12, 0, 0); // Forzamos mediodía
    const dia = fecha.getDay(); 
    return dia === 0 || dia === 6; // 0: Domingo, 6: Sábado
  };

  // 3. BUSCADOR INSTANTÁNEO
  useEffect(() => {
    async function buscarPacientes() {
      if (busqueda.trim() === "") { 
        setPacientes([]); 
        return; 
      }
      setBuscando(true);
      const { data } = await supabase
        .from('pacientes')
        .select('id, nombre, apellido')
        .or(`nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%`)
        .limit(8);

      if (data) setPacientes(data);
      setBuscando(false);
    }
    buscarPacientes();
  }, [busqueda]);

  const seleccionarPaciente = (p: any) => {
    setPacienteSeleccionado(p);
    setForm({ ...form, paciente_id: p.id });
    setBusqueda("");
    setPacientes([]);
  };

  // 4. FUNCIÓN GUARDAR (Blindada contra errores de numeric)
  const guardarTurno = async () => {
    if (!form.paciente_id) {
      alert("Por favor, seleccioná un paciente de la lista.");
      return;
    }
    setEnviando(true);

    const payload = {
      paciente_id: form.paciente_id,
      fecha: form.fecha,
      hora: form.hora,
      tipo_sesion: form.tipo_sesion,
      valor_sesion: form.valor_sesion === "" ? null : parseFloat(form.valor_sesion),
      pagado: form.pagado,
      motivo: form.motivo || null
    };

    const { error } = await supabase.from('turnos').insert([payload]);

    if (!error) {
      router.push('/turnos');
    } else {
      alert("Error al agendar: " + error.message);
      setEnviando(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
      {/* HEADER DINÁMICO */}
      <div>
        <Link href="/turnos" className="inline-flex items-center gap-2 text-[#8A8175] hover:text-[#556B5A] mb-4 font-bold transition-all">
          <ArrowLeft size={18} /> Volver a la agenda
        </Link>
        <div className="flex items-center gap-4 border-b border-[#E8E3D9] pb-6">
          <div className="bg-[#E8F0E9] p-4 rounded-3xl text-[#556B5A]">
            <Calendar size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#4A443C]">Agendar Nuevo Turno</h1>
            <p className="text-[#8A8175] text-sm mt-1 font-medium tracking-wide">Programá la próxima sesión de tu paciente.</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-[2rem] border border-[#E8E3D9] overflow-hidden transition-all">
        <div className="p-8 md:p-10 space-y-10">
          
          {/* SECCIÓN 1: BUSCADOR DE PACIENTE (La lista estética) */}
          <section className="space-y-4">
            <label className="text-sm font-bold text-[#8A8175] uppercase tracking-widest flex items-center gap-2">
              <User size={16} className="text-[#8C9C8E]" /> Paciente Seleccionado *
            </label>
            
            {!pacienteSeleccionado ? (
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A49A8D]">
                  {buscando ? <Loader2 size={22} className="animate-spin text-[#6B806F]" /> : <Search size={22} />}
                </div>
                <input 
                  placeholder="Escribí el nombre del paciente..." 
                  className="w-full p-6 pl-14 bg-[#FBF9F6] border border-[#E8E3D9] rounded-3xl outline-none focus:ring-4 focus:ring-[#6B806F]/5 transition-all text-xl placeholder:text-[#A49A8D]/60"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  autoFocus
                />
                
                {pacientes.length > 0 && (
                  <div className="absolute w-full mt-3 bg-white border border-[#E8E3D9] rounded-[1.5rem] shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    {pacientes.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => seleccionarPaciente(p)} 
                        className="w-full p-6 text-left hover:bg-[#F2EFE9] flex items-center justify-between group transition-colors border-b border-[#F2EFE9] last:border-0"
                      >
                        <span className="font-bold text-[#4A443C] text-xl">{p.apellido}, {p.nombre}</span>
                        <div className="bg-[#E8F0E9] p-2.5 rounded-xl text-[#556B5A] scale-90 group-hover:scale-110 transition-transform">
                          <Plus size={20} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-7 bg-[#E8F0E9] border border-[#D3DDD4] rounded-[2rem] shadow-sm animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-[#556B5A] font-bold shadow-md">
                    <Check size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8C9C8E] uppercase tracking-[0.2em] mb-1">Paciente para la sesión</p>
                    <span className="font-bold text-[#4A443C] text-2xl tracking-tight">{pacienteSeleccionado.apellido}, {pacienteSeleccionado.nombre}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setPacienteSeleccionado(null)} 
                  className="px-6 py-3 bg-white/80 hover:bg-white text-[#8A8175] hover:text-[#B06043] rounded-2xl text-xs font-bold transition-all uppercase tracking-widest shadow-sm"
                >
                  Cambiar
                </button>
              </div>
            )}
          </section>

          {/* SECCIÓN 2: FECHA Y HORA (Con el detector de finde) */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-[#E8E3D9] pt-10">
            <div className="space-y-4 relative">
              <label className="text-sm font-bold text-[#8A8175] uppercase tracking-widest flex items-center gap-2">
                <Calendar size={16} className="text-[#8C9C8E]" /> Fecha de Sesión *
              </label>
              <input 
                type="date" 
                className={`w-full p-5 border rounded-2xl outline-none transition-all text-lg font-medium ${esFinDeSemana(form.fecha) ? 'border-[#B06043] bg-[#FCEEE9]/40 ring-2 ring-[#B06043]/10' : 'bg-[#FBF9F6] border-[#E8E3D9]'}`} 
                value={form.fecha} 
                onChange={e => setForm({...form, fecha: e.target.value})} 
              />
              
              {esFinDeSemana(form.fecha) && (
                <div className="absolute -bottom-7 left-2 flex items-center gap-2 text-[#B06043] animate-bounce">
                  <AlertCircle size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider italic">Atención Chano: Es Fin de Semana</span>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <label className="text-sm font-bold text-[#8A8175] uppercase tracking-widest flex items-center gap-2">
                <Clock size={16} className="text-[#8C9C8E]" /> Horario *
              </label>
              <input 
                type="time" 
                className="w-full p-5 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none text-lg font-medium" 
                value={form.hora} 
                onChange={e => setForm({...form, hora: e.target.value})} 
              />
            </div>
          </section>

          {/* SECCIÓN 3: MOTIVO */}
          <section className="space-y-4 border-t border-[#E8E3D9] pt-10">
            <label className="text-sm font-bold text-[#8A8175] uppercase tracking-widest flex items-center gap-2">
              <FileText size={16} className="text-[#8C9C8E]" /> Notas o Motivo de la Sesión
            </label>
            <textarea 
              placeholder="Ej: Sesión de terapia, Evaluación psicodiagnóstica, Entrevista con padres..." 
              className="w-full p-5 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none text-lg resize-none"
              rows={2}
              value={form.motivo}
              onChange={e => setForm({...form, motivo: e.target.value})}
            />
          </section>

          {/* SECCIÓN 4: MODALIDAD Y VALOR */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-[#E8E3D9] pt-10">
            <div className="space-y-4">
              <label className="text-sm font-bold text-[#8A8175] uppercase tracking-widest">Modalidad</label>
              <div className="flex bg-[#FBF9F6] rounded-[1.5rem] p-2 border border-[#E8E3D9]">
                <button 
                  onClick={() => setForm({...form, tipo_sesion: 'presencial'})} 
                  className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${form.tipo_sesion === 'presencial' ? 'bg-white text-[#556B5A] shadow-md ring-1 ring-[#E8E3D9]' : 'text-[#A49A8D] hover:text-[#6D645A]'}`}
                >
                  <MapPin size={20} /> Presencial
                </button>
                <button 
                  onClick={() => setForm({...form, tipo_sesion: 'virtual'})} 
                  className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${form.tipo_sesion === 'virtual' ? 'bg-white text-[#556B5A] shadow-md ring-1 ring-[#E8E3D9]' : 'text-[#A49A8D] hover:text-[#6D645A]'}`}
                >
                  <Video size={20} /> Virtual
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="text-sm font-bold text-[#8A8175] uppercase tracking-widest">Valor de la Sesión ($)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-[#A49A8D]">$</span>
                <input 
                  type="number" 
                  placeholder="Monto a cobrar" 
                  className="w-full p-5 pl-10 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none text-xl font-bold text-[#4A443C]" 
                  value={form.valor_sesion} 
                  onChange={e => setForm({...form, valor_sesion: e.target.value})} 
                />
              </div>
            </div>
          </section>

        </div>

        {/* ACCIÓN FINAL */}
        <div className="bg-[#FBF9F6] p-10 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-[#E8E3D9]">
          <p className="text-[#A49A8D] text-xs font-bold uppercase tracking-widest">Los campos con (*) son obligatorios</p>
          <button 
            onClick={guardarTurno} 
            disabled={enviando} 
            className="w-full md:w-auto px-12 py-5 bg-[#6B806F] hover:bg-[#556B5A] text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl hover:-translate-y-1 active:scale-95 disabled:bg-[#A49A8D]"
          >
            {enviando ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
            {enviando ? "Agendando..." : "Confirmar Turno"}
          </button>
        </div>
      </div>
    </div>
  );
}