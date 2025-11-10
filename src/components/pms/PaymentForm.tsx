import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePMS } from '@/contexts/PMSContext';
import { useState, useEffect } from 'react';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { CurrencyExchangeIndicator } from './CurrencyExchangeIndicator';
import { DollarSign } from 'lucide-react';

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
  exchange_rate: z.number().optional(),
}).refine((data) => {
  // Validar que si las monedas son diferentes, se requiere exchange_rate
  const contractCurrency = data.currency; // Esto se actualizará dinámicamente
  if (data.currency && contractCurrency && data.currency !== contractCurrency && data.status === 'paid' && !data.exchange_rate) {
    return false;
  }
  return true;
}, {
  message: "Se requiere tipo de cambio cuando la moneda de pago es diferente a la del contrato",
  path: ["exchange_rate"]
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
  const { convertPayment } = useCurrencyConverter();
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedContractData, setSelectedContractData] = useState<any>(null);
  const [contractCurrency, setContractCurrency] = useState<string>('ARS');

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
      .select('id, contract_number, status, cancelled_at, start_date, end_date');
    
    if (data) setContracts(data);
  };

  const fetchContractDetails = async (contractId: string) => {
    const { data } = await supabase
      .from('pms_contracts')
      .select('*, currency')
      .eq('id', contractId)
      .single();
    
    if (data) {
      setSelectedContractData(data);
      setContractCurrency(data.currency || 'ARS');
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      // Validación para contratos cancelados
      if (selectedContractData?.status === 'cancelled' && selectedContractData?.cancelled_at) {
        const paymentDueDate = new Date(data.due_date);
        const cancellationDate = new Date(selectedContractData.cancelled_at);
        
        if (paymentDueDate >= cancellationDate) {
          toast.error('No se puede registrar un pago para una cuota posterior a la fecha de cancelación');
          return;
        }
      }

      // Calcular conversión si hay tipo de cambio
      let conversion = null;
      if (data.status === 'paid' && data.paid_amount && data.paid_amount > 0) {
        try {
          conversion = convertPayment(
            data.paid_amount,
            data.currency,
            contractCurrency,
            data.exchange_rate
          );
        } catch (error: any) {
          toast.error('Error en conversión', { description: error.message });
          return;
        }
      }

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
        // Nuevos campos de conversión
        exchange_rate: conversion?.exchangeRate || null,
        contract_currency: contractCurrency,
        amount_in_contract_currency: conversion?.convertedAmount || null,
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
            {selectedContractData?.status === 'cancelled' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Este contrato fue cancelado el {new Date(selectedContractData.cancelled_at).toLocaleDateString()}.
                  Solo puede registrar pagos de cuotas vencidas antes de esa fecha.
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="contract_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contrato</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      fetchContractDetails(value);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar contrato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contracts.map(contract => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.contract_number}
                          {contract.status === 'cancelled' && ' (Cancelado)'}
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
                    <FormLabel>Moneda de Pago</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ARS">ARS</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Alert si las monedas son diferentes */}
            {form.watch('currency') !== contractCurrency && form.watch('status') === 'paid' && (
              <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  El contrato está en <strong>{contractCurrency}</strong> pero el pago es en <strong>{form.watch('currency')}</strong>.
                  Debes ingresar el tipo de cambio.
                </AlertDescription>
              </Alert>
            )}

            {/* Campo de tipo de cambio condicional */}
            {form.watch('currency') !== contractCurrency && form.watch('status') === 'paid' && (
              <FormField
                control={form.control}
                name="exchange_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Cambio *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={`1 ${contractCurrency} = ? ${form.watch('currency')}`}
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Valor tipo de Cambio Vendedor Banco Nación Argentina, del día de pago
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Mostrar cálculo de conversión en tiempo real */}
            {form.watch('currency') !== contractCurrency && 
             form.watch('exchange_rate') && 
             form.watch('paid_amount') && 
             form.watch('status') === 'paid' && (
              <CurrencyExchangeIndicator
                contractCurrency={contractCurrency}
                paymentCurrency={form.watch('currency')}
                exchangeRate={form.watch('exchange_rate')}
                originalAmount={form.watch('paid_amount') || 0}
                convertedAmount={
                  form.watch('currency') === 'ARS' && contractCurrency === 'USD'
                    ? (form.watch('paid_amount') || 0) / (form.watch('exchange_rate') || 1)
                    : (form.watch('paid_amount') || 0) * (form.watch('exchange_rate') || 1)
                }
              />
            )}

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
