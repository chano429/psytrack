"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [autorizado, setAutorizado] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const revisarAcceso = async () => {
      // 1. Verificamos si hay una sesión activa
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Si no hay sesión y no estamos en login, al login.
        if (pathname !== "/login" && !pathname.startsWith("/portal")) {
          router.push("/login");
        }
        return;
      }

      // 2. Si hay sesión, chequeamos el ROL
      const rol = session.user.user_metadata?.rol || 'profesional';

      // --- REGLA 1: PACIENTES ---
      // Si es paciente y NO está en el portal, lo mandamos para allá
      if (rol === 'paciente' && !pathname.startsWith("/portal")) {
        router.push("/portal/dashboard");
        return; // Cortamos la ejecución acá
      }

      // --- REGLA 2: SECRETARIA ---
      // Definimos qué rutas NO puede tocar la secretaria
      const rutasProhibidasParaSecretaria = [
        "/reportes",
        "/administracion",
        "/configuracion",
        "/" // El dashboard principal también lo bloqueamos
      ];

      if (rol === 'secretaria' && rutasProhibidasParaSecretaria.includes(pathname)) {
        console.warn("Acceso denegado: Rol secretaria intentó entrar a ruta de profesional.");
        router.push("/turnos"); // La mandamos a su lugar de trabajo
        return; // Cortamos la ejecución acá
      }

      // Si pasó todos los filtros, está autorizado
      setAutorizado(true);
    };

    revisarAcceso();
  }, [pathname, router]);

  // Mientras verifica o si no está autorizado, no mostramos nada (evita el "parpadeo")
  if (!autorizado && pathname !== "/login" && !pathname.startsWith("/portal/login") && !pathname.startsWith("/portal/registro")) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#FBF9F6]">
        <div className="animate-pulse font-bold text-[#8A8175]">Verificando accesos...</div>
      </div>
    );
  }

  return <>{children}</>;
}