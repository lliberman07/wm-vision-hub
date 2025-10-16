import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
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
import { PropertyPhotosUpload } from './PropertyPhotosUpload';
import { usePropertyStatus } from '@/hooks/usePropertyStatus';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Bot, Wrench } from 'lucide-react';

const formSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  address: z.string().min(1, 'Dirección requerida'),
  city: z.string().min(1, 'Ciudad requerida'),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  property_type: z.string().min(1, 'Tipo requerido'),
  status: z.string().min(1, 'Estado requerido'),
  habitaciones: z.number().int().min(0).optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  surface_total: z.number().min(0).optional(),
  surface_covered: z.number().min(0).optional(),
  balcon: z.boolean().optional(),
  patio: z.boolean().optional(),
  baulera: z.boolean().optional(),
  cocheras: z.number().int().min(0).optional(),
  tiene_amenidades: z.boolean().optional(),
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
  const [photos, setPhotos] = useState<string[]>(property?.photos || []);
  const [forceMaintenanceMode, setForceMaintenanceMode] = useState(false);
  const { status: autoStatus, contract, isAutomatic } = usePropertyStatus(property?.id);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      property_type: 'apartment',
      status: 'available',
      habitaciones: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      surface_total: undefined,
      surface_covered: undefined,
      balcon: false,
      patio: false,
      baulera: false,
      cocheras: undefined,
      tiene_amenidades: false,
      description: '',
      alias: '',
      categoria: '',
      barrio: '',
      operacion: '',
      monto_alquiler: undefined,
      valor_venta: undefined,
      estado_publicacion: 'borrador',
    },
  });

  useEffect(() => {
    if (open && property) {
      setForceMaintenanceMode(property.status === 'maintenance');
      form.reset({
        code: property.code || '',
        address: property.address || '',
        city: property.city || '',
        state: property.state || '',
        postal_code: property.postal_code || '',
        property_type: property.property_type || 'apartment',
        status: property.status || 'available',
        habitaciones: property.habitaciones || 0,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        surface_total: property.surface_total || 0,
        surface_covered: property.surface_covered || 0,
        balcon: property.balcon || false,
        patio: property.patio || false,
        baulera: property.baulera || false,
        cocheras: property.cocheras || 0,
        tiene_amenidades: property.tiene_amenidades || false,
        description: property.description || '',
        alias: property.alias || '',
        categoria: property.categoria || '',
        barrio: property.barrio || '',
        operacion: property.operacion || '',
        monto_alquiler: property.monto_alquiler || 0,
        valor_venta: property.valor_venta || 0,
        estado_publicacion: property.estado_publicacion || 'borrador',
      });
      setPhotos(property.photos || []);
    } else if (open && !property) {
      form.reset({
        code: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        property_type: 'apartment',
        status: 'available',
        habitaciones: 0,
        bedrooms: 0,
        bathrooms: 0,
        surface_total: 0,
        surface_covered: 0,
        balcon: false,
        patio: false,
        baulera: false,
        cocheras: 0,
        tiene_amenidades: false,
        description: '',
        alias: '',
        categoria: '',
        barrio: '',
        operacion: '',
        monto_alquiler: 0,
        valor_venta: 0,
        estado_publicacion: 'borrador',
      });
      setPhotos([]);
    }
  }, [open, property, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      // Validar que no se marque como "Alquilada" manualmente
      if (data.status === 'rented' && !contract) {
        toast.error('No se puede marcar como "Alquilada" manualmente. Este estado se establece automáticamente cuando existe un contrato activo.');
        return;
      }

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
        habitaciones: data.habitaciones,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        surface_total: data.surface_total,
        surface_covered: data.surface_covered,
        balcon: data.balcon,
        patio: data.patio,
        baulera: data.baulera,
        cocheras: data.cocheras,
        tiene_amenidades: data.tiene_amenidades,
        description: data.description,
        alias: data.alias,
        categoria: data.categoria,
        barrio: data.barrio,
        operacion: data.operacion || null,
        monto_alquiler: data.monto_alquiler,
        valor_venta: data.valor_venta,
        estado_publicacion: data.estado_publicacion,
        tenant_id: currentTenant?.id,
        photos: photos,
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
      setPhotos([]);
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
                    <Input {...field} placeholder="Calle/Avenida, número, piso, departamento" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-4 gap-4">
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
                name="habitaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Habitaciones</FormLabel>
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
                name="cocheras"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cocheras</FormLabel>
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

            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="balcon"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Balcón</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="patio"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Patio</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="baulera"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Baulera</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tiene_amenidades"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Amenidades</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel>Estado</FormLabel>
                    {property && (
                      <Badge variant={isAutomatic ? "default" : "secondary"} className="text-xs">
                        {isAutomatic ? (
                          <>
                            <Bot className="h-3 w-3 mr-1" />
                            Automático
                          </>
                        ) : (
                          <>
                            <Wrench className="h-3 w-3 mr-1" />
                            Manual
                          </>
                        )}
                      </Badge>
                    )}
                  </div>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value === 'maintenance') {
                        setForceMaintenanceMode(true);
                      } else {
                        setForceMaintenanceMode(false);
                      }
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="available">Disponible</SelectItem>
                      <SelectItem value="rented" disabled={!contract}>
                        Alquilada {!contract && '(solo automático)'}
                      </SelectItem>
                      <SelectItem value="maintenance">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  
                  {property && !contract && (
                    <div className="flex items-center space-x-2 mt-2">
                      <Checkbox
                        id="forceMaintenanceMode"
                        checked={forceMaintenanceMode}
                        onCheckedChange={(checked) => {
                          setForceMaintenanceMode(checked as boolean);
                          if (checked) {
                            form.setValue('status', 'maintenance');
                          } else {
                            form.setValue('status', 'available');
                          }
                        }}
                      />
                      <label
                        htmlFor="forceMaintenanceMode"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Forzar Mantenimiento Manual
                      </label>
                    </div>
                  )}
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="monto_alquiler"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto Alquiler</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} placeholder="Ingrese monto" />
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
                      <Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} placeholder="Ingrese valor" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Fotos de la Propiedad (Opcional)</h3>
              <p className="text-sm text-muted-foreground">
                Puedes agregar hasta 3 fotos de la propiedad
              </p>
              <PropertyPhotosUpload
                photos={photos}
                onPhotosChange={setPhotos}
                propertyId={property?.id}
                disabled={form.formState.isSubmitting}
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
