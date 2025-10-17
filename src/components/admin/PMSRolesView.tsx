import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PMSRolesManagement from "@/components/PMSRolesManagement";
import { Shield } from "lucide-react";

export function PMSRolesView() {
  return (
    <Card className="shadow-strong">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Roles del Sistema PMS</span>
        </CardTitle>
        <CardDescription>
          Gestionar roles y permisos de usuarios en el sistema PMS
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PMSRolesManagement />
      </CardContent>
    </Card>
  );
}
