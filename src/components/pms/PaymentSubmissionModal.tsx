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
import { CalendarIcon, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateForDB, formatDateToDisplay, formatDateDisplay } from "@/utils/dateUtils";
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { CurrencyExchangeIndicator } from './CurrencyExchangeIndicator';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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
  const { convertPayment } = useCurrencyConverter();
  const [loading, setLoading] = useState(false);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [paidDate, setPaidDate] = useState<Date>();
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentCurrency, setPaymentCurrency] = useState("ARS");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [contractCurrency, setContractCurrency] = useState<string>('ARS');
  const [exchangeRate, setExchangeRate] = useState("");

  // Hook para obtener tipo de cambio automático
  const { rate: suggestedRate, loading: rateLoading, source: rateSource } = useExchangeRate({
    date: paidDate ? new Date(paidDate).toISOString().split('T')[0] : undefined,
    sourceType: 'oficial',
    preferredType: 'sell'
  });

  // Auto-completar tipo de cambio cuando hay una sugerencia y las monedas son diferentes
  useEffect(() => {
    if (suggestedRate && 
        paymentCurrency !== contractCurrency && 
        !exchangeRate) {
      setExchangeRate(suggestedRate.toString());
    }
  }, [suggestedRate, paymentCurrency, contractCurrency]);

  useEffect(() => {
    if (open) {
      fetchContractCurrency();
      fetchPendingItems();
    }
  }, [open, contractId]);

  const fetchContractCurrency = async () => {
    try {
      const { data, error } = await supabase
        .from('pms_contracts')
        .select('currency')
        .eq('id', contractId)
        .single();
      
      if (error) throw error;
      if (data) {
        setContractCurrency(data.currency || 'ARS');
      }
    } catch (error) {
      console.error('Error fetching contract currency:', error);
    }
  };

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

    // Validar tipo de cambio si las monedas son diferentes
    if (paymentCurrency !== contractCurrency && !exchangeRate) {
      toast.error("Debes ingresar el tipo de cambio");
      return;
    }

    try {
      setLoading(true);

      // Calcular conversión si es necesario
      let conversion = null;
      if (paymentCurrency !== contractCurrency) {
        try {
          conversion = convertPayment(
            parseFloat(paidAmount),
            paymentCurrency,
            contractCurrency,
            parseFloat(exchangeRate)
          );
        } catch (error: any) {
          toast.error('Error en conversión', { description: error.message });
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase.from("pms_payment_submissions").insert({
        contract_id: contractId,
        tenant_id: tenantId,
        schedule_item_id: selectedItemId,
        submitted_by: user?.id,
        paid_date: formatDateForDB(paidDate),
        paid_amount: parseFloat(paidAmount),
        payment_currency: paymentCurrency,
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        receipt_url: receiptUrl || null,
        notes: notes || null,
        status: "pending",
        // Agregar información de conversión
        exchange_rate: conversion?.exchangeRate || null,
        contract_currency: contractCurrency,
        amount_in_contract_currency: conversion?.convertedAmount || parseFloat(paidAmount),
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
    setPaymentCurrency("ARS");
    setPaymentMethod("");
    setReferenceNumber("");
    setReceiptUrl("");
    setNotes("");
    setExchangeRate("");
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
            <Label htmlFor="payment-currency">Moneda de Pago *</Label>
            <Select value={paymentCurrency} onValueChange={setPaymentCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS">Pesos (ARS)</SelectItem>
                <SelectItem value="USD">Dólares (USD)</SelectItem>
              </SelectContent>
            </Select>
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

          {paymentCurrency !== contractCurrency && (
            <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                El contrato está en <strong>{contractCurrency}</strong> pero el pago es en <strong>{paymentCurrency}</strong>.
                {suggestedRate && !rateLoading && (
                  <span> Tipo de cambio sugerido: <strong>{suggestedRate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {paymentCurrency !== contractCurrency && (
            <div className="space-y-2">
              <Label htmlFor="exchange-rate" className="flex items-center gap-2">
                Tipo de Cambio *
                {suggestedRate && !rateLoading && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Sugerido: {suggestedRate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Badge>
                )}
              </Label>
              <Input
                id="exchange-rate"
                type="number"
                step="0.01"
                placeholder={suggestedRate ? suggestedRate.toString() : `1 ${contractCurrency} = ? ${paymentCurrency}`}
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {rateSource !== 'no-data' && rateSource !== 'error' && rateSource !== 'no-tenant' ? (
                  <>
                    <TrendingUp className="h-3 w-3" />
                    Dólar {rateSource} (DolarAPI.com)
                  </>
                ) : rateLoading ? (
                  'Cargando tipo de cambio...'
                ) : (
                  'Ingrese el tipo de cambio del día de pago'
                )}
              </p>
              {exchangeRate && paidAmount && (
                <CurrencyExchangeIndicator
                  contractCurrency={contractCurrency}
                  paymentCurrency={paymentCurrency}
                  exchangeRate={parseFloat(exchangeRate)}
                  originalAmount={parseFloat(paidAmount)}
                  convertedAmount={
                    paymentCurrency === 'ARS' && contractCurrency === 'USD'
                      ? parseFloat(paidAmount) / parseFloat(exchangeRate)
                      : parseFloat(paidAmount) * parseFloat(exchangeRate)
                  }
                />
              )}
            </div>
          )}

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
