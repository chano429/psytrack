"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail, UserPlus, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function RegistroPortalPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const router = useRouter();

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setCargando(true);

    // 1. Creamos el usuario en Supabase Auth y le asignamos el rol "paciente"
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          rol: 'paciente',
        }
      }
    });

    if (authError) {
      // Traducimos los errores comunes de Supabase
      if (authError.message.includes("already registered")) {
        setError("Este email ya tiene una cuenta. Intentá iniciar sesión.");
      } else {
        setError("Hubo un error al crear la cuenta. Revisá tus datos.");
        console.error(authError);
      }
      setCargando(false);
      
    } else if (authData.user) {
      // --- LA GOTITA DE PEGAMENTO ---
      // Buscamos la ficha clínica que tenga este mismo correo y le pegamos el ID de seguridad
      await supabase
        .from('pacientes')
        .update({ auth_id: authData.user.id })
        .eq('correo_electronico', email.trim());
      // ------------------------------

      setExito(true);
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F6] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-sm border border-[#E8E3D9]">
        
        {exito ? (
          <div className="text-center animate-in zoom-in-95 duration-300">
            <div className="bg-[#E8F0E9] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="text-[#556B5A]" size={40} />
            </div>
            <h2 className="text-2xl font-black text-[#4A443C] mb-3">¡Cuenta activada!</h2>
            <p className="text-[#8A8175] font-medium mb-8 leading-relaxed">
              Tu portal ya está listo. Ahora podés iniciar sesión con tu email y la contraseña que acabás de crear para gestionar tus turnos.
            </p>
            <Link 
              href="/portal/login"
              className="w-full bg-[#8C9C8E] text-white py-4 rounded-2xl font-black flex items-center justify-center hover:bg-[#6B806F] transition-all shadow-sm"
            >
              Ir a Iniciar Sesión
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="bg-[#8C9C8E] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <UserPlus className="text-white" size={28} />
              </div>
              <h1 className="text-2xl font-black text-[#4A443C]">Activá tu Portal</h1>
              <p className="text-[#8A8175] font-medium mt-2">Creá tu contraseña para acceder</p>
            </div>

            <form onSubmit={handleRegistro} className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-4 text-[#A49A8D] group-focus-within:text-[#8C9C8E] transition-colors" size={20} />
                <input
                  type="email"
                  placeholder="Tu email (el que le diste al profesional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl p-4 pl-12 outline-none focus:border-[#8C9C8E] text-[#4A443C] font-medium transition-all"
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-4 text-[#A49A8D] group-focus-within:text-[#8C9C8E] transition-colors" size={20} />
                <input
                  type="password"
                  placeholder="Creá una contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl p-4 pl-12 outline-none focus:border-[#8C9C8E] text-[#4A443C] font-medium transition-all"
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-4 text-[#A49A8D] group-focus-within:text-[#8C9C8E] transition-colors" size={20} />
                <input
                  type="password"
                  placeholder="Repetí la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl p-4 pl-12 outline-none focus:border-[#8C9C8E] text-[#4A443C] font-medium transition-all"
                  required
                />
              </div>

              {error && (
                <div className="bg-[#FCEEE9] text-[#B06043] p-3 rounded-xl text-sm font-bold text-center animate-in fade-in">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-[#8C9C8E] text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-[#6B806F] transition-all shadow-sm mt-2 disabled:opacity-70"
              >
                {cargando ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                {cargando ? "Creando cuenta..." : "Crear mi cuenta"}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-[#F2EFE9] pt-6">
              <Link 
                href="/portal/login" 
                className="text-[#8A8175] font-bold text-sm flex items-center justify-center gap-2 hover:text-[#4A443C] transition-colors"
              >
                <ArrowLeft size={16} /> Ya tengo cuenta, iniciar sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}