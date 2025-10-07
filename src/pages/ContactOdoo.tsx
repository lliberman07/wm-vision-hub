import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Search, Building2, User, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES } from '@/data/countries';
import { IDENTIFICATION_TYPES, ARCA_RESPONSIBILITIES } from '@/data/odooTypes';
import { ARGENTINA_DATA } from '@/data/argentina';

const contactSchema = z.object({
  mode: z.enum(['create', 'edit']),
  contactType: z.enum(['person', 'company']),
  searchTerm: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  street: z.string().optional(),
  street2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  website: z.string().optional(),
  identificationType: z.string().optional(),
  identificationNumber: z.string().optional(),
  arcaResponsibility: z.string().optional(),
  tags: z.string().optional(),
  companyName: z.string().optional(),
  jobPosition: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface SearchResult {
  id: number;
  name: string;
  email: string;
  phone: string;
  vat: string;
  company_type: 'person' | 'company';
  street?: string;
  street2?: string;
  city?: string;
  state_id?: [number, string];
  zip?: string;
  country_id?: [number, string];
  website?: string;
  function?: string;
  parent_id?: [number, string];
  category_id?: number[];
}

interface ContactOdooProps {
  standalone?: boolean;
}

export default function ContactOdoo({ standalone = true }: ContactOdooProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [contactType, setContactType] = useState<'person' | 'company'>('person');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedContact, setSelectedContact] = useState<SearchResult | null>(null);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      mode: 'create',
      contactType: 'person',
      searchTerm: '',
      name: '',
      email: '',
      phone: '',
      street: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: 'AR',
      website: '',
      identificationType: 'CUIT',
      identificationNumber: '',
      arcaResponsibility: '',
      tags: '',
      companyName: '',
      jobPosition: '',
    },
  });

  const handleSearch = async () => {
    const searchTerm = form.getValues('searchTerm');
    if (!searchTerm || searchTerm.trim() === '') {
      toast({
        title: t('contactOdoo.search.error'),
        description: t('contactOdoo.search.emptyTerm'),
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);
    try {
      console.log('Calling manage-odoo-contact with searchTerm:', searchTerm.trim());
      const { data, error } = await supabase.functions.invoke('manage-odoo-contact', {
        body: {
          action: 'search',
          searchTerm: searchTerm.trim(),
        },
      });

      console.log('Response from edge function:', { data, error });
      if (error) throw error;

      if (data.success) {
        setSearchResults(data.data || []);
        if (data.data.length === 0) {
          toast({
            title: t('contactOdoo.search.noResults'),
            description: t('contactOdoo.search.noResultsDesc'),
          });
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: t('contactOdoo.search.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const loadContactData = (contact: SearchResult) => {
    setSelectedContact(contact);
    setContactType(contact.company_type);
    form.setValue('contactType', contact.company_type);
    form.setValue('name', contact.name);
    form.setValue('email', contact.email || '');
    form.setValue('phone', contact.phone || '');
    form.setValue('street', contact.street || '');
    form.setValue('street2', contact.street2 || '');
    form.setValue('city', contact.city || '');
    form.setValue('state', contact.state_id?.[1] || '');
    form.setValue('zip', contact.zip || '');
    
    // Find country code from country name
    const countryData = COUNTRIES.find(c => 
      c.name === contact.country_id?.[1] || c.nameEs === contact.country_id?.[1]
    );
    form.setValue('country', countryData?.code || 'AR');
    
    form.setValue('website', contact.website || '');
    form.setValue('identificationNumber', contact.vat || '');
    
    if (contact.company_type === 'person') {
      form.setValue('jobPosition', contact.function || '');
      form.setValue('companyName', contact.parent_id?.[1] || '');
    }
  };

  const onSubmit = async (data: ContactFormData) => {
    console.log('Form submitted with data:', data);
    setIsSubmitting(true);
    try {
      const contactData: any = {
        name: data.name,
        company_type: contactType,
      };

      if (data.email) contactData.email = data.email;
      if (data.phone) contactData.phone = data.phone;
      if (data.street) contactData.street = data.street;
      if (data.street2) contactData.street2 = data.street2;
      if (data.city) contactData.city = data.city;
      if (data.zip) contactData.zip = data.zip;
      if (data.website) contactData.website = data.website;
      
      // Identification type and number
      if (data.identificationType) contactData.identification_type = data.identificationType;
      if (data.identificationNumber) contactData.vat = data.identificationNumber;
      
      // State/Province (send as string, Odoo will match it)
      if (data.state) contactData.state_name = data.state;
      
      // Country (send country code, Odoo will match it)
      if (data.country) contactData.country_code = data.country;
      
      // ARCA Responsibility
      if (data.arcaResponsibility) contactData.l10n_ar_afip_responsibility_type_id = data.arcaResponsibility;
      
      // Tags (convert comma-separated string to array)
      if (data.tags) {
        const tagNames = data.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        if (tagNames.length > 0) {
          contactData.category_names = tagNames;
        }
      }

      // Add person-specific fields
      if (contactType === 'person') {
        if (data.jobPosition) contactData.function = data.jobPosition;
        if (data.companyName) contactData.parent_name = data.companyName;
      }

      const action = mode === 'create' ? 'create' : 'update';
      const body: any = {
        action,
        contactData,
      };

      if (mode === 'edit' && selectedContact) {
        body.contactId = selectedContact.id;
      }

      console.log('Submitting to manage-odoo-contact:', body);
      const { data: response, error } = await supabase.functions.invoke('manage-odoo-contact', {
        body,
      });

      console.log('Response from edge function:', { response, error });
      if (error) throw error;

      if (response.success) {
        const title = response.warning ? t('contactOdoo.warning.title') || 'Advertencia' : t('contactOdoo.success.title');
        const description = response.warning || (mode === 'create' 
          ? t('contactOdoo.success.created') 
          : t('contactOdoo.success.updated'));
        
        toast({
          title,
          description,
          variant: response.warning ? 'destructive' : 'default',
        });
        
        // Reset form
        form.reset();
        setSelectedContact(null);
        setSearchResults([]);
      } else {
        throw new Error(response.error);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      toast({
        title: t('contactOdoo.error.title'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">{t('contactOdoo.title')}</CardTitle>
        <CardDescription>{t('contactOdoo.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
...
      </CardContent>
    </Card>
  );

  if (standalone) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
        <div className="container max-w-4xl">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-12">
      {content}
    </div>
  );
}
