import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ReceiptUpload } from "./ReceiptUpload";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateForDB, formatDateToDisplay, formatDateDisplay } from "@/utils/dateUtils";

interface PaymentSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  tenantId: string;
  onSuccess: () => void;
}

interface ScheduleItem {
  id: string;
  period_date: string;
  item: string;
  expected_amount: number;
  status: string;
}

export function PaymentSubmissionModal({
  open,
  onOpenChange,
  contractId,
  tenantId,
  onSuccess,
}: PaymentSubmissionModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [paidDate, setPaidDate] = useState<Date>();
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      fetchPendingItems();
    }
  }, [open, contractId]);

  const fetchPendingItems = async () => {
    try {
      const { data, error } = await supabase
        .from("pms_payment_schedule_items")
        .select("id, period_date, item, expected_amount, status")
        .eq("contract_id", contractId)
        .in("status", ["pending", "overdue"])
        .order("period_date", { ascending: true });

      if (error) throw error;

      setScheduleItems(data || []);
    } catch (error) {
      console.error("Error fetching schedule items:", error);
      toast.error("Error al cargar períodos de pago");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItemId || !paidDate || !paidAmount || !paymentMethod) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from("pms_payment_submissions").insert({
        contract_id: contractId,
        tenant_id: tenantId,
        schedule_item_id: selectedItemId,
        submitted_by: user?.id,
        paid_date: formatDateForDB(paidDate),
        paid_amount: parseFloat(paidAmount),
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        receipt_url: receiptUrl || null,
        notes: notes || null,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Pago informado exitosamente");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast.error("Error al informar el pago");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedItemId("");
    setPaidDate(undefined);
    setPaidAmount("");
    setPaymentMethod("");
    setReferenceNumber("");
    setReceiptUrl("");
    setNotes("");
  };

  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = scheduleItems.find((i) => i.id === itemId);
    if (item) {
      setPaidAmount(item.expected_amount.toString());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Informar Pago</DialogTitle>
          <DialogDescription>
            Completa la información del pago realizado
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schedule-item">Período a Pagar *</Label>
            <Select value={selectedItemId} onValueChange={handleItemChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un período" />
              </SelectTrigger>
              <SelectContent>
                {scheduleItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {formatDateDisplay(item.period_date)} - Item {item.item} - $
                    {item.expected_amount.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fecha de Pago *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !paidDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paidDate ? formatDateToDisplay(paidDate) : "Selecciona una fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={paidDate}
                  onSelect={setPaidDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto Pagado *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Método de Pago *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="check">Cheque</SelectItem>
                <SelectItem value="card">Tarjeta</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Número de Referencia</Label>
            <Input
              id="reference"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Número de transferencia, cheque, etc."
            />
          </div>

          <div className="space-y-2">
            <Label>Comprobante de Pago</Label>
            <ReceiptUpload
              onUploadComplete={(url) => setReceiptUrl(url)}
              currentUrl={receiptUrl}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Información adicional sobre el pago"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Informar Pago"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
