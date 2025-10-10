import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePMS } from '@/contexts/PMSContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, CheckCircle2, User, Mail, Phone, FileText, MapPin, Building2 } from 'lucide-react';
import { z } from 'zod';

// Validation schema
const requestSchema = z.object({
  firstName: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100, "Nombre muy largo"),
  lastName: z.string().trim().min(2, "El apellido debe tener al menos 2 caracteres").max(100, "Apellido muy largo"),
  phone: z.string().trim().min(8, "Teléfono inválido").max(20, "Teléfono muy largo"),
  documentId: z.string().trim().min(6, "DNI inválido").max(20, "DNI muy largo"),
  address: z.string().trim().min(5, "Dirección muy corta").max(200, "Dirección muy larga"),
  city: z.string().trim().min(2, "Ciudad inválida").max(100, "Ciudad muy larga"),
  state: z.string().trim().min(2, "Provincia inválida").max(100, "Provincia muy larga"),
  postalCode: z.string().trim().min(4, "Código postal inválido").max(10, "Código postal muy largo"),
  role: z.string().min(1, "Debes seleccionar un rol"),
  reason: z.string().trim().min(10, "El motivo debe tener al menos 10 caracteres").max(500, "Motivo muy largo"),
  // Campos opcionales para INMOBILIARIA
  companyName: z.string().trim().max(200, "Nombre de empresa muy largo").optional(),
  taxId: z.string().trim().max(20, "CUIT/CUIL muy largo").optional(),
});

type FormData = z.infer<typeof requestSchema>;

const PMSRequestAccess = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { requestAccess } = usePMS();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    documentId: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    role: '',
    reason: '',
    companyName: '',
    taxId: '',
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    try {
      requestSchema.parse(formData);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof FormData, string>> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof FormData] = err.message;
          }
        });
        setErrors(newErrors);
        toast({
          title: "Errores en el formulario",
          description: "Por favor corrige los errores antes de continuar",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    const { error } = await requestAccess(
      formData.role as any,
      formData.reason,
      {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        document_id: formData.documentId,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postalCode,
        company_name: formData.role === 'INMOBILIARIA' ? formData.companyName : undefined,
        tax_id: formData.role === 'INMOBILIARIA' ? formData.taxId : undefined,
      }
    );

    if (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la solicitud",
        variant: "destructive",
      });
    } else {
      setSubmitted(true);
      toast({
        title: "Solicitud enviada",
        description: "Un administrador revisará tu solicitud pronto",
      });
    }

    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Autenticación Requerida</CardTitle>
            <CardDescription className="text-base">
              Necesitas crear una cuenta o iniciar sesión para solicitar acceso al Sistema de Gestión de Propiedades.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                La autenticación nos permite validar tu identidad y proteger el sistema contra bots y accesos no autorizados.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => navigate('/auth?redirect=/pms/request-access')}
              className="w-full"
              size="lg"
            >
              Crear Cuenta para Solicitar Acceso
            </Button>
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <CardTitle>Solicitud Enviada</CardTitle>
                <CardDescription>
                  Tu solicitud ha sido enviada exitosamente
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Un administrador del sistema revisará tu solicitud y te notificará por email cuando sea aprobada.
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate('/')} className="w-full">
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isInmobiliaria = formData.role === 'INMOBILIARIA';

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="container mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Solicitar Acceso al PMS</CardTitle>
            <CardDescription>
              Completa el formulario con tus datos para solicitar acceso al sistema de gestión de propiedades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Datos Personales */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Datos Personales</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Tu nombre"
                    />
                    {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Tu apellido"
                    />
                    {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+54 11 1234-5678"
                        className="pl-10"
                      />
                    </div>
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="documentId">DNI *</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="documentId"
                        value={formData.documentId}
                        onChange={(e) => handleInputChange('documentId', e.target.value)}
                        placeholder="12345678"
                        className="pl-10"
                      />
                    </div>
                    {errors.documentId && <p className="text-sm text-destructive">{errors.documentId}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      value={user.email || ''}
                      disabled
                      className="pl-10 bg-muted"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Email de tu cuenta autenticada</p>
                </div>
              </div>

              {/* Dirección */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Dirección</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Calle y número"
                  />
                  {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Buenos Aires"
                    />
                    {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Provincia *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="CABA"
                    />
                    {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Código Postal *</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      placeholder="C1000"
                    />
                    {errors.postalCode && <p className="text-sm text-destructive">{errors.postalCode}</p>}
                  </div>
                </div>
              </div>

              {/* Rol y Solicitud */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Información de Acceso</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rol Solicitado *</Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INMOBILIARIA">Inmobiliaria</SelectItem>
                      <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                      <SelectItem value="PROPIETARIO">Propietario</SelectItem>
                      <SelectItem value="INQUILINO">Inquilino</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
                </div>

                {isInmobiliaria && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nombre de Empresa *</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        placeholder="Nombre de la inmobiliaria"
                      />
                      {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="taxId">CUIT/CUIL *</Label>
                      <Input
                        id="taxId"
                        value={formData.taxId}
                        onChange={(e) => handleInputChange('taxId', e.target.value)}
                        placeholder="20-12345678-9"
                      />
                      {errors.taxId && <p className="text-sm text-destructive">{errors.taxId}</p>}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo de la Solicitud *</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    placeholder="Explica por qué necesitas acceso al sistema..."
                    rows={4}
                  />
                  {errors.reason && <p className="text-sm text-destructive">{errors.reason}</p>}
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Solicitud'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/')}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PMSRequestAccess;
