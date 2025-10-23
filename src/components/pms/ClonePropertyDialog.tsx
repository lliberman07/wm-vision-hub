import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Copy, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { parseDateFromDB } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

interface ClonePropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: any;
  onSuccess: () => void;
}

export const ClonePropertyDialog = ({ open, onOpenChange, property, onSuccess }: ClonePropertyDialogProps) => {
  const [isCloning, setIsCloning] = useState(false);
  const [suggestedCode, setSuggestedCode] = useState('');
  const [customCode, setCustomCode] = useState('');
  
  // FASE 2: Estados para detección de contratos y validación
  const [hasActiveContract, setHasActiveContract] = useState<boolean | null>(null);
  const [activeContractInfo, setActiveContractInfo] = useState<any>(null);
  const [showComplexProcess, setShowComplexProcess] = useState(false);
  const [confirmedComplexProcess, setConfirmedComplexProcess] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeValidation, setCodeValidation] = useState<{
    isValid: boolean | null;
    message: string;
  }>({ isValid: null, message: '' });
  
  useEffect(() => {
    if (open && property?.code) {
      generateSuggestedCode(property.code);
      checkActiveContract(property.id);
      setConfirmedComplexProcess(false);
      setCodeValidation({ isValid: null, message: '' });
    }
  }, [open, property?.code, property?.id]);
  
  const generateSuggestedCode = async (parentCode: string) => {
    try {
      const { data, error } = await supabase.rpc('generate_property_clone_code', {
        p_parent_code: parentCode
      });
      
      if (error) throw error;
      setSuggestedCode(data || '');
      setCustomCode(data || '');
    } catch (error) {
      console.error('Error generating code:', error);
      setSuggestedCode(`${parentCode}-CLON`);
      setCustomCode(`${parentCode}-CLON`);
    }
  };
  
  // FASE 2: Verificar si existe contrato activo
  const checkActiveContract = async (propertyId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('pms_contracts')
        .select('id, contract_number, start_date, end_date, monthly_rent, currency')
        .eq('property_id', propertyId)
        .eq('status', 'active')
        .lte('start_date', today)
        .gte('end_date', today)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      const hasContract = !!data;
      setHasActiveContract(hasContract);
      setActiveContractInfo(data);
      setShowComplexProcess(hasContract);
      
    } catch (error) {
      console.error('Error checking contract:', error);
      setHasActiveContract(false);
    }
  };
  
  // FASE 2: Validación de código en tiempo real
  const validateCloneCode = async (code: string) => {
    if (!code.trim()) {
      setCodeValidation({ isValid: null, message: '' });
      return;
    }
    
    setIsValidatingCode(true);
    
    try {
      const { data, error } = await supabase.rpc('validate_property_code', {
        p_code: code,
        p_property_id: null,
        p_tenant_id: property.tenant_id
      });
      
      if (error) throw error;
      
      if (data) {
        setCodeValidation({
          isValid: true,
          message: '✓ Código disponible'
        });
      } else {
        setCodeValidation({
          isValid: false,
          message: `❌ El código "${code.toUpperCase()}" ya existe`
        });
      }
    } catch (error) {
      console.error('Error validating code:', error);
      setCodeValidation({ isValid: null, message: '' });
    } finally {
      setIsValidatingCode(false);
    }
  };
  
  // Debounce para validación
  useEffect(() => {
    if (!customCode) return;
    
    const timer = setTimeout(() => {
      validateCloneCode(customCode);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [customCode]);
  
  const handleClone = async () => {
    if (!property?.id || !customCode) return;
    
    setIsCloning(true);
    try {
      // 1. Copiar propiedad
      const { data: originalProperty } = await supabase
        .from('pms_properties')
        .select('*')
        .eq('id', property.id)
        .single();
      
      if (!originalProperty) throw new Error('Propiedad no encontrada');
      
      const { id, code, created_at, updated_at, ...propertyData } = originalProperty;
      
      const baseCode = code.replace(/-C\d+$/, '');
      
      const clonePayload = {
        ...propertyData,
        code: customCode.trim().toUpperCase(),
        base_property_code: baseCode,
        is_clone: true,
        parent_property_id: property.id,
        status: 'available',
        photos: originalProperty.photos || []
      };
      
      const { data: newProperty, error: propertyError } = await supabase
        .from('pms_properties')
        .insert(clonePayload)
        .select()
        .single();
      
      if (propertyError) throw propertyError;
      
      // 2. Copiar propietarios
      const { data: owners } = await supabase
        .from('pms_owner_properties')
        .select('*')
        .eq('property_id', property.id)
        .is('end_date', null);
      
      if (owners && owners.length > 0) {
        const ownersPayload = owners.map(({ id, property_id, ...ownerData }) => ({
          ...ownerData,
          property_id: newProperty.id
        }));
        
        await supabase
          .from('pms_owner_properties')
          .insert(ownersPayload);
      }
      
      // 3. Incrementar clone_count del padre
      await supabase
        .from('pms_properties')
        .update({ clone_count: (originalProperty.clone_count || 0) + 1 })
        .eq('id', property.id);
      
      toast.success('Propiedad clonada exitosamente', {
        description: `Nueva propiedad creada con código ${customCode}`
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error cloning property:', error);
      toast.error('Error al clonar propiedad', {
        description: error.message
      });
    } finally {
      setIsCloning(false);
    }
  };
  
  if (!property) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Clonar Propiedad
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* ALERTA: Información general */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Se creará una copia de <strong>{property.code}</strong> para registrar
              el cambio de propietarios. Los propietarios actuales NO tendrán acceso
              a la propiedad clonada.
            </AlertDescription>
          </Alert>
          
          {/* WARNING COMPLEJO: Solo si tiene contrato activo */}
          {showComplexProcess && activeContractInfo && (
            <Alert variant="destructive" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-200 font-bold">
                ⚠️ ADVERTENCIA: Propiedad con Contrato Activo
              </AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300 space-y-3">
                <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                  <p className="font-semibold mb-1">Contrato Vigente:</p>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>Código:</strong> {activeContractInfo.contract_number}</li>
                    <li>• <strong>Vigencia:</strong> {format(parseDateFromDB(activeContractInfo.start_date), 'dd/MM/yyyy')} - {format(parseDateFromDB(activeContractInfo.end_date), 'dd/MM/yyyy')}</li>
                    <li>• <strong>Renta:</strong> {activeContractInfo.currency} {activeContractInfo.monthly_rent}</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-semibold mb-2">📋 Proceso a seguir DESPUÉS de clonar:</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-sm">
                    <li><strong>Cancelar</strong> el contrato original en la fecha de cambio de propietarios</li>
                    <li><strong>Crear</strong> nuevos propietarios en el sistema (si no existen)</li>
                    <li><strong>Asignar</strong> propietarios a la propiedad clonada</li>
                    <li><strong>Crear</strong> nuevo contrato en la propiedad clonada (día siguiente a la cancelación)</li>
                    <li><strong>Generar</strong> accesos para los nuevos propietarios</li>
                  </ol>
                </div>
                
                <p className="text-xs italic mt-2">
                  💡 <strong>Importante:</strong> La propiedad clonada se creará en estado "Disponible".
                  El nuevo contrato debe crearse manualmente siguiendo el proceso.
                </p>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Campos de entrada */}
          <div className="space-y-2">
            <Label>Código Original</Label>
            <Input value={property.code} disabled className="font-mono bg-muted" />
          </div>
          
          <div className="space-y-2">
            <Label>Nuevo Código *</Label>
            <div className="relative">
              <Input
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                placeholder="Ej: PRIMA1-C1"
                className={cn(
                  "font-mono",
                  codeValidation.isValid === false && "border-red-500",
                  codeValidation.isValid === true && "border-green-500"
                )}
              />
              {isValidatingCode && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            
            {codeValidation.message && (
              <p className={cn(
                "text-sm flex items-center gap-1",
                codeValidation.isValid ? "text-green-600" : "text-red-500"
              )}>
                {codeValidation.message}
              </p>
            )}
            
            {suggestedCode && customCode !== suggestedCode && (
              <p className="text-xs text-muted-foreground">
                💡 Sugerencia: <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 text-xs"
                  onClick={() => setCustomCode(suggestedCode)}
                >
                  {suggestedCode}
                </Button>
              </p>
            )}
          </div>
          
          {/* Checkbox de confirmación OBLIGATORIO para contratos activos */}
          {showComplexProcess && (
            <div className="flex items-start space-x-2 p-3 border-2 border-yellow-400 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
              <Checkbox 
                id="confirm-process" 
                checked={confirmedComplexProcess}
                onCheckedChange={(checked) => setConfirmedComplexProcess(!!checked)}
                className="mt-1"
              />
              <label 
                htmlFor="confirm-process" 
                className="text-sm font-medium leading-tight cursor-pointer"
              >
                ✅ Confirmo que entiendo el proceso completo y seguiré los pasos necesarios
                para cancelar el contrato original y crear el nuevo contrato en la propiedad clonada.
              </label>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCloning}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleClone}
            disabled={
              isCloning || 
              !customCode || 
              codeValidation.isValid === false ||
              (showComplexProcess && !confirmedComplexProcess)
            }
          >
            {isCloning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Clonando...
              </>
            ) : (
              'Clonar Propiedad'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};