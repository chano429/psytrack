"use client";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email o contraseña incorrectos.");
      setCargando(false);
    } else {
      // Si entra bien, lo mandamos al portal (ya sin el ?id=)
      router.push("/portal/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F6] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-sm border border-[#E8E3D9]">
        <div className="text-center mb-8">
          <div className="bg-[#8C9C8E] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-black text-[#4A443C]">Bienvenido</h1>
          <p className="text-[#8A8175] font-medium">
            Ingresá a tu espacio de calma
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-[#A49A8D]" size={20} />
            <input
              type="email"
              placeholder="Tu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl p-4 pl-12 outline-none focus:border-[#8C9C8E] text-[#4A443C]"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-4 text-[#A49A8D]" size={20} />
            <input
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl p-4 pl-12 outline-none focus:border-[#8C9C8E] text-[#4A443C]"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-bold text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-[#8C9C8E] text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-[#6B806F] transition-all shadow-sm"
          >
            {cargando ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Sparkles size={20} />
            )}
            Entrar al portal
          </button>
        </form>
        <div className="mt-8 text-center border-t border-[#F2EFE9] pt-6">
          <p className="text-[#8A8175] text-sm font-medium mb-2">
            ¿Es tu primera vez ingresando al portal?
          </p>
          <Link
            href="/portal/registro"
            className="text-[#6B806F] font-bold text-sm flex items-center justify-center gap-2 hover:text-[#4A443C] transition-colors"
          >
            Registrarme y crear contraseña
          </Link>
        </div>
      </div>
    </div>
  );
}
