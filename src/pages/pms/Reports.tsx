import { useNavigate } from 'react-router-dom';
import { parseISO, format } from 'date-fns';
import { usePMS } from '@/contexts/PMSContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Building2, Users, FileText, DollarSign, Calendar, MapPin, ChevronRight, Receipt, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PMSLayout } from '@/components/pms/PMSLayout';
import { OwnerNetIncomeReport } from '@/components/pms/OwnerNetIncomeReport';
import { PropertyExpensesReport } from '@/components/pms/PropertyExpensesReport';
import { ReimbursementDashboard } from '@/components/pms/ReimbursementDashboard';
import { OwnerReportExportDialog } from '@/components/pms/OwnerReportExportDialog';
import { OwnerReportDirectDownload } from '@/components/pms/OwnerReportDirectDownload';
import { Download, Mail } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Reports = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTenant, hasPMSAccess, userRole } = usePMS();
  const [propertiesWithContracts, setPropertiesWithContracts] = useState<{
    withContracts: any[];
    withoutContracts: any[];
  }>({ withContracts: [], withoutContracts: [] });
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [cashflowData, setCashflowData] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeContracts: 0,
    activeTenants: 0,
    monthlyIncome: 0,
  });
  const [activeTab, setActiveTab] = useState<'properties' | 'reimbursements'>('properties');
  const [cashflowViewMode, setCashflowViewMode] = useState<'accrual' | 'cash'>('cash');

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
  }, [selectedContract, currentTenant, cashflowViewMode]);

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

      // Separar propiedades con contratos y sin contratos
      const propertiesWithActiveContracts = propertiesData.filter(p => 
        p.contracts && p.contracts.length > 0
      );

      const propertiesWithoutContracts = propertiesData.filter(p => 
        !p.contracts || p.contracts.length === 0
      );

      setPropertiesWithContracts({
        withContracts: propertiesWithActiveContracts,
        withoutContracts: propertiesWithoutContracts
      });

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
      if (cashflowViewMode === 'accrual') {
        // Modo devengamiento: Usar pms_cashflow_property
        const { data, error } = await supabase
          .from('pms_cashflow_property')
          .select('*')
          .eq('tenant_id', currentTenant.id)
          .eq('contract_id', selectedContract)
          .order('period', { ascending: false })
          .limit(12);

        if (error) throw error;
        setCashflowData(data || []);
      } else {
        // Modo cobro: Construir cashflow desde pagos y gastos
        // 1. Obtener todos los schedule items pagados
        const { data: scheduleItems, error: itemsError } = await supabase
          .from('pms_payment_schedule_items')
          .select('id, period_date, item, expected_amount, status, expense_id')
          .eq('contract_id', selectedContract)
          .eq('status', 'paid');

        if (itemsError) throw itemsError;

        // 2. Obtener pagos
        const scheduleItemIds = scheduleItems?.map(item => item.id) || [];
        const { data: payments, error: paymentsError } = await supabase
          .from('pms_payments')
          .select('id, schedule_item_id, paid_date, paid_amount, currency, contract_currency, exchange_rate')
          .in('schedule_item_id', scheduleItemIds)
          .order('paid_date', { ascending: false });

        if (paymentsError) throw paymentsError;

        // 3. Obtener gastos CON currency
        const { data: expenses, error: expensesError } = await supabase
          .from('pms_expenses')
          .select('id, amount, expense_date, is_reimbursable, currency')
          .eq('contract_id', selectedContract)
          .order('expense_date', { ascending: false });

        if (expensesError) throw expensesError;

        // 4. Obtener info del contrato para currency
        const { data: contractInfo } = await supabase
          .from('pms_contracts')
          .select('currency')
          .eq('id', selectedContract)
          .single();

        // 5. Agrupar por mes de cobro - ESTRUCTURA MULTI-MONEDA
        interface CashflowPeriod {
          flows: Record<string, { income: number; expenses: number; net: number }>;
          contract_currency: string;
        }
        
        const cashflowByMonth: Record<string, CashflowPeriod> = {};

        // Procesar pagos - AGRUPAR POR MONEDA REAL DEL PAGO
        scheduleItems?.forEach((item: any) => {
          const itemPayments = payments?.filter(p => p.schedule_item_id === item.id) || [];
          
          itemPayments.forEach((payment: any) => {
            const period = payment.paid_date.substring(0, 7); // YYYY-MM
            const currency = payment.currency || contractInfo?.currency || 'ARS';
            
            if (!cashflowByMonth[period]) {
              cashflowByMonth[period] = {
                flows: {},
                contract_currency: contractInfo?.currency || 'ARS'
              };
            }
            
            if (!cashflowByMonth[period].flows[currency]) {
              cashflowByMonth[period].flows[currency] = { income: 0, expenses: 0, net: 0 };
            }
            
            // Solo sumar ingresos regulares (no reembolsos)
            // USAR MONEDA ORIGINAL (sin conversión)
            if (!item.expense_id) {
              cashflowByMonth[period].flows[currency].income += Number(payment.paid_amount || 0);
            }
          });
        });

        // Procesar gastos - AGRUPAR POR MONEDA REAL DEL GASTO
        expenses?.forEach((expense: any) => {
          if (!expense.is_reimbursable) {
            const period = expense.expense_date.substring(0, 7);
            const currency = expense.currency || contractInfo?.currency || 'ARS';
            
            if (!cashflowByMonth[period]) {
              cashflowByMonth[period] = {
                flows: {},
                contract_currency: contractInfo?.currency || 'ARS'
              };
            }
            
            if (!cashflowByMonth[period].flows[currency]) {
              cashflowByMonth[period].flows[currency] = { income: 0, expenses: 0, net: 0 };
            }
            
            cashflowByMonth[period].flows[currency].expenses += Number(expense.amount || 0);
          }
        });

        // Calcular netos por moneda
        Object.values(cashflowByMonth).forEach(periodData => {
          Object.keys(periodData.flows).forEach(currency => {
            const flow = periodData.flows[currency];
            flow.net = flow.income - flow.expenses;
          });
        });

        // 6. Convertir a formato esperado - MANTENER ESTRUCTURA MULTI-MONEDA
        const formattedData = Object.entries(cashflowByMonth)
          .map(([period, data]) => ({
            id: `${period}-cash`,
            period,
            flows: data.flows,
            contract_currency: data.contract_currency,
            // Para compatibilidad (usado en modo devengamiento)
            currency: data.contract_currency,
            total_income: Object.values(data.flows).reduce((sum, f) => sum + f.income, 0),
            total_expenses: Object.values(data.flows).reduce((sum, f) => sum + f.expenses, 0),
            net_result: Object.values(data.flows).reduce((sum, f) => sum + f.net, 0),
            contract_id: selectedContract,
            tenant_id: currentTenant.id
          }))
          .sort((a, b) => b.period.localeCompare(a.period))
          .slice(0, 12);

        setCashflowData(formattedData);
      }
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


  return (
    <PMSLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">{currentTenant?.name}</p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Propiedades y Contratos
            </TabsTrigger>
            <TabsTrigger value="reimbursements" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Reembolsos
            </TabsTrigger>
          </TabsList>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
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

          <TabsContent value="properties">
        {viewMode === 'list' ? (
          <div className="mb-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">Propiedades y Contratos</h2>
              <p className="text-muted-foreground">Seleccione un contrato para ver el reporte detallado</p>
            </div>

            {propertiesWithContracts.withContracts.length === 0 && propertiesWithContracts.withoutContracts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay propiedades registradas</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Sección 1: Propiedades CON contratos */}
                {propertiesWithContracts.withContracts.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Propiedades con Contratos Activos ({propertiesWithContracts.withContracts.length})
                    </h3>
                    <Accordion type="single" collapsible className="space-y-4">
                      {propertiesWithContracts.withContracts.map((property) => (
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
                                {property.contracts?.length} contrato(s)
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-4">
                            <div className="space-y-3">
                              {property.contracts.map((contract: any) => (
                                <Card key={contract.id}>
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
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
                                      
                                      <div className="pt-2 border-t">
                                        <Button 
                                          variant="default"
                                          className="w-full"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectContract(contract.id, property);
                                          }}
                                        >
                                          Ver Reporte Detallado
                                          <ChevronRight className="h-4 w-4 ml-2" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}

                {/* Sección 2: Propiedades SIN contratos */}
                {propertiesWithContracts.withoutContracts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      Propiedades sin Contrato ({propertiesWithContracts.withoutContracts.length})
                    </h3>
                    <Accordion type="single" collapsible className="space-y-4">
                      {propertiesWithContracts.withoutContracts.map((property) => (
                        <AccordionItem 
                          key={property.id} 
                          value={property.id}
                          className="border border-dashed rounded-lg bg-card"
                        >
                          <AccordionTrigger className="px-6 py-4 hover:no-underline">
                            <div className="flex items-center gap-4 text-left w-full">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">
                                  {property.alias || property.code}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{property.address}, {property.city}</span>
                                </div>
                              </div>
                              <Badge variant="outline">
                                {property.expenses_without_contract > 0
                                  ? `${property.expenses_without_contract} gasto(s)`
                                  : 'Sin actividad'
                                }
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-4">
                            {property.expenses_without_contract > 0 ? (
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
                                <ChevronRight className="h-4 w-4 ml-auto" />
                              </Button>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                <p className="font-medium">Sin actividad registrada</p>
                                <p className="text-sm mt-1">Esta propiedad no tiene contratos ni gastos</p>
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
              </>
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
                {/* Switch Global de Modo de Visualización */}
                <Alert className="mb-6">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Modo de Visualización</AlertTitle>
                  <AlertDescription className="flex items-center justify-between">
                    <span>
                      {cashflowViewMode === 'cash' 
                        ? 'Mostrando datos por fecha de cobro (cuando se recibió el pago)'
                        : 'Mostrando datos por período de devengamiento (cuando corresponde el pago)'
                      }
                    </span>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="cashflow-mode" className="text-sm">
                        {cashflowViewMode === 'cash' ? 'Mes de Cobro' : 'Mes de Devengamiento'}
                      </Label>
                      <Switch
                        id="cashflow-mode"
                        checked={cashflowViewMode === 'cash'}
                        onCheckedChange={(checked) => setCashflowViewMode(checked ? 'cash' : 'accrual')}
                      />
                    </div>
                  </AlertDescription>
                </Alert>

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
                          {cashflowData.map((cf) => {
                            // Obtener monedas únicas en este período
                            const currencies = cf.flows ? Object.keys(cf.flows) : [cf.currency];
                            
                            // Si es modo devengamiento (accrual), mostrar una sola fila
                            if (cashflowViewMode === 'accrual' || !cf.flows) {
                              return (
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
                              );
                            }
                            
                            // Modo cash: Mostrar múltiples filas por moneda
                            return currencies.map((currency, idx) => {
                              const flow = cf.flows[currency];
                              const isFirstRow = idx === 0;
                              
                              return (
                                <TableRow key={`${cf.period}-${currency}`}>
                                  {isFirstRow && (
                                    <TableCell 
                                      rowSpan={currencies.length} 
                                      className="font-medium border-r align-top"
                                    >
                                      {cf.period}
                                    </TableCell>
                                  )}
                                  
                                  <TableCell>
                                    <Badge variant="outline">{currency}</Badge>
                                  </TableCell>
                                  
                                  <TableCell className="text-right text-green-600 font-medium">
                                    ${Number(flow.income || 0).toLocaleString('es-AR', {
                                      minimumFractionDigits: 2,
                                    })}
                                  </TableCell>
                                  
                                  <TableCell className="text-right text-red-600">
                                    ${Number(flow.expenses || 0).toLocaleString('es-AR', {
                                      minimumFractionDigits: 2,
                                    })}
                                  </TableCell>
                                  
                                  <TableCell className="text-right font-bold">
                                    <Badge variant={flow.net >= 0 ? 'default' : 'destructive'}>
                                      ${Number(flow.net || 0).toLocaleString('es-AR', {
                                        minimumFractionDigits: 2,
                                      })}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            });
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                <OwnerNetIncomeReport 
                  tenantId={currentTenant?.id || ''} 
                  selectedContract={selectedContract}
                  viewMode={cashflowViewMode}
                />

                {/* Botones de Exportación de Reportes */}
                <div className="flex justify-end gap-2">
                  <OwnerReportDirectDownload
                    contractId={selectedContract}
                    propertyId={selectedProperty.id}
                    propertyCode={selectedProperty.code}
                  >
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar PDF
                    </Button>
                  </OwnerReportDirectDownload>
                  
                  <OwnerReportExportDialog
                    contractId={selectedContract}
                    propertyId={selectedProperty.id}
                    contractStartDate={selectedProperty?.contracts?.find((c: any) => c.id === selectedContract)?.start_date || ''}
                    contractEndDate={selectedProperty?.contracts?.find((c: any) => c.id === selectedContract)?.end_date || ''}
                    sendEmail
                  >
                    <Button variant="default" size="sm">
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar por Email
                    </Button>
                  </OwnerReportExportDialog>
                </div>
              </>
            )}
          </div>
        )}
        </TabsContent>

        <TabsContent value="reimbursements">
          {currentTenant?.id ? (
            <ReimbursementDashboard tenantId={currentTenant.id} />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  No hay tenant seleccionado
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        </Tabs>
      </div>
    </PMSLayout>
  );
};

export default Reports;
