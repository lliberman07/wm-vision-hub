import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Filter, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReceiptsFilterBarProps {
  onFilterChange: (filters: ReceiptFilters) => void;
  totalCount: number;
  filteredCount: number;
}

export interface ReceiptFilters {
  search: string;
  status: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  tenantId: string;
}

export function ReceiptsFilterBar({ onFilterChange, totalCount, filteredCount }: ReceiptsFilterBarProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = () => {
    onFilterChange({
      search,
      status,
      dateFrom,
      dateTo,
      tenantId: 'all',
    });
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    onFilterChange({
      search: '',
      status: 'all',
      dateFrom: undefined,
      dateTo: undefined,
      tenantId: 'all',
    });
  };

  const hasActiveFilters = search || status !== 'all' || dateFrom || dateTo;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        {/* Búsqueda */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número de recibo, contrato, inquilino..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setTimeout(handleFilterChange, 300);
            }}
            className="pl-9"
          />
        </div>

        {/* Botón de filtros */}
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-foreground text-primary rounded">
              •
            </span>
          )}
        </Button>

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Panel de filtros expandible */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          {/* Filtro por estado */}
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={status} onValueChange={(value) => {
              setStatus(value);
              handleFilterChange();
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="generated">Generados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="failed">Fallidos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por fecha desde */}
          <div className="space-y-2">
            <Label>Fecha Desde</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  {dateFrom ? format(dateFrom, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar fecha'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={(date) => {
                    setDateFrom(date);
                    handleFilterChange();
                  }}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Filtro por fecha hasta */}
          <div className="space-y-2">
            <Label>Fecha Hasta</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  {dateTo ? format(dateTo, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar fecha'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={(date) => {
                    setDateTo(date);
                    handleFilterChange();
                  }}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* Contador de resultados */}
      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
        <span>
          Mostrando {filteredCount} de {totalCount} recibos
        </span>
      </div>
    </Card>
  );
}
