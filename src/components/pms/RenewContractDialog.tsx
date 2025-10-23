import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CalendarIcon, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { formatDateForDB, parseDateFromDB, formatDateToDisplay } from '@/utils/dateUtils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePMS } from '@/contexts/PMSContext';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  start_date: z.date({ required_error: 'Fecha inicio requerida' }),
  end_date: z.date({ required_error: 'Fecha fin requerida' }),
  monthly_rent: z.number().min(0, 'Renta debe ser mayor a 0'),
  currency: z.string().min(1, 'Moneda requerida'),
  deposit_amount: z.number().min(0).optional(),
  deposit_currency: z.string().optional(),
  guarantee_type: z.string().optional(),
  guarantee_details: z.string().optional(),
  payment_day: z.number().min(1).max(31).optional(),
  contract_type: z.string().optional(),
  adjustment_type: z.string().optional(),
  special_clauses: z.string().optional(),
  tipo_contrato: z.string().optional(),
  monto_a: z.number().min(0).optional(),
  monto_b: z.number().min(0).optional(),
  forma_pago_item_a: z.string().optional(),
  detalle_otro_item_a: z.string().optional(),
  forma_pago_item_b: z.string().optional(),
  indice_ajuste: z.string().optional(),
  frecuencia_ajuste: z.string().optional(),
  frecuencia_factura: z.string().optional(),
  fecha_primer_ajuste: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RenewContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  contract?: any;
}

