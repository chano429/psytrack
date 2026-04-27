"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Save, Calendar as CalendarIcon, Clock, User, FileText, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EditarTurno() {
  const router = useRouter();
  const params = useParams();
  const idTurno = params.id;

  const [pacientes, setPacientes] = useState<any[]>([]);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const fechaActual = new Date();
  fechaActual.setMinutes(fechaActual.getMinutes() - fechaActual.getTimezoneOffset());
  const hoy = fechaActual.toISOString().split('T')[0];

  const [form, setForm] = useState({
    paciente_id: "",
    fecha: "",
    hora: "",
    motivo: ""
  });

  useEffect(() => {
    async function traerDatos() {
      // 1. Traemos la lista de pacientes para el desplegable
      const { data: dataPacientes } = await supabase
        .from('pacientes')
        .select('id, nombre, apellido')
        .order('apellido', { ascending: true });
      if (dataPacientes) setPacientes(dataPacientes);

      // 2. Traemos los datos de ESTE turno en particular
      const { data: dataTurno } = await supabase
        .from('turnos')
        .select('*')
        .eq('id', idTurno)
        .single();
      
      if (dataTurno) {
        setForm({
          paciente_id: dataTurno.paciente_id,
          fecha: dataTurno.fecha,
          hora: dataTurno.hora,
          motivo: dataTurno.motivo || ""
        });
      }
      setCargandoInicial(false);
    }
    if (idTurno) traerDatos();
  }, [idTurno]);

  const actualizar = async () => {
    if (!form.paciente_id || !form.fecha || !form.hora) {
      alert("Por favor, seleccioná un Paciente, una Fecha y una Hora.");
      return;
    }
    
    if (form.fecha < hoy) {
      alert("No podés re-agendar un turno para el pasado.");
      return;
    }

    setEnviando(true);
    
    // Usamos .update() en lugar de insert
    const { error } = await supabase
      .from('turnos')
      .update({
        paciente_id: form.paciente_id,
        fecha: form.fecha,
        hora: form.hora,
        motivo: form.motivo
      })
      .eq('id', idTurno);

    if (error) {
      alert("Error al actualizar: " + error.message);
      setEnviando(false);
    } else {
      setMensaje("¡Turno actualizado!");
      setTimeout(() => {
        router.push('/turnos');
      }, 1500);
    }
  };

  if (cargandoInicial) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#8A8175]">
        <Loader2 className="animate-spin mb-3 text-[#8C9C8E]" size={40} />
        <p className="font-medium text-lg text-[#6D645A]">Abriendo turno...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-12">
      
      <div>
        <Link href="/turnos" className="inline-flex items-center gap-2 text-[#8A8175] hover:text-[#556B5A] font-medium transition-colors mb-4">
          <ArrowLeft size={18} /> Volver a la agenda
        </Link>
        <div className="flex items-center gap-4 border-b border-[#E8E3D9] pb-6">
          <div className="bg-[#E8F0E9] p-4 rounded-3xl text-[#556B5A]">
            <CalendarIcon size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#4A443C]">Reprogramar Sesión</h1>
            <p className="text-[#8A8175] text-sm mt-1 font-medium tracking-wide">Modificá el día, horario o el paciente asignado.</p>
          </div>
        </div>
      </div>

      <div className="bg-[#FFFFFF] shadow-sm rounded-[2rem] border border-[#E8E3D9] overflow-hidden">
        <div className="p-8 md:p-10 space-y-8">
          
          <section>
            <label className="text-sm font-bold text-[#8A8175] uppercase tracking-widest mb-4 flex items-center gap-2">
              <User size={16} className="text-[#8C9C8E]" /> Paciente *
            </label>
            <select 
              className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl focus:ring-2 focus:ring-[#8C9C8E] focus:bg-white outline-none transition text-[#4A443C] font-medium"
              value={form.paciente_id}
              onChange={e => setForm({...form, paciente_id: e.target.value})}
            >
              <option value="">-- Seleccioná un paciente de tu lista --</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.apellido}, {p.nombre}</option>
              ))}
            </select>
          </section>

          <hr className="border-[#E8E3D9]" />

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-bold text-[#8A8175] uppercase tracking-widest mb-4 flex items-center gap-2">
                <CalendarIcon size={16} className="text-[#8C9C8E]" /> Nueva Fecha *
              </label>
              <input 
                type="date" 
                min={hoy} 
                className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl focus:ring-2 focus:ring-[#8C9C8E] focus:bg-white outline-none transition text-[#4A443C]"
                value={form.fecha}
                onChange={e => setForm({...form, fecha: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-bold text-[#8A8175] uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock size={16} className="text-[#8C9C8E]" /> Nuevo Horario *
              </label>
              <input 
                type="time" 
                className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl focus:ring-2 focus:ring-[#8C9C8E] focus:bg-white outline-none transition text-[#4A443C]"
                value={form.hora}
                onChange={e => setForm({...form, hora: e.target.value})}
              />
            </div>
          </section>

          <hr className="border-[#E8E3D9]" />

          <section>
            <label className="text-sm font-bold text-[#8A8175] uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText size={16} className="text-[#8C9C8E]" /> Notas / Motivo (Opcional)
            </label>
            <input 
              placeholder="Ej: Primera entrevista, sesión regular, entrega de informe..." 
              className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl focus:ring-2 focus:ring-[#8C9C8E] focus:bg-white outline-none transition text-[#4A443C] placeholder:text-[#A49A8D]"
              value={form.motivo}
              onChange={e => setForm({...form, motivo: e.target.value})}
            />
          </section>

        </div>

        <div className="bg-[#FBF9F6] p-8 flex flex-col sm:flex-row items-center justify-between border-t border-[#E8E3D9] gap-6">
          <p className="text-sm text-[#8A8175] flex items-center gap-2 font-medium">
            Los campos marcados con (*) son obligatorios.
          </p>
          <button 
            onClick={actualizar}
            disabled={enviando}
            className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 text-[#FBF9F6] w-full sm:w-auto shadow-sm
              ${enviando ? 'bg-[#A49A8D] cursor-not-allowed' : 'bg-[#6B806F] hover:bg-[#556B5A] active:scale-95'}`}
          >
            {enviando ? "Guardando..." : <><Save size={20} /> Actualizar Turno</>}
          </button>
        </div>
      </div>

      {mensaje && (
        <div className="fixed bottom-10 right-10 bg-[#E8F0E9] border border-[#D3DDD4] text-[#556B5A] px-6 py-4 rounded-2xl shadow-xl font-bold flex items-center gap-3 animate-in slide-in-from-bottom-8">
          <CheckCircle size={24} className="text-[#6B806F]" /> {mensaje}
        </div>
      )}

    </div>
  );
}