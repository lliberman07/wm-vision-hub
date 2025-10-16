import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Calendar, DollarSign, MapPin, FileText, AlertCircle } from 'lucide-react';

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
