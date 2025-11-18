import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Building2, User, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { LocationSelector } from "./LocationSelector";
import { useSearchParams } from "react-router-dom";

const formSchema = z.object({
  applicant_type: z.enum(["inmobiliaria", "administrador_independiente", "propietario"]),
  company_name: z.string().optional(),
  first_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  last_name: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  cuit_cuil: z.string().optional(),
  province: z.string().min(1, "Selecciona una provincia"),
  city: z.string().min(1, "Selecciona una ciudad"),
  neighborhood: z.string().optional(),
  requested_plan_id: z.string().min(1, "Debe seleccionar un plan"),
  billing_cycle: z.enum(["monthly", "annual"]),
  estimated_properties: z.coerce.number().optional(),
  current_system: z.string().optional(),
  comments: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  max_users?: number;
  max_properties?: number | null;
  max_contracts?: number | null;
}

interface SubscriptionRequestFormProps {
  preselectedPlanId?: string;
  onSuccess?: () => void;
}

export function SubscriptionRequestForm({ preselectedPlanId, onSuccess }: SubscriptionRequestFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("id, name, price_monthly, price_yearly, max_users, max_properties, max_contracts")
        .eq("is_active", true)
        .order("price_monthly", { ascending: true });

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      applicant_type: "inmobiliaria",
      billing_cycle: "monthly",
      requested_plan_id: preselectedPlanId || "",
      province: "",
      city: "",
      neighborhood: "",
    },
  });

  const applicantType = form.watch("applicant_type");
  const selectedPlanId = form.watch("requested_plan_id");
  const billingCycle = form.watch("billing_cycle");

  const selectedPlan = plans?.find(p => p.id === selectedPlanId);

  // Pre-seleccionar plan desde query parameter
  useEffect(() => {
    const planSlug = searchParams.get('plan');
    if (planSlug && plans) {
      const matchingPlan = plans.find(p => 
        p.name.toLowerCase() === planSlug.toLowerCase() ||
        p.name.toLowerCase().includes(planSlug.toLowerCase())
      );
      if (matchingPlan && !form.getValues('requested_plan_id')) {
        form.setValue('requested_plan_id', matchingPlan.id);
      }
    }
  }, [searchParams, plans, form]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from("subscription_requests")
        .insert([{
          applicant_type: data.applicant_type,
          company_name: data.company_name,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          cuit_cuil: data.cuit_cuil,
          country: "Argentina",
          province: data.province,
          city: data.city,
          neighborhood: data.neighborhood,
          requested_plan_id: data.requested_plan_id,
          billing_cycle: data.billing_cycle,
          estimated_properties: data.estimated_properties,
          current_system: data.current_system,
          comments: data.comments,
        }]);

      if (error) throw error;

      toast.success("¡Solicitud enviada!", {
        description: "Recibirás un email cuando tu solicitud sea procesada.",
      });

      setSubmitted(true);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast.error("Error al enviar solicitud", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              ¡Solicitud Enviada Exitosamente!
            </h3>
            <div className="text-muted-foreground max-w-md mx-auto space-y-3">
              <p>
                Hemos recibido tu solicitud de suscripción. Recibirás un mail con los datos de usuario.
              </p>
              <p>
                Por cualquier consulta puedes comunicarte con nuestro equipo vía mail a{" "}
                <a 
                  href="mailto:inmobiliaria@granadaplatform.com" 
                  className="text-primary hover:underline font-medium"
                >
                  inmobiliaria@granadaplatform.com
                </a>
                {" "}o por el asistente virtual de nuestra página.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Solicitar Suscripción a Granada Platform</CardTitle>
        <CardDescription>
          Completa el formulario para solicitar acceso a la plataforma
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tipo de Cliente */}
            <FormField
              control={form.control}
              name="applicant_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Cliente *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      <label className="cursor-pointer">
                        <div className={`border rounded-lg p-4 hover:border-primary transition-colors ${
                          field.value === "inmobiliaria" ? "border-primary bg-primary/5" : ""
                        }`}>
                          <RadioGroupItem value="inmobiliaria" className="sr-only" />
                          <Building2 className="h-6 w-6 mb-2 text-primary" />
                          <div className="font-semibold">Inmobiliaria</div>
                          <div className="text-sm text-muted-foreground">Empresa inmobiliaria</div>
                        </div>
                      </label>
                      <label className="cursor-pointer">
                        <div className={`border rounded-lg p-4 hover:border-primary transition-colors ${
                          field.value === "administrador_independiente" ? "border-primary bg-primary/5" : ""
                        }`}>
                          <RadioGroupItem value="administrador_independiente" className="sr-only" />
                          <User className="h-6 w-6 mb-2 text-primary" />
                          <div className="font-semibold">Administrador</div>
                          <div className="text-sm text-muted-foreground">Profesional independiente</div>
                        </div>
                      </label>
                      <label className="cursor-pointer">
                        <div className={`border rounded-lg p-4 hover:border-primary transition-colors ${
                          field.value === "propietario" ? "border-primary bg-primary/5" : ""
                        }`}>
                          <RadioGroupItem value="propietario" className="sr-only" />
                          <User className="h-6 w-6 mb-2 text-primary" />
                          <div className="font-semibold">Propietario</div>
                          <div className="text-sm text-muted-foreground">Gestiono mis propiedades</div>
                        </div>
                      </label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Name (conditional) */}
            {applicantType !== "propietario" && (
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Inmobiliaria Capital" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Personal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido *</FormLabel>
                    <FormControl>
                      <Input placeholder="Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="juan@ejemplo.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Se enviará la información de acceso a este email
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+54 11 1234-5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* CUIT/CUIL */}
            <FormField
              control={form.control}
              name="cuit_cuil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CUIT/CUIL</FormLabel>
                  <FormControl>
                    <Input placeholder="20-12345678-9" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location - using LocationSelector */}
            <FormField
              control={form.control}
              name="province"
              render={({ field }) => (
                <LocationSelector
                  provinceValue={field.value || ""}
                  cityValue={form.watch("city") || ""}
                  neighborhoodValue={form.watch("neighborhood") || ""}
                  onProvinceChange={field.onChange}
                  onCityChange={(value) => form.setValue("city", value)}
                  onNeighborhoodChange={(value) => form.setValue("neighborhood", value)}
                  required={true}
                />
              )}
            />

            {/* Plan Selection */}
            <FormField
              control={form.control}
              name="requested_plan_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Solicitado *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={plansLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {plans?.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - ${plan.price_monthly}/mes
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Billing Cycle */}
            <FormField
              control={form.control}
              name="billing_cycle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciclo de Facturación *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="annual">
                        Anual
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedPlan && billingCycle === "annual" && (
                    <FormDescription>
                      Precio anual: ${selectedPlan.price_yearly}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Additional Info */}
            <FormField
              control={form.control}
              name="estimated_properties"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad Estimada de Propiedades</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="10" {...field} />
                  </FormControl>
                  <FormDescription>
                    Ayúdanos a entender tu volumen de operaciones
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="current_system"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sistema Actual (si aplica)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Excel, otro software" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentarios Adicionales</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Cualquier información adicional que quieras compartir..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Summary Card */}
            {selectedPlan && (
              <Card className="bg-muted/50 border-border">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground font-bold">Plan seleccionado:</span>
                      <Badge variant="secondary">{selectedPlan.name}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Precio:</span>
                      <span className="font-semibold text-foreground">
                        ${billingCycle === "annual" ? selectedPlan.price_yearly : selectedPlan.price_monthly}
                        {billingCycle === "annual" ? "/año" : "/mes"}
                      </span>
                    </div>
                    {selectedPlan.max_users && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Usuarios incluidos:</span>
                        <span className="text-foreground">{selectedPlan.max_users}</span>
                      </div>
                    )}
                    {selectedPlan.max_properties && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Propiedades activas:</span>
                        <span className="text-foreground">{selectedPlan.max_properties}</span>
                      </div>
                    )}
                    {selectedPlan.max_contracts && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Contratos activos:</span>
                        <span className="text-foreground">{selectedPlan.max_contracts}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
