"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Save, UserPlus, ArrowLeft, X, CreditCard, BookOpen, Search, UserCircle, Stethoscope, PhoneCall, Check, Plus,XCircle } from "lucide-react";
import Link from "next/link";

const tooltipStyles = "before:content-[attr(title)] before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:mb-2 before:px-3 before:py-1.5 before:bg-[#4A443C]/90 before:text-white before:text-xs before:font-bold before:rounded-lg before:opacity-0 before:transition-opacity before:pointer-events-none before:whitespace-nowrap group-hover:before:opacity-100";

export default function NuevoPaciente() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [sugerenciasDSM, setSugerenciasDSM] = useState<any[]>([]);
  
  // ESTADO PARA NAVEGAR ENTRE PESTAÑAS EN LA CREACIÓN
  const [pestana, setPestana] = useState('datos'); // 'datos', 'cobertura', 'clinica'

  const [form, setForm] = useState({
    nombre: "", apellido: "", dni: "",
    fecha_nacimiento: "", genero: "",
    localidad: "", provincia: "", celular: "", email: "",
    es_particular: true, prepaga: "", numero_afiliado: "", plan_obra_social: "",
    valor_sesion: "",
    motivo_consulta: "", antecedente_internacion: false, detalle_internacion: "",
    contacto_emergencia_nombre: "", contacto_emergencia_vinculo: "", contacto_emergencia_tel: "",
    diagnostico_principal: "", codigo_cie10: "", observaciones_clinicas: ""
  });

  const [listaMedicacion, setListaMedicacion] = useState([{ nombre: "", profesional: "" }]);

  const calcularEdad = (fecha: string) => {
    if (!fecha) return "";
    const hoy = new Date();
    const cumple = new Date(fecha);
    let edad = hoy.getFullYear() - cumple.getFullYear();
    const m = hoy.getMonth() - cumple.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) edad--;
    return edad + " años";
  };

  const capitalizarPalabras = (texto: string) => {
    if (!texto) return "";
    return texto.toLowerCase().replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
  };

  const buscarEnDSM = async (texto: string) => {
    setForm({ ...form, diagnostico_principal: texto });
    if (texto.length < 2) {
      setSugerenciasDSM([]);
      return;
    }
    const { data, error } = await supabase.from('diagnosticos').select('*').or(`nombre.ilike.%${texto}%,codigo.ilike.%${texto}%`).limit(10);
    if (!error && data) setSugerenciasDSM(data);
  };

  const agregarMedicacion = () => setListaMedicacion([...listaMedicacion, { nombre: "", profesional: "" }]);
  const actualizarMedicacion = (index: number, campo: string, valor: string) => {
    const nuevaLista = [...listaMedicacion];
    nuevaLista[index] = { ...nuevaLista[index], [campo]: valor };
    setListaMedicacion(nuevaLista);
  };
  const borrarMedicacion = (index: number) => {
    const nuevaLista = listaMedicacion.filter((_, i) => i !== index);
    if (nuevaLista.length === 0) nuevaLista.push({ nombre: "", profesional: "" });
    setListaMedicacion(nuevaLista);
  };

  const guardar = async () => {
    if (!form.nombre || !form.apellido || !form.dni) {
      alert("Completá nombre, apellido y DNI obligatoriamente.");
      setPestana('datos'); // Si falta algo, lo mandamos a la pestaña de datos
      return;
    }
    setEnviando(true);

    const payload: any = {
      nombre: capitalizarPalabras(form.nombre),
      apellido: capitalizarPalabras(form.apellido),
      dni: form.dni === "" ? null : form.dni,
      fecha_nacimiento: form.fecha_nacimiento === "" ? null : form.fecha_nacimiento,
      genero: form.genero,
      localidad: capitalizarPalabras(form.localidad),
      provincia: capitalizarPalabras(form.provincia),
      celular: form.celular === "" ? null : form.celular,
      es_particular: form.es_particular,
      prepaga: capitalizarPalabras(form.prepaga),
      afiliado: form.numero_afiliado === "" ? null : form.numero_afiliado,
      plan: form.plan_obra_social === "" ? null : form.plan_obra_social,
      motivo_consulta: form.motivo_consulta,
      antecedente_internacion: form.antecedente_internacion,
      detalle_internacion: form.detalle_internacion,
      contacto_emergencia_nombre: capitalizarPalabras(form.contacto_emergencia_nombre),
      contacto_emergencia_vinculo: capitalizarPalabras(form.contacto_emergencia_vinculo),
      contacto_emergencia_tel: form.contacto_emergencia_tel === "" ? null : form.contacto_emergencia_tel,
      medicacion: JSON.stringify(listaMedicacion.filter(m => m.nombre.trim() !== "")),
      profesional_tratante: "",
      valor_sesion: (form.valor_sesion && form.valor_sesion.trim() !== "") ? parseFloat(form.valor_sesion) : null
    };

    const { data, error } = await supabase.from('pacientes').insert([payload]).select();

    if (!error && data) {
      router.push(`/pacientes/${data[0].id}`); // Lo lleva a la ficha completa
    } else {
      console.error(error);
      alert("Error al guardar: " + error.message);
      setEnviando(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-32 animate-in fade-in duration-500 relative">
      
      <div>
        <Link href="/pacientes" className="inline-flex items-center gap-2 text-[#8A8175] hover:text-[#556B5A] font-medium transition-colors"><ArrowLeft size={18} /> Cancelar y volver</Link>
      </div>

      {/* CABECERA FIJA ESTILO "FICHA" */}
      <div className="sticky top-4 z-40 bg-white border border-[#E8E3D9] shadow-md rounded-[2.5rem] p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-[#E8F0E9] p-3 rounded-full text-[#556B5A]"><UserPlus size={24} /></div>
          <div>
            <h1 className="text-xl font-black text-[#4A443C] leading-none">
                {form.nombre || form.apellido ? `${capitalizarPalabras(form.apellido)}, ${capitalizarPalabras(form.nombre)}` : "Nuevo Paciente"}
            </h1>
            <p className="text-[#8A8175] text-xs font-bold mt-1">Completá las secciones para crear la ficha.</p>
          </div>
        </div>
        
        {/* BOTONERA DE NAVEGACIÓN EN LA CREACIÓN */}
        <div className="flex flex-wrap items-center bg-[#FBF9F6] p-1.5 rounded-2xl border border-[#E8E3D9]">
          <div className={`relative group ${tooltipStyles}`} title="1. Datos Personales">
            <button onClick={() => setPestana('datos')} className={`p-3 rounded-xl transition-all ${pestana === 'datos' ? 'bg-[#6B806F] text-white shadow-sm' : 'text-[#8A8175] hover:text-[#4A443C] hover:bg-[#E8E3D9]'}`}>
                <UserCircle size={20} />
            </button>
          </div>
          <div className={`relative group ${tooltipStyles}`} title="2. Cobertura y Contacto">
            <button onClick={() => setPestana('cobertura')} className={`p-3 rounded-xl transition-all ${pestana === 'cobertura' ? 'bg-[#6B806F] text-white shadow-sm' : 'text-[#8A8175] hover:text-[#4A443C] hover:bg-[#E8E3D9]'}`}>
                <CreditCard size={20} />
            </button>
          </div>
          <div className={`relative group ${tooltipStyles}`} title="3. Cuadro Clínico Inicial">
            <button onClick={() => setPestana('clinica')} className={`p-3 rounded-xl transition-all ${pestana === 'clinica' ? 'bg-[#6B806F] text-white shadow-sm' : 'text-[#8A8175] hover:text-[#4A443C] hover:bg-[#E8E3D9]'}`}>
                <Stethoscope size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* CONTENIDO DE LAS PESTAÑAS */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* PESTAÑA 1: DATOS PERSONALES */}
        {pestana === 'datos' && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-[#E8E3D9] shadow-sm relative overflow-hidden">
            <h2 className="text-xl font-bold text-[#4A443C] mb-8 border-b border-[#F2EFE9] pb-4 flex items-center gap-2">
                <UserCircle size={20} className="text-[#8C9C8E]"/> 1. Información Personal
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FBF9F6] p-6 rounded-3xl border border-[#E8E3D9]">
              <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-3 mb-2">
                  <div>
                      <label className="block text-xs font-bold text-[#8A8175] mb-2">Nombre *</label>
                      <input className="w-full p-3 bg-white border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-[#8A8175] mb-2">Apellido *</label>
                      <input className="w-full p-3 bg-white border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]" value={form.apellido} onChange={e => setForm({...form, apellido: e.target.value})} />
                  </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8A8175] mb-2">DNI *</label>
                <input placeholder="Sin puntos" className="w-full p-3 bg-white border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]" value={form.dni} onChange={e => setForm({...form, dni: e.target.value.replace(/\D/g, '')})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8A8175] mb-2">Género</label>
                <select className="w-full p-3 bg-white border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]" value={form.genero} onChange={e => setForm({ ...form, genero: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="No Binario">No Binario</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-[#8A8175] mb-2">Fecha de Nac.</label>
                    <input type="date" className="w-full p-3 bg-white border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]" value={form.fecha_nacimiento} onChange={e => setForm({...form, fecha_nacimiento: e.target.value})} />
                </div>
                <div className="w-24">
                    <label className="block text-xs font-bold text-[#8A8175] mb-2">Edad</label>
                    <div className="w-full p-3 bg-[#F2EFE9] border border-[#E8E3D9] rounded-xl text-[#6D645A] font-bold text-center">{calcularEdad(form.fecha_nacimiento) || "-"}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8A8175] mb-2">Celular</label>
                <input placeholder="Solo números" className="w-full p-3 bg-white border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]" value={form.celular} onChange={e => setForm({...form, celular: e.target.value.replace(/\D/g, '')})} />
              </div>
              <div className="flex gap-3 col-span-1 md:col-span-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-[#8A8175] mb-2">Localidad</label>
                  <input className="w-full p-3 bg-white border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]" value={form.localidad} onChange={e => setForm({...form, localidad: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-[#8A8175] mb-2">Provincia</label>
                  <input className="w-full p-3 bg-white border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]" value={form.provincia} onChange={e => setForm({...form, provincia: e.target.value})} />
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
                <button onClick={() => setPestana('cobertura')} className="px-6 py-3 bg-[#E8F0E9] text-[#556B5A] hover:bg-[#D3DDD4] rounded-xl font-bold transition-all">Siguiente: Cobertura →</button>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: COBERTURA Y EMERGENCIAS */}
        {pestana === 'cobertura' && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-[#E8E3D9] shadow-sm relative overflow-hidden">
            <h2 className="text-xl font-bold text-[#4A443C] mb-8 border-b border-[#F2EFE9] pb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-[#8C9C8E]"/> 2. Cobertura y Contacto
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h4 className="font-bold text-[#4A443C] text-sm mb-2">Acuerdos y Honorarios</h4>
                    <div className="flex items-center gap-2 bg-[#FBF9F6] p-1 rounded-xl border border-[#E8E3D9] w-fit mb-3">
                        <button onClick={() => setForm({...form, es_particular: true})} className={`px-6 py-2 rounded-lg text-xs font-bold transition-colors ${form.es_particular ? 'bg-white text-[#4A443C] shadow-sm border border-[#E8E3D9]' : 'text-[#8A8175] hover:bg-[#F2EFE9]'}`}>Particular</button>
                        <button onClick={() => setForm({...form, es_particular: false})} className={`px-6 py-2 rounded-lg text-xs font-bold transition-colors ${!form.es_particular ? 'bg-white text-[#4A443C] shadow-sm border border-[#E8E3D9]' : 'text-[#8A8175] hover:bg-[#F2EFE9]'}`}>Obra Social</button>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-[#8A8175] mb-2">Valor acordado por sesión ($)</label>
                        <input type="number" placeholder="Ej: 15000" className="w-full p-3 bg-[#FBF9F6] border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F] font-bold text-[#6B806F]" value={form.valor_sesion} onChange={e => setForm({...form, valor_sesion: e.target.value.replace(/\D/g, '')})} />
                    </div>

                    {!form.es_particular && (
                        <div className="space-y-3 pt-3 border-t border-[#E8E3D9]">
                            <input placeholder="Nombre de la Obra Social (Ej: OSDE)" className="w-full p-3 bg-[#FBF9F6] border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]" value={form.prepaga} onChange={e => setForm({...form, prepaga: e.target.value})} />
                            <div className="flex gap-3">
                                <input placeholder="Plan (Ej: 210)" className="w-full p-3 bg-[#FBF9F6] border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]" value={form.plan_obra_social} onChange={e => setForm({...form, plan_obra_social: e.target.value})} />
                                <input placeholder="N° Afiliado" className="w-full p-3 bg-[#FBF9F6] border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]" value={form.numero_afiliado} onChange={e => setForm({...form, numero_afiliado: e.target.value})} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-[#B06043] font-bold text-sm mb-2"><PhoneCall size={16}/> Contacto de emergencia</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-[#8A8175] mb-2">Nombre completo</label>
                            <input className="w-full p-3 bg-[#FBF9F6] border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]" value={form.contacto_emergencia_nombre} onChange={e => setForm({...form, contacto_emergencia_nombre: e.target.value})} />
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-[#8A8175] mb-2">Vínculo</label>
                                <input placeholder="Ej: Pareja, Madre" className="w-full p-3 bg-[#FBF9F6] border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]" value={form.contacto_emergencia_vinculo} onChange={e => setForm({...form, contacto_emergencia_vinculo: e.target.value})} />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-[#8A8175] mb-2">Teléfono</label>
                                <input placeholder="Solo números" className="w-full p-3 bg-[#FBF9F6] border border-[#E8E3D9] rounded-xl outline-none focus:border-[#6B806F]" value={form.contacto_emergencia_tel} onChange={e => setForm({...form, contacto_emergencia_tel: e.target.value.replace(/\D/g, '')})} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-between">
                <button onClick={() => setPestana('datos')} className="px-6 py-3 text-[#8A8175] hover:bg-[#F2EFE9] rounded-xl font-bold transition-all">← Atrás</button>
                <button onClick={() => setPestana('clinica')} className="px-6 py-3 bg-[#E8F0E9] text-[#556B5A] hover:bg-[#D3DDD4] rounded-xl font-bold transition-all">Siguiente: Cuadro Clínico →</button>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: CUADRO CLÍNICO */}
        {pestana === 'clinica' && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-[#E8E3D9] shadow-sm relative overflow-hidden">
            <h2 className="text-xl font-bold text-[#4A443C] mb-8 border-b border-[#F2EFE9] pb-4 flex items-center gap-2">
                <Stethoscope size={20} className="text-[#8C9C8E]"/> 3. Cuadro Clínico Inicial
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#FBF9F6] p-6 rounded-3xl border border-[#E8E3D9]">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-[#8A8175] mb-2">Motivo de consulta principal</label>
                  <textarea rows={5} placeholder="Opcional. Podés completarlo más adelante." className="w-full p-4 bg-white border border-[#E8E3D9] rounded-xl outline-none resize-none text-base focus:border-[#6B806F]" value={form.motivo_consulta} onChange={e => setForm({...form, motivo_consulta: e.target.value})} />
                </div>
                
                <div className="col-span-2 md:col-span-1">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-bold text-[#8A8175]">Medicación actual</label>
                        <button onClick={agregarMedicacion} className="text-[#6B806F] font-bold text-xs flex items-center gap-1.5 hover:bg-[#E8F0E9] px-2 py-1 rounded-lg transition-colors"><Plus size={14}/> Añadir</button>
                    </div>
                    <div className="space-y-3">
                        {listaMedicacion.map((item, index) => (
                            <div key={index} className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-[#E8E3D9] relative pr-10 shadow-sm">
                                <input placeholder="Droga (Ej: Clonazepam)" className="w-full p-2 bg-transparent outline-none text-sm font-medium" value={item.nombre} onChange={e => actualizarMedicacion(index, 'nombre', e.target.value)} />
                                <input placeholder="Médico" className="w-full p-2 bg-transparent border-l border-[#F2EFE9] outline-none text-sm text-[#8A8175]" value={item.profesional} onChange={e => actualizarMedicacion(index, 'profesional', e.target.value)} />
                                <button onClick={() => borrarMedicacion(index)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A49A8D] hover:text-[#8C3C2A] transition-colors"><XCircle size={18}/></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-span-2 pt-6 border-t border-[#E8E3D9]">
                    <label className="flex items-center gap-2 text-xs font-bold text-[#8A8175] uppercase tracking-widest mb-3">
                        <BookOpen size={14} className="text-[#6B806F]" /> Impresión Diagnóstica (DSM-5)
                    </label>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A49A8D]" size={18} />
                        <input
                            placeholder="Buscá por trastorno o código CIE-10..."
                            className="w-full p-5 pl-12 bg-white border border-[#E8E3D9] rounded-2xl outline-none focus:border-[#6B806F] transition-all text-base font-medium"
                            value={form.diagnostico_principal}
                            onChange={(e) => buscarEnDSM(e.target.value)}
                        />
                        {sugerenciasDSM.length > 0 && (
                            <div className="absolute w-full mt-2 bg-white border border-[#E8E3D9] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                            {sugerenciasDSM.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setForm({ ...form, diagnostico_principal: item.nombre, codigo_cie10: item.codigo });
                                        setSugerenciasDSM([]);
                                    }}
                                    className="w-full p-4 text-left hover:bg-[#F2EFE9] flex justify-between items-center border-b border-[#F2EFE9] last:border-0 transition-colors"
                                >
                                <span className="font-bold text-[#4A443C]">{item.nombre}</span>
                                <span className="text-[10px] font-black bg-[#E8F0E9] px-3 py-1 rounded-lg text-[#556B5A] uppercase tracking-widest">{item.codigo}</span>
                                </button>
                            ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-between">
                <button onClick={() => setPestana('cobertura')} className="px-6 py-3 text-[#8A8175] hover:bg-[#F2EFE9] rounded-xl font-bold transition-all">← Atrás</button>
            </div>
          </div>
        )}
      </div>

      {/* BOTÓN FLOTANTE PARA GUARDAR (Siempre visible) */}
      <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
        <button 
            onClick={guardar} 
            disabled={enviando}
            className="flex items-center gap-2 px-8 py-4 bg-[#6B806F] text-white rounded-full transition-all shadow-xl hover:bg-[#556B5A] hover:scale-105 font-bold text-base border-4 border-white"
        >
            {enviando ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} strokeWidth={3} />}
            {enviando ? "Creando Ficha..." : "Crear Paciente"}
        </button>
      </div>

    </div>
  );
}