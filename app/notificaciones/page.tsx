"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Bell, Check, ArrowRight, Loader2, CalendarClock, User } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function NotificacionesPage() {
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const fetchSolicitudes = async () => {
    try {
      // 1. Traemos las notas (igual de infalible que en el menú)
      const { data: notas, error } = await supabase
        .from("notas_paciente")
        .select("*")
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;

      if (notas) {
        // 2. Filtramos solo los pedidos de turno
        const pedidos = notas.filter((n: any) => n.nota && n.nota.includes("Solicitud de turno"));

        if (pedidos.length > 0) {
          // 3. Traemos los datos de los pacientes
          const pacienteIds = pedidos.map((n: any) => n.paciente_id);
          const { data: pacientes } = await supabase
            .from("pacientes")
            .select("id, nombre, apellido")
            .in("id", pacienteIds);

          // 4. Unimos la información
          const solicitudesCompletas = pedidos.map((nota: any) => {
            // Transformamos ambos ID a String por las dudas
            const pac = pacientes?.find((p: any) => String(p.id) === String(nota.paciente_id));
            return {
              ...nota,
              pacientes: pac || { nombre: "Paciente", apellido: "Desconocido" }
            };
          });

          setSolicitudes(solicitudesCompletas);
        } else {
          setSolicitudes([]);
        }
      }
    } catch (err) {
      console.error("Error cargando notificaciones:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const resolver = async (id: number) => {
    // Borramos la nota de la base de datos para que ya no moleste
    await supabase.from("notas_paciente").delete().eq("id", id);
    // La sacamos de la pantalla al instante
    setSolicitudes(prev => prev.filter(s => s.id !== id));
  };

  if (cargando) return (
    <div className="flex items-center justify-center h-[70vh] text-[#8C9C8E]">
      <Loader2 className="animate-spin" size={40} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">
      
      {/* CABECERA */}
      <div className="flex items-center gap-5 mb-10 border-b border-[#E8E3D9] pb-8">
        <div className="bg-[#B06043] p-4 rounded-3xl text-white shadow-md relative overflow-hidden">
          <Bell size={36} className="relative z-10" />
          <div className="absolute -right-2 -bottom-2 opacity-20"><Bell size={40} /></div>
        </div>
        <div>
          <h1 className="text-4xl font-black text-[#4A443C] tracking-tight">Bandeja de Entrada</h1>
          <p className="text-[#8A8175] font-medium mt-1">
            {solicitudes.length === 0 
              ? "No tenés solicitudes pendientes." 
              : `Tenés ${solicitudes.length} ${solicitudes.length === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'} de procesar.`
            }
          </p>
        </div>
      </div>

      {/* LISTA DE NOTIFICACIONES */}
      <div className="grid gap-6">
        {solicitudes.length > 0 ? (
          solicitudes.map(sol => {
            // Le sacamos la parte robótica del sistema para que leas directo lo que pidió
            const textoLimpio = sol.nota.replace(/SISTEMA: Solicitud de turno.\s*/i, "");
            
            return (
              <div key={sol.id} className="bg-white border-2 border-[#E8E3D9] p-6 lg:p-8 rounded-[2.5rem] shadow-sm hover:border-[#B06043] hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group">
                
                {/* INFO DEL PEDIDO */}
                <div className="flex gap-5 items-start md:items-center">
                  <div className="bg-[#FCEEE9] p-4 rounded-2xl text-[#B06043] shrink-0">
                    <CalendarClock size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#4A443C] capitalize flex items-center gap-2">
                      <User size={18} className="text-[#A49A8D]"/> 
                      {sol.pacientes?.apellido}, {sol.pacientes?.nombre}
                    </h3>
                    <p className="text-[#4A443C] font-medium mt-2 bg-[#FBF9F6] p-3 rounded-xl border border-[#F2EFE9] inline-block">
                      {textoLimpio}
                    </p>
                    <p className="text-[10px] font-black text-[#A49A8D] uppercase mt-3 tracking-widest">
                      Recibido: {new Date(sol.fecha_creacion).toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
                
                {/* BOTONES DE ACCIÓN */}
                <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0 border-t md:border-t-0 border-[#F2EFE9] pt-4 md:pt-0">
                  <Link 
                    href={`/pacientes/${sol.paciente_id}`}
                    className="flex-1 md:flex-none bg-[#6B806F] text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#556B5A] transition-all shadow-sm"
                  >
                    Ver Ficha <ArrowRight size={18} />
                  </Link>
                  <button 
                    onClick={() => resolver(sol.id)}
                    className="bg-white border-2 border-[#E8E3D9] text-[#6D645A] px-6 py-4 rounded-2xl hover:bg-[#F2EFE9] hover:text-[#B06043] hover:border-[#FCEEE9] transition-all font-bold flex items-center justify-center gap-2 shadow-sm"
                    title="Marcar como resuelto"
                  >
                    <Check size={20} /> <span className="md:hidden">Marcar Resuelto</span>
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          // ESTADO VACÍO (Cuando ya resolviste todo)
          <div className="bg-[#FBF9F6] border-2 border-dashed border-[#E8E3D9] rounded-[3rem] p-20 text-center flex flex-col items-center">
            <div className="bg-[#E8F0E9] p-6 rounded-full text-[#6B806F] mb-6">
              <Check size={48} />
            </div>
            <h3 className="text-2xl font-black text-[#4A443C] mb-2">¡Bandeja limpia!</h3>
            <p className="text-[#8A8175] font-medium text-lg">No tenés solicitudes de turnos pendientes.</p>
          </div>
        )}
      </div>
    </div>
  );
}