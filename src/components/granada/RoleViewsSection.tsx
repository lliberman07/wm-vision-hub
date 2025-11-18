import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, User, Home } from "lucide-react";

const roles = [
  {
    title: "Inmobiliaria / Administrador",
    icon: Building2,
    description: "Tablero global, KPIs de cobros/gastos/rentabilidad, gestión de renovaciones y proveedores",
    features: [
      "Dashboard con métricas clave",
      "Gestión de múltiples propiedades",
      "Control de vencimientos",
      "Coordinación de proveedores",
    ],
  },
  {
    title: "Propietario",
    icon: User,
    description: "Resúmenes mensuales, contratos y vencimientos, historial de cobros y gastos",
    features: [
      "Reportes mensuales automáticos",
      "Visibilidad total de ingresos/gastos",
      "Historial completo por propiedad",
      "Aprobación de gastos extraordinarios",
    ],
  },
  {
    title: "Inquilino",
    icon: Home,
    description: "Contrato y pagos en un solo lugar, recordatorios, canal para reportar problemas",
    features: [
      "Acceso a contrato digital",
      "Historial de pagos",
      "Recordatorios automáticos",
      "Reporte de mantenimientos",
    ],
  },
];

export function RoleViewsSection() {
  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold text-center mb-8">
        Una vista para cada rol
      </h3>
      <div className="grid md:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role.title} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <role.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{role.title}</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                {role.description}
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {role.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
