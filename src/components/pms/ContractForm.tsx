import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { formatDateForDB, parseDateFromDB, formatDateToDisplay } from '@/utils/dateUtils';
import { format } from 'date-fns';
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
import { ContractPaymentMethods } from './ContractPaymentMethods';
import { ContractDocumentsUpload } from './ContractDocumentsUpload';
import { cn } from '@/lib/utils';
import { useContractValidation } from '@/hooks/useContractValidation';
import { formatDateDisplay } from '@/utils/dateUtils';

const formSchema = z.object({
  contract_number: z.string().min(1, 'Número de contrato requerido'),
  property_id: z.string().min(1, 'Propiedad requerida'),
  tenant_renter_id: z.string().min(1, 'Inquilino requerido'),
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
  fecha_primer_ajuste: z.date().optional(),
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
  
  // FASE 5: Detectar propiedad clonada
  const [isClonedProperty, setIsClonedProperty] = useState(false);
  const [parentContractInfo, setParentContractInfo] = useState<any>(null);
  
  // Estado para mostrar documentos después de guardar
  const [savedContractId, setSavedContractId] = useState<string | null>(null);
  
  // Validación de contratos superpuestos
  const [propertyConflict, setPropertyConflict] = useState<any>(null);
  const [dateConflict, setDateConflict] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const { checkPropertyAvailability } = useContractValidation();
  
  // Helper para determinar si un campo está deshabilitado
  const isFieldDisabled = (fieldName: string) => {
    if (!contract || contract.status !== 'active') return false;
    
    const criticalFields = [
      'contract_number', 'property_id', 'tenant_renter_id',
      'start_date', 'end_date', 'monthly_rent', 'monto_a', 'monto_b',
      'indice_ajuste', 'frecuencia_ajuste', 'fecha_primer_ajuste',
      'currency', 'payment_day', 'deposit_amount', 'deposit_currency',
      'guarantee_type', 'contract_type', 'tipo_contrato'
    ];
    
    return criticalFields.includes(fieldName);
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contract_number: '',
      property_id: '',
      tenant_renter_id: '',
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
      fecha_primer_ajuste: undefined,
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
          start_date: contract.start_date ? parseDateFromDB(contract.start_date) : undefined,
          end_date: contract.end_date ? parseDateFromDB(contract.end_date) : undefined,
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
          fecha_primer_ajuste: contract.fecha_primer_ajuste ? parseDateFromDB(contract.fecha_primer_ajuste) : undefined,
        });
        if (contract.property_id) {
          fetchPropertyOwners(contract.property_id);
        }
      } else {
        form.reset({
          contract_number: '',
          property_id: '',
          tenant_renter_id: '',
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
          fecha_primer_ajuste: undefined,
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
  
  // FASE 5: Detectar si la propiedad es un clon y pre-cargar fecha
  useEffect(() => {
    const checkIfCloned = async () => {
      const propertyId = form.watch('property_id');
      if (!propertyId) {
        setIsClonedProperty(false);
        setParentContractInfo(null);
        return;
      }
      
      try {
        const { data: property } = await supabase
          .from('pms_properties')
          .select('is_clone, parent_property_id, base_property_code')
          .eq('id', propertyId)
          .single();
        
        if (property?.is_clone && property.parent_property_id) {
          setIsClonedProperty(true);
          
          // Buscar último contrato cancelado de la propiedad padre
          const { data: parentContract } = await supabase
            .from('pms_contracts')
            .select('*')
            .eq('property_id', property.parent_property_id)
            .eq('status', 'cancelled')
            .order('cancelled_at', { ascending: false })
            .limit(1)
            .single();
          
          if (parentContract) {
            setParentContractInfo(parentContract);
            
            // Pre-cargar fecha de inicio automáticamente
            const cancelDate = parseDateFromDB(parentContract.cancelled_at);
            const newStartDate = new Date(cancelDate);
            newStartDate.setDate(newStartDate.getDate() + 1);
            
            form.setValue('start_date', newStartDate);
            
            toast.info('Propiedad Clonada Detectada', {
              description: `Se sugiere iniciar el contrato el ${format(newStartDate, 'dd/MM/yyyy')}`
            });
          }
        } else {
          setIsClonedProperty(false);
          setParentContractInfo(null);
        }
      } catch (error) {
        console.error('Error checking cloned property:', error);
      }
    };
    
    checkIfCloned();
  }, [form.watch('property_id')]);

  // Validación: Detectar contrato activo al seleccionar propiedad
  useEffect(() => {
    const checkProperty = async () => {
      const propertyId = form.watch('property_id');
      if (!propertyId) {
        setPropertyConflict(null);
        return;
      }

      setIsValidating(true);
      
      const { data: activeContracts } = await supabase
        .from('pms_contracts')
        .select(`
          id,
          contract_number,
          start_date,
          end_date,
          status,
          pms_tenants_renters!inner(full_name)
        `)
        .eq('property_id', propertyId)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true });

      if (activeContracts && activeContracts.length > 0) {
        setPropertyConflict(activeContracts[0]);
      } else {
        setPropertyConflict(null);
      }
      
      setIsValidating(false);
    };

    checkProperty();
  }, [form.watch('property_id')]);

  // Validación: Detectar superposición de fechas
  useEffect(() => {
    const validateDates = async () => {
      const propertyId = form.watch('property_id');
      const startDate = form.watch('start_date');
      const endDate = form.watch('end_date');

      if (!propertyId || !startDate || !endDate) {
        setDateConflict(null);
        return;
      }

      setIsValidating(true);
      
      const result = await checkPropertyAvailability(
        propertyId,
        startDate,
        endDate,
        contract?.id
      );

      if (result.hasConflict) {
        setDateConflict(result);
      } else {
        setDateConflict(null);
      }
      
      setIsValidating(false);
    };

    validateDates();
  }, [form.watch('property_id'), form.watch('start_date'), form.watch('end_date')]);

  const onSubmit = async (data: FormValues) => {
    try {
      // VALIDACIÓN FINAL: Verificar conflictos antes de guardar
      if (!contract?.id) {
        const validation = await checkPropertyAvailability(
          data.property_id,
          data.start_date!,
          data.end_date!
        );

        if (validation.hasConflict) {
          toast.error('No se puede guardar el contrato', {
            description: validation.message
          });
          return;
        }
      }

      const payload: any = {
        contract_number: data.contract_number,
        property_id: data.property_id,
        tenant_renter_id: data.tenant_renter_id,
        start_date: data.start_date ? formatDateForDB(data.start_date) : null,
        end_date: data.end_date ? formatDateForDB(data.end_date) : null,
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
        // ✅ Enviar NULL si no hay índice de ajuste o es 'none'
        indice_ajuste: !data.indice_ajuste || data.indice_ajuste === 'none' 
          ? null 
          : data.indice_ajuste,
        // ✅ Enviar NULL para frecuencia si no hay índice de ajuste
        frecuencia_ajuste: !data.indice_ajuste || data.indice_ajuste === 'none' 
          ? null 
          : data.frecuencia_ajuste || null,
        frecuencia_factura: data.frecuencia_factura,
        fecha_primer_ajuste: data.fecha_primer_ajuste ? formatDateForDB(data.fecha_primer_ajuste) : null,
        tenant_id: currentTenant?.id,
      };

      const contractId = contract?.id || savedContractId;

      if (contractId) {
        // Si es un contrato existente
        if (contract?.status === 'active') {
          // Contrato activo: solo permitir editar campos seguros
          const safePayload = {
            special_clauses: data.special_clauses,
            guarantee_details: data.guarantee_details,
          };
          
          const { error } = await supabase
            .from('pms_contracts')
            .update(safePayload)
            .eq('id', contractId);
          
          if (error) throw error;
          toast.success('Contrato actualizado (campos editables)');
        } else if (contract?.status === 'draft' && data.status === 'active') {
          // Borrador → Activo: usar activate_contract
          const { error: updateError } = await supabase
            .from('pms_contracts')
            .update(payload)
            .eq('id', contractId);
          
          if (updateError) throw updateError;

          const { error: activateError } = await supabase
            .rpc('activate_contract', { contract_id_param: contractId });
          
          if (activateError) throw activateError;
          toast.success('Contrato activado exitosamente');
        } else {
          // Borrador → Borrador: edición completa
          const { error } = await supabase
            .from('pms_contracts')
            .update(payload)
            .eq('id', contractId);
          
          if (error) throw error;
          toast.success('Contrato actualizado');
        }
      } else {
        // Contrato nuevo
        if (data.status === 'active') {
          // Crear como borrador primero
          const { data: newContract, error: insertError } = await supabase
            .from('pms_contracts')
            .insert([{ ...payload, status: 'draft' }])
            .select()
            .single();
          
          if (insertError) throw insertError;

          // Luego activar
          const { error: activateError } = await supabase
            .rpc('activate_contract', { contract_id_param: newContract.id });
          
          if (activateError) throw activateError;
          toast.success('Contrato creado y activado');
        } else {
          // Crear como borrador
          const { data: newContract, error: insertError } = await supabase
            .from('pms_contracts')
            .insert([payload])
            .select()
            .single();
          
          if (insertError) throw insertError;
          
          toast.success('Contrato guardado exitosamente', {
            description: 'Usa el botón "Ver" para cargar documentos del contrato'
          });
        }
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
      setSavedContractId(null);
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
        
        {isClonedProperty && parentContractInfo && (
          <Alert className="mb-4 border-blue-500 bg-blue-50 dark:bg-blue-950">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800 dark:text-blue-200">🏠 Propiedad Clonada</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300 space-y-2">
              <p>Esta propiedad es una clonación para nuevos propietarios.</p>
              <div className="p-2 bg-white dark:bg-gray-900 rounded border text-sm">
                <p><strong>Contrato anterior:</strong> {parentContractInfo.contract_number}</p>
                <p><strong>Cancelado:</strong> {format(parseDateFromDB(parentContractInfo.cancelled_at), 'dd/MM/yyyy')}</p>
                <p><strong>Razón:</strong> {parentContractInfo.cancellation_reason}</p>
              </div>
              <p className="text-xs italic">
                💡 El nuevo contrato debe iniciar el día siguiente a la cancelación del anterior.
              </p>
            </AlertDescription>
          </Alert>
        )}
        
        {contract?.status === 'active' && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Contrato Activo - Edición Limitada</AlertTitle>
            <AlertDescription>
              Los campos críticos no pueden modificarse en contratos activos.
              Solo puede editar las cláusulas especiales y detalles de garantía.
              Para modificar otros campos, debe cancelar este contrato y crear uno nuevo.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contract_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Contrato</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="CONT-001" disabled={isFieldDisabled('contract_number')} />
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
                    <FormLabel>Estado del Contrato</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={contract?.status === 'active' || contract?.status === 'cancelled' || contract?.status === 'expired'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Borrador</SelectItem>
                        <SelectItem value="active">Activo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-sm text-muted-foreground">
                      <strong>Borrador:</strong> Permite ediciones completas. No genera items de pago.<br />
                      <strong>Activo:</strong> Contrato en vigencia. Genera items de pago automáticos.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Alerta si se selecciona Activo */}
            {form.watch('status') === 'active' && !contract?.id && (
              <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800 dark:text-blue-200">
                  Activación de Contrato
                </AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                  Al guardar este contrato como <strong>Activo</strong>, se ejecutarán las siguientes validaciones:
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Debe tener al menos un propietario activo</li>
                    <li>Debe configurar métodos de pago (después de guardar)</li>
                    <li>Si tiene ajustes, debe existir índices económicos cargados</li>
                    <li>Generará automáticamente proyecciones y calendario de pagos</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}

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
                    <SelectTrigger disabled={isFieldDisabled('property_id')}>
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

            {/* ALERTA: Propiedad con contrato activo */}
            {propertyConflict && (
              <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800 dark:text-blue-200">
                  Propiedad con Contrato Activo
                </AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-300 space-y-2">
                  <p>
                    Esta propiedad tiene un contrato activo:
                  </p>
                  <div className="bg-background p-3 rounded border border-blue-200 dark:border-blue-800 mt-2">
                    <p className="text-sm">
                      <strong>Contrato:</strong> {propertyConflict.contract_number}
                    </p>
                    <p className="text-sm">
                      <strong>Inquilino:</strong> {propertyConflict.pms_tenants_renters.full_name}
                    </p>
                    <p className="text-sm">
                      <strong>Vigencia:</strong> {formatDateDisplay(propertyConflict.start_date)} - {formatDateDisplay(propertyConflict.end_date)}
                    </p>
                  </div>
                  <p className="text-xs mt-2">
                    ⚠️ Asegúrate de que las fechas del nuevo contrato no se superpongan con el contrato activo.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* ALERTA: Conflicto de fechas */}
            {dateConflict && dateConflict.hasConflict && (
              <Alert className="border-destructive bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertTitle className="text-destructive">
                  ⛔ Conflicto de Fechas Detectado
                </AlertTitle>
                <AlertDescription className="text-destructive/90 space-y-2">
                  <p>
                    {dateConflict.message}
                  </p>
                  <div className="bg-background p-3 rounded border border-destructive mt-2">
                    <p className="text-sm">
                      <strong>Contrato existente:</strong> {dateConflict.activeContract.contract_number}
                    </p>
                    <p className="text-sm">
                      <strong>Inquilino:</strong> {dateConflict.activeContract.tenant_name}
                    </p>
                    <p className="text-sm">
                      <strong>Período:</strong> {formatDateDisplay(dateConflict.activeContract.start_date)} - {formatDateDisplay(dateConflict.activeContract.end_date)}
                    </p>
                  </div>
                  <p className="font-semibold text-sm mt-2">
                    ❌ No se puede guardar este contrato hasta que se resuelva el conflicto.
                  </p>
                </AlertDescription>
              </Alert>
            )}

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
                    <SelectTrigger disabled={isFieldDisabled('tenant_renter_id')}>
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
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Inicio</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            disabled={contract?.status === 'active'}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              formatDateToDisplay(field.value)
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Fin</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              formatDateToDisplay(field.value)
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
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
                        disabled={isFieldDisabled('monthly_rent')}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFieldDisabled('currency')}>
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
                        className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Primer Ajuste</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              formatDateToDisplay(field.value)
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
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
                  <ContractPaymentMethods 
                    contractId={contract.id}
                    propertyId={form.watch('property_id')}
                    montoA={form.watch('monto_a')}
                    montoB={form.watch('monto_b')}
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => {
                onOpenChange(false);
                setSavedContractId(null);
              }}>
                Cancelar
              </Button>
              
              <Button 
                type="submit"
                disabled={dateConflict?.hasConflict || isValidating}
              >
                {isValidating 
                  ? 'Validando...' 
                  : contract?.id 
                    ? 'Actualizar Contrato' 
                    : 'Guardar Contrato'}
              </Button>
            </div>
            
            {/* Mensaje de ayuda si hay conflicto */}
            {dateConflict?.hasConflict && (
              <p className="text-sm text-destructive text-center mt-2">
                💡 Sugerencia: Ajusta las fechas o cancela el contrato existente antes de crear uno nuevo.
              </p>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
