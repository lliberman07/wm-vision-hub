import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { Calendar, DollarSign, MapPin, FileText, AlertCircle, CheckCircle2, Home, User, UserCheck } from 'lucide-react';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category?: string;
  priority: string;
  status: string;
  created_at: string;
  estimated_cost?: number;
  actual_cost?: number;
  scheduled_date?: string;
  completed_date?: string;
  notes?: string;
  property_id?: string;
  contract_id?: string;
  paid_by?: string;
  provider_contact?: string;
  provider_phone?: string;
  property_code?: string;
  property_address?: string;
  reporter_email?: string;
  reporter_name?: string;
  assignee_email?: string;
  assignee_name?: string;
}

interface MaintenanceDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenance?: MaintenanceRequest;
}

export function MaintenanceDetailsDialog({ open, onOpenChange, maintenance }: MaintenanceDetailsDialogProps) {
  if (!maintenance) return null;

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    };
    const labels: Record<string, string> = {
      high: 'Alta',
      medium: 'Media',
      low: 'Baja',
    };
    return <Badge variant={variants[priority] || 'secondary'}>{labels[priority] || priority}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      in_progress: 'default',
      completed: 'outline',
    };
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      in_progress: 'En Progreso',
      completed: 'Completado',
    };
    return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>;
  };

  const getCategoryLabel = (category?: string) => {
    const labels: Record<string, string> = {
      plumbing: 'Plomería',
      electrical: 'Eléctrico',
      hvac: 'Climatización',
      appliances: 'Electrodomésticos',
      structural: 'Estructural',
      painting: 'Pintura',
      other: 'Otro',
    };
    return category ? labels[category] || category : '-';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{maintenance.title}</DialogTitle>
        </DialogHeader>

        {maintenance.status === 'completed' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Esta solicitud ha sido finalizada y no puede ser modificada
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Estado y Prioridad */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Estado:</span>
              {getStatusBadge(maintenance.status)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Prioridad:</span>
              {getPriorityBadge(maintenance.priority)}
            </div>
          </div>

          {/* Propiedad */}
          {(maintenance.property_code || maintenance.property_address) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span>Propiedad</span>
              </div>
              <p className="text-sm text-muted-foreground pl-6">
                {maintenance.property_code && `${maintenance.property_code} - `}
                {maintenance.property_address || 'Sin dirección'}
              </p>
            </div>
          )}

          {/* Reportado por */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Reportado por</span>
            </div>
            <p className="text-sm text-muted-foreground pl-6">
              {maintenance.reporter_name || maintenance.reporter_email || 'Sistema'}
            </p>
          </div>

          {/* Asignado a */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span>Asignado a</span>
            </div>
            <p className="text-sm text-muted-foreground pl-6">
              {maintenance.assignee_name || maintenance.assignee_email || 'Sin asignar'}
            </p>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              <span>Descripción</span>
            </div>
            <p className="text-sm text-muted-foreground pl-6">{maintenance.description || 'Sin descripción'}</p>
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              <span>Categoría</span>
            </div>
            <p className="text-sm text-muted-foreground pl-6">{getCategoryLabel(maintenance.category)}</p>
          </div>

          {/* Pagado por */}
          {maintenance.paid_by && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4" />
                <span>Pagado por</span>
              </div>
              <p className="text-sm text-muted-foreground pl-6 capitalize">{maintenance.paid_by}</p>
            </div>
          )}

          {/* Proveedor */}
          {(maintenance.provider_contact || maintenance.provider_phone) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {maintenance.provider_contact && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4" />
                    <span>Contacto Proveedor</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">{maintenance.provider_contact}</p>
                </div>
              )}
              {maintenance.provider_phone && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4" />
                    <span>Tel. Proveedor</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">{maintenance.provider_phone}</p>
                </div>
              )}
            </div>
          )}

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                <span>Fecha de Creación</span>
              </div>
              <p className="text-sm text-muted-foreground pl-6">
                {format(new Date(maintenance.created_at), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>

            {maintenance.scheduled_date && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  <span>Fecha Programada</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  {format(new Date(maintenance.scheduled_date), 'dd/MM/yyyy')}
                </p>
              </div>
            )}

            {maintenance.completed_date && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  <span>Fecha de Finalización</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  {format(new Date(maintenance.completed_date), 'dd/MM/yyyy')}
                </p>
              </div>
            )}
          </div>

          {/* Costos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {maintenance.estimated_cost !== undefined && maintenance.estimated_cost !== null && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <DollarSign className="h-4 w-4" />
                  <span>Costo Estimado</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  ${maintenance.estimated_cost.toLocaleString()}
                </p>
              </div>
            )}

            {maintenance.actual_cost !== undefined && maintenance.actual_cost !== null && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <DollarSign className="h-4 w-4" />
                  <span>Costo Real</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  ${maintenance.actual_cost.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Notas */}
          {maintenance.notes && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                <span>Notas Adicionales</span>
              </div>
              <p className="text-sm text-muted-foreground pl-6">{maintenance.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
