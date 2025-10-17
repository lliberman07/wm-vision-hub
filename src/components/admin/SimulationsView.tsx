import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SimulationsManagement } from "@/components/SimulationsManagement";
import { TrendingUp } from "lucide-react";

export function SimulationsView() {
  return (
    <Card className="shadow-strong">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Simulaciones de Inversión</span>
        </CardTitle>
        <CardDescription>
          Seguimiento de simulaciones y conversión a perfiles de proyecto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SimulationsManagement />
      </CardContent>
    </Card>
  );
}
