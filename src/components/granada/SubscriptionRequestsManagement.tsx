import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck } from "lucide-react";

export function SubscriptionRequestsManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          Solicitudes de Suscripción
        </CardTitle>
        <CardDescription>
          Gestión de solicitudes pendientes (en desarrollo)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Este módulo permitirá aprobar/rechazar solicitudes de nuevos clientes.
          Actualmente en desarrollo.
        </p>
      </CardContent>
    </Card>
  );
}
