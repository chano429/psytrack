"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Calendar, BarChart3, LogOut, Menu } from "lucide-react";
// Usamos el cliente estándar que es más estable
import { createClient } from "@supabase/supabase-js";

// Inicializamos el cliente afuera (necesitás tus variables de entorno)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { name: "Mi consultorio", href: "/", icon: LayoutDashboard },
    { name: "Turnos", href: "/turnos", icon: Calendar },
    { name: "Pacientes", href: "/pacientes", icon: Users },
    { name: "Reportes", href: "/reportes", icon: BarChart3 },
  ];

  const handleSignOut = async () => {
  try {
    await supabase.auth.signOut();
    // Esto te manda a la raíz. Si no estás logueado, 
    // tu sistema te va a rebotar solo al formulario de correo, 
    // se llame como se llame.
    window.location.href = "/"; 
  } catch (error) {
    console.error("Error al salir:", error);
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
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-hidden">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          
          return (
            <Link 
              key={link.name} 
              href={link.href} 
              className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all whitespace-nowrap
                ${isActive 
                  ? "bg-[#FFFFFF] text-[#4A443C] shadow-sm font-bold border border-[#E8E3D9]" 
                  : "text-[#6D645A] hover:bg-[#E8E3D9] hover:text-[#4A443C] font-medium"
                }
              `}
              title={link.name}
            >
              <link.icon size={22} className={`shrink-0 ${isActive ? "text-[#556B5A]" : "text-[#8C9C8E]"}`} /> 
              <span className={`transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-90"} hidden group-hover:block`}>
                {link.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Botón de Cerrar Sesión */}
      <div className="p-3 border-t border-[#E8E3D9] overflow-hidden">
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-4 p-3.5 w-full text-red-600 hover:bg-red-50 rounded-2xl transition-all whitespace-nowrap" 
          title="Cerrar Sesión"
        >
          <LogOut size={22} className="shrink-0" /> 
          <span className="font-medium hidden group-hover:block">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}