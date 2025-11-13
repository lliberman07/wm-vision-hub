import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, DollarSign, Users, Building, FileText, Briefcase, Check, X, Eye } from "lucide-react";
import { SubscriptionPlansComparator } from "./SubscriptionPlansComparator";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  max_users: number;
  max_properties: number | null;
  max_contracts: number | null;
  max_branches: number;
  additional_limits: any;
  features: any;
  price_monthly: number;
  price_yearly: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const AVAILABLE_FEATURES = [
  { id: 'advanced_reports', label: 'Reportes Avanzados' },
  { id: 'multi_currency', label: 'Multi-Moneda' },
  { id: 'custom_branding', label: 'Marca Personalizada' },
  { id: 'api_access', label: 'Acceso API' },
  { id: 'priority_support', label: 'Soporte Prioritario' },
  { id: 'bulk_operations', label: 'Operaciones Masivas' },
  { id: 'advanced_analytics', label: 'Analytics Avanzado' },
  { id: 'white_label', label: 'White Label' },
];

const planFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().min(1, "La descripción es requerida").max(500),
  slug: z.string().min(1, "El slug es requerido").regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  max_users: z.number().min(1, "Mínimo 1 usuario").max(999999),
  max_properties: z.number().min(1).max(999999).nullable(),
  max_contracts: z.number().min(1).max(999999).nullable(),
  max_branches: z.number().min(1, "Mínimo 1 sucursal").max(999999),
  price_monthly: z.number().min(0, "El precio no puede ser negativo"),
  price_yearly: z.number().min(0, "El precio no puede ser negativo"),
  is_active: z.boolean(),
  sort_order: z.number().min(0),
  features: z.record(z.boolean()),
  additional_limits: z.record(z.number()),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

