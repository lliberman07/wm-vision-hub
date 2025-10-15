import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePMS } from "@/contexts/PMSContext";
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
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye, FileText } from "lucide-react";
import { ReviewPaymentSubmissionDialog } from "./ReviewPaymentSubmissionDialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PaymentSubmission {
  id: string;
  contract_id: string;
  schedule_item_id: string;
  paid_date: string;
  paid_amount: number;
  payment_method: string;
  reference_number: string;
  receipt_url: string;
  notes: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  submitted_by: string;
  contract: {
    contract_number: string;
    tenant_renter: {
      full_name: string;
      email: string;
    };
  };
  schedule_item: {
    period_date: string;
    expected_amount: number;
    owner: {
      full_name: string;
    };
  };
}

export function PaymentSubmissionsTable() {
  const { currentTenant } = usePMS();
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<PaymentSubmission | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  useEffect(() => {
    if (currentTenant) {
      fetchSubmissions();
    }
  }, [currentTenant]);

  const fetchSubmissions = async () => {
    if (!currentTenant) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pms_payment_submissions')
        .select(`
          *,
          contract:pms_contracts(
            contract_number,
            tenant_renter:pms_tenants_renters(full_name, email)
          ),
          schedule_item:pms_payment_schedule_items(
            period_date,
            expected_amount,
            owner:pms_owners(full_name)
          )
        `)
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data as any);
    } catch (error: any) {
      toast.error('Error al cargar pagos informados', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      pending: { label: "Pendiente", variant: "secondary" },
      approved: { label: "Aprobado", variant: "default" },
      rejected: { label: "Rechazado", variant: "destructive" },
    };
    const config = variants[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleReview = (submission: PaymentSubmission) => {
    setSelectedSubmission(submission);
    setIsReviewOpen(true);
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
              <Skeleton key={i} className="h-16 w-full" />
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
          <CardTitle>Pagos Informados por Inquilinos</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay pagos informados pendientes de revisión</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha Envío</TableHead>
                  <TableHead>Inquilino</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Mes</TableHead>
                  <TableHead>Propietario</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      {format(new Date(submission.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell>{submission.contract.tenant_renter.full_name}</TableCell>
                    <TableCell>{submission.contract.contract_number}</TableCell>
                    <TableCell>
                      {format(new Date(submission.schedule_item.period_date), 'MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>{submission.schedule_item.owner.full_name}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${submission.paid_amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{submission.payment_method}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(submission.status)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReview(submission)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        {submission.status === 'pending' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleReview(submission)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReview(submission)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedSubmission && (
        <ReviewPaymentSubmissionDialog
          open={isReviewOpen}
          onOpenChange={setIsReviewOpen}
          submission={selectedSubmission}
          onSuccess={() => {
            fetchSubmissions();
            setIsReviewOpen(false);
          }}
        />
      )}
    </>
  );
}
