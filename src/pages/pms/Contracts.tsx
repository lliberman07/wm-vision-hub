import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePMS } from '@/contexts/PMSContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Eye, FileText, CheckCircle2, FileEdit, AlertCircle, Clock, X, RefreshCw, Wrench, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ContractForm } from '@/components/pms/ContractForm';
import { ContractPaymentDistribution } from '@/components/pms/ContractPaymentDistribution';
import { ContractAdjustments } from '@/components/pms/ContractAdjustments';
import { ContractMonthlyProjections } from '@/components/pms/ContractMonthlyProjections';
import { CancelContractDialog } from '@/components/pms/CancelContractDialog';
import { ActivateContractDialog } from '@/components/pms/ActivateContractDialog';
import { ExtendContractDialog } from '@/components/pms/ExtendContractDialog';
import { RenewContractDialog } from '@/components/pms/RenewContractDialog';
import { PaymentCalendar } from '@/components/pms/PaymentCalendar';
import { PMSLayout } from '@/components/pms/PMSLayout';
import { FilterBar } from '@/components/pms/FilterBar';
import { EmptyState } from '@/components/pms/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { format, differenceInDays } from 'date-fns';
import { parseDateFromDB } from '@/utils/dateUtils';
interface Contract {
  id: string;
  contract_number: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  currency: string;
  status: string;
  pdf_url?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  base_contract_number?: string | null;
  renewal_count?: number;
  parent_contract_id?: string | null;
  is_renewal?: boolean;
  tenant_renter_id?: string;
  tenant_name?: string;
  tenant_email?: string;
  tenant_document?: string;
  tenant_type?: string;
  has_pending_maintenance?: boolean;
  has_overdue_payments?: boolean;
}
const Contracts = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    currentTenant,
    hasPMSAccess
  } = usePMS();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | undefined>();
  useEffect(() => {
    if (!user || !hasPMSAccess) {
      navigate('/pms');
      return;
    }
    fetchContracts();
  }, [user, hasPMSAccess, navigate]);
  const fetchContracts = async () => {
    try {
      // Verificar contratos vencidos primero
      await supabase.rpc('check_expired_contracts');

      // Actualizar items vencidos
      await supabase.rpc('update_overdue_payment_items');
      const {
        data,
        error
      } = await supabase.from('pms_contracts').select(`
          *,
          pms_properties!inner(
            id,
            code,
            address
          ),
          pms_tenants_renters!inner(
            id,
            full_name,
            email,
            document_number,
            tenant_type
          )
        `).order('created_at', {
        ascending: false
      });
      if (error) throw error;

      // Obtener alertas para contratos activos
      const activeContracts = (data || []).filter((c: any) => c.status === 'active');
      const contractIds = activeContracts.map((c: any) => c.id);

      // Verificar mantenimientos pendientes
      const { data: maintenanceData } = await supabase
        .from('pms_maintenance_requests')
        .select('contract_id')
        .in('contract_id', contractIds)
        .neq('status', 'completed');

      const contractsWithMaintenance = new Set(
        maintenanceData?.map(m => m.contract_id) || []
      );

      // Verificar pagos vencidos
      const { data: overdueData } = await supabase
        .from('pms_payment_schedule_items')
        .select('contract_id, expected_amount')
        .in('contract_id', contractIds)
        .eq('status', 'overdue');

      const contractsWithOverdue = new Set<string>();
      overdueData?.forEach(item => {
        if (item.expected_amount > 0) {
          contractsWithOverdue.add(item.contract_id);
        }
      });

      // Mapear datos del inquilino y alertas
      const mappedContracts = (data || []).map((contract: any) => ({
        ...contract,
        tenant_name: contract.pms_tenants_renters?.full_name,
        tenant_email: contract.pms_tenants_renters?.email,
        tenant_document: contract.pms_tenants_renters?.document_number,
        tenant_type: contract.pms_tenants_renters?.tenant_type,
        has_pending_maintenance: contractsWithMaintenance.has(contract.id),
        has_overdue_payments: contractsWithOverdue.has(contract.id)
      }));
      setContracts(mappedContracts);
    } catch (error: any) {
      toast.error('Error al cargar contratos', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtros combinados
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Métricas del dashboard
  const metrics = {
    active: contracts.filter(c => c.status === 'active').length,
    draft: contracts.filter(c => c.status === 'draft').length,
    expiringSoon: contracts.filter(c => c.status === 'active' && differenceInDays(new Date(c.end_date), new Date()) <= 30 && differenceInDays(new Date(c.end_date), new Date()) >= 0).length,
    expired: contracts.filter(c => c.status === 'expired').length
  };
  const fetchContractOwners = async (propertyId: string) => {
    const {
      data
    } = await supabase.from('pms_owner_properties').select(`
        share_percent,
        pms_owners!inner(id, full_name)
      `).eq('property_id', propertyId).is('end_date', null);
    return data?.map(op => ({
      name: op.pms_owners.full_name,
      percentage: op.share_percent
    })) || [];
  };
  const [contractOwners, setContractOwners] = useState<any[]>([]);
  useEffect(() => {
    if (selectedContract && isViewOpen) {
      fetchContractOwners((selectedContract as any).property_id).then(setContractOwners);
    }
  }, [selectedContract, isViewOpen]);
  const getStatusBadge = (status: string) => {
    const configs: Record<string, {
      variant: 'default' | 'secondary' | 'destructive' | 'outline';
      label: string;
      icon: any;
    }> = {
      active: {
        variant: 'default',
        label: 'Activo',
        icon: CheckCircle2
      },
      draft: {
        variant: 'secondary',
        label: 'Borrador',
        icon: FileEdit
      },
      expired: {
        variant: 'outline',
        label: 'Vencido',
        icon: Clock
      },
      cancelled: {
        variant: 'destructive',
        label: 'Cancelado',
        icon: X
      }
    };
    const config = configs[status] || {
      variant: 'outline' as const,
      label: status,
      icon: AlertCircle
    };
    const Icon = config.icon;
    return <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>;
  };
  const getAlertBadges = (contract: any) => {
    const icons = [];

    // Mantenimiento pendiente (solo para contratos activos)
    if (contract.status === 'active' && contract.has_pending_maintenance) {
      icons.push(
        <div key="maintenance" className="inline-flex" title="Solicitud de mantenimiento pendiente">
          <Wrench className="h-5 w-5 text-blue-500" />
        </div>
      );
    }

    // Pagos vencidos (solo para contratos activos)
    if (contract.status === 'active' && contract.has_overdue_payments) {
      icons.push(
        <div key="overdue" className="inline-flex" title="Pagos vencidos">
          <DollarSign className="h-5 w-5 text-red-500" />
        </div>
      );
    }

    return icons;
  };
  const handleActivate = () => {
    setIsActivateOpen(false);
    fetchContracts();
  };
  const handleExtend = () => {
    setIsExtendOpen(false);
    fetchContracts();
  };
  const handleRenewal = () => {
    setIsRenewOpen(false);
    fetchContracts();
  };
  return <PMSLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Contratos</h1>
              <p className="text-muted-foreground mt-1">
                {filteredContracts.length} {filteredContracts.length === 1 ? 'contrato registrado' : 'contratos registrados'}
              </p>
            </div>
            <Button onClick={() => {
            setSelectedContract(undefined);
            setIsFormOpen(true);
          }} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Contrato
            </Button>
          </div>
        </div>

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('active')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Activos</p>
                  <h3 className="text-2xl font-bold mt-1">{metrics.active}</h3>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('draft')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Borradores</p>
                  <h3 className="text-2xl font-bold mt-1">{metrics.draft}</h3>
                </div>
                <FileEdit className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Por Vencer (30d)</p>
                  <h3 className="text-2xl font-bold mt-1">{metrics.expiringSoon}</h3>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('expired')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vencidos</p>
                  <h3 className="text-2xl font-bold mt-1">{metrics.expired}</h3>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <FilterBar searchTerm={searchTerm} onSearchChange={setSearchTerm} filters={[{
        key: 'status',
        label: 'Estado',
        value: statusFilter,
        options: [{
          value: 'draft',
          label: 'Borradores'
        }, {
          value: 'active',
          label: 'Activos'
        }, {
          value: 'expired',
          label: 'Vencidos'
        }, {
          value: 'cancelled',
          label: 'Cancelados'
        }]
      }]} onFilterChange={(key, value) => {
        if (key === 'status') setStatusFilter(value);
      }} onClearFilters={() => {
        setSearchTerm('');
        setStatusFilter('all');
      }} activeFiltersCount={statusFilter !== 'all' ? 1 : 0} />

        {/* Contracts Table */}
        <Card className="mt-6">
          <CardContent className="p-6">
            {loading ? <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div> : filteredContracts.length === 0 ? <EmptyState icon={FileEdit} title="No hay contratos" description="Comienza creando tu primer contrato" actionLabel="Nuevo Contrato" onAction={() => {
            setSelectedContract(undefined);
            setIsFormOpen(true);
          }} /> : <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Propiedad</TableHead>
                    <TableHead>Inquilino</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Renta</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Alertas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract: any) => <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {contract.contract_number}
                          {contract.is_renewal && <Badge variant="outline" className="text-xs">
                              R{contract.renewal_count}
                            </Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{contract.pms_properties.code}</p>
                          <p className="text-sm text-muted-foreground">{contract.pms_properties.address}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{contract.tenant_name || '-'}</p>
                          <p className="text-sm text-muted-foreground">{contract.tenant_document || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(parseDateFromDB(contract.start_date), 'dd/MM/yyyy')}</p>
                          <p className="text-muted-foreground">
                            → {format(parseDateFromDB(contract.end_date), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {contract.currency} {contract.monthly_rent.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(contract.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getAlertBadges(contract)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {contract.status === 'draft' && <>
                              <Button variant="outline" size="sm" onClick={() => {
                        setSelectedContract(contract);
                        setIsFormOpen(true);
                      }} className="min-w-[110px] justify-center">
                                <FileEdit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                              <Button variant="default" size="sm" onClick={() => {
                        setSelectedContract(contract);
                        setIsActivateOpen(true);
                      }} className="min-w-[110px] justify-center">
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Activar
                              </Button>
                            </>}
                          {contract.status === 'expired' && <Button variant="outline" size="sm" onClick={() => {
                      setSelectedContract(contract);
                      setIsExtendOpen(true);
                    }} className="min-w-[110px] justify-center">
                              <Clock className="h-4 w-4 mr-1" />
                              Extender
                            </Button>}
                          {(contract.status === 'active' || contract.status === 'expired') && <Button variant="outline" size="sm" onClick={() => {
                      setSelectedContract(contract);
                      setIsRenewOpen(true);
                    }} className="min-w-[110px] justify-center gap-1">
                              <RefreshCw className="h-4 w-4" />
                              Renovación
                            </Button>}
                          {contract.status === 'active' && <Button variant="outline" size="sm" onClick={() => {
                      setSelectedContract(contract);
                      setIsCancelOpen(true);
                    }} className="min-w-[110px] justify-center">
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>}
                          <Button variant="outline" size="sm" onClick={() => {
                      setSelectedContract(contract);
                      setIsViewOpen(true);
                    }} className="min-w-[110px] justify-center">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          {contract.pdf_url && <Button variant="ghost" size="sm" asChild>
                              <a href={contract.pdf_url} target="_blank" rel="noopener noreferrer">
                                <FileText className="h-4 w-4" />
                              </a>
                            </Button>}
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>}
          </CardContent>
        </Card>

        {/* Contract Form Dialog */}
        <ContractForm open={isFormOpen} onOpenChange={setIsFormOpen} onSuccess={() => {
        setIsFormOpen(false);
        fetchContracts();
      }} contract={selectedContract} />

        {/* Activate Contract Dialog */}
        {selectedContract && <ActivateContractDialog contractId={selectedContract.id} contractNumber={selectedContract.contract_number} open={isActivateOpen} onOpenChange={setIsActivateOpen} onSuccess={handleActivate} />}

        {/* Extend Contract Dialog */}
        {selectedContract && <ExtendContractDialog contractId={selectedContract.id} contractNumber={selectedContract.contract_number} currentEndDate={selectedContract.end_date} open={isExtendOpen} onOpenChange={setIsExtendOpen} onSuccess={handleExtend} />}

        {/* Renew Contract Dialog */}
        {selectedContract && <RenewContractDialog open={isRenewOpen} onOpenChange={setIsRenewOpen} onSuccess={handleRenewal} contract={selectedContract} />}

        {/* Cancel Contract Dialog */}
        {selectedContract && <CancelContractDialog contract={selectedContract} open={isCancelOpen} onOpenChange={setIsCancelOpen} onSuccess={() => {
        setIsCancelOpen(false);
        fetchContracts();
      }} />}

        {/* View Contract Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Detalles del Contrato {selectedContract?.contract_number}</DialogTitle>
              <DialogDescription>
                Información completa del contrato
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="details">Detalles</TabsTrigger>
                <TabsTrigger value="calendar">Calendario Pagos</TabsTrigger>
                <TabsTrigger value="projections">Proyecciones</TabsTrigger>
                <TabsTrigger value="distribution">Distribución</TabsTrigger>
                <TabsTrigger value="adjustments">Ajustes</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 max-h-[60vh] overflow-y-auto">
                {selectedContract && <div className="space-y-6">
                    {/* Información del Inquilino */}
                    {selectedContract.tenant_name && <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Inquilino
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Nombre Completo</p>
                            <p className="font-medium">{selectedContract.tenant_name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="font-medium text-sm">{selectedContract.tenant_email || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Documento</p>
                            <p className="font-medium">{selectedContract.tenant_document || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Tipo</p>
                            <Badge variant="outline">{selectedContract.tenant_type || '-'}</Badge>
                          </div>
                        </div>
                      </div>}

                    {/* Información del Contrato */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Número de Contrato</p>
                        <p className="text-lg">{selectedContract.contract_number}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Estado</p>
                        <div className="mt-1">{getStatusBadge(selectedContract.status)}</div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Fecha Inicio</p>
                        <p className="text-lg">{format(parseDateFromDB(selectedContract.start_date), 'dd/MM/yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Fecha Fin</p>
                        <p className="text-lg">{format(parseDateFromDB(selectedContract.end_date), 'dd/MM/yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Renta Mensual</p>
                        <p className="text-lg">{selectedContract.currency} {selectedContract.monthly_rent.toLocaleString()}</p>
                      </div>
                      {contractOwners.length > 0 && <div className="col-span-2">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Propietarios</p>
                          <div className="flex flex-wrap gap-2">
                            {contractOwners.map((owner, idx) => <Badge key={idx} variant="secondary">
                                {owner.name} ({owner.percentage}%)
                              </Badge>)}
                          </div>
                        </div>}
                    </div>
                  </div>}
              </TabsContent>

              <TabsContent value="calendar" className="max-h-[60vh] overflow-y-auto">
                {selectedContract && selectedContract.status === 'active' ? <PaymentCalendar contractId={selectedContract.id} currency={selectedContract.currency} /> : <div className="text-center py-8 text-muted-foreground">
                    El calendario de pagos solo está disponible para contratos activos
                  </div>}
              </TabsContent>

              <TabsContent value="projections" className="max-h-[60vh] overflow-y-auto">
                {selectedContract && <ContractMonthlyProjections contractId={selectedContract.id} currency={selectedContract.currency} />}
              </TabsContent>

              <TabsContent value="distribution" className="max-h-[60vh] overflow-y-auto">
                {selectedContract && <ContractPaymentDistribution contractId={selectedContract.id} propertyId={(selectedContract as any).property_id} monto_a={(selectedContract as any).monto_a} monto_b={(selectedContract as any).monto_b} currency={selectedContract.currency} />}
              </TabsContent>

              <TabsContent value="adjustments" className="max-h-[60vh] overflow-y-auto">
                {selectedContract && <ContractAdjustments contractId={selectedContract.id} />}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </PMSLayout>;
};
export default Contracts;