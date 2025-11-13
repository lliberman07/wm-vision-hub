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

      if (editingPlan.additional_limits) {
        setAdditionalLimits(
          Object.entries(editingPlan.additional_limits).map(([key, value]) => ({
            key,
            value: value as number,
          }))
        );
      }
    } else {
      form.reset();
      setAdditionalLimits([]);
    }
  }, [editingPlan, form]);

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

  const handleToggleActive = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: !currentStatus })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `El plan ha sido ${!currentStatus ? 'activado' : 'desactivado'} correctamente`,
      });

      fetchPlans();
    } catch (error) {
      console.error('Error updating plan status:', error);
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
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatLimit = (limit: number | null) => {
    if (limit === null || limit === 999999) return 'Ilimitado';
    return limit.toLocaleString('es-AR');
  };

  const calculateDiscount = (monthly: number, yearly: number) => {
    if (monthly === 0) return 0;
    const monthlyTotal = monthly * 12;
    return Math.round(((monthlyTotal - yearly) / monthlyTotal) * 100);
  };

  const addAdditionalLimit = () => {
    setAdditionalLimits([...additionalLimits, { key: '', value: 0 }]);
  };

  const removeAdditionalLimit = (index: number) => {
    setAdditionalLimits(additionalLimits.filter((_, i) => i !== index));
  };

  const updateAdditionalLimit = (index: number, field: 'key' | 'value', value: string | number) => {
    const updated = [...additionalLimits];
    updated[index] = { ...updated[index], [field]: value };
    setAdditionalLimits(updated);
  };

  const onSubmit = async (values: PlanFormValues) => {
    try {
      const additionalLimitsObj = additionalLimits.reduce((acc, { key, value }) => {
        if (key.trim()) acc[key] = value;
        return acc;
      }, {} as Record<string, number>);

      const planData: any = {
        ...values,
        additional_limits: additionalLimitsObj,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) throw error;

        toast({
          title: "Plan actualizado",
          description: "El plan de suscripción ha sido actualizado correctamente",
        });
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert([planData]);

        if (error) throw error;

        toast({
          title: "Plan creado",
          description: "El plan de suscripción ha sido creado correctamente",
        });
      }

      setIsDialogOpen(false);
      setEditingPlan(null);
      form.reset();
      setAdditionalLimits([]);
      fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el plan de suscripción",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando planes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Planes de Suscripción</h2>
          <p className="text-muted-foreground">
            Administra los planes de suscripción del sistema PMS
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {showPreview ? 'Ocultar' : 'Ver'} Comparador
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingPlan(null);
                form.reset();
                setAdditionalLimits([]);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? 'Editar Plan' : 'Nuevo Plan de Suscripción'}
                </DialogTitle>
                <DialogDescription>
                  {editingPlan
                    ? 'Modifica los detalles del plan de suscripción'
                    : 'Crea un nuevo plan de suscripción con sus características y límites'}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="basic">Básico</TabsTrigger>
                      <TabsTrigger value="limits">Límites</TabsTrigger>
                      <TabsTrigger value="additional">Adicionales</TabsTrigger>
                      <TabsTrigger value="features">Características</TabsTrigger>
                      <TabsTrigger value="pricing">Precios</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Plan</FormLabel>
                            <FormControl>
                              <Input placeholder="Básico, Profesional, Enterprise..." {...field} />
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
                              <Input placeholder="basic, professional, enterprise..." {...field} />
                            </FormControl>
                            <FormDescription>
                              Solo minúsculas, números y guiones. Se usará en URLs.
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
                                placeholder="Describe las ventajas de este plan..."
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
                              <FormLabel>Orden de Visualización</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  onChange={e => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>Orden de aparición (menor primero)</FormDescription>
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
                                  Visible para suscripciones
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

                    <TabsContent value="limits" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="max_users"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                <Users className="inline h-4 w-4 mr-2" />
                                Máximo de Usuarios
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  onChange={e => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="max_branches"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                <Building className="inline h-4 w-4 mr-2" />
                                Máximo de Sucursales
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  onChange={e => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="max_properties"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                <Briefcase className="inline h-4 w-4 mr-2" />
                                Máximo de Propiedades
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    field.onChange(val === '' ? null : parseInt(val));
                                  }}
                                />
                              </FormControl>
                              <FormDescription>Dejar vacío para ilimitado</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="max_contracts"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                <FileText className="inline h-4 w-4 mr-2" />
                                Máximo de Contratos
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    field.onChange(val === '' ? null : parseInt(val));
                                  }}
                                />
                              </FormControl>
                              <FormDescription>Dejar vacío para ilimitado</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="additional" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>Límites Adicionales Personalizados</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addAdditionalLimit}>
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Límite
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {additionalLimits.map((limit, index) => (
                          <div key={index} className="flex gap-2 items-start">
                            <Input
                              placeholder="Nombre del límite"
                              value={limit.key}
                              onChange={(e) => updateAdditionalLimit(index, 'key', e.target.value)}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              placeholder="Valor"
                              value={limit.value}
                              onChange={(e) => updateAdditionalLimit(index, 'value', parseInt(e.target.value) || 0)}
                              className="w-32"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeAdditionalLimit(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {additionalLimits.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No hay límites adicionales configurados
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="features" className="space-y-4">
                      <Label>Características Incluidas</Label>
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
                                  <FormLabel className="font-normal">
                                    {feature.label}
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="pricing" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="price_monthly"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                <DollarSign className="inline h-4 w-4 mr-2" />
                                Precio Mensual (ARS)
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
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
                              <FormLabel>
                                <DollarSign className="inline h-4 w-4 mr-2" />
                                Precio Anual (ARS)
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormDescription>
                                Descuento anual: {calculateDiscount(form.watch('price_monthly'), field.value)}%
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Vista Previa de Precios</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Mensual:</span>
                            <span className="font-medium">{formatCurrency(form.watch('price_monthly'))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Anual:</span>
                            <span className="font-medium">{formatCurrency(form.watch('price_yearly'))}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-primary">
                            <span>Ahorro anual:</span>
                            <span className="font-medium">
                              {formatCurrency((form.watch('price_monthly') * 12) - form.watch('price_yearly'))} 
                              ({calculateDiscount(form.watch('price_monthly'), form.watch('price_yearly'))}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setIsDialogOpen(false);
                      setEditingPlan(null);
                      form.reset();
                      setAdditionalLimits([]);
                    }}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingPlan ? 'Actualizar' : 'Crear'} Plan
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {showPreview && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Vista Previa del Comparador Público
            </CardTitle>
            <CardDescription>
              Así verán los clientes la comparación de planes en la página de Granada Platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubscriptionPlansComparator />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {plans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay planes configurados</h3>
              <p className="text-muted-foreground text-center mb-4">
                Crea tu primer plan de suscripción para comenzar
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          plans.map((plan) => (
            <Card key={plan.id} className={plan.is_active ? '' : 'opacity-60'}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{plan.name}</CardTitle>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <Badge variant="outline">Orden: {plan.sort_order}</Badge>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
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
                    <Button
                      variant={plan.is_active ? "destructive" : "default"}
                      size="sm"
                      onClick={() => handleToggleActive(plan.id, plan.is_active)}
                    >
                      {plan.is_active ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Pricing */}
                  <div className="flex gap-4">
                    <div className="flex-1 p-4 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Precio Mensual</div>
                      <div className="text-2xl font-bold">{formatCurrency(plan.price_monthly)}</div>
                    </div>
                    <div className="flex-1 p-4 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Precio Anual</div>
                      <div className="text-2xl font-bold">{formatCurrency(plan.price_yearly)}</div>
                      {plan.price_monthly > 0 && (
                        <div className="text-xs text-primary mt-1">
                          {calculateDiscount(plan.price_monthly, plan.price_yearly)}% descuento
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Core Limits */}
                  <div>
                    <h4 className="font-medium mb-2">Límites Principales</h4>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatLimit(plan.max_users)} usuarios</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatLimit(plan.max_properties)} propiedades</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatLimit(plan.max_contracts)} contratos</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatLimit(plan.max_branches)} sucursales</span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Limits */}
                  {plan.additional_limits && Object.keys(plan.additional_limits).length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Límites Adicionales</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(plan.additional_limits).map(([key, value]) => (
                          <Badge key={key} variant="secondary">
                            {key}: {value as number}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  {plan.features && Object.keys(plan.features).length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Características</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(plan.features).map(([key, value]) => {
                          const feature = AVAILABLE_FEATURES.find(f => f.id === key);
                          if (!feature) return null;
                          
                          return (
                            <div key={key} className="flex items-center gap-2">
                              {value ? (
                                <Check className="h-4 w-4 text-primary" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className={`text-sm ${value ? '' : 'text-muted-foreground'}`}>
                                {feature.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
