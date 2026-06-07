"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Calendar, Clock, User, Save, ArrowLeft, Search, Video, 
  MapPin, Check, FileText, Loader2, Plus, AlertCircle, Phone, X
} from "lucide-react";
import Link from "next/link";

function FormularioNuevoTurno() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idDesdeLink = searchParams?.get('patient_id');

  const [enviando, setEnviando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  
  const [form, setForm] = useState({
    paciente_id: "",
    fecha: new Date().toISOString().split('T')[0],
    hora: "",
    tipo_sesion: "presencial",
    valor_sesion: "",
    pagado: false,
    motivo: ""
  });

  const [busqueda, setBusqueda] = useState("");
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);

  // --- ESTADOS PARA ALTA RÁPIDA ---
  const [mostrandoAltaRapida, setMostrandoAltaRapida] = useState(false);
  const [guardandoPaciente, setGuardandoPaciente] = useState(false);
  const [nuevoPaciente, setNuevoPaciente] = useState({
    nombre: "",
    apellido: "",
    celular: ""
  });

  const hoyReal = new Date();
  const hoyIso = hoyReal.toISOString().split('T')[0];

  const esFinDeSemana = (fechaStr: string) => {
    if (!fechaStr) return false;
    const [y, m, d] = fechaStr.split('-').map(Number);
    const fecha = new Date(y, m - 1, d, 12, 0, 0);
    const dia = fecha.getDay(); 
    return dia === 0 || dia === 6;
  };

  useEffect(() => {
    async function autocompletarPaciente() {
      if (idDesdeLink) {
        setBuscando(true);
        const { data } = await supabase
          .from('pacientes')
          .select('id, nombre, apellido, motivo_consulta') 
          .eq('id', idDesdeLink)
          .single();

        if (data) {
          setPacienteSeleccionado(data);
          setForm(prev => ({ 
            ...prev, 
            paciente_id: data.id,
            motivo: data.motivo_consulta || "" 
          }));
        }
        setBuscando(false);
      }
    }
    autocompletarPaciente();
  }, [idDesdeLink]);

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
    setForm({ 
      ...form, 
      paciente_id: p.id,
      motivo: p.motivo_consulta || "" 
    });
    setBusqueda("");
    setPacientes([]);
  };

  const crearPacienteRapido = async () => {
    if (!nuevoPaciente.nombre || !nuevoPaciente.apellido) {
      alert("Completá nombre y apellido para guardar.");
      return;
    }
    setGuardandoPaciente(true);

    const { data, error } = await supabase
      .from('pacientes')
      .insert([
        {
          nombre: nuevoPaciente.nombre,
          apellido: nuevoPaciente.apellido,
          celular: nuevoPaciente.celular || null,
          es_particular: true // Por defecto lo mandamos como particular
        }
      ])
      .select('id, nombre, apellido, motivo_consulta')
      .single();

    if (error) {
      alert("Error al crear paciente: " + error.message);
      setGuardandoPaciente(false);
      return;
    }

    if (data) {
      seleccionarPaciente(data);
      setMostrandoAltaRapida(false);
      setNuevoPaciente({ nombre: "", apellido: "", celular: "" });
    }
    setGuardandoPaciente(false);
  };

  const guardarTurno = async () => {
    if (!form.paciente_id) {
      alert("Por favor, seleccioná un paciente de la lista.");
      return;
    }
    
    if (!form.hora) {
      alert("Por favor, seleccioná un horario para la sesión.");
      return;
    }

    if (form.fecha < hoyIso) {
        alert("La fecha del turno no puede ser en el pasado. Por favor, seleccioná una fecha válida.");
        return;
    }
    
    setEnviando(true);

    const { data: turnoExistente } = await supabase
      .from('turnos')
      .select('id, pacientes(nombre, apellido)')
      .eq('fecha', form.fecha)
      .eq('hora', form.hora)
      .not('estado', 'eq', 'cancelado') 
      .maybeSingle();

      if (turnoExistente) {
        const p = turnoExistente.pacientes as any;
        const apellido = p.apellido || p[0]?.apellido || "";
        const nombre = p.nombre || p[0]?.nombre || "";
  
        alert(`¡ATENCIÓN! Ese horario ya está ocupado por ${apellido}, ${nombre}. \n\nPor favor, elegí otra hora o cancelá el turno anterior.`);
        setEnviando(false);
        return;
      }

    const payload = {
      paciente_id: form.paciente_id,
      fecha: form.fecha,
      hora: form.hora,
      tipo_sesion: form.tipo_sesion,
      valor_sesion: form.valor_sesion === "" ? null : parseFloat(form.valor_sesion.toString()),
      pagado: form.pagado,
      motivo: form.motivo || null,
      estado: 'Pendiente'
    };

    const { error } = await supabase.from('turnos').insert([payload]);

    if (!error) {
      router.push('/turnos');
    } else {
      alert("Error al agendar: " + error.message);
      setEnviando(false);
    }
  };

  // Generador de opciones de 15 minutos (De 07:00 a 21:45)
  const opcionesHora = [];
  for (let h = 7; h <= 21; h++) {
    for (let m = 0; m < 60; m += 15) {
      const horaStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      opcionesHora.push(horaStr);
    }
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      <div>
        <Link href="/turnos" className="inline-flex items-center gap-2 text-[#8A8175] hover:text-[#556B5A] mb-4 font-bold transition-all">
          <ArrowLeft size={18} /> Volver a la agenda
        </Link>
        <div className="flex items-center gap-4 border-b border-[#E8E3D9] pb-6">
          <div className="bg-[#E8F0E9] p-4 rounded-3xl text-[#556B5A]">
            <Calendar size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#4A443C] tracking-tight">Agendar Nuevo Turno</h1>
            <p className="text-[#8A8175] text-sm mt-1 font-medium tracking-wide">Programá la próxima sesión de tu paciente.</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-[2.5rem] border border-[#E8E3D9] overflow-hidden transition-all">
        <div className="p-8 md:p-10 space-y-10">
          
          <section className="space-y-4 relative">
            <label className="text-xs font-black text-[#8A8175] uppercase tracking-widest flex items-center gap-2">
              <User size={14} className="text-[#8C9C8E]" /> Paciente Seleccionado *
            </label>
            
            {!pacienteSeleccionado ? (
              mostrandoAltaRapida ? (
                /* --- FORMULARIO DE ALTA RÁPIDA --- */
                <div className="bg-[#FCEEE9]/30 border border-[#F5D8CE] rounded-3xl p-6 animate-in slide-in-from-top-2">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-[#B06043] flex items-center gap-2">
                      <User size={18}/> Alta Rápida de Paciente
                    </h3>
                    <button onClick={() => setMostrandoAltaRapida(false)} className="text-[#A49A8D] hover:text-[#4A443C]">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input 
                      placeholder="Nombre *" 
                      value={nuevoPaciente.nombre}
                      onChange={e => setNuevoPaciente({...nuevoPaciente, nombre: e.target.value})}
                      className="p-4 bg-white border border-[#E8E3D9] rounded-2xl outline-none focus:border-[#B06043] font-medium"
                    />
                    <input 
                      placeholder="Apellido *" 
                      value={nuevoPaciente.apellido}
                      onChange={e => setNuevoPaciente({...nuevoPaciente, apellido: e.target.value})}
                      className="p-4 bg-white border border-[#E8E3D9] rounded-2xl outline-none focus:border-[#B06043] font-medium"
                    />
                    <div className="md:col-span-2 relative">
                      <Phone className="absolute left-4 top-4 text-[#A49A8D]" size={18} />
                      <input 
                        placeholder="Celular (Opcional)" 
                        type="tel"
                        value={nuevoPaciente.celular}
                        onChange={e => setNuevoPaciente({...nuevoPaciente, celular: e.target.value})}
                        className="w-full p-4 pl-12 bg-white border border-[#E8E3D9] rounded-2xl outline-none focus:border-[#B06043] font-medium"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={crearPacienteRapido}
                    disabled={guardandoPaciente}
                    className="w-full bg-[#B06043] hover:bg-[#8C3C2A] text-white font-bold py-4 rounded-2xl flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    {guardandoPaciente ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Guardar y Seleccionar
                  </button>
                </div>
              ) : (
                /* --- BUSCADOR NORMAL --- */
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A49A8D]">
                    {buscando ? <Loader2 size={22} className="animate-spin text-[#6B806F]" /> : <Search size={22} />}
                  </div>
                  <input 
                    placeholder="Escribí el nombre del paciente..." 
                    className="w-full p-6 pl-14 bg-[#FBF9F6] border border-[#E8E3D9] rounded-3xl outline-none focus:ring-4 focus:ring-[#6B806F]/5 transition-all text-xl font-bold text-[#4A443C] placeholder:text-[#A49A8D]/60 placeholder:font-medium"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                  
                  {/* RESULTADOS DE BÚSQUEDA */}
                  {(busqueda.length > 0 && pacientes.length > 0) && (
                    <div className="absolute w-full mt-3 bg-white border border-[#E8E3D9] rounded-[1.5rem] shadow-2xl z-20 overflow-hidden">
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

                  {/* BOTÓN PARA CREAR SI NO LO ENCUENTRA */}
                  {(busqueda.length > 0 && !buscando && pacientes.length === 0) && (
                    <div className="absolute w-full mt-3 bg-white border border-[#E8E3D9] rounded-[1.5rem] shadow-2xl z-20 overflow-hidden p-6 text-center">
                      <p className="text-[#8A8175] font-medium mb-4">No encontramos a "{busqueda}"</p>
                      <button 
                        onClick={() => {
                          // Pre-llenamos el nombre con lo que haya escrito si es una sola palabra
                          if (!busqueda.includes(" ")) {
                            setNuevoPaciente(prev => ({...prev, nombre: busqueda}));
                          }
                          setMostrandoAltaRapida(true);
                        }}
                        className="bg-[#FCEEE9] text-[#B06043] font-bold py-3 px-6 rounded-xl hover:bg-[#F5D8CE] transition-colors"
                      >
                        + Crear paciente nuevo
                      </button>
                    </div>
                  )}
                </div>
              )
            ) : (
              /* --- PACIENTE SELECCIONADO --- */
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-7 bg-[#E8F0E9] border border-[#D3DDD4] rounded-[2rem] shadow-sm gap-4">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-[#556B5A] font-bold shadow-md shrink-0">
                    <Check size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#8C9C8E] uppercase tracking-[0.2em] mb-1">Paciente para la sesión</p>
                    <span className="font-black text-[#4A443C] text-2xl tracking-tight leading-none block">{pacienteSeleccionado.apellido}, {pacienteSeleccionado.nombre}</span>
                  </div>
                </div>
                {!idDesdeLink && (
                  <button 
                    onClick={() => {
                      setPacienteSeleccionado(null);
                      setForm({ ...form, paciente_id: "" });
                    }} 
                    className="w-full sm:w-auto px-6 py-3 bg-white/80 hover:bg-white text-[#8A8175] hover:text-[#B06043] rounded-2xl text-xs font-black transition-all uppercase tracking-widest shadow-sm"
                  >
                    Cambiar
                  </button>
                )}
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-[#E8E3D9] pt-10">
            <div className="space-y-4 relative">
              <label className="text-xs font-black text-[#8A8175] uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} className="text-[#8C9C8E]" /> Fecha de Sesión *
              </label>
              <input 
                type="date" 
                className={`w-full p-5 border rounded-2xl outline-none transition-all text-lg font-bold text-[#4A443C] ${esFinDeSemana(form.fecha) ? 'border-[#B06043] bg-[#FCEEE9]/40 ring-2 ring-[#B06043]/10' : 'bg-[#FBF9F6] border-[#E8E3D9] focus:border-[#6B806F]'}`} 
                value={form.fecha} 
                min={hoyIso} 
                onChange={e => setForm({...form, fecha: e.target.value})} 
              />
              
              {esFinDeSemana(form.fecha) && (
                <div className="absolute -bottom-7 left-2 flex items-center gap-2 text-[#B06043]">
                  <AlertCircle size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider italic">Atención: Es Fin de Semana</span>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <label className="text-xs font-black text-[#8A8175] uppercase tracking-widest flex items-center gap-2">
                <Clock size={14} className="text-[#8C9C8E]" /> Horario *
              </label>
              <select 
                className="w-full p-5 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none focus:border-[#6B806F] text-lg font-bold text-[#4A443C]"
                value={form.hora}
                onChange={e => setForm({...form, hora: e.target.value})}
              >
                <option value="" disabled>Seleccionar horario...</option>
                {opcionesHora.map(h => (
                  <option key={h} value={h}>{h} hs</option>
                ))}
              </select>
            </div>
          </section>

          <section className="space-y-4 border-t border-[#E8E3D9] pt-10">
            <label className="text-xs font-black text-[#8A8175] uppercase tracking-widest flex items-center gap-2">
              <FileText size={14} className="text-[#8C9C8E]" /> Notas o Motivo de la Sesión
            </label>
            <textarea 
              placeholder="Ej: Evaluación inicial, seguimiento mensual..." 
              className="w-full p-5 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none focus:border-[#6B806F] text-lg font-medium text-[#4A443C] resize-none placeholder:text-[#A49A8D]/60"
              rows={2}
              value={form.motivo}
              onChange={e => setForm({...form, motivo: e.target.value})}
            />
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-[#E8E3D9] pt-10">
            <div className="space-y-4">
              <label className="text-xs font-black text-[#8A8175] uppercase tracking-widest">Modalidad</label>
              <div className="flex bg-[#FBF9F6] rounded-[1.5rem] p-2 border border-[#E8E3D9]">
                <button 
                  onClick={(e) => { e.preventDefault(); setForm({...form, tipo_sesion: 'presencial'}); }} 
                  className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${form.tipo_sesion === 'presencial' ? 'bg-white text-[#556B5A] shadow-md' : 'text-[#A49A8D]'}`}
                >
                  <MapPin size={20} /> Presencial
                </button>
                <button 
                  onClick={(e) => { e.preventDefault(); setForm({...form, tipo_sesion: 'virtual'}); }} 
                  className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${form.tipo_sesion === 'virtual' ? 'bg-white text-[#556B5A] shadow-md' : 'text-[#A49A8D]'}`}
                >
                  <Video size={20} /> Virtual
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="text-xs font-black text-[#8A8175] uppercase tracking-widest">Valor de la Sesión ($)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-[#A49A8D]">$</span>
                <input 
                  type="number" 
                  className="w-full p-5 pl-10 bg-[#FBF9F6] border border-[#E8E3D9] focus:border-[#6B806F] rounded-2xl outline-none text-xl font-bold text-[#4A443C]" 
                  value={form.valor_sesion} 
                  onChange={e => setForm({...form, valor_sesion: e.target.value})} 
                />
              </div>
            </div>
          </section>

        </div>

        <div className="bg-[#FBF9F6] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-[#E8E3D9]">
          <p className="text-[#A49A8D] text-[10px] font-black uppercase tracking-widest text-center md:text-left">
            * Campos obligatorios para agendar
          </p>
          <button 
            onClick={guardarTurno} 
            disabled={enviando} 
            className="w-full md:w-auto px-12 py-5 bg-[#6B806F] hover:bg-[#556B5A] text-white rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl disabled:bg-[#A49A8D]"
          >
            {enviando ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
            {enviando ? "Verificando..." : "Confirmar Turno"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NuevoTurno() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-[#8C9C8E]" size={40} /></div>}>
      <FormularioNuevoTurno />
    </Suspense>
  );
}