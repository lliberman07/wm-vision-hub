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
  FileText,
  Search,
  TrendingUp,
  TrendingDown,
  Home,
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

export function CommissionTrackingDashboard() {
  const { clientData } = useClient();
  const [data, setData] = useState<CommissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [contractFilter, setContractFilter] = useState<string>('all');

  useEffect(() => {
    loadCommissionData();
  }, [clientData]);

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

      {/* Gráficos */}
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
