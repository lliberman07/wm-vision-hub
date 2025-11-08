import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleData } from '@/data/pmsRolesData';

interface RoleLimitationsProps {
  roleData: RoleData;
}

export function RoleLimitations({ roleData }: RoleLimitationsProps) {
  if (!roleData.limitations || roleData.limitations.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Sin limitaciones especiales</AlertTitle>
        <AlertDescription>
          Este rol tiene acceso completo dentro de su contexto.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Limitaciones de tu rol: {roleData.role}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {roleData.limitations.map((limitation, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <span className="text-red-600 dark:text-red-400 mt-0.5 shrink-0">✗</span>
              <div>
                <p className="text-sm font-medium">{limitation}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>¿Necesitas más permisos?</strong> Contacta al administrador de tu tenant o al SUPERADMIN del sistema para solicitar acceso adicional.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
