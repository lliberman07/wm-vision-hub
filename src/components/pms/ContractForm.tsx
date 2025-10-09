import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  owner_id: z.string().min(1, 'Propietario requerido'),
  tenant_renter_id: z.string().min(1, 'Inquilino requerido'),
  start_date: z.string().min(1, 'Fecha inicio requerida'),
  end_date: z.string().min(1, 'Fecha fin requerida'),
  monthly_rent: z.number().min(0, 'Renta debe ser mayor a 0'),
  currency: z.string().min(1, 'Moneda requerida'),
  deposit_amount: z.number().min(0).optional(),
  payment_day: z.number().min(1).max(31).optional(),
  contract_type: z.string().optional(),
  adjustment_type: z.string().optional(),
  status: z.string().min(1, 'Estado requerido'),
  special_clauses: z.string().optional(),
  tipo_contrato: z.string().optional(),
  monto_a: z.number().min(0).optional(),
  monto_b: z.number().min(0).optional(),
  aplica_a_items: z.string().optional(),
  indice_ajuste: z.string().optional(),
  frecuencia_ajuste: z.string().optional(),
  frecuencia_factura: z.string().optional(),
  fecha_primer_ajuste: z.string().optional(),
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
  const [owners, setOwners] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: contract || {
      contract_number: '',
      property_id: '',
      owner_id: '',
      tenant_renter_id: '',
      start_date: '',
      end_date: '',
      monthly_rent: 0,
      currency: 'ARS',
      deposit_amount: 0,
      payment_day: 10,
      contract_type: 'rental',
      adjustment_type: 'none',
      status: 'draft',
      special_clauses: '',
      tipo_contrato: 'CONTRATO',
      monto_a: 0,
      monto_b: 0,
      aplica_a_items: 'A',
      indice_ajuste: 'none',
      frecuencia_ajuste: '',
      frecuencia_factura: 'Mensual',
      fecha_primer_ajuste: '',
    },
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    const [propsRes, ownersRes, tenantsRes] = await Promise.all([
      supabase.from('pms_properties').select('id, code, address'),
      supabase.from('pms_owners').select('id, full_name'),
      supabase.from('pms_tenants_renters').select('id, full_name'),
    ]);

    if (propsRes.data) setProperties(propsRes.data);
    if (ownersRes.data) setOwners(ownersRes.data);
    if (tenantsRes.data) setTenants(tenantsRes.data);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const payload: any = {
        contract_number: data.contract_number,
        property_id: data.property_id,
        owner_id: data.owner_id,
        tenant_renter_id: data.tenant_renter_id,
        start_date: data.start_date,
        end_date: data.end_date,
        monthly_rent: data.monthly_rent,
        currency: data.currency,
        deposit_amount: data.deposit_amount,
        payment_day: data.payment_day,
        contract_type: data.contract_type,
        adjustment_type: data.adjustment_type,
        status: data.status,
        special_clauses: data.special_clauses,
        tipo_contrato: data.tipo_contrato,
        monto_a: data.monto_a || data.monthly_rent,
        monto_b: data.monto_b || 0,
        aplica_a_items: data.aplica_a_items,
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="owner_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Propietario</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar propietario" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {owners.map(owner => (
                          <SelectItem key={owner.id} value={owner.id}>
                            {owner.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        onChange={e => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_contrato"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Contrato</FormLabel>
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
            </div>

            <Separator className="my-4" />
            <h3 className="text-lg font-semibold mb-4">Configuración de Montos</h3>

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
                        onChange={e => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="aplica_a_items"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aplica a Items</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="UNICO">ÚNICO</SelectItem>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="A+B">A+B</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                      // Sync adjustment_type with indice_ajuste
                      form.setValue('adjustment_type', value === 'none' ? 'none' : value.toLowerCase());
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
