import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePMS } from '@/contexts/PMSContext';
import { OwnerPropertyManager } from './OwnerPropertyManager';
import { PropertyPhotosUpload } from './PropertyPhotosUpload';
import { usePropertyStatus } from '@/hooks/usePropertyStatus';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PropertyStatusSelector } from './PropertyStatusSelector';
import { SubscriptionLimitAlert } from './SubscriptionLimitAlert';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { Loader2, AlertCircle, DollarSign, Info } from 'lucide-react';

const formSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  street_name: z.string().min(1, 'Calle/Avenida requerida'),
  street_number: z.string().optional(),
  floor: z.string().optional(),
  apartment: z.string().optional(),
  city: z.string().min(1, 'Ciudad requerida'),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  property_type: z.string().min(1, 'Tipo requerido'),
  status: z.enum(['inactive', 'active', 'rented', 'maintenance']).default('active'),
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
  alquiler_moneda: z.enum(['ARS', 'USD']).default('ARS'),
  valor_venta: z.number().min(0).optional(),
  estado_publicacion: z.string().optional(),
  admin_commission_percentage: z.number().min(0).max(100).optional(),
  admin_commission_fixed_amount: z.number().min(0).optional(),
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
  const { checkLimit } = useSubscriptionLimits();
  const [limitWarning, setLimitWarning] = useState<{ show: boolean; currentCount: number; limit: number } | null>(null);
  
  // FASE 2: Validación de códigos únicos
  const [codeValidation, setCodeValidation] = useState<{
    isChecking: boolean;
    isDuplicate: boolean;
    message: string;
  }>({ isChecking: false, isDuplicate: false, message: '' });
  
  // FASE 3: Restricciones de edición
  const [hasContractHistory, setHasContractHistory] = useState(false);
  const [isCheckingHistory, setIsCheckingHistory] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      street_name: '',
      street_number: '',
      floor: '',
      apartment: '',
      city: '',
      state: '',
      postal_code: '',
      property_type: 'apartment',
      status: 'active' as const,
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
      alquiler_moneda: 'ARS',
      valor_venta: undefined,
      estado_publicacion: 'borrador',
    },
  });

  // FASE 3: Verificar historial de contratos
  useEffect(() => {
    if (property?.id) {
      checkContractHistory(property.id);
    }
  }, [property?.id]);

  const checkContractHistory = async (propertyId: string) => {
    setIsCheckingHistory(true);
    try {
      const { data, error } = await supabase.rpc('property_has_contract_history', {
        p_property_id: propertyId
      });
      
      if (error) throw error;
      setHasContractHistory(!!data);
    } catch (error) {
      console.error('Error checking contract history:', error);
      setHasContractHistory(false);
    } finally {
      setIsCheckingHistory(false);
    }
  };

  // FASE 2: Validación de código único
  const validatePropertyCode = async (code: string) => {
    if (!code || !currentTenant?.id) return;
    
    setCodeValidation({ isChecking: true, isDuplicate: false, message: '' });
    
    try {
      const normalizedCode = code.trim().toUpperCase();
      
      const { data, error } = await supabase.rpc('check_property_code_uniqueness', {
        p_code: normalizedCode,
        p_property_id: property?.id || null,
        p_tenant_id: currentTenant.id
      });
      
      if (error) throw error;
      
      if (!data) {
        setCodeValidation({
          isChecking: false,
          isDuplicate: true,
          message: `El código "${normalizedCode}" ya está en uso`
        });
        form.setError('code', {
          type: 'manual',
          message: `El código "${normalizedCode}" ya está en uso`
        });
      } else {
        setCodeValidation({
          isChecking: false,
          isDuplicate: false,
          message: '✓ Código disponible'
        });
        form.clearErrors('code');
      }
    } catch (error) {
      console.error('Error validating code:', error);
      setCodeValidation({ isChecking: false, isDuplicate: false, message: '' });
    }
  };

  const handleCodeChange = (value: string) => {
    const normalized = value.trim().toUpperCase();
    form.setValue('code', normalized);
  };

  // FASE 3: Función para deshabilitar campos
  const isFieldDisabled = (fieldName: string): boolean => {
    if (!property) return false;
    
    const criticalFields = ['code', 'street_name', 'street_number', 'floor', 'apartment'];
    
    if (criticalFields.includes(fieldName)) {
      return autoStatus === 'rented' || hasContractHistory;
    }
    
    return false;
  };

  useEffect(() => {
    if (open && property) {
      setForceMaintenanceMode(property.status === 'maintenance');
      form.reset({
        code: property.code || '',
        street_name: property.street_name || property.address || '',
        street_number: property.street_number || '',
        floor: property.floor || '',
        apartment: property.apartment || '',
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
        alquiler_moneda: property.alquiler_moneda || 'ARS',
        valor_venta: property.valor_venta || 0,
        estado_publicacion: property.estado_publicacion || 'borrador',
        admin_commission_percentage: property.admin_commission_percentage || 10,
        admin_commission_fixed_amount: property.admin_commission_fixed_amount || 50000,
      });
      setPhotos(property.photos || []);
    } else if (open && !property) {
      form.reset({
        code: '',
        street_name: '',
        street_number: '',
        floor: '',
        apartment: '',
        city: '',
        state: '',
        postal_code: '',
        property_type: 'apartment',
        status: 'active' as const,
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
        alquiler_moneda: 'ARS',
        valor_venta: 0,
        estado_publicacion: 'borrador',
        admin_commission_percentage: 10,
        admin_commission_fixed_amount: 50000,
      });
      setPhotos([]);
    }
  }, [open, property, form]);

  const onSubmit = async (data: FormValues) => {
    // FASE 2: Prevenir envío con código duplicado
    if (codeValidation.isDuplicate) {
      toast.error('No se puede guardar la propiedad', {
        description: 'El código ingresado ya está en uso'
      });
      return;
    }
    
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

      const fullAddress = [
        data.street_name,
        data.street_number,
        data.floor ? `Piso ${data.floor}` : '',
        data.apartment ? `Depto ${data.apartment}` : ''
      ].filter(Boolean).join(', ');

      const payload: any = {
        code: data.code,
        street_name: data.street_name,
        street_number: data.street_number || null,
        floor: data.floor || null,
        apartment: data.apartment || null,
        address: fullAddress,
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
        alquiler_moneda: data.alquiler_moneda,
        valor_venta: data.valor_venta,
        estado_publicacion: data.estado_publicacion,
        admin_commission_percentage: data.admin_commission_percentage,
        admin_commission_fixed_amount: data.admin_commission_fixed_amount,
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
            {/* FASE 3: Alerta de restricción */}
            {property && (autoStatus === 'rented' || hasContractHistory) && (
              <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 dark:text-amber-200">⚠ Edición Restringida</AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  {autoStatus === 'rented' && (
                    <p>Esta propiedad tiene un contrato activo. No puedes modificar el código, dirección ni propietarios.</p>
                  )}
                  {hasContractHistory && autoStatus !== 'rented' && (
                    <p>Esta propiedad tiene historial de contratos. Para modificar datos críticos, considera crear un clon.</p>
                  )}
                  <p className="mt-2 text-sm">
                    💡 <strong>Sugerencia:</strong> Usa el botón "Clonar" en la lista de propiedades para crear una versión editable.
                  </p>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          {...field}
                          placeholder="PROP-001"
                          onChange={(e) => {
                            field.onChange(e);
                            handleCodeChange(e.target.value);
                          }}
                          onBlur={() => validatePropertyCode(field.value)}
                          disabled={isFieldDisabled('code')}
                          className={codeValidation.isDuplicate ? 'border-red-500' : ''}
                        />
                        {codeValidation.isChecking && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </FormControl>
                    {codeValidation.message && (
                      <p className={`text-sm ${codeValidation.isDuplicate ? 'text-red-500' : 'text-green-600'}`}>
                        {codeValidation.message}
                      </p>
                    )}
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

            <div className="grid grid-cols-12 gap-4">
              <FormField
                control={form.control}
                name="street_name"
                render={({ field }) => (
                  <FormItem className="col-span-6">
                    <FormLabel>Calle/Avenida</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej: Av. Corrientes" disabled={isFieldDisabled('street_name')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="street_number"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="1234" disabled={isFieldDisabled('street_number')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Piso</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="5" maxLength={3} disabled={isFieldDisabled('floor')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-12 gap-4">
              <FormField
                control={form.control}
                name="apartment"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Departamento</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="A" maxLength={3} disabled={isFieldDisabled('apartment')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                  <FormLabel>Estado de la Propiedad</FormLabel>
                  <FormControl>
                    <PropertyStatusSelector
                      currentStatus={field.value as any}
                      propertyId={property?.id}
                      tenantId={currentTenant?.id || ''}
                      hasActiveContract={!!contract}
                      onStatusChange={async (newStatus) => {
                        field.onChange(newStatus);
                        if (newStatus === 'maintenance') {
                          setForceMaintenanceMode(true);
                        } else {
                          setForceMaintenanceMode(false);
                        }
                      }}
                      disabled={isFieldDisabled('status')}
                    />
                  </FormControl>
                  <FormDescription>
                    Estados que consumen límite: Activa, Alquilada, Mantenimiento.
                    Estado "No Activa" no consume límite.
                  </FormDescription>
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

            <div className="space-y-2">
              <FormLabel>Monto Alquiler</FormLabel>
              <div className="grid grid-cols-12 gap-2">
                {/* Currency Selector */}
                <FormField
                  control={form.control}
                  name="alquiler_moneda"
                  render={({ field }) => (
                    <FormItem className="col-span-4">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ARS">
                            <div className="flex items-center gap-2">
                              <span>Pesos ($)</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="USD">
                            <span>Dólar (USD)</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                {/* Amount Input */}
                <FormField
                  control={form.control}
                  name="monto_alquiler"
                  render={({ field }) => (
                    <FormItem className="col-span-8">
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(e.target.valueAsNumber)} 
                            placeholder="Ej: 350000" 
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                            {form.watch('alquiler_moneda') === 'USD' ? 'USD' : '$'}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormDescription className="text-xs text-muted-foreground">
                Selecciona la moneda y el monto del alquiler mensual
              </FormDescription>
            </div>

            <FormField
              control={form.control}
              name="valor_venta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Venta (USD)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(e.target.valueAsNumber)} 
                        placeholder="Ej: 150000" 
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                        USD
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    El valor debe estar expresado en dólares (USD)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {/* Sección de Comisiones */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Configuración de Comisiones
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Define los honorarios por administración de esta propiedad
                </p>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Con contrato activo:</strong> Se cobra un porcentaje sobre la renta mensual</li>
                    <li><strong>Sin contrato:</strong> Se cobra un monto fijo por gestión y mantenimiento</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="admin_commission_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Comisión con Contrato Activo (%)
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Porcentaje que se cobrará sobre la renta mensual cuando exista un contrato activo
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          placeholder="Ej: 10.00"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Ejemplo: 10% sobre $1.000.000 = $100.000
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="admin_commission_fixed_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Comisión sin Contrato (ARS)
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Monto fijo en pesos que se cobrará mensualmente cuando no haya contrato activo
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1000"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          placeholder="Ej: 50000"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Por gestión, marketing y mantenimiento preventivo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator className="my-4" />

            <OwnerPropertyManager
              propertyId={property?.id}
              tenantId={currentTenant?.id || ''}
              onOwnersChange={setPropertyOwners}
              initialOwners={propertyOwners}
              disabled={property && (autoStatus === 'rented' || hasContractHistory)}
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
