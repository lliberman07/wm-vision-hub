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
  full_name: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  document_type: z.string().min(1, 'Tipo de documento requerido'),
  document_number: z.string().min(1, 'Número de documento requerido'),
  tenant_type: z.string().min(1, 'Tipo de inquilino requerido'),
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
      full_name: '',
      email: '',
      phone: '',
      document_type: 'DNI',
      document_number: '',
      tenant_type: 'individual',
      notes: '',
    },
  });

  useEffect(() => {
    if (open && tenant) {
      form.reset({
        full_name: tenant.full_name || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        document_type: tenant.document_type || 'DNI',
        document_number: tenant.document_number || '',
        tenant_type: tenant.tenant_type || 'individual',
        notes: tenant.notes || '',
      });
    } else if (open && !tenant) {
      form.reset({
        full_name: '',
        email: '',
        phone: '',
        document_type: 'DNI',
        document_number: '',
        tenant_type: 'individual',
        notes: '',
      });
    }
  }, [open, tenant, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload: any = {
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        document_type: data.document_type,
        document_number: data.document_number,
        tenant_type: data.tenant_type,
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
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="María González" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      <Input {...field} placeholder="+54 9 11 1234-5678" />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DNI">DNI</SelectItem>
                        <SelectItem value="CUIT">CUIT</SelectItem>
                        <SelectItem value="CUIL">CUIL</SelectItem>
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
                name="tenant_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="company">Empresa</SelectItem>
                      </SelectContent>
                    </Select>
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
