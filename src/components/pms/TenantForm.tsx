import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePMS } from '@/contexts/PMSContext';

const formSchema = z.object({
  tenant_type: z.string().min(1, 'Tipo de inquilino requerido'),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company_name: z.string().optional(),
  contact_name: z.string().optional(),
  full_name: z.string().optional(),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  mobile_phone: z.string().optional(),
  document_type: z.string().min(1, 'Tipo de documento requerido'),
  document_number: z.string().min(1, 'Número de documento requerido'),
  tax_id: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TenantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  tenant?: any;
}

export function TenantForm({ open, onOpenChange, onSuccess, tenant }: TenantFormProps) {
  const { currentTenant } = usePMS();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tenant_type: 'persona',
      first_name: '',
      last_name: '',
      company_name: '',
      contact_name: '',
      full_name: '',
      email: '',
      phone: '',
      mobile_phone: '',
      document_type: 'DNI',
      document_number: '',
      tax_id: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open && tenant) {
      form.reset({
        tenant_type: tenant.tenant_type || 'persona',
        first_name: tenant.first_name || '',
        last_name: tenant.last_name || '',
        company_name: tenant.company_name || '',
        contact_name: tenant.contact_name || '',
        full_name: tenant.full_name || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        mobile_phone: tenant.mobile_phone || '',
        document_type: tenant.document_type || 'DNI',
        document_number: tenant.document_number || '',
        tax_id: tenant.tax_id || '',
        address: tenant.address || '',
        city: tenant.city || '',
        state: tenant.state || '',
        postal_code: tenant.postal_code || '',
        notes: tenant.notes || '',
      });
    } else if (open && !tenant) {
      form.reset({
        tenant_type: 'persona',
        first_name: '',
        last_name: '',
        company_name: '',
        contact_name: '',
        full_name: '',
        email: '',
        phone: '',
        mobile_phone: '',
        document_type: 'DNI',
        document_number: '',
        tax_id: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        notes: '',
      });
    }
  }, [open, tenant, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload: any = {
        tenant_type: data.tenant_type,
        first_name: data.first_name,
        last_name: data.last_name,
        company_name: data.company_name,
        contact_name: data.contact_name,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        mobile_phone: data.mobile_phone,
        document_type: data.document_type,
        document_number: data.document_number,
        tax_id: data.tax_id,
        address: data.address,
        city: data.city,
        state: data.state,
        postal_code: data.postal_code,
        notes: data.notes,
        tenant_id: currentTenant?.id,
        is_active: true,
      };

      if (tenant?.id) {
        const { error } = await supabase
          .from('pms_tenants_renters')
          .update(payload)
          .eq('id', tenant.id);
        
        if (error) throw error;
        toast.success('Inquilino actualizado');
      } else {
        const { error } = await supabase
          .from('pms_tenants_renters')
          .insert([payload]);
        
        if (error) throw error;
        toast.success('Inquilino creado');
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
          <DialogTitle>{tenant ? 'Editar' : 'Nuevo'} Inquilino</DialogTitle>
          <DialogDescription>
            Completa la información del inquilino
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Tipo de Inquilino - PRIMERO */}
            <FormField
              control={form.control}
              name="tenant_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Inquilino</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="persona">Persona</SelectItem>
                      <SelectItem value="empresa">Empresa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campos condicionales según tipo */}
            {form.watch('tenant_type') === 'persona' ? (
              <>
                {/* PERSONA */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="María" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="González" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="document_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo Doc.</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DNI">DNI</SelectItem>
                            <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="document_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="12345678" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mobile_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Celular</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+54 9 11 1234-5678" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="maria@example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+54 11 1234-5678" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Av. Corrientes 1234" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ciudad</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="CABA" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provincia</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Buenos Aires" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código Postal</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="C1043" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            ) : (
              <>
                {/* EMPRESA */}
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razón Social</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Inmobiliaria XYZ S.A." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contacto - Nombre Apellido</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Juan Pérez" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="tax_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CUIT</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="30-12345678-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="contacto@empresa.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+54 11 1234-5678" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Av. Corrientes 1234" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ciudad</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="CABA" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provincia</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Buenos Aires" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código Postal</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="C1043" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
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
                {tenant ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
