import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePMS } from '@/contexts/PMSContext';
import { useState, useEffect } from 'react';
import { ContractPaymentMethods } from './ContractPaymentMethods';

const formSchema = z.object({
  contract_number: z.string().min(1, 'Número de contrato requerido'),
  property_id: z.string().min(1, 'Propiedad requerida'),
  tenant_renter_id: z.string().min(1, 'Inquilino requerido'),
  start_date: z.string().min(1, 'Fecha inicio requerida'),
  end_date: z.string().min(1, 'Fecha fin requerida'),
  monthly_rent: z.number().min(0, 'Renta debe ser mayor a 0'),
  currency: z.string().min(1, 'Moneda requerida'),
  deposit_amount: z.number().min(0).optional(),
  deposit_currency: z.string().optional(),
  guarantee_type: z.string().optional(),
  guarantee_details: z.string().optional(),
  payment_day: z.number().min(1).max(31).optional(),
  contract_type: z.string().optional(),
  adjustment_type: z.string().optional(),
  status: z.string().min(1, 'Estado requerido'),
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
  fecha_primer_ajuste: z.string().optional(),
}).refine((data) => {
  if (data.forma_pago_item_a === 'Otro' && !data.detalle_otro_item_a) {
    return false;
  }
  return true;
}, {
  message: 'Debe especificar el detalle cuando selecciona "Otro"',
  path: ['detalle_otro_item_a'],
}).refine((data) => {
  if (data.guarantee_type && !data.guarantee_details?.trim()) {
    return false;
  }
  return true;
}, {
  message: 'Debe especificar los detalles de la garantía',
  path: ['guarantee_details'],
});

type FormValues = z.infer<typeof formSchema>;

interface ContractFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  contract?: any;
}

