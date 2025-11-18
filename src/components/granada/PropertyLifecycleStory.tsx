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
    <div className="space-y-8">
      {/* Desktop: Timeline horizontal con scroll */}
      <div className="hidden lg:block overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max px-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-start gap-4">
              <Card className="w-[320px] hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Badge 
                      variant="secondary" 
                      className="text-2xl font-bold h-12 w-12 flex items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0"
                    >
                      {step.number}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="mb-3">
                        <step.icon className="h-6 w-6 text-primary mb-2" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {index < steps.length - 1 && (
                <div className="flex items-center h-full pt-20">
                  <div className="w-8 h-0.5 bg-border" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Cards apiladas */}
      <div className="lg:hidden space-y-4">
        {steps.map((step) => (
          <Card key={step.number} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Badge 
                  variant="secondary" 
                  className="text-xl font-bold h-10 w-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0"
                >
                  {step.number}
                </Badge>
                <div className="flex-1">
                  <div className="mb-2">
                    <step.icon className="h-5 w-5 text-primary mb-1" />
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
