import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "lucide-react";

interface ScheduleItem {
  id: string;
  period_date: string;
  item: string;
  expected_amount: number;
  status: string;
  payment_id?: string;
}

interface TenantPaymentCalendarProps {
  contractId: string;
}

export function TenantPaymentCalendar({ contractId }: TenantPaymentCalendarProps) {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScheduleItems();
  }, [contractId]);

  const fetchScheduleItems = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("pms_payment_schedule_items")
        .select("id, period_date, item, expected_amount, status, payment_id")
        .eq("contract_id", contractId)
        .order("period_date", { ascending: true });

      if (error) {
        console.error("Error fetching schedule items:", error);
        return;
      }

      setScheduleItems(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      paid: "default",
      overdue: "destructive",
    } as const;

    const labels = {
      pending: "Pendiente",
      paid: "Pagado",
      overdue: "Vencido",
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const groupByMonth = (items: ScheduleItem[]) => {
    const grouped: { [key: string]: ScheduleItem[] } = {};
    
    items.forEach((item) => {
      const month = format(new Date(item.period_date), "MMMM yyyy", { locale: es });
      if (!grouped[month]) {
        grouped[month] = [];
      }
      grouped[month].push(item);
    });

    return grouped;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendario de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Cargando calendario...</p>
        </CardContent>
      </Card>
    );
  }

  const groupedItems = groupByMonth(scheduleItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendario de Pagos
        </CardTitle>
        <CardDescription>
          Pagos programados para tu contrato
        </CardDescription>
      </CardHeader>
      <CardContent>
        {Object.keys(groupedItems).length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay pagos programados
          </p>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([month, items]) => {
              const totalExpected = items.reduce((sum, item) => sum + item.expected_amount, 0);
              const allPaid = items.every((item) => item.status === "paid");

              return (
                <div key={month} className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-semibold capitalize">{month}</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">
                        Total: ${totalExpected.toLocaleString()}
                      </span>
                      {allPaid && <Badge variant="default">Completado</Badge>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">
                            Item {item.item} - ${item.expected_amount.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Vencimiento: {format(new Date(item.period_date), "dd/MM/yyyy", { locale: es })}
                          </p>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