export function RenewContractDialog({ open, onOpenChange, onSuccess, contract }: RenewContractDialogProps) {
  const { currentTenant } = usePMS();
  const [loading, setLoading] = useState(false);
  const [renewalCode, setRenewalCode] = useState('');
  const [renewalInfo, setRenewalInfo] = useState<{
    can_renew: boolean;
    overdue_count: number;
    days_since_end: number;
    has_overdue_warning: boolean;
    end_date: string;
  } | null>(null);
  const [showOverdueWarning, setShowOverdueWarning] = useState(false);
  const [autoStartDate, setAutoStartDate] = useState<Date | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_date: undefined,
      end_date: undefined,
      monthly_rent: undefined,
      currency: 'ARS',
      deposit_amount: undefined,
      deposit_currency: 'ARS',
      guarantee_type: undefined,
      guarantee_details: '',
      payment_day: 10,
      contract_type: 'residential',
      adjustment_type: 'none',
      special_clauses: '',
      tipo_contrato: 'CONTRATO',
      monto_a: undefined,
      monto_b: undefined,
      forma_pago_item_a: 'Efectivo',
      detalle_otro_item_a: '',
      forma_pago_item_b: 'Efectivo',
      indice_ajuste: 'none',
      frecuencia_ajuste: '',
      frecuencia_factura: 'Mensual',
      fecha_primer_ajuste: undefined,
    },
  });

  const calculateRenewalStartDate = (contractEndDate: string): Date => {
    const endDate = parseDateFromDB(contractEndDate);
    endDate.setDate(endDate.getDate() + 1);
    return endDate;
  };

  useEffect(() => {
    if (open && contract?.id) {
      checkRenewalEligibility();
      generateRenewalCode();
      populateFormFromContract();
    }
  }, [open, contract?.id]);

  const checkRenewalEligibility = async () => {
    try {
      const { data, error } = await supabase
        .rpc('can_renew_contract', { contract_id_param: contract.id });
      
      if (error) throw error;
      
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const renewalData = data as {
          can_renew: boolean;
          overdue_count: number;
          days_since_end: number;
          has_overdue_warning: boolean;
          end_date: string;
        };
        setRenewalInfo(renewalData);
        setShowOverdueWarning(renewalData.overdue_count > 0);
      }
    } catch (error: any) {
      console.error('Error checking renewal eligibility:', error);
    }
  };

  const generateRenewalCode = async () => {
    try {
      const { data, error } = await supabase
        .rpc('generate_renewal_code', { parent_contract_id_param: contract.id });
      
      if (error) throw error;
      setRenewalCode(data || '');
    } catch (error: any) {
      console.error('Error generating renewal code:', error);
    }
  };

  const populateFormFromContract = () => {
    if (!contract) return;

    const startDate = calculateRenewalStartDate(contract.end_date);
    setAutoStartDate(startDate);

    form.reset({
      start_date: startDate,
      end_date: undefined,
      monthly_rent: contract.monthly_rent || 0,
      currency: contract.currency || 'ARS',
      deposit_amount: contract.deposit_amount || 0,
      deposit_currency: contract.deposit_currency || 'ARS',
      guarantee_type: contract.guarantee_type || undefined,
      guarantee_details: contract.guarantee_details || '',
      payment_day: contract.payment_day || 10,
      contract_type: contract.contract_type || 'residential',
      adjustment_type: contract.adjustment_type || 'none',
      special_clauses: contract.special_clauses || '',
      tipo_contrato: contract.tipo_contrato || 'CONTRATO',
      monto_a: contract.monto_a || 0,
      monto_b: contract.monto_b || 0,
      forma_pago_item_a: contract.forma_pago_item_a || 'Efectivo',
      detalle_otro_item_a: contract.detalle_otro_item_a || '',
      forma_pago_item_b: contract.forma_pago_item_b || 'Efectivo',
      indice_ajuste: contract.indice_ajuste || 'none',
      frecuencia_ajuste: contract.frecuencia_ajuste || '',
      frecuencia_factura: contract.frecuencia_factura || 'Mensual',
      fecha_primer_ajuste: contract.fecha_primer_ajuste ? parseDateFromDB(contract.fecha_primer_ajuste) : undefined,
    });
  };

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const { data: isValid, error: validationError } = await supabase
        .rpc('validate_renewal_dates', {
          parent_contract_id_param: contract.id,
          proposed_start_date: formatDateForDB(data.start_date)
        });

      if (validationError || !isValid) {
        toast.error('Error de validación', {
          description: 'La fecha de inicio debe ser el día siguiente a la finalización del contrato anterior'
        });
        return;
      }

      const renewalPayload = {
        contract_number: renewalCode,
        base_contract_number: contract.base_contract_number || contract.contract_number,
        renewal_count: (contract.renewal_count || 0) + 1,
        is_renewal: true,
        parent_contract_id: contract.id,
        
        property_id: contract.property_id,
        tenant_renter_id: contract.tenant_renter_id,
        start_date: formatDateForDB(data.start_date),
        end_date: formatDateForDB(data.end_date),
        monthly_rent: data.monthly_rent,
        currency: data.currency,
        deposit_amount: data.deposit_amount,
        deposit_currency: data.deposit_currency || 'ARS',
        guarantee_type: data.guarantee_type || null,
        guarantee_details: data.guarantee_details || null,
        payment_day: data.payment_day,
        contract_type: data.contract_type,
        adjustment_type: data.adjustment_type,
        status: 'draft',
        special_clauses: data.special_clauses,
        tipo_contrato: data.tipo_contrato,
        monto_a: data.monto_a || data.monthly_rent,
        monto_b: data.monto_b || 0,
        forma_pago_item_a: data.forma_pago_item_a,
        detalle_otro_item_a: data.detalle_otro_item_a,
        forma_pago_item_b: data.forma_pago_item_b,
        indice_ajuste: data.indice_ajuste,
        frecuencia_ajuste: data.frecuencia_ajuste,
        frecuencia_factura: data.frecuencia_factura,
        fecha_primer_ajuste: data.fecha_primer_ajuste ? formatDateForDB(data.fecha_primer_ajuste) : null,
        tenant_id: currentTenant?.id,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      };

      const { error } = await supabase
        .from('pms_contracts')
        .insert([renewalPayload]);

      if (error) throw error;

      toast.success('Contrato de renovación creado', {
        description: `Código: ${renewalCode}. Revisa el borrador y actívalo cuando esté listo.`,
      });

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast.error('Error al renovar contrato', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const daysSinceEnd = renewalInfo?.days_since_end || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Renovación de Contrato
          </DialogTitle>
          <DialogDescription>
            Crea un contrato de renovación basado en el contrato existente
          </DialogDescription>
        </DialogHeader>

        {showOverdueWarning && renewalInfo && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>⚠️ Advertencia: Pagos Vencidos</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  Este contrato tiene <strong>{renewalInfo.overdue_count}</strong> pago(s) vencido(s) sin regularizar.
                </p>
                <p className="text-sm">Al crear esta renovación:</p>
                <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                  <li>Se generará un nuevo contrato independiente</li>
                  <li>Los pagos vencidos del contrato anterior quedarán pendientes</li>
                  <li>El nuevo contrato comenzará el {autoStartDate && formatDateToDisplay(autoStartDate)}</li>
                  <li>Se generarán nuevas líneas de pago desde la fecha de inicio</li>
                  <li className="text-destructive font-semibold">
                    Algunos pagos pueden estar vencidos desde la creación
                  </li>
                </ul>
                <p className="text-sm font-semibold mt-2">
                  ¿Deseas continuar con la renovación de todas formas?
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle>Información del Contrato</AlertTitle>
          <AlertDescription>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-semibold">Contrato original:</span>
                  <br />
                  <Badge variant="outline">{contract?.contract_number}</Badge>
                </div>
                <div>
                  <span className="font-semibold">Nuevo código:</span>
                  <br />
                  <Badge variant="secondary">{renewalCode}</Badge>
                </div>
              </div>
              <Separator />
              <div>
                <span className="font-semibold">Finaliza el:</span>{' '}
                {contract?.end_date && formatDateToDisplay(parseDateFromDB(contract.end_date))}
              </div>
              <div className="text-blue-700 dark:text-blue-300">
                → La renovación comenzará automáticamente el{' '}
                <span className="font-bold">
                  {autoStartDate && formatDateToDisplay(autoStartDate)}
                </span>
              </div>
              {daysSinceEnd > 0 && (
                <div className="text-orange-600 font-medium">
                  ⚠️ El contrato finalizó hace {daysSinceEnd} día(s)
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Inicio *</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        value={field.value ? formatDateToDisplay(field.value) : ''}
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                    </FormControl>
                    <FormDescription className="text-blue-600 text-xs">
                      ✓ Calculada automáticamente: día siguiente al fin del contrato anterior
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Fin *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn(!field.value && 'text-muted-foreground')}>
                            {field.value ? formatDateToDisplay(field.value) : 'Seleccionar'}
                            <CalendarIcon className="ml-auto h-4 w-4" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="monthly_rent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renta Mensual *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                    <FormLabel>Moneda *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ARS">ARS (Pesos)</SelectItem>
                        <SelectItem value="USD">USD (Dólares)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="special_clauses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cláusulas Especiales</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creando...' : 'Crear Renovación'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