export function ContractForm({ open, onOpenChange, onSuccess, contract }: ContractFormProps) {
  const { currentTenant } = usePMS();
  const [properties, setProperties] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [propertyOwners, setPropertyOwners] = useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contract_number: '',
      property_id: '',
      tenant_renter_id: '',
      start_date: '',
      end_date: '',
      monthly_rent: undefined,
      currency: 'ARS',
      deposit_amount: undefined,
      deposit_currency: 'ARS',
      guarantee_type: undefined,
      guarantee_details: '',
      payment_day: 10,
      contract_type: 'residential',
      adjustment_type: 'none',
      status: 'draft',
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
      fecha_primer_ajuste: '',
    },
  });

  useEffect(() => {
    if (open) {
      fetchData();
      if (contract) {
        form.reset({
          contract_number: contract.contract_number || '',
          property_id: contract.property_id || '',
          tenant_renter_id: contract.tenant_renter_id || '',
          start_date: contract.start_date || '',
          end_date: contract.end_date || '',
          monthly_rent: contract.monthly_rent || 0,
          currency: contract.currency || 'ARS',
          deposit_amount: contract.deposit_amount || 0,
          deposit_currency: contract.deposit_currency || 'ARS',
          guarantee_type: contract.guarantee_type || undefined,
          guarantee_details: contract.guarantee_details || '',
          payment_day: contract.payment_day || 10,
          contract_type: contract.contract_type || 'residential',
          adjustment_type: contract.adjustment_type || 'none',
          status: contract.status || 'draft',
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
          fecha_primer_ajuste: contract.fecha_primer_ajuste || '',
        });
        if (contract.property_id) {
          fetchPropertyOwners(contract.property_id);
        }
      } else {
        form.reset({
          contract_number: '',
          property_id: '',
          tenant_renter_id: '',
          start_date: '',
          end_date: '',
          monthly_rent: undefined,
          currency: 'ARS',
          deposit_amount: undefined,
          deposit_currency: 'ARS',
          guarantee_type: undefined,
          guarantee_details: '',
          payment_day: 10,
          contract_type: 'residential',
          adjustment_type: 'none',
          status: 'draft',
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
          fecha_primer_ajuste: '',
        });
      }
    }
  }, [open, contract, form]);

  // Automatic calculation logic for monto_a and monto_b
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      const monthlyRent = value.monthly_rent || 0;
      const montoA = value.monto_a || 0;
      const montoB = value.monto_b || 0;

      // Solo recalcular si se modificó monto_a
      if (name === 'monto_a') {
        if (montoA > 0 && montoA <= monthlyRent) {
          const newMontoB = monthlyRent - montoA;
          if (newMontoB !== montoB) {
            form.setValue('monto_b', newMontoB, { shouldValidate: false });
          }
        } else if (montoA === 0) {
          form.setValue('monto_b', 0, { shouldValidate: false });
        }
      }

      // Si se modificó monthly_rent, recalcular monto_b basado en monto_a
      if (name === 'monthly_rent' && montoA > 0 && montoA <= monthlyRent) {
        const newMontoB = monthlyRent - montoA;
        if (newMontoB !== montoB) {
          form.setValue('monto_b', newMontoB, { shouldValidate: false });
        }
      }

      // Validación: La suma no puede exceder monthly_rent
      if (montoA + montoB > monthlyRent && monthlyRent > 0) {
        toast.error('La suma de Monto Item A + Monto Item B no puede exceder la Renta Mensual');
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const fetchData = async () => {
    const [propsRes, tenantsRes] = await Promise.all([
      supabase.from('pms_properties').select('id, code, address'),
      supabase.from('pms_tenants_renters').select('id, full_name'),
    ]);

    if (propsRes.data) setProperties(propsRes.data);
    if (tenantsRes.data) setTenants(tenantsRes.data);
  };

  const fetchPropertyOwners = async (propertyId: string) => {
    const { data } = await supabase
      .from('pms_owner_properties')
      .select('share_percent, pms_owners!inner(id, full_name)')
      .eq('property_id', propertyId)
      .is('end_date', null);
    
    if (data) {
      const ownersInfo = data.map((op: any) => ({
        id: op.pms_owners.id,
        name: op.pms_owners.full_name,
        percentage: op.share_percent
      }));
      setPropertyOwners(ownersInfo);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const payload: any = {
        contract_number: data.contract_number,
        property_id: data.property_id,
        tenant_renter_id: data.tenant_renter_id,
        start_date: data.start_date,
        end_date: data.end_date,
        monthly_rent: data.monthly_rent,
        currency: data.currency,
        deposit_amount: data.deposit_amount,
        deposit_currency: data.deposit_currency || 'ARS',
        guarantee_type: data.guarantee_type || null,
        guarantee_details: data.guarantee_details || null,
        payment_day: data.payment_day,
        contract_type: data.contract_type,
        adjustment_type: data.adjustment_type,
        status: data.status,
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
        fecha_primer_ajuste: data.fecha_primer_ajuste,
        tenant_id: currentTenant?.id,
      };

      if (contract?.id) {
        const { error } = await supabase
          .from('pms_contracts')
          .update(payload)
          .eq('id', contract.id);
        
        if (error) throw error;
        toast.success('Contrato actualizado');
      } else {
        const { error } = await supabase
          .from('pms_contracts')
          .insert([payload]);
        
        if (error) throw error;
        toast.success('Contrato creado');
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contract ? 'Editar' : 'Nuevo'} Contrato</DialogTitle>
          <DialogDescription>
            Completa la información del contrato de alquiler
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contract_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Contrato</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="CONT-001" />
                    </FormControl>
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
                        <SelectItem value="draft">Borrador</SelectItem>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="expired">Vencido</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="property_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Propiedad</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    fetchPropertyOwners(value);
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar propiedad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {properties.map(prop => (
                        <SelectItem key={prop.id} value={prop.id}>
                          {prop.code} - {prop.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mostrar propietarios de la propiedad seleccionada */}
            {form.watch('property_id') && propertyOwners.length > 0 && (
              <div className="col-span-2 bg-muted/50 p-4 rounded-lg border">
                <p className="text-sm font-medium mb-2">Propietarios de la propiedad:</p>
                <div className="flex flex-wrap gap-2">
                  {propertyOwners.map((owner) => (
                    <Badge key={owner.id} variant="secondary">
                      {owner.name} ({owner.percentage}%)
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tenant_renter_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inquilino</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar inquilino" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tenants.map(tenant => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.full_name}
                          </SelectItem>
                        ))}
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
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Inicio</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Fin</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="monthly_rent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renta Mensual</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        value={field.value || ''}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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

              <FormField
                control={form.control}
                name="payment_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Día de Pago</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="31"
                        {...field} 
                        onChange={e => field.onChange(e.target.valueAsNumber)}
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deposit_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Depósito en Garantía</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        value={field.value || ''}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deposit_currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda del Depósito</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione moneda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                        <SelectItem value="USD">USD - Dólar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
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
                name="guarantee_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Garantía</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione tipo de garantía" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Garante">Garante</SelectItem>
                        <SelectItem value="Seguro de Caución">Seguro de Caución</SelectItem>
                        <SelectItem value="Otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('guarantee_type') && (
                <FormField
                  control={form.control}
                  name="guarantee_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detalles de la Garantía</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          placeholder={
                            form.watch('guarantee_type') === 'Garante' 
                              ? 'Ingrese nombre completo, DNI y datos de contacto del garante'
                              : form.watch('guarantee_type') === 'Seguro de Caución'
                              ? 'Ingrese nombre de la compañía, número de póliza y vigencia'
                              : 'Describa el tipo de garantía'
                          }
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo_contrato"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría de Contrato</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CONTRATO">CONTRATO</SelectItem>
                        <SelectItem value="COPROPIEDAD">COPROPIEDAD</SelectItem>
                        <SelectItem value="CESION">CESIÓN</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contract_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Uso</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="residential">Residencial</SelectItem>
                        <SelectItem value="commercial">Comercial</SelectItem>
                        <SelectItem value="temporary">Temporario</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-4" />
            <h3 className="text-lg font-semibold mb-4">Configuración de Montos y Forma de Pago</h3>

            {/* Item A */}
            <div className="border rounded-lg p-4 mb-4">
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground">ITEM A</h4>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="monto_a"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto Item A</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value || ''}
                          onChange={e => {
                            const value = e.target.value === '' ? undefined : e.target.valueAsNumber;
                            const monthlyRent = form.getValues('monthly_rent') || 0;
                            if (value === undefined || value <= monthlyRent) {
                              field.onChange(value);
                            }
                          }}
                          max={form.watch('monthly_rent') || 0}
                          placeholder="0"
                          onWheel={(e) => e.currentTarget.blur()}
                          className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Máximo: {form.watch('monthly_rent') || 0}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="forma_pago_item_a"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pago Item A</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Efectivo">Efectivo</SelectItem>
                          <SelectItem value="Transferencia">Transferencia</SelectItem>
                          <SelectItem value="Depósito">Depósito</SelectItem>
                          <SelectItem value="Cheque">Cheque</SelectItem>
                          <SelectItem value="eCheck">eCheck</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('forma_pago_item_a') === 'Otro' && (
                  <FormField
                    control={form.control}
                    name="detalle_otro_item_a"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detalle Otro</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Especificar forma de pago"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Item B - Solo se muestra si hay valor en monto_b */}
            {(form.watch('monto_b') || 0) > 0 && (
              <div className="border rounded-lg p-4 mb-4 bg-muted/30">
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">ITEM B</h4>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="monto_b"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monto Item B</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(e.target.valueAsNumber)}
                            placeholder="0"
                            disabled
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Calculado automáticamente
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="forma_pago_item_b"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Pago Item B</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Efectivo">Efectivo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          Siempre Efectivo
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Nota:</strong> Si el Monto Item A es menor a la Renta Mensual, la diferencia se aplicará automáticamente al Monto Item B.
              </p>
            </div>

            <Separator className="my-4" />
            <h3 className="text-lg font-semibold mb-4">Configuración de Ajustes</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Los valores mensuales de los índices se cargan en la sección <span className="font-semibold">Índices Económicos</span>
            </p>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="indice_ajuste"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Índice de Ajuste</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      // Set adjustment_type to valid constraint values
                      if (value === 'none') {
                        form.setValue('adjustment_type', 'none');
                      } else if (value === 'IPC' || value === 'ICL' || value === 'UVA') {
                        form.setValue('adjustment_type', 'annual_index');
                      }
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar índice" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin ajuste</SelectItem>
                        <SelectItem value="IPC">IPC - Índice de Precios al Consumidor</SelectItem>
                        <SelectItem value="ICL">ICL - Índice de Contratos de Locación</SelectItem>
                        <SelectItem value="UVA">UVA - Unidad de Valor Adquisitivo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frecuencia_ajuste"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frecuencia de Ajuste</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Mensual">Mensual</SelectItem>
                        <SelectItem value="Trimestral">Trimestral</SelectItem>
                        <SelectItem value="Semestral">Semestral</SelectItem>
                        <SelectItem value="Anual">Anual</SelectItem>
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
                name="fecha_primer_ajuste"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Primer Ajuste</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frecuencia_factura"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frecuencia de Factura</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Mensual">Mensual</SelectItem>
                        <SelectItem value="Bimestral">Bimestral</SelectItem>
                        <SelectItem value="Trimestral">Trimestral</SelectItem>
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

            {contract?.id && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Métodos de Pago</h3>
                  <ContractPaymentMethods contractId={contract.id} />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {contract ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
