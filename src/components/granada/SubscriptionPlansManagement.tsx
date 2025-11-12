import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit, Eye } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: string;
  max_properties: number | null;
  max_contracts: number | null;
  max_client_admins: number;
  is_active: boolean;
  created_at: string;
}

export function SubscriptionPlansManagement() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    currency: 'ARS',
    billing_cycle: 'monthly',
    max_properties: '',
    max_contracts: '',
    max_client_admins: '1',
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pms_subscription_plans' as any)
        .select('*')
        .order('price');

      if (error) throw error;
      setPlans(data as any || []);
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar los planes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (value: string) => {
    setFormData({
      ...formData,
      name: value,
      slug: generateSlug(value),
    });
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('pms_subscription_plans' as any)
        .insert({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          price: parseFloat(formData.price),
          currency: formData.currency,
          billing_cycle: formData.billing_cycle,
          max_properties: formData.max_properties ? parseInt(formData.max_properties) : null,
          max_contracts: formData.max_contracts ? parseInt(formData.max_contracts) : null,
          max_client_admins: parseInt(formData.max_client_admins),
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: 'Plan creado',
        description: 'El plan ha sido creado exitosamente',
      });

      setDialogOpen(false);
      setFormData({
        name: '',
        slug: '',
        description: '',
        price: '',
        currency: 'ARS',
        billing_cycle: 'monthly',
        max_properties: '',
        max_contracts: '',
        max_client_admins: '1',
      });
      fetchPlans();
    } catch (error: any) {
      console.error('Error creating plan:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el plan',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('pms_subscription_plans' as any)
        .update({ is_active: !currentStatus })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: 'Estado actualizado',
        description: `Plan ${!currentStatus ? 'activado' : 'desactivado'} correctamente`,
      });

      fetchPlans();
    } catch (error: any) {
      console.error('Error updating plan status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Planes de Suscripción</CardTitle>
            <CardDescription>
              Gestionar planes disponibles para clientes
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleCreatePlan}>
                <DialogHeader>
                  <DialogTitle>Crear Plan de Suscripción</DialogTitle>
                  <DialogDescription>
                    Definir un nuevo plan con sus características y límites
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre del Plan *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Ej: Plan Profesional"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="slug">Identificador (Slug) *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="plan-profesional"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descripción del plan"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="price">Precio *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="currency">Moneda *</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => setFormData({ ...formData, currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ARS">ARS</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="billing_cycle">Ciclo *</Label>
                      <Select
                        value={formData.billing_cycle}
                        onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensual</SelectItem>
                          <SelectItem value="quarterly">Trimestral</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="max_properties">Máx. Propiedades</Label>
                      <Input
                        id="max_properties"
                        type="number"
                        value={formData.max_properties}
                        onChange={(e) => setFormData({ ...formData, max_properties: e.target.value })}
                        placeholder="Ilimitado"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="max_contracts">Máx. Contratos</Label>
                      <Input
                        id="max_contracts"
                        type="number"
                        value={formData.max_contracts}
                        onChange={(e) => setFormData({ ...formData, max_contracts: e.target.value })}
                        placeholder="Ilimitado"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="max_client_admins">Máx. Admins *</Label>
                      <Input
                        id="max_client_admins"
                        type="number"
                        min="1"
                        value={formData.max_client_admins}
                        onChange={(e) => setFormData({ ...formData, max_client_admins: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Crear Plan
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Ciclo</TableHead>
              <TableHead>Propiedades</TableHead>
              <TableHead>Contratos</TableHead>
              <TableHead>Admins</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{plan.name}</div>
                    <div className="text-xs text-muted-foreground">{plan.slug}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {plan.currency} ${plan.price.toLocaleString()}
                </TableCell>
                <TableCell className="capitalize">
                  {plan.billing_cycle === 'monthly' ? 'Mensual' : 
                   plan.billing_cycle === 'quarterly' ? 'Trimestral' : 'Anual'}
                </TableCell>
                <TableCell>{plan.max_properties || 'Ilimitadas'}</TableCell>
                <TableCell>{plan.max_contracts || 'Ilimitados'}</TableCell>
                <TableCell>{plan.max_client_admins}</TableCell>
                <TableCell>
                  <Badge variant={plan.is_active ? 'default' : 'destructive'}>
                    {plan.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(plan.id, plan.is_active)}
                  >
                    {plan.is_active ? 'Desactivar' : 'Activar'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {plans.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay planes registrados
          </div>
        )}
      </CardContent>
    </Card>
  );
}
