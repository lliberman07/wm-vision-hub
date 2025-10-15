import { useState } from 'react';
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
  paid_amount: z.number().min(0, 'Monto debe ser mayor a 0'),
  payment_method: z.string().min(1, 'Método de pago requerido'),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paid_date: new Date(),
      paid_amount: scheduleItem?.expected_amount || 0,
      payment_method: 'transfer',
      reference_number: '',
      notes: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);

      // 1. Crear/actualizar registro en pms_payments
      const paymentPayload = {
        contract_id: scheduleItem.contract_id,
        tenant_id: scheduleItem.tenant_id,
        due_date: scheduleItem.period_date,
        paid_date: formatDateForDB(data.paid_date),
        amount: scheduleItem.expected_amount,
        paid_amount: data.paid_amount,
        currency: 'ARS',
        payment_type: 'rent',
        item: scheduleItem.item,
        payment_method: data.payment_method,
        reference_number: data.reference_number,
        notes: data.notes,
        status: data.paid_amount >= scheduleItem.expected_amount ? 'paid' : 'partial',
      };

      const { data: payment, error: paymentError } = await supabase
        .from('pms_payments')
        .insert([paymentPayload])
        .select()
        .single();

      if (paymentError) throw paymentError;

      // 2. Actualizar schedule item con payment_id y status
      const newStatus = data.paid_amount >= scheduleItem.expected_amount ? 'paid' : 'partial';
      
      const { error: updateError } = await supabase
        .from('pms_payment_schedule_items')
        .update({
          payment_id: payment.id,
          status: newStatus,
        })
        .eq('id', scheduleItem.id);

      if (updateError) throw updateError;

      toast.success('Pago registrado exitosamente');
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

        <div className="bg-muted p-4 rounded-lg space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Monto Esperado:</span>
            <span className="font-semibold">{formatCurrency(scheduleItem.expected_amount, 'es', 'ARS')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Propietario:</span>
            <span className="font-medium">{scheduleItem.owner?.full_name || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Porcentaje:</span>
            <span className="font-medium">{scheduleItem.owner_percentage}%</span>
          </div>
        </div>

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
                  <FormLabel>Monto Pagado</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
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
