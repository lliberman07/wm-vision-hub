import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePMS } from "@/contexts/PMSContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IndicesForm } from "@/components/pms/IndicesForm";
import { IndicesBulkImport } from "@/components/pms/IndicesBulkImport";
import { Plus, TrendingUp, RefreshCw, CalendarIcon, Upload } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { PMSLayout } from "@/components/pms/PMSLayout";
import { FilterBar } from "@/components/pms/FilterBar";
import { EmptyState } from "@/components/pms/EmptyState";
import { cn } from "@/lib/utils";

interface EconomicIndex {
  id: string;
  index_type: string;
  period: string;
  value: number;
  source: string;
  created_at: string;
}

export default function Indices() {
  const { currentTenant, userRole } = usePMS();
  const isSuperAdmin = userRole === 'SUPERADMIN';
  const [indices, setIndices] = useState<EconomicIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<EconomicIndex | undefined>();
  const [recalculating, setRecalculating] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [selectedIndexType, setSelectedIndexType] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  useEffect(() => {
    fetchIndices();
  }, []);

  const fetchIndices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pms_economic_indices')
      .select('*')
      .order('period', { ascending: false });

    if (!error && data) {
      setIndices(data);
    }
    setLoading(false);
  };

  const handleRecalculateAll = async () => {
    try {
      setRecalculating(true);
      const { error } = await supabase.rpc('recalculate_all_active_contracts');
      
      if (error) throw error;
      
      toast.success("Se recalcularon todas las proyecciones con los índices actualizados");
    } catch (error: any) {
      toast.error(error.message || "Error al recalcular proyecciones");
    } finally {
      setRecalculating(false);
    }
  };

  const filteredIndices = indices.filter(idx => {
    // Filtro por tipo seleccionado
    const matchesType = !selectedIndexType || idx.index_type === selectedIndexType;
    
    // Filtro por búsqueda de texto
    const matchesSearch = 
      idx.index_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idx.period.includes(searchTerm) ||
      idx.source?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro de rango de fechas (solo para ICL)
    let matchesDateRange = true;
    if (selectedIndexType === 'ICL' && (dateFrom || dateTo)) {
      try {
        const periodDate = new Date(idx.period); // YYYY-MM-DD para ICL
        
        if (dateFrom) {
          const fromMidnight = new Date(dateFrom);
          fromMidnight.setHours(0, 0, 0, 0);
          if (periodDate < fromMidnight) {
            matchesDateRange = false;
          }
        }
        
        if (dateTo) {
          const toMidnight = new Date(dateTo);
          toMidnight.setHours(23, 59, 59, 999);
          if (periodDate > toMidnight) {
            matchesDateRange = false;
          }
        }
      } catch (e) {
        matchesDateRange = false;
      }
    }
    
    return matchesType && matchesSearch && matchesDateRange;
  });

  const getIndexBadgeVariant = (type: string) => {
    switch (type) {
      case 'IPC': return 'default';
      case 'ICL': return 'secondary';
      case 'UVA': return 'outline';
      default: return 'default';
    }
  };

  return (
    <PMSLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Índices Económicos</h1>
              <p className="text-muted-foreground mt-1">
                Gestión de valores de IPC y UVA (mensuales) e ICL (diarios del BCRA)
              </p>
            </div>
            {isSuperAdmin && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleRecalculateAll}
                  disabled={recalculating}
                  size="lg"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
                  Recalcular Proyecciones
                </Button>
                <Button onClick={() => {
                  setSelectedIndex(undefined);
                  setIsFormOpen(true);
                }} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Cargar Índice
                </Button>
                {selectedIndexType && ['ICL', 'UVA'].includes(selectedIndexType) && (
                  <Button onClick={() => setBulkImportOpen(true)} variant="secondary" size="lg">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar {selectedIndexType}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {['IPC', 'ICL', 'UVA'].map(type => {
            const latest = indices
              .filter(i => i.index_type === type)
              .sort((a, b) => b.period.localeCompare(a.period))[0];
            
            const isSelected = selectedIndexType === type;
            
            return (
              <Card 
                key={type}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg hover:scale-105",
                  isSelected && "ring-2 ring-primary border-primary bg-primary/5"
                )}
                onClick={() => setSelectedIndexType(isSelected ? null : type)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {type}
                    {isSelected && <Badge variant="default" className="ml-auto">Activo</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {latest ? latest.value.toFixed(4) : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {latest 
                      ? (latest.period.length === 10 
                          ? format(new Date(latest.period), 'dd/MM/yyyy')
                          : `${latest.period.split('-')[1]}/${latest.period.split('-')[0]}`)
                      : 'Sin datos'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selectedIndexType === 'ICL' && (
          <Card className="mb-4 bg-muted/30">
            <CardContent className="pt-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-sm font-semibold">Seleccioná las fechas</div>
                
                <div className="flex items-center gap-2">
                  <Label className="text-sm whitespace-nowrap">Desde</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={cn(
                          "w-[200px] justify-start text-left font-normal",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "mm/dd/yyyy"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-sm whitespace-nowrap">Hasta</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={cn(
                          "w-[200px] justify-start text-left font-normal",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "dd/MM/yyyy") : "mm/dd/yyyy"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {(dateFrom || dateTo) && (
                  <Button 
                    variant="ghost" 
                    onClick={() => { 
                      setDateFrom(undefined); 
                      setDateTo(undefined); 
                    }}
                  >
                    Limpiar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-6">
          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

        <Card className="card-elevated">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">Cargando...</div>
            ) : filteredIndices.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="No hay índices cargados"
                description={
                  isSuperAdmin 
                    ? "Comienza cargando los valores mensuales de los índices económicos oficiales (IPC, ICL, UVA)"
                    : "Los índices económicos oficiales aún no han sido cargados por el administrador del sistema"
                }
                actionLabel={isSuperAdmin ? "+ Cargar Índice" : undefined}
                onAction={isSuperAdmin ? () => {
                  setSelectedIndex(undefined);
                  setIsFormOpen(true);
                } : undefined}
              />
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead>Fecha de Carga</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIndices.map((idx) => (
                    <TableRow
                      key={idx.id}
                      className={isSuperAdmin ? "cursor-pointer hover:bg-muted/50" : ""}
                      onClick={isSuperAdmin ? () => {
                        setSelectedIndex(idx);
                        setIsFormOpen(true);
                      } : undefined}
                    >
                      <TableCell>
                        <Badge variant={getIndexBadgeVariant(idx.index_type)}>
                          {idx.index_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {idx.period.length === 10 
                          ? format(new Date(idx.period), 'dd/MM/yyyy')
                          : `${idx.period.split('-')[1]}/${idx.period.split('-')[0]}`
                        }
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {idx.value.toFixed(4)}
                      </TableCell>
                      <TableCell>{idx.source || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(idx.created_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {isSuperAdmin && (
          <>
            <IndicesForm
              open={isFormOpen}
              onOpenChange={setIsFormOpen}
              onSuccess={fetchIndices}
              indice={selectedIndex}
            />
            {selectedIndexType && ['ICL', 'UVA'].includes(selectedIndexType) && (
              <IndicesBulkImport
                open={bulkImportOpen}
                onOpenChange={setBulkImportOpen}
                onSuccess={fetchIndices}
                indexType={selectedIndexType as 'ICL' | 'UVA'}
              />
            )}
          </>
        )}
      </div>
    </PMSLayout>
  );
}
