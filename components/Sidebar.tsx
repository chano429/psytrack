"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; 
import { supabase } from "@/lib/supabase"; 
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BarChart3, 
  Wallet, 
  Settings, 
  LogOut,
  Menu,
  Bell
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [rol, setRol] = useState<string | null>(null);
  const [cargandoRol, setCargandoRol] = useState(true);

  useEffect(() => {
    const fetchDatos = async () => {
      // 1. Obtener el ROL del usuario logueado
      const { data: { user } } = await supabase.auth.getUser();
      const rolEncontrado = user?.user_metadata?.rol || 'profesional';
      setRol(rolEncontrado);
      setCargandoRol(false);

      try {
        // 2. Traer notificaciones
        const { data: notas, error: notasError } = await supabase
          .from("notas_paciente")
          .select("*")
          .order('fecha_creacion', { ascending: false });

        if (notasError) {
          console.error("Error trayendo notas:", notasError);
          return;
        }

        if (notas) {
          const pedidos = notas.filter((n: any) => n.nota && n.nota.includes("Solicitud de turno"));

          if (pedidos.length > 0) {
            const pacienteIds = pedidos.map((n: any) => n.paciente_id);
            const { data: pacientes } = await supabase
              .from("pacientes")
              .select("id, nombre, apellido")
              .in("id", pacienteIds);

            const solicitudesCompletas = pedidos.map((nota: any) => {
              const pac = pacientes?.find((p: any) => p.id === nota.paciente_id);
              return {
                ...nota,
                pacientes: pac || { nombre: "Paciente", apellido: "Desconocido" }
              };
            });

            setSolicitudes(solicitudesCompletas);
          } else {
            setSolicitudes([]);
          }
        }
      } catch (error) {
        console.error("Error al buscar pedidos de turno:", error);
      }
    };

    fetchDatos();
    const intervalo = setInterval(fetchDatos, 5000);
    return () => clearInterval(intervalo);
  }, []);

  if (pathname === '/login' || pathname.startsWith('/portal')) {
    return null;
  }

  // Definición de links
  const todosLosLinks = [
    { name: "Mi consultorio", href: "/", icon: LayoutDashboard, soloProfesional: true }, 
    { name: "Turnos", href: "/turnos", icon: Calendar, soloProfesional: false },
    { name: "Pacientes", href: "/pacientes", icon: Users, soloProfesional: false },
    { name: "Reportes", href: "/reportes", icon: BarChart3, soloProfesional: true },
    { name: "Administración", href: "/administracion", icon: Wallet, soloProfesional: true },
    { name: "Configuración", href: "/configuracion", icon: Settings, soloProfesional: true },
  ];

  // --- LÓGICA DE FILTRADO MEJORADA ---
  const linksVisibles = cargandoRol 
    ? [] 
    : todosLosLinks.filter(link => {
        if (rol === 'secretaria' && link.soloProfesional) return false;
        return true;
      });

  // --- ACÁ ESTÁ LA CORRECCIÓN DE SEGURIDAD ---
  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      window.sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  return (
    <aside className="h-screen bg-[#F2EFE9] border-r border-[#E8E3D9] flex flex-col shadow-sm transition-all duration-300 w-20 hover:w-64 group relative z-50">
      
      {/* Título y Logo */}
      <div className="p-6 h-24 flex items-center justify-center border-b border-[#E8E3D9] overflow-hidden">
        <Menu size={28} className="text-[#556B5A] group-hover:hidden shrink-0" />
        <div className="hidden group-hover:flex flex-col items-center">
          <h2 className="text-2xl font-bold text-[#556B5A] tracking-tight">PsyTrack</h2>
          <p className="text-[10px] text-[#8A8175] mt-0.5 font-bold tracking-[0.2em] uppercase">Bienestar</p>
        </div>
      </div>
      
      {/* Navegación */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
        
        {/* LA CAMPANA */}
        <div className="relative mb-6">
          <Link 
             href="/notificaciones"
             className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all whitespace-nowrap
               ${pathname === "/notificaciones" ? "bg-white shadow-sm border border-[#E8E3D9]" : "hover:bg-[#E8E3D9] text-[#6D645A]"}
               ${solicitudes.length > 0 && pathname !== "/notificaciones" ? "bg-[#FCEEE9]" : ""}
             `}
             title="Notificaciones"
          >
             <div className="relative shrink-0">
               <Bell size={22} className={solicitudes.length > 0 ? "text-[#B06043]" : "text-[#8C9C8E]"} />
               {solicitudes.length > 0 && (
                 <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B06043] opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-4 w-4 bg-[#B06043] text-white text-[9px] font-black items-center justify-center border-2 border-[#F2EFE9]">
                     {solicitudes.length}
                   </span>
                 </span>
               )}
             </div>
             <span className="transition-opacity duration-300 opacity-90 hidden group-hover:block font-bold">
               Notificaciones
             </span>
          </Link>
        </div>

        <div className="h-px bg-[#E8E3D9] mx-2 mb-4"></div>

        {/* Links dinámicos */}
        {linksVisibles.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <Link 
              key={link.name} 
              href={link.href} 
              className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all whitespace-nowrap relative
                ${isActive 
                  ? "bg-[#FFFFFF] text-[#4A443C] shadow-sm font-bold border border-[#E8E3D9]" 
                  : "text-[#6D645A] hover:bg-[#E8E3D9] hover:text-[#4A443C] font-medium"
                }
              `}
              title={link.name}
            >
              <div className="relative shrink-0">
                <link.icon size={22} className={isActive ? "text-[#556B5A]" : "text-[#8C9C8E]"} /> 
              </div>
              <span className={`transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-90"} hidden group-hover:block`}>
                {link.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* CERRAR SESIÓN */}
      <div className="p-4 mt-auto border-t border-[#E8E3D9]">
        <button 
          onClick={cerrarSesion}
          className="flex items-center justify-center gap-4 p-3.5 rounded-2xl transition-all font-bold text-sm text-[#B06043] w-full hover:bg-[#FCEEE9]"
        >
          <LogOut size={22} className="shrink-0" />
          <span className="hidden group-hover:block">Cerrar Sesión</span>
        </button>
      </div>

    </aside>
  );
}