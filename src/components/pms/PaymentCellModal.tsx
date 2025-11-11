import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDateForDB, formatDateToDisplay, formatDateDisplay } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/numberFormat';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { CurrencyExchangeIndicator } from './CurrencyExchangeIndicator';

const formSchema = z.object({
  paid_date: z.date({ required_error: 'Fecha de pago requerida' }),
  paid_amount: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  payment_currency: z.enum(['ARS', 'USD']),
  exchange_rate: z.number().optional(),
  payment_method: z.string().min(1, 'Método de pago requerido'),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => data.paid_amount > 0, {
  message: 'El monto debe ser mayor a 0',
  path: ['paid_amount'],
});

type FormValues = z.infer<typeof formSchema>;

interface PaymentCellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleItem: any;
  onSuccess: () => void;
  readOnly?: boolean;
}

export function PaymentCellModal({ open, onOpenChange, scheduleItem, onSuccess, readOnly = false }: PaymentCellModalProps) {
  const [loading, setLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [contractCurrency, setContractCurrency] = useState<string>('ARS');

  const pendingAmount = scheduleItem?.expected_amount || 0;
  const originalAmount = scheduleItem?.original_amount || scheduleItem?.expected_amount || 0;
  const accumulatedPaid = scheduleItem?.accumulated_paid_amount || 0;
  const isFullyPaid = pendingAmount <= 0.01;
  const shouldShowForm = !readOnly && !isFullyPaid;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paid_date: new Date(),
      paid_amount: pendingAmount,
      payment_currency: contractCurrency as 'ARS' | 'USD',
      exchange_rate: undefined,
      payment_method: 'transfer',
      reference_number: '',
      notes: '',
    },
  });

  const { convertPayment } = useCurrencyConverter();
  const paymentCurrency = form.watch('payment_currency');
  const exchangeRate = form.watch('exchange_rate');
  const paidAmount = form.watch('paid_amount');

  // Obtener moneda del contrato
  useEffect(() => {
    if (scheduleItem?.currency) {
      setContractCurrency(scheduleItem.currency);
      form.setValue('payment_currency', scheduleItem.currency as 'ARS' | 'USD');
    }
  }, [scheduleItem?.currency]);

  // Auto-calcular monto a pagar cuando cambia la moneda de pago o el tipo de cambio
  useEffect(() => {
    if (paymentCurrency !== contractCurrency && exchangeRate && exchangeRate > 0) {
      // Convertir el monto pendiente a la moneda de pago
      const convertedAmount = paymentCurrency === 'ARS' && contractCurrency === 'USD'
        ? pendingAmount * exchangeRate  // USD a ARS: multiplicar
        : paymentCurrency === 'USD' && contractCurrency === 'ARS'
        ? pendingAmount / exchangeRate  // ARS a USD: dividir
        : pendingAmount;
      
      form.setValue('paid_amount', parseFloat(convertedAmount.toFixed(2)));
    } else if (paymentCurrency === contractCurrency) {
      // Si vuelve a la misma moneda, restaurar el monto original
      form.setValue('paid_amount', pendingAmount);
    }
  }, [paymentCurrency, exchangeRate, pendingAmount, contractCurrency]);

  // Cargar historial de pagos cuando se abre el modal
  useEffect(() => {
    if (open && scheduleItem?.id) {
      loadPaymentHistory();
    }
  }, [open, scheduleItem?.id]);

  const loadPaymentHistory = async () => {
    if (!scheduleItem?.id) return;
    
    try {
      console.log('[PaymentCellModal] Loading payment history for schedule_item_id:', scheduleItem.id);

      // Buscar pagos vinculados directamente por schedule_item_id
      // NO usar filtros de fecha - los pagos pueden hacerse en cualquier mes
      const { data, error } = await supabase
        .from('pms_payments')
        .select('*')
        .eq('schedule_item_id', scheduleItem.id)
        .order('paid_date', { ascending: true });
      
      if (error) {
        console.error('[PaymentCellModal] Error loading payment history:', error);
      } else {
        console.log('[PaymentCellModal] Payment history loaded:', data);
        setPaymentHistory(data || []);
      }
    } catch (error) {
      console.error('[PaymentCellModal] Error loading payment history:', error);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);

      // Calcular el equivalente en moneda del contrato para validación
      let amountInContractCurrency = data.paid_amount;

      if (data.payment_currency !== contractCurrency && data.exchange_rate) {
        // Convertir de moneda de pago a moneda del contrato
        amountInContractCurrency = data.payment_currency === 'ARS' && contractCurrency === 'USD'
          ? data.paid_amount / data.exchange_rate  // ARS → USD: dividir
          : data.payment_currency === 'USD' && contractCurrency === 'ARS'
          ? data.paid_amount * data.exchange_rate  // USD → ARS: multiplicar
          : data.paid_amount;
      }

      // Validar que el monto (en moneda del contrato) no exceda el saldo pendiente
      if (amountInContractCurrency > pendingAmount) {
        toast.error(`El monto pagado excede el saldo pendiente de ${formatCurrency(pendingAmount, 'es', contractCurrency as 'ARS' | 'USD')}`);
        setLoading(false);
        return;
      }

      // Calcular nuevo accumulated_paid_amount (siempre en moneda del contrato)
      const newAccumulatedPaid = accumulatedPaid + amountInContractCurrency;
      const newPendingAmount = originalAmount - newAccumulatedPaid;
      const isFullyPaid = newPendingAmount <= 0.01; // Tolerancia de 1 centavo

      console.log('[PaymentCellModal] Creating payment:', {
        contract_id: scheduleItem.contract_id,
        paid_amount: data.paid_amount,
        schedule_item_id: scheduleItem.id,
        newAccumulatedPaid,
        newPendingAmount,
        isFullyPaid
      });

      // Validar tipo de cambio si las monedas son diferentes
      if (data.payment_currency !== contractCurrency && !data.exchange_rate) {
        toast.error('El tipo de cambio es requerido cuando la moneda de pago difiere de la moneda del contrato');
        setLoading(false);
        return;
      }

      // amountInContractCurrency ya está calculado arriba, no necesitamos convertPayment aquí

      // 1. Crear registro en pms_payments con notas correctamente formateadas
      const paymentNotes = data.notes 
        ? `${data.notes}\n[schedule_item:${scheduleItem.id}]`
        : `[schedule_item:${scheduleItem.id}]`;

      const paymentPayload = {
        contract_id: scheduleItem.contract_id,
        tenant_id: scheduleItem.tenant_id,
        due_date: scheduleItem.period_date,
        paid_date: formatDateForDB(data.paid_date),
        amount: originalAmount,
        paid_amount: data.paid_amount,
        currency: data.payment_currency,
        exchange_rate: data.exchange_rate || null,
        contract_currency: contractCurrency,
        amount_in_contract_currency: amountInContractCurrency,
        payment_type: 'rent',
        item: scheduleItem.item,
        payment_method: data.payment_method,
        reference_number: data.reference_number,
        notes: paymentNotes,
        status: 'paid',
        schedule_item_id: scheduleItem.id, // Vínculo directo al schedule item
      };

      const { data: payment, error: paymentError } = await supabase
        .from('pms_payments')
        .insert([paymentPayload])
        .select()
        .single();

      if (paymentError) {
        console.error('[PaymentCellModal] Error creating payment:', paymentError);
        throw paymentError;
      }

      console.log('[PaymentCellModal] Payment created successfully:', payment);

      // 2. ✅ CORRECCIÓN CRÍTICA: Solo actualizar accumulated_paid_amount y status
      // expected_amount NUNCA debe modificarse desde frontend, solo desde backend
      // cuando se aplican ajustes automáticos de contrato via rpc_apply_contract_adjustment
      const updatePayload: any = {
        accumulated_paid_amount: newAccumulatedPaid,
        status: isFullyPaid ? 'paid' : 'partial',
        updated_at: new Date().toISOString(),
      };

      // Solo actualizar payment_id si es el pago completo
      if (isFullyPaid) {
        updatePayload.payment_id = payment.id;
      }
      
      const { error: updateError } = await supabase
        .from('pms_payment_schedule_items')
        .update(updatePayload)
        .eq('id', scheduleItem.id);

      if (updateError) {
        console.error('[PaymentCellModal] Error updating schedule item:', updateError);
        throw updateError;
      }

      console.log('[PaymentCellModal] Schedule item updated successfully');

      const successMessage = isFullyPaid 
        ? 'Pago completo registrado exitosamente' 
        : `Pago parcial registrado. Saldo pendiente: ${formatCurrency(newPendingAmount, 'es', contractCurrency as 'ARS' | 'USD')}`;

      toast.success(successMessage);
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast.error('Error al registrar pago', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };


  if (!scheduleItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {readOnly 
              ? "Detalle del Pago" 
              : isFullyPaid 
                ? "Detalle del Pago" 
                : "Registrar Pago"}
          </DialogTitle>
          <DialogDescription>
            {readOnly 
              ? `Información del calendario - ${formatDateDisplay(scheduleItem.period_date)} - Item ${scheduleItem.item}`
              : isFullyPaid 
                ? `Este pago ya está completamente registrado - ${formatDateDisplay(scheduleItem.period_date)}`
                : `${formatDateDisplay(scheduleItem.period_date)} - Item ${scheduleItem.item}`}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-lg space-y-3 mb-4">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-sm font-semibold">Resumen del Ítem</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Monto Original:</span>
            <span className="font-semibold">{formatCurrency(originalAmount, 'es', contractCurrency as 'ARS' | 'USD')}</span>
          </div>
          
          {accumulatedPaid > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Ya Pagado:</span>
              <span className="font-medium text-green-600">{formatCurrency(accumulatedPaid, 'es', contractCurrency as 'ARS' | 'USD')}</span>
            </div>
          )}
          
          <div className="flex justify-between pt-2 border-t">
            <span className="text-sm font-medium">Saldo Pendiente:</span>
            <span className="font-bold text-primary">{formatCurrency(pendingAmount, 'es', contractCurrency as 'ARS' | 'USD')}</span>
          </div>

          <div className="pt-2 border-t">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-muted-foreground">Propietario:</span>
              <span className="font-medium">{scheduleItem.owner?.full_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Porcentaje:</span>
              <span className="font-medium">{scheduleItem.owner_percentage}%</span>
            </div>
          </div>
        </div>

        {paymentHistory.length > 0 && (
          <div className="bg-muted/50 p-3 rounded-lg mb-4">
            <div className="text-xs font-semibold mb-2">Historial de Pagos Parciales</div>
            <div className="space-y-1">
              {paymentHistory.map((payment, index) => (
                <div key={payment.id} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {formatDateDisplay(payment.paid_date)}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(payment.paid_amount, 'es', contractCurrency as 'ARS' | 'USD')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {readOnly && !isFullyPaid && (
          <Alert className="border-blue-200 bg-blue-50 mb-4">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              Para registrar este pago, dirígete a la sección <strong>Pagos</strong> del menú principal.
            </AlertDescription>
          </Alert>
        )}

        {shouldShowForm && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="paid_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Pago</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            formatDateToDisplay(field.value)
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paid_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto a Pagar</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      max={pendingAmount}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground mt-1">
                    {paymentCurrency === contractCurrency ? (
                      <>Máximo: {formatCurrency(pendingAmount, 'es', contractCurrency as 'ARS' | 'USD')}</>
                    ) : (
                      <>
                        Saldo pendiente: {formatCurrency(pendingAmount, 'es', contractCurrency as 'ARS' | 'USD')}
                        {exchangeRate && ` (≈ ${formatCurrency(
                          contractCurrency === 'USD' ? pendingAmount * exchangeRate : pendingAmount / exchangeRate,
                          'es',
                          paymentCurrency as 'ARS' | 'USD'
                        )})`}
                      </>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda de Pago</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ARS">Pesos Argentinos (ARS)</SelectItem>
                      <SelectItem value="USD">Dólares (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {paymentCurrency !== contractCurrency && (
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 py-2">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                  El contrato está en <strong>{contractCurrency}</strong> pero el pago es en <strong>{paymentCurrency}</strong>. 
                  Debe ingresar el tipo de cambio del día.
                </AlertDescription>
              </Alert>
            )}

            {paymentCurrency !== contractCurrency && (
              <FormField
                control={form.control}
                name="exchange_rate"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>
                      Tipo de Cambio *
                      <span className="text-xs text-muted-foreground ml-2">
                        ({paymentCurrency === 'ARS' ? '1 USD = ? ARS' : '1 ARS = ? USD'})
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={paymentCurrency === 'ARS' ? "Ej: 1200" : "Ej: 0.00083"}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <div className="text-xs text-muted-foreground">
                      Valor Tipo de Cambio Vendedor Banco Nación Argentina, del día de pago
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {paymentCurrency !== contractCurrency && exchangeRate && (
              <CurrencyExchangeIndicator
                contractCurrency={contractCurrency}
                paymentCurrency={paymentCurrency}
                exchangeRate={exchangeRate}
                originalAmount={pendingAmount}
                convertedAmount={paidAmount}
              />
            )}

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pago</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="check">Cheque</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Referencia (Opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: TRF-123456" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Observaciones adicionales..." rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Registrar Pago'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        )}

        {!shouldShowForm && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