export function SubscriptionPlansManagement() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMigrationBanner, setShowMigrationBanner] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [additionalLimits, setAdditionalLimits] = useState<Array<{ key: string; value: number }>>([]);
  const { toast } = useToast();

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "",
      description: "",
      slug: "",
      max_users: 5,
      max_properties: 10,
      max_contracts: 10,
      max_branches: 1,
      price_monthly: 0,
      price_yearly: 0,
      is_active: true,
      sort_order: 0,
      features: AVAILABLE_FEATURES.reduce((acc, f) => ({ ...acc, [f.id]: false }), {}),
      additional_limits: {},
    },
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (editingPlan) {
      form.reset({
        name: editingPlan.name,
        description: editingPlan.description,
        slug: editingPlan.slug,
        max_users: editingPlan.max_users,
        max_properties: editingPlan.max_properties,
        max_contracts: editingPlan.max_contracts,
        max_branches: editingPlan.max_branches,
        price_monthly: editingPlan.price_monthly,
        price_yearly: editingPlan.price_yearly,
        is_active: editingPlan.is_active,
        sort_order: editingPlan.sort_order,
        features: editingPlan.features || {},
        additional_limits: editingPlan.additional_limits || {},
      });
      
      const limits = Object.entries(editingPlan.additional_limits || {}).map(([key, value]) => ({
        key,
        value: value as number,
      }));
      setAdditionalLimits(limits);
    } else {
      form.reset({
        name: "",
        description: "",
        slug: "",
        max_users: 5,
        max_properties: 10,
        max_contracts: 10,
        max_branches: 1,
        price_monthly: 0,
        price_yearly: 0,
        is_active: true,
        sort_order: plans.length,
        features: AVAILABLE_FEATURES.reduce((acc, f) => ({ ...acc, [f.id]: false }), {}),
        additional_limits: {},
      });
      setAdditionalLimits([]);
    }
    setShowPreview(false);
  }, [editingPlan, plans.length]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los planes de suscripción",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (planId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: !currentState })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Plan ${!currentState ? 'activado' : 'desactivado'} correctamente`
      });
      
      fetchPlans();
    } catch (error) {
      console.error('Error toggling plan:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del plan",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatLimit = (limit: number | null) => {
    if (limit === null || limit === 999999) return 'Ilimitado';
    return limit.toString();
  };

  const calculateDiscount = (monthly: number, yearly: number) => {
    if (monthly === 0) return 0;
    const monthlyTotal = monthly * 12;
    return Math.round(((monthlyTotal - yearly) / monthlyTotal) * 100);
  };

  const handleAddLimit = () => {
    setAdditionalLimits([...additionalLimits, { key: "", value: 0 }]);
  };

  const handleRemoveLimit = (index: number) => {
    const newLimits = additionalLimits.filter((_, i) => i !== index);
    setAdditionalLimits(newLimits);
  };

  const handleLimitChange = (index: number, field: 'key' | 'value', value: string | number) => {
    const newLimits = [...additionalLimits];
    if (field === 'key') {
      newLimits[index].key = value as string;
    } else {
      newLimits[index].value = value as number;
    }
    setAdditionalLimits(newLimits);
  };

  const onSubmit = async (values: PlanFormValues) => {
    try {
      // Convert additional limits array to object
      const additionalLimitsObj = additionalLimits.reduce((acc, limit) => {
        if (limit.key) {
          acc[limit.key] = limit.value;
        }
        return acc;
      }, {} as Record<string, number>);

      const planData = {
        name: values.name,
        slug: values.slug,
        description: values.description,
        max_users: values.max_users,
        max_properties: values.max_properties,
        max_contracts: values.max_contracts,
        max_branches: values.max_branches,
        price_monthly: values.price_monthly,
        price_yearly: values.price_yearly,
        is_active: values.is_active,
        sort_order: values.sort_order,
        features: values.features as any,
        additional_limits: additionalLimitsObj as any,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Plan actualizado correctamente",
        });
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert([planData]);

        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Plan creado correctamente",
        });
      }

      setIsDialogOpen(false);
      fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el plan",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/4 animate-pulse"></div>
        <div className="h-64 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Migration Banner */}
      {showMigrationBanner && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-l-4 border-primary rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Building className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Gestión Migrada a Granada Platform</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                La gestión centralizada de planes de suscripción ahora se realiza desde <strong>Granada Admin</strong>.
                Desde allí puedes crear, editar y gestionar todos los planes que se mostrarán en la página pública de Granada Platform.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.location.href = '/granada-admin/subscription-plans'}
                  className="gap-2"
                >
                  Ir a Granada Admin
                  <span className="text-xs">→</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMigrationBanner(false)}
                >
                  Cerrar aviso
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Planes de Suscripción</h2>
          <p className="text-muted-foreground">
            Gestiona los planes disponibles para los tenants
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SubscriptionPlansComparator />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingPlan(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Plan
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
              </DialogTitle>
              <DialogDescription>
                Configura los límites y características del plan de suscripción
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="basic">Básico</TabsTrigger>
                    <TabsTrigger value="limits">Límites</TabsTrigger>
                    <TabsTrigger value="additional">Adicionales</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="pricing">Precios</TabsTrigger>
                  </TabsList>

                  {/* Información Básica */}
                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Plan</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Plan Profesional" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug (URL amigable)</FormLabel>
                          <FormControl>
                            <Input placeholder="plan-profesional" {...field} />
                          </FormControl>
                          <FormDescription>
                            Solo minúsculas, números y guiones. Ej: plan-profesional
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
                            <Textarea 
                              placeholder="Descripción del plan..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="sort_order"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Orden</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>Orden de visualización</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="is_active"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Plan Activo</FormLabel>
                              <FormDescription>
                                Disponible para suscripción
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  {/* Límites Críticos */}
                  <TabsContent value="limits" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="max_users"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Máximo de Usuarios</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>999999 = Ilimitado</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="max_properties"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Máximo de Propiedades</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                              />
                            </FormControl>
                            <FormDescription>999999 = Ilimitado</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="max_contracts"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Máximo de Contratos</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                              />
                            </FormControl>
                            <FormDescription>999999 = Ilimitado</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="max_branches"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Máximo de Sucursales</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>999999 = Ilimitado</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  {/* Límites Adicionales */}
                  <TabsContent value="additional" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Límites Personalizados</h4>
                        <p className="text-sm text-muted-foreground">
                          Agrega límites adicionales específicos
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddLimit}>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Límite
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {additionalLimits.map((limit, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <div className="flex-1">
                            <Label>Nombre</Label>
                            <Input
                              placeholder="max_reports"
                              value={limit.key}
                              onChange={(e) => handleLimitChange(index, 'key', e.target.value)}
                            />
                          </div>
                          <div className="w-32">
                            <Label>Valor</Label>
                            <Input
                              type="number"
                              value={limit.value}
                              onChange={(e) => handleLimitChange(index, 'value', parseInt(e.target.value))}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mt-8"
                            onClick={() => handleRemoveLimit(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      {additionalLimits.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No hay límites adicionales configurados
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Features */}
                  <TabsContent value="features" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Características del Plan</h4>
                        <p className="text-sm text-muted-foreground">
                          Selecciona las características incluidas en este plan
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {AVAILABLE_FEATURES.map((feature) => (
                          <FormField
                            key={feature.id}
                            control={form.control}
                            name={`features.${feature.id}`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-normal cursor-pointer">
                                    {feature.label}
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Precios */}
                  <TabsContent value="pricing" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price_monthly"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Precio Mensual (ARS)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="price_yearly"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Precio Anual (ARS)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Cálculo de descuento */}
                    <div className="rounded-lg border bg-muted/50 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Descuento Anual</p>
                          <p className="text-xs text-muted-foreground">
                            vs pago mensual (12 meses)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {calculateDiscount(form.watch('price_monthly'), form.watch('price_yearly'))}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Ahorro: {formatCurrency((form.watch('price_monthly') * 12) - form.watch('price_yearly'))}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Preview del plan */}
                    <div className="space-y-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowPreview(!showPreview)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {showPreview ? 'Ocultar' : 'Ver'} Preview
                      </Button>

                      {showPreview && (
                        <Card>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle>{form.watch('name') || 'Nombre del Plan'}</CardTitle>
                              <Badge variant={form.watch('is_active') ? 'default' : 'secondary'}>
                                {form.watch('is_active') ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                            <CardDescription>{form.watch('description') || 'Descripción del plan'}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Precios</p>
                              <div className="flex gap-4">
                                <div>
                                  <p className="text-2xl font-bold">{formatCurrency(form.watch('price_monthly'))}</p>
                                  <p className="text-xs text-muted-foreground">/ mes</p>
                                </div>
                                <div>
                                  <p className="text-2xl font-bold">{formatCurrency(form.watch('price_yearly'))}</p>
                                  <p className="text-xs text-muted-foreground">/ año</p>
                                </div>
                              </div>
                            </div>

                            <Separator />

                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Límites</p>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>Usuarios: {formatLimit(form.watch('max_users'))}</div>
                                <div>Propiedades: {formatLimit(form.watch('max_properties'))}</div>
                                <div>Contratos: {formatLimit(form.watch('max_contracts'))}</div>
                                <div>Sucursales: {formatLimit(form.watch('max_branches'))}</div>
                              </div>
                            </div>

                            {additionalLimits.length > 0 && (
                              <>
                                <Separator />
                                <div>
                                  <p className="text-sm text-muted-foreground mb-2">Límites Adicionales</p>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    {additionalLimits.map((limit, idx) => (
                                      <div key={idx}>{limit.key}: {limit.value}</div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}

                            <Separator />

                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Características</p>
                              <div className="flex flex-wrap gap-2">
                                {AVAILABLE_FEATURES.filter(f => form.watch(`features.${f.id}`)).map(feature => (
                                  <Badge key={feature.id} variant="default">
                                    <Check className="h-3 w-3 mr-1" />
                                    {feature.label}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingPlan ? 'Actualizar Plan' : 'Crear Plan'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={!plan.is_active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{plan.name}</CardTitle>
                    <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                      {plan.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingPlan(plan);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Switch
                    checked={plan.is_active}
                    onCheckedChange={() => handleToggleActive(plan.id, plan.is_active)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Pricing */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Precios
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Mensual:</span>
                      <p className="font-medium">{formatCurrency(plan.price_monthly)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Anual:</span>
                      <p className="font-medium">{formatCurrency(plan.price_yearly)}</p>
                    </div>
                  </div>
                </div>

                {/* Limits */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Límites</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Usuarios:</span>
                      <span className="font-medium">{formatLimit(plan.max_users)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Propiedades:</span>
                      <span className="font-medium">{formatLimit(plan.max_properties)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Contratos:</span>
                      <span className="font-medium">{formatLimit(plan.max_contracts)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Sucursales:</span>
                      <span className="font-medium">{formatLimit(plan.max_branches)}</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                {Object.keys(plan.features).length > 0 && (
                  <div className="space-y-2 md:col-span-2">
                    <h4 className="font-semibold">Características</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(plan.features).map(([key, value]) => (
                        <Badge key={key} variant={value ? 'default' : 'outline'}>
                          {value ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                          {key.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
