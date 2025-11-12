import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePMS } from '@/contexts/PMSContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { formatDateDisplay } from '@/utils/dateUtils';
import { Skeleton } from '@/components/ui/skeleton';

interface ExchangeRateData {
  date: string;
  buy_rate: number;
  sell_rate: number;
  source_type: string;
}

interface MonthlyStats {
  month: string;
  monthLabel: string;
  avg_sell: number;
  min_sell: number;
  max_sell: number;
  variance_pct: number;
  days_count: number;
  daily_rates: ExchangeRateData[];
}

export function ExchangeRatesAnalytics() {
  const { currentTenant } = usePMS();
  const [monthlyData, setMonthlyData] = useState<MonthlyStats[]>([]);
  const [currentRate, setCurrentRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentTenant?.id) {
      fetchExchangeRates();
    }
  }, [currentTenant?.id]);

  const fetchExchangeRates = async () => {
    if (!currentTenant?.id) return;

    setLoading(true);
    try {
      // Obtener datos de los últimos 6 meses
      const { data: rates, error } = await supabase
        .from('pms_exchange_rates')
        .select('date, buy_rate, sell_rate, source_type')
        .eq('tenant_id', currentTenant.id)
        .eq('source_type', 'oficial')
        .gte('date', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;

      if (rates && rates.length > 0) {
        setCurrentRate(rates[0].sell_rate);

        // Agrupar por mes
        const grouped = rates.reduce((acc, rate) => {
          const month = rate.date.substring(0, 7); // YYYY-MM
          if (!acc[month]) {
            acc[month] = [];
          }
          acc[month].push(rate);
          return acc;
        }, {} as Record<string, ExchangeRateData[]>);

        // Calcular estadísticas mensuales
        const monthly = Object.entries(grouped).map(([month, dailyRates]) => {
          const sellRates = dailyRates.map(r => r.sell_rate);
          const avg_sell = sellRates.reduce((a, b) => a + b, 0) / sellRates.length;
          const min_sell = Math.min(...sellRates);
          const max_sell = Math.max(...sellRates);
          
          // Calcular variación del mes
          const firstRate = dailyRates[dailyRates.length - 1].sell_rate;
          const lastRate = dailyRates[0].sell_rate;
          const variance_pct = ((lastRate - firstRate) / firstRate) * 100;

          // Formatear etiqueta del mes
          const [year, monthNum] = month.split('-');
          const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
          const monthLabel = `${monthNames[parseInt(monthNum) - 1]} ${year}`;

          return {
            month,
            monthLabel,
            avg_sell,
            min_sell,
            max_sell,
            variance_pct,
            days_count: dailyRates.length,
            daily_rates: dailyRates.sort((a, b) => b.date.localeCompare(a.date))
          };
        }).sort((a, b) => b.month.localeCompare(a.month));

        setMonthlyData(monthly);
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateVariation = (current: number, previous: number) => {
    return ((current - previous) / previous) * 100;
  };

  const monthlyVariation = monthlyData.length >= 2 
    ? calculateVariation(monthlyData[0].avg_sell, monthlyData[1].avg_sell)
    : 0;

  const yearlyVariation = monthlyData.length >= 12
    ? calculateVariation(monthlyData[0].avg_sell, monthlyData[11].avg_sell)
    : 0;

  const currentMonthAvg = monthlyData[0]?.avg_sell || 0;

  // Datos para gráfico de evolución diaria (últimos 90 días)
  const dailyChartData = monthlyData
    .slice(0, 3)
    .flatMap(m => m.daily_rates)
    .reverse()
    .map(rate => ({
      date: formatDateDisplay(rate.date),
      venta: rate.sell_rate,
      compra: rate.buy_rate
    }));

  // Datos para gráfico de promedios mensuales
  const monthlyChartData = monthlyData
    .slice(0, 12)
    .reverse()
    .map(m => ({
      month: m.monthLabel.split(' ')[0],
      promedio: parseFloat(m.avg_sell.toFixed(2)),
      min: m.min_sell,
      max: m.max_sell
    }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Tipo de Cambio Actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${currentRate?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Dólar Oficial Vendedor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Variación Mensual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${monthlyVariation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {monthlyVariation >= 0 ? '+' : ''}{monthlyVariation.toFixed(2)}%
              </span>
              {monthlyVariation >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Variación Anual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${yearlyVariation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {yearlyVariation >= 0 ? '+' : ''}{yearlyVariation.toFixed(2)}%
              </span>
              {yearlyVariation >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Promedio Mes Actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${currentMonthAvg.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolución Últimos 90 Días</CardTitle>
            <CardDescription>Tipo de cambio diario - Dólar Oficial</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="venta" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Venta"
                />
                <Line 
                  type="monotone" 
                  dataKey="compra" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  name="Compra"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Promedio Mensual</CardTitle>
            <CardDescription>Comparación últimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                  tick={{ fontSize: 10 }}
                />
                <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="promedio" fill="hsl(var(--primary))" name="Promedio" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Accordion por mes */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Mensual</CardTitle>
          <CardDescription>Detalle diario de tipos de cambio por mes</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {monthlyData.map((monthData) => (
              <AccordionItem key={monthData.month} value={monthData.month}>
                <AccordionTrigger className="hover:no-underline">
                  <span className="font-semibold">{monthData.monthLabel}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Compra</TableHead>
                        <TableHead className="text-right">Venta</TableHead>
                        <TableHead className="text-right">Variación</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthData.daily_rates.map((rate, index) => {
                        const prevRate = monthData.daily_rates[index + 1];
                        const dailyVariation = prevRate 
                          ? calculateVariation(rate.sell_rate, prevRate.sell_rate)
                          : 0;

                        return (
                          <TableRow key={rate.date}>
                            <TableCell className="font-medium">
                              {formatDateDisplay(rate.date)}
                            </TableCell>
                            <TableCell className="text-right">
                              ${rate.buy_rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right">
                              ${rate.sell_rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right">
                              {prevRate && (
                                <span className={dailyVariation >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {dailyVariation >= 0 ? '+' : ''}{dailyVariation.toFixed(2)}%
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
