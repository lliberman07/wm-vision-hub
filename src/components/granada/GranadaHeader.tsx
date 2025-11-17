import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import granadaLogo from "@/assets/granada-logo-new.jpg";

export function GranadaHeader() {
  const { toast } = useToast();
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);

  const handleDemoRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: "¡Solicitud Enviada!",
      description: "Nos pondremos en contacto contigo dentro de las próximas 24 horas.",
    });
    setDemoDialogOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center justify-between">
        <Link to="/granada-platform" className="flex items-center gap-2 relative z-[100]">
          <img src={granadaLogo} alt="Granada Property Management" className="h-40 w-auto drop-shadow-lg" />
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
          <Dialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen}>
            <DialogTrigger asChild><Button>Solicitar Demo</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Solicitar Demo Gratuita</DialogTitle>
                <DialogDescription>Completa el formulario y te contactaremos</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleDemoRequest} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="demo-name">Nombre Completo</Label><Input id="demo-name" name="name" required /></div>
                <div className="space-y-2"><Label htmlFor="demo-email">Email</Label><Input id="demo-email" name="email" type="email" required /></div>
                <div className="space-y-2"><Label htmlFor="demo-phone">Teléfono</Label><Input id="demo-phone" name="phone" type="tel" required /></div>
                <div className="space-y-2"><Label htmlFor="demo-company">Empresa</Label><Input id="demo-company" name="company" required /></div>
                <Button type="submit" className="w-full">Enviar Solicitud</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
