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
  owner_type: z.string().min(1, 'Tipo requerido'),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company_name: z.string().optional(),
  contact_name: z.string().optional(),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  mobile_phone: z.string().optional(),
  document_type: z.string().optional(),
  document_number: z.string().optional(),
  tax_id: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface OwnerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  owner?: any;
}

export function OwnerForm({ open, onOpenChange, onSuccess, owner }: OwnerFormProps) {
  const { currentTenant } = usePMS();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      owner_type: 'persona',
      first_name: '',
      last_name: '',
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      mobile_phone: '',
      document_type: 'DNI',
      document_number: '',
      tax_id: '',
      address: '',
      state: '',
      city: '',
      postal_code: '',
      notes: '',
    },
  });

  const ownerType = form.watch('owner_type');

  useEffect(() => {
    if (open && owner) {
      form.reset({
        owner_type: owner.owner_type || 'persona',
        first_name: owner.first_name || '',
        last_name: owner.last_name || '',
        company_name: owner.company_name || '',
        contact_name: owner.contact_name || '',
        email: owner.email || '',
        phone: owner.phone || '',
        mobile_phone: owner.mobile_phone || '',
        document_type: owner.document_type || 'DNI',
        document_number: owner.document_number || '',
        tax_id: owner.tax_id || '',
        address: owner.address || '',
        state: owner.state || '',
        city: owner.city || '',
        postal_code: owner.postal_code || '',
        notes: owner.notes || '',
      });
    } else if (open && !owner) {
      form.reset({
        owner_type: 'persona',
        first_name: '',
        last_name: '',
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        mobile_phone: '',
        document_type: 'DNI',
        document_number: '',
        tax_id: '',
        address: '',
        state: '',
        city: '',
        postal_code: '',
        notes: '',
      });
    }
  }, [open, owner, form]);

  const onSubmit = async (data: FormValues) => {
    // Validación defensiva: verificar que currentTenant?.id existe
    if (!currentTenant?.id) {
      toast.error('Error', { 
        description: 'No se pudo determinar el tenant. Por favor, recarga la página.' 
      });
      return;
    }

    try {
      const payload: any = {
        owner_type: data.owner_type,
        first_name: data.first_name,
        last_name: data.last_name,
        company_name: data.company_name,
        contact_name: data.contact_name,
        email: data.email,
        phone: data.phone,
        mobile_phone: data.mobile_phone,
        document_type: data.document_type,
        document_number: data.document_number,
        tax_id: data.tax_id,
        address: data.address,
        state: data.state,
        city: data.city,
        postal_code: data.postal_code,
        notes: data.notes,
        tenant_id: currentTenant.id,
        is_active: true,
        // Mantener full_name por compatibilidad
        full_name: data.owner_type === 'empresa' 
          ? data.company_name 
          : `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      };

      if (owner?.id) {
        const { error } = await supabase
          .from('pms_owners')
          .update(payload)
          .eq('id', owner.id);
        
        if (error) throw error;
        toast.success('Propietario actualizado');
      } else {
        const { error } = await supabase
          .from('pms_owners')
          .insert([payload]);
        
        if (error) throw error;
        toast.success('Propietario creado');
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
          <DialogTitle>{owner ? 'Editar' : 'Nuevo'} Propietario</DialogTitle>
          <DialogDescription>
            Completa la información del propietario
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Campo Tipo - Primero */}
            <FormField
              control={form.control}
              name="owner_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
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

            {/* Campos para Persona */}
            {ownerType === 'persona' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre/s</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Juan" />
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
                        <FormLabel>Apellido/s</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Pérez" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="juan@example.com" />
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
                          <Input {...field} placeholder="+54 9 11 1234-5678" />
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
                          <Input {...field} placeholder="11 1234 5678" />
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
                    name="tax_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CUIT/CUIL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="20-12345678-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {/* Campos para Empresa */}
            {ownerType === 'empresa' && (
              <>
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razón Social</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Empresa S.A." />
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
                          <Input {...field} placeholder="+54 9 11 1234-5678" />
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
                          <Input {...field} placeholder="11 1234 5678" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="tax_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CUIT/CUIL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="30-12345678-9" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Av. Principal 123" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
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
                    name="postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cód. Postal</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="1000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {/* Notas - Común para ambos tipos */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
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
              <Button type="submit" disabled={!currentTenant?.id}>
                {owner ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
