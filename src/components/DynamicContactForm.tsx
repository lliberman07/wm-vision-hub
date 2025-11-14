import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Send } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export type InquiryType = 'general' | 'demo' | 'pricing' | 'support';

interface FormConfig {
  fields: {
    name: string;
    label: { es: string; en: string };
    type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'date';
    required?: boolean;
    options?: { value: string; label: { es: string; en: string } }[];
    placeholder?: { es: string; en: string };
  }[];
}

const formConfigs: Record<InquiryType, FormConfig> = {
  general: {
    fields: [
      { name: 'company', label: { es: 'Empresa', en: 'Company' }, type: 'text', placeholder: { es: 'Tu empresa', en: 'Your company' } },
      { name: 'message', label: { es: 'Mensaje', en: 'Message' }, type: 'textarea', required: true, placeholder: { es: 'Cuéntanos más...', en: 'Tell us more...' } }
    ]
  },
  demo: {
    fields: [
      { name: 'company', label: { es: 'Empresa', en: 'Company' }, type: 'text', required: true, placeholder: { es: 'Nombre de tu empresa', en: 'Your company name' } },
      { 
        name: 'company_size', 
        label: { es: 'Tamaño de empresa', en: 'Company size' }, 
        type: 'select', 
        required: true,
        options: [
          { value: '1-10', label: { es: '1-10 empleados', en: '1-10 employees' } },
          { value: '11-50', label: { es: '11-50 empleados', en: '11-50 employees' } },
          { value: '51-200', label: { es: '51-200 empleados', en: '51-200 employees' } },
          { value: '200+', label: { es: '200+ empleados', en: '200+ employees' } }
        ]
      },
      { name: 'preferred_demo_date', label: { es: 'Fecha preferida para demo', en: 'Preferred demo date' }, type: 'date' },
      { name: 'message', label: { es: 'Comentarios adicionales', en: 'Additional comments' }, type: 'textarea', placeholder: { es: 'Requisitos específicos...', en: 'Specific requirements...' } }
    ]
  },
  pricing: {
    fields: [
      { name: 'company', label: { es: 'Empresa', en: 'Company' }, type: 'text', required: true, placeholder: { es: 'Nombre de tu empresa', en: 'Your company name' } },
      {
        name: 'budget_range',
        label: { es: 'Rango de presupuesto', en: 'Budget range' },
        type: 'select',
        required: true,
        options: [
          { value: 'less-1000', label: { es: 'Menos de $1,000/mes', en: 'Less than $1,000/mo' } },
          { value: '1000-5000', label: { es: '$1,000-$5,000/mes', en: '$1,000-$5,000/mo' } },
          { value: '5000-10000', label: { es: '$5,000-$10,000/mes', en: '$5,000-$10,000/mo' } },
          { value: 'more-10000', label: { es: 'Más de $10,000/mes', en: 'More than $10,000/mo' } }
        ]
      },
      {
        name: 'timeline',
        label: { es: 'Timeline de implementación', en: 'Implementation timeline' },
        type: 'select',
        required: true,
        options: [
          { value: 'immediate', label: { es: 'Inmediato', en: 'Immediate' } },
          { value: '1-3-months', label: { es: '1-3 meses', en: '1-3 months' } },
          { value: '3-6-months', label: { es: '3-6 meses', en: '3-6 months' } },
          { value: 'exploring', label: { es: 'Solo explorando', en: 'Just exploring' } }
        ]
      },
      { name: 'message', label: { es: 'Detalles adicionales', en: 'Additional details' }, type: 'textarea', placeholder: { es: 'Características necesarias...', en: 'Required features...' } }
    ]
  },
  support: {
    fields: [
      {
        name: 'product',
        label: { es: 'Producto', en: 'Product' },
        type: 'select',
        required: true,
        options: [
          { value: 'pms', label: { es: 'Sistema PMS', en: 'PMS System' } },
          { value: 'investment', label: { es: 'Servicios de Inversión', en: 'Investment Services' } },
          { value: 'consulting', label: { es: 'Consultoría', en: 'Consulting' } },
          { value: 'other', label: { es: 'Otro', en: 'Other' } }
        ]
      },
      { name: 'issue_description', label: { es: 'Descripción del problema', en: 'Issue description' }, type: 'textarea', required: true, placeholder: { es: 'Describe el problema que experimentas...', en: 'Describe the issue you are experiencing...' } }
    ]
  }
};

