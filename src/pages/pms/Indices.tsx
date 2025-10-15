import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePMS } from "@/contexts/PMSContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IndicesForm } from "@/components/pms/IndicesForm";
import { Plus, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { PMSLayout } from "@/components/pms/PMSLayout";
import { FilterBar } from "@/components/pms/FilterBar";
import { EmptyState } from "@/components/pms/EmptyState";

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

  const filteredIndices = indices.filter(idx =>
    idx.index_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idx.period.includes(searchTerm) ||
    idx.source?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                Gestión de valores mensuales de IPC, ICL y UVA
              </p>
            </div>
            {isSuperAdmin && (
              <Button onClick={() => {
                setSelectedIndex(undefined);
                setIsFormOpen(true);
              }} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Cargar Índice
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {['IPC', 'ICL', 'UVA'].map(type => {
            const latest = indices.find(i => i.index_type === type);
            return (
              <Card key={type}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {type}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {latest ? latest.value.toFixed(4) : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {latest ? format(new Date(latest.period + '-01'), 'MMMM yyyy') : 'Sin datos'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

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
                        {format(new Date(idx.period + '-01'), 'MM/yyyy')}
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
          <IndicesForm
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSuccess={fetchIndices}
            indice={selectedIndex}
          />
        )}
      </div>
    </PMSLayout>
  );
}
