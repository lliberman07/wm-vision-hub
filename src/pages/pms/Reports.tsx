import { useNavigate } from 'react-router-dom';
import { parseISO, format } from 'date-fns';
import { usePMS } from '@/contexts/PMSContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { TrendingUp, Building2, Users, FileText, DollarSign, RefreshCw, Calendar, MapPin, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PMSLayout } from '@/components/pms/PMSLayout';
import { OwnerNetIncomeReport } from '@/components/pms/OwnerNetIncomeReport';
import { PropertyExpensesReport } from '@/components/pms/PropertyExpensesReport';
import { toast } from 'sonner';

const Reports = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTenant, hasPMSAccess, userRole } = usePMS();
  const [propertiesWithContracts, setPropertiesWithContracts] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [cashflowData, setCashflowData] = useState<any[]>([]);
  const [recalculating, setRecalculating] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeContracts: 0,
    activeTenants: 0,
    monthlyIncome: 0,
  });

  useEffect(() => {
    if (!user || !hasPMSAccess) {
      navigate('/pms');
    } else if (currentTenant?.id) {
      fetchData();
    }
  }, [user, hasPMSAccess, navigate, currentTenant]);

  useEffect(() => {
    if (currentTenant?.id && selectedContract) {
      fetchCashflow();
    }
  }, [selectedContract, currentTenant]);

  const fetchData = async () => {
    if (!currentTenant?.id) return;
    
    try {
      // Determinar si es SUPERADMIN
      const isSuperAdmin = userRole === 'SUPERADMIN';

      // Fetch properties with their contracts
      let propertiesQuery = supabase
        .from('pms_properties')
        .select('id, code, address, alias, city')
        .order('code');

      // Solo filtrar por tenant si NO es SUPERADMIN
      if (!isSuperAdmin) {
        propertiesQuery = propertiesQuery.eq('tenant_id', currentTenant.id);
      }

      const { data: properties, error: propsError } = await propertiesQuery;

      if (propsError) throw propsError;

      // For each property, fetch its contracts and expenses without contract
      const propertiesData = await Promise.all(
        (properties || []).map(async (property) => {
          const { data: contracts, error: contractsError } = await supabase
            .from('pms_contracts')
            .select(`
              id,
              contract_number,
              status,
              start_date,
              end_date,
              monthly_rent,
              currency,
              pms_tenants_renters!inner(full_name)
            `)
            .eq('property_id', property.id)
            .in('status', ['active', 'expired', 'cancelled'])
            .order('start_date', { ascending: false });

          if (contractsError) {
            console.error('Error fetching contracts:', contractsError);
          }

          // Count expenses without contract
          const { count: expensesCount } = await supabase
            .from('pms_expenses')
            .select('*', { count: 'exact', head: true })
            .eq('property_id', property.id)
            .is('contract_id', null)
            .neq('status', 'rejected');

          return { 
            ...property, 
            contracts: contracts || [],
            expenses_without_contract: expensesCount || 0
          };
        })
      );

      setPropertiesWithContracts(propertiesData);

      // Fetch stats con filtrado condicional
      const today = new Date().toISOString().split('T')[0];
      
      // Construir consultas con filtrado condicional
      let contractsQuery = supabase
        .from('pms_contracts')
        .select('id')
        .eq('status', 'active');
      
      let tenantsQuery = supabase
        .from('pms_tenants_renters')
        .select(`
          id,
          pms_contracts!inner(
            id,
            status,
            start_date,
            end_date
          )
        `)
        .eq('pms_contracts.status', 'active')
        .lte('pms_contracts.start_date', today)
        .gte('pms_contracts.end_date', today);
      
      let paymentsQuery = supabase
        .from('pms_payments')
        .select('paid_amount')
        .eq('status', 'paid')
        .gte('paid_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
        .lte('paid_date', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]);

      // Solo filtrar por tenant si NO es SUPERADMIN
      if (!isSuperAdmin) {
        contractsQuery = contractsQuery.eq('tenant_id', currentTenant.id);
        tenantsQuery = tenantsQuery.eq('tenant_id', currentTenant.id);
        paymentsQuery = paymentsQuery.eq('tenant_id', currentTenant.id);
      }

      const [contractsRes, tenantsRes, paymentsRes] = await Promise.all([
        contractsQuery,
        tenantsQuery,
        paymentsQuery,
      ]);

      const totalIncome = paymentsRes.data?.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0) || 0;

      setStats({
        totalProperties: properties?.length || 0,
        activeContracts: contractsRes.data?.length || 0,
        activeTenants: tenantsRes.data?.length || 0,
        monthlyIncome: totalIncome,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };


  const fetchCashflow = async () => {
    if (!currentTenant?.id || !selectedContract) return;
    
    try {
      const { data, error } = await supabase
        .from('pms_cashflow_property')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('contract_id', selectedContract)
        .order('period', { ascending: false })
        .limit(12);

      if (error) throw error;
      setCashflowData(data || []);
    } catch (error) {
      console.error('Error fetching cashflow:', error);
      setCashflowData([]);
    }
  };

  const handleSelectContract = (contractId: string, property: any) => {
    setSelectedContract(contractId);
    setSelectedProperty(property);
    setViewMode('detail');
  };

  const handleSelectPropertyWithoutContract = (property: any) => {
    setSelectedContract(null);
    setSelectedProperty(property);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedContract(null);
    setSelectedProperty(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'expired':
        return 'Vencido';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const handleRecalculateCashflow = async () => {
    try {
      setRecalculating(true);
      toast.info('Limpiando pagos duplicados...');

      // Primero limpiar pagos huérfanos (duplicados)
      const { data: cleanupResult, error: cleanupError } = await supabase.rpc('cleanup_orphan_payments');
      
      if (cleanupError) {
        console.error('Error cleaning up orphan payments:', cleanupError);
        throw cleanupError;
      }

      const deletedCount = cleanupResult?.[0]?.deleted_count || 0;
      if (deletedCount > 0) {
        toast.success(`${deletedCount} pagos duplicados eliminados`);
      }

      toast.info('Vinculando pagos existentes...');

      // Vincular pagos existentes de todos los contratos activos
      const { data: contracts, error: contractsError } = await supabase
        .from('pms_contracts')
        .select('id')
        .eq('tenant_id', currentTenant?.id)
        .in('status', ['active', 'expired', 'cancelled']);

      if (contractsError) throw contractsError;

      // Vincular pagos para cada contrato
      for (const contract of contracts || []) {
        const { error: linkError } = await supabase.rpc('link_existing_payments_to_schedule', {
          contract_id_param: contract.id
        });
        if (linkError) console.error('Error linking payments for contract:', contract.id, linkError);
      }

      toast.info('Recalculando flujo de caja...');

      const { error } = await supabase.rpc('recalculate_all_cashflow');

      if (error) throw error;

      toast.success('Flujo de caja recalculado exitosamente');
      
      // Forzar recarga de datos
      await fetchData();
      if (selectedContract) {
        await fetchCashflow();
      }
      
      // Forzar refresh de la página para mostrar datos actualizados
      window.location.reload();
    } catch (error: any) {
      console.error('Error recalculating cashflow:', error);
      toast.error('Error al recalcular flujo de caja', {
        description: error.message,
      });
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <PMSLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">{currentTenant?.name}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Propiedades Totales
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProperties}</div>
              <p className="text-xs text-muted-foreground">
                En el sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Contratos Activos
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeContracts}</div>
              <p className="text-xs text-muted-foreground">
                En vigencia
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Inquilinos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeTenants}</div>
              <p className="text-xs text-muted-foreground">
                Activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ingresos Cobrados
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.monthlyIncome.toLocaleString('es-AR')}
              </div>
              <p className="text-xs text-muted-foreground">
                Histórico
              </p>
            </CardContent>
          </Card>
        </div>

        {viewMode === 'list' ? (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Propiedades y Contratos</h2>
                <p className="text-muted-foreground">Seleccione un contrato para ver el reporte detallado</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecalculateCashflow}
                disabled={recalculating}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
                {recalculating ? 'Recalculando...' : 'Recalcular Totales'}
              </Button>
            </div>

            {propertiesWithContracts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay propiedades registradas</p>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="single" collapsible className="space-y-4">
                {propertiesWithContracts.map((property) => (
                  <AccordionItem 
                    key={property.id} 
                    value={property.id}
                    className="border rounded-lg bg-card"
                  >
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <div className="flex items-center gap-4 text-left w-full">
                        <Building2 className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {property.alias || property.code}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4" />
                            <span>{property.address}, {property.city}</span>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {property.contracts?.length > 0 
                            ? `${property.contracts.length} contrato(s)` 
                            : property.expenses_without_contract > 0
                              ? `Sin contrato - ${property.expenses_without_contract} gasto(s)`
                              : 'Sin actividad'
                          }
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      {property.contracts?.length === 0 && property.expenses_without_contract > 0 ? (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPropertyWithoutContract(property);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Ver Reporte de Gastos
                        </Button>
                      ) : property.contracts?.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No hay contratos ni gastos registrados para esta propiedad</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {property.contracts.map((contract: any) => (
                            <Card 
                              key={contract.id}
                              className="cursor-pointer transition-all hover:shadow-md"
                              onClick={() => handleSelectContract(contract.id, property)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                      <FileText className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-semibold">
                                        {contract.contract_number}
                                      </span>
                                      <Badge className={getStatusColor(contract.status)}>
                                        {getStatusLabel(contract.status)}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Users className="h-4 w-4" />
                                      <span>{contract.pms_tenants_renters.full_name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>{format(parseISO(contract.start_date), 'dd/MM/yyyy')}</span>
                                        <span className="text-muted-foreground">→</span>
                                        <span>{format(parseISO(contract.end_date), 'dd/MM/yyyy')}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">
                                          {contract.currency} ${Number(contract.monthly_rent || 0).toLocaleString('es-AR')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <Button 
              variant="ghost" 
              onClick={handleBackToList}
              className="mb-4"
            >
              <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
              Volver al listado
            </Button>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <CardTitle className="text-2xl">
                      {selectedProperty?.alias || selectedProperty?.code}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4" />
                      {selectedProperty?.address}, {selectedProperty?.city}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {!selectedContract && selectedProperty?.expenses_without_contract > 0 && (
              <PropertyExpensesReport 
                propertyId={selectedProperty.id}
                tenantId={currentTenant.id}
              />
            )}

            {selectedContract && (
              <>
                <Card>
                  <CardContent className="pt-6">
                    {selectedProperty?.contracts
                      ?.filter((c: any) => c.id === selectedContract)
                      .map((contract: any) => (
                        <div key={contract.id} className="space-y-3">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <span className="font-semibold text-lg">{contract.contract_number}</span>
                            <Badge className={getStatusColor(contract.status)}>
                              {getStatusLabel(contract.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{contract.pms_tenants_renters.full_name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{format(parseISO(contract.start_date), 'dd/MM/yyyy')}</span>
                              <span className="text-muted-foreground">→</span>
                              <span>{format(parseISO(contract.end_date), 'dd/MM/yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {contract.currency} ${Number(contract.monthly_rent || 0).toLocaleString('es-AR')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Flujo de Caja del Contrato
                    </CardTitle>
                    <CardDescription>Últimos 12 meses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {cashflowData.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <p>No hay datos de flujo de caja disponibles</p>
                        <p className="text-sm mt-2">
                          Los datos se generan automáticamente cuando se registran pagos y gastos
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Período</TableHead>
                            <TableHead>Moneda</TableHead>
                            <TableHead className="text-right">Ingresos</TableHead>
                            <TableHead className="text-right">Gastos</TableHead>
                            <TableHead className="text-right">Resultado Neto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cashflowData.map((cf) => (
                            <TableRow key={cf.id}>
                              <TableCell className="font-medium">{cf.period}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{cf.currency}</Badge>
                              </TableCell>
                              <TableCell className="text-right text-green-600 font-medium">
                                ${Number(cf.total_income || 0).toLocaleString('es-AR', {
                                  minimumFractionDigits: 2,
                                })}
                              </TableCell>
                              <TableCell className="text-right text-red-600">
                                ${Number(cf.total_expenses || 0).toLocaleString('es-AR', {
                                  minimumFractionDigits: 2,
                                })}
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                <Badge variant={Number(cf.net_result) >= 0 ? 'default' : 'destructive'}>
                                  ${Number(cf.net_result || 0).toLocaleString('es-AR', {
                                    minimumFractionDigits: 2,
                                  })}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                <OwnerNetIncomeReport 
                  tenantId={currentTenant?.id || ''} 
                  selectedContract={selectedContract}
                />
              </>
            )}
          </div>
        )}
      </div>
    </PMSLayout>
  );
};

export default Reports;
