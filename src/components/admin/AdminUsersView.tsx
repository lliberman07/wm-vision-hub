import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import WMAdminUsersManagement from "@/components/WMAdminUsersManagement";
import { Shield } from "lucide-react";

export function AdminUsersView() {
  return (
    <Card className="shadow-strong">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Usuarios Admin de WM</span>
        </CardTitle>
        <CardDescription>
          Gestionar roles y accesos de usuarios administradores del cliente WM
        </CardDescription>
      </CardHeader>
      <CardContent>
        <WMAdminUsersManagement />
      </CardContent>
    </Card>
  );
}
