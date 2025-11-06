import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';

interface TenantCreationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const TenantCreationForm = ({ onSuccess, onCancel }: TenantCreationFormProps) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [tenantType, setTenantType] = useState<'inmobiliaria' | 'gestor' | 'propietario'>('inmobiliaria');

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !slug) {
      toast.error('Complete todos los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const { data: existingTenant } = await supabase
        .from('pms_tenants')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existingTenant) {
        toast.error('El slug ya está en uso. Por favor elija otro.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('pms_tenants').insert({
        name,
        slug,
        tenant_type: tenantType,
        is_active: true,
        settings: {},
      });

      if (error) throw error;

      toast.success('Tenant creado exitosamente');
      onSuccess();
    } catch (error: any) {
      console.error('Error al crear tenant:', error);
      toast.error('Error al crear el tenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Building2 className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Crear Nuevo Tenant</h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nombre del Tenant *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Ej: Inmobiliaria ABC"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug (URL) *</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(generateSlug(e.target.value))}
          placeholder="inmobiliaria-abc"
          required
        />
        <p className="text-xs text-muted-foreground">
          Se usará en la URL de acceso: /pms/{slug}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tenant_type">Tipo de Tenant *</Label>
        <Select value={tenantType} onValueChange={(value: any) => setTenantType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inmobiliaria">Inmobiliaria</SelectItem>
            <SelectItem value="gestor">Property Manager</SelectItem>
            <SelectItem value="propietario">Propietario Individual</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {tenantType === 'propietario' && 'Un propietario que gestiona sus propias propiedades'}
          {tenantType === 'inmobiliaria' && 'Inmobiliaria que gestiona propiedades de terceros'}
          {tenantType === 'gestor' && 'Property manager independiente que gestiona propiedades'}
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Creando...' : 'Crear Tenant'}
        </Button>
      </div>
    </form>
  );
};
