import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePMS } from '@/contexts/PMSContext';
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

// Esquema base común
const baseSchema = z.object({
  entityType: z.enum(['fisica', 'juridica'], {
    errorMap: () => ({ message: "Debes seleccionar el tipo de persona" })
  }),
  email: z.string().trim().email("Email inválido").max(255, "Email muy largo"),
  address: z.string().trim().min(5, "Dirección muy corta").max(200, "Dirección muy larga"),
  city: z.string().trim().min(2, "Ciudad inválida").max(100, "Ciudad muy larga"),
  state: z.string().trim().min(2, "Provincia inválida").max(100, "Provincia muy larga"),
  postalCode: z.string().trim().min(4, "Código postal inválido").max(10, "Código postal muy largo"),
  role: z.string().min(1, "Debes seleccionar un rol"),
  reason: z.string().trim().min(10, "El motivo debe tener al menos 10 caracteres").max(500, "Motivo muy largo"),
  contractNumber: z.string().trim().optional(),
});

// Esquema para Persona Física
const personaFisicaSchema = baseSchema.extend({
  entityType: z.literal('fisica'),
  firstName: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100, "Nombre muy largo"),
  lastName: z.string().trim().min(2, "El apellido debe tener al menos 2 caracteres").max(100, "Apellido muy largo"),
  phone: z.string().trim().min(8, "Teléfono inválido").max(20, "Teléfono muy largo"),
  documentId: z.string().trim().min(6, "DNI inválido").max(20, "DNI muy largo"),
  cuitCuil: z.string().trim().refine(
    (val) => {
      const cleanedCuit = val.replace(/[^0-9]/g, '');
      return cleanedCuit.length === 11;
    },
    { message: "El CUIT/CUIL debe tener exactamente 11 dígitos numéricos" }
  ),
});

// Esquema para Persona Jurídica
const personaJuridicaSchema = baseSchema.extend({
  entityType: z.literal('juridica'),
  razonSocial: z.string().trim().min(3, "La razón social debe tener al menos 3 caracteres").max(200, "Razón social muy larga"),
  cuit: z.string().trim().refine(
    (val) => {
      const cleanedCuit = val.replace(/[^0-9]/g, '');
      return cleanedCuit.length === 11;
    },
    { message: "El CUIT debe tener exactamente 11 dígitos numéricos" }
  ),
  contactName: z.string().trim().min(3, "El nombre de contacto debe tener al menos 3 caracteres").max(150, "Nombre de contacto muy largo"),
  phone: z.string().trim().min(8, "Teléfono inválido").max(20, "Teléfono muy largo"),
});

// Esquema discriminado (usa entityType para determinar qué esquema aplicar)
const requestSchema = z.discriminatedUnion('entityType', [
  personaFisicaSchema,
  personaJuridicaSchema,
]);

interface FormData {
  entityType: 'fisica' | 'juridica' | '';
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  role: string;
  reason: string;
  contractNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  documentId: string;
  cuitCuil: string;
  razonSocial: string;
  cuit: string;
  contactName: string;
}

const PMSRequestAccess = () => {
  const navigate = useNavigate();
  const { requestAccess } = usePMS();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    entityType: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    role: '',
    reason: '',
    contractNumber: '',
    firstName: '',
    lastName: '',
    phone: '',
    documentId: '',
    cuitCuil: '',
    razonSocial: '',
    cuit: '',
    contactName: '',
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

    const userData: any = {
      email: formData.email,
      entity_type: formData.entityType,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      postal_code: formData.postalCode,
      contract_number: formData.contractNumber || undefined,
    };

    if (formData.entityType === 'fisica') {
      userData.first_name = formData.firstName;
      userData.last_name = formData.lastName;
      userData.phone = formData.phone;
      userData.document_id = formData.documentId;
      userData.cuit_cuil = formData.cuitCuil;
    } else if (formData.entityType === 'juridica') {
      userData.razon_social = formData.razonSocial;
      userData.cuit = formData.cuit;
      userData.contact_name = formData.contactName;
      userData.phone = formData.phone;
    }

    const { error } = await requestAccess(
      formData.role as any,
      formData.reason,
      userData
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
              {/* Tipo de Solicitante */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Tipo de Solicitante</h3>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="entityType">¿Es Persona Física o Persona Jurídica? *</Label>
                  <Select 
                    value={formData.entityType} 
                    onValueChange={(value) => handleInputChange('entityType', value)}
                  >
                    <SelectTrigger id="entityType">
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fisica">Persona Física</SelectItem>
                      <SelectItem value="juridica">Persona Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.entityType && <p className="text-sm text-destructive">{errors.entityType}</p>}
                </div>
              </div>

              {/* Datos - Persona Física */}
              {formData.entityType === 'fisica' && (
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
                          type="tel"
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
                          type="text"
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
                    <Label htmlFor="cuitCuil">CUIT/CUIL *</Label>
                    <Input
                      id="cuitCuil"
                      type="text"
                      value={formData.cuitCuil}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9-]/g, '').slice(0, 13);
                        handleInputChange('cuitCuil', value);
                      }}
                      placeholder="20-12345678-9"
                      maxLength={13}
                    />
                    <p className="text-xs text-muted-foreground">Debe tener exactamente 11 dígitos numéricos</p>
                    {errors.cuitCuil && <p className="text-sm text-destructive">{errors.cuitCuil}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="tu@email.com"
                        className="pl-10"
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    <p className="text-xs text-muted-foreground">Te notificaremos a este email sobre tu solicitud</p>
                  </div>
                </div>
              )}

              {/* Datos - Persona Jurídica */}
              {formData.entityType === 'juridica' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Datos de la Empresa</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="razonSocial">Razón Social *</Label>
                    <Input
                      id="razonSocial"
                      value={formData.razonSocial}
                      onChange={(e) => handleInputChange('razonSocial', e.target.value)}
                      placeholder="Nombre legal de la empresa"
                    />
                    {errors.razonSocial && <p className="text-sm text-destructive">{errors.razonSocial}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cuit">CUIT *</Label>
                    <Input
                      id="cuit"
                      type="text"
                      value={formData.cuit}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9-]/g, '').slice(0, 13);
                        handleInputChange('cuit', value);
                      }}
                      placeholder="30-12345678-9"
                      maxLength={13}
                    />
                    <p className="text-xs text-muted-foreground">Debe tener exactamente 11 dígitos numéricos</p>
                    {errors.cuit && <p className="text-sm text-destructive">{errors.cuit}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contacto *</Label>
                      <Input
                        id="contactName"
                        value={formData.contactName}
                        onChange={(e) => handleInputChange('contactName', e.target.value)}
                        placeholder="Ej: Juan Pérez"
                      />
                      {errors.contactName && <p className="text-sm text-destructive">{errors.contactName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Tel. *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+54 11 1234-5678"
                          className="pl-10"
                        />
                      </div>
                      {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="contacto@empresa.com"
                        className="pl-10"
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    <p className="text-xs text-muted-foreground">Te notificaremos a este email sobre tu solicitud</p>
                  </div>
                </div>
              )}

              {/* Dirección (común) */}
              {formData.entityType && (
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
                      placeholder="Calle, número, piso y depto."
                    />
                    <p className="text-xs text-muted-foreground">Incluye calle, número, piso y departamento</p>
                    {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state">Provincia *</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="Buenos Aires"
                      />
                      {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">Ciudad *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="CABA"
                      />
                      {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Código Postal *</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        placeholder=""
                      />
                      {errors.postalCode && <p className="text-sm text-destructive">{errors.postalCode}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Información de Acceso (Simplificada) */}
              {formData.entityType && (
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
                        <SelectItem value="GESTOR">Gestor (Property Manager)</SelectItem>
                        <SelectItem value="PROPIETARIO">Propietario</SelectItem>
                        <SelectItem value="INQUILINO">Inquilino</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Motivo de la Solicitud *</Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                      placeholder="Describe brevemente por qué necesitas acceso al PMS"
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">Mínimo 10 caracteres</p>
                    {errors.reason && <p className="text-sm text-destructive">{errors.reason}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contractNumber">Número de Contrato</Label>
                    <Input
                      id="contractNumber"
                      value={formData.contractNumber}
                      onChange={(e) => handleInputChange('contractNumber', e.target.value)}
                      placeholder="Opcional"
                    />
                    <p className="text-xs text-muted-foreground">Si ya tienes un contrato asociado, ingresa el número aquí</p>
                    {errors.contractNumber && <p className="text-sm text-destructive">{errors.contractNumber}</p>}
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading || !formData.entityType}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Solicitud
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PMSRequestAccess;
