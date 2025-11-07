import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PMSUsersManagement from "@/components/PMSUsersManagement";
import { Users } from "lucide-react";

export function PMSUsersView() {
  return (
    <Card className="shadow-strong">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Usuarios del Sistema PMS</span>
        </CardTitle>
        <CardDescription>
          Crear, editar y gestionar usuarios con sus roles y tenants asignados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PMSUsersManagement />
      </CardContent>
    </Card>
  );
}
