import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePMS } from '@/contexts/PMSContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Eye, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { MaintenanceForm } from '@/components/pms/MaintenanceForm';
import { MaintenanceDetailsDialog } from '@/components/pms/MaintenanceDetailsDialog';
import { PMSLayout } from '@/components/pms/PMSLayout';

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
  property_code?: string;
  property_address?: string;
  reporter_email?: string;
  reporter_name?: string;
  assignee_email?: string;
  assignee_name?: string;
}

const Maintenance = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTenant, hasPMSAccess } = usePMS();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | undefined>();

  useEffect(() => {
    if (!user || !hasPMSAccess) {
      navigate('/pms');
      return;
    }
    fetchRequests();
  }, [user, hasPMSAccess, navigate]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('pms_maintenance_requests')
        .select(`
          *,
          pms_properties(code, address)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get unique user IDs for reporter and assignee
      const userIds = new Set<string>();
      (data || []).forEach((item: any) => {
        if (item.reported_by) userIds.add(item.reported_by);
        if (item.assigned_to) userIds.add(item.assigned_to);
      });

      // Fetch user details
      const usersMap = new Map();
      if (userIds.size > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email, first_name, last_name')
          .in('id', Array.from(userIds));
        
        (usersData || []).forEach((user: any) => {
          usersMap.set(user.id, user);
        });
      }
      
      const formattedData = (data || []).map((item: any) => {
        const reporter = usersMap.get(item.reported_by);
        const assignee = usersMap.get(item.assigned_to);
        
        return {
          ...item,
          property_code: item.pms_properties?.code,
          property_address: item.pms_properties?.address,
          reporter_email: reporter?.email,
          reporter_name: reporter?.first_name && reporter?.last_name
            ? `${reporter.first_name} ${reporter.last_name}`
            : reporter?.email,
          assignee_email: assignee?.email,
          assignee_name: assignee?.first_name && assignee?.last_name
            ? `${assignee.first_name} ${assignee.last_name}`
            : assignee?.email,
        };
      });
      
      setRequests(formattedData);
    } catch (error: any) {
      toast.error('Error al cargar solicitudes', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request =>
    request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <PMSLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mantenimiento</h1>
            <p className="text-muted-foreground">{currentTenant?.name}</p>
          </div>
          <Button onClick={() => { setSelectedRequest(undefined); setIsFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Solicitud
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Solicitudes de Mantenimiento</CardTitle>
            <CardDescription>Gestiona solicitudes de reparación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">Cargando...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron solicitudes
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Propiedad</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        {request.property_code && (
                          <div className="text-xs text-muted-foreground">
                            {request.property_code}
                          </div>
                        )}
                        <div className="text-sm">
                          {request.property_address || 'Sin dirección'}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{request.title}</TableCell>
                      <TableCell>{request.category || '-'}</TableCell>
                      <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {format(new Date(request.created_at), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedRequest(request); setIsDetailsOpen(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {request.status === 'completed' ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" disabled className="opacity-50">
                                  <Lock className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>No se puede editar una solicitud finalizada</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedRequest(request); setIsFormOpen(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <MaintenanceForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSuccess={fetchRequests}
          maintenance={selectedRequest}
        />

        <MaintenanceDetailsDialog
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          maintenance={selectedRequest}
        />
      </div>
    </PMSLayout>
  );
};

export default Maintenance;
