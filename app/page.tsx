"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Users,
  Calendar,
  Clock,
  UserPlus,
  CalendarPlus,
  Loader2,
  CheckCircle2,
  MessageCircle,
  FolderOpen
} from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function Home() {
  const [metricas, setMetricas] = useState({ pacientes: 0, turnosHoy: 0 });
  const [turnos, setTurnos] = useState<any[]>([]);
  const [turnosVencidos, setTurnosVencidos] = useState<any[]>([]); 
  const [cargando, setCargando] = useState(true);

  const traerDatos = async () => {
    const hoy = new Date().toLocaleDateString('sv-SE');

    const { count: pCount } = await supabase.from('pacientes').select('*', { count: 'exact', head: true });

    // Turnos de hoy
    const { data: turnosData } = await supabase
      .from('turnos')
      .select('*, pacientes(nombre, apellido, celular)')
      .eq('fecha', hoy)
      .order('hora', { ascending: true });

    // Turnos viejos que sigan "Agendados"
    const { data: turnosOlvidados } = await supabase
      .from('turnos')
      .select('id, fecha, hora, pacientes(nombre, apellido)')
      .lt('fecha', hoy) 
      .eq('estado', 'Agendado');

    setMetricas({
      pacientes: pCount || 0,
      turnosHoy: turnosData?.length || 0
    });
    setTurnos(turnosData || []);
    setTurnosVencidos(turnosOlvidados || []);
    setCargando(false);
  };

  useEffect(() => {
    traerDatos();
  }, []);

  if (cargando) return (
    <div className="flex items-center justify-center h-96 text-[#8A8175]">
      <Loader2 className="animate-spin" size={32} />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-10 pb-20 animate-in fade-in duration-700">

      {/* CABECERA LIMPIA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E8E3D9] pb-8">
        <div>
          <h1 className="text-4xl font-black text-[#4A443C] tracking-tight">Mi Consultorio</h1>
          <p className="text-[#8A8175] font-medium mt-2 capitalize">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/pacientes/nuevo" className="flex items-center gap-2 bg-[#6B806F] text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-[#556B5A] transition-all shadow-sm">
            <UserPlus size={18} /> Nuevo Paciente
          </Link>
          <Link href="/turnos" className="flex items-center gap-2 bg-white border border-[#E8E3D9] text-[#6D645A] px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-[#F2EFE9] transition-all shadow-sm">
            <CalendarPlus size={18} /> Agendar Turno
          </Link>
        </div>
      </div>

      {/* ALERTA DE TURNOS VENCIDOS */}
      {turnosVencidos && turnosVencidos.length > 0 && (
        <div className="bg-[#FCEEE9] border border-[#F5D8CE] p-5 rounded-2xl flex items-start gap-4 shadow-sm animate-in fade-in -mt-4">
          <div className="bg-white p-2 rounded-full text-[#B06043] shrink-0 shadow-sm mt-1">
            <Calendar size={20} />
          </div>
          <div>
            <h4 className="font-black text-[#8C3C2A] text-lg mb-1">
              Tenés {turnosVencidos.length} {turnosVencidos.length === 1 ? 'turno pendiente' : 'turnos pendientes'} de cierre
            </h4>
            <p className="text-[#B06043] font-medium text-sm leading-relaxed mb-3">
              Hay citas de días anteriores que aún figuran como "Agendadas". Para mantener tus estadísticas al día, recordá actualizarlas a <strong>Completado</strong> o <strong>Ausente</strong>.
            </p>
            <Link href="/turnos" className="inline-block text-xs font-bold bg-white text-[#B06043] px-4 py-2 rounded-lg shadow-sm border border-[#F5D8CE] hover:bg-[#FDF4E5] transition-colors">
              Revisar agenda
            </Link>
          </div>
        </div>
      )}

      {/* TARJETAS DE ESTADO RÁPIDO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-[#E8E3D9] shadow-sm">
          <p className="text-[10px] font-black text-[#A49A8D] uppercase tracking-[0.2em] mb-2">Pacientes Activos</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#4A443C]">{metricas.pacientes}</span>
            <Users size={18} className="text-[#A49A8D]" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-[#E8E3D9] shadow-sm">
          <p className="text-[10px] font-black text-[#A49A8D] uppercase tracking-[0.2em] mb-2">Sesiones para Hoy</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#556B5A]">{metricas.turnosHoy}</span>
            <Calendar size={18} className="text-[#556B5A]" />
          </div>
        </div>

        <div className="bg-[#F2EFE9] p-6 rounded-[2rem] border border-[#E8E3D9] shadow-sm">
          <p className="text-[10px] font-black text-[#6D645A] uppercase tracking-[0.2em] mb-2">Disponibilidad</p>
          <div className="w-full bg-white/50 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-[#6B806F] h-full transition-all duration-1000"
              style={{ width: `${Math.min((metricas.turnosHoy / 8) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-[10px] font-bold text-[#8A8175] mt-2">Capacidad diaria estimada: 8 sesiones</p>
        </div>
      </div>

      {/* LA AGENDA VIVA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-[#4A443C] flex items-center gap-3">
            <Clock className="text-[#6B806F]" /> Agenda del día
          </h2>

          <div className="space-y-4">
            {turnos.length > 0 ? (
              turnos.map((turno) => (
                <div key={turno.id} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white p-5 rounded-[2rem] border border-[#E8E3D9] hover:border-[#6B806F] transition-all shadow-sm">
                  
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="text-center min-w-[70px] shrink-0">
                      <span className="text-2xl font-black text-[#4A443C]">{turno.hora.slice(0, 5)}</span>
                    </div>
                    <div className="hidden sm:block h-10 w-[1px] bg-[#E8E3D9]"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#4A443C] text-lg leading-tight truncate capitalize" title={`${turno.pacientes?.apellido}, ${turno.pacientes?.nombre}`}>
                      {turno.pacientes?.apellido}, {turno.pacientes?.nombre}
                    </h4>
                    <span className="text-[10px] font-black text-[#A49A8D] uppercase tracking-widest">Sesión Individual</span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 sm:mt-0 shrink-0">
                    {turno.pacientes?.celular ? (
                      <a href={`https://wa.me/${turno.pacientes.celular.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-[#E8F0E9] text-[#25D366] rounded-xl hover:bg-[#25D366] hover:text-white transition-all shadow-sm" title="WhatsApp">
                        <MessageCircle size={20} />
                      </a>
                    ) : (
                      <div className="p-3 bg-[#F2EFE9] text-[#A49A8D] rounded-xl opacity-50 cursor-not-allowed" title="Sin celular registrado">
                        <MessageCircle size={20} />
                      </div>
                    )}
                    <Link href="/turnos" className="p-3 bg-[#FBF9F6] border border-[#E8E3D9] text-[#6D645A] rounded-xl hover:bg-[#E8E3D9] transition-all shadow-sm" title="Ir a Agenda">
                      <Calendar size={20} />
                    </Link>
                    <Link href={`/pacientes/${turno.paciente_id}`} className="p-3 bg-[#6B806F] text-white rounded-xl hover:bg-[#556B5A] transition-all shadow-sm" title="Abrir Ficha">
                      <FolderOpen size={20} />
                    </Link>
                  </div>

                </div>
              ))
            ) : (
              <div className="bg-[#FBF9F6] border-2 border-dashed border-[#E8E3D9] rounded-[2.5rem] p-16 text-center">
                <p className="text-[#A49A8D] font-bold italic">No hay sesiones agendadas para hoy.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <section className="bg-white p-8 rounded-[2.5rem] border border-[#E8E3D9] shadow-sm">
            <h3 className="font-bold text-[#4A443C] mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[#6B806F]" /> Tareas Clínicas
            </h3>
            <ul className="space-y-4 text-sm text-[#8A8175]">
              <li className="flex gap-3 items-start"><input type="checkbox" className="mt-1 rounded border-[#E8E3D9]" /><span>Completar evoluciones pendientes de ayer.</span></li>
              <li className="flex gap-3 items-start"><input type="checkbox" className="mt-1 rounded border-[#E8E3D9]" /><span>Revisar diagnóstico de García, M.</span></li>
            </ul>
          </section>

          <div className="bg-[#6B806F] p-8 rounded-[2.5rem] text-white shadow-lg">
            <h4 className="font-bold mb-2">Recordatorio Profesional</h4>
            <p className="text-white/80 text-xs leading-relaxed">
              La confidencialidad es la base del vínculo terapéutico. Asegurate de cerrar sesión si compartís equipo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}