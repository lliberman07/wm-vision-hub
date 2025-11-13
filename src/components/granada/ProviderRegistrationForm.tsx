import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const serviceCategories = [
  "Plomería",
  "Gasista",
  "Electricista",
  "Pintura",
  "Carpintería",
  "Cerrajería",
  "Limpieza",
  "Jardinería",
  "Refrigeración",
  "Alarmas y Seguridad",
];

export default function ProviderRegistrationForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    description: "",
    coverage_area: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implement actual submission to service_providers table
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "¡Registro Exitoso!",
        description: "Nos pondremos en contacto contigo pronto para validar tu perfil.",
      });
      
      setFormData({
        name: "",
        email: "",
        phone: "",
        category: "",
        description: "",
        coverage_area: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo completar el registro. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre Completo / Empresa</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoría de Servicio</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {serviceCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="coverage_area">Zona de Cobertura</Label>
        <Input
          id="coverage_area"
          placeholder="Ej: CABA, Zona Norte GBA, etc."
          value={formData.coverage_area}
          onChange={(e) => setFormData({ ...formData, coverage_area: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción de Servicios</Label>
        <Textarea
          id="description"
          placeholder="Describe tu experiencia y servicios que ofreces..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Enviando..." : "Registrarse como Proveedor"}
      </Button>
    </form>
  );
}
