"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [esRegistro, setEsRegistro] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const procesarAutenticacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      if (esRegistro) {
        // VALIDACIÓN LEGAL
        if (!aceptaTerminos) {
          setError(
            "Debes aceptar los Términos y Condiciones y la Ley de Protección de Datos."
          );
          setCargando(false);
          return;
        }
        if (!nombre.trim()) {
          setError("Por favor, ingresá tu nombre completo.");
          setCargando(false);
          return;
        }

        // REGISTRO EN SUPABASE
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { nombre_completo: nombre, rol: "profesional" }, // Guardamos el nombre y rol
          },
        });

        if (signUpError) throw signUpError;
        if (data.user) {
          alert("¡Cuenta creada! Ya podés ingresar a tu consultorio.");
          // Buscá esta parte en la función procesarAutenticacion:
          if (data.user) {
            const rol = data.user.user_metadata?.rol;
            if (rol === "secretaria") {
              router.push("/turnos"); // Si es secretaria, va directo a la agenda
            } else {
              router.push("/"); // Si es profesional, va al dashboard
            }
          }
        }
      } else {
        // LOGIN EN SUPABASE
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (signInError) throw signInError;
        if (data.user) {
          router.push("/"); // Redirigimos al inicio
        }
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al procesar la solicitud.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F6] flex flex-col md:flex-row items-center justify-center p-4 md:p-8">
      {/* TARJETA PRINCIPAL DIVIDIDA */}
      <div className="w-full max-w-5xl bg-white border border-[#E8E3D9] rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-500">
        {/* LADO IZQUIERDO: Branding y Propuesta de Valor */}
        <div className="bg-[#6B806F] text-white p-10 md:p-16 flex flex-col justify-between md:w-5/12 relative overflow-hidden">
          {/* Círculos decorativos de fondo */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <h1 className="text-4xl font-black tracking-tight mb-2">
              PsyTrack.
            </h1>
            <p className="text-[#D3DDD4] font-medium text-lg">
              Tu consultorio, elevado a la máxima potencia.
            </p>
          </div>

          <div className="mt-12 mb-12 md:mb-0 relative z-10">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Privacidad total</h4>
                  <p className="text-[#D3DDD4] text-sm mt-1">
                    Cumplimos con la Ley 25.326. Tus historias clínicas están
                    encriptadas de extremo a extremo.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 hidden md:block">
            <p className="text-xs text-[#D3DDD4] font-medium">
              © {new Date().getFullYear()} PsyTrack. Todos los derechos
              reservados.
            </p>
          </div>
        </div>

        {/* LADO DERECHO: Formulario */}
        <div className="p-10 md:p-16 md:w-7/12 flex flex-col justify-center bg-white">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-[#4A443C]">
              {esRegistro ? "Creá tu cuenta" : "Iniciá sesión"}
            </h2>
            <p className="text-[#8A8175] font-medium mt-2">
              {esRegistro
                ? "Comenzá a gestionar tu clínica de forma inteligente."
                : "Bienvenido de nuevo a tu consultorio digital."}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-[#FCEEE9] border border-[#F5D8CE] rounded-2xl flex items-start gap-3 text-[#B06043] animate-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          <form onSubmit={procesarAutenticacion} className="space-y-5">
            {esRegistro && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#A49A8D] uppercase tracking-widest ml-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <UserIcon
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A49A8D]"
                    size={20}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Ej: Lic. Laura Gómez"
                    className="w-full p-4 pl-12 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none focus:border-[#6B806F] font-medium text-[#4A443C] transition-colors"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#A49A8D] uppercase tracking-widest ml-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A49A8D]"
                  size={20}
                />
                <input
                  type="email"
                  required
                  placeholder="tu@email.com"
                  className="w-full p-4 pl-12 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none focus:border-[#6B806F] font-medium text-[#4A443C] transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#A49A8D] uppercase tracking-widest ml-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A49A8D]"
                  size={20}
                />
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  className="w-full p-4 pl-12 bg-[#FBF9F6] border border-[#E8E3D9] rounded-2xl outline-none focus:border-[#6B806F] font-medium text-[#4A443C] transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {esRegistro && (
              <div className="flex items-start gap-3 mt-4 pt-2">
                <div className="relative flex items-center mt-1">
                  <input
                    type="checkbox"
                    id="legal"
                    className="peer w-5 h-5 appearance-none border-2 border-[#E8E3D9] rounded-md checked:bg-[#6B806F] checked:border-[#6B806F] transition-all cursor-pointer"
                    checked={aceptaTerminos}
                    onChange={(e) => setAceptaTerminos(e.target.checked)}
                  />
                  <ShieldCheck
                    size={14}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none"
                  />
                </div>
                <label
                  htmlFor="legal"
                  className="text-xs text-[#8A8175] font-medium leading-relaxed cursor-pointer select-none"
                >
                  Acepto los{" "}
                  <a
                    href="#"
                    className="font-bold text-[#6B806F] hover:underline"
                  >
                    Términos y Condiciones de Uso
                  </a>{" "}
                  y autorizo el tratamiento de datos según lo establecido en la{" "}
                  <a
                    href="#"
                    className="font-bold text-[#6B806F] hover:underline"
                  >
                    Ley de Protección de Datos Personales (N° 25.326)
                  </a>{" "}
                  de la República Argentina.
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#4A443C] text-white py-4 rounded-2xl font-bold text-lg flex justify-center items-center gap-2 hover:bg-[#312d28] transition-all disabled:opacity-70 mt-6 shadow-md"
            >
              {cargando ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  {esRegistro ? "Crear Consultorio" : "Ingresar al Consultorio"}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-[#F2EFE9] pt-8">
            <p className="text-[#8A8175] font-medium text-sm">
              {esRegistro ? "¿Ya tenés una cuenta?" : "¿Sos nuevo en PsyTrack?"}{" "}
              <button
                onClick={() => {
                  setEsRegistro(!esRegistro);
                  setError("");
                }}
                className="font-black text-[#B06043] hover:underline transition-all ml-1"
              >
                {esRegistro ? "Iniciá sesión acá" : "Registrate gratis"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
