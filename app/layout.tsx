import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Si guardaste el archivo en app, usá la ruta de abajo. Si está en components, usá "@/components/Sidebar"
import Sidebar from "@/components/Sidebar"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PsyTrack",
  description: "Gestión Clínica y Bienestar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} flex h-screen bg-[#FBF9F6] text-[#4A443C] overflow-hidden`}>
        
        {/* Usamos el componente Sidebar que creamos */}
        <Sidebar />

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto bg-[#FBF9F6] p-8 md:p-12 relative z-0">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}