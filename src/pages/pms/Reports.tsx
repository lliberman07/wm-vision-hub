import { useNavigate } from 'react-router-dom';
import { usePMS } from '@/contexts/PMSContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Building2, Users, FileText, DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PMSLayout } from '@/components/pms/PMSLayout';
import { ExpenseDistributionReport } from '@/components/pms/ExpenseDistributionReport';

const Reports = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTenant, hasPMSAccess } = usePMS();
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current-month');
  const [properties, setProperties] = useState<any[]>([]);
  const [cashflowData, setCashflowData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeContracts: 0,
    activeTenants: 0,
    monthlyIncome: 0,
  });

  useEffect(() => {
    if (!user || !hasPMSAccess) {
      navigate('/pms');
    } else {
      fetchData();
    }
  }, [user, hasPMSAccess, navigate]);

  useEffect(() => {
    if (currentTenant?.id) {
      fetchCashflow();
    }
  }, [selectedProperty, selectedPeriod, currentTenant]);

  const fetchData = async () => {
    try {
      const [propsRes, contractsRes, tenantsRes, paymentsRes] = await Promise.all([
        supabase.from('pms_properties').select('id, code, address'),
        supabase.from('pms_contracts').select('id').eq('status', 'active'),
        supabase.from('pms_tenants_renters').select('id').eq('is_active', true),
        supabase.from('pms_payments').select('paid_amount, currency').eq('status', 'paid'),
      ]);

      if (propsRes.data) setProperties(propsRes.data);

      const totalIncome = paymentsRes.data?.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0) || 0;

      setStats({
        totalProperties: propsRes.data?.length || 0,
        activeContracts: contractsRes.data?.length || 0,
        activeTenants: tenantsRes.data?.length || 0,
        monthlyIncome: totalIncome,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCashflow = async () => {
    try {
      let query = supabase
        .from('pms_cashflow_property')
        .select('*')
        .eq('tenant_id', currentTenant?.id)
        .order('period', { ascending: false })
        .limit(12);

      if (selectedProperty !== 'all') {
        query = query.eq('property_id', selectedProperty);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCashflowData(data || []);
    } catch (error) {
      console.error('Error fetching cashflow:', error);
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

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Flujo de Caja por Propiedad</h2>
              <p className="text-muted-foreground">Seleccione una propiedad para ver el detalle</p>
            </div>
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las propiedades</SelectItem>
                {properties.map(prop => (
                  <SelectItem key={prop.id} value={prop.id}>
                    {prop.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Ingresos, Gastos y Resultado Neto
              </CardTitle>
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
        </div>

        <ExpenseDistributionReport 
          tenantId={currentTenant?.id || ''} 
          selectedProperty={selectedProperty}
        />
      </div>
    </PMSLayout>
  );
};

export default Reports;
