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
import { ContractPaymentMethods } from '@/components/pms/ContractPaymentMethods';
import { ContractAdjustments } from '@/components/pms/ContractAdjustments';
import { PMSLayout } from '@/components/pms/PMSLayout';
import { FilterBar } from '@/components/pms/FilterBar';
import { EmptyState } from '@/components/pms/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

interface Contract {
  id: string;
  contract_number: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  currency: string;
  status: string;
  pdf_url?: string;
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
        .select('*')
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      draft: 'secondary',
      expired: 'destructive',
      cancelled: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
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
                        <TableCell>{new Date(contract.start_date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(contract.end_date).toLocaleDateString()}</TableCell>
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
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Detalles</TabsTrigger>
                  <TabsTrigger value="payments">Métodos de Pago</TabsTrigger>
                  <TabsTrigger value="adjustments">Ajustes</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha Inicio</p>
                      <p className="font-medium">
                        {new Date(selectedContract.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha Fin</p>
                      <p className="font-medium">
                        {new Date(selectedContract.end_date).toLocaleDateString()}
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
                  </div>
                </TabsContent>

                <TabsContent value="payments">
                  <ContractPaymentMethods contractId={selectedContract.id} />
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
