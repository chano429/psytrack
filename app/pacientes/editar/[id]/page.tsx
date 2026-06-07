"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Save, User, MapPin, Phone, ArrowLeft, Loader2, HeartPulse, AlertCircle, Plus, X } from "lucide-react";
import Link from "next/link";

export default function EditarPaciente() {
  const router = useRouter();
  const params = useParams();
  const idPaciente = params.id;

  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [form, setForm] = useState({
    nombre: "", apellido: "", dni: "", localidad: "", provincia: "", celular: "", email: "",
    es_particular: true, prepaga: "", numero_afiliado: "", plan_obra_social: "",
    motivo_consulta: "", antecedente_internacion: false, detalle_internacion: ""
  });

  // ESTADO PARA LA LISTA DINÁMICA DE MEDICACIÓN
  const [listaMedicacion, setListaMedicacion] = useState([{ nombre: "", profesional: "" }]);

  useEffect(() => {
    async function traerPaciente() {
      const { data } = await supabase.from('pacientes').select('*').eq('id', idPaciente).single();
      if (data) {
        setForm({
          nombre: data.nombre || "", apellido: data.apellido || "", dni: data.dni || "",
          localidad: data.localidad || "", provincia: data.provincia || "", celular: data.celular || "",
          email: data.email || "", es_particular: data.es_particular ?? true, prepaga: data.prepaga || "",
          numero_afiliado: data.numero_afiliado || "", plan_obra_social: data.plan_obra_social || "",
          motivo_consulta: data.motivo_consulta || "", 
          antecedente_internacion: data.antecedente_internacion || false,
          detalle_internacion: data.detalle_internacion || ""
        });

        // Magia para leer la medicación estructurada (o la vieja)
        if (data.medicacion) {
          try {
            const parseado = JSON.parse(data.medicacion);
            if (Array.isArray(parseado) && parseado.length > 0) {
              setListaMedicacion(parseado);
            }
          } catch (e) {
            // Si venía del texto simple viejo, lo adaptamos a la nueva lista
            setListaMedicacion([{ nombre: data.medicacion, profesional: data.profesional_tratante || "" }]);
          }
        }
      }
      setCargandoInicial(false);
    }
    if (idPaciente) traerPaciente();
  }, [idPaciente]);

  // Funciones para manejar la lista dinámica
  const agregarMedicacion = () => setListaMedicacion([...listaMedicacion, { nombre: "", profesional: "" }]);
  
  const actualizarMedicacion = (index: number, campo: string, valor: string) => {
    const nuevaLista = [...listaMedicacion];
    nuevaLista[index] = { ...nuevaLista[index], [campo]: valor };
    setListaMedicacion(nuevaLista);
  };
  
  const borrarMedicacion = (index: number) => {
    const nuevaLista = listaMedicacion.filter((_, i) => i !== index);
    if (nuevaLista.length === 0) nuevaLista.push({ nombre: "", profesional: "" }); // Deja al menos una vacía
    setListaMedicacion(nuevaLista);
  };

  const actualizar = async () => {
    if (!form.nombre || !form.apellido || !form.dni) { alert("Nombre, apellido y DNI son obligatorios."); return; }
    setEnviando(true);

    // Filtramos las filas vacías y lo convertimos a texto estructurado (JSON)
    const medicacionLimpia = listaMedicacion.filter(m => m.nombre.trim() !== "");
    const medicacionString = JSON.stringify(medicacionLimpia);

    const { error } = await supabase.from('pacientes').update({
      ...form,
      medicacion: medicacionString,
      profesional_tratante: "" // Ya no lo usamos suelto, va todo en la lista
    }).eq('id', idPaciente);

    if (!error) {
      setMensaje("¡Ficha clínica actualizada!");
      setTimeout(() => router.push(`/pacientes/${idPaciente}`), 1500);
    } else {
      alert("Error: " + error.message);
      setEnviando(false);
    }
  };

  if (cargandoInicial) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#8C9C8E]" size={40} /></div>;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
      <div>
        <Link href={`/pacientes/${idPaciente}`} className="inline-flex items-center gap-2 text-[#8A8175] hover:text-[#556B5A] mb-4"><ArrowLeft size={18} /> Cancelar y volver</Link>
        <div className="flex items-center gap-4 border-b border-[#E8E3D9] pb-6">
          <div className="bg-[#E8F0E9] p-4 rounded-3xl text-[#556B5A]"><User size={28} /></div>
          <div><h1 className="text-3xl font-bold text-[#4A443C]">Editar Paciente</h1><p className="text-[#8A8175] text-sm mt-1">Actualizá los datos de {form.nombre}.</p></div>
        </div>
      </div>

      <div className="bg-[#FFFFFF] shadow-sm rounded-[2rem] border border-[#E8E3D9] overflow-hidden">
        <div className="p-8 md:p-10 space-y-10">
          
          <section>
            <label className="text-sm font-bold text-[#8A8175] uppercase tracking-widest mb-4 flex items-center gap-2"><User size={16} className="text-[#8C9C8E]" /> Datos Personales</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <input placeholder="Nombre *" className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
              <input placeholder="Apellido *" className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none" value={form.apellido} onChange={e => setForm({...form, apellido: e.target.value})} />
              <input placeholder="DNI *" className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none" value={form.dni} onChange={e => setForm({...form, dni: e.target.value})} />
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-[#E8E3D9] pt-8">
            <div>
               <label className="text-sm font-bold text-[#8A8175] uppercase tracking-widest mb-4 flex items-center gap-2"><MapPin size={16} className="text-[#8C9C8E]" /> Ubicación y Contacto</label>
              <div className="space-y-4">
                <input placeholder="Celular" className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none" value={form.celular} onChange={e => setForm({...form, celular: e.target.value})} />
                <div className="flex gap-4">
                  <input placeholder="Localidad" className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none" value={form.localidad} onChange={e => setForm({...form, localidad: e.target.value})} />
                  <input placeholder="Provincia" className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none" value={form.provincia} onChange={e => setForm({...form, provincia: e.target.value})} />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-[#8A8175] uppercase tracking-widest mb-4 flex items-center gap-2"><Phone size={16} className="text-[#8C9C8E]" /> Cobertura Médica</label>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group mb-2">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 ${form.es_particular ? 'bg-[#6B806F] border-[#6B806F]' : 'border-[#D3DDD4]'}`}>
                    {form.es_particular && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                  </div>
                  <span className="font-bold text-[#4A443C]">Paciente Particular</span>
                  <input type="checkbox" className="hidden" checked={form.es_particular} onChange={e => setForm({...form, es_particular: e.target.checked})} />
                </label>
                {!form.es_particular && (
                  <div className="space-y-4">
                    <input placeholder="Obra Social / Prepaga *" className="w-full p-4 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none" value={form.prepaga} onChange={e => setForm({...form, prepaga: e.target.value})} />
                  </div>
                )}
              </div>
            </div>
          </section>

          <section id="clinica" className="bg-[#FBF9F6] border border-[#E8E3D9] rounded-3xl p-8 shadow-sm">
            <label className="text-sm font-bold text-[#556B5A] uppercase tracking-widest mb-6 flex items-center gap-2"><HeartPulse size={18} className="text-[#6B806F]" /> Información Clínica de Ingreso</label>
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-[#8A8175] mb-2">Motivo de Consulta Manifiesto</label>
                <textarea rows={2} className="w-full p-4 bg-white border border-[#E8E3D9] rounded-2xl outline-none resize-none" value={form.motivo_consulta} onChange={e => setForm({...form, motivo_consulta: e.target.value})} />
              </div>
              
              {/* LISTA DINÁMICA DE MEDICAMENTOS */}
              <div className="bg-white p-6 border border-[#E8E3D9] rounded-2xl">
                <label className="block text-sm font-bold text-[#4A443C] mb-4">Medicación Actual y Profesionales</label>
                
                <div className="space-y-3">
                  {listaMedicacion.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <input 
                        placeholder="Droga / Fármaco (Ej: Sertralina 50mg)" 
                        className="w-full p-3 bg-[#FBF9F6] border border-[#E8E3D9] rounded-xl outline-none text-sm" 
                        value={item.nombre} 
                        onChange={e => actualizarMedicacion(index, "nombre", e.target.value)} 
                      />
                      <input 
                        placeholder="Médico (Ej: Dr. Gómez - Psiquiatra)" 
                        className="w-full p-3 bg-[#FBF9F6] border border-[#E8E3D9] rounded-xl outline-none text-sm" 
                        value={item.profesional} 
                        onChange={e => actualizarMedicacion(index, "profesional", e.target.value)} 
                      />
                      <button 
                        onClick={() => borrarMedicacion(index)}
                        className="p-3 text-[#A49A8D] hover:text-[#B06043] hover:bg-[#FCEEE9] rounded-xl transition-colors shrink-0"
                        title="Eliminar fila"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={agregarMedicacion}
                  className="mt-4 flex items-center gap-2 text-sm font-bold text-[#6B806F] hover:text-[#556B5A] transition-colors"
                >
                  <Plus size={16} /> Agregar otra medicación
                </button>
              </div>

              <div className="p-6 bg-[#FCEEE9] border border-[#F5D8CE] rounded-2xl mt-4">
                <div className="flex items-center gap-4 mb-2">
                  <AlertCircle size={20} className="text-[#B06043]" />
                  <span className="font-bold text-[#B06043]">¿Tiene antecedentes de internación psiquiátrica?</span>
                  <div className="flex bg-white rounded-lg border border-[#F5D8CE] p-1 ml-auto">
                    <button onClick={() => setForm({...form, antecedente_internacion: false})} className={`px-4 py-1.5 rounded-md text-sm font-bold ${!form.antecedente_internacion ? 'bg-[#F2EFE9] text-[#6D645A]' : 'text-[#A49A8D]'}`}>No</button>
                    <button onClick={() => setForm({...form, antecedente_internacion: true})} className={`px-4 py-1.5 rounded-md text-sm font-bold ${form.antecedente_internacion ? 'bg-[#B06043] text-white' : 'text-[#A49A8D]'}`}>Sí</button>
                  </div>
                </div>
                {form.antecedente_internacion && <div className="mt-4"><textarea rows={3} placeholder="Detallar..." className="w-full p-4 bg-white border border-[#F5D8CE] rounded-xl outline-none resize-none" value={form.detalle_internacion} onChange={e => setForm({...form, detalle_internacion: e.target.value})} /></div>}
              </div>
            </div>
          </section>

        </div>
        <div className="bg-[#FBF9F6] p-8 flex flex-col sm:flex-row items-center justify-between border-t border-[#E8E3D9] gap-6">
          <button onClick={actualizar} disabled={enviando} className="px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 text-[#FBF9F6] bg-[#6B806F] hover:bg-[#556B5A] ml-auto">
            {enviando ? "Guardando..." : <><Save size={20} /> Guardar Cambios</>}
          </button>
        </div>
      </div>
    </div>
  );
}