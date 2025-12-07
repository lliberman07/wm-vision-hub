import { useEffect, useState } from 'react';
import { useClient } from '@/contexts/ClientContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Save, Star, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export function ClientSettings() {
  const { clientData, refreshClientData } = useClient();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cuit: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    phone: '',
    email: '',
    timezone: 'America/Argentina/Buenos_Aires',
    currency: 'ARS',
    language: 'es',
  });

  // Refrescar datos al montar el componente
  useEffect(() => {
    refreshClientData();
  }, []);

  useEffect(() => {
    if (clientData) {
      const settings = clientData.settings || {};
      const contactInfo = settings.contact_info || {};
      
      console.log('ClientSettings: clientData updated, settings.email =', settings.email);
      
      setFormData({
        name: clientData.name || '',
        cuit: settings.tax_id || settings.cuit || contactInfo.cuit_cuil || '',
        address: settings.address || contactInfo.address || '',
        city: settings.city || contactInfo.city || '',
        state: settings.state || contactInfo.province || '',
        postal_code: settings.postal_code || contactInfo.postal_code || '',
        phone: settings.phone || contactInfo.phone || '',
        email: settings.email || contactInfo.email || '',
        timezone: settings.timezone || 'America/Argentina/Buenos_Aires',
        currency: settings.currency || 'ARS',
        language: settings.language || 'es',
      });
    }
  }, [clientData]);

  const handleSave = async () => {
    if (!clientData) return;

    setSaving(true);

    try {
      const updatedSettings = {
        ...(clientData.settings || {}),
        tax_id: formData.cuit,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        phone: formData.phone,
        email: formData.email,
        timezone: formData.timezone,
        currency: formData.currency,
        language: formData.language,
      };

      const { error } = await supabase
        .from('pms_tenants')
        .update({
          name: formData.name,
          settings: updatedSettings
        })
        .eq('id', clientData.id);

      if (error) throw error;

      toast.success('Información guardada exitosamente');
      refreshClientData();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar información');
    } finally {
      setSaving(false);
    }
  };

  if (!clientData) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Datos de la Organización</h2>
        <p className="text-muted-foreground">Gestiona la información de tu organización</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Organización</CardTitle>
          <CardDescription>Datos fiscales y de contacto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Razón Social *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>CUIT</Label>
              <Input
                value={formData.cuit}
                onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                placeholder="30-12345678-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Provincia</Label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Código Postal</Label>
              <Input
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+54 11 1234-5678"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Email de Contacto
                {clientData?.settings?.main_contact_user_id && (
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                )}
              </Label>
              <Input
                type="email"
                value={formData.email}
                readOnly={!!clientData?.settings?.main_contact_user_id}
                className={clientData?.settings?.main_contact_user_id ? 'bg-muted cursor-not-allowed' : ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          
          {clientData?.settings?.main_contact_user_id && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Email asignado desde{' '}
              <Link 
                to="/client-admin/users" 
                className="text-primary underline hover:no-underline"
              >
                Equipo Administrativo
              </Link>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferencias del Sistema</CardTitle>
          <CardDescription>Configuración regional y de visualización</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Zona Horaria</Label>
              <Select value={formData.timezone} onValueChange={(v) => setFormData({ ...formData, timezone: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</SelectItem>
                  <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                  <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Moneda Preferida</Label>
              <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                  <SelectItem value="USD">USD - Dólar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Idioma</Label>
              <Select value={formData.language} onValueChange={(v) => setFormData({ ...formData, language: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar Información'}
        </Button>
      </div>
    </div>
  );
}
