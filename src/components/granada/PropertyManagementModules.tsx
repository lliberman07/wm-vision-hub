import { Building2, FileText, Users, Calculator, DollarSign, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PropertyManagementModulesProps {
  audience: 'inmobiliarias' | 'property-managers' | 'self-manage' | 'delegate';
}

export function PropertyManagementModules({ audience }: PropertyManagementModulesProps) {
  const getModules = () => {
    switch (audience) {
      case 'inmobiliarias':
        return [
          {
            icon: Building2,
            title: "Gestión de Alquileres",
            description: "Administre todas las propiedades de sus clientes desde un solo lugar. Control centralizado de pagos, vencimientos y renovaciones.",
            items: [
              "Panel unificado de todas las propiedades",
              "Seguimiento de pagos por cliente",
              "Alertas de vencimientos automáticas",
              "Gestión multi-propiedad eficiente"
            ]
          },
          {
            icon: FileText,
            title: "Contratos Digitales",
            description: "Contratos profesionales con firma digital para agilizar procesos y reducir tiempos de gestión.",
            items: [
              "Plantillas personalizables",
              "Firma digital integrada",
              "Archivo centralizado en la nube",
              "Renovaciones automáticas"
            ]
          },
          {
            icon: Users,
            title: "CRM de Propietarios e Inquilinos",
            description: "Gestione la relación con propietarios e inquilinos de forma centralizada y profesional.",
            items: [
              "Base de datos unificada",
              "Historial completo de interacciones",
              "Comunicación automatizada",
              "Segmentación por tipo de cliente"
            ]
          },
          {
            icon: Calculator,
            title: "Servicios y Mantenimiento",
            description: "Coordine reparaciones y servicios con proveedores integrados. Seguimiento completo de gastos.",
            items: [
              "Red de proveedores certificados",
              "Órdenes de trabajo digitales",
              "Seguimiento de estado en tiempo real",
              "Control presupuestario"
            ]
          },
          {
            icon: DollarSign,
            title: "Control Financiero",
            description: "Liquidaciones automáticas a propietarios con trazabilidad total. Gestión de comisiones simplificada.",
            items: [
              "Liquidaciones mensuales automáticas",
              "Cálculo de comisiones personalizable",
              "Conciliación bancaria",
              "Reportes fiscales"
            ]
          },
          {
            icon: Shield,
            title: "Portal para Propietarios",
            description: "Sus clientes pueden ver el estado de sus propiedades 24/7. Transparencia total que genera confianza.",
            items: [
              "Acceso web y móvil",
              "Reportes mensuales automáticos",
              "Consulta de movimientos en tiempo real",
              "Documentación centralizada"
            ]
          }
        ];

      case 'property-managers':
        return [
          {
            icon: Building2,
            title: "Gestión Multi-Propiedad",
            description: "Administre todas las propiedades de sus clientes con transparencia total y procesos automatizados.",
            items: [
              "Vista consolidada de cartera",
              "Dashboard personalizado por cliente",
              "KPIs en tiempo real",
              "Gestión eficiente de múltiples propiedades"
            ]
          },
          {
            icon: FileText,
            title: "Contratos Profesionales",
            description: "Genere contratos de nivel enterprise sin necesidad de abogados externos. Firma digital incluida.",
            items: [
              "Plantillas profesionales",
              "Cláusulas personalizables",
              "Firma digital válida legalmente",
              "Gestión de renovaciones"
            ]
          },
          {
            icon: Users,
            title: "CRM Simplificado",
            description: "Mantenga relaciones profesionales con sus clientes propietarios e inquilinos.",
            items: [
              "Perfil completo de cada cliente",
              "Historial de comunicaciones",
              "Recordatorios automáticos",
              "Base de datos organizada"
            ]
          },
          {
            icon: Calculator,
            title: "Gestión de Servicios",
            description: "Coordine mantenimientos y reparaciones de forma profesional con seguimiento completo.",
            items: [
              "Solicitudes de mantenimiento digitales",
              "Presupuestos y aprobaciones",
              "Seguimiento de proveedores",
              "Control de gastos"
            ]
          },
          {
            icon: DollarSign,
            title: "Liquidaciones Automáticas",
            description: "Calcule y genere liquidaciones a propietarios automáticamente. Cero errores, máxima transparencia.",
            items: [
              "Cálculo automático de comisiones",
              "Deducción de gastos",
              "Envío automático de liquidaciones",
              "Historial completo"
            ]
          },
          {
            icon: Shield,
            title: "Portal del Propietario",
            description: "Sus clientes ven todo en tiempo real. Transparencia que genera confianza y fidelización.",
            items: [
              "Acceso 24/7 para propietarios",
              "Reportes automáticos mensuales",
              "Consulta de pagos y gastos",
              "Documentos siempre disponibles"
            ]
          }
        ];

      case 'self-manage':
        return [
          {
            icon: Building2,
            title: "Cobros Automáticos",
            description: "Configure cobros recurrentes y olvídese de perseguir inquilinos. La plataforma lo hace por usted.",
            items: [
              "Recordatorios automáticos a inquilinos",
              "Links de pago incluidos",
              "Seguimiento de estado",
              "Alertas de morosidad"
            ]
          },
          {
            icon: FileText,
            title: "Contratos Simples",
            description: "Genere contratos profesionales en minutos, sin necesidad de conocimientos legales.",
            items: [
              "Plantillas pre-cargadas",
              "Solo complete los campos",
              "Firma digital opcional",
              "Renovación con un click"
            ]
          },
          {
            icon: Users,
            title: "Comunicación con Inquilinos",
            description: "Portal donde sus inquilinos pueden reportar problemas y consultar información.",
            items: [
              "Portal de inquilino incluido",
              "Solicitudes de mantenimiento digitales",
              "Mensajería interna",
              "Notificaciones automáticas"
            ]
          },
          {
            icon: Calculator,
            title: "Seguimiento de Gastos",
            description: "Todos los gastos de mantenimiento organizados automáticamente por propiedad.",
            items: [
              "Carga rápida de gastos",
              "Categorización automática",
              "Comprobantes digitales",
              "Reportes por propiedad"
            ]
          },
          {
            icon: DollarSign,
            title: "Calculadora de Rentabilidad",
            description: "Vea cuánto está ganando realmente con cada propiedad. ROI en tiempo real.",
            items: [
              "Cálculo automático de ROI",
              "Comparativa entre propiedades",
              "Proyecciones financieras",
              "Análisis de rentabilidad"
            ]
          },
          {
            icon: Shield,
            title: "Archivo Digital",
            description: "Todos sus documentos seguros en la nube. Acceda desde cualquier lugar.",
            items: [
              "Almacenamiento ilimitado",
              "Organización automática",
              "Búsqueda rápida",
              "Respaldo automático"
            ]
          }
        ];

      case 'delegate':
        return [
          {
            icon: Building2,
            title: "Vista Consolidada",
            description: "Vea todas sus propiedades en un solo lugar. Estado, ocupación y rendimiento al instante.",
            items: [
              "Dashboard personalizado",
              "KPIs principales visibles",
              "Estado de cada propiedad",
              "Comparativas de rendimiento"
            ]
          },
          {
            icon: FileText,
            title: "Contratos y Documentos",
            description: "Acceda a todos los contratos y documentos de sus propiedades cuando los necesite.",
            items: [
              "Biblioteca digital completa",
              "Contratos siempre disponibles",
              "Seguros y pólizas",
              "Documentación histórica"
            ]
          },
          {
            icon: Users,
            title: "Información de Inquilinos",
            description: "Conozca quién ocupa cada una de sus propiedades y su historial de pagos.",
            items: [
              "Perfil completo de inquilinos",
              "Historial de pagos",
              "Estado de cuenta actualizado",
              "Contacto directo con administrador"
            ]
          },
          {
            icon: Calculator,
            title: "Transparencia en Gastos",
            description: "Vea todos los gastos de mantenimiento y servicios aplicados a sus propiedades.",
            items: [
              "Detalle de cada gasto",
              "Comprobantes adjuntos",
              "Aprobaciones previas",
              "Histórico completo"
            ]
          },
          {
            icon: DollarSign,
            title: "Reportes Financieros",
            description: "Reciba liquidaciones mensuales detalladas con análisis de inversión profesional.",
            items: [
              "Liquidación mensual automática",
              "Análisis de rentabilidad",
              "Proyecciones anuales",
              "Comparativas históricas"
            ]
          },
          {
            icon: Shield,
            title: "Acceso 24/7",
            description: "Consulte el estado de su inversión cuando quiera, desde donde quiera.",
            items: [
              "Web y app móvil",
              "Información en tiempo real",
              "Notificaciones importantes",
              "Seguridad bancaria"
            ]
          }
        ];

      default:
        return [];
    }
  };

  const modules = getModules();

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {modules.map((module, index) => {
        const Icon = module.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow border-border/50">
            <CardHeader>
              <div className="mb-4 w-12 h-12 rounded-lg bg-gradient-to-br from-[hsl(var(--granada-red))] to-[hsl(var(--granada-red-dark))] flex items-center justify-center">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">{module.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{module.description}</p>
              <ul className="space-y-2">
                {module.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-[hsl(var(--granada-red))] mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
