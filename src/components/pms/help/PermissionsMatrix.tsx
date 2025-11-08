import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { PMSRole, modulePermissions } from '@/data/pmsRolesData';
import { getRoleColor } from '@/lib/pmsRoleHelpers';

interface PermissionsMatrixProps {
  currentRole?: PMSRole;
}

const modules = [
  { key: 'properties', label: 'Propiedades' },
  { key: 'owners', label: 'Propietarios' },
  { key: 'tenants', label: 'Inquilinos' },
  { key: 'contracts', label: 'Contratos' },
  { key: 'payments', label: 'Pagos' },
  { key: 'expenses', label: 'Gastos' },
  { key: 'receipts', label: 'Recibos' },
  { key: 'maintenance', label: 'Mantenimiento' },
  { key: 'reports', label: 'Reportes' },
  { key: 'indices', label: 'Índices' }
];

const roles: PMSRole[] = ['SUPERADMIN', 'INMOBILIARIA', 'ADMINISTRADOR', 'PROPIETARIO', 'INQUILINO'];

export function PermissionsMatrix({ currentRole }: PermissionsMatrixProps) {
  const hasAccess = (role: PMSRole, moduleKey: string): boolean => {
    return modulePermissions[moduleKey]?.includes(role) || false;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Módulo</TableHead>
            {roles.map((role) => {
              const colorClass = getRoleColor(role);
              const isCurrentRole = role === currentRole;
              return (
                <TableHead key={role} className="text-center">
                  <Badge 
                    variant={isCurrentRole ? "default" : "secondary"}
                    className={`${isCurrentRole ? '' : colorClass} text-xs whitespace-nowrap`}
                  >
                    {role}
                  </Badge>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {modules.map((module) => (
            <TableRow key={module.key}>
              <TableCell className="font-medium">{module.label}</TableCell>
              {roles.map((role) => {
                const access = hasAccess(role, module.key);
                const isCurrentRole = role === currentRole;
                return (
                  <TableCell 
                    key={`${module.key}-${role}`} 
                    className={`text-center ${isCurrentRole ? 'bg-muted/50' : ''}`}
                  >
                    {access ? (
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-red-600 dark:text-red-400 mx-auto" />
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
