import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePMS } from "@/contexts/PMSContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IndicesForm } from "@/components/pms/IndicesForm";
import { ArrowLeft, Plus, Search, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface EconomicIndex {
  id: string;
  index_type: string;
  period: string;
  value: number;
  source: string;
  created_at: string;
}

export default function Indices() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPMSAccess, currentTenant, pmsRoles } = usePMS();
  const [indices, setIndices] = useState<EconomicIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<EconomicIndex | undefined>();
  const { toast } = useToast();

  const hasAccess = pmsRoles.includes('SUPERADMIN') || pmsRoles.includes('INMOBILIARIA');

  useEffect(() => {
    if (!user || !hasPMSAccess) {
      navigate('/pms-login');
      return;
    }
    
    if (!hasAccess) {
      toast({
        title: "Acceso denegado",
        description: "Solo SUPERADMIN e INMOBILIARIA pueden gestionar índices económicos",
        variant: "destructive"
      });
      navigate('/pms');
      return;
    }

    fetchIndices();
  }, [user, hasPMSAccess, hasAccess]);

  const fetchIndices = async () => {
    if (!currentTenant?.id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('pms_economic_indices')
      .select('*')
      .eq('tenant_id', currentTenant.id)
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/pms')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Índices Económicos</h1>
              <p className="text-sm text-muted-foreground">IPC, ICL, UVA - Gestión de valores históricos</p>
            </div>
          </div>
          <Button onClick={() => {
            setSelectedIndex(undefined);
            setIsFormOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Cargar Índice
          </Button>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Historial de Índices</span>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por tipo o período..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando...</div>
            ) : filteredIndices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron índices
              </div>
            ) : (
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
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedIndex(idx);
                        setIsFormOpen(true);
                      }}
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
            )}
          </CardContent>
        </Card>

        {currentTenant && (
          <IndicesForm
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSuccess={fetchIndices}
            indice={selectedIndex}
            tenantId={currentTenant.id}
          />
        )}
      </div>
    </div>
  );
}
