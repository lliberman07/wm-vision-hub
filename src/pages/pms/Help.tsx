import { useState } from 'react';
import { PMSLayout } from '@/components/pms/PMSLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoleCard } from '@/components/pms/help/RoleCard';
import { PermissionsMatrix } from '@/components/pms/help/PermissionsMatrix';
import { RoleHierarchyDiagram } from '@/components/pms/help/RoleHierarchyDiagram';
import { InteractiveExamples } from '@/components/pms/help/InteractiveExamples';
import { RoleLimitations } from '@/components/pms/help/RoleLimitations';
import { FAQSection } from '@/components/pms/help/FAQSection';
import { usePMS } from '@/contexts/PMSContext';
import { rolesData, PMSRole } from '@/data/pmsRolesData';
import { BookOpen } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Help = () => {
  const { activeRoleContext } = usePMS();
  const currentRole = activeRoleContext?.role as PMSRole | undefined;
  const currentRoleData = currentRole ? rolesData[currentRole] : null;

  const [selectedRole, setSelectedRole] = useState<PMSRole>(currentRole || 'SUPERADMIN');

  return (
    <PMSLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Ayuda - Sistema PMS</h1>
            <p className="text-muted-foreground">
              Documentación interactiva del sistema de roles y permisos
            </p>
          </div>
        </div>

        {currentRoleData && (
          <Alert>
            <BookOpen className="h-4 w-4" />
            <AlertDescription>
              Estás conectado como <strong>{currentRole}</strong>. La información está adaptada a tu rol actual.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs defaultValue="my-role" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="my-role">Mi Rol</TabsTrigger>
            <TabsTrigger value="all-roles">Todos los Roles</TabsTrigger>
            <TabsTrigger value="permissions">Permisos</TabsTrigger>
            <TabsTrigger value="hierarchy">Jerarquía</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          {/* Mi Rol */}
          <TabsContent value="my-role" className="space-y-6">
            {currentRoleData ? (
              <>
                <RoleCard roleData={currentRoleData} isCurrentRole defaultExpanded />
                
                <div>
                  <h2 className="text-2xl font-bold mb-4">Ejemplos Interactivos</h2>
                  <InteractiveExamples roleData={currentRoleData} />
                </div>

                <RoleLimitations roleData={currentRoleData} />

                <FAQSection roleData={currentRoleData} />
              </>
            ) : (
              <Alert>
                <AlertDescription>
                  No se pudo determinar tu rol actual. Por favor, selecciona un rol en las pestañas "Todos los Roles" o "Permisos".
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Todos los Roles */}
          <TabsContent value="all-roles" className="space-y-4">
            <div className="grid gap-4">
              {Object.values(rolesData).map((roleData) => (
                <RoleCard
                  key={roleData.role}
                  roleData={roleData}
                  isCurrentRole={roleData.role === currentRole}
                  defaultExpanded={roleData.role === currentRole}
                />
              ))}
            </div>
          </TabsContent>

          {/* Permisos y Capacidades */}
          <TabsContent value="permissions" className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Matriz de Permisos por Módulo</h2>
              <p className="text-muted-foreground mb-6">
                Esta tabla muestra qué roles tienen acceso a cada módulo del sistema.
              </p>
              <PermissionsMatrix currentRole={currentRole} />
            </div>
          </TabsContent>

          {/* Jerarquía */}
          <TabsContent value="hierarchy" className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Jerarquía de Roles</h2>
              <p className="text-muted-foreground mb-6">
                Estructura organizacional del sistema PMS mostrando la relación entre roles y tenants.
              </p>
              <RoleHierarchyDiagram currentRole={currentRole} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 mt-6">
              <Alert>
                <AlertDescription>
                  <strong>Tenants Independientes:</strong> INMOBILIARIA y ADMINISTRADOR son tenants completamente independientes, cada uno con su propio contexto y usuarios.
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertDescription>
                  <strong>Sub-tenants:</strong> PROPIETARIO e INQUILINO pueden existir dentro del contexto de una INMOBILIARIA o ADMINISTRADOR, o bien como tenants independientes.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Preguntas Frecuentes por Rol</h2>
              <Tabs value={selectedRole} onValueChange={(value) => setSelectedRole(value as PMSRole)}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="SUPERADMIN">SUPERADMIN</TabsTrigger>
                  <TabsTrigger value="INMOBILIARIA">INMOBILIARIA</TabsTrigger>
                  <TabsTrigger value="ADMINISTRADOR">ADMINISTRADOR</TabsTrigger>
                  <TabsTrigger value="PROPIETARIO">PROPIETARIO</TabsTrigger>
                  <TabsTrigger value="INQUILINO">INQUILINO</TabsTrigger>
                </TabsList>

                {Object.values(rolesData).map((roleData) => (
                  <TabsContent key={roleData.role} value={roleData.role}>
                    <FAQSection roleData={roleData} />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PMSLayout>
  );
};

export default Help;
