"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { BarChart2, AlertTriangle, Users, Activity, FileText, ArrowRight, TrendingUp, Check } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function ResultadosPage() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const traerDatos = async () => {
      // Traemos todos los pacientes
      const { data: dataPacientes } = await supabase.from('pacientes').select('*');
      if (dataPacientes) setPacientes(dataPacientes);

      // Traemos todas las evaluaciones
      const { data: dataEvaluaciones } = await supabase.from('evaluaciones').select('*').order('fecha', { ascending: false });
      if (dataEvaluaciones) setEvaluaciones(dataEvaluaciones);

      setCargando(false);
    };
    
    traerDatos();
  }, []);

  // PROCESAMIENTO DE DATOS PARA LAS MÉTRICAS
  const totalPacientes = pacientes.length;
  const evaluacionesTotales = evaluaciones.length;

  // Filtrar pacientes en riesgo (que hayan tenido resultado "Severa" en alguna métrica)
  const pacientesEnRiesgo = evaluaciones.filter(ev => {
    return ev.resultados?.some((res: any) => res.severidad.includes('Severa') || res.puntaje >= 15);
  });

  // Agrupar para no mostrar al mismo paciente dos veces en las alertas
  const alertasUnicas = pacientesEnRiesgo.reduce((acc: any[], current) => {
    const x = acc.find(item => item.paciente_id === current.paciente_id);
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, []);

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-[#8A8175]">
        <Activity className="animate-pulse mb-3 text-[#8C9C8E]" size={40} />
        <p className="font-bold">Calculando métricas del consultorio...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-32 animate-in fade-in duration-500">
      
      {/* ENCABEZADO */}
      <div>
        <h1 className="text-3xl font-black text-[#4A443C] tracking-tight">Métricas y Resultados</h1>
        <p className="text-[#8A8175] font-medium mt-2 text-lg">Visión general del estado clínico de tus pacientes.</p>
      </div>

      {/* TARJETAS DE RESUMEN (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-[#E8E3D9] shadow-sm flex items-center gap-5">
          <div className="bg-[#E8F0E9] p-4 rounded-2xl text-[#556B5A]"><Users size={28} /></div>
          <div>
            <p className="text-sm font-bold text-[#8A8175]">Pacientes totales</p>
            <p className="text-3xl font-black text-[#4A443C]">{totalPacientes}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] border border-[#E8E3D9] shadow-sm flex items-center gap-5">
          <div className="bg-[#FBF9F6] p-4 rounded-2xl text-[#8C9C8E] border border-[#E8E3D9]"><FileText size={28} /></div>
          <div>
            <p className="text-sm font-bold text-[#8A8175]">Tests realizados</p>
            <p className="text-3xl font-black text-[#4A443C]">{evaluacionesTotales}</p>
          </div>
        </div>

        <div className="bg-[#FCEEE9] p-6 rounded-[2rem] border border-[#F5D8CE] shadow-sm flex items-center gap-5">
          <div className="bg-white p-4 rounded-2xl text-[#B06043] shadow-sm"><AlertTriangle size={28} /></div>
          <div>
            <p className="text-sm font-bold text-[#B06043]">Alertas clínicas</p>
            <p className="text-3xl font-black text-[#8C3C2A]">{alertasUnicas.length}</p>
          </div>
        </div>
      </div>

      {/* SECCIÓN PRINCIPAL: PACIENTES EN SEGUIMIENTO PRIORITARIO */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-[#E8E3D9] shadow-sm">
        <div className="flex items-center gap-3 mb-8 border-b border-[#F2EFE9] pb-4">
          <TrendingUp size={24} className="text-[#B06043]" />
          <h2 className="text-xl font-bold text-[#4A443C]">Pacientes en Seguimiento Prioritario</h2>
        </div>

        {alertasUnicas.length === 0 ? (
          <div className="text-center py-12 bg-[#FBF9F6] rounded-3xl border border-[#E8E3D9]">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-[#E8E3D9]">
              <Check size={32} className="text-[#556B5A]" />
            </div>
            <h3 className="text-lg font-bold text-[#4A443C] mb-1">Todo bajo control</h3>
            <p className="text-[#8A8175] font-medium text-sm">No hay pacientes con resultados severos recientes en GAD-7 o PHQ-9.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alertasUnicas.map((evaluacion, index) => {
              // Buscar los datos del paciente asociado a esta evaluación
              const pac = pacientes.find(p => p.id === evaluacion.paciente_id);
              
              return (
                <div key={index} className="flex flex-col md:flex-row md:items-center justify-between bg-[#FBF9F6] p-5 rounded-2xl border border-[#E8E3D9] hover:border-[#B06043]/50 transition-all group">
                  <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-[#E8E3D9] text-[#B06043]">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#4A443C] text-lg">
                        {pac ? `${pac.apellido}, ${pac.nombre}` : 'Paciente Desconocido'}
                      </h4>
                      <p className="text-[#8A8175] text-sm font-medium mt-0.5">
                        Última evaluación: {new Date(evaluacion.fecha).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:gap-6">
                    {/* Mostrar los puntajes de riesgo */}
                    <div className="flex gap-2">
                      {evaluacion.resultados.map((res: any, idx: number) => (
                         <div key={idx} className={`px-3 py-1.5 rounded-lg border flex flex-col items-center min-w-[80px] ${res.puntaje >= 15 ? 'bg-[#FCEEE9] border-[#F5D8CE]' : 'bg-white border-[#E8E3D9]'}`}>
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#8A8175]">{res.nombre.includes('PHQ') ? 'PHQ-9' : 'GAD-7'}</span>
                            <span className={`text-lg font-black leading-none mt-1 ${res.puntaje >= 15 ? 'text-[#B06043]' : 'text-[#4A443C]'}`}>{res.puntaje}</span>
                         </div>
                      ))}
                    </div>
                    
                    {pac && (
                      <Link href={`/pacientes/${pac.id}`} className="flex items-center gap-2 bg-white text-[#4A443C] border border-[#E8E3D9] px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#4A443C] hover:text-white transition-all shadow-sm">
                        Ver ficha <ArrowRight size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GRÁFICO PLACEHOLDER (Para futura expansión) */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-[#E8E3D9] shadow-sm opacity-60">
        <div className="flex items-center gap-3 mb-6 border-b border-[#F2EFE9] pb-4">
          <BarChart2 size={24} className="text-[#8C9C8E]" />
          <h2 className="text-xl font-bold text-[#4A443C]">Evolución General Promedio</h2>
        </div>
        <div className="h-48 flex items-center justify-center bg-[#FBF9F6] rounded-2xl border border-dashed border-[#E8E3D9]">
           <p className="text-[#8A8175] font-bold text-sm">Necesitamos más datos para generar la curva de evolución.</p>
        </div>
      </div>

    </div>
  );
}