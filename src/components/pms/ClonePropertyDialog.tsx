import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Copy, AlertCircle } from 'lucide-react';

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
  
  useEffect(() => {
    if (open && property?.code) {
      generateSuggestedCode(property.code);
    }
  }, [open, property?.code]);
  
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Clonar Propiedad
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Se creará una copia de <strong>{property.code}</strong> con todos sus datos,
              excepto el código y estado. Los propietarios serán copiados automáticamente.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label>Código Original</Label>
            <Input value={property.code} disabled className="font-mono" />
          </div>
          
          <div className="space-y-2">
            <Label>Nuevo Código *</Label>
            <Input
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
              placeholder="Ej: PROP-001-C1"
              className="font-mono"
            />
            {suggestedCode && customCode !== suggestedCode && (
              <p className="text-xs text-muted-foreground">
                💡 Sugerencia: <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0"
                  onClick={() => setCustomCode(suggestedCode)}
                >
                  {suggestedCode}
                </Button>
              </p>
            )}
          </div>
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
            disabled={isCloning || !customCode}
          >
            {isCloning ? 'Clonando...' : 'Clonar Propiedad'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};