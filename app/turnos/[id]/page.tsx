"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Calendar, Clock, User, Save, ArrowLeft, Video, MapPin, Check, FileText, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";

export default function EditarTurno() {
  const router = useRouter();
  const { id } = useParams();
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  
  const [form, setForm] = useState({
    fecha: "",
    hora: "",
    tipo_sesion: "presencial",
    valor_sesion: "",
    motivo: "",
    estado: "pendiente"
  });

  const [pacienteNombre, setPacienteNombre] = useState("");

  // 1. CARGAR EL TURNO AL ENTRAR
  useEffect(() => {
    async function traerTurno() {
      const { data, error } = await supabase
        .from('turnos')
        .select(`*, pacientes (nombre, apellido)`)
        .eq('id', id)
        .single();

      if (data) {
        setForm({
          fecha: data.fecha,
          hora: data.hora.slice(0, 5), // Cortamos los segundos
          tipo_sesion: data.tipo_sesion,
          valor_sesion: data.valor_sesion || "",
          motivo: data.motivo || "",
          estado: data.estado
        });
        setPacienteNombre(`${data.pacientes.apellido}, ${data.pacientes.nombre}`);
      }
      setCargando(false);
    }
    traerTurno();
  }, [id]);

  // 2. GUARDAR CAMBIOS
  const guardarCambios = async () => {
    setEnviando(true);
    const payload = {
      ...form,
      valor_sesion: form.valor_sesion === "" ? null : parseFloat(form.valor_sesion.toString())
    };

    const { error } = await supabase
      .from('turnos')
      .update(payload)
      .eq('id', id);

    if (!error) {
      router.push('/turnos');
    } else {
      alert("Error al actualizar: " + error.message);
      setEnviando(false);
    }
  };

  // 3. ELIMINAR TURNO (Por si te arrepentís)
  const eliminarTurno = async () => {
    if (confirm("¿Estás seguro de que querés borrar este turno?")) {
      const { error } = await supabase.from('turnos').delete().eq('id', id);
      if (!error) router.push('/turnos');
    }
  };

  if (cargando) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-[#6B806F]" size={48} />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-12">
      <div>
        <Link href="/turnos" className="inline-flex items-center gap-2 text-[#8A8175] hover:text-[#556B5A] mb-4 font-bold transition-all">
          <ArrowLeft size={18} /> Volver a la agenda
        </Link>
        <div className="flex items-center justify-between border-b border-[#E8E3D9] pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-[#F2EFE9] p-4 rounded-3xl text-[#6D645A]"><Clock size={28} /></div>
            <div>
              <h1 className="text-3xl font-bold text-[#4A443C]">Modificar Turno</h1>
              <p className="text-[#8A8175] text-sm mt-1">Editando la sesión de <span className="text-[#6B806F] font-bold">{pacienteNombre}</span></p>
            </div>
          </div>
          <button onClick={eliminarTurno} className="p-3 text-[#A49A8D] hover:text-[#B06043] hover:bg-[#FCEEE9] rounded-2xl transition-all" title="Eliminar Turno">
            <Trash2 size={22} />
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-[2rem] border border-[#E8E3D9] p-8 md:p-10 space-y-10">
        
        {/* FECHA Y HORA */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-sm font-bold text-[#8A8175] uppercase tracking-widest flex items-center gap-2"><Calendar size={16} className="text-[#8C9C8E]" /> Nueva Fecha</label>
            <input type="date" className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none font-medium" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-bold text-[#8A8175] uppercase tracking-widest flex items-center gap-2"><Clock size={16} className="text-[#8C9C8E]" /> Nuevo Horario</label>
            <input type="time" className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none font-medium" value={form.hora} onChange={e => setForm({...form, hora: e.target.value})} />
          </div>
        </section>

        {/* MOTIVO */}
        <section className="space-y-4 border-t border-[#E8E3D9] pt-8">
          <label className="text-sm font-bold text-[#8A8175] uppercase tracking-widest flex items-center gap-2"><FileText size={16} className="text-[#8C9C8E]" /> Notas de la sesión</label>
          <textarea 
            rows={2}
            className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none text-lg resize-none"
            value={form.motivo}
            onChange={e => setForm({...form, motivo: e.target.value})}
          />
        </section>

        {/* MODALIDAD Y VALOR */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-[#E8E3D9] pt-8">
          <div className="space-y-3">
            <label className="text-sm font-bold text-[#8A8175] uppercase tracking-widest">Modalidad</label>
            <div className="flex bg-[#FBF9F6] rounded-2xl p-1.5 border border-[#E8E3D9]">
              <button onClick={() => setForm({...form, tipo_sesion: 'presencial'})} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${form.tipo_sesion === 'presencial' ? 'bg-white text-[#556B5A] shadow-sm' : 'text-[#A49A8D]'}`}><MapPin size={18} /> Presencial</button>
              <button onClick={() => setForm({...form, tipo_sesion: 'virtual'})} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${form.tipo_sesion === 'virtual' ? 'bg-white text-[#556B5A] shadow-sm' : 'text-[#A49A8D]'}`}><Video size={18} /> Virtual</button>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-sm font-bold text-[#8A8175] uppercase tracking-widest">Valor de Sesión ($)</label>
            <input type="number" className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none text-xl font-bold" value={form.valor_sesion} onChange={e => setForm({...form, valor_sesion: e.target.value})} />
          </div>
        </section>

        <div className="flex justify-end pt-6 border-t border-[#E8E3D9]">
          <button onClick={guardarCambios} disabled={enviando} className="px-10 py-4 bg-[#6B806F] hover:bg-[#556B5A] text-white rounded-2xl font-bold flex items-center gap-3 transition-all shadow-md">
            <Save size={20} /> {enviando ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}