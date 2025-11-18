import { GranadaHeader } from "@/components/granada/GranadaHeader";
import { GranadaFooter } from "@/components/granada/GranadaFooter";

export default function Propietarios() {
  return (
    <div className="granada-theme min-h-screen bg-background">
      <GranadaHeader />
      
      <main className="container py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Para Propietarios</h1>
          <p className="text-muted-foreground">
            Página en construcción - Fase 1: Estructura base
          </p>
        </div>
      </main>

      <GranadaFooter />
    </div>
  );
}
