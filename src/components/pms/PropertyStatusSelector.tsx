import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, CheckCircle2, Home, Wrench, Ban } from 'lucide-react';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useState } from 'react';
import { LimitExceededModal } from './LimitExceededModal';

type PropertyStatus = 'inactive' | 'active' | 'rented' | 'maintenance';

interface PropertyStatusSelectorProps {
  currentStatus: PropertyStatus;
  propertyId?: string;
  tenantId: string;
  hasActiveContract: boolean;
  onStatusChange: (newStatus: PropertyStatus) => Promise<void>;
  disabled?: boolean;
}

const statusConfig = {
  inactive: {
    label: 'No Activa',
    icon: Ban,
    color: 'text-muted-foreground',
    description: 'No consume límite de suscripción',
  },
  active: {
    label: 'Activa',
    icon: Home,
    color: 'text-green-600',
    description: 'Consume límite - Disponible para administrar',
  },
  rented: {
    label: 'Alquilada',
    icon: CheckCircle2,
    color: 'text-blue-600',
    description: 'Consume límite - Con contrato activo',
  },
  maintenance: {
    label: 'Mantenimiento',
    icon: Wrench,
    color: 'text-orange-600',
    description: 'Consume límite - En reparación',
  },
};

export function PropertyStatusSelector({
  currentStatus,
  propertyId,
  tenantId,
  hasActiveContract,
  onStatusChange,
  disabled,
}: PropertyStatusSelectorProps) {
  const { checkLimit } = useSubscriptionLimits();
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<PropertyStatus | null>(null);

  const handleStatusChange = async (newStatus: PropertyStatus) => {
    // No permitir cambio si tiene contrato activo y está rented
    if (currentStatus === 'rented' && hasActiveContract && newStatus !== 'rented') {
      return; // Bloqueado por diseño
    }

    // Si cambia de inactive a cualquier estado que consume límite, validar
    if (currentStatus === 'inactive' && newStatus !== 'inactive') {
      const limitCheck = await checkLimit('property');
      if (!limitCheck.allowed) {
        setPendingStatus(newStatus);
        setIsLimitModalOpen(true);
        return;
      }
    }

    // Permitir cambio
    await onStatusChange(newStatus);
  };

  const handleModalClose = () => {
    setIsLimitModalOpen(false);
    setPendingStatus(null);
  };

  const handleModalDeactivate = async () => {
    // Usuario elige desactivar otra propiedad - cerrar modal y abrir lista
    setIsLimitModalOpen(false);
    // En este caso, la modal ofrece botón para ver propiedades activas
  };

  const isStatusDisabled = (status: PropertyStatus) => {
    // No permitir cambiar status='rented' si tiene contrato activo
    if (currentStatus === 'rented' && hasActiveContract) {
      return status !== 'rented';
    }
    return false;
  };

  const StatusIcon = statusConfig[currentStatus].icon;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-4 w-4 ${statusConfig[currentStatus].color}`} />
              <Select
                value={currentStatus}
                onValueChange={(value) => handleStatusChange(value as PropertyStatus)}
                disabled={disabled || (currentStatus === 'rented' && hasActiveContract)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    const isDisabled = isStatusDisabled(key as PropertyStatus);
                    return (
                      <SelectItem
                        key={key}
                        value={key}
                        disabled={isDisabled}
                        className="flex items-center gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${config.color}`} />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {currentStatus === 'rented' && hasActiveContract && (
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[250px]">
            <div className="space-y-1">
              <p className="font-semibold">{statusConfig[currentStatus].label}</p>
              <p className="text-sm text-muted-foreground">{statusConfig[currentStatus].description}</p>
              {currentStatus === 'rented' && hasActiveContract && (
                <p className="text-sm text-orange-600 mt-2">
                  ⚠️ No se puede cambiar el estado mientras exista un contrato activo.
                  Cancele el contrato primero.
                </p>
              )}
              {currentStatus === 'inactive' && (
                <p className="text-sm text-blue-600 mt-2">
                  💡 Para activar esta propiedad, verifica que no hayas alcanzado el límite de tu plan.
                  Las propiedades inactivas no pueden tener contratos ni gastos.
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <LimitExceededModal
        open={isLimitModalOpen}
        onOpenChange={handleModalClose}
        resourceType="property"
        tenantId={tenantId}
        onRetry={() => {
          if (pendingStatus) {
            handleStatusChange(pendingStatus);
          }
        }}
      />
    </>
  );
}
