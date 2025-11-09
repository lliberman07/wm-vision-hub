import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PMSUsersManagement from "@/components/PMSUsersManagement";
import PMSRolesManagement from "@/components/PMSRolesManagement";
import { Users, Shield } from "lucide-react";

export function PMSUsersAndRolesView() {
  return (
    <Card className="shadow-strong">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Gestión de Usuarios y Roles PMS</span>
        </CardTitle>
        <CardDescription>
          Administrar usuarios, asignar roles y revisar permisos del sistema PMS
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuarios PMS
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <Shield className="h-4 w-4" />
              Asignación de Roles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <PMSUsersManagement />
          </TabsContent>

          <TabsContent value="roles">
            <PMSRolesManagement />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
