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
import { Plus, Eye, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ContractForm } from '@/components/pms/ContractForm';
import { ContractPaymentDistribution } from '@/components/pms/ContractPaymentDistribution';
import { ContractAdjustments } from '@/components/pms/ContractAdjustments';
import { ContractMonthlyProjections } from '@/components/pms/ContractMonthlyProjections';
import { CancelContractDialog } from '@/components/pms/CancelContractDialog';
import { PMSLayout } from '@/components/pms/PMSLayout';
import { FilterBar } from '@/components/pms/FilterBar';
import { EmptyState } from '@/components/pms/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
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
}

const Contracts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTenant, hasPMSAccess } = usePMS();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
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
      const { data, error } = await supabase
        .from('pms_contracts')
        .select(`
          *,
          pms_properties!inner(
            id,
            code,
            address
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error: any) {
      toast.error('Error al cargar contratos', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = contracts.filter(contract =>
    contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchContractOwners = async (propertyId: string) => {
    const { data } = await supabase
      .from('pms_owner_properties')
      .select(`
        share_percent,
        pms_owners!inner(id, full_name)
      `)
      .eq('property_id', propertyId)
      .is('end_date', null);
    
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
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      draft: 'secondary',
      expired: 'destructive',
      cancelled: 'destructive',
    };
    const labels: Record<string, string> = {
      active: 'Activo',
      draft: 'Borrador',
      expired: 'Vencido',
      cancelled: 'Cancelado',
    };
    return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>;
  };

  return (
    <PMSLayout>
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
            <Button onClick={() => { setSelectedContract(undefined); setIsFormOpen(true); }} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Contrato
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-6">
          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

        {/* Content */}
        <Card className="card-elevated">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 mb-4">
                    <Skeleton className="h-12 w-12" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredContracts.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No hay contratos registrados"
                description="Comienza agregando tu primer contrato de alquiler"
                actionLabel="+ Nuevo Contrato"
                onAction={() => { setSelectedContract(undefined); setIsFormOpen(true); }}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Fecha Inicio</TableHead>
                      <TableHead>Fecha Fin</TableHead>
                      <TableHead>Renta Mensual</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.map((contract) => (
                      <TableRow key={contract.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono">{contract.contract_number}</TableCell>
                        <TableCell>{parseDateFromDB(contract.start_date).toLocaleDateString()}</TableCell>
                        <TableCell>{parseDateFromDB(contract.end_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {contract.currency} {contract.monthly_rent?.toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(contract.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {contract.pdf_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(contract.pdf_url!, '_blank')}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedContract(contract);
                                setIsViewOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedContract(contract);
                                setIsFormOpen(true);
                              }}
                            >
                              Editar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Dialog */}
        <ContractForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSuccess={fetchContracts}
          contract={selectedContract}
        />

        {/* Cancel Contract Dialog */}
        <CancelContractDialog
          open={isCancelOpen}
          onOpenChange={setIsCancelOpen}
          contract={selectedContract}
          onSuccess={() => {
            fetchContracts();
            setIsCancelOpen(false);
          }}
        />

        {/* View Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Detalles del Contrato</DialogTitle>
              <DialogDescription>
                Contrato #{selectedContract?.contract_number}
              </DialogDescription>
            </DialogHeader>
            {selectedContract && (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Detalles</TabsTrigger>
                  <TabsTrigger value="projection">Proyección</TabsTrigger>
                  <TabsTrigger value="payments">Métodos de Pago</TabsTrigger>
                  <TabsTrigger value="adjustments">Ajustes</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha Inicio</p>
                      <p className="font-medium">
                        {parseDateFromDB(selectedContract.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha Fin</p>
                      <p className="font-medium">
                        {parseDateFromDB(selectedContract.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Renta Mensual</p>
                      <p className="font-medium">
                        {selectedContract.currency} {selectedContract.monthly_rent?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado</p>
                      {getStatusBadge(selectedContract.status)}
                    </div>
                    
                    {selectedContract.status === 'cancelled' && selectedContract.cancelled_at && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Fecha de Cancelación</p>
                          <p className="font-medium text-destructive">
                            {format(new Date(selectedContract.cancelled_at), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">Motivo de Cancelación</p>
                          <p className="font-medium">{selectedContract.cancellation_reason}</p>
                        </div>
                      </>
                    )}
                    
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-2">Propietarios</p>
                      <div className="flex flex-wrap gap-2">
                        {contractOwners.map((owner, idx) => (
                          <Badge key={idx} variant="secondary">
                            {owner.name} ({owner.percentage}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {selectedContract.status === 'active' && (
                      <div className="col-span-2 pt-4 border-t">
                        <Button 
                          variant="destructive" 
                          onClick={() => {
                            setIsCancelOpen(true);
                            setIsViewOpen(false);
                          }}
                        >
                          Cancelar Contrato
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="projection" className="py-4">
                  <ContractMonthlyProjections 
                    contractId={selectedContract.id}
                    currency={selectedContract.currency || 'ARS'}
                  />
                </TabsContent>

                <TabsContent value="payments">
                  <ContractPaymentDistribution
                    contractId={selectedContract.id}
                    propertyId={(selectedContract as any).property_id}
                    monto_a={(selectedContract as any).monto_a}
                    monto_b={(selectedContract as any).monto_b}
                    monto_ajustado_actual_a={(selectedContract as any).monto_ajustado_actual_a}
                    monto_ajustado_actual_b={(selectedContract as any).monto_ajustado_actual_b}
                    forma_pago_item_a={(selectedContract as any).forma_pago_item_a}
                    forma_pago_item_b={(selectedContract as any).forma_pago_item_b}
                    currency={selectedContract.currency}
                  />
                </TabsContent>

                <TabsContent value="adjustments">
                  <ContractAdjustments contractId={selectedContract.id} />
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PMSLayout>
  );
};

export default Contracts;
