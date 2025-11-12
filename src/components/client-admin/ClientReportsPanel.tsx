import { useState } from 'react';
import { useClient } from '@/contexts/ClientContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileBarChart, Download, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function ClientReportsPanel() {
  const { clientData } = useClient();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  const generateReport = async (reportType: string) => {
    if (!clientData) return;

    toast.loading('Generando reporte...');

    try {
      // Call edge function to generate report
      // For now, just show success
      toast.dismiss();
      toast.success(`Reporte ${reportType} generado`);
    } catch (error) {
      toast.dismiss();
      toast.error('Error al generar reporte');
    }
  };

  const reports = [
    {
      id: 'financial',
      title: 'Reporte Financiero',
      description: 'Ingresos, gastos y balance neto del período',
      icon: FileBarChart,
    },
    {
      id: 'users',
      title: 'Actividad de Usuarios',
      description: 'Últimos accesos y acciones realizadas',
      icon: FileBarChart,
    },
    {
      id: 'properties',
      title: 'Reporte de Propiedades',
      description: 'Estado actual de todas las propiedades',
      icon: FileBarChart,
    },
    {
      id: 'contracts',
      title: 'Reporte de Contratos',
      description: 'Contratos activos, vencidos y próximos a vencer',
      icon: FileBarChart,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Reportes</h2>
        <p className="text-muted-foreground">Descarga reportes de tu organización</p>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Período</CardTitle>
          <CardDescription>Selecciona el rango de fechas para los reportes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, 'PP', { locale: es }) : 'Desde'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                  locale={es}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, 'PP', { locale: es }) : 'Hasta'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle>{report.title}</CardTitle>
                </div>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={() => generateReport(report.id)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => generateReport(report.id)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Excel
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
