"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet,
  Receipt,
  Loader2
} from "lucide-react";

export const dynamic = 'force-dynamic';

export default function Administracion() {
  const [metricas, setMetricas] = useState({ cobrado: 0, pendiente: 0 });
  const [pagosRecientes, setPagosRecientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const traerFinanzas = async () => {
    // 1. Traer todos los pagos del mes (Ingresos Reales)
    const { data: pagos } = await supabase
      .from('pagos')
      .select('*, pacientes(nombre, apellido)')
      .order('fecha_pago', { ascending: false });

    // 2. Calcular sesiones no pagadas (Lo que falta cobrar)
    const { data: pendientes } = await supabase
      .from('turnos')
      .select('valor_sesion')
      .eq('pagado', false);

    const totalCobrado = pagos?.reduce((acc, p) => acc + Number(p.monto), 0) || 0;
    const totalPendiente = pendientes?.reduce((acc, t) => acc + Number(t.valor_sesion), 0) || 0;

    setMetricas({ cobrado: totalCobrado, pendiente: totalPendiente });
    setPagosRecientes(pagos || []);
    setCargando(false);
  };

  useEffect(() => {
    traerFinanzas();
  }, []);

  if (cargando) return (
    <div className="flex items-center justify-center h-96 text-[#8A8175]">
      <Loader2 className="animate-spin" size={32} />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-20 animate-in fade-in duration-700">
      
      {/* CABECERA */}
      <div>
        <h1 className="text-4xl font-black text-[#4A443C] tracking-tight">Administración</h1>
        <p className="text-[#8A8175] font-medium mt-1">Control de honorarios y flujo de caja.</p>
      </div>

      {/* TARJETAS FINANCIERAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* INGRESOS */}
        <div className="bg-[#6B806F] p-8 rounded-[3rem] text-white shadow-xl flex justify-between items-center relative overflow-hidden">
            <div className="relative z-10">
                <p className="text-white/70 font-bold text-xs uppercase tracking-widest mb-2">Ingresos del Mes</p>
                <h3 className="text-5xl font-black">${metricas.cobrado.toLocaleString('es-AR')}</h3>
            </div>
            <div className="bg-white/20 p-4 rounded-full relative z-10">
                <TrendingUp size={40} />
            </div>
            {/* Adorno visual */}
            <div className="absolute -right-10 -top-10 bg-white/5 w-40 h-40 rounded-full"></div>
        </div>

        {/* PENDIENTES */}
        <div className="bg-white border-2 border-[#E8E3D9] p-8 rounded-[3rem] shadow-sm flex justify-between items-center">
            <div>
                <p className="text-[#A49A8D] font-bold text-xs uppercase tracking-widest mb-2">Pendiente de Cobro</p>
                <h3 className="text-5xl font-black text-[#B06043]">${metricas.pendiente.toLocaleString('es-AR')}</h3>
            </div>
            <div className="bg-[#FCEEE9] text-[#B06043] p-4 rounded-full">
                <AlertCircle size={40} />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-4">
        
        {/* LISTADO DE PAGOS RECIENTES */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-2xl font-bold text-[#4A443C]">Últimos ingresos</h2>
            <button className="text-sm font-bold text-[#6B806F] hover:underline">+ Registrar Pago</button>
          </div>

          <div className="bg-white border border-[#E8E3D9] rounded-[2.5rem] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FBF9F6] text-[#A49A8D] text-[10px] font-black uppercase tracking-widest">
                  <th className="px-8 py-4">Paciente</th>
                  <th className="px-8 py-4">Fecha</th>
                  <th className="px-8 py-4">Método</th>
                  <th className="px-8 py-4 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE9]">
                {pagosRecientes.length > 0 ? (
                  pagosRecientes.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FBF9F6] transition-colors">
                      <td className="px-8 py-5 font-bold text-[#4A443C]">{p.pacientes?.apellido}, {p.pacientes?.nombre}</td>
                      <td className="px-8 py-5 text-[#8A8175] text-sm">{new Date(p.fecha_pago).toLocaleDateString('es-AR')}</td>
                      <td className="px-8 py-5">
                         <span className="text-[10px] font-black px-2 py-1 bg-[#F2EFE9] text-[#6D645A] rounded-md uppercase">
                            {p.metodo_pago}
                         </span>
                      </td>
                      <td className="px-8 py-5 text-right font-black text-[#6B806F]">${Number(p.monto).toLocaleString('es-AR')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-[#A49A8D] italic">No hay pagos registrados este mes.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RESUMEN POR MÉTODO */}
        <div className="space-y-6">
           <h2 className="text-2xl font-bold text-[#4A443C] px-4">Resumen</h2>
           <div className="bg-white border border-[#E8E3D9] p-8 rounded-[2.5rem] space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#E8F0E9] text-[#556B5A] rounded-lg"><Wallet size={20}/></div>
                  <span className="font-bold text-[#4A443C]">Efectivo</span>
                </div>
                <span className="text-[#8A8175] font-medium">$0</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#F2EFE9] text-[#6D645A] rounded-lg"><ArrowUpRight size={20}/></div>
                  <span className="font-bold text-[#4A443C]">Transferencias</span>
                </div>
                <span className="text-[#8A8175] font-medium">$0</span>
              </div>
              <div className="pt-6 border-t border-[#F2EFE9]">
                 <p className="text-[10px] font-black text-[#A49A8D] uppercase mb-1">Total Proyectado</p>
                 <p className="text-2xl font-black text-[#4A443C]">${(metricas.cobrado + metricas.pendiente).toLocaleString('es-AR')}</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}