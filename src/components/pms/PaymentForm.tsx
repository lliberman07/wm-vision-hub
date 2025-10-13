import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePMS } from '@/contexts/PMSContext';
import { useState, useEffect } from 'react';

const formSchema = z.object({
  contract_id: z.string().min(1, 'Contrato requerido'),
  payment_type: z.string().min(1, 'Tipo de pago requerido'),
  amount: z.number().min(0, 'Monto debe ser mayor a 0'),
  currency: z.string().min(1, 'Moneda requerida'),
  due_date: z.string().min(1, 'Fecha de vencimiento requerida'),
  paid_date: z.string().optional(),
  paid_amount: z.number().min(0).optional(),
  status: z.string().min(1, 'Estado requerido'),
  payment_method: z.string().optional(),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
  item: z.string().optional(),
  porcentaje: z.number().min(0).max(100).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  payment?: any;
}

export function PaymentForm({ open, onOpenChange, onSuccess, payment }: PaymentFormProps) {
  const { currentTenant } = usePMS();
  const [contracts, setContracts] = useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contract_id: '',
      payment_type: 'rent',
      amount: 0,
      currency: 'ARS',
      due_date: '',
      paid_date: '',
      paid_amount: 0,
      status: 'pending',
      payment_method: '',
      reference_number: '',
      notes: '',
      item: 'UNICO',
      porcentaje: 100,
    },
  });

  useEffect(() => {
    if (open) {
      fetchContracts();
      if (payment) {
        form.reset({
          contract_id: payment.contract_id || '',
          payment_type: payment.payment_type || 'rent',
          amount: payment.amount || 0,
          currency: payment.currency || 'ARS',
          due_date: payment.due_date || '',
          paid_date: payment.paid_date || '',
          paid_amount: payment.paid_amount || 0,
          status: payment.status || 'pending',
          payment_method: payment.payment_method || '',
          reference_number: payment.reference_number || '',
          notes: payment.notes || '',
          item: payment.item || 'UNICO',
          porcentaje: payment.porcentaje || 100,
        });
      } else {
        form.reset({
          contract_id: '',
          payment_type: 'rent',
          amount: 0,
          currency: 'ARS',
          due_date: '',
          paid_date: '',
          paid_amount: 0,
          status: 'pending',
          payment_method: '',
          reference_number: '',
          notes: '',
          item: 'UNICO',
          porcentaje: 100,
        });
      }
    }
  }, [open, payment, form]);

  const fetchContracts = async () => {
    const { data } = await supabase
      .from('pms_contracts')
      .select('id, contract_number');
    
    if (data) setContracts(data);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const payload: any = {
        contract_id: data.contract_id,
        payment_type: data.payment_type,
        amount: data.amount,
        currency: data.currency,
        due_date: data.due_date,
        paid_date: data.paid_date || null,
        paid_amount: data.paid_amount || 0,
        status: data.status,
        payment_method: data.payment_method,
        reference_number: data.reference_number,
        notes: data.notes,
        item: data.item,
        porcentaje: data.porcentaje,
        tenant_id: currentTenant?.id,
      };

      let paymentId = payment?.id;

      if (payment?.id) {
        const { error } = await supabase
          .from('pms_payments')
          .update(payload)
          .eq('id', payment.id);
        
        if (error) throw error;
        toast.success('Pago actualizado');
      } else {
        const { error } = await supabase
          .from('pms_payments')
          .insert([payload]);
        
        if (error) throw error;
        toast.success('Pago registrado');
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast.error('Error', { description: error.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{payment ? 'Editar' : 'Registrar'} Pago</DialogTitle>
          <DialogDescription>
            Completa la información del pago
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="contract_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contrato</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar contrato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contracts.map(contract => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.contract_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Pago</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="rent">Alquiler</SelectItem>
                        <SelectItem value="deposit">Depósito</SelectItem>
                        <SelectItem value="utilities">Servicios</SelectItem>
                        <SelectItem value="maintenance">Mantenimiento</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="paid">Pagado</SelectItem>
                        <SelectItem value="partial">Parcial</SelectItem>
                        <SelectItem value="overdue">Vencido</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto Total</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ARS">ARS</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Vencimiento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paid_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Pago (opcional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paid_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto Pagado</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(e.target.valueAsNumber)}
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
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Efectivo</SelectItem>
                        <SelectItem value="transfer">Transferencia</SelectItem>
                        <SelectItem value="check">Cheque</SelectItem>
                        <SelectItem value="card">Tarjeta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reference_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Referencia (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="REF-001" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="item"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="UNICO">ÚNICO</SelectItem>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="porcentaje"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porcentaje (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        max="100"
                        {...field} 
                        onChange={e => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {payment ? 'Actualizar' : 'Registrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
