import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePMS } from "@/contexts/PMSContext";
import { supabase } from "@/integrations/supabase/client";
import { PMSLayout } from "@/components/pms/PMSLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Building2, Calendar, FileText, Upload, Receipt, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TenantPaymentCalendar } from "@/components/pms/TenantPaymentCalendar";
import { PaymentSubmissionModal } from "@/components/pms/PaymentSubmissionModal";
import { TenantExpenseForm } from "@/components/pms/TenantExpenseForm";
import { toast } from "sonner";

interface Contract {
  id: string;
  contract_number: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  status: string;
  property_id: string;
  property: {
    code: string;
    address: string;
    city: string;
    property_type: string;
  };
  monto_a?: number;
  monto_b?: number;
}

interface Submission {
  id: string;
  paid_date: string;
  paid_amount: number;
  payment_method: string;
  status: string;
  receipt_url?: string;
  reviewed_at?: string;
  rejection_reason?: string;
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  expense_date: string;
  description?: string;
  paid_by: string;
  attributable_to: string;
  status: string;
  receipt_url?: string;
  created_at: string;
}

export default function MyContract() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPMSAccess, pmsRoles, currentTenant } = usePMS();
  const [contract, setContract] = useState<Contract | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  useEffect(() => {
    if (!user || !hasPMSAccess) {
      navigate("/pms");
      return;
    }

    const isInquilino = pmsRoles.some(role => role === "INQUILINO");
    if (!isInquilino) {
      toast.error("No tienes acceso a esta sección");
      navigate("/pms");
      return;
    }

    fetchContract();
    fetchSubmissions();
    fetchExpenses();
  }, [user, hasPMSAccess, pmsRoles, navigate]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("pms_contracts")
        .select(`
          id,
          contract_number,
          start_date,
          end_date,
          monthly_rent,
          status,
          property_id,
          monto_a,
          monto_b,
          property:pms_properties(code, address, city, property_type),
          tenant_renter:pms_tenants_renters(user_id)
        `)
        .eq("status", "active")
        .eq("tenant_renter.user_id", user?.id)
        .single();

      if (error) {
        console.error("Error fetching contract:", error);
        return;
      }

      setContract(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("pms_payment_submissions")
        .select("*")
        .eq("submitted_by", user?.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching submissions:", error);
        return;
      }

      setSubmissions(data || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from("pms_expenses")
        .select("*")
        .eq("contract_id", contract?.id)
        .eq("paid_by", "inquilino")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching expenses:", error);
        return;
      }

      setExpenses(data || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    } as const;

    const labels = {
      pending: "Pendiente",
      approved: "Aprobado",
      rejected: "Rechazado",
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <PMSLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Cargando información del contrato...</p>
        </div>
      </PMSLayout>
    );
  }

  if (!contract) {
    return (
      <PMSLayout>
        <Card>
          <CardHeader>
            <CardTitle>Sin Contrato Activo</CardTitle>
            <CardDescription>
              No tienes un contrato activo en este momento.
            </CardDescription>
          </CardHeader>
        </Card>
      </PMSLayout>
    );
  }

  return (
    <PMSLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mi Contrato</h1>
            <p className="text-muted-foreground">Información de tu contrato de alquiler</p>
          </div>
          <Button onClick={() => setShowSubmissionModal(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Informar Pago
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {contract.property.address}
                </CardTitle>
                <CardDescription>
                  Contrato #{contract.contract_number}
                </CardDescription>
              </div>
              <Badge variant={contract.status === "active" ? "default" : "outline"}>
                {contract.status === "active" ? "Activo" : contract.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Propiedad</p>
                <p className="font-medium">{contract.property.property_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ubicación</p>
                <p className="font-medium">{contract.property.city}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vigencia</p>
                <p className="font-medium">
                  {format(new Date(contract.start_date), "dd/MM/yyyy", { locale: es })} -{" "}
                  {format(new Date(contract.end_date), "dd/MM/yyyy", { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alquiler Mensual</p>
                <p className="font-medium text-lg">
                  ${contract.monto_a?.toLocaleString() || contract.monthly_rent.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar">
              <Calendar className="mr-2 h-4 w-4" />
              Calendario de Pagos
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <Receipt className="mr-2 h-4 w-4" />
              Gastos
            </TabsTrigger>
            <TabsTrigger value="history">
              <FileText className="mr-2 h-4 w-4" />
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <TenantPaymentCalendar contractId={contract.id} />
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gastos Registrados</CardTitle>
                    <CardDescription>
                      Gastos que has reportado durante el contrato
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowExpenseForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Gasto
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No has registrado gastos aún</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{expense.category}</Badge>
                            <Badge
                              variant={
                                expense.status === 'pending'
                                  ? 'secondary'
                                  : expense.status === 'approved'
                                  ? 'default'
                                  : expense.status === 'deducted'
                                  ? 'default'
                                  : 'destructive'
                              }
                            >
                              {expense.status === 'pending' && 'Pendiente'}
                              {expense.status === 'approved' && 'Aprobado'}
                              {expense.status === 'deducted' && 'Descontado de cuota'}
                              {expense.status === 'rejected' && 'Rechazado'}
                            </Badge>
                            {expense.attributable_to === 'propietario' && (
                              <Badge variant="outline" className="text-xs">
                                Atribuible al propietario
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium text-lg">
                            ${expense.amount.toLocaleString('es-AR')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(expense.expense_date), 'dd/MM/yyyy', { locale: es })}
                          </p>
                          {expense.description && (
                            <p className="text-sm">{expense.description}</p>
                          )}
                        </div>
                        {expense.receipt_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(expense.receipt_url, '_blank')}
                          >
                            Ver Recibo
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pagos Informados</CardTitle>
                <CardDescription>
                  Historial de pagos que has informado al sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No has informado ningún pago aún
                  </p>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">
                            ${submission.paid_amount.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(submission.paid_date), "dd/MM/yyyy", { locale: es })} -{" "}
                            {submission.payment_method}
                          </p>
                          {submission.rejection_reason && (
                            <p className="text-sm text-destructive">
                              Motivo: {submission.rejection_reason}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(submission.status)}
                          {submission.receipt_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(submission.receipt_url, "_blank")}
                            >
                              Ver Comprobante
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <PaymentSubmissionModal
        open={showSubmissionModal}
        onOpenChange={setShowSubmissionModal}
        contractId={contract.id}
        tenantId={currentTenant?.id || ""}
        onSuccess={() => {
          fetchSubmissions();
          toast.success("Pago informado exitosamente");
        }}
      />

      <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Gasto</DialogTitle>
            <DialogDescription>
              Complete los detalles del gasto realizado
            </DialogDescription>
          </DialogHeader>
          <TenantExpenseForm
            contractId={contract.id}
            tenantId={currentTenant?.id || ""}
            propertyId={contract.property_id || ""}
            onSuccess={() => {
              fetchExpenses();
              setShowExpenseForm(false);
              toast.success("Gasto registrado exitosamente");
            }}
            onCancel={() => setShowExpenseForm(false)}
          />
        </DialogContent>
      </Dialog>
    </PMSLayout>
  );
}
