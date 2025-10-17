import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PMSAccessRequests from "@/components/PMSAccessRequests";
import { Users } from "lucide-react";

export function PMSAccessView() {
  return (
    <Card className="shadow-strong">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Solicitudes de Acceso PMS</span>
        </CardTitle>
        <CardDescription>
          Aprobar o rechazar solicitudes de acceso al sistema de administración de propiedades
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PMSAccessRequests />
      </CardContent>
    </Card>
  );
}
