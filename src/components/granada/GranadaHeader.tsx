import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import granadaLogo from "@/assets/granada-logo-new.jpg";

export function GranadaHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-start pt-4 justify-between">
        <Link to="/granada-platform" className="flex items-center gap-2 relative z-[100]">
          <img src={granadaLogo} alt="Granada Property Management" className="h-[168px] w-auto drop-shadow-lg" />
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <a href="/granada-platform#inmobiliarias" className="text-sm font-medium hover:text-primary transition-colors">Para Inmobiliarias</a>
          <a href="/granada-platform#propietarios" className="text-sm font-medium hover:text-primary transition-colors">Para Propietarios</a>
          <Link to="/partners-directory" className="text-sm font-medium hover:text-primary transition-colors">Directorio</Link>
          <a href="/granada-platform#planes" className="text-sm font-medium hover:text-primary transition-colors">Planes</a>
          <a href="/granada-platform#proveedores" className="text-sm font-medium hover:text-primary transition-colors">Proveedores</a>
          <Link to="/granada-platform/contact" className="text-sm font-medium hover:text-primary transition-colors">Contacto</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild><Link to="/pms/login">Acceso PMS</Link></Button>
        </div>
      </div>
    </header>
  );
}
