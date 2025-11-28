import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface EmailVerificationAlertProps {
  existsInAuth: boolean;
  otherTenants: Array<{
    tenant_id: string;
    tenant_name: string;
    user_type: string;
    is_active: boolean;
    created_at: string;
  }>;
  onConfirmLink?: (confirmed: boolean) => void;
  confirmed?: boolean;
}

export function EmailVerificationAlert({
  existsInAuth,
  otherTenants,
  onConfirmLink,
  confirmed = false,
}: EmailVerificationAlertProps) {
  if (!existsInAuth && otherTenants.length === 0) {
    return null;
  }

  const isCrossTenant = otherTenants.length > 0;

  return (
    <div className="space-y-3">
      {existsInAuth && (
        <Alert variant="default" className="border-blue-500 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">Usuario existente</AlertTitle>
          <AlertDescription className="text-blue-800">
            Este email ya está registrado en el sistema. El usuario será vinculado a este tenant.
          </AlertDescription>
        </Alert>
      )}

      {isCrossTenant && (
        <Alert variant="default" className="border-amber-500 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuario Multi-Tenant Detectado
          </AlertTitle>
          <AlertDescription className="space-y-3 text-amber-800">
            <p>
              Este usuario ya tiene acceso a los siguientes tenants:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {otherTenants.map((tenant) => (
                <li key={tenant.tenant_id}>
                  <span className="font-medium">{tenant.tenant_name}</span> 
                  {' '}como{' '}
                  <span className="font-semibold">{tenant.user_type}</span>
                  {tenant.is_active ? (
                    <span className="text-green-700 ml-2">(activo)</span>
                  ) : (
                    <span className="text-gray-600 ml-2">(inactivo)</span>
                  )}
                </li>
              ))}
            </ul>

            {onConfirmLink && (
              <div className="flex items-start gap-3 mt-4 p-3 bg-white rounded-md border border-amber-200">
                <Checkbox
                  id="confirm-cross-tenant"
                  checked={confirmed}
                  onCheckedChange={onConfirmLink}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="confirm-cross-tenant"
                    className="text-sm font-medium text-amber-900 cursor-pointer"
                  >
                    Confirmo que deseo vincular este usuario a múltiples tenants
                  </Label>
                  <p className="text-xs text-amber-700 mt-1">
                    El usuario tendrá acceso a los datos de ambos tenants según los permisos asignados.
                  </p>
                </div>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
