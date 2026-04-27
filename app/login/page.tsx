"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert("Error: " + error.message);
    } else {
      window.location.href = "/";
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F2EFE9] p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-[#E8E3D9]">
        <h1 className="text-3xl font-bold text-[#556B5A] mb-2 text-center">PsyTrack</h1>
        <p className="text-[#8A8175] text-center mb-8 uppercase tracking-widest text-xs font-bold">Acceso Profesional</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" placeholder="Correo" required
            className="w-full p-4 rounded-2xl border border-[#E8E3D9] outline-none focus:ring-2 focus:ring-[#556B5A]"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" placeholder="Contraseña" required
            className="w-full p-4 rounded-2xl border border-[#E8E3D9] outline-none focus:ring-2 focus:ring-[#556B5A]"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button disabled={loading} className="w-full py-4 bg-[#556B5A] text-white rounded-2xl font-bold hover:bg-[#445648] transition-all">
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="mt-8 p-4 bg-[#F8F7F4] rounded-xl border border-[#E8E3D9]">
          <p className="text-[10px] text-[#8A8175] leading-relaxed text-center italic">
            "Este sistema opera bajo normas de confidencialidad profesional y en cumplimiento de la 
            <b> Ley 25.326 de Protección de Datos Personales</b>. El acceso no autorizado está penado por la ley."
          </p>
        </div>
      </div>
    </div>
  );
}