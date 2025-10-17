import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PMSTenantsManagement } from "@/components/PMSTenantsManagement";
import { Building } from "lucide-react";

export function PMSTenantsView() {
  return (
    <Card className="shadow-strong">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building className="h-5 w-5" />
          <span>Tenants del Sistema PMS</span>
        </CardTitle>
        <CardDescription>
          Gestionar organizaciones (inmobiliarias) que tienen acceso al sistema PMS
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PMSTenantsManagement />
      </CardContent>
    </Card>
  );
}
