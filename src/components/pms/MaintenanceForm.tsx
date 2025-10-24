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
  property_id: z.string().min(1, 'Propiedad requerida'),
  contract_id: z.string().optional(),
  title: z.string().min(1, 'Título requerido'),
  description: z.string().min(1, 'Descripción requerida'),
  category: z.string().optional(),
  priority: z.string().min(1, 'Prioridad requerida'),
  status: z.string().min(1, 'Estado requerido'),
  paid_by: z.string().optional(),
  provider_contact: z.string().optional(),
  provider_phone: z.string().optional(),
  estimated_cost: z.number().min(0).optional(),
  scheduled_date: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MaintenanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  maintenance?: any;
}

export function MaintenanceForm({ open, onOpenChange, onSuccess, maintenance }: MaintenanceFormProps) {
  const { currentTenant } = usePMS();
  const [properties, setProperties] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      property_id: '',
      contract_id: '',
      title: '',
      description: '',
      category: 'plumbing',
      priority: 'medium',
      status: 'pending',
      paid_by: '',
      provider_contact: '',
      provider_phone: '',
      estimated_cost: 0,
      scheduled_date: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      fetchData();
      if (maintenance) {
        form.reset({
          property_id: maintenance.property_id || '',
          contract_id: maintenance.contract_id || '',
          title: maintenance.title || '',
          description: maintenance.description || '',
          category: maintenance.category || 'plumbing',
          priority: maintenance.priority || 'medium',
          status: maintenance.status || 'pending',
          paid_by: maintenance.paid_by || '',
          provider_contact: maintenance.provider_contact || '',
          provider_phone: maintenance.provider_phone || '',
          estimated_cost: maintenance.estimated_cost || 0,
          scheduled_date: maintenance.scheduled_date || '',
          notes: maintenance.notes || '',
        });
      } else {
        form.reset({
          property_id: '',
          contract_id: '',
          title: '',
          description: '',
          category: 'plumbing',
          priority: 'medium',
          status: 'pending',
          paid_by: '',
          provider_contact: '',
          provider_phone: '',
          estimated_cost: 0,
          scheduled_date: '',
          notes: '',
        });
      }
    }
  }, [open, maintenance, form]);

  const fetchData = async () => {
    const [propsRes, contractsRes] = await Promise.all([
      supabase.from('pms_properties').select('id, code, address'),
      supabase
        .from('pms_contracts')
        .select('id, contract_number, property_id, status, start_date, end_date')
        .eq('status', 'active'),
    ]);

    if (propsRes.data) setProperties(propsRes.data);
    if (contractsRes.data) setContracts(contractsRes.data);
  };

  const handlePropertyChange = async (propertyId: string) => {
    form.setValue('property_id', propertyId);
    
    // Buscar contrato activo para esta propiedad
    const activeContract = contracts.find(
      c => c.property_id === propertyId && c.status === 'active'
    );
    
    if (activeContract) {
      form.setValue('contract_id', activeContract.id);
    } else {
      form.setValue('contract_id', '');
      // Si no hay contrato y paid_by era "inquilino", resetear a vacío
      const currentPaidBy = form.getValues('paid_by');
      if (currentPaidBy === 'inquilino') {
        form.setValue('paid_by', '');
      }
    }
  };

  const getContractDisplay = () => {
    const propertyId = form.watch('property_id');
    const contractId = form.watch('contract_id');
    
    if (!propertyId) return 'Seleccione una propiedad primero';
    
    if (contractId) {
      const contract = contracts.find(c => c.id === contractId);
      return contract?.contract_number || 'Sin Contrato';
    }
    
    return 'Sin Contrato';
  };

  const hasActiveContract = () => {
    const contractId = form.watch('contract_id');
    return !!contractId;
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const isNewRequest = !maintenance?.id;
      const statusChangedToCompleted = maintenance?.status !== 'completed' && data.status === 'completed';

      const payload: any = {
        property_id: data.property_id,
        contract_id: data.contract_id || null,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: data.status,
        paid_by: data.paid_by || null,
        provider_contact: data.provider_contact || null,
        provider_phone: data.provider_phone || null,
        estimated_cost: data.estimated_cost,
        scheduled_date: data.scheduled_date || null,
        notes: data.notes,
        tenant_id: currentTenant?.id,
        assigned_to: null,
        reported_by: isNewRequest ? user?.id : maintenance?.reported_by,
      };

      let savedId = maintenance?.id;

      if (maintenance?.id) {
        const { error } = await supabase
          .from('pms_maintenance_requests')
          .update(payload)
          .eq('id', maintenance.id);
        
        if (error) throw error;
        toast.success('Solicitud actualizada');
      } else {
        const { data: insertedData, error } = await supabase
          .from('pms_maintenance_requests')
          .insert([payload])
          .select()
          .single();
        
        if (error) throw error;
        savedId = insertedData.id;
        toast.success('Solicitud creada');
      }

      // Send automatic email notifications
      if (isNewRequest) {
        try {
          const { data: propertyData } = await supabase
            .from('pms_properties')
            .select('code, address')
            .eq('id', data.property_id)
            .single();

          const hasContract = !!data.contract_id;

          if (hasContract) {
            // CASE 1: Property with active contract - notify staff
            const { data: staffUsers, error: staffError } = await supabase
              .from('user_roles')
              .select('user_id, users!inner(email, first_name, last_name)')
              .eq('tenant_id', currentTenant?.id)
              .eq('module', 'PMS')
              .in('role', ['inmobiliaria', 'admin', 'propietario', 'superadmin'])
              .eq('status', 'approved');

            if (!staffError && staffUsers && staffUsers.length > 0) {
              for (const staff of staffUsers) {
                try {
                  await supabase.functions.invoke('send-maintenance-notification', {
                    body: {
                      action: 'created_with_contract',
                      recipient_email: staff.users.email,
                      recipient_name: staff.users.first_name 
                        ? `${staff.users.first_name} ${staff.users.last_name || ''}`.trim()
                        : staff.users.email,
                      maintenance_title: data.title,
                      property_address: propertyData?.address || 'Sin dirección',
                      property_code: propertyData?.code,
                      priority: data.priority,
                      description: data.description || '',
                      category: data.category,
                    }
                  });
                } catch (emailError) {
                  console.error('Error sending email to staff:', emailError);
                }
              }
            }
          } else {
            // CASE 2: Property without active contract - notify owners
            const { data: ownerProperties, error: ownersError } = await supabase
              .from('pms_owner_properties')
              .select('owner_id, pms_owners!inner(email, full_name)')
              .eq('property_id', data.property_id)
              .is('end_date', null);

            if (!ownersError && ownerProperties && ownerProperties.length > 0) {
              for (const ownerProp of ownerProperties) {
                try {
                  await supabase.functions.invoke('send-maintenance-notification', {
                    body: {
                      action: 'created_without_contract',
                      recipient_email: ownerProp.pms_owners.email,
                      recipient_name: ownerProp.pms_owners.full_name || ownerProp.pms_owners.email,
                      maintenance_title: data.title,
                      property_address: propertyData?.address || 'Sin dirección',
                      property_code: propertyData?.code,
                      priority: data.priority,
                      description: data.description || '',
                      category: data.category,
                    }
                  });
                } catch (emailError) {
                  console.error('Error sending email to owner:', emailError);
                }
              }
            }
          }
        } catch (emailError: any) {
          console.error("Error in notification process:", emailError);
        }
      }

      // Notification when completed
      if (statusChangedToCompleted && maintenance?.reported_by) {
        try {
          const { data: propertyData } = await supabase
            .from('pms_properties')
            .select('code, address')
            .eq('id', data.property_id)
            .single();

          const { data: reporterData } = await supabase
            .from('users')
            .select('email')
            .eq('id', maintenance.reported_by)
            .single();

          if (reporterData) {
            await supabase.functions.invoke('send-maintenance-notification', {
              body: {
                action: 'completed',
                maintenance_title: data.title,
                property_address: propertyData?.address || 'Sin dirección',
                property_code: propertyData?.code,
                reporter_email: reporterData.email,
                priority: data.priority,
                description: data.description || '',
                category: data.category,
              }
            });
          }
        } catch (emailError: any) {
          console.error("Error sending completion email:", emailError);
        }
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast.error('Error', { description: error.message });
    }
  };

  const isCompleted = maintenance?.status === 'completed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{maintenance ? 'Editar' : 'Nueva'} Solicitud de Mantenimiento</DialogTitle>
          <DialogDescription>
            Completa la información de la solicitud
          </DialogDescription>
        </DialogHeader>

        {isCompleted && (
          <div className="bg-muted border border-border rounded-md p-4 mb-4">
            <p className="text-sm text-muted-foreground">
              ⚠️ Esta solicitud está finalizada y no puede ser modificada
            </p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="property_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Propiedad</FormLabel>
                  <Select onValueChange={handlePropertyChange} value={field.value} disabled={isCompleted}>
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

            <FormField
              control={form.control}
              name="contract_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contrato (asignado automáticamente)</FormLabel>
                  <FormControl>
                    <Input 
                      value={getContractDisplay()} 
                      readOnly 
                      className="bg-muted cursor-not-allowed"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Fuga en el baño" disabled={isCompleted} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} placeholder="Detalle del problema..." disabled={isCompleted} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isCompleted}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="plumbing">Plomería</SelectItem>
                        <SelectItem value="electrical">Eléctrico</SelectItem>
                        <SelectItem value="hvac">Climatización</SelectItem>
                        <SelectItem value="structural">Estructura</SelectItem>
                        <SelectItem value="appliance">Electrodomésticos</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isCompleted}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isCompleted}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="in_progress">En Progreso</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>


            <FormField
              control={form.control}
              name="paid_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pagado por</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isCompleted}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar responsable" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {hasActiveContract() && (
                        <SelectItem value="inquilino">Inquilino</SelectItem>
                      )}
                      <SelectItem value="propietario">Propietario</SelectItem>
                      <SelectItem value="administracion">Administración</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="provider_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contacto Proveedor</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre del proveedor" disabled={isCompleted} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="provider_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tel. Proveedor</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Teléfono" disabled={isCompleted} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estimated_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo Estimado (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(e.target.valueAsNumber)}
                        disabled={isCompleted}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduled_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Programada (opcional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isCompleted} />
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
                  <FormLabel>Notas Adicionales (opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} disabled={isCompleted} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              {isCompleted ? (
                <Button disabled>
                  Cerrado
                </Button>
              ) : (
                <Button type="submit">
                  {maintenance ? 'Actualizar' : 'Crear'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
