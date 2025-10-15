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
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDateForDB, formatDateToDisplay, formatDateDisplay } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/numberFormat';

const formSchema = z.object({
  paid_date: z.date({ required_error: 'Fecha de pago requerida' }),
  paid_amount: z.number().min(0.01, 'Monto debe ser mayor a 0'),
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
}

export function PaymentCellModal({ open, onOpenChange, scheduleItem, onSuccess }: PaymentCellModalProps) {
  const [loading, setLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  const pendingAmount = scheduleItem?.expected_amount || 0;
  const originalAmount = scheduleItem?.original_amount || scheduleItem?.expected_amount || 0;
  const accumulatedPaid = scheduleItem?.accumulated_paid_amount || 0;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paid_date: new Date(),
      paid_amount: pendingAmount,
      payment_method: 'transfer',
      reference_number: '',
      notes: '',
    },
  });

  // Cargar historial de pagos cuando se abre el modal
  useEffect(() => {
    if (open && scheduleItem?.id) {
      loadPaymentHistory();
    }
  }, [open, scheduleItem?.id]);

  const loadPaymentHistory = async () => {
    if (!scheduleItem?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('pms_payments')
        .select('*')
        .eq('contract_id', scheduleItem.contract_id)
        .eq('item', scheduleItem.item)
        .contains('notes', `schedule_item:${scheduleItem.id}`)
        .order('paid_date', { ascending: false });

      if (!error && data) {
        setPaymentHistory(data);
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);

      // Validar que el monto no exceda el saldo pendiente
      if (data.paid_amount > pendingAmount) {
        toast.error('El monto pagado no puede exceder el saldo pendiente');
        setLoading(false);
        return;
      }

      // Calcular nuevo accumulated_paid_amount
      const newAccumulatedPaid = accumulatedPaid + data.paid_amount;
      const newPendingAmount = originalAmount - newAccumulatedPaid;
      const isFullyPaid = newPendingAmount <= 0.01; // Tolerancia de 1 centavo

      // 1. Crear registro en pms_payments
      const paymentPayload = {
        contract_id: scheduleItem.contract_id,
        tenant_id: scheduleItem.tenant_id,
        due_date: scheduleItem.period_date,
        paid_date: formatDateForDB(data.paid_date),
        amount: originalAmount,
        paid_amount: data.paid_amount,
        currency: 'ARS',
        payment_type: 'rent',
        item: scheduleItem.item,
        payment_method: data.payment_method,
        reference_number: data.reference_number,
        notes: `${data.notes || ''}\nschedule_item:${scheduleItem.id}`,
        status: isFullyPaid ? 'paid' : 'partial',
      };

      const { data: payment, error: paymentError } = await supabase
        .from('pms_payments')
        .insert([paymentPayload])
        .select()
        .single();

      if (paymentError) throw paymentError;

      // 2. Actualizar schedule item con montos acumulados
      const updatePayload: any = {
        accumulated_paid_amount: newAccumulatedPaid,
        expected_amount: Math.max(0, newPendingAmount),
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

      if (updateError) throw updateError;

      const successMessage = isFullyPaid 
        ? 'Pago completo registrado exitosamente' 
        : `Pago parcial registrado. Saldo pendiente: ${formatCurrency(newPendingAmount, 'es', 'ARS')}`;

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>
            {formatDateDisplay(scheduleItem.period_date)} - Item {scheduleItem.item}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-lg space-y-3 mb-4">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-sm font-semibold">Resumen del Ítem</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Monto Original:</span>
            <span className="font-semibold">{formatCurrency(originalAmount, 'es', 'ARS')}</span>
          </div>
          
          {accumulatedPaid > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Ya Pagado:</span>
              <span className="font-medium text-green-600">{formatCurrency(accumulatedPaid, 'es', 'ARS')}</span>
            </div>
          )}
          
          <div className="flex justify-between pt-2 border-t">
            <span className="text-sm font-medium">Saldo Pendiente:</span>
            <span className="font-bold text-primary">{formatCurrency(pendingAmount, 'es', 'ARS')}</span>
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
                    {formatCurrency(payment.paid_amount, 'es', 'ARS')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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
                    Máximo: {formatCurrency(pendingAmount, 'es', 'ARS')}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Registrar Pago'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
