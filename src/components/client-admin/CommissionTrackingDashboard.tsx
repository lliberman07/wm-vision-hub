import { useEffect, useState } from 'react';
import { useClient } from '@/contexts/ClientContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  Building2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Search,
  TrendingUp,
  TrendingDown,
  Home,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Target,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CommissionData {
  property_id: string;
  property_code: string;
  property_address: string;
  property_status: string;
  has_active_contract: boolean;
  contract_id: string | null;
  contract_number: string | null;
  monthly_rent: number;
  rent_currency: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  commission_amount_ars: number;
  is_within_subscription_limit: boolean;
}

interface HistoricalData {
  period_month: string;
  total_commission_ars: number;
  commission_with_contract: number;
  commission_without_contract: number;
  properties_with_contract: number;
  properties_without_contract: number;
  avg_commission_percentage: number;
}

interface AnnualProjection {
  total_projection: number;
  from_active_contracts: number;
  from_properties_without_contract: number;
  active_contracts_count: number;
  properties_without_contract_count: number;
  avg_monthly_commission: number;
  projection_details: any;
}

export function CommissionTrackingDashboard() {
  const { clientData } = useClient();
  const [data, setData] = useState<CommissionData[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [annualProjection, setAnnualProjection] = useState<AnnualProjection | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [contractFilter, setContractFilter] = useState<string>('all');
  const [monthsToShow, setMonthsToShow] = useState<number>(6);

  useEffect(() => {
    loadCommissionData();
    loadHistoricalData();
    loadAnnualProjection();
  }, [clientData, monthsToShow]);

  const loadCommissionData = async () => {
    if (!clientData?.id) return;

    try {
      setLoading(true);
      const { data: result, error } = await supabase
        .rpc('get_tenant_commission_report', {
          p_tenant_id: clientData.id
        });

      if (error) throw error;
      setData((result || []) as CommissionData[]);
    } catch (error) {
      console.error('Error loading commission data:', error);
      toast.error('Error al cargar datos de comisiones');
    } finally {
      setLoading(false);
    }
  };

  const loadHistoricalData = async () => {
    if (!clientData?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('get_tenant_commission_history', {
        p_tenant_id: clientData.id,
        p_months_back: monthsToShow
      });

      if (error) throw error;
      setHistoricalData(data || []);
    } catch (error) {
      console.error("Error loading historical data:", error);
    }
  };

  const loadAnnualProjection = async () => {
    if (!clientData?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('get_tenant_annual_commission_projection', {
        p_tenant_id: clientData.id
      });

      if (error) throw error;
      if (data && data.length > 0) {
        setAnnualProjection(data[0]);
      }
    } catch (error) {
      console.error("Error loading annual projection:", error);
    }
  };

  // Filtrar datos
  const filteredData = data.filter((item) => {
    const matchesSearch = 
      item.property_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.property_address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || item.property_status === statusFilter;
    
    const matchesContract = 
      contractFilter === 'all' ||
      (contractFilter === 'with' && item.has_active_contract) ||
      (contractFilter === 'without' && !item.has_active_contract);

    return matchesSearch && matchesStatus && matchesContract;
  });

  // Calcular estadísticas
  const stats = {
    totalMonthlyCommission: filteredData.reduce((sum, item) => sum + item.commission_amount_ars, 0),
    propertiesWithContract: filteredData.filter(item => item.has_active_contract).length,
    propertiesWithoutContract: filteredData.filter(item => !item.has_active_contract).length,
    propertiesInLimit: filteredData.filter(item => item.is_within_subscription_limit).length,
    propertiesOutLimit: filteredData.filter(item => !item.is_within_subscription_limit).length,
    avgCommissionPercentage: filteredData
      .filter(item => item.commission_type === 'percentage')
      .reduce((sum, item) => sum + item.commission_value, 0) / 
      (filteredData.filter(item => item.commission_type === 'percentage').length || 1),
    avgFixedCommission: filteredData
      .filter(item => item.commission_type === 'fixed')
      .reduce((sum, item) => sum + item.commission_value, 0) / 
      (filteredData.filter(item => item.commission_type === 'fixed').length || 1),
  };

  // Datos para gráfico de torta
  const pieData = [
    { 
      name: 'Con Contrato', 
      value: filteredData.filter(item => item.has_active_contract)
        .reduce((sum, item) => sum + item.commission_amount_ars, 0)
    },
    { 
      name: 'Sin Contrato', 
      value: filteredData.filter(item => !item.has_active_contract)
        .reduce((sum, item) => sum + item.commission_amount_ars, 0)
    },
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))'];

  // Datos para gráfico de evolución temporal
  const historicalChartData = [...historicalData]
    .reverse()
    .map(item => ({
      mes: new Date(item.period_month).toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }),
      total: parseFloat(item.total_commission_ars.toString()),
      conContrato: parseFloat(item.commission_with_contract.toString()),
      sinContrato: parseFloat(item.commission_without_contract.toString()),
    }));

  // Calcular comparativa mes actual vs anterior
  const currentMonth = historicalData[0];
  const previousMonth = historicalData[1];
  
  const monthOverMonthChange = currentMonth && previousMonth 
    ? ((parseFloat(currentMonth.total_commission_ars.toString()) - parseFloat(previousMonth.total_commission_ars.toString())) / parseFloat(previousMonth.total_commission_ars.toString())) * 100
    : 0;

  const getTrendIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (change < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  // Datos para gráfico de barras (Top 10 propiedades)
  const barData = [...filteredData]
    .sort((a, b) => b.commission_amount_ars - a.commission_amount_ars)
    .slice(0, 10)
    .map(item => ({
      name: item.property_code,
      comision: item.commission_amount_ars,
    }));

  // Exportar a Excel
  const exportToExcel = () => {
    const exportData = filteredData.map(item => ({
      'Código': item.property_code,
      'Dirección': item.property_address,
      'Estado': item.property_status,
      'Contrato Activo': item.has_active_contract ? 'Sí' : 'No',
      'Tipo Comisión': item.commission_type === 'percentage' ? 'Porcentual' : 'Fijo',
      'Valor Comisión': item.commission_value,
      'Monto Mensual (ARS)': item.commission_amount_ars,
      'Dentro del Plan': item.is_within_subscription_limit ? 'Sí' : 'No',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comisiones');
    XLSX.writeFile(wb, `comisiones_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Reporte exportado correctamente');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Tracking de Comisiones</h2>
          <p className="text-muted-foreground">
            Gestión de honorarios por administración de propiedades
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comisión Mensual Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${stats.totalMonthlyCommission.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Estimación mensual en ARS
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Contrato</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.propertiesWithContract}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Comisión promedio: {stats.avgCommissionPercentage.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Contrato</CardTitle>
            <Home className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.propertiesWithoutContract}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Comisión fija promedio: ${stats.avgFixedCommission.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado del Plan</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.propertiesInLimit}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.propertiesOutLimit > 0 && (
                <span className="text-destructive">
                  ⚠ {stats.propertiesOutLimit} fuera del límite
                </span>
              )}
              {stats.propertiesOutLimit === 0 && 'Todas dentro del plan'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Proyección Anual */}
      {annualProjection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Proyección Anual
            </CardTitle>
            <CardDescription>
              Estimación de ingresos por comisiones basada en contratos activos y propiedades disponibles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-2">Proyección Total</div>
                  <div className="text-3xl font-bold text-primary">
                    ${annualProjection.total_projection.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Promedio mensual: ${annualProjection.avg_monthly_commission.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-2">Contratos Activos</div>
                  <div className="text-3xl font-bold text-green-600">
                    ${annualProjection.from_active_contracts.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {annualProjection.active_contracts_count} contrato{annualProjection.active_contracts_count !== 1 ? 's' : ''}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-2">Propiedades Disponibles</div>
                  <div className="text-3xl font-bold text-amber-600">
                    ${annualProjection.from_properties_without_contract.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {annualProjection.properties_without_contract_count} propiedad{annualProjection.properties_without_contract_count !== 1 ? 'es' : ''}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold mb-3">Desglose de la Proyección</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ingresos confirmados (contratos activos):</span>
                  <span className="font-medium text-green-600">
                    ${annualProjection.from_active_contracts.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Potencial de ingresos (propiedades disponibles):</span>
                  <span className="font-medium text-amber-600">
                    ${annualProjection.from_properties_without_contract.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total proyectado:</span>
                    <span className="text-primary">
                      ${annualProjection.total_projection.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4 italic">
                * La proyección de contratos activos considera los meses restantes hasta su vencimiento. 
                La proyección de propiedades disponibles asume contratación anual (12 meses).
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparativa Histórica */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Evolución Histórica
              </CardTitle>
              <CardDescription>Comisiones de los últimos {monthsToShow} meses</CardDescription>
            </div>
            <Select value={monthsToShow.toString()} onValueChange={(v) => setMonthsToShow(parseInt(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 meses</SelectItem>
                <SelectItem value="6">6 meses</SelectItem>
                <SelectItem value="12">12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Mes Actual</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  ${currentMonth?.total_commission_ars.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(currentMonth?.period_month || new Date()).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Mes Anterior</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  ${previousMonth?.total_commission_ars.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(previousMonth?.period_month || new Date()).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Variación</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold flex items-center gap-2 ${getTrendColor(monthOverMonthChange)}`}>
                  {getTrendIcon(monthOverMonthChange)}
                  {Math.abs(monthOverMonthChange).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {monthOverMonthChange > 0 ? 'Crecimiento' : monthOverMonthChange < 0 ? 'Descenso' : 'Sin cambios'}
                </p>
              </CardContent>
            </Card>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(value: number) => `$${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                name="Total"
                dot={{ fill: 'hsl(var(--primary))' }}
              />
              <Line 
                type="monotone" 
                dataKey="conContrato" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                name="Con Contrato"
                strokeDasharray="5 5"
              />
              <Line 
                type="monotone" 
                dataKey="sinContrato" 
                stroke="hsl(var(--chart-3))" 
                strokeWidth={2}
                name="Sin Contrato"
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráficos de Distribución */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Comisiones</CardTitle>
            <CardDescription>Por tipo de contrato</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toLocaleString('es-AR')}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Propiedades</CardTitle>
            <CardDescription>Por comisión generada</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString('es-AR')}`} />
                <Bar dataKey="comision" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={contractFilter} onValueChange={setContractFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Estado de contrato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="with">Con contrato</SelectItem>
              <SelectItem value="without">Sin contrato</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Estado propiedad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="rented">Alquilada</SelectItem>
              <SelectItem value="maintenance">Mantenimiento</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tabla de datos */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Comisiones</CardTitle>
          <CardDescription>
            {filteredData.length} propiedades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Tipo Comisión</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Monto Mensual</TableHead>
                  <TableHead>Plan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No se encontraron propiedades
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.property_id}>
                      <TableCell className="font-medium">{item.property_code}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {item.property_address}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.property_status === 'available' && 'Disponible'}
                          {item.property_status === 'rented' && 'Alquilada'}
                          {item.property_status === 'maintenance' && 'Mantenimiento'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.has_active_contract ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Sin contrato</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.commission_type === 'percentage' ? (
                          <Badge variant="default">Porcentual</Badge>
                        ) : (
                          <Badge variant="secondary">Fijo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.commission_type === 'percentage' 
                          ? `${item.commission_value}%`
                          : `$${item.commission_value.toLocaleString('es-AR')}`
                        }
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${item.commission_amount_ars.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell>
                        {item.is_within_subscription_limit ? (
                          <Badge variant="outline" className="gap-1 text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            OK
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Fuera
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
