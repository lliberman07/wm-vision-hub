import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, DollarSign, Eye, FileText } from "lucide-react";
import { PaymentCellModal } from "./PaymentCellModal";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ScheduleItem {
  id: string;
  period_date: string;
  item: string;
  expected_amount: number;
  owner_percentage: number;
  status: string;
  payment_id: string | null;
  owner: {
    id: string;
    full_name: string;
    email: string;
  };
  projection: {
    adjusted_amount: number;
    adjustment_applied: boolean;
    indices_used: any;
  };
  payment: {
    paid_amount: number;
    paid_date: string;
    payment_method: string;
    reference_number: string;
    notes: string;
  } | null;
}

interface PaymentScheduleViewProps {
  contractId: string;
  currency: string;
}

export function PaymentScheduleView({ contractId, currency }: PaymentScheduleViewProps) {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (contractId) {
      fetchScheduleItems();
    }
  }, [contractId]);

  const fetchScheduleItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pms_payment_schedule_items')
        .select(`
          *,
          projection:pms_contract_monthly_projections(*),
          payment:pms_payments(*),
          owner:pms_owners(id, full_name, email)
        `)
        .eq('contract_id', contractId)
        .order('period_date', { ascending: true });

      if (error) throw error;
      setScheduleItems(data as any);

      // Expandir primer mes por defecto
      if (data && data.length > 0) {
        const firstMonth = format(new Date(data[0].period_date), 'yyyy-MM');
        setExpandedMonths(new Set([firstMonth]));
      }
    } catch (error) {
      console.error('Error fetching schedule items:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedByMonth = scheduleItems.reduce((acc, item) => {
    const month = format(new Date(item.period_date), 'yyyy-MM');
    if (!acc[month]) acc[month] = [];
    acc[month].push(item);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

  const filteredMonths = Object.entries(groupedByMonth).filter(([_, items]) => {
    if (filterStatus === "all") return true;
    return items.some(item => item.status === filterStatus);
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      paid: { label: "Pagado ✓", variant: "default" },
      pending: { label: "Pendiente ⏳", variant: "secondary" },
      overdue: { label: "Vencido ⚠️", variant: "destructive" },
      partial: { label: "Parcial 📊", variant: "outline" },
    };
    const config = variants[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const toggleMonth = (month: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(month)) {
      newExpanded.delete(month);
    } else {
      newExpanded.add(month);
    }
    setExpandedMonths(newExpanded);
  };

  const handleCellClick = (item: ScheduleItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Proyección de Pagos por Propietario</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                Todos
              </Button>
              <Button
                variant={filterStatus === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("pending")}
              >
                Pendientes
              </Button>
              <Button
                variant={filterStatus === "paid" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("paid")}
              >
                Pagados
              </Button>
              <Button
                variant={filterStatus === "overdue" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("overdue")}
              >
                Vencidos
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredMonths.map(([month, items]) => {
              const isExpanded = expandedMonths.has(month);
              const monthTotal = items.reduce((sum, item) => sum + item.expected_amount, 0);

              return (
                <Collapsible
                  key={month}
                  open={isExpanded}
                  onOpenChange={() => toggleMonth(month)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between hover:bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-medium">
                          {format(new Date(month + '-01'), 'MMMM yyyy', { locale: es })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {currency} ${monthTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Propietario</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">%</TableHead>
                          <TableHead className="text-right">Monto Esperado</TableHead>
                          <TableHead className="text-center">Estado</TableHead>
                          <TableHead className="text-center">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.owner.full_name}
                            </TableCell>
                            <TableCell>{item.item}</TableCell>
                            <TableCell className="text-right">
                              {item.owner_percentage.toFixed(2)}%
                            </TableCell>
                            <TableCell className="text-right">
                              {currency} ${item.expected_amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-center">
                              {getStatusBadge(item.status)}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.status === 'paid' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCellClick(item)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver Detalle
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleCellClick(item)}
                                >
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  Registrar Pago
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedItem && (
        <PaymentCellModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          scheduleItem={selectedItem}
          onSuccess={() => {
            fetchScheduleItems();
            setIsModalOpen(false);
          }}
        />
      )}
    </>
  );
}
