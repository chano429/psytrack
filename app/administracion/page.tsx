"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Receipt, 
  Loader2,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Building2,
  Lightbulb,
  GraduationCap
} from "lucide-react";

export const dynamic = 'force-dynamic';

export default function FinanzasDashboard() {
  const [cargando, setCargando] = useState(true);
  const [metricas, setMetricas] = useState({ ingresos: 0, gastos: 0, pendiente: 0, aLiquidar: 0 });
  const [pagos, setPagos] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [saldos, setSaldos] = useState<any[]>([]);

  // --- ESTADOS PARA NUEVO GASTO ---
  const [abrirGasto, setAbrirGasto] = useState(false);
  const [nuevoGasto, setNuevoGasto] = useState({ concepto: "", monto: "", categoria: "Alquiler" });
  const [guardandoGasto, setGuardandoGasto] = useState(false);

  const traerDatosFinancieros = async () => {
    try {
      // 1. Traer Ingresos (Turnos que fueron marcados como asistidos y tienen monto)
      const { data: dataTurnosCobrados } = await supabase
        .from('turnos')
        .select('*, pacientes(nombre, apellido)')
        .gt('monto_cobrado', 0) // Solo los que cobraron algo
        .order('fecha', { ascending: false })
        .limit(10);

      // 2. Traer Gastos del mes
      const { data: dataGastos } = await supabase
        .from('gastos')
        .select('*')
        .order('fecha', { ascending: false });

      // 3. Traer Saldos de Pacientes
      const { data: dataSaldos } = await supabase
        .from('pacientes')
        .select('id, nombre, apellido, saldo')
        .neq('saldo', 0)
        .order('saldo', { ascending: true });

      // Calcular métricas
      let totalIngresos = 0;
      let totalALiquidar = 0;

      if (dataTurnosCobrados) {
          dataTurnosCobrados.forEach(t => {
              const monto = Number(t.monto_cobrado);
              if (t.metodo_pago === 'Obra Social (A Liquidar)') {
                  totalALiquidar += monto;
              } else {
                  totalIngresos += monto; // Efectivo, MP, Transferencia entra acá
              }
          });
      }

      const totalGastos = dataGastos?.reduce((acc, g) => acc + Number(g.monto), 0) || 0;

      setMetricas({ 
          ingresos: totalIngresos, 
          gastos: totalGastos, 
          pendiente: 0, // Si querés manejar deudas de turnos no pagados, lo sumamos acá
          aLiquidar: totalALiquidar 
      });
      
      setPagos(dataTurnosCobrados || []);
      setGastos(dataGastos || []);
      setSaldos(dataSaldos || []);
      
    } catch (error) {
      console.error("Error cargando finanzas:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    traerDatosFinancieros();
  }, []);

  const guardarGasto = async () => {
    if (!nuevoGasto.concepto || !nuevoGasto.monto) return;
    setGuardandoGasto(true);

    const { error } = await supabase.from('gastos').insert([{
      concepto: nuevoGasto.concepto,
      monto: Number(nuevoGasto.monto),
      categoria: nuevoGasto.categoria,
      fecha: new Date().toISOString()
    }]);

    if (!error) {
      setAbrirGasto(false);
      setNuevoGasto({ concepto: "", monto: "", categoria: "Alquiler" });
      traerDatosFinancieros();
    } else {
      alert("Error al guardar el gasto. ¿Ya creaste la tabla 'gastos' en Supabase?");
    }
    setGuardandoGasto(false);
  };

  const getIconoGasto = (categoria: string) => {
    switch (categoria) {
      case 'Alquiler': return <Building2 size={18} className="text-[#8A8175]" />;
      case 'Servicios': return <Lightbulb size={18} className="text-[#B08943]" />;
      case 'Matrícula/Colegio': return <GraduationCap size={18} className="text-[#6B806F]" />;
      default: return <Receipt size={18} className="text-[#A49A8D]" />;
    }
  };

  if (cargando) return (
    <div className="flex items-center justify-center h-screen text-[#8A8175] bg-[#FBF9F6]">
      <Loader2 className="animate-spin" size={40} />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-20 animate-in fade-in duration-700">
      
      {/* CABECERA */}
      <div>
        <h1 className="text-4xl font-black text-[#4A443C] tracking-tight">Finanzas</h1>
        <p className="text-[#8A8175] font-medium mt-1">Gestión de honorarios, egresos y cuentas de pacientes.</p>
      </div>

      {/* KPI TARJETAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* INGRESOS LIQUIDOS */}
        <div className="bg-white border border-[#E8E3D9] p-7 rounded-3xl shadow-sm flex flex-col justify-between group hover:border-[#6B806F] transition-colors">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#FBF9F6] p-2.5 rounded-xl border border-[#E8E3D9] group-hover:bg-[#E8F0E9] group-hover:border-[#E8F0E9] transition-colors">
                    <TrendingUp size={18} className="text-[#6B806F]" />
                </div>
                <p className="text-[#8A8175] font-bold text-[11px] uppercase tracking-[0.15em]">Ingresos Líquidos</p>
            </div>
            <h3 className="text-3xl font-black text-[#4A443C]">${metricas.ingresos.toLocaleString('es-AR')}</h3>
        </div>

        {/* GASTOS */}
        <div className="bg-white border border-[#E8E3D9] p-7 rounded-3xl shadow-sm flex flex-col justify-between group hover:border-[#B06043] transition-colors">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#FBF9F6] p-2.5 rounded-xl border border-[#E8E3D9] group-hover:bg-[#FCEEE9] group-hover:border-[#FCEEE9] transition-colors">
                    <TrendingDown size={18} className="text-[#B06043]" />
                </div>
                <p className="text-[#8A8175] font-bold text-[11px] uppercase tracking-[0.15em]">Egresos</p>
            </div>
            <h3 className="text-3xl font-black text-[#4A443C]">${metricas.gastos.toLocaleString('es-AR')}</h3>
        </div>

        {/* GANANCIA NETA */}
        <div className="bg-[#FBF9F6] border border-[#E8E3D9] p-7 rounded-3xl shadow-sm flex flex-col justify-between group">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-white p-2.5 rounded-xl border border-[#E8E3D9]">
                    <Wallet size={18} className="text-[#A49A8D]" />
                </div>
                <p className="text-[#8A8175] font-bold text-[11px] uppercase tracking-[0.15em]">Ganancia Neta</p>
            </div>
            <h3 className={`text-3xl font-black ${(metricas.ingresos - metricas.gastos) >= 0 ? 'text-[#4A443C]' : 'text-[#B06043]'}`}>
              ${(metricas.ingresos - metricas.gastos).toLocaleString('es-AR')}
            </h3>
        </div>

        {/* A LIQUIDAR (OBRA SOCIAL) */}
        <div className="bg-[#E8F0E9] border border-[#D3DDD4] p-7 rounded-3xl shadow-sm flex flex-col justify-between group">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-white p-2.5 rounded-xl border border-[#D3DDD4]">
                    <Receipt size={18} className="text-[#556B5A]" />
                </div>
                <p className="text-[#556B5A] font-bold text-[11px] uppercase tracking-[0.15em]">A Liquidar (O.S.)</p>
            </div>
            <h3 className="text-3xl font-black text-[#556B5A]">${metricas.aLiquidar.toLocaleString('es-AR')}</h3>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        
        {/* COLUMNA IZQUIERDA: INGRESOS Y SALDOS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* CUENTAS CORRIENTES */}
          <div className="bg-white border border-[#E8E3D9] rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#4A443C]">Cuentas Corrientes</h2>
              <span className="text-[10px] uppercase tracking-widest font-black bg-[#F2EFE9] text-[#8A8175] px-3 py-1.5 rounded-full">Saldos</span>
            </div>
            
            <div className="space-y-4">
              {saldos.length > 0 ? (
                saldos.map(paciente => (
                  <div key={paciente.id} className="flex justify-between items-center p-5 bg-[#FBF9F6] rounded-2xl border border-[#E8E3D9] hover:border-[#6B806F] transition-colors group">
                    <div>
                      <p className="font-black text-[#4A443C]">{paciente.apellido}, {paciente.nombre}</p>
                      <p className="text-xs font-medium text-[#8A8175] mt-0.5">
                        {paciente.saldo > 0 ? 'Saldo a favor del paciente.' : 'Saldo adeudado al consultorio.'}
                      </p>
                    </div>
                    <div className={`font-black text-xl flex items-center gap-1.5 ${paciente.saldo > 0 ? 'text-[#6B806F]' : 'text-[#B06043]'}`}>
                      {paciente.saldo > 0 ? <ArrowUpRight size={20} strokeWidth={3}/> : <ArrowDownRight size={20} strokeWidth={3}/>}
                      ${Math.abs(paciente.saldo).toLocaleString('es-AR')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-[#A49A8D] text-sm font-medium italic border-2 border-dashed border-[#E8E3D9] rounded-2xl">
                  Todos los pacientes están al día.
                </div>
              )}
            </div>
          </div>

          {/* ÚLTIMOS INGRESOS */}
          <div>
            <h2 className="text-xl font-bold text-[#4A443C] mb-4 px-2">Últimos cobros registrados</h2>
            <div className="bg-white border border-[#E8E3D9] rounded-[2.5rem] overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FBF9F6] text-[#8A8175] text-[10px] font-black uppercase tracking-widest border-b border-[#E8E3D9]">
                    <th className="px-6 py-5">Paciente</th>
                    <th className="px-6 py-5">Fecha Sesión</th>
                    <th className="px-6 py-5">Método</th>
                    <th className="px-6 py-5 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EFE9]">
                  {pagos.length > 0 ? (
                    pagos.map((p) => {
                      const esLiquidacion = p.metodo_pago === 'Obra Social (A Liquidar)';
                      return (
                        <tr key={p.id} className="hover:bg-[#FBF9F6] transition-colors">
                          <td className="px-6 py-5 font-bold text-[#4A443C] capitalize">{p.pacientes?.apellido}, {p.pacientes?.nombre}</td>
                          <td className="px-6 py-5 text-[#8A8175] text-sm font-medium">{new Date(p.fecha).toLocaleDateString('es-AR')}</td>
                          <td className="px-6 py-5">
                             <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-md uppercase ${esLiquidacion ? 'bg-[#E8F0E9] text-[#556B5A]' : 'bg-[#F2EFE9] text-[#8A8175]'}`}>
                                {p.metodo_pago || 'Efectivo'}
                             </span>
                          </td>
                          <td className={`px-6 py-5 text-right font-black text-lg ${esLiquidacion ? 'text-[#556B5A]' : 'text-[#6B806F]'}`}>
                            {esLiquidacion ? '' : '+'} ${Number(p.monto_cobrado).toLocaleString('es-AR')}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-[#A49A8D] italic font-medium">Aún no hay cobros registrados. Se cargan desde la agenda.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: GASTOS */}
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white border border-[#E8E3D9] p-2 pr-4 rounded-2xl shadow-sm">
            <h2 className="text-sm font-bold text-[#4A443C] ml-4">Egresos fijos</h2>
            <button 
              onClick={() => setAbrirGasto(!abrirGasto)}
              className={`p-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 ${abrirGasto ? 'bg-[#FCEEE9] text-[#B06043]' : 'bg-[#F2EFE9] text-[#6D645A] hover:bg-[#E8E3D9]'}`}
            >
              {abrirGasto ? <AlertCircle size={16}/> : <Plus size={16}/>}
              {abrirGasto ? 'Cerrar' : 'Añadir'}
            </button>
          </div>

          {/* FORMULARIO DE NUEVO GASTO */}
          {abrirGasto && (
            <div className="bg-white border-2 border-[#E8E3D9] p-6 rounded-3xl shadow-sm animate-in slide-in-from-top-4">
              <h3 className="font-black text-[#4A443C] mb-4 text-sm">Registrar nuevo gasto</h3>
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Ej: Luz Edesur" 
                  value={nuevoGasto.concepto}
                  onChange={e => setNuevoGasto({...nuevoGasto, concepto: e.target.value})}
                  className="w-full bg-[#FBF9F6] border border-[#E8E3D9] rounded-xl p-3 text-sm font-medium text-[#4A443C] outline-none focus:border-[#A49A8D] transition-colors"
                />
                <div className="flex gap-2">
                  <span className="bg-[#F2EFE9] text-[#8A8175] flex items-center justify-center px-4 rounded-xl font-black">$</span>
                  <input 
                    type="number" 
                    placeholder="Monto" 
                    value={nuevoGasto.monto}
                    onChange={e => setNuevoGasto({...nuevoGasto, monto: e.target.value})}
                    className="w-full bg-[#FBF9F6] border border-[#E8E3D9] rounded-xl p-3 text-sm font-medium text-[#4A443C] outline-none focus:border-[#A49A8D] transition-colors"
                  />
                </div>
                <select 
                  value={nuevoGasto.categoria}
                  onChange={e => setNuevoGasto({...nuevoGasto, categoria: e.target.value})}
                  className="w-full bg-[#FBF9F6] border border-[#E8E3D9] rounded-xl p-3 text-sm font-medium outline-none focus:border-[#A49A8D] text-[#4A443C] transition-colors"
                >
                  <option>Alquiler</option>
                  <option>Servicios</option>
                  <option>Matrícula/Colegio</option>
                  <option>Otros</option>
                </select>
                <button 
                  onClick={guardarGasto}
                  disabled={guardandoGasto || !nuevoGasto.concepto || !nuevoGasto.monto}
                  className="w-full bg-[#4A443C] text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-[#312d28] disabled:opacity-50 transition-colors mt-2 shadow-sm"
                >
                  {guardandoGasto ? <Loader2 className="animate-spin" size={16}/> : 'Guardar Egreso'}
                </button>
              </div>
            </div>
          )}

          {/* LISTA DE GASTOS */}
          <div className="bg-white border border-[#E8E3D9] p-2 rounded-3xl shadow-sm">
            {gastos.length > 0 ? (
              <div className="divide-y divide-[#F2EFE9]">
                {gastos.map(g => (
                  <div key={g.id} className="flex justify-between items-center p-4 hover:bg-[#FBF9F6] rounded-2xl transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-[#FBF9F6] border border-[#E8E3D9] rounded-xl">
                        {getIconoGasto(g.categoria)}
                      </div>
                      <div>
                        <p className="font-bold text-[#4A443C] text-sm leading-tight mb-1">{g.concepto}</p>
                        <p className="text-[10px] text-[#A49A8D] font-black uppercase tracking-widest">{g.categoria}</p>
                      </div>
                    </div>
                    <span className="font-black text-[#B06043] text-lg">-${Number(g.monto).toLocaleString('es-AR')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-10 text-[#A49A8D] text-sm font-medium italic border-2 border-dashed border-[#E8E3D9] rounded-2xl m-2">
                Sin egresos cargados.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}