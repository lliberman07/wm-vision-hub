import { Building2, Users, FileText, DollarSign, BarChart3, Bell, Wrench, Globe, Shield, TrendingUp } from "lucide-react";

interface Feature {
  icon: typeof Building2;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Building2,
    title: "Gestión Multi-Propiedad Inteligente",
    description: "Portfolio completo en un dashboard. Clonación de propiedades, fotos, documentos y estado en tiempo real.",
  },
  {
    icon: Users,
    title: "Gestión Centralizada de Stakeholders",
    description: "Base de datos unificada de propietarios e inquilinos con historial completo y comunicación automatizada.",
  },
  {
    icon: FileText,
    title: "Contratos Inteligentes con Proyecciones",
    description: "Generación automática de cronogramas, ajustes por índice (IPC, UVA), alertas de vencimiento y renovación.",
  },
  {
    icon: DollarSign,
    title: "Control Financiero Total",
    description: "Tracking de pagos visual, gestión de morosidad, múltiples métodos de pago y distribuciones automatizadas.",
  },
  {
    icon: BarChart3,
    title: "Reportes Automáticos Profesionales",
    description: "Informes mensuales con 1 click, desglose detallado, envío automático por email y exportación a PDF/Excel.",
  },
  {
    icon: Bell,
    title: "Sistema de Notificaciones Inteligente",
    description: "Recordatorios automáticos de pagos, alertas de morosidad escalonadas, notificaciones de mantenimiento.",
  },
  {
    icon: Wrench,
    title: "Gestión de Mantenimiento",
    description: "Registro de solicitudes, asignación a proveedores, tracking de costos e historial por propiedad.",
  },
  {
    icon: Globe,
    title: "Multi-Moneda Avanzado",
    description: "Soporte para ARS, USD, UYU y más. Tasas actualizadas diariamente y conversión automática en reportes.",
  },
  {
    icon: Shield,
    title: "Seguridad Empresarial",
    description: "Encriptación de datos sensibles, backups automáticos diarios y control de acceso por roles.",
  },
  {
    icon: TrendingUp,
    title: "Escalabilidad Garantizada",
    description: "De 10 a 10,000+ propiedades. Performance consistente e infraestructura cloud elástica.",
  },
];

export default function FeatureShowcase() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <div
            key={index}
            className="group bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Icon className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
