import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar, Mail, Search, TrendingUp, FileText, AlertCircle } from "lucide-react";

interface Simulation {
  id: string;
  reference_number: string;
  user_email: string;
  profile_status: string;
  profile_step: number;
  created_at: string;
  profile_completed_at: string | null;
  application_id: string | null;
}

export const SimulationsManagement = () => {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchSimulations();
  }, []);

  const fetchSimulations = async () => {
    try {
      let query = supabase
        .from('investment_simulations')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching simulations:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las simulaciones",
          variant: "destructive"
        });
        return;
      }

      setSimulations(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      not_started: { label: "No iniciado", variant: "outline" },
      in_progress: { label: "En progreso", variant: "secondary" },
      completed: { label: "Completado", variant: "default" }
    };

    const config = variants[status] || variants.not_started;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredSimulations = simulations.filter(sim => {
    const matchesFilter = filter === "all" || sim.profile_status === filter;
    const matchesSearch = 
      sim.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sim.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: simulations.length,
    not_started: simulations.filter(s => s.profile_status === 'not_started').length,
    in_progress: simulations.filter(s => s.profile_status === 'in_progress').length,
    completed: simulations.filter(s => s.profile_status === 'completed').length,
    conversion: simulations.length > 0 
      ? ((simulations.filter(s => s.profile_status === 'completed').length / simulations.length) * 100).toFixed(1)
      : '0'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">No iniciado</p>
              <p className="text-2xl font-bold">{stats.not_started}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En progreso</p>
              <p className="text-2xl font-bold">{stats.in_progress}</p>
            </div>
            <FileText className="h-8 w-8 text-amber-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completado</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
            <FileText className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tasa de conversión</p>
              <p className="text-2xl font-bold text-primary">{stats.conversion}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Estado del perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="not_started">No iniciado</SelectItem>
            <SelectItem value="in_progress">En progreso</SelectItem>
            <SelectItem value="completed">Completado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código de Referencia</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Estado del Perfil</TableHead>
              <TableHead>Último Paso</TableHead>
              <TableHead>Fecha de Creación</TableHead>
              <TableHead>Completado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSimulations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No se encontraron simulaciones
                </TableCell>
              </TableRow>
            ) : (
              filteredSimulations.map((simulation) => (
                <TableRow key={simulation.id}>
                  <TableCell className="font-mono font-medium">
                    {simulation.reference_number}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {simulation.user_email}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(simulation.profile_status)}</TableCell>
                  <TableCell>
                    {simulation.profile_step === 0 ? (
                      <span className="text-muted-foreground">-</span>
                    ) : (
                      <span>Paso {simulation.profile_step} de 4</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(simulation.created_at), 'dd/MM/yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {simulation.profile_completed_at ? (
                      <div className="text-sm">
                        {format(new Date(simulation.profile_completed_at), 'dd/MM/yyyy')}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};