import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, Building2, Users, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubscriptionLimitAlertProps {
  limitType: 'property' | 'user' | 'contract' | 'branch';
  currentCount: number;
  limit: number;
  onViewResources?: () => void;
  onUpgradePlan?: () => void;
}

const typeConfig = {
  property: {
    label: 'Propiedades',
    icon: Building2,
    route: '/pms/properties',
  },
  user: {
    label: 'Usuarios',
    icon: Users,
    route: '/client-admin/users',
  },
  contract: {
    label: 'Contratos',
    icon: FileText,
    route: '/pms/contracts',
  },
  branch: {
    label: 'Sucursales',
    icon: Building2,
    route: '/client-admin',
  },
};

export function SubscriptionLimitAlert({
  limitType,
  currentCount,
  limit,
  onViewResources,
  onUpgradePlan,
}: SubscriptionLimitAlertProps) {
  const navigate = useNavigate();
  const config = typeConfig[limitType];
  const Icon = config.icon;
  const percentage = (currentCount / limit) * 100;

  // No mostrar si está por debajo del 80%
  if (percentage < 80) return null;

  const variant = percentage >= 100 ? 'destructive' : 'default';
  const isCritical = percentage >= 100;

  return (
    <Alert variant={variant} className="mb-4">
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5" />
        <div className="flex-1 space-y-2">
          <AlertTitle className="flex items-center gap-2">
            {isCritical && <AlertTriangle className="h-4 w-4" />}
            {isCritical ? 'Límite Alcanzado' : 'Cerca del Límite'}
          </AlertTitle>
          <AlertDescription className="space-y-2">
            <div>
              {isCritical ? (
                <p>
                  Has alcanzado el límite de <strong>{config.label}</strong> de tu plan.
                  Actualmente: <strong>{currentCount}/{limit}</strong>
                </p>
              ) : (
                <p>
                  Estás utilizando <strong>{currentCount} de {limit}</strong> {config.label.toLowerCase()} disponibles.
                </p>
              )}
            </div>
            <Progress value={percentage} className="h-2" />
            <div className="flex flex-wrap gap-2 mt-3">
              {onViewResources && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onViewResources}
                >
                  Ver {config.label}
                </Button>
              )}
              {isCritical && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(config.route)}
                  >
                    Administrar Recursos
                  </Button>
                  {onUpgradePlan && (
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={onUpgradePlan}
                    >
                      <TrendingUp className="h-4 w-4" />
                      Actualizar Plan
                    </Button>
                  )}
                </>
              )}
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
