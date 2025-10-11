import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
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
import { OwnerPropertyManager } from './OwnerPropertyManager';

const formSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  address: z.string().min(1, 'Dirección requerida'),
  city: z.string().min(1, 'Ciudad requerida'),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  property_type: z.string().min(1, 'Tipo requerido'),
  status: z.string().min(1, 'Estado requerido'),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  surface_total: z.number().min(0).optional(),
  surface_covered: z.number().min(0).optional(),
  description: z.string().optional(),
  alias: z.string().optional(),
  categoria: z.string().optional(),
  barrio: z.string().optional(),
  operacion: z.string().optional(),
  monto_alquiler: z.number().min(0).optional(),
  valor_venta: z.number().min(0).optional(),
  estado_publicacion: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PropertyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  property?: any;
}

export function PropertyForm({ open, onOpenChange, onSuccess, property }: PropertyFormProps) {
  const { currentTenant } = usePMS();
  const [propertyOwners, setPropertyOwners] = useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: property || {
      code: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      property_type: 'apartment',
      status: 'available',
      bedrooms: 0,
      bathrooms: 0,
      surface_total: 0,
      surface_covered: 0,
      description: '',
      alias: '',
      categoria: '',
      barrio: '',
      operacion: '',
      monto_alquiler: 0,
      valor_venta: 0,
      estado_publicacion: 'borrador',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (propertyOwners.length > 0) {
        const totalPercent = propertyOwners.reduce((sum, po) => sum + po.share_percent, 0);
        if (totalPercent !== 100) {
          toast.error('Error', { description: 'La suma de porcentajes debe ser 100%' });
          return;
        }
      }

      const payload: any = {
        code: data.code,
        address: data.address,
        city: data.city,
        state: data.state,
        postal_code: data.postal_code,
        property_type: data.property_type,
        status: data.status,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        surface_total: data.surface_total,
        surface_covered: data.surface_covered,
        description: data.description,
        alias: data.alias,
        categoria: data.categoria,
        barrio: data.barrio,
        operacion: data.operacion || null,
        monto_alquiler: data.monto_alquiler,
        valor_venta: data.valor_venta,
        estado_publicacion: data.estado_publicacion,
        tenant_id: currentTenant?.id,
      };

      let propertyId = property?.id;

      if (property?.id) {
        const { error } = await supabase
          .from('pms_properties')
          .update(payload)
          .eq('id', property.id);
        
        if (error) throw error;
      } else {
        const { data: newProperty, error } = await supabase
          .from('pms_properties')
          .insert([payload])
          .select()
          .single();
        
        if (error) throw error;
        propertyId = newProperty.id;
      }

      // Save property owners
      if (propertyOwners.length > 0 && propertyId) {
        // Delete existing owners if editing
        if (property?.id) {
          await supabase
            .from('pms_owner_properties')
            .delete()
            .eq('property_id', propertyId)
            .is('end_date', null);
        }

        // Insert new owners
        const ownersData = propertyOwners.map(po => ({
          property_id: propertyId,
          owner_id: po.owner_id,
          share_percent: po.share_percent,
          tenant_id: currentTenant?.id,
        }));

        const { error: ownersError } = await supabase
          .from('pms_owner_properties')
          .insert(ownersData);

        if (ownersError) throw ownersError;
      }

      toast.success(property ? 'Propiedad actualizada' : 'Propiedad creada');
      onSuccess();
      onOpenChange(false);
      form.reset();
      setPropertyOwners([]);
    } catch (error: any) {
      toast.error('Error', { description: error.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property ? 'Editar' : 'Nueva'} Propiedad</DialogTitle>
          <DialogDescription>
            Completa la información de la propiedad
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="PROP-001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="property_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="apartment">Departamento</SelectItem>
                        <SelectItem value="house">Casa</SelectItem>
                        <SelectItem value="commercial">Comercial</SelectItem>
                        <SelectItem value="land">Terreno</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Input {...field} placeholder="Av. Principal 123" />
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
                      <Input {...field} placeholder="Buenos Aires" />
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
                    <FormLabel>Código Postal</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="1000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dormitorios</FormLabel>
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
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Baños</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.5"
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
                name="surface_total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sup. Total (m²)</FormLabel>
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
                name="surface_covered"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sup. Cubierta (m²)</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="available">Disponible</SelectItem>
                      <SelectItem value="rented">Alquilada</SelectItem>
                      <SelectItem value="maintenance">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="alias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alias</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Depto Centro" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Premium" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="barrio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barrio</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Palermo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operación</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Alquiler">Alquiler</SelectItem>
                        <SelectItem value="Venta">Venta</SelectItem>
                        <SelectItem value="Ambos">Ambos</SelectItem>
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
                name="monto_alquiler"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto Alquiler</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor_venta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Venta</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="estado_publicacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado Publicación</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="borrador">Borrador</SelectItem>
                      <SelectItem value="publicado">Publicado</SelectItem>
                      <SelectItem value="pausado">Pausado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="my-4" />

            <OwnerPropertyManager
              propertyId={property?.id}
              tenantId={currentTenant?.id || ''}
              onOwnersChange={setPropertyOwners}
              initialOwners={propertyOwners}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {property ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