const inquiryTypeLabels = {
  general: { es: 'Consulta general', en: 'General inquiry' },
  demo: { es: 'Solicitar demo', en: 'Request demo' },
  pricing: { es: 'Consulta de precios', en: 'Pricing inquiry' },
  support: { es: 'Soporte técnico', en: 'Technical support' }
};

interface DynamicContactFormProps {
  source: 'wm' | 'granada';
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

export function DynamicContactForm({ source, onSubmit, loading = false }: DynamicContactFormProps) {
  const { language } = useLanguage();
  const [inquiryType, setInquiryType] = useState<InquiryType>('general');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    message: '',
    // Dynamic fields
    company_size: '',
    preferred_demo_date: undefined as Date | undefined,
    budget_range: '',
    timeline: '',
    product: '',
    issue_description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Collect dynamic fields based on inquiry type
    const config = formConfigs[inquiryType];
    const dynamicFields: Record<string, any> = {};
    
    config.fields.forEach(field => {
      if (formData[field.name as keyof typeof formData]) {
        if (field.type === 'date') {
          dynamicFields[field.name] = formData[field.name as keyof typeof formData];
        } else {
          dynamicFields[field.name] = formData[field.name as keyof typeof formData];
        }
      }
    });

    await onSubmit({
      ...formData,
      inquiry_type: inquiryType,
      dynamic_fields: dynamicFields,
      source
    });

    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      message: '',
      company_size: '',
      preferred_demo_date: undefined,
      budget_range: '',
      timeline: '',
      product: '',
      issue_description: ''
    });
    setInquiryType('general');
  };

  const config = formConfigs[inquiryType];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Inquiry Type Selector */}
      <div className="space-y-2">
        <Label htmlFor="inquiry_type">
          {language === 'es' ? 'Tipo de consulta' : 'Inquiry type'}
        </Label>
        <Select value={inquiryType} onValueChange={(val) => setInquiryType(val as InquiryType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(inquiryTypeLabels).map(([key, labels]) => (
              <SelectItem key={key} value={key}>
                {labels[language]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Base fields */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">
            {language === 'es' ? 'Nombre' : 'First name'} *
          </Label>
          <Input
            id="firstName"
            required
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">
            {language === 'es' ? 'Apellido' : 'Last name'} *
          </Label>
          <Input
            id="lastName"
            required
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          {language === 'es' ? 'Teléfono' : 'Phone'}
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      {/* Dynamic fields based on inquiry type */}
      {config.fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label[language]} {field.required && '*'}
          </Label>
          
          {field.type === 'text' || field.type === 'email' || field.type === 'tel' ? (
            <Input
              id={field.name}
              type={field.type}
              required={field.required}
              placeholder={field.placeholder?.[language]}
              value={formData[field.name as keyof typeof formData] as string}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            />
          ) : field.type === 'textarea' ? (
            <Textarea
              id={field.name}
              required={field.required}
              placeholder={field.placeholder?.[language]}
              value={formData[field.name as keyof typeof formData] as string}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              rows={4}
            />
          ) : field.type === 'select' ? (
            <Select
              value={formData[field.name as keyof typeof formData] as string}
              onValueChange={(val) => setFormData({ ...formData, [field.name]: val })}
              required={field.required}
            >
              <SelectTrigger>
                <SelectValue placeholder={language === 'es' ? 'Seleccionar...' : 'Select...'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label[language]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.type === 'date' ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !formData[field.name as keyof typeof formData] && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData[field.name as keyof typeof formData] ? (
                    format(formData[field.name as keyof typeof formData] as Date, 'PPP')
                  ) : (
                    <span>{language === 'es' ? 'Seleccionar fecha' : 'Pick a date'}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData[field.name as keyof typeof formData] as Date}
                  onSelect={(date) => setFormData({ ...formData, [field.name]: date })}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          ) : null}
        </div>
      ))}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {language === 'es' ? 'Enviando...' : 'Sending...'}
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            {language === 'es' ? 'Enviar mensaje' : 'Send message'}
          </>
        )}
      </Button>
    </form>
  );
}
