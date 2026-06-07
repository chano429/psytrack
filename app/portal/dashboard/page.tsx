"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Calendar,
  Clock,
  Heart,
  Loader2,
  Send,
  Check,
  Wind,
  Sparkles,
  X,
  Flower2,
  AlertTriangle,
  CalendarPlus,
} from "lucide-react";

export const dynamic = "force-dynamic";

function PortalContenido() {
  const router = useRouter();

  const [paciente, setPaciente] = useState<any>(null);
  const [proximoTurno, setProximoTurno] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  const [errorMensaje, setErrorMensaje] = useState("");

  const [nota, setNota] = useState("");
  const [enviandoNota, setEnviandoNota] = useState(false);
  const [notaEnviada, setNotaEnviada] = useState(false);

  // --- ESTADOS DEL FORMULARIO DE TURNOS Y PENDIENTES ---
  const [abrirFormTurno, setAbrirFormTurno] = useState(false);
  const [pidiendoTurno, setPidiendoTurno] = useState(false);
  const [turnoPedidoExito, setTurnoPedidoExito] = useState(false);
  const [prefDias, setPrefDias] = useState<string[]>([]); // Ahora es un array de días elegidos
  const [prefMomento, setPrefMomento] = useState("Cualquiera");

  const [solicitudPendiente, setSolicitudPendiente] = useState<string | null>(null);
  const [idNotaPendiente, setIdNotaPendiente] = useState<number | null>(null);
  const [cancelandoTurno, setCancelandoTurno] = useState(false);

  const [respirando, setRespirando] = useState(false);
  const [faseRespiracion, setFaseRespiracion] = useState("");
  const intervaloRef = useRef<NodeJS.Timeout | null>(null);
  const ejercicioActivoRef = useRef<boolean>(false);

  const [mindfulnessActivo, setMindfulnessActivo] = useState(false);
  const [fraseMindfulness, setFraseMindfulness] = useState("");

  const [evaluando, setEvaluando] = useState(false);
  const [herramientaEvaluada, setHerramientaEvaluada] = useState("");

  const guionMindfulness = [
    "Cerrá los ojos suavemente...",
    "Llevá toda tu atención a la respiración...",
    "Sentí cómo el aire entra... y sale de tu cuerpo...",
    "Ahora, enfocá tu atención en tus pies... sentí su peso...",
    "Subí lentamente por tus piernas... soltá la tensión de tus rodillas... y muslos...",
    "Relajá tu abdomen... permití que se expanda libremente...",
    "Relajá los hombros... dejalos caer pesados...",
    "Finalmente, relajá los músculos de tu cara... tu mandíbula... tu frente...",
    "Mantenete en este estado de calma... el tiempo que necesites.",
  ];

  const esperar = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }

    const traerDatos = async () => {
      try {
        // 1. LEEMOS LA SESIÓN SEGURA DE SUPABASE
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          // Si no hay sesión, lo mandamos a la página de login
          router.push("/portal/login");
          return;
        }

        // Este es el ID larguísimo y seguro de Supabase
        const idSeguro = user.id;

        // 2. BUSCAMOS AL PACIENTE EN TU TABLA
        const { data: dataPaciente, error: errorPaciente } = await supabase
          .from("pacientes")
          .select("*")
          .eq("auth_id", idSeguro)
          .single();

        if (errorPaciente)
          throw new Error("No encontramos tu perfil de paciente en el sistema. Contactate con tu profesional.");
        if (!dataPaciente)
          throw new Error("La base de datos devolvió un resultado vacío.");

        setPaciente(dataPaciente);

        // Usamos dataPaciente.id para los turnos y notas
        const pacienteDbId = dataPaciente.id;
        const hoy = new Date().toISOString().split("T")[0];

        const { data: dataTurnos } = await supabase
          .from("turnos")
          .select("*")
          .eq("paciente_id", pacienteDbId)
          .gte("fecha", hoy)
          .order("fecha", { ascending: true })
          .limit(1);

        if (dataTurnos && dataTurnos.length > 0) setProximoTurno(dataTurnos[0]);

        const { data: dataNota } = await supabase
          .from("notas_paciente")
          .select("*")
          .eq("paciente_id", pacienteDbId)
          .like("nota", "SISTEMA: Solicitud de turno%")
          .order("id", { ascending: false })
          .limit(1);

        if (dataNota && dataNota.length > 0) {
          const fechaNota = new Date(dataNota[0].fecha_creacion);
          const hoyActual = new Date();
          const difDias =
            (hoyActual.getTime() - fechaNota.getTime()) / (1000 * 3600 * 24);

          if (difDias < 10) {
            const textoLimpio = dataNota[0].nota.replace(
              "SISTEMA: Solicitud de turno. ",
              ""
            );
            setSolicitudPendiente(textoLimpio);
            setIdNotaPendiente(dataNota[0].id);
          }
        }

        setCargando(false);
      } catch (err: any) {
        setErrorMensaje(err.message);
        setCargando(false);
      }
    };

    traerDatos();

    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
      if (typeof window !== "undefined" && window.speechSynthesis)
        window.speechSynthesis.cancel();
    };
  }, [router]);

  // --- FUNCIONES DE TURNOS ---
  const toggleDia = (dia: string) => {
    setPrefDias((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const enviarPedidoTurno = async () => {
    setPidiendoTurno(true);

    const diasElegidos =
      prefDias.length > 0 ? prefDias.join(", ") : "Cualquier día";
    const textoDetalle = `Disponibilidad: ${diasElegidos} - Franja horaria: ${prefMomento}`;
    const textoNota = `SISTEMA: Solicitud de turno. ${textoDetalle}`;

    const { data, error } = await supabase
      .from("notas_paciente")
      .insert([{ paciente_id: paciente.id, nota: textoNota }])
      .select();

    if (!error && data) {
      setTurnoPedidoExito(true);
      setAbrirFormTurno(false);
      setPrefDias([]);
      setPrefMomento("Cualquiera");
      setSolicitudPendiente(textoDetalle);
      setIdNotaPendiente(data[0].id);
      setTimeout(() => setTurnoPedidoExito(false), 5000);
    }
    setPidiendoTurno(false);
  };

  const cancelarPedido = async () => {
    if (!idNotaPendiente) return;
    setCancelandoTurno(true);
    const { error } = await supabase
      .from("notas_paciente")
      .delete()
      .eq("id", idNotaPendiente);

    if (!error) {
      setSolicitudPendiente(null);
      setIdNotaPendiente(null);
    }
    setCancelandoTurno(false);
  };

  // --- RESTO DE FUNCIONES (Voz, Mindfulness, Notas, etc) INTACTAS ---
  const configurarVozLatina = (utterance: SpeechSynthesisUtterance) => {
    const voces = window.speechSynthesis.getVoices();
    let vozElegida = voces.find(
      (v) =>
        v.name.includes("Google") &&
        v.lang.startsWith("es") &&
        !v.name.includes("ES")
    );
    if (!vozElegida)
      vozElegida = voces.find((v) => v.lang === "es-AR" || v.lang === "es_AR");
    if (!vozElegida)
      vozElegida = voces.find(
        (v) =>
          v.lang.startsWith("es") &&
          !v.lang.includes("ES") &&
          !v.lang.includes("es-ES")
      );
    if (!vozElegida) vozElegida = voces.find((v) => v.lang.startsWith("es"));
    if (vozElegida) utterance.voice = vozElegida;
  };

  const hablar = (texto: string, onEndCallback?: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = "es-AR";
    utterance.rate = 0.7;
    utterance.pitch = 0.9;
    configurarVozLatina(utterance);
    if (onEndCallback)
      utterance.onend = () => {
        if (ejercicioActivoRef.current) onEndCallback();
      };
    window.speechSynthesis.speak(utterance);
  };

  const iniciarRespiracion = () => {
    setRespirando(true);
    ejercicioActivoRef.current = true;
    const nombre = paciente?.nombre ? paciente.nombre.split(" ")[0] : "";
    setFaseRespiracion("Preparate...");
    hablar(
      `Hola ${nombre}. Cierra los ojos. Vamos a buscar un momento de paz juntos.`,
      () => {
        let paso = 0;
        const ciclo = () => {
          if (!ejercicioActivoRef.current) return;
          if (paso === 0) {
            setFaseRespiracion("Inhalá...");
            hablar("Inhala.");
          } else if (paso === 1) {
            setFaseRespiracion("Sostené...");
            hablar("Sostén.");
          } else {
            setFaseRespiracion("Exhalá...");
            hablar("Exhala.");
          }
          paso = (paso + 1) % 3;
        };
        ciclo();
        intervaloRef.current = setInterval(ciclo, 4500);
      }
    );
  };

  const detenerRespiracion = () => {
    setRespirando(false);
    ejercicioActivoRef.current = false;
    setFaseRespiracion("");
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    if (typeof window !== "undefined" && window.speechSynthesis)
      window.speechSynthesis.cancel();
    setHerramientaEvaluada("la respiración 4-7-8");
    setEvaluando(true);
  };

  const iniciarMindfulness = async () => {
    setMindfulnessActivo(true);
    ejercicioActivoRef.current = true;
    for (let i = 0; i < guionMindfulness.length; i++) {
      if (!ejercicioActivoRef.current) break;
      setFraseMindfulness(guionMindfulness[i]);
      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(guionMindfulness[i]);
        utterance.lang = "es-AR";
        utterance.rate = 0.5;
        utterance.pitch = 0.9;
        configurarVozLatina(utterance);
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      });
      if (!ejercicioActivoRef.current) break;
      await esperar(3500);
    }
    if (ejercicioActivoRef.current) {
      setMindfulnessActivo(false);
      ejercicioActivoRef.current = false;
      setHerramientaEvaluada("el escaneo corporal");
      setEvaluando(true);
    }
  };

  const detenerMindfulness = () => {
    setMindfulnessActivo(false);
    ejercicioActivoRef.current = false;
    if (typeof window !== "undefined" && window.speechSynthesis)
      window.speechSynthesis.cancel();
    setHerramientaEvaluada("el escaneo corporal");
    setEvaluando(true);
  };

  const guardarEvaluacion = async (puntaje: number) => {
    const { error } = await supabase
      .from("uso_botiquin")
      .insert([
        {
          paciente_id: paciente.id, // ¡CORREGIDO!
          herramienta: herramientaEvaluada,
          puntaje_ansiedad: puntaje,
        },
      ]);
    if (!error) setEvaluando(false);
  };

  const enviarNotaAlDoc = async () => {
    if (!nota.trim()) return;
    setEnviandoNota(true);
    const { error } = await supabase
      .from("notas_paciente")
      .insert([{ paciente_id: paciente.id, nota: nota }]); // ¡CORREGIDO!
    setEnviandoNota(false);
    if (!error) {
      setNotaEnviada(true);
      setNota("");
      setTimeout(() => setNotaEnviada(false), 3000);
    }
  };

  if (cargando)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#FBF9F6] text-[#8C9C8E]">
        <Loader2 className="animate-spin mb-3" size={40} />
        <p className="font-bold">Preparando tu espacio...</p>
      </div>
    );

  if (errorMensaje) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FBF9F6] text-center p-6">
        <AlertTriangle size={60} className="text-[#B06043] mb-4" />
        <h2 className="text-2xl font-black text-[#4A443C] mb-2">
          Ups, hay un problema
        </h2>
        <p className="text-[#8A8175] mb-6 font-medium">
          Algo falló al cargar tus datos.
        </p>
        <div className="bg-white p-6 rounded-2xl border border-[#E8E3D9] text-left max-w-lg w-full shadow-sm">
          <p className="text-sm font-bold text-[#8A8175] mb-1">
            ID de cuenta vinculada:
          </p>
          <p className="font-mono bg-[#F2EFE9] p-2 rounded mb-4 text-[#4A443C]">
            {paciente?.id || "No identificado"}
          </p>
          <p className="text-sm font-bold text-[#8A8175] mb-1">
            Mensaje Técnico del Error:
          </p>
          <p className="font-mono bg-[#FCEEE9] text-[#B06043] p-3 rounded text-sm">
            {errorMensaje}
          </p>
        </div>
        <button 
          onClick={() => router.push('/portal/login')} 
          className="mt-6 px-6 py-3 bg-[#8C9C8E] text-white font-bold rounded-xl shadow-sm"
        >
          Volver al Login
        </button>
      </div>
    );
  }

  const capitalizar = (str: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";
  const formatearFecha = (fechaIso: string) => {
    if (!fechaIso) return "";
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
    };
    const fecha = new Date(fechaIso + "T00:00:00");
    return fecha.toLocaleDateString("es-AR", opciones);
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes latido-suave { 0%, 100% { transform: scale(1); } 25% { transform: scale(1.03); } 75% { transform: scale(0.97); } }
        .anim-latido-1 { animation: latido-suave 8s ease-in-out infinite; }
        .anim-latido-2 { animation: latido-suave 8s ease-in-out infinite -4s; }
      `,
        }}
      />

      {/* --- EJERCICIOS --- */}
      {respirando && (
        <div className="fixed inset-0 z-[100] bg-[#4A443C] flex flex-col items-center justify-center p-6 transition-colors duration-1000">
          <button
            onClick={detenerRespiracion}
            className="absolute top-8 right-8 text-white/30 hover:text-white transition-colors p-2"
          >
            <X size={32} />
          </button>
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <div className="relative w-64 h-64 flex items-center justify-center mb-16">
              <div
                className="absolute bg-[#8C9C8E] rounded-full"
                style={{
                  width: "100%",
                  height: "100%",
                  opacity: 0.3,
                  transform:
                    faseRespiracion === "Inhalá..." ||
                    faseRespiracion === "Sostené..."
                      ? "scale(1.6)"
                      : "scale(0.8)",
                  transition: "transform 4.5s ease-in-out",
                }}
              ></div>
              <div
                className="absolute bg-white rounded-full flex items-center justify-center shadow-2xl"
                style={{
                  width: "40%",
                  height: "40%",
                  transform:
                    faseRespiracion === "Inhalá..." ||
                    faseRespiracion === "Sostené..."
                      ? "scale(1.2)"
                      : "scale(1)",
                  transition: "transform 4.5s ease-in-out",
                }}
              >
                <Wind className="text-[#8C9C8E]" size={24} />
              </div>
            </div>
            <p className="text-4xl font-black text-white tracking-widest transition-all duration-500">
              {faseRespiracion}
            </p>
            <p className="text-white/40 font-medium mt-6 text-sm">Paz mental</p>
          </div>
        </div>
      )}

      {mindfulnessActivo && (
        <div className="fixed inset-0 z-[100] bg-[#6B806F] flex flex-col items-center justify-center p-6 transition-colors duration-1000">
          <button
            onClick={detenerMindfulness}
            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors p-2"
          >
            <X size={32} />
          </button>
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md text-center">
            <div className="mb-12">
              <Flower2
                size={80}
                className="text-white/20 animate-[spin_20s_linear_infinite]"
              />
            </div>
            <h2
              key={fraseMindfulness}
              className="text-3xl font-medium text-white mb-4 leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-1000"
            >
              {fraseMindfulness}
            </h2>
          </div>
        </div>
      )}

      {evaluando && (
        <div className="fixed inset-0 z-[100] bg-[#8C9C8E] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-[#FBF9F6] p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#E8E3D9]">
              <Heart size={28} className="text-[#6B806F]" fill="currentColor" />
            </div>
            <h2 className="text-2xl font-black text-[#4A443C] mb-2">
              ¡Gran trabajo!
            </h2>
            <p className="text-[#8A8175] font-medium mb-8">
              ¿Cómo te sentís ahora después de usar {herramientaEvaluada}?
            </p>
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="text-sm font-bold text-[#A49A8D]">Ansioso</span>
              <span className="text-sm font-bold text-[#6B806F]">En calma</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => guardarEvaluacion(num)}
                  className="w-12 h-12 rounded-full bg-white text-[#6B806F] font-black text-lg hover:bg-[#6B806F] hover:text-white hover:scale-110 transition-all shadow-sm border border-[#E8E3D9]"
                >
                  {num}
                </button>
              ))}
            </div>
            <button
              onClick={() => setEvaluando(false)}
              className="text-[#A49A8D] text-sm font-bold hover:text-[#4A443C] transition-colors underline-offset-4 hover:underline"
            >
              Omitir por ahora
            </button>
          </div>
        </div>
      )}

      {/* --- PORTAL PRINCIPAL --- */}
      <div
        className={`min-h-screen bg-[#FBF9F6] font-sans pb-20 transition-opacity duration-1000 ${
          respirando || mindfulnessActivo || evaluando ? "hidden" : "block"
        }`}
      >
        <div className="bg-[#8C9C8E] rounded-b-[3rem] p-8 pt-12 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-[-30px] right-[-30px] opacity-20">
            <Sparkles size={150} fill="currentColor" />
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl font-black mb-2 tracking-tight">
              Hola, {capitalizar(paciente?.nombre)}
            </h1>
            <p className="text-[#F2EFE9] font-medium text-lg opacity-90">
              Qué bueno tenerte por acá. Este es tu espacio seguro para pausar y
              conectar.
            </p>
          </div>
        </div>

        <div className="max-w-md mx-auto px-6 -mt-6 relative z-20 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E8E3D9]">
            <h2 className="text-sm font-bold text-[#8A8175] mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-[#B08943]" /> Nuestro próximo
              encuentro
            </h2>

            {proximoTurno ? (
              <div className="bg-[#FEF5E7] rounded-2xl p-5 border border-[#FDEBCE] flex justify-between items-center mb-4">
                <div>
                  <p className="font-black text-[#B08943] text-xl capitalize mb-1">
                    {formatearFecha(proximoTurno.fecha)}
                  </p>
                  <p className="font-bold text-[#8A8175] flex items-center gap-1.5 text-lg">
                    <Clock size={18} /> a las {proximoTurno.hora.slice(0, 5)} hs
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-[#FBF9F6] rounded-2xl p-5 text-center border border-[#E8E3D9] mb-4">
                <p className="font-medium text-[#8A8175]">
                  Por el momento no tenemos sesiones agendadas.
                </p>
              </div>
            )}

            {/* CARTEL DE SOLICITUD PENDIENTE CON CANCELAR */}
            {solicitudPendiente && (
              <div className="bg-[#FFF8E7] rounded-2xl p-4 border border-[#FDEBCE] mb-4 animate-in fade-in">
                <div className="flex items-start gap-3 mb-4">
                  <Clock size={20} className="text-[#B08943] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-black text-[#B08943] mb-1">
                      Solicitud en revisión
                    </p>
                    <p className="text-xs font-medium text-[#8A8175]">
                      {solicitudPendiente}
                    </p>
                  </div>
                </div>
                <button
                  onClick={cancelarPedido}
                  disabled={cancelandoTurno}
                  className="w-full bg-white border border-[#FDEBCE] text-[#B08943] py-2 rounded-xl text-xs font-bold hover:bg-[#FDEBCE] transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {cancelandoTurno ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <X size={14} />
                  )}
                  Cancelar este pedido
                </button>
              </div>
            )}

            {/* FORMULARIO DESPLEGABLE DE TURNOS */}
            {turnoPedidoExito ? (
              <div className="bg-[#E8F0E9] text-[#556B5A] p-4 rounded-2xl text-center text-sm font-bold flex items-center justify-center gap-2">
                <Check size={18} /> ¡Pedido enviado exitosamente!
              </div>
            ) : abrirFormTurno ? (
              <div className="bg-[#FBF9F6] p-5 rounded-2xl border border-[#E8E3D9] text-left animate-in slide-in-from-top-2 mt-4">
                <p className="text-sm font-bold text-[#8A8175] mb-3">
                  ¿Qué días preferís?
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(
                    (dia) => (
                      <button
                        key={dia}
                        onClick={() => toggleDia(dia)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors shadow-sm ${
                          prefDias.includes(dia)
                            ? "bg-[#B08943] text-white border-transparent"
                            : "bg-white border border-[#E8E3D9] text-[#8A8175] hover:bg-[#F2EFE9]"
                        }`}
                      >
                        {dia}
                      </button>
                    )
                  )}
                </div>

                <p className="text-sm font-bold text-[#8A8175] mb-2">
                  Franja horaria:
                </p>
                <select
                  value={prefMomento}
                  onChange={(e) => setPrefMomento(e.target.value)}
                  className="w-full mb-5 p-3 rounded-xl border border-[#E8E3D9] text-sm outline-none focus:border-[#B08943] bg-white text-[#4A443C] font-medium shadow-sm"
                >
                  <option value="Cualquiera">Cualquier horario</option>
                  <option value="Mañana">
                    Por la mañana
                  </option>
                  <option value="Tarde">
                    Por la tarde
                  </option>
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={enviarPedidoTurno}
                    disabled={pidiendoTurno}
                    className="flex-1 bg-[#B08943] text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-[#8e6e36] transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {pidiendoTurno ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Send size={18} />
                    )}{" "}
                    Enviar
                  </button>
                  <button
                    onClick={() => setAbrirFormTurno(false)}
                    className="px-4 bg-white text-[#8A8175] border border-[#E8E3D9] rounded-xl font-bold hover:bg-[#F2EFE9] transition-colors shadow-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              !solicitudPendiente && (
                <button
                  onClick={() => setAbrirFormTurno(true)}
                  className="w-full bg-white border-2 border-[#E8E3D9] text-[#B08943] py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-[#FBF9F6] hover:border-[#B08943] transition-all shadow-sm mt-4"
                >
                  <CalendarPlus size={20} /> Solicitar nuevo turno
                </button>
              )
            )}
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#E8E3D9] text-center overflow-hidden">
            <h2 className="text-sm font-bold text-[#6B806F] mb-6 flex items-center justify-center gap-2">
              <Heart size={16} fill="currentColor" className="text-[#6B806F]" />{" "}
              Botiquín de calma
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="anim-latido-1">
                <button
                  onClick={iniciarRespiracion}
                  className="w-full h-full bg-[#4A443C] text-white p-5 rounded-[2rem] shadow-sm hover:shadow-md hover:bg-[#3d3831] transition-all aspect-square flex flex-col items-center justify-center gap-4 group"
                >
                  <div className="bg-white/10 p-4 rounded-full">
                    <Wind size={36} className="group-hover:animate-spin" />
                  </div>
                  <span className="font-bold text-sm leading-tight">
                    Respiración
                    <br />
                    4-7-8
                  </span>
                </button>
              </div>
              <div className="anim-latido-2">
                <button
                  onClick={iniciarMindfulness}
                  className="w-full h-full bg-[#6B806F] text-white p-5 rounded-[2rem] shadow-sm hover:shadow-md hover:bg-[#556B5A] transition-all aspect-square flex flex-col items-center justify-center gap-4 group"
                >
                  <div className="bg-white/10 p-4 rounded-full">
                    <Flower2
                      size={36}
                      className="group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <span className="font-bold text-sm leading-tight">
                    Mindfulness
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E8E3D9]">
            <h2 className="text-sm font-bold text-[#8A8175] mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-[#6B806F]" /> Descarga mental
            </h2>
            <div className="relative">
              <textarea
                rows={4}
                placeholder="Hoy me sentí..."
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                className="w-full bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl p-4 outline-none resize-none focus:border-[#8C9C8E] text-[#4A443C] font-medium pb-14"
              />
              <div className="absolute bottom-2 right-2">
                {notaEnviada ? (
                  <div className="bg-[#E8F0E9] text-[#556B5A] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
                    <Check size={14} /> Guardado
                  </div>
                ) : (
                  <button
                    onClick={enviarNotaAlDoc}
                    disabled={!nota.trim() || enviandoNota}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
                      !nota.trim()
                        ? "bg-[#E8E3D9] text-[#A49A8D] cursor-not-allowed"
                        : "bg-[#8C9C8E] text-white hover:bg-[#6B806F]"
                    }`}
                  >
                    {enviandoNota ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}{" "}
                    Dejar nota
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function PortalPaciente() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#FBF9F6]">
          <Loader2 className="animate-spin text-[#8C9C8E]" size={40} />
        </div>
      }
    >
      <PortalContenido />
    </Suspense>
  );
}