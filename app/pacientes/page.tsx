"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  UserPlus,
  Search,
  User,
  ChevronRight,
  Loader2,
  Phone,
  CreditCard,
  Trash2,
} from "lucide-react";

export default function ListaPacientes() {
  const [rol, setRol] = useState<string | null>(null);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Cuando carga la pantalla, traemos el ROL y los PACIENTES
    const inicializar = async () => {
      // 1. Buscamos quién es (para ocultar el tachito)
      const { data: { user } } = await supabase.auth.getUser();
      setRol(user?.user_metadata?.rol || 'profesional');

      // 2. Traemos la lista de pacientes
      const { data } = await supabase
        .from("pacientes")
        .select("*")
        .order("apellido", { ascending: true });
      
      if (data) setPacientes(data);
      setCargando(false);
    };

    inicializar();
  }, []);

  const eliminarPaciente = async (
    id: string,
    nombreCompleto: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const confirmar = window.confirm(
      `¿Estás seguro de que querés eliminar a ${nombreCompleto} de forma permanente?\nEsta acción no se puede deshacer y borrará todo su historial.`
    );

    if (confirmar) {
      const { error } = await supabase.from("pacientes").delete().eq("id", id);

      if (error) {
        // Manejo respetuoso del error de integridad (llave foránea)
        if (error.code === '23503') {
          alert("No se puede eliminar el paciente porque tiene turnos o historia clínica asociada. Borrá sus registros primero.");
        } else {
          alert("Hubo un error al eliminar el paciente.");
        }
        console.error(error);
      } else {
        // Si borra bien, actualizamos la lista localmente
        setPacientes(prev => prev.filter(p => p.id !== id));
      }
    }
  };

  const pacientesFiltrados = pacientes.filter((p) =>
    `${p.nombre} ${p.apellido} ${p.dni}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#4A443C]">Pacientes</h1>
          <p className="text-[#8A8175] font-medium mt-1 text-sm">
            Gestioná tu base de datos de consulta.
          </p>
        </div>
        <Link
          href="/pacientes/nuevo"
          className="flex items-center gap-2 bg-[#6B806F] hover:bg-[#556B5A] text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-sm w-fit"
        >
          <UserPlus size={20} /> Nuevo Paciente
        </Link>
      </div>

      {/* BUSCADOR ESTILO APPLE */}
      <div className="relative group">
        <Search
          className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A49A8D] group-focus-within:text-[#6B806F] transition-colors"
          size={20}
        />
        <input
          type="text"
          placeholder="Buscá por nombre, apellido o DNI..."
          className="w-full p-5 pl-14 bg-white border border-[#E8E3D9] rounded-[1.5rem] outline-none focus:ring-4 focus:ring-[#6B806F]/5 transition-all shadow-sm text-[#4A443C] font-medium"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* LISTA DE PACIENTES RESPONSIVA */}
      <div className="bg-white border border-[#E8E3D9] rounded-[2rem] shadow-sm overflow-hidden">
        {cargando ? (
          <div className="p-20 flex flex-col items-center justify-center text-[#8A8175]">
            <Loader2 className="animate-spin mb-4 text-[#8C9C8E]" size={40} />
            <p className="font-medium">Cargando legajos...</p>
          </div>
        ) : (
          <div className="w-full">
            {/* Cabecera Desktop */}
            <div className="hidden md:flex items-center bg-[#FBF9F6] border-b border-[#E8E3D9] p-6">
              <div className="w-1/3 font-bold text-[#8A8175] text-xs uppercase tracking-widest">
                Paciente
              </div>
              <div className="w-1/5 font-bold text-[#8A8175] text-xs uppercase tracking-widest">
                DNI
              </div>
              <div className="w-1/5 font-bold text-[#8A8175] text-xs uppercase tracking-widest">
                Contacto
              </div>
              <div className="flex-1 font-bold text-[#8A8175] text-xs uppercase tracking-widest">
                Cobertura
              </div>
            </div>

            {/* Filas de Pacientes */}
            <div className="flex flex-col">
              {pacientesFiltrados.length > 0 ? (
                pacientesFiltrados.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col md:flex-row md:items-center p-5 md:p-6 hover:bg-[#FBF9F6] transition-colors group cursor-pointer gap-4 md:gap-0 border-b border-[#F2EFE9] last:border-none"
                    onClick={() =>
                      (window.location.href = `/pacientes/${p.id}`)
                    }
                  >
                    {/* Avatar y Nombres */}
                    <div className="flex items-center gap-4 md:w-1/3">
                      <div className="w-11 h-11 bg-[#E8F0E9] rounded-2xl flex items-center justify-center text-[#556B5A] font-bold text-sm shrink-0">
                        {(p.nombre?.[0] || "") + (p.apellido?.[0] || "")}
                      </div>
                      <div>
                        <p className="font-bold text-[#4A443C] text-lg leading-tight">
                          {p.apellido}, {p.nombre}
                        </p>
                        <p className="text-xs text-[#8A8175] md:hidden mt-1">
                          DNI: {p.dni || "---"} {p.celular ? `• Cel: ${p.celular}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* DNI (Solo Desktop) */}
                    <div className="hidden md:block md:w-1/5 text-[#6D645A] font-medium text-sm">
                      {p.dni || "---"}
                    </div>

                    {/* Contacto (Solo Desktop) */}
                    <div className="hidden md:flex md:w-1/5 items-center gap-2 text-sm text-[#6D645A]">
                      <Phone size={14} className="text-[#8C9C8E]" />{" "}
                      {p.celular || "---"}
                    </div>

                    {/* Cobertura y Botones */}
                    <div className="flex items-center justify-between md:flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} className="text-[#8C9C8E]" />
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            p.es_particular
                              ? "bg-[#F2EFE9] text-[#6D645A]"
                              : "bg-[#E8F0E9] text-[#556B5A]"
                          }`}
                        >
                          {p.es_particular ? "Particular" : p.prepaga || "Obra Social"}
                        </span>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex items-center gap-1 md:gap-2">
                        {rol !== "secretaria" && (
                          <button
                            onClick={(e) =>
                              eliminarPaciente(
                                p.id,
                                `${p.apellido}, ${p.nombre}`,
                                e
                              )
                            }
                            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-transparent active:bg-[#FCEEE9] hover:bg-[#FCEEE9] text-[#D3DDD4] hover:text-[#B06043] transition-all"
                            title="Eliminar paciente"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}

                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#E8F0E9] md:bg-transparent md:group-hover:bg-[#E8F0E9] text-[#6B806F] md:text-[#D3DDD4] md:group-hover:text-[#6B806F] transition-all">
                          <ChevronRight size={20} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-24 text-center text-[#8A8175]">
                  <div className="bg-[#FBF9F6] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#E8E3D9]">
                    <User size={30} className="opacity-30" />
                  </div>
                  <p className="font-bold text-lg text-[#6D645A]">
                    No se encontraron pacientes
                  </p>
                  <p className="text-sm mt-1">
                    Probá con otro nombre o creá un nuevo legajo.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}