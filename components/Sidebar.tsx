"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Calendar, BarChart3, Settings, Menu } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Mi consultorio", href: "/", icon: LayoutDashboard },
    { name: "Turnos", href: "/turnos", icon: Calendar },
    { name: "Pacientes", href: "/pacientes", icon: Users },
    { name: "Reportes", href: "/reportes", icon: BarChart3 },
  ];

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
          // Lógica para saber si estamos en esa sección (o en una sub-sección como editar)
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
              title={link.name} // Muestra el nombre al pasar el mouse si está achicado
            >
              <link.icon size={22} className={`shrink-0 ${isActive ? "text-[#556B5A]" : "text-[#8C9C8E]"}`} /> 
              <span className={`transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-90"} hidden group-hover:block`}>
                {link.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Ajustes */}
      <div className="p-3 border-t border-[#E8E3D9] overflow-hidden">
        <button className="flex items-center gap-4 p-3.5 w-full text-[#6D645A] hover:bg-[#E8E3D9] rounded-2xl transition-all whitespace-nowrap" title="Ajustes">
          <Settings size={22} className="text-[#8C9C8E] shrink-0" /> 
          <span className="font-medium hidden group-hover:block">Ajustes</span>
        </button>
      </div>
    </aside>
  );
}