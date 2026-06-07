"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  User,
  Calendar,
  FileText,
  ArrowLeft,
  Loader2,
  Plus,
  Save,
  Clock,
  Pill,
  AlertTriangle,
  Stethoscope,
  Edit3,
  Search,
  MessageCircle,
  Target,
  Compass,
  CheckSquare,
  Square,
  HeartPulse,
  UserCircle,
  Headphones,
  PlayCircle,
  PhoneCall,
  AlertCircle,
  X,
  Check,
  XCircle,
  Activity,
  BarChart2,
  Settings2,
  Eye,
  Brain,
  TrendingDown,
  Sparkles,
  MessageSquare, // ← Agregar aquí
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const tooltipStyles =
  "before:content-[attr(title)] before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:mb-2 before:px-3 before:py-1.5 before:bg-[#4A443C]/90 before:text-white before:text-xs before:font-bold before:rounded-lg before:opacity-0 before:transition-opacity before:pointer-events-none before:whitespace-nowrap group-hover:before:opacity-100";

// PREGUNTAS PHQ-9 VALIDADAS
const preguntasPHQ9 = [
  "Poco interés o placer en hacer cosas",
  "Se ha sentido decaído(a), deprimido(a) o sin esperanzas",
  "Ha tenido dificultad para quedarse o permanecer dormido(a), o ha dormido demasiado",
  "Se ha sentido cansado(a) o con poca energía",
  "Sin apetito o ha comido en exceso",
  "Se ha sentido mal con usted mismo(a) – o que es un fracaso o que ha quedado mal con usted mismo(a) o con su familia",
  "Dificultad para concentrarse en actividades, como leer el periódico o ver televisión",
  "¿Se ha movido o hablado tan lento que otras personas podrían haberlo notado? O todo lo contrario: ha estado tan inquieto(a) o agitado(a) que ha estado moviéndose mucho más de lo habitual",
  "Pensamientos de que estaría mejor muerto(a) o de hacerse daño de alguna manera",
];
const opcionesRespuestaPHQ9 = [
  "Ningún día / Para nada",
  "Varios días",
  "Más de la mitad de los días",
  "Casi todos los días",
];

// PREGUNTAS GAD-7 VALIDADAS
const preguntasGAD7 = [
  "Sentirse nervioso/a, ansioso/a o con los nervios de punta",
  "No poder dejar de preocuparse o no poder controlar la preocupación",
  "Preocuparse demasiado por diferentes cosas",
  "Dificultad para relajarse",
  "Estar tan inquieto/a que es difícil permanecer sentado/a tranquilamente",
  "Sentirse fácilmente disgustado/a o irritable",
  "Sentirse asustado/a como si algo horrible pudiera pasar",
];
const opcionesRespuestaGAD7 = [
  "Nada en absoluto / Nunca",
  "Varios días",
  "Más de la mitad de los días",
  "Casi todos los días",
];

const opcionesDificultad = [
  "Nada difícil",
  "Algo difícil",
  "Muy difícil",
  "Extremadamente difícil",
];

export default function HistoriaClinica() {
  const params = useParams();
  const idPaciente = params.id;
  const router = useRouter();

  const [paciente, setPaciente] = useState<any>(null);
  const [evoluciones, setEvoluciones] = useState<any[]>([]);
  const [plan, setPlan] = useState<any>(null);
  const [objetivos, setObjetivos] = useState<any[]>([]);
  const [turnosPaciente, setTurnosPaciente] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [audioActivo, setAudioActivo] = useState<string | null>(null);
  const [rol, setRol] = useState<string | null>(null);

  const [herramientaEvaluada, setHerramientaEvaluada] = useState("");
  const [evaluando, setEvaluando] = useState(false);
  const [nota, setNota] = useState("");
  const [enviandoNota, setEnviandoNota] = useState(false);
  const [notaEnviada, setNotaEnviada] = useState(false);

  // LA PESTAÑA POR DEFECTO AHORA ES 'resumen' O 'datos'
  const [pestana, setPestana] = useState("datos");

  const [animandoSalida, setAnimandoSalida] = useState(false);
  const [mostrarAlertas, setMostrarAlertas] = useState(false);
  const [notaEnEdicionId, setNotaEnEdicionId] = useState<number | null>(null);

  const [editandoDatos, setEditandoDatos] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    celular: "",
    email: "",
    fecha_nacimiento: "",
    localidad: "",
    provincia: "",
    contacto_emergencia_nombre: "",
    contacto_emergencia_vinculo: "",
    contacto_emergencia_tel: "",
    es_particular: true,
    prepaga: "",
    afiliado: "",
    plan: "",
  });

  const [editandoClinica, setEditandoClinica] = useState(false);
  const [formClinicaData, setFormClinicaData] = useState({
    motivo_consulta: "",
    antecedente_internacion: false,
    detalle_internacion: "",
  });
  const [medicacionesForm, setMedicacionesForm] = useState<any[]>([]);

  const [editandoTurnoId, setEditandoTurnoId] = useState<string | null>(null);
  const [turnoEditData, setTurnoEditData] = useState({
    fecha: "",
    hora: "",
    estado: "",
  });

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [guardandoEvolucion, setGuardandoEvolucion] = useState(false);
  const [creandoPlan, setCreandoPlan] = useState(false);
  const [sugerenciasDSM, setSugerenciasDSM] = useState<any[]>([]);
  const [buscandoDSM, setBuscandoDSM] = useState(false);

  const [evaluacionesLocales, setEvaluacionesLocales] = useState<any[]>([]);
  const [testActivo, setTestActivo] = useState<string | null>(null);
  const [respuestasPHQ9, setRespuestasPHQ9] = useState<number[]>(
    Array(9).fill(-1)
  );
  const [dificultadPHQ9, setDificultadPHQ9] = useState<number>(-1);
  const [respuestasGAD7, setRespuestasGAD7] = useState<number[]>(
    Array(7).fill(-1)
  );
  const [dificultadGAD7, setDificultadGAD7] = useState<number>(-1);

  const [busquedaEvoluciones, setBusquedaEvoluciones] = useState("");
  const [filtroEvoluciones, setFiltroEvoluciones] = useState("Todas");

  const fechaActual = new Date();
  fechaActual.setMinutes(
    fechaActual.getMinutes() - fechaActual.getTimezoneOffset()
  );
  const hoy = fechaActual.toISOString().split("T")[0];

  const [nuevaEvolucion, setNuevaEvolucion] = useState({
    fecha: hoy,
    diagnostico: "",
    notas: "",
  });
  const [formPlan, setFormPlan] = useState({
    enfoque_terapeutico: "",
    frecuencia_sesiones: "",
  });
  const [formObjetivo, setFormObjetivo] = useState({
    descripcion: "",
    plazo: "corto",
  });

  const traerDatos = async () => {
    // 1. CAPA DE IDENTIDAD: Primero sabemos quién es el usuario
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const rolActual = user?.user_metadata?.rol || "profesional";
    setRol(rolActual);

    // 2. CAPA PÚBLICA (ADMIN/SEC): Datos básicos que ven todos
    const { data: dataPaciente } = await supabase
      .from("pacientes")
      .select("*")
      .eq("id", idPaciente)
      .single();

    if (dataPaciente) {
      setPaciente(dataPaciente);
      setFormData({
        nombre: dataPaciente.nombre || "",
        apellido: dataPaciente.apellido || "",
        dni: dataPaciente.dni || "",
        celular: dataPaciente.celular || "",
        email: dataPaciente.email || "",
        fecha_nacimiento: dataPaciente.fecha_nacimiento || "",
        localidad: dataPaciente.localidad || "",
        provincia: dataPaciente.provincia || "",
        contacto_emergencia_nombre:
          dataPaciente.contacto_emergencia_nombre || "",
        contacto_emergencia_vinculo:
          dataPaciente.contacto_emergencia_vinculo || "",
        contacto_emergencia_tel: dataPaciente.contacto_emergencia_tel || "",
        es_particular: dataPaciente.es_particular ?? true,
        prepaga: dataPaciente.prepaga || "",
        afiliado: dataPaciente.afiliado || "",
        plan: dataPaciente.plan || "",
      });

      // Solo cargamos el motivo y la medicación (parte del cuadro clínico) si NO es secretaria
      if (rolActual !== "secretaria") {
        setFormClinicaData({
          motivo_consulta: dataPaciente.motivo_consulta || "",
          antecedente_internacion:
            dataPaciente.antecedente_internacion || false,
          detalle_internacion: dataPaciente.detalle_internacion || "",
        });

        try {
          let meds = [];
          if (typeof dataPaciente.medicacion === "string") {
            meds = JSON.parse(dataPaciente.medicacion || "[]");
          } else if (Array.isArray(dataPaciente.medicacion)) {
            meds = dataPaciente.medicacion;
          }
          setMedicacionesForm(meds);
        } catch (e) {
          setMedicacionesForm([]);
        }
      }
    }

    // 3. CAPA DE AGENDA: Los turnos los ven todos
    const { data: dataTurnos } = await supabase
      .from("turnos")
      .select("*")
      .eq("paciente_id", idPaciente)
      .order("fecha", { ascending: false });
    if (dataTurnos) setTurnosPaciente(dataTurnos);

    // 4. CAPA SENSIBLE (SOLO PROFESIONAL): Blindaje de datos clínicos
    if (rolActual !== "secretaria") {
      // Evoluciones
      const { data: dataEvoluciones } = await supabase
        .from("evoluciones")
        .select("*")
        .eq("paciente_id", idPaciente)
        .order("fecha", { ascending: false });
      if (dataEvoluciones) setEvoluciones(dataEvoluciones);

      // Plan de tratamiento
      const { data: dataPlan } = await supabase
        .from("planes_tratamiento")
        .select("*")
        .eq("paciente_id", idPaciente)
        .eq("estado", "activo")
        .single();

      if (dataPlan) {
        setPlan(dataPlan);
        const { data: dataObj } = await supabase
          .from("objetivos_tratamiento")
          .select("*")
          .eq("plan_id", dataPlan.id)
          .order("id", { ascending: true });
        if (dataObj) setObjetivos(dataObj);
      }

      // Evaluaciones (Tests)
      const { data: dataEvaluaciones } = await supabase
        .from("evaluaciones")
        .select("*")
        .eq("paciente_id", idPaciente)
        .order("fecha", { ascending: false });
      if (dataEvaluaciones) setEvaluacionesLocales(dataEvaluaciones);
    } else {
      // Si es secretaria, vaciamos preventivamente cualquier residuo de datos sensibles
      setEvoluciones([]);
      setPlan(null);
      setObjetivos([]);
      setEvaluacionesLocales([]);
    }

    setCargando(false);
  };

  useEffect(() => {
    if (idPaciente) traerDatos();
  }, [idPaciente]);

  const cambiarPestana = (nuevaPestana: string) => {
    setPestana(nuevaPestana);
    setEditandoDatos(false);
    setEditandoClinica(false);
    cancelarTest();
  };

  const capitalizarPalabras = (texto: any) => {
    if (typeof texto !== "string") return "";
    if (!texto.trim()) return "";
    return texto.toLowerCase().replace(/(?:^|\s)\S/g, function (a: string) {
      return a.toUpperCase();
    });
  };

  const guardarDatosPersonales = async () => {
    // --- VALIDACIÓN ANTI-TECLADO ---
    if (formData.fecha_nacimiento) {
      const anio = new Date(formData.fecha_nacimiento).getFullYear();

      // Si el año es menor a 1920 o mayor al actual
      if (anio < 1920 || anio > new Date().getFullYear()) {
        alert(
          "La fecha de nacimiento ingresada no parece ser válida. Por favor, verifique el año antes de continuar."
        );

        const campo = document.getElementById("fecha_nacimiento");
        if (campo) {
          campo.focus();
          campo.style.borderColor = "#B06043";
        }
        return;
      }
    }

    // --- SI TODO ESTÁ BIEN, SIGUE EL GUARDADO NORMAL ---
    const datosLimpios: any = {
      nombre: capitalizarPalabras(formData.nombre),
      apellido: capitalizarPalabras(formData.apellido),
      dni: formData.dni === "" ? null : formData.dni,
      celular: formData.celular === "" ? null : formData.celular,
      email: formData.email === "" ? null : formData.email.toLowerCase().trim(),
      localidad: capitalizarPalabras(formData.localidad),
      provincia: capitalizarPalabras(formData.provincia),
      contacto_emergencia_nombre: capitalizarPalabras(
        formData.contacto_emergencia_nombre
      ),
      contacto_emergencia_vinculo: capitalizarPalabras(
        formData.contacto_emergencia_vinculo
      ),
      contacto_emergencia_tel:
        formData.contacto_emergencia_tel === ""
          ? null
          : formData.contacto_emergencia_tel,
      es_particular: formData.es_particular,
      prepaga: capitalizarPalabras(formData.prepaga),
      plan_obra_social: formData.plan === "" ? null : formData.plan,
      numero_afiliado: formData.afiliado === "" ? null : formData.afiliado,
      fecha_nacimiento:
        formData.fecha_nacimiento === "" ? null : formData.fecha_nacimiento,
    };

    const { error } = await supabase
      .from("pacientes")
      .update(datosLimpios)
      .eq("id", idPaciente);

    if (!error) {
      setEditandoDatos(false);
      traerDatos();
    } else {
      alert(`Error al guardar: ${error.message}`);
    }
  };

  const guardarDatosClinicos = async () => {
    const medicacionJson = JSON.stringify(medicacionesForm);
    const updates = { ...formClinicaData, medicacion: medicacionJson };
    const { error } = await supabase
      .from("pacientes")
      .update(updates)
      .eq("id", idPaciente);
    if (!error) {
      setEditandoClinica(false);
      traerDatos();
    } else {
      alert("Error al guardar el cuadro clínico.");
    }
  };

  const guardarTurnoEditado = async () => {
    const { error } = await supabase
      .from("turnos")
      .update(turnoEditData)
      .eq("id", editandoTurnoId);
    if (!error) {
      setEditandoTurnoId(null);
      traerDatos();
    } else {
      alert("Error al actualizar el turno.");
    }
  };

  const iniciarEdicionTurno = (turno: any) => {
    setEditandoTurnoId(turno.id);
    setTurnoEditData({
      fecha: turno.fecha,
      hora: turno.hora.slice(0, 5),
      estado: turno.estado || "Agendado",
    });
  };

  const agregarMedicion = () =>
    setMedicacionesForm([...medicacionesForm, { nombre: "", profesional: "" }]);
  const removerMedicacion = (index: number) =>
    setMedicacionesForm(medicacionesForm.filter((_, i) => i !== index));
  const actualizarMedicacion = (
    index: number,
    campo: "nombre" | "profesional",
    valor: string
  ) =>
    setMedicacionesForm(
      medicacionesForm.map((med, i) =>
        i === index ? { ...med, [campo]: valor } : med
      )
    );

  const guardarNota = async () => {
    if (!nuevaEvolucion.fecha || !nuevaEvolucion.notas) return;
    setGuardandoEvolucion(true);
    const { error } = await supabase.from("evoluciones").insert([
      {
        paciente_id: idPaciente,
        fecha: nuevaEvolucion.fecha,
        diagnostico: nuevaEvolucion.diagnostico,
        notas: nuevaEvolucion.notas,
      },
    ]);
    if (!error) {
      setNuevaEvolucion({ fecha: hoy, diagnostico: "", notas: "" });
      setMostrarFormulario(false);
      traerDatos();
    }
    setGuardandoEvolucion(false);
  };

  const actualizarNota = async () => {
    if (!notaEnEdicionId || !nuevaEvolucion.notas) return;
    setGuardandoEvolucion(true);
    
    const { error } = await supabase
      .from("evoluciones")
      .update({
        fecha: nuevaEvolucion.fecha,
        diagnostico: nuevaEvolucion.diagnostico,
        notas: nuevaEvolucion.notas,
      })
      .eq("id", notaEnEdicionId);
      
    if (!error) {
      setNuevaEvolucion({ fecha: hoy, diagnostico: "", notas: "" });
      setMostrarFormulario(false);
      setNotaEnEdicionId(null);
      traerDatos();
    } else {
      alert(`Error al actualizar: ${error.message}`);
    }
    setGuardandoEvolucion(false);
  };

  const guardarPlan = async () => {
    if (!formPlan.enfoque_terapeutico || !formPlan.frecuencia_sesiones) return;
    const { data, error } = await supabase
      .from("planes_tratamiento")
      .insert([
        {
          paciente_id: idPaciente,
          enfoque_terapeutico: formPlan.enfoque_terapeutico,
          frecuencia_sesiones: formPlan.frecuencia_sesiones,
          motivo_consulta_clinico: paciente?.motivo_consulta,
        },
      ])
      .select()
      .single();
    if (!error && data) {
      setPlan(data);
      setCreandoPlan(false);
    }
  };

  const agregarObjetivo = async () => {
    if (!formObjetivo.descripcion) return;
    const { error } = await supabase.from("objetivos_tratamiento").insert([
      {
        plan_id: plan.id,
        descripcion: formObjetivo.descripcion,
        plazo: formObjetivo.plazo,
      },
    ]);
    if (!error) {
      setFormObjetivo({ descripcion: "", plazo: "corto" });
      traerDatos();
    }
  };

  const toggleObjetivo = async (id: number, estadoActual: boolean) => {
    setObjetivos(
      objetivos.map((obj) =>
        obj.id === id ? { ...obj, cumplido: !estadoActual } : obj
      )
    );
    await supabase
      .from("objetivos_tratamiento")
      .update({ cumplido: !estadoActual })
      .eq("id", id);
  };

  const buscarDiagnostico = async (texto: string) => {
    setNuevaEvolucion({ ...nuevaEvolucion, diagnostico: texto });
    if (texto.trim().length < 2) {
      setSugerenciasDSM([]);
      return;
    }
    setBuscandoDSM(true);
    const { data, error } = await supabase
      .from("diagnosticos")
      .select("*")
      .or(`nombre.ilike.%${texto}%,codigo.ilike.%${texto}%`)
      .limit(10);
    if (!error && data) setSugerenciasDSM(data);
    setBuscandoDSM(false);
  };

  const seleccionarDiagnostico = (d: any) => {
    setNuevaEvolucion({
      ...nuevaEvolucion,
      diagnostico: `${d.codigo} - ${d.nombre}`,
    });
    setSugerenciasDSM([]);
  };

  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return "";
    const hoy = new Date();
    const cumple = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - cumple.getFullYear();
    const m = hoy.getMonth() - cumple.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
      edad--;
    }
    return edad;
  };

  const formatearFecha = (f: string) => {
    if (!f) return "";
    const [a, m, d] = f.split("-");
    return `${d}/${m}/${a}`;
  };

  const iniciarTest = (tipo: string) => {
    setTestActivo(tipo);
    setRespuestasPHQ9(Array(9).fill(-1));
    setDificultadPHQ9(-1);
    setRespuestasGAD7(Array(7).fill(-1));
    setDificultadGAD7(-1);
  };

  const cancelarTest = () => {
    setTestActivo(null);
    setRespuestasPHQ9(Array(9).fill(-1));
    setDificultadPHQ9(-1);
    setRespuestasGAD7(Array(7).fill(-1));
    setDificultadGAD7(-1);
  };

  const checkCompletado = (respuestas: number[], dif: number) =>
    !respuestas.includes(-1) && dif !== -1;
  const calcularPuntaje = (respuestas: number[]) =>
    respuestas.filter((r) => r !== -1).reduce((a, b) => a + b, 0);

  const getSeveridadGAD7 = (puntaje: number) => {
    if (puntaje <= 4)
      return {
        texto: "Mínima",
        color: "bg-[#E8F0E9] text-[#556B5A]",
        recomendacion: "Normal",
      };
    if (puntaje <= 9)
      return {
        texto: "Leve",
        color: "bg-[#FEF5E7] text-[#B08943]",
        recomendacion: "Monitorear, posible intervención leve",
      };
    if (puntaje <= 14)
      return {
        texto: "Moderada",
        color: "bg-[#FCEEE9] text-[#B06043]",
        recomendacion: "Considerar tratamiento psicológico",
      };
    return {
      texto: "Severa",
      color: "bg-[#FCEEE9] text-[#8C3C2A] border border-[#F5D8CE]",
      recomendacion: "Evaluar urgentemente + posible derivación",
    };
  };

  const getSeveridadPHQ9 = (puntaje: number) => {
    if (puntaje <= 4)
      return {
        texto: "Mínima",
        color: "bg-[#E8F0E9] text-[#556B5A]",
        recomendacion: "Normal",
      };
    if (puntaje <= 9)
      return {
        texto: "Leve",
        color: "bg-[#FEF5E7] text-[#B08943]",
        recomendacion: "Monitorear, posible intervención leve",
      };
    if (puntaje <= 14)
      return {
        texto: "Moderada",
        color: "bg-[#FCEEE9] text-[#B06043]",
        recomendacion: "Considerar tratamiento psicológico",
      };
    if (puntaje <= 19)
      return {
        texto: "Mod. Severa",
        color: "bg-[#FCEEE9] text-[#8C3C2A]",
        recomendacion: "Tratamiento activo recomendado",
      };
    return {
      texto: "Severa",
      color: "bg-[#FCEEE9] text-[#8C3C2A] border border-[#F5D8CE]",
      recomendacion: "Evaluar urgentemente + posible derivación",
    };
  };

  const guardarTermometro = async (puntaje: number) => {
    let totalPuntaje = 0;
    if (testActivo === "PHQ-9" || testActivo === "BATERIA") {
      totalPuntaje += respuestasPHQ9
        .filter((r) => r !== -1)
        .reduce((a, b) => a + b, 0);
    }
    if (testActivo === "GAD-7" || testActivo === "BATERIA") {
      totalPuntaje += respuestasGAD7
        .filter((r) => r !== -1)
        .reduce((a, b) => a + b, 0);
    }

    const { error } = await supabase.from("uso_botiquin").insert([
      {
        paciente_id: idPaciente,
        herramienta: "Evaluación General",
        puntaje_ansiedad: totalPuntaje,
      },
    ]);

    if (!error) setTestActivo(null);
  };

  const enviarNotaAlDoc = async () => {
    if (!nota.trim()) return;
    setEnviandoNota(true);

    // Enviamos a Supabase
    const { error } = await supabase
      .from("notas_paciente")
      .insert([{ paciente_id: idPaciente, nota: nota }]);

    setEnviandoNota(false);

    if (!error) {
      setNotaEnviada(true);
      setNota("");
      setTimeout(() => setNotaEnviada(false), 3000);
    } else {
      console.error("Error guardando nota:", error);
    }
  };
  const guardarEvaluacion = async () => {
    let totalPuntaje = 0;
    if (testActivo === "PHQ-9" || testActivo === "BATERIA") {
      totalPuntaje += respuestasPHQ9
        .filter((r) => r !== -1)
        .reduce((a, b) => a + b, 0);
    }
    if (testActivo === "GAD-7" || testActivo === "BATERIA") {
      totalPuntaje += respuestasGAD7
        .filter((r) => r !== -1)
        .reduce((a, b) => a + b, 0);
    }

    const { error } = await supabase.from("uso_botiquin").insert([
      {
        paciente_id: idPaciente,
        herramienta: "Evaluación General",
        puntaje_ansiedad: totalPuntaje,
      },
    ]);

    if (!error) setTestActivo(null);
  };

  const generarObjetivosSMART = (resultados: any[]) => {
    let textosMeta: string[] = [];
    resultados.forEach((r) => {
      const testCorto = r.nombre.includes("PHQ") ? "PHQ-9" : "GAD-7";
      const meta = Math.max(0, r.puntaje - 5);
      textosMeta.push(
        `Reducir el puntaje ${testCorto} de ${r.puntaje} a ≤${meta} en 8 semanas`
      );
    });
    setFormObjetivo({ descripcion: textosMeta.join(" y "), plazo: "medio" });
    setTimeout(() => {
      document.getElementById("input-objetivo")?.focus();
    }, 100);
  };

  const formatearFechaTarjeta = (fechaIso: string) => {
    if (!fechaIso) return { dia: "", mes: "", anio: "" };
    const [y, m, d] = fechaIso.split("-");
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const meses = [
      "ENE",
      "FEB",
      "MAR",
      "ABR",
      "MAY",
      "JUN",
      "JUL",
      "AGO",
      "SEP",
      "OCT",
      "NOV",
      "DIC",
    ];
    return { dia: d, mes: meses[date.getMonth()], anio: y };
  };

  const evolucionesFiltradas = evoluciones.filter((evo) => {
    const matcheaBusqueda =
      (evo.notas?.toLowerCase() || "").includes(
        busquedaEvoluciones.toLowerCase()
      ) ||
      (evo.diagnostico?.toLowerCase() || "").includes(
        busquedaEvoluciones.toLowerCase()
      );

    if (!matcheaBusqueda) return false;

    if (filtroEvoluciones === "Este mes") {
      const evoMes = new Date(evo.fecha).getMonth();
      const mesActual = new Date().getMonth();
      return evoMes === mesActual;
    }
    if (filtroEvoluciones === "Con Diagnóstico") return !!evo.diagnostico;
    if (filtroEvoluciones === "Solo notas") return !evo.diagnostico;

    return true;
  });

  const renderMedicacion = () => {
    if (!paciente?.medicacion)
      return (
        <span className="text-[#A49A8D] italic">Sin medicación registrada</span>
      );

    let lista: any[] = [];
    try {
      if (typeof paciente.medicacion === "string") {
        const parsed = JSON.parse(paciente.medicacion);
        lista = Array.isArray(parsed) ? parsed : [parsed];
      } else if (Array.isArray(paciente.medicacion)) {
        lista = paciente.medicacion;
      } else if (
        typeof paciente.medicacion === "object" &&
        paciente.medicacion !== null
      ) {
        lista = [paciente.medicacion];
      }
    } catch (e) {
      return (
        <span className="text-[#4A443C] font-medium">
          {String(paciente.medicacion)}
        </span>
      );
    }

    if (lista.length > 0) {
      return (
        <ul className="space-y-4">
          {lista.map((item: any, i: number) => {
            if (!item || typeof item !== "object") return null;

            const medNombre = String(
              item.droga ||
                item.nombre ||
                item.Droga ||
                "Fármaco no especificado"
            );
            const medProfesional =
              item.medico || item.profesional || item.Medico;

            return (
              <li
                key={i}
                className="flex flex-col border border-[#E8E3D9] p-4 rounded-xl bg-white shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Pill size={16} className="text-[#8C9C8E]" />
                  <div className="font-bold text-[#4A443C] text-lg">
                    {capitalizarPalabras(medNombre)}
                  </div>
                </div>
                {medProfesional && typeof medProfesional === "string" && (
                  <div className="text-[#B06043] font-bold text-xs bg-[#FCEEE9] px-2 py-1 rounded-md mb-2 w-fit">
                    Atiende: {capitalizarPalabras(medProfesional)}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      );
    }
    return (
      <span className="text-[#A49A8D] italic">Sin medicación registrada</span>
    );
  };

  // --- MOTOR DE VOZ PARA EL PSICÓLOGO (TUNEADO Y SEPARADO) ---
  const hablarTexto = (texto: string, idBoton: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Si tocamos el MISMO botón que está hablando, lo apagamos
    if (audioActivo === idBoton) {
      window.speechSynthesis.cancel();
      setAudioActivo(null);
      return;
    }

    window.speechSynthesis.cancel();
    setAudioActivo(idBoton);

    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = "es-AR";

    // TUNEAMOS LA VOZ PARA QUE SEA MENOS ROBÓTICA
    utterance.rate = 0.65; // Más lento (1 es lo normal)
    utterance.pitch = 0.9; // Un tono apenas más grave

    const voces = window.speechSynthesis.getVoices();
    // Prioridad 1: Voz premium de Google
    let vozElegida = voces.find(
      (v) => v.name.includes("Google") && v.lang.startsWith("es")
    );
    // Prioridad 2: Cualquier voz de Argentina
    if (!vozElegida)
      vozElegida = voces.find((v) => v.lang === "es-AR" || v.lang === "es_AR");
    // Prioridad 3: Cualquier voz en Español
    if (!vozElegida) vozElegida = voces.find((v) => v.lang.startsWith("es"));

    if (vozElegida) utterance.voice = vozElegida;

    utterance.onend = () => setAudioActivo(null);
    utterance.onerror = () => setAudioActivo(null);

    window.speechSynthesis.speak(utterance);
  };

  const escucharResumenGeneral = () => {
    if (audioActivo === "resumen") {
      hablarTexto("", "resumen");
      return;
    }
    const nombre = paciente?.nombre
      ? capitalizarPalabras(paciente.nombre)
      : "el paciente";
    const motivo = paciente?.motivo_consulta
      ? `El motivo de consulta registrado es: ${paciente.motivo_consulta}.`
      : "No hay motivo de consulta registrado.";
    const diag =
      evoluciones.length > 0 && evoluciones[0].diagnostico
        ? `Su último registro diagnóstico es ${evoluciones[0].diagnostico}.`
        : "";
    const objs = objetivos.filter((o: any) => !o.cumplido).length;

    const texto = `Iniciando resumen general para ${nombre}. ${motivo} ${diag} Actualmente tiene ${objs} objetivos terapéuticos activos en su plan.`;
    hablarTexto(texto, "resumen");
  };

  const escucharUltimaSesion = () => {
    if (audioActivo === "ultima") {
      hablarTexto("", "ultima");
      return;
    }
    if (evoluciones.length === 0) {
      alert("No hay sesiones registradas para este paciente.");
      return;
    }
    const ultima = evoluciones[0];
    const fechaText = formatearFechaTarjeta(ultima.fecha);
    const texto = `Resumen de la última sesión, del día ${fechaText.dia} de ${
      fechaText.mes
    }. Notas clínicas: ${ultima.notas || "sin notas"}`;
    hablarTexto(texto, "ultima");
  };

  // --- 1. LAS REGLAS DE ANIMACIÓN VAN ARRIBA DE TODO ---
  const faltaPlan = !plan;
  const faltaClinica = paciente ? !paciente.motivo_consulta : false;
  const faltaEmergencia = paciente
    ? !paciente.contacto_emergencia_nombre
    : false;
  const hayTareasPendientes = faltaPlan || faltaClinica || faltaEmergencia;

  useEffect(() => {
    if (!cargando && paciente) {
      if (hayTareasPendientes) {
        setMostrarAlertas(true);
        setAnimandoSalida(false);
      } else if (mostrarAlertas) {
        setAnimandoSalida(true);
        const timer = setTimeout(() => setMostrarAlertas(false), 800);
        return () => clearTimeout(timer);
      }
    }
  }, [hayTareasPendientes, cargando, paciente, mostrarAlertas]);

  // --- 2. RECIÉN AHORA MOSTRAMOS EL CARGANDO ---
  if (cargando)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-[#8A8175]">
        <Loader2 className="animate-spin mb-3 text-[#8C9C8E]" size={40} />
        <p className="font-medium">Cargando paciente...</p>
      </div>
    );

  if (!paciente) return <div>Paciente no encontrado.</div>;

  const hayEdicionActiva = editandoDatos || editandoClinica;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-32 animate-in fade-in duration-500 relative">
      <div>
        <Link
          href="/pacientes"
          className="inline-flex items-center gap-2 text-[#8A8175] hover:text-[#556B5A] font-medium transition-colors"
        >
          <ArrowLeft size={18} /> Volver a la lista
        </Link>
      </div>

      {/* CABECERA FIJA */}
      <div className="sticky top-4 z-40 bg-white border border-[#E8E3D9] shadow-md rounded-[2.5rem] p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* BLOQUE IZQUIERDO (Se adapta y manda el texto para abajo) */}
        <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
          <div className="bg-[#E8F0E9] p-3 rounded-full text-[#556B5A] shrink-0">
            <User size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h1
              className="text-xl font-black text-[#4A443C] leading-tight cursor-pointer hover:text-[#6B806F] transition-colors break-words"
              onClick={() => {
                cambiarPestana("datos");
                setEditandoDatos(true);
              }}
              title="Clic para editar el nombre o datos"
            >
              {capitalizarPalabras(paciente.apellido)},{" "}
              {capitalizarPalabras(paciente.nombre)}
            </h1>
            <p className="text-[#8A8175] text-xs font-bold mt-1 truncate">
              {paciente.es_particular
                ? "Particular"
                : capitalizarPalabras(paciente.prepaga)}
            </p>
          </div>
        </div>

        {/* BLOQUE DERECHO (Botonera, tiene shrink-0 para nunca encogerse) */}
        <div className="flex flex-wrap items-center bg-[#FBF9F6] p-1.5 rounded-2xl border border-[#E8E3D9] shrink-0">
          {/* BLOQUE IA - SOLO PROFESIONAL */}
          {rol !== "secretaria" && (
            <>
              <div
                className={`relative group ${tooltipStyles}`}
                title={
                  audioActivo === "resumen"
                    ? "Detener audio"
                    : "Resumen general (IA)"
                }
              >
                <button
                  onClick={escucharResumenGeneral}
                  className={`p-3 rounded-xl transition-all ${
                    audioActivo === "resumen"
                      ? "bg-[#B06043] text-white animate-pulse"
                      : "text-[#556B5A] hover:bg-[#E8F0E9]"
                  }`}
                >
                  {audioActivo === "resumen" ? (
                    <Square size={20} fill="currentColor" />
                  ) : (
                    <Headphones size={20} />
                  )}
                </button>
              </div>
              <div
                className={`relative group ${tooltipStyles}`}
                title={
                  audioActivo === "ultima"
                    ? "Detener audio"
                    : "Última sesión (IA)"
                }
              >
                <button
                  onClick={escucharUltimaSesion}
                  className={`p-3 rounded-xl transition-all ${
                    audioActivo === "ultima"
                      ? "bg-[#B06043] text-white animate-pulse"
                      : "text-[#B06043] hover:bg-[#FCEEE9]"
                  }`}
                >
                  {audioActivo === "ultima" ? (
                    <Square size={20} fill="currentColor" />
                  ) : (
                    <PlayCircle size={20} />
                  )}
                </button>
              </div>
              <div className="w-[1px] h-6 bg-[#D3DDD4] mx-1"></div>

              {/* PESTAÑA: RESUMEN IA & BOTIQUÍN */}
              <div
                className={`relative group ${tooltipStyles}`}
                title="Resumen IA & Botiquín"
              >
                <button
                  onClick={() => cambiarPestana("resumen")}
                  className={`p-3 rounded-xl transition-all relative ${
                    pestana === "resumen"
                      ? "bg-[#6B806F] text-white shadow-sm"
                      : "text-[#8A8175] hover:text-[#4A443C] hover:bg-[#E8E3D9]"
                  }`}
                >
                  <Brain size={20} />
                </button>
              </div>
            </>
          )}

          {/* PESTAÑA: DATOS PERSONALES (PUBLICO) */}
          <div
            className={`relative group ${tooltipStyles}`}
            title="Datos personales"
          >
            <button
              onClick={() => cambiarPestana("datos")}
              className={`p-3 rounded-xl transition-all relative ${
                pestana === "datos"
                  ? "bg-[#6B806F] text-white shadow-sm"
                  : "text-[#8A8175] hover:text-[#4A443C] hover:bg-[#E8E3D9]"
              }`}
            >
              <UserCircle size={20} />
              {faltaEmergencia && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#B06043] rounded-full"></span>
              )}
            </button>
          </div>

          {/* PESTAÑA: AGENDA (PUBLICO) */}
          <div className={`relative group ${tooltipStyles}`} title="Agenda">
            <button
              onClick={() => cambiarPestana("agenda")}
              className={`p-3 rounded-xl transition-all ${
                pestana === "agenda"
                  ? "bg-[#6B806F] text-white shadow-sm"
                  : "text-[#8A8175] hover:text-[#4A443C] hover:bg-[#E8E3D9]"
              }`}
            >
              <Calendar size={20} />
            </button>
          </div>

          {/* BLOQUE HISTORIA CLINICA - SOLO PROFESIONAL */}
          {rol !== "secretaria" && (
            <>
              <div
                className={`relative group ${tooltipStyles}`}
                title="Historial clínico"
              >
                <button
                  onClick={() => cambiarPestana("notas")}
                  className={`p-3 rounded-xl transition-all ${
                    pestana === "notas"
                      ? "bg-[#6B806F] text-white shadow-sm"
                      : "text-[#8A8175] hover:text-[#4A443C] hover:bg-[#E8E3D9]"
                  }`}
                >
                  <HeartPulse size={20} />
                </button>
              </div>
              <div
                className={`relative group ${tooltipStyles}`}
                title="Cuadro clínico"
              >
                <button
                  onClick={() => cambiarPestana("clinica")}
                  className={`p-3 rounded-xl transition-all relative ${
                    pestana === "clinica"
                      ? "bg-[#6B806F] text-white shadow-sm"
                      : "text-[#8A8175] hover:text-[#4A443C] hover:bg-[#E8E3D9]"
                  }`}
                >
                  <Stethoscope size={20} />
                  {(faltaClinica || paciente?.antecedente_internacion) && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-[#B06043] rounded-full"></span>
                  )}
                </button>
              </div>
              <div
                className={`relative group ${tooltipStyles}`}
                title="Plan terapéutico"
              >
                <button
                  onClick={() => cambiarPestana("plan")}
                  className={`p-3 rounded-xl transition-all relative ${
                    pestana === "plan"
                      ? "bg-[#6B806F] text-white shadow-sm"
                      : "text-[#8A8175] hover:text-[#4A443C] hover:bg-[#E8E3D9]"
                  }`}
                >
                  <Target size={20} />
                  {faltaPlan && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-[#B06043] rounded-full"></span>
                  )}
                </button>
              </div>
            </>
          )}

          <div className="w-[1px] h-6 bg-[#D3DDD4] mx-1"></div>

          {/* WHATSAPP (PUBLICO) */}
          <div
            className={`relative group ${tooltipStyles}`}
            title="Enviar WhatsApp"
          >
            {paciente?.celular ? (
              <a
                href={`https://wa.me/${String(paciente.celular).replace(
                  /\D/g,
                  ""
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 text-[#25D366] hover:bg-[#E8F0E9] rounded-xl transition-all"
              >
                <MessageCircle size={20} />
              </a>
            ) : (
              <div className="p-3 text-[#A49A8D] opacity-50 cursor-not-allowed flex items-center justify-center">
                <MessageCircle size={20} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ALERTAS GENERALES VISIBLES (EFECTO DESTELLO / FADE TO WHITE) */}
      <div
        className={`
          flex flex-col sm:flex-row gap-4 items-start sm:items-center relative shadow-inner rounded-2xl
          transition-all duration-1000 ease-in-out overflow-hidden
          ${
            hayTareasPendientes
              ? "opacity-100 max-h-[500px] p-4 px-6 mb-6 bg-[#FCEEE9] border border-[#F5D8CE]"
              : "opacity-0 max-h-0 p-0 mb-0 border-transparent pointer-events-none"
          }
        `}
      >
        {/* Barra lateral que late */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1.5 bg-[#B06043] ${
            hayTareasPendientes ? "animate-pulse" : "hidden"
          }`}
        ></div>

        <div className="flex items-center gap-2 text-[#B06043] font-bold shrink-0 ml-1">
          <AlertCircle size={20} /> Tareas pendientes:
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-bold text-[#8C3C2A]">
          {/* BOTON 1: EMERGENCIA */}
          <div
            className={`transition-all duration-700 ease-in-out overflow-hidden origin-left ${
              faltaEmergencia
                ? "max-w-[300px] max-h-[50px] opacity-100 scale-100"
                : "max-w-0 max-h-0 opacity-0 scale-50"
            }`}
          >
            <button
              onClick={() => {
                cambiarPestana("datos");
                setEditandoDatos(true);
              }}
              className="bg-white/60 px-3 py-1.5 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-[#B06043]/20 whitespace-nowrap"
            >
              Cargar contacto de emergencia
            </button>
          </div>

          {/* BOTON 2: CLINICA */}
          <div
            className={`transition-all duration-700 ease-in-out overflow-hidden origin-left ${
              faltaClinica
                ? "max-w-[300px] max-h-[50px] opacity-100 scale-100"
                : "max-w-0 max-h-0 opacity-0 scale-50"
            }`}
          >
            <button
              onClick={() => {
                cambiarPestana("clinica");
                setEditandoClinica(true);
              }}
              className="bg-white/60 px-3 py-1.5 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-[#B06043]/20 whitespace-nowrap"
            >
              Definir cuadro clínico
            </button>
          </div>

          {/* BOTON 3: PLAN */}
          <div
            className={`transition-all duration-700 ease-in-out overflow-hidden origin-left ${
              faltaPlan
                ? "max-w-[300px] max-h-[50px] opacity-100 scale-100"
                : "max-w-0 max-h-0 opacity-0 scale-50"
            }`}
          >
            <button
              onClick={() => cambiarPestana("plan")}
              className="bg-white/60 px-3 py-1.5 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-[#B06043]/20 whitespace-nowrap"
            >
              Crear plan terapéutico
            </button>
          </div>
        </div>
      </div>
      {/* CONTENIDO PRINCIPAL */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* VISTA 1: DATOS PERSONALES */}
        {/* VISTA 1: DATOS PERSONALES */}
        {pestana === "datos" && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-[#E8E3D9] shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-8 border-b border-[#F2EFE9] pb-4">
              <h2 className="text-xl font-bold text-[#4A443C] flex items-center gap-2">
                <UserCircle size={20} className="text-[#8C9C8E]" /> Información
                personal
              </h2>
              {!editandoDatos && (
                <button
                  onClick={() => setEditandoDatos(true)}
                  className="text-[#A49A8D] hover:text-[#6B806F] p-2 rounded-lg transition-all"
                  title="Hacer clic para editar"
                >
                  <Edit3 size={18} />
                </button>
              )}
            </div>

            {!editandoDatos ? (
              <div className="animate-in fade-in">
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                  onClick={() => setEditandoDatos(true)}
                >
                  <div className="space-y-6 cursor-pointer group hover:bg-[#FBF9F6] p-4 rounded-2xl -m-4 transition-colors h-fit">
                    <div>
                      <span className="block text-[#8A8175] font-bold text-xs mb-1 group-hover:text-[#6B806F]">
                        DNI
                      </span>
                      <span className="font-medium text-[#4A443C] text-lg">
                        {paciente.dni || "---"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[#8A8175] font-bold text-xs mb-1 group-hover:text-[#6B806F]">
                        Edad y fecha de nacimiento
                      </span>
                      <span className="font-medium text-[#4A443C] text-lg">
                        {paciente.fecha_nacimiento
                          ? `${calcularEdad(
                              paciente.fecha_nacimiento
                            )} años (${formatearFecha(
                              paciente.fecha_nacimiento
                            )})`
                          : "---"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[#8A8175] font-bold text-xs mb-1 group-hover:text-[#6B806F]">
                        Localidad y provincia
                      </span>
                      <span className="font-medium text-[#4A443C] text-lg">
                        {capitalizarPalabras(paciente.localidad) || "---"}{" "}
                        {paciente.provincia
                          ? `/ ${capitalizarPalabras(paciente.provincia)}`
                          : ""}
                      </span>
                    </div>

                    <div className="pt-4 border-t border-[#E8E3D9] mt-4">
                      <span className="block text-[#8A8175] font-bold text-xs mb-2 group-hover:text-[#6B806F]">
                        Cobertura médica
                      </span>
                      {paciente.es_particular ? (
                        <span className="font-medium text-[#4A443C] bg-[#F2EFE9] px-3 py-1.5 rounded-lg inline-block">
                          Paciente particular
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-[#556B5A] text-lg">
                            {capitalizarPalabras(paciente.prepaga)}
                          </span>
                          <span className="text-[#8A8175] text-sm font-medium">
                            Plan: {paciente.plan || "---"} | Afiliado:{" "}
                            {paciente.afiliado || "---"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    className="space-y-6 bg-[#FBF9F6] p-6 rounded-3xl border border-[#E8E3D9] cursor-pointer hover:border-[#6B806F] transition-colors h-fit"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditandoDatos(true);
                    }}
                  >
                    <div>
                      <span className="block text-[#8A8175] font-bold text-xs mb-1">
                        Celular personal
                      </span>
                      <span className="font-bold text-[#556B5A] text-lg">
                        {paciente.celular || "No especificado"}
                      </span>
                      <div className="pt-4 border-t border-[#E8E3D9] mt-4">
                        <span className="block text-[#8A8175] font-bold text-xs mb-1">
                          Correo electrónico
                        </span>
                        <span className="font-bold text-[#556B5A] text-lg">
                          {paciente.email || "No especificado"}
                        </span>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-[#E8E3D9]">
                      <span className="flex items-center gap-2 text-[#B06043] font-bold text-xs mb-2">
                        <PhoneCall size={12} /> Contacto de emergencia
                      </span>
                      {paciente.contacto_emergencia_nombre ? (
                        <div>
                          <span className="font-bold text-[#4A443C]">
                            {capitalizarPalabras(
                              paciente.contacto_emergencia_nombre
                            )}
                          </span>
                          <span className="text-[#8A8175] text-sm ml-2">
                            (
                            {capitalizarPalabras(
                              paciente.contacto_emergencia_vinculo
                            )}
                            )
                          </span>
                          <p className="font-bold text-[#B06043] mt-1">
                            {paciente.contacto_emergencia_tel}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[#A49A8D] italic text-sm">
                          No se registró contacto.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* --- CONTROL DEL PORTAL DEL PACIENTE (FUERA DE LA GRILLA) --- */}
                <div
                  className={`mt-10 p-6 rounded-[2.5rem] border-2 transition-all ${
                    paciente.portal_habilitado
                      ? "bg-[#E8F0E9] border-[#D3DDD4]"
                      : "bg-[#FBF9F6] border-[#E8E3D9]"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-2xl ${
                          paciente.portal_habilitado
                            ? "bg-white text-[#556B5A] shadow-sm"
                            : "bg-[#E8E3D9] text-[#8A8175]"
                        }`}
                      >
                        <Eye size={24} />
                      </div>
                      <div>
                        <h4
                          className={`text-sm font-black uppercase tracking-widest ${
                            paciente.portal_habilitado
                              ? "text-[#556B5A]"
                              : "text-[#8A8175]"
                          }`}
                        >
                          Portal del Paciente
                        </h4>
                        <p className="text-xs font-bold text-[#8A8175] mt-0.5">
                          {paciente.portal_habilitado
                            ? "Acceso activo: El paciente puede gestionar sus turnos."
                            : "Acceso restringido: El portal está desactivado para este paciente."}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const nuevoEstado = !paciente.portal_habilitado;
                        const { error } = await supabase
                          .from("pacientes")
                          .update({ portal_habilitado: nuevoEstado })
                          .eq("id", idPaciente);

                        if (!error) {
                          setPaciente({
                            ...paciente,
                            portal_habilitado: nuevoEstado,
                          });
                        }
                      }}
                      className={`px-6 py-3 rounded-2xl font-black text-xs transition-all shadow-sm whitespace-nowrap ${
                        paciente.portal_habilitado
                          ? "bg-[#B06043] text-white hover:bg-[#8C3C2A]"
                          : "bg-[#6B806F] text-white hover:bg-[#556B5A]"
                      }`}
                    >
                      {paciente.portal_habilitado
                        ? "Deshabilitar Portal"
                        : "Habilitar Portal"}
                    </button>
                  </div>

                  {paciente.portal_habilitado && (
                    <div className="mt-4 pt-4 border-t border-white/50 animate-in fade-in slide-in-from-top-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const linkPortal = `${window.location.origin}/portal/login`;
                          const mensaje = encodeURIComponent(
                            `Hola ${paciente.nombre}, ya tenés habilitado tu portal de turnos. Podés ingresar desde acá: ${linkPortal}`
                          );
                          window.open(
                            `https://wa.me/${String(paciente.celular).replace(
                              /\D/g,
                              ""
                            )}?text=${mensaje}`,
                            "_blank"
                          );
                        }}
                        className="flex items-center gap-2 text-[#556B5A] text-xs font-black hover:underline"
                      >
                        <MessageSquare size={16} /> Enviar link de acceso por
                        WhatsApp
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FBF9F6] p-6 rounded-3xl border-2 border-[#6B806F]/20 animate-in zoom-in-95 duration-200">
                <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className="block text-xs font-bold text-[#8A8175] mb-2">
                      Nombre
                    </label>
                    <input
                      className="w-full p-3 bg-white border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]"
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData({ ...formData, nombre: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#8A8175] mb-2">
                      Apellido
                    </label>
                    <input
                      className="w-full p-3 bg-white border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]"
                      value={formData.apellido}
                      onChange={(e) =>
                        setFormData({ ...formData, apellido: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8A8175] mb-2">
                    DNI
                  </label>
                  <input
                    placeholder="Sin puntos"
                    className="w-full p-3 bg-white border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]"
                    value={formData.dni}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dni: e.target.value.replace(/\D/g, ""),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8A8175] mb-2">
                    Fecha de nacimiento
                  </label>
                  <input
                    id="fecha_nacimiento" // <-- ACÁ ESTÁ EL AGREGADO PARA QUE FUNCIONE EL BLOQUEO
                    type="date"
                    className="w-full p-3 bg-white border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F] transition-all"
                    value={formData.fecha_nacimiento}
                    max={hoy}
                    min="1920-01-01"
                    onChange={(e) => {
                      // Removemos cualquier estilo de error si el usuario empieza a corregir
                      e.target.style.borderColor = "";
                      setFormData({
                        ...formData,
                        fecha_nacimiento: e.target.value,
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8A8175] mb-2">
                    Celular
                  </label>
                  <input
                    placeholder="Solo números"
                    className="w-full p-3 bg-white border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]"
                    value={formData.celular}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        celular: e.target.value.replace(/\D/g, ""),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8A8175] mb-2">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="ejemplo@correo.com"
                    className="w-full p-3 bg-white border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-[#8A8175] mb-2">
                      Localidad
                    </label>
                    <input
                      className="w-full p-3 bg-white border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]"
                      value={formData.localidad}
                      onChange={(e) =>
                        setFormData({ ...formData, localidad: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-[#8A8175] mb-2">
                      Provincia
                    </label>
                    <input
                      className="w-full p-3 bg-white border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]"
                      value={formData.provincia}
                      onChange={(e) =>
                        setFormData({ ...formData, provincia: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 pt-4 border-t border-[#E8E3D9] mt-2 space-y-4">
                  <h4 className="font-bold text-[#4A443C] text-sm mb-2">
                    Cobertura médica
                  </h4>
                  <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-[#E8E3D9] w-fit mb-3">
                    <button
                      onClick={() =>
                        setFormData({ ...formData, es_particular: true })
                      }
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                        formData.es_particular
                          ? "bg-[#6B806F] text-white shadow-sm"
                          : "text-[#8A8175] hover:bg-[#FBF9F6]"
                      }`}
                    >
                      Particular
                    </button>
                    <button
                      onClick={() =>
                        setFormData({ ...formData, es_particular: false })
                      }
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                        !formData.es_particular
                          ? "bg-[#6B806F] text-white shadow-sm"
                          : "text-[#8A8175] hover:bg-[#FBF9F6]"
                      }`}
                    >
                      Obra Social / Prepaga
                    </button>
                  </div>
                  {!formData.es_particular && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <input
                        placeholder="Obra Social (Ej: OSDE)"
                        className="w-full p-3 bg-white border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]"
                        value={formData.prepaga}
                        onChange={(e) =>
                          setFormData({ ...formData, prepaga: e.target.value })
                        }
                      />
                      <input
                        placeholder="Plan (Ej: 210)"
                        className="w-full p-3 bg-white border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]"
                        value={formData.plan}
                        onChange={(e) =>
                          setFormData({ ...formData, plan: e.target.value })
                        }
                      />
                      <input
                        placeholder="N° Afiliado"
                        className="w-full p-3 bg-white border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]"
                        value={formData.afiliado}
                        onChange={(e) =>
                          setFormData({ ...formData, afiliado: e.target.value })
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="col-span-1 md:col-span-2 pt-4 border-t border-[#E8E3D9] mt-2 space-y-4">
                  <h4 className="flex items-center gap-2 text-[#B06043] font-bold text-xs mb-2">
                    <PhoneCall size={12} /> Contacto de emergencia
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <input
                      placeholder="Nombre completo"
                      className="w-full p-3 bg-white border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]"
                      value={formData.contacto_emergencia_nombre}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contacto_emergencia_nombre: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Vínculo (ej: Hermano)"
                      className="w-full p-3 bg-white border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]"
                      value={formData.contacto_emergencia_vinculo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contacto_emergencia_vinculo: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Teléfono"
                      className="w-full p-3 bg-white border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]"
                      value={formData.contacto_emergencia_tel}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contacto_emergencia_tel: e.target.value.replace(
                            /\D/g,
                            ""
                          ),
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VISTA 2: AGENDA */}
        {pestana === "agenda" && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-[#E8E3D9] shadow-sm">
            <div className="flex justify-between items-center mb-8 border-b border-[#F2EFE9] pb-4">
              <h2 className="text-xl font-bold text-[#4A443C] flex items-center gap-2">
                <Calendar size={20} className="text-[#8C9C8E]" /> Próximos
                turnos
              </h2>
              <Link
                href={`/turnos/nuevo?patient_id=${idPaciente}`}
                className="bg-[#6B806F] text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-[#556B5A] flex items-center gap-2 shadow-sm"
              >
                <Plus size={16} /> Agendar nuevo
              </Link>
            </div>
            <div className="space-y-3">
              {turnosPaciente.length === 0 ? (
                <div className="text-center py-10 text-[#A49A8D]">
                  <p>No hay turnos registrados para este paciente.</p>
                </div>
              ) : (
                turnosPaciente.map((turno) => (
                  <div
                    key={turno.id}
                    className="bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl transition-all overflow-hidden shadow-sm hover:shadow-md"
                  >
                    {/* ACÁ EMPIEZA LA NUEVA TARJETA QUE TE MANDA A LA PANTALLA COMPLETA */}
                    <Link
                      href={`/turnos/${turno.id}`}
                      className="flex items-center gap-5 p-5 cursor-pointer group hover:bg-white transition-all"
                      title="Hacer clic para ver o editar turno completo"
                    >
                      <div className="bg-white group-hover:bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E3D9] group-hover:border-[#6B806F]/50 text-center min-w-[70px] transition-all">
                        <span className="block text-sm font-black text-[#6B806F]">
                          {formatearFecha(turno.fecha).slice(0, 5)}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-[#4A443C] group-hover:text-[#6B806F] text-lg leading-tight transition-colors">
                          {turno.hora.slice(0, 5)} hs
                        </p>
                        <span
                          className={`text-xs font-bold mt-1 inline-block capitalize ${
                            turno.estado === "Completado" ||
                            turno.estado === "asistio"
                              ? "text-[#556B5A]"
                              : turno.estado === "Cancelado" ||
                                turno.estado === "falto"
                              ? "text-[#B06043]"
                              : "text-[#A49A8D]"
                          }`}
                        >
                          {turno.estado || "Agendado"}
                        </span>

                        {/* ALERTA DE TURNO VENCIDO */}
                        {(!turno.estado ||
                          turno.estado === "Agendado" ||
                          turno.estado === "pendiente") &&
                          new Date(turno.fecha) <
                            new Date(new Date().setHours(0, 0, 0, 0)) && (
                            <span className="ml-2 text-[10px] font-black bg-[#FCEEE9] text-[#B06043] px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
                              ¡Requiere acción!
                            </span>
                          )}
                      </div>

                      <div className="ml-auto text-[#A49A8D] group-hover:text-[#6B806F] transition-colors">
                        <Edit3 size={20} />
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VISTA 3: NOTAS (HISTORIAL DE EVOLUCIÓN) */}
        {pestana === "notas" &&
          (rol === "secretaria" ? (
            <div className="bg-white p-16 rounded-[2.5rem] border-2 border-dashed border-[#E8E3D9] text-center shadow-sm">
              <div className="bg-[#FCEEE9] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="text-[#B06043]" size={40} />
              </div>
              <h3 className="text-2xl font-black text-[#4A443C] mb-2">
                Acceso Confidencial
              </h3>
              <p className="text-[#8A8175] font-medium max-w-md mx-auto">
                Por cuestiones de privacidad y secreto profesional, no tenés
                permisos para visualizar ni editar las notas clínicas de las
                sesiones.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-[#4A443C]">
                    Historial de Evolución
                  </h2>
                  <p className="text-[#8A8175] font-medium mt-1">
                    Registro de sesiones, notas clínicas y evolución del
                    paciente.
                  </p>
                </div>
                <button
                  onClick={() => setMostrarFormulario(!mostrarFormulario)}
                  className="bg-[#6B806F] text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-[#556B5A] flex items-center gap-2 shadow-sm whitespace-nowrap"
                >
                  <Plus size={18} /> Nueva Evolución
                </button>
              </div>

              {/* BUSCADOR Y FILTROS */}
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1 group">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A49A8D]"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Buscá en las notas clínicas..."
                    className="w-full p-4 pl-12 bg-white border border-[#E8E3D9] rounded-2xl outline-none focus:border-[#6B806F] text-[#4A443C] font-medium"
                    value={busquedaEvoluciones}
                    onChange={(e) => setBusquedaEvoluciones(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                  {["Todas", "Este mes", "Con Diagnóstico", "Solo notas"].map(
                    (f) => (
                      <button
                        key={f}
                        onClick={() => setFiltroEvoluciones(f)}
                        className={`whitespace-nowrap px-6 py-4 rounded-2xl text-sm font-bold transition-all border ${
                          filtroEvoluciones === f
                            ? "bg-[#4A443C] text-white border-[#4A443C]"
                            : "bg-white text-[#8A8175] border-[#E8E3D9] hover:bg-[#FBF9F6]"
                        }`}
                      >
                        {f}
                      </button>
                    )
                  )}
                </div>
              </div>

              {mostrarFormulario && (
                <div className="bg-white border-2 border-[#E8F0E9] shadow-md rounded-[2.5rem] p-8 animate-in zoom-in-95 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-xs font-bold text-[#8A8175] mb-2">
                        Fecha
                      </label>
                      <input
                        type="date"
                        className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-xl outline-none"
                        value={nuevaEvolucion.fecha}
                        onChange={(e) =>
                          setNuevaEvolucion({
                            ...nuevaEvolucion,
                            fecha: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-2 relative">
                      <label className="block text-xs font-bold text-[#8A8175] mb-2">
                        Diagnóstico / Tema principal
                      </label>
                      <div className="relative group">
                        <Search
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A49A8D]"
                          size={18}
                        />
                        <input
                          placeholder="Buscá por trastorno (Ej: Ansiedad)..."
                          className="w-full p-4 pl-12 bg-[#FBF9F6] border border-[#E8E3D9] rounded-xl outline-none focus:ring-2 focus:ring-[#6B806F]/20"
                          value={nuevaEvolucion.diagnostico}
                          onChange={(e) => buscarDiagnostico(e.target.value)}
                        />
                      </div>

                      {sugerenciasDSM.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-[#E8E3D9] rounded-xl shadow-xl max-h-60 overflow-y-auto">
                          {sugerenciasDSM.map((diag, idx) => (
                            <button
                              key={idx}
                              onClick={() => seleccionarDiagnostico(diag)}
                              className="w-full text-left px-4 py-3 hover:bg-[#FBF9F6] border-b border-[#F2EFE9] last:border-0 transition-colors flex items-start gap-2"
                            >
                              <span className="font-bold text-[#6B806F] text-sm shrink-0">
                                {diag.codigo}
                              </span>
                              <span className="text-[#4A443C] text-sm">
                                {diag.nombre}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-[#8A8175] mb-2">
                      Notas clínicas
                    </label>
                    <textarea
                      rows={5}
                      className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-xl outline-none resize-none text-lg leading-relaxed"
                      value={nuevaEvolucion.notas}
                      onChange={(e) =>
                        setNuevaEvolucion({
                          ...nuevaEvolucion,
                          notas: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setMostrarFormulario(false)}
                      className="px-6 py-3 text-[#8A8175] font-bold hover:text-[#4A443C]"
                    >
                      Cancelar
                    </button>
                    <button
  onClick={() => {
    if (notaEnEdicionId) {
      actualizarNota();
    } else {
      guardarNota();
    }
  }}
  disabled={guardandoEvolucion}
  className="bg-[#6B806F] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm hover:bg-[#556B5A]"
>
  {guardandoEvolucion ? "Guardando..." : notaEnEdicionId ? "Actualizar nota" : "Guardar nota"}
</button>
                  </div>
                </div>
              )}

              {/* LISTADO TIPO TARJETAS */}
              <div className="space-y-4">
                {evolucionesFiltradas.length === 0 ? (
                  <div className="bg-white border border-[#E8E3D9] rounded-[2.5rem] p-10 text-center text-[#A49A8D]">
                    <p>No se encontraron notas clínicas.</p>
                  </div>
                ) : (
                  evolucionesFiltradas.map((evo) => {
                    const fechaInfo = formatearFechaTarjeta(evo.fecha);
                    return (
                      <div
                        key={evo.id}
                        className="bg-white border border-[#E8E3D9] rounded-[2rem] p-6 flex flex-col md:flex-row gap-6 shadow-sm hover:shadow-md transition-all"
                      >
                        {/* FECHA LEFT */}
                        <div className="bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl min-w-[120px] flex flex-col items-center justify-center p-5">
                          <span className="text-4xl font-black text-[#4A443C] leading-none">
                            {fechaInfo.dia}
                          </span>
                          <span className="text-sm font-black text-[#8A8175] uppercase tracking-widest mt-2">
                            {fechaInfo.mes}
                          </span>
                          <span className="text-xs font-bold text-[#A49A8D] mt-1">
                            {fechaInfo.anio}
                          </span>
                          <div className="mt-4 pt-3 border-t border-[#E8E3D9] w-full text-center">
                            <span className="text-[10px] font-black text-[#6B806F] uppercase tracking-widest">
                              SESIÓN
                            </span>
                          </div>
                        </div>
                        {/* CONTENIDO RIGHT */}
                        <div className="flex-1 flex flex-col">
                          <div className="flex flex-wrap gap-2 mb-4">
                            {evo.diagnostico && (
                              <span className="text-[10px] font-black bg-[#FCEEE9] text-[#B06043] px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                {evo.diagnostico}
                              </span>
                            )}
                            <span className="text-[10px] font-black bg-[#E8F0E9] text-[#556B5A] px-3 py-1.5 rounded-lg uppercase tracking-wider">
                              Nota Clínica
                            </span>
                          </div>
                          <p className="text-[#4A443C] font-medium text-lg leading-relaxed mb-6 whitespace-pre-wrap">
                            {evo.notas}
                          </p>
                          <div className="mt-auto flex items-center justify-between pt-4 border-t border-[#F2EFE9]">
                            <div className="flex items-center gap-6 text-xs font-bold text-[#A49A8D]">
                              <span className="flex items-center gap-1.5">
                                <Clock size={16} /> 45 min
                              </span>
                              <span className="flex items-center gap-1.5">
                                <User size={16} /> Profesional
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
  {/* Botón de Editar (Tuerquita) */}
  <button 
    onClick={() => {
      setNotaEnEdicionId(evo.id);
      setNuevaEvolucion({ fecha: evo.fecha, diagnostico: evo.diagnostico || "", notas: evo.notas || "" });
      setMostrarFormulario(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }}
    className="text-[#A49A8D] hover:text-[#6B806F] transition-colors"
    title="Editar nota"
  >
    <Settings2 size={20} />
  </button>

  {/* Botón de Eliminar (Cruz roja) */}
  <button 
    onClick={async () => {
      if (confirm("¿Estás seguro de que deseas eliminar esta nota clínica? Esta acción no se puede deshacer.")) {
        const { error } = await supabase
          .from("evoluciones")
          .delete()
          .eq("id", evo.id);
        
        if (!error) {
          traerDatos();
        } else {
          alert("Error al eliminar: " + error.message);
        }
      }
    }}
    className="text-[#A49A8D] hover:text-[#B06043] transition-colors"
    title="Eliminar nota"
  >
    <XCircle size={20} />
  </button>
</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}

        {/* VISTA 4: CUADRO CLÍNICO */}
        {pestana === "clinica" &&
          (rol === "secretaria" ? (
            <div className="bg-white p-16 rounded-[2.5rem] border-2 border-dashed border-[#E8E3D9] text-center shadow-sm">
              <div className="bg-[#FCEEE9] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="text-[#B06043]" size={40} />
              </div>
              <h3 className="text-2xl font-black text-[#4A443C] mb-2">
                Acceso Confidencial
              </h3>
              <p className="text-[#8A8175] font-medium max-w-md mx-auto">
                Por cuestiones de privacidad y secreto profesional, no tenés
                permisos para visualizar el cuadro clínico ni la medicación del
                paciente.
              </p>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-[2.5rem] border border-[#E8E3D9] shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-8 border-b border-[#F2EFE9] pb-4">
                <h2 className="text-xl font-bold text-[#4A443C] flex items-center gap-2">
                  <Stethoscope size={20} className="text-[#8C9C8E]" /> Cuadro
                  clínico de ingreso
                </h2>
                {!editandoClinica && (
                  <button
                    onClick={() => setEditandoClinica(true)}
                    className="text-[#A49A8D] hover:text-[#6B806F] p-2 rounded-lg transition-all"
                    title="Hacer clic para editar"
                  >
                    <Edit3 size={18} />
                  </button>
                )}
              </div>

              {!editandoClinica ? (
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in"
                  onClick={() => setEditandoClinica(true)}
                >
                  <div className="cursor-pointer group hover:bg-[#FBF9F6] p-4 rounded-2xl -m-4 transition-colors h-fit">
                    <p className="text-xs font-bold text-[#8A8175] mb-3 group-hover:text-[#6B806F]">
                      <FileText size={14} className="inline mr-1" /> Motivo de
                      consulta
                    </p>
                    <div className="bg-[#FBF9F6] group-hover:bg-white p-6 rounded-2xl border border-[#E8E3D9] group-hover:border-[#6B806F]/50 transition-colors">
                      <p className="text-[#4A443C] font-medium leading-relaxed text-lg whitespace-pre-wrap">
                        {paciente.motivo_consulta ||
                          "Hacé clic acá para añadir motivo de consulta..."}
                      </p>
                    </div>
                  </div>
                  <div className="cursor-pointer group hover:bg-[#FBF9F6] p-4 rounded-2xl -m-4 transition-colors h-fit">
                    <p className="text-xs font-bold text-[#8A8175] mb-3 group-hover:text-[#6B806F]">
                      <Pill size={14} className="inline mr-1" /> Psiquiatría y
                      medicación
                    </p>
                    <div className="bg-[#FBF9F6] group-hover:bg-white p-6 rounded-2xl border border-[#E8E3D9] group-hover:border-[#6B806F]/50 transition-colors">
                      {renderMedicacion()}
                    </div>
                  </div>

                  {paciente.antecedente_internacion && (
                    <div className="bg-[#FCEEE9] border border-[#F5D8CE] p-6 rounded-2xl flex items-start gap-4 mt-4 col-span-1 md:col-span-2 shadow-sm cursor-pointer hover:border-[#B06043]/50 transition-colors">
                      <AlertTriangle
                        size={24}
                        className="text-[#B06043] shrink-0"
                      />
                      <div>
                        <p className="font-bold text-[#B06043] text-lg text-xs mb-1">
                          Antecedente de internación psiquiátrica
                        </p>
                        <p className="text-[#B06043] mt-2 leading-relaxed whitespace-pre-wrap font-medium">
                          {paciente.detalle_internacion}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#FBF9F6] p-6 rounded-3xl border-2 border-[#6B806F]/20 animate-in zoom-in-95 duration-200">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-[#8A8175] mb-2">
                      Motivo de consulta
                    </label>
                    <textarea
                      rows={6}
                      className="w-full p-4 bg-white border border-[#E8E3D9] rounded-xl outline-none resize-none text-lg"
                      value={formClinicaData.motivo_consulta}
                      onChange={(e) =>
                        setFormClinicaData({
                          ...formClinicaData,
                          motivo_consulta: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-bold text-[#8A8175]">
                        Medicación y profesionales
                      </label>
                      <button
                        onClick={agregarMedicion}
                        className="text-[#6B806F] font-bold text-xs flex items-center gap-1.5 hover:bg-[#E8F0E9] px-2 py-1 rounded-lg transition-colors"
                      >
                        <Plus size={14} /> Añadir
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(Array.isArray(medicacionesForm)
                        ? medicacionesForm
                        : []
                      ).map((med, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-[#E8E3D9] relative pr-10 shadow-sm"
                        >
                          <input
                            placeholder="Droga (Ej: Clonazepam 1mg)"
                            className="w-full p-2 bg-transparent outline-none text-sm font-medium"
                            value={med.droga || med.nombre || ""}
                            onChange={(e) =>
                              actualizarMedicacion(
                                index,
                                "nombre",
                                e.target.value
                              )
                            }
                          />
                          <input
                            placeholder="Médico / Matrícula"
                            className="w-full p-2 bg-transparent border-l border-[#F2EFE9] outline-none text-sm text-[#8A8175]"
                            value={med.medico || med.profesional || ""}
                            onChange={(e) =>
                              actualizarMedicacion(
                                index,
                                "profesional",
                                e.target.value
                              )
                            }
                          />
                          <button
                            onClick={() => removerMedicacion(index)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A49A8D] hover:text-[#8C3C2A] transition-colors"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2 pt-6 border-t border-[#E8E3D9] mt-2">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="flex items-center gap-2 text-[#B06043] font-bold text-xs">
                        <AlertTriangle size={14} /> ¿Tiene antecedentes de
                        internación psiquiátrica?
                      </h4>
                      <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-[#E8E3D9]">
                        <button
                          onClick={() =>
                            setFormClinicaData({
                              ...formClinicaData,
                              antecedente_internacion: false,
                            })
                          }
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                            !formClinicaData.antecedente_internacion
                              ? "bg-[#F2EFE9] text-[#4A443C]"
                              : "text-[#8A8175] hover:bg-[#FBF9F6]"
                          }`}
                        >
                          No
                        </button>
                        <button
                          onClick={() =>
                            setFormClinicaData({
                              ...formClinicaData,
                              antecedente_internacion: true,
                            })
                          }
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                            formClinicaData.antecedente_internacion
                              ? "bg-[#6B806F] text-white shadow-sm"
                              : "text-[#8A8175] hover:bg-[#FBF9F6]"
                          }`}
                        >
                          Sí
                        </button>
                      </div>
                    </div>
                    {formClinicaData.antecedente_internacion && (
                      <textarea
                        rows={3}
                        placeholder="Detalles de la internación..."
                        className="w-full p-4 bg-white border border-[#E8E3D9] rounded-xl outline-none resize-none text-lg animate-in fade-in"
                        value={formClinicaData.detalle_internacion}
                        onChange={(e) =>
                          setFormClinicaData({
                            ...formClinicaData,
                            detalle_internacion: e.target.value,
                          })
                        }
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

        {/* VISTA 5: PLAN TERAPÉUTICO Y MÉTRICAS */}
        {pestana === "plan" && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-[#E8E3D9] shadow-sm">
            <h2 className="text-xl font-bold text-[#4A443C] mb-8 border-b border-[#F2EFE9] pb-4 flex items-center gap-2">
              <Target size={20} className="text-[#B06043]" /> Plan terapéutico
            </h2>

            {!plan ? (
              <>
                {/* AYUDAMEMORIA CLÍNICO ARRIBA SI AÚN NO HAY PLAN */}
                <div
                  onClick={() => cambiarPestana("clinica")}
                  className="mb-8 bg-[#FBF9F6] p-5 rounded-2xl border border-[#E8E3D9] flex gap-4 items-start shadow-sm cursor-pointer group hover:bg-white hover:border-[#6B806F]/50 transition-all relative overflow-hidden"
                >
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-[#E8E3D9] shrink-0 text-[#B06043] group-hover:scale-110 transition-transform">
                    <Stethoscope size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-[#8A8175] uppercase tracking-widest mb-2 group-hover:text-[#6B806F] transition-colors flex items-center flex-wrap gap-2">
                      Cuadro Clínico
                      <span className="text-[10px] font-bold uppercase bg-[#E8F0E9] text-[#556B5A] px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm border border-[#D3DDD4]">
                        <Eye size={20} />
                      </span>
                    </h4>
                    <p
                      className="text-[#4A443C] font-medium text-sm mb-2 line-clamp-2"
                      title={paciente.motivo_consulta}
                    >
                      <span className="font-bold">Motivo:</span>{" "}
                      {paciente.motivo_consulta || "No registrado."}
                    </p>
                    <p className="text-[#4A443C] font-medium text-sm">
                      <span className="font-bold">Medicación:</span>{" "}
                      {Array.isArray(medicacionesForm) &&
                      medicacionesForm.length > 0 ? (
                        <span className="text-[#B06043] font-bold bg-[#FCEEE9] px-2 py-0.5 rounded-md text-xs ml-1">
                          Sí
                        </span>
                      ) : (
                        <span className="text-[#8A8175] italic ml-1">
                          Sin medicación
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-center py-12 border-2 border-dashed border-[#E8E3D9] rounded-3xl mb-8">
                  <Compass
                    size={48}
                    className="mx-auto mb-4 text-[#A49A8D] opacity-50"
                  />
                  <h3 className="text-xl font-bold text-[#6D645A] mb-2">
                    Aún no definiste el encuadre
                  </h3>
                  {!creandoPlan ? (
                    <button
                      onClick={() => setCreandoPlan(true)}
                      className="mt-6 bg-[#6B806F] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#556B5A] shadow-sm"
                    >
                      Configurar plan ahora
                    </button>
                  ) : (
                    <div className="text-left max-w-md mx-auto mt-8 space-y-5 animate-in fade-in">
                      <div>
                        <label className="block text-xs font-bold text-[#8A8175] mb-2">
                          Enfoque clínico
                        </label>
                        <select
                          className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-xl outline-none"
                          value={formPlan.enfoque_terapeutico}
                          onChange={(e) =>
                            setFormPlan({
                              ...formPlan,
                              enfoque_terapeutico: e.target.value,
                            })
                          }
                        >
                          <option value="">Seleccionar enfoque...</option>
                          <option value="Terapia Cognitivo-Conductual (TCC)">
                            Terapia Cognitivo-Conductual (TCC)
                          </option>
                          <option value="Psicoanálisis">Psicoanálisis</option>
                          <option value="Terapia Sistémica">
                            Terapia Sistémica
                          </option>
                          <option value="Terapia Gestalt">
                            Terapia Gestalt
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#8A8175] mb-2">
                          Frecuencia
                        </label>
                        <select
                          className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-xl outline-none"
                          value={formPlan.frecuencia_sesiones}
                          onChange={(e) =>
                            setFormPlan({
                              ...formPlan,
                              frecuencia_sesiones: e.target.value,
                            })
                          }
                        >
                          <option value="">Seleccionar...</option>
                          <option value="1 vez por semana">
                            1 vez por semana
                          </option>
                          <option value="1 vez cada 15 días">
                            1 vez cada 15 días
                          </option>
                          <option value="1 vez al mes">1 vez al mes</option>
                        </select>
                      </div>
                      <button
                        onClick={guardarPlan}
                        className="w-full bg-[#6B806F] text-white px-6 py-4 rounded-xl font-bold text-lg shadow-sm"
                      >
                        Guardar encuadre
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="mb-8">
                {/* GRILLA: PLAN IZQUIERDA / AYUDAMEMORIA DERECHA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* IZQUIERDA: PLAN ACTIVO */}
                  <div className="bg-[#FBF9F6] p-6 rounded-2xl border border-[#E8E3D9] flex flex-col justify-center shadow-sm">
                    <div>
                      <span className="text-xs font-bold text-[#B06043] bg-[#FCEEE9] px-3 py-1 rounded-md mb-3 inline-block">
                        Plan activo
                      </span>
                      <h3 className="font-bold text-[#4A443C] text-2xl mb-1">
                        {plan.enfoque_terapeutico}
                      </h3>
                      <p className="text-[#8A8175] font-medium flex items-center gap-1.5">
                        <Clock size={16} /> Frecuencia:{" "}
                        {plan.frecuencia_sesiones}
                      </p>
                    </div>
                  </div>

                  {/* DERECHA: AYUDAMEMORIA (CLICKABLE PARA IR A CLÍNICA) */}
                  <div
                    onClick={() => cambiarPestana("clinica")}
                    className="bg-[#FBF9F6] p-5 rounded-2xl border border-[#E8E3D9] flex gap-4 items-start shadow-sm cursor-pointer group hover:bg-white hover:border-[#6B806F]/50 transition-all relative overflow-hidden"
                    title="Hacer clic para ir al Cuadro Clínico completo"
                  >
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-[#E8E3D9] shrink-0 text-[#B06043] group-hover:scale-110 transition-transform">
                      <Stethoscope size={24} />
                    </div>
                    <div className="flex-1 pr-2">
                      <h4 className="text-xs font-bold text-[#8A8175] uppercase tracking-widest mb-2 group-hover:text-[#6B806F] transition-colors flex items-center flex-wrap gap-2">
                        Cuadro Clínico
                        <span className="text-[10px] font-bold uppercase bg-[#E8F0E9] text-[#556B5A] px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm border border-[#D3DDD4]">
                          <Eye size={20} />
                        </span>
                      </h4>
                      <p
                        className="text-[#4A443C] font-medium text-sm mb-2 line-clamp-2"
                        title={paciente.motivo_consulta}
                      >
                        <span className="font-bold">Motivo:</span>{" "}
                        {paciente.motivo_consulta || "No registrado."}
                      </p>
                      <p className="text-[#4A443C] font-medium text-sm">
                        <span className="font-bold">Medicación:</span>{" "}
                        {Array.isArray(medicacionesForm) &&
                        medicacionesForm.length > 0 ? (
                          <span className="text-[#B06043] font-bold bg-[#FCEEE9] px-2 py-0.5 rounded-md text-xs ml-1">
                            Sí
                          </span>
                        ) : (
                          <span className="text-[#8A8175] italic ml-1">No</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-[#8A8175] mb-4">
                  Checklist de objetivos
                </h4>
                <div className="space-y-3 mb-6">
                  {objetivos.map((obj) => (
                    <div
                      key={obj.id}
                      className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${
                        obj.cumplido
                          ? "bg-[#F2EFE9] border-transparent opacity-60"
                          : "bg-white border-[#E8E3D9] shadow-sm hover:border-[#6B806F]"
                      }`}
                    >
                      <button
                        onClick={() => toggleObjetivo(obj.id, obj.cumplido)}
                        className="mt-0.5 text-[#6B806F] hover:scale-110 transition-transform"
                      >
                        {obj.cumplido ? (
                          <CheckSquare size={24} />
                        ) : (
                          <Square size={24} />
                        )}
                      </button>
                      <p
                        className={`font-medium text-lg ${
                          obj.cumplido
                            ? "text-[#8A8175] line-through"
                            : "text-[#4A443C]"
                        }`}
                      >
                        {obj.descripcion}
                      </p>
                    </div>
                  ))}
                </div>

                {/* BARRA PARA AGREGAR OBJETIVOS */}
                <div className="flex gap-3 bg-[#FBF9F6] p-2 rounded-2xl border border-[#E8E3D9]">
                  <input
                    id="input-objetivo"
                    placeholder="Escribí un nuevo objetivo a lograr..."
                    className="flex-1 bg-transparent p-3 outline-none font-medium text-[#4A443C]"
                    value={formObjetivo.descripcion}
                    onChange={(e) =>
                      setFormObjetivo({
                        ...formObjetivo,
                        descripcion: e.target.value,
                      })
                    }
                    onKeyDown={(e) => e.key === "Enter" && agregarObjetivo()}
                  />
                  <button
                    onClick={agregarObjetivo}
                    className="bg-[#6B806F] text-white px-6 py-2 rounded-xl font-bold shadow-sm hover:bg-[#556B5A] transition-colors"
                  >
                    Añadir
                  </button>
                </div>

                {/* BOTONERA DE SUGERENCIAS RÁPIDAS */}
                <div className="mt-4 flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-bold text-[#8A8175] mr-1 flex items-center gap-1">
                    <Activity size={14} /> Sugerencias:
                  </span>
                  {[
                    "Registro de pensamientos automáticos",
                    "Técnica de relajación diafragmática",
                    "Higiene del sueño",
                    "Exposición gradual",
                    "Activación conductual",
                    "Regulación emocional",
                  ].map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setFormObjetivo({ ...formObjetivo, descripcion: sug });
                        setTimeout(() => {
                          document.getElementById("input-objetivo")?.focus();
                        }, 100);
                      }}
                      className="text-[10px] font-bold bg-[#E8F0E9] text-[#556B5A] px-3 py-1.5 rounded-lg hover:bg-[#6B806F] hover:text-white transition-colors border border-[#D3DDD4]"
                      title="Clic para copiar al campo de texto"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SECCIÓN: MÉTRICAS Y EVALUACIONES (BATERÍA) */}
            <div className="pt-8 border-t border-[#E8E3D9]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h4 className="text-xs font-bold text-[#8A8175] uppercase tracking-widest flex items-center gap-2">
                  <Activity size={16} /> Screening y Evaluaciones
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => iniciarTest("BATERIA")}
                    className="text-xs font-bold bg-[#6B806F] text-white px-4 py-2 rounded-xl hover:bg-[#556B5A] transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Ambos
                  </button>
                  <button
                    onClick={() => iniciarTest("PHQ-9")}
                    className="text-xs font-bold bg-[#FBF9F6] border border-[#E8E3D9] text-[#6B806F] px-4 py-2 rounded-xl hover:bg-[#E8F0E9] hover:border-[#D3DDD4] transition-all shadow-sm flex items-center gap-1.5"
                  >
                    PHQ-9
                  </button>
                  <button
                    onClick={() => iniciarTest("GAD-7")}
                    className="text-xs font-bold bg-[#FBF9F6] border border-[#E8E3D9] text-[#6B806F] px-4 py-2 rounded-xl hover:bg-[#E8F0E9] hover:border-[#D3DDD4] transition-all shadow-sm flex items-center gap-1.5"
                  >
                    GAD-7
                  </button>
                </div>
              </div>

              {/* FORMULARIO INTERACTIVO (DINÁMICO) */}
              {testActivo && (
                <div className="bg-[#FBF9F6] border-2 border-[#E8E3D9] rounded-3xl p-6 mb-8 animate-in zoom-in-95 duration-300 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-[#E8E3D9] pb-6">
                    <div>
                      <h5 className="font-black text-xl text-[#4A443C]">
                        {testActivo === "BATERIA"
                          ? "Batería Básica (PHQ-9 + GAD-7)"
                          : testActivo === "PHQ-9"
                          ? "Cuestionario PHQ-9 (Depresión)"
                          : "Escala GAD-7 (Ansiedad)"}
                      </h5>
                      <p className="text-sm font-bold text-[#8C3C2A] mt-2">
                        Instrucción: Durante las últimas 2 semanas...
                      </p>
                    </div>

                    <div className="flex gap-3">
                      {(testActivo === "PHQ-9" || testActivo === "BATERIA") && (
                        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-[#E8E3D9] text-center min-w-[110px]">
                          <span className="block text-[10px] font-bold text-[#8A8175] uppercase mb-1">
                            PHQ-9
                          </span>
                          <span className="font-black text-2xl text-[#6B806F] block leading-none mb-1">
                            {respuestasPHQ9.filter((r) => r !== -1).length > 0
                              ? respuestasPHQ9
                                  .filter((r) => r !== -1)
                                  .reduce((a, b) => a + b, 0)
                              : "-"}
                          </span>
                        </div>
                      )}
                      {(testActivo === "GAD-7" || testActivo === "BATERIA") && (
                        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-[#E8E3D9] text-center min-w-[110px]">
                          <span className="block text-[10px] font-bold text-[#8A8175] uppercase mb-1">
                            GAD-7
                          </span>
                          <span className="font-black text-2xl text-[#6B806F] block leading-none mb-1">
                            {respuestasGAD7.filter((r) => r !== -1).length > 0
                              ? respuestasGAD7
                                  .filter((r) => r !== -1)
                                  .reduce((a, b) => a + b, 0)
                              : "-"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BLOQUE PHQ-9 */}
                  {(testActivo === "PHQ-9" || testActivo === "BATERIA") && (
                    <div className="mb-10">
                      {testActivo === "BATERIA" && (
                        <h6 className="font-black text-[#4A443C] mb-6 text-lg border-b border-[#D3DDD4] pb-2">
                          Sección 1: PHQ-9 (Depresión)
                        </h6>
                      )}
                      <div className="space-y-6">
                        {preguntasPHQ9.map((pregunta, i) => (
                          <div key={`phq-${i}`} className="flex flex-col gap-3">
                            <p className="font-bold text-sm text-[#4A443C]">
                              {i + 1}. {pregunta}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {opcionesRespuestaPHQ9.map(
                                (opcion, indexOpcion) => (
                                  <button
                                    key={indexOpcion}
                                    onClick={() => {
                                      const r = [...respuestasPHQ9];
                                      r[i] = indexOpcion;
                                      setRespuestasPHQ9(r);
                                    }}
                                    className={`text-xs font-bold p-3 rounded-xl border transition-all text-left
                                                            ${
                                                              respuestasPHQ9[
                                                                i
                                                              ] === indexOpcion
                                                                ? "bg-[#6B806F] text-white border-[#6B806F] shadow-sm"
                                                                : "bg-white text-[#8A8175] border-[#E8E3D9] hover:border-[#6B806F]/50 hover:bg-[#FBF9F6]"
                                                            }`}
                                  >
                                    <span className="block text-[10px] opacity-70 mb-0.5">
                                      +{indexOpcion} pts
                                    </span>
                                    {opcion}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        ))}

                        <div className="flex flex-col gap-3 pt-6 border-t border-[#E8E3D9]">
                          <p className="font-bold text-sm text-[#4A443C]">
                            Si marcó algún problema arriba, ¿qué tan difícil le
                            ha resulto hacer su trabajo, atender el hogar o
                            relacionarse?
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {opcionesDificultad.map((opcion, indexOpcion) => (
                              <button
                                key={indexOpcion}
                                onClick={() => setDificultadPHQ9(indexOpcion)}
                                className={`text-xs font-bold p-3 rounded-xl border transition-all text-center
                                                        ${
                                                          dificultadPHQ9 ===
                                                          indexOpcion
                                                            ? "bg-[#4A443C] text-white border-[#4A443C] shadow-sm"
                                                            : "bg-white text-[#8A8175] border-[#E8E3D9] hover:border-[#4A443C]/50 hover:bg-[#FBF9F6]"
                                                        }`}
                              >
                                {opcion}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BLOQUE GAD-7 */}
                  {(testActivo === "GAD-7" || testActivo === "BATERIA") && (
                    <div>
                      {testActivo === "BATERIA" && (
                        <h6 className="font-black text-[#4A443C] mb-6 text-lg border-b border-[#D3DDD4] pb-2 mt-12">
                          Sección 2: GAD-7 (Ansiedad)
                        </h6>
                      )}
                      <div className="space-y-6">
                        {preguntasGAD7.map((pregunta, i) => (
                          <div key={`gad-${i}`} className="flex flex-col gap-3">
                            <p className="font-bold text-sm text-[#4A443C]">
                              {i + 1}. {pregunta}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {opcionesRespuestaGAD7.map(
                                (opcion, indexOpcion) => (
                                  <button
                                    key={indexOpcion}
                                    onClick={() => {
                                      const r = [...respuestasGAD7];
                                      r[i] = indexOpcion;
                                      setRespuestasGAD7(r);
                                    }}
                                    className={`text-xs font-bold p-3 rounded-xl border transition-all text-left
                                                            ${
                                                              respuestasGAD7[
                                                                i
                                                              ] === indexOpcion
                                                                ? "bg-[#6B806F] text-white border-[#6B806F] shadow-sm"
                                                                : "bg-white text-[#8A8175] border-[#E8E3D9] hover:border-[#6B806F]/50 hover:bg-[#FBF9F6]"
                                                            }`}
                                  >
                                    <span className="block text-[10px] opacity-70 mb-0.5">
                                      +{indexOpcion} pts
                                    </span>
                                    {opcion}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        ))}

                        <div className="flex flex-col gap-3 pt-6 border-t border-[#E8E3D9]">
                          <p className="font-bold text-sm text-[#4A443C]">
                            Si marcó algún problema arriba, ¿qué tan difícil le
                            ha resulto hacer su trabajo, atender el hogar o
                            relacionarse?
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {opcionesDificultad.map((opcion, indexOpcion) => (
                              <button
                                key={indexOpcion}
                                onClick={() => setDificultadGAD7(indexOpcion)}
                                className={`text-xs font-bold p-3 rounded-xl border transition-all text-center
                                                        ${
                                                          dificultadGAD7 ===
                                                          indexOpcion
                                                            ? "bg-[#4A443C] text-white border-[#4A443C] shadow-sm"
                                                            : "bg-white text-[#8A8175] border-[#E8E3D9] hover:border-[#4A443C]/50 hover:bg-[#FBF9F6]"
                                                        }`}
                              >
                                {opcion}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-10 flex justify-end gap-3 pt-6 border-t border-[#E8E3D9]">
                    <button
                      onClick={cancelarTest}
                      className="px-6 py-3 text-sm font-bold text-[#8A8175] hover:text-[#4A443C]"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={guardarEvaluacion}
                      className="bg-[#6B806F] text-white px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-[#556B5A]"
                    >
                      <Save size={16} /> Guardar Resultado
                    </button>
                  </div>
                </div>
              )}

              {/* HISTORIAL DE EVALUACIONES */}
              {evaluacionesLocales.length === 0 && testActivo === null ? (
                <div className="text-center py-10 bg-[#FBF9F6] rounded-3xl border border-[#E8E3D9]">
                  <BarChart2
                    size={32}
                    className="mx-auto mb-3 text-[#A49A8D] opacity-50"
                  />
                  <p className="text-[#8A8175] font-medium text-sm">
                    Aún no se realizaron evaluaciones.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {evaluacionesLocales.map((evaluacion) => (
                    <div
                      key={evaluacion.id}
                      className="bg-white border border-[#E8E3D9] p-6 rounded-[2rem] shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-4 border-b border-[#E8E3D9] pb-4">
                        <h5 className="font-black text-[#4A443C] text-lg">
                          {evaluacion.tipo}
                        </h5>
                        <span className="text-xs font-bold text-[#8A8175] uppercase tracking-widest">
                          {formatearFecha(evaluacion.fecha)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {evaluacion.resultados.map((res: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-[#FBF9F6] p-4 rounded-2xl border border-[#E8E3D9]"
                          >
                            <div>
                              <span className="font-black text-[#4A443C] text-md block mb-1">
                                {res.nombre}
                              </span>
                              <span
                                className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${res.color}`}
                              >
                                {res.severidad}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="block text-4xl font-black text-[#4A443C] leading-none mb-1">
                                {res.puntaje}
                              </span>
                              <span className="text-[9px] font-bold text-[#A49A8D] uppercase block">
                                Puntos
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* BOTÓN MAGICO DE OBJETIVOS SMART */}
                      <div className="mt-4 pt-4 flex gap-2">
                        <button
                          onClick={() =>
                            generarObjetivosSMART(evaluacion.resultados)
                          }
                          className="text-xs font-bold bg-[#E8F0E9] text-[#556B5A] px-4 py-2 rounded-xl hover:bg-[#6B806F] hover:text-white transition-colors flex items-center gap-1.5"
                          title="Crea un objetivo automático basado en este resultado"
                        >
                          <Target size={14} /> Generar objetivo SMART
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BOTONERA FLOTANTE PARA EDICIÓN */}
      {hayEdicionActiva && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-white p-2 rounded-full shadow-2xl border border-[#E8E3D9] flex items-center gap-2">
            <button
              onClick={() => {
                setEditandoDatos(false);
                setEditandoClinica(false);
              }}
              className="flex items-center gap-2 px-4 py-3 text-[#A49A8D] hover:text-[#B06043] hover:bg-[#FCEEE9] rounded-full transition-all font-bold text-sm"
            >
              <X size={20} strokeWidth={2.5} /> Cancelar
            </button>
            <button
              onClick={() => {
                if (editandoDatos) guardarDatosPersonales();
                if (editandoClinica) guardarDatosClinicos();
              }}
              className="flex items-center gap-2 px-6 py-3 bg-[#6B806F] text-white rounded-full transition-all shadow-md hover:bg-[#556B5A] hover:scale-105 font-bold text-sm"
            >
              <Check size={20} strokeWidth={2.5} /> Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
