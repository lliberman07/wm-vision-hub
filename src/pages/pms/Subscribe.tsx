import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, Package, Award, Rocket } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  currency: string;
  max_users: number;
  max_properties: number | null;
  max_contracts: number | null;
  max_branches: number;
  features: any;
  additional_limits: any;
}

export default function Subscribe() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const planSlug = searchParams.get('plan');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    company_name: '',
    tax_id: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    payment_method: '',
    reason: ''
  });

  const getPlanIcon = (slug: string) => {
    if (slug.includes('basico')) return Package;
    if (slug.includes('profesional')) return Award;
    return Rocket;
  };

  useEffect(() => {
    if (!user) {
      navigate(`/auth?returnTo=/pms/subscribe${planSlug ? `?plan=${planSlug}` : ''}`);
      return;
    }
    fetchPlan();
  }, [user, planSlug]);

  const fetchPlan = async () => {
    if (!planSlug) {
      toast({
        title: "Error",
        description: "No se especificó un plan",
        variant: "destructive"
      });
      navigate('/services/property-management');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('slug', planSlug)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Error",
          description: "Plan no encontrado",
          variant: "destructive"
        });
        navigate('/services/property-management');
        return;
      }

      setSelectedPlan(data as any);
    } catch (error) {
      console.error('Error fetching plan:', error);
      toast({
        title: "Error",
        description: "Error al cargar el plan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPlan) return;

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('pms_access_requests')
        .insert({
          user_id: user.id,
          tenant_id: (await supabase.rpc('get_default_tenant_id')).data,
          email: user.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          company_name: formData.company_name,
          tax_id: formData.tax_id,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          requested_role: 'INMOBILIARIA',
          reason: formData.reason,
          desired_plan_id: selectedPlan.id,
          billing_cycle: billingCycle,
          payment_method: formData.payment_method,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Solicitud enviada",
        description: "Recibirás un email cuando tu suscripción sea aprobada"
      });

      navigate('/pms');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: "Error al enviar la solicitud",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedPlan) return null;

  const IconComponent = getPlanIcon(selectedPlan.slug);
  const price = billingCycle === 'yearly' ? selectedPlan.yearly_price : selectedPlan.monthly_price;
  const savingsPercent = selectedPlan.yearly_price > 0 
    ? Math.round(((selectedPlan.monthly_price * 12 - selectedPlan.yearly_price) / (selectedPlan.monthly_price * 12)) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Plan Summary */}
        <Card className="border-primary shadow-medium">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <IconComponent className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle>{selectedPlan.name}</CardTitle>
                <Badge variant="secondary">Plan Seleccionado</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={billingCycle} onValueChange={(v) => setBillingCycle(v as 'monthly' | 'yearly')}>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Mensual</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedPlan.currency} ${selectedPlan.monthly_price.toLocaleString()} /mes
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="yearly" id="yearly" />
                  <Label htmlFor="yearly" className="flex-1 cursor-pointer">
                    <div className="font-semibold flex items-center gap-2">
                      Anual
                      {savingsPercent > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Ahorra {savingsPercent}%
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedPlan.currency} ${selectedPlan.yearly_price.toLocaleString()} /año
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span>{selectedPlan.currency} ${price.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {billingCycle === 'yearly' ? 'Facturación anual' : 'Facturación mensual'}
              </p>
            </div>

            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>14 días de prueba gratis</strong> al aprobar tu suscripción
              </AlertDescription>
            </Alert>

            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Usuarios:</span>
                <span className="font-medium">{selectedPlan.max_users}</span>
              </div>
              {selectedPlan.max_properties && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Propiedades:</span>
                  <span className="font-medium">{selectedPlan.max_properties}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Subscription Form */}
        <Card>
          <CardHeader>
            <CardTitle>Datos de Suscripción</CardTitle>
            <CardDescription>
              Complete sus datos para solicitar la suscripción
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nombre *</Label>
                  <Input
                    id="first_name"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Apellido *</Label>
                  <Input
                    id="last_name"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">Empresa/Inmobiliaria</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_id">CUIT/CUIL</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Provincia</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Método de pago preferido *</Label>
                <Select
                  required
                  value={formData.payment_method}
                  onValueChange={(v) => setFormData({ ...formData, payment_method: v })}
                >
                  <SelectTrigger id="payment_method">
                    <SelectValue placeholder="Seleccione método de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Transferencia">Transferencia bancaria</SelectItem>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="A coordinar">A coordinar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Comentarios adicionales</Label>
                <Textarea
                  id="reason"
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Cuéntanos sobre tu negocio..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/services/property-management')}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Solicitar Suscripción'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
