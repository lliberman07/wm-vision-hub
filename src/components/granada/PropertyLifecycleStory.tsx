import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Search,
  FileText,
  CreditCard,
  Wrench,
  FileBarChart,
  RefreshCw,
} from "lucide-react";

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ElementType;
}

const steps: Step[] = [
  {
    number: 1,
    title: "Captar y preparar la propiedad",
    description: "Cargás la propiedad con datos clave: ubicación, tipo de alquiler, valor, moneda, inventario, fotos, documentación. Definís Propietario, Inmobiliaria/Administrador y distribución de fondos.",
    icon: Home,
  },
  {
    number: 2,
    title: "Publicación y selección de inquilino",
    description: "Integrás Granada con portales, recibís interesados, registrás candidatos, requisitos y decisiones. Todo el contexto en el sistema.",
    icon: Search,
  },
  {
    number: 3,
    title: "Contrato y firmas",
    description: "Generás el contrato desde Granada con todos los datos clave. Gestionás firmas digitales o presenciales, todo documentado.",
    icon: FileText,
  },
  {
    number: 4,
    title: "Pagos y cobros mensuales",
    description: "Granada calcula importes, genera recordatorios, registra pagos/atrasos, distribuye montos según honorarios, comisiones, retenciones.",
    icon: CreditCard,
  },
  {
    number: 5,
    title: "Gastos, mantenimientos y proveedores",
    description: "Creás órdenes de trabajo, asignás proveedores, registrás presupuestos. El propietario aprueba y todo queda asociado.",
    icon: Wrench,
  },
  {
    number: 6,
    title: "Reportes y relación con el propietario",
    description: "Cada mes: reporte claro de alquileres, gastos, comisiones y saldo neto. Portal de Propietario para más detalle.",
    icon: FileBarChart,
  },
  {
    number: 7,
    title: "Renovaciones, actualizaciones y cierre",
    description: "Granada avisa vencimientos, opciones de renovación, índices de actualización. Todo el historial disponible.",
    icon: RefreshCw,
  },
];

export function PropertyLifecycleStory() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {steps.map((step) => (
        <Card 
          key={step.number} 
          className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group h-full"
        >
          <CardContent className="p-6 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <Badge 
                variant="secondary" 
                className="text-xl font-bold h-12 w-12 flex items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0"
              >
                {step.number}
              </Badge>
              <step.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-3 group-hover:text-primary transition-colors">
              {step.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
              {step.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
