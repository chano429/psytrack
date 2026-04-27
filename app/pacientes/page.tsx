"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { UserPlus, Search, User, ChevronRight, Loader2, Phone, CreditCard } from "lucide-react";

export const dynamic = 'force-dynamic'; // <--- ESTA ES LA LÍNEA MÁGICA QUE AGREGAMOS
export const revalidate = 0; // <--- Y ESTA TAMBIÉN (Evita la caché agresiva de Vercel)

export default function ListaPacientes() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function traerPacientes() {
      const { data } = await supabase
        .from('pacientes')
        .select('*')
        .order('apellido', { ascending: true });
      if (data) setPacientes(data);
      setCargando(false);
    }
    traerPacientes();
  }, []);

  // FILTRO INTELIGENTE: Filtra por nombre, apellido o DNI mientras escribís
  const pacientesFiltrados = pacientes.filter(p => 
    `${p.nombre} ${p.apellido} ${p.dni}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#4A443C]">Pacientes</h1>
          <p className="text-[#8A8175] font-medium mt-1 text-sm">Gestioná tu base de datos de consulta.</p>
        </div>
        <Link href="/pacientes/nuevo" className="flex items-center gap-2 bg-[#6B806F] hover:bg-[#556B5A] text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-sm w-fit">
          <UserPlus size={20} /> Nuevo Paciente
        </Link>
      </div>

      {/* BUSCADOR ESTILO APPLE */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A49A8D] group-focus-within:text-[#6B806F] transition-colors" size={20} />
        <input 
          type="text"
          placeholder="Buscá por nombre, apellido o DNI..."
          className="w-full p-5 pl-14 bg-white border border-[#E8E3D9] rounded-[1.5rem] outline-none focus:ring-4 focus:ring-[#6B806F]/5 transition-all shadow-sm text-[#4A443C] font-medium"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* TABLA DE PACIENTES */}
      <div className="bg-white border border-[#E8E3D9] rounded-[2rem] shadow-sm overflow-hidden">
        {cargando ? (
          <div className="p-20 flex flex-col items-center justify-center text-[#8A8175]">
            <Loader2 className="animate-spin mb-4 text-[#8C9C8E]" size={40} />
            <p className="font-medium">Cargando legajos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FBF9F6] border-b border-[#E8E3D9]">
                  <th className="p-6 font-bold text-[#8A8175] text-xs uppercase tracking-widest">Paciente</th>
                  <th className="p-6 font-bold text-[#8A8175] text-xs uppercase tracking-widest hidden md:table-cell">DNI</th>
                  <th className="p-6 font-bold text-[#8A8175] text-xs uppercase tracking-widest hidden md:table-cell">Contacto</th>
                  <th className="p-6 font-bold text-[#8A8175] text-xs uppercase tracking-widest">Cobertura</th>
                  <th className="p-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE9]">
                {pacientesFiltrados.length > 0 ? (
                  pacientesFiltrados.map((p) => (
                    <tr 
                      key={p.id} 
                      className="hover:bg-[#FBF9F6] transition-colors group cursor-pointer" 
                      onClick={() => window.location.href = `/pacientes/${p.id}`}
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 bg-[#E8F0E9] rounded-2xl flex items-center justify-center text-[#556B5A] font-bold text-sm">
                            {p.nombre?.[0]}{p.apellido?.[0]}
                          </div>
                          <div>
                            <p className="font-bold text-[#4A443C] text-lg leading-tight">{p.apellido}, {p.nombre}</p>
                            <p className="text-xs text-[#8A8175] md:hidden mt-1">DNI: {p.dni}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-[#6D645A] font-medium hidden md:table-cell">{p.dni}</td>
                      <td className="p-6 text-[#6D645A] hidden md:table-cell">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-[#8C9C8E]" /> {p.celular || "---"}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <CreditCard size={14} className="text-[#8C9C8E]" />
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${p.es_particular ? 'bg-[#F2EFE9] text-[#6D645A]' : 'bg-[#E8F0E9] text-[#556B5A]'}`}>
                            {p.es_particular ? 'Particular' : p.prepaga}
                          </span>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-transparent group-hover:bg-[#E8F0E9] text-[#D3DDD4] group-hover:text-[#6B806F] transition-all">
                          <ChevronRight size={20} />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-24 text-center text-[#8A8175]">
                      <div className="bg-[#FBF9F6] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#E8E3D9]">
                        <User size={30} className="opacity-30" />
                      </div>
                      <p className="font-bold text-lg text-[#6D645A]">No se encontraron pacientes</p>
                      <p className="text-sm mt-1">Probá con otro nombre o creá un nuevo legajo.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}