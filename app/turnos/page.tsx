"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, 
  Check, 
  X, 
  Loader2, 
  Search,
  MessageCircle,
  User,
  Trash2,
  CalendarDays,
  ListFilter,
  ChevronLeft,
  ChevronRight,
  DollarSign 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AgendaTurnos() {
  const router = useRouter();
  const [turnos, setTurnos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  
  const [vista, setVista] = useState<"calendario" | "lista">("calendario");
  const [fechaBase, setFechaBase] = useState(new Date());

  const [valorDefecto, setValorDefecto] = useState("");
  const [modalCobro, setModalCobro] = useState({
    abierto: false,
    turnoId: null as number | null,
    nombre: "",
    monto: "",
    metodo: "Efectivo"
  });

  // --- REFERENCIA DE HOY PARA BLOQUEOS ---
  const hoyReal = new Date();
  hoyReal.setHours(0, 0, 0, 0);

  const traerTurnos = async () => {
    const { data } = await supabase
      .from('turnos')
      .select(`*, pacientes (nombre, apellido, celular)`)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });
    
    if (data) setTurnos(data);

    const { data: config } = await supabase.from('configuracion').select('valor_sesion_defecto').limit(1).single();
    if (config) setValorDefecto(config.valor_sesion_defecto?.toString() || "");

    setCargando(false);
  };

  useEffect(() => {
    traerTurnos();
  }, []);

  const formatearFechaArg = (fechaIso: string) => {
    if (!fechaIso) return "";
    const [y, m, d] = fechaIso.split('-');
    return `${d}/${m}/${y}`;
  };

  const procesarInfoFecha = (fechaIso: string) => {
    if (!fechaIso) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const [y, m, d] = fechaIso.split('-');
    const fechaTurno = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const diaSemana = dias[fechaTurno.getDay()];
    const esSabado = fechaTurno.getDay() === 6;
    const esDomingo = fechaTurno.getDay() === 0;
    const estaVencido = fechaTurno < hoy;
    return { diaSemana, esSabado, esDomingo, estaVencido };
  };

  const turnosFiltrados = turnos.filter((t) => {
    const query = busqueda.toLowerCase();
    const nombreCompleto = `${t.pacientes?.nombre} ${t.pacientes?.apellido}`.toLowerCase();
    const fechaArg = formatearFechaArg(t.fecha);
    return nombreCompleto.includes(query) || fechaArg.includes(query);
  });

  const turnosOrdenados = turnosFiltrados.sort((a, b) => {
    const estadosInactivos = ['cancelado', 'falto', 'asistio', 'completado'];
    const aInactivo = estadosInactivos.includes((a.estado || '').toLowerCase());
    const bInactivo = estadosInactivos.includes((b.estado || '').toLowerCase());
    if (aInactivo && !bInactivo) return 1;  
    if (!aInactivo && bInactivo) return -1; 
    return 0; 
  });

  const cambiarEstado = async (e: React.MouseEvent, id: number, nuevoEstado: string) => {
    e.preventDefault(); 
    e.stopPropagation();
    const { error } = await supabase.from('turnos').update({ estado: nuevoEstado }).eq('id', id);
    if (!error) {
      setTurnos(turnos.map(t => t.id === id ? { ...t, estado: nuevoEstado } : t));
    }
  };

  const abrirModalCobro = (e: React.MouseEvent, turno: any) => {
    e.preventDefault();
    e.stopPropagation();
    setModalCobro({
      abierto: true,
      turnoId: turno.id,
      nombre: `${turno.pacientes?.nombre} ${turno.pacientes?.apellido}`,
      monto: valorDefecto, 
      metodo: "Efectivo"
    });
  };

  const confirmarCobro = async () => {
    if (!modalCobro.turnoId) return;

    const { error } = await supabase.from('turnos').update({ 
      estado: 'asistio',
      monto_cobrado: parseFloat(modalCobro.monto) || 0,
      metodo_pago: modalCobro.metodo
    }).eq('id', modalCobro.turnoId);

    if (!error) {
      setTurnos(turnos.map(t => t.id === modalCobro.turnoId ? { 
        ...t, 
        estado: 'asistio',
        monto_cobrado: parseFloat(modalCobro.monto) || 0,
        metodo_pago: modalCobro.metodo
      } : t));
      setModalCobro({ ...modalCobro, abierto: false });
    } else {
      alert("Error al registrar el cobro.");
    }
  };

  const eliminarTurno = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("¿Estás seguro de que querés borrar este turno definitivamente?")) {
      const { error } = await supabase.from('turnos').delete().eq('id', id);
      if (!error) {
        setTurnos(turnos.filter(t => t.id !== id));
      } else {
        alert("Error al borrar: " + error.message);
      }
    }
  };

  const enviarWhatsApp = (e: React.MouseEvent, celular: string, nombre: string, hora: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!celular || celular.trim() === '') {
      alert(`No hay un número de celular registrado para ${nombre}.`);
      return;
    }
    const numeroLimpio = celular.replace(/\D/g, '');
    const horaFormateada = hora.slice(0, 5);
    const mensaje = encodeURIComponent(`Hola ${nombre}, ¿cómo estás? Te escribo para recordarte tu sesión de hoy a las ${horaFormateada}hs. ¡Nos vemos!`);
    window.open(`https://wa.me/${numeroLimpio}?text=${mensaje}`, '_blank');
  };

  const getEstadoEstilo = (estado: string) => {
    const est = estado?.toLowerCase();
    switch (est) {
      case 'asistio': 
      case 'completado': return 'bg-[#E8F0E9] text-[#556B5A] border-[#D3DDD4] opacity-70';
      case 'falto': 
      case 'cancelado': return 'bg-[#FCEEE9] text-[#B06043] border-[#F5D8CE] opacity-60';
      default: return 'bg-[#F2EFE9] text-[#6D645A] border-[#E8E3D9]';
    }
  };

  // --- ACÁ ARREGLAMOS PARA QUE MUESTRE DE LUNES A SÁBADO (6 DÍAS) ---
  const obtenerDiasSemana = (fecha: Date) => {
    const diaActual = fecha.getDay();
    const diferenciaLunes = diaActual === 0 ? -6 : 1 - diaActual; 
    const lunes = new Date(fecha);
    lunes.setDate(fecha.getDate() + diferenciaLunes);

    const semana = [];
    for (let i = 0; i < 6; i++) { // <-- Cambiamos el 5 por 6 para incluir el sábado
      const dia = new Date(lunes);
      dia.setDate(lunes.getDate() + i);
      semana.push(dia);
    }
    return semana;
  };

  const diasSemana = obtenerDiasSemana(fechaBase);
  
  // --- ACÁ ARREGLAMOS LOS HORARIOS (De 07:00 a 21:00) ---
  const horas = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];

  const cambiarSemana = (dias: number) => {
    const nuevaFecha = new Date(fechaBase);
    nuevaFecha.setDate(fechaBase.getDate() + dias);
    setFechaBase(nuevaFecha);
  };

  const irAHoy = () => setFechaBase(new Date());

  const buscarTurnoEnCalendario = (fecha: Date, horaStr: string) => {
    const fechaIso = fecha.toLocaleDateString('sv-SE'); 
    return turnos.find(t => t.fecha === fechaIso && t.hora.slice(0, 5) === horaStr);
  };

  const clickEnHueco = (fecha: Date, horaStr: string) => {
      if (fecha < hoyReal) {
          alert("No se pueden agendar turnos en fechas pasadas.");
          return;
      }
      const fechaIso = fecha.toLocaleDateString('sv-SE');
      router.push(`/turnos/nuevo?fecha=${fechaIso}&hora=${horaStr}`);
  }

  // --- VALIDACIÓN DE COBRO ---
  const faltaMontoCobro = modalCobro.monto === "";

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-20 animate-in fade-in duration-500">
      
      {/* MODAL DE COBRO */}
      {modalCobro.abierto && (
        <div className="fixed inset-0 z-[100] bg-[#4A443C]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-[#E8E3D9] animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-[#4A443C] flex items-center gap-2">
                <DollarSign className="text-[#6B806F]" /> Registrar Pago
              </h2>
              <button onClick={() => setModalCobro({...modalCobro, abierto: false})} className="text-[#A49A8D] hover:text-[#B06043] bg-[#F2EFE9] p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <p className="text-[#8A8175] font-medium mb-6">Confirmando asistencia y cobro para <strong className="text-[#4A443C] capitalize">{modalCobro.nombre}</strong>.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-[#A49A8D] uppercase tracking-widest mb-2">Monto Cobrado *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#8A8175]">$</span>
                  <input 
                    type="number" 
                    className="w-full p-4 pl-10 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none focus:border-[#6B806F] font-black text-[#6B806F] text-xl"
                    value={modalCobro.monto}
                    onChange={(e) => setModalCobro({...modalCobro, monto: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#A49A8D] uppercase tracking-widest mb-2">Método de Pago</label>
                <select 
                  className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none focus:border-[#6B806F] font-bold text-[#4A443C]"
                  value={modalCobro.metodo}
                  onChange={(e) => setModalCobro({...modalCobro, metodo: e.target.value})}
                >
                  <option value="Efectivo">💵 Efectivo</option>
                  <option value="MercadoPago / App">📱 MercadoPago / App</option>
                  <option value="Transferencia">🏦 Transferencia Bancaria</option>
                  <option value="Obra Social (A Liquidar)">🏥 Obra Social (A Liquidar)</option>
                </select>
              </div>

              <button 
                onClick={confirmarCobro}
                disabled={faltaMontoCobro}
                className={`w-full text-white py-4 rounded-2xl font-bold text-lg shadow-sm mt-2 transition-all ${
                  faltaMontoCobro ? "bg-[#A49A8D] opacity-50 cursor-not-allowed" : "bg-[#6B806F] hover:bg-[#556B5A]"
                }`}
              >
                Confirmar y Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E8E3D9] pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-[#4A443C] tracking-tight">Agenda de Sesiones</h1>
          <p className="text-[#8A8175] font-medium mt-2 text-sm md:text-base">Gestión de horarios y asistencia.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-[#F2EFE9] p-1.5 rounded-2xl border border-[#E8E3D9]">
            <button 
              onClick={() => setVista("calendario")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${vista === "calendario" ? "bg-white text-[#4A443C] shadow-sm" : "text-[#8A8175] hover:text-[#6D645A]"}`}
            >
              <CalendarDays size={16}/> Calendario
            </button>
            <button 
              onClick={() => setVista("lista")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${vista === "lista" ? "bg-white text-[#4A443C] shadow-sm" : "text-[#8A8175] hover:text-[#6D645A]"}`}
            >
              <ListFilter size={16}/> Lista
            </button>
          </div>

          <Link href="/turnos/nuevo" className="flex items-center justify-center gap-2 bg-[#6B806F] hover:bg-[#556B5A] text-white px-6 py-2.5 rounded-2xl font-bold transition-all shadow-sm">
            <Plus size={18} /> Nuevo
          </Link>
        </div>
      </div>

      {cargando ? (
        <div className="p-20 flex flex-col items-center justify-center text-[#8A8175]">
          <Loader2 className="animate-spin mb-4 text-[#8C9C8E]" size={40} />
          <p className="font-bold text-sm">Sincronizando agenda...</p>
        </div>
      ) : vista === "calendario" ? (
        
        <div className="bg-white border border-[#E8E3D9] rounded-[2.5rem] shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-[#FBF9F6] px-6 py-4 flex items-center justify-between border-b border-[#E8E3D9]">
                <div className="flex items-center gap-2">
                    <button onClick={() => cambiarSemana(-7)} className="p-2 bg-white border border-[#E8E3D9] rounded-xl text-[#6D645A] hover:bg-[#E8E3D9] transition-colors"><ChevronLeft size={20}/></button>
                    <button onClick={() => cambiarSemana(7)} className="p-2 bg-white border border-[#E8E3D9] rounded-xl text-[#6D645A] hover:bg-[#E8E3D9] transition-colors"><ChevronRight size={20}/></button>
                    <button onClick={irAHoy} className="px-4 py-2 ml-2 bg-white border border-[#E8E3D9] rounded-xl text-sm font-bold text-[#4A443C] hover:bg-[#E8E3D9] transition-colors">Hoy</button>
                </div>
                <h2 className="text-lg font-black text-[#4A443C] capitalize hidden md:block">
                    {diasSemana[0].toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                </h2>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* AHORA TIENE GRID-COLS-7 (1 HORA + 6 DIAS) */}
                    <div className="grid grid-cols-7 border-b border-[#E8E3D9] bg-white">
                        <div className="p-4 text-center border-r border-[#E8E3D9]/50">
                            <span className="text-[10px] font-black text-[#A49A8D] uppercase tracking-widest">Hora</span>
                        </div>
                        {diasSemana.map((dia, i) => {
                            const esHoy = dia.toLocaleDateString() === new Date().toLocaleDateString();
                            return (
                                <div key={i} className="p-4 text-center border-r border-[#E8E3D9]/50 last:border-0">
                                    <span className={`block text-xs font-bold uppercase mb-1 ${esHoy ? 'text-[#B06043]' : 'text-[#8A8175]'}`}>
                                        {dia.toLocaleDateString('es-AR', { weekday: 'short' })}
                                    </span>
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-lg font-black ${esHoy ? 'bg-[#B06043] text-white shadow-sm' : 'text-[#4A443C]'}`}>
                                        {dia.getDate()}
                                    </span>
                                </div>
                            )
                        })}
                    </div>

                    <div className="bg-[#FBF9F6]">
                        {horas.map(hora => (
                            <div key={hora} className="grid grid-cols-7 border-b border-[#E8E3D9]/50 group relative">
                                <div className="p-3 text-center border-r border-[#E8E3D9]/50 flex items-center justify-center bg-white relative z-10">
                                    <span className="text-xs font-bold text-[#A49A8D]">{hora}</span>
                                </div>

                                {diasSemana.map((dia, i) => {
                                    const turno = buscarTurnoEnCalendario(dia, hora);
                                    const esPasado = dia < hoyReal;
                                    
                                    return (
                                        <div key={`${i}-${hora}`} className="border-r border-[#E8E3D9]/50 last:border-0 relative h-16 sm:h-20 bg-white">
                                            {turno ? (
                                                <Link 
                                                    href={`/pacientes/${turno.paciente_id}`}
                                                    className={`absolute inset-1 p-2 rounded-xl border flex flex-col justify-center overflow-hidden transition-all hover:shadow-md hover:scale-[1.02] z-20 ${getEstadoEstilo(turno.estado || 'Pendiente')}`}
                                                >
                                                    <span className="font-black text-xs truncate capitalize">{turno.pacientes?.apellido}, {turno.pacientes?.nombre}</span>
                                                    <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5 opacity-80 truncate">{turno.estado || 'Pendiente'}</span>
                                                </Link>
                                            ) : (
                                                <div 
                                                    onClick={() => clickEnHueco(dia, hora)}
                                                    className={`w-full h-full flex items-center justify-center transition-colors group/hueco ${esPasado ? 'bg-[#F9F7F2] cursor-not-allowed' : 'cursor-pointer hover:bg-[#F2EFE9]'}`}
                                                    title={esPasado ? "No se puede agendar en el pasado" : "Agendar aquí"}
                                                >
                                                    {!esPasado && <Plus size={16} className="text-[#A49A8D] opacity-0 group-hover/hueco:opacity-100 transition-opacity" />}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

      ) : (

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="relative group mb-6">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A49A8D] group-focus-within:text-[#6B806F] transition-colors" size={20} />
                <input 
                type="text"
                placeholder="Buscá por nombre o fecha (Ej: 07/04/2026)..."
                className="w-full p-4 pl-14 bg-white border border-[#E8E3D9] rounded-[1.5rem] md:rounded-[2rem] outline-none focus:border-[#6B806F] transition-all shadow-sm text-base md:text-lg text-[#4A443C] placeholder:text-[#A49A8D]/60"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-4 md:gap-5">
                {turnosOrdenados.length === 0 ? (
                <div className="bg-[#FBF9F6] border-2 border-dashed border-[#E8E3D9] rounded-[2rem] md:rounded-[3rem] p-12 md:p-24 text-center">
                    <p className="text-[#6D645A] font-bold text-lg md:text-xl">No hay nada para "{busqueda}"</p>
                </div>
                ) : (
                turnosOrdenados.map((turno) => {
                    const infoFecha = procesarInfoFecha(turno.fecha);
                    const estadoActual = turno.estado || 'Pendiente';
                    const esPendiente = estadoActual.toLowerCase() === 'pendiente';

                    return (
                        <div key={turno.id} className="relative group">
                            <Link 
                            href={`/pacientes/${turno.paciente_id}`}
                            className={`bg-white border border-[#E8E3D9] rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-6 hover:border-[#6B806F] transition-all shadow-sm hover:shadow-md ${getEstadoEstilo(estadoActual).includes('opacity') ? 'opacity-60 hover:opacity-100' : ''}`}
                            >
                            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 w-full md:flex-1">
                                <div className="flex flex-row md:flex-col items-center justify-between md:justify-center bg-[#FBF9F6] p-3 md:p-4 rounded-xl md:rounded-[1.5rem] border border-[#E8E3D9] min-w-full md:min-w-[110px] shadow-inner">
                                <p className="text-2xl md:text-3xl font-black text-[#4A443C] tracking-tighter leading-none">
                                    {turno.hora.slice(0, 5)}
                                </p>
                                <div className="flex flex-row md:flex-col items-center gap-2 md:gap-0 md:mt-2 leading-tight">
                                    <span className={`text-sm font-bold 
                                    ${infoFecha?.esSabado ? 'text-[#4A6FA5]' : infoFecha?.esDomingo ? 'text-[#B06043]' : 'text-[#8A8175]'}`}
                                    >
                                    {infoFecha?.diaSemana}
                                    </span>
                                    <span className="text-sm md:text-xs font-bold text-[#6B806F]">
                                    {formatearFechaArg(turno.fecha).slice(0, 5)}
                                    </span>
                                </div>
                                </div>

                                <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className={`text-[10px] uppercase tracking-widest font-black px-3 py-1.5 rounded-md border capitalize ${getEstadoEstilo(estadoActual)}`}>
                                    {estadoActual}
                                    </span>
                                    
                                    {infoFecha?.estaVencido && esPendiente && (
                                        <span className="text-[10px] uppercase tracking-widest font-black text-[#B06043] bg-[#FCEEE9] px-3 py-1.5 rounded-md">
                                        Vencido
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xl md:text-2xl font-black text-[#4A443C] tracking-tight group-hover:text-[#6B806F] transition-colors line-clamp-1 capitalize">
                                    {turno.pacientes?.apellido}, {turno.pacientes?.nombre}
                                </h3>
                                </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-start gap-2 md:gap-3 bg-[#FBF9F6] p-2 md:p-3 rounded-xl md:rounded-[1.5rem] border border-[#E8E3D9] relative z-10 shadow-inner w-full md:w-auto">
                                <div className="flex gap-2">
                                <button 
                                    onClick={(e) => enviarWhatsApp(e, turno.pacientes?.celular, turno.pacientes?.nombre, turno.hora)}
                                    className="px-4 md:px-5 py-2 md:py-3 rounded-xl text-xs font-black transition-all text-[#8A8175] hover:text-[#25D366] hover:bg-[#E8F0E9] bg-white border border-[#E8E3D9] shadow-sm"
                                    title="Enviar recordatorio por WhatsApp"
                                >
                                    <MessageCircle size={18} />
                                </button>

                                <button 
                                    onClick={(e) => abrirModalCobro(e, turno)}
                                    className={`px-5 py-3 rounded-xl text-xs font-black transition-all bg-white border border-[#E8E3D9] shadow-sm ${estadoActual.toLowerCase() === 'asistio' ? 'bg-[#6B806F] border-[#6B806F] text-white shadow-md' : 'text-[#8A8175] hover:text-[#556B5A] hover:bg-[#E8F0E9]'}`}
                                    title="Marcar como asistió y registrar pago"
                                >
                                    <Check size={18} strokeWidth={3}/>
                                </button>

                                <button 
                                    onClick={(e) => cambiarEstado(e, turno.id, 'falto')}
                                    className={`px-5 py-3 rounded-xl text-xs font-black transition-all bg-white border border-[#E8E3D9] shadow-sm ${estadoActual.toLowerCase() === 'falto' ? 'bg-[#B06043] border-[#B06043] text-white shadow-md' : 'text-[#8A8175] hover:text-[#B06043] hover:bg-[#FCEEE9]'}`}
                                    title="Marcar como faltó"
                                >
                                    <X size={18} strokeWidth={3}/>
                                </button>

                                <button 
                                    onClick={(e) => eliminarTurno(e, turno.id)}
                                    className="px-5 py-3 rounded-xl text-xs font-black transition-all text-[#8A8175] hover:text-[#B06043] hover:bg-[#FCEEE9] bg-white border border-[#E8E3D9] shadow-sm ml-2"
                                    title="Borrar turno definitivamente"
                                >
                                    <Trash2 size={18} />
                                </button>
                                </div>
                            </div>
                            </Link>
                        </div>
                    );
                })
                )}
            </div>
        </div>
      )}
    </div>
  );
}