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
        {/* Mode Selection */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold">{t('contactOdoo.mode.label')}</Label>
          <RadioGroup
            value={mode}
            onValueChange={(value) => {
              setMode(value as 'create' | 'edit');
              form.setValue('mode', value as 'create' | 'edit');
              if (value === 'create') {
                setSelectedContact(null);
                setSearchResults([]);
                form.reset();
              }
            }}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="create" id="create" />
              <Label htmlFor="create" className="cursor-pointer">{t('contactOdoo.mode.create')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="edit" id="edit" />
              <Label htmlFor="edit" className="cursor-pointer">{t('contactOdoo.mode.edit')}</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Search Section (only for edit mode) */}
        {mode === 'edit' && (
          <div className="space-y-4 p-6 bg-muted/50 rounded-lg border">
            <Label htmlFor="searchTerm" className="text-lg font-semibold">
              {t('contactOdoo.search.label')}
            </Label>
            <div className="flex gap-2">
              <Input
                id="searchTerm"
                placeholder={t('contactOdoo.search.placeholder')}
                {...form.register('searchTerm')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
              <Button onClick={handleSearch} disabled={isSearching} type="button">
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 mt-4">
                <Label className="font-semibold">{t('contactOdoo.search.results')}</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((contact) => (
                    <Button
                      key={contact.id}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3"
                      type="button"
                      onClick={() => loadContactData(contact)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        {contact.company_type === 'company' ? (
                          <Building2 className="h-5 w-5 mt-1 flex-shrink-0" />
                        ) : (
                          <User className="h-5 w-5 mt-1 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{contact.name}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {contact.email} {contact.phone && `• ${contact.phone}`}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contact Type Selection */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold">{t('contactOdoo.contactType.label')}</Label>
          <RadioGroup
            value={contactType}
            onValueChange={(value) => {
              setContactType(value as 'person' | 'company');
              form.setValue('contactType', value as 'person' | 'company');
            }}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="person" id="person" />
              <Label htmlFor="person" className="cursor-pointer flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('contactOdoo.contactType.person')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="company" id="company" />
              <Label htmlFor="company" className="cursor-pointer flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {t('contactOdoo.contactType.company')}
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Contact Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('contactOdoo.sections.basicInfo')}</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t('contactOdoo.fields.name')} *</Label>
                <Input id="name" {...form.register('name')} />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('contactOdoo.fields.email')}</Label>
                <Input id="email" type="email" {...form.register('email')} />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('contactOdoo.fields.phone')}</Label>
                <Input id="phone" {...form.register('phone')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">{t('contactOdoo.fields.website')}</Label>
                <Input id="website" {...form.register('website')} />
              </div>
            </div>

            {/* Person-specific fields */}
            {contactType === 'person' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">{t('contactOdoo.fields.companyName')}</Label>
                  <Input id="companyName" {...form.register('companyName')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobPosition">{t('contactOdoo.fields.jobPosition')}</Label>
                  <Input id="jobPosition" {...form.register('jobPosition')} />
                </div>
              </div>
            )}
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('contactOdoo.sections.address')}</h3>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="street">{t('contactOdoo.fields.street')}</Label>
                <Input id="street" {...form.register('street')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="street2">{t('contactOdoo.fields.street2')}</Label>
                <Input id="street2" {...form.register('street2')} />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">{t('contactOdoo.fields.city')}</Label>
                  <Input id="city" {...form.register('city')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">{t('contactOdoo.fields.state')}</Label>
                  <Select 
                    value={form.watch('state')} 
                    onValueChange={(value) => form.setValue('state', value)}
                  >
                    <SelectTrigger id="state">
                      <SelectValue placeholder={t('contactOdoo.fields.selectState')} />
                    </SelectTrigger>
                    <SelectContent>
                      {ARGENTINA_DATA.map((province) => (
                        <SelectItem key={province.name} value={province.name}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip">{t('contactOdoo.fields.zip')}</Label>
                  <Input id="zip" {...form.register('zip')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">{t('contactOdoo.fields.country')}</Label>
                <Select 
                  value={form.watch('country')} 
                  onValueChange={(value) => form.setValue('country', value)}
                >
                  <SelectTrigger id="country">
                    <SelectValue placeholder={t('contactOdoo.fields.selectCountry')} />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.nameEs || country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tax Information (Argentina specific) */}
          {form.watch('country') === 'AR' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('contactOdoo.sections.taxInfo')}</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="identificationType">{t('contactOdoo.fields.identificationType')}</Label>
                  <Select 
                    value={form.watch('identificationType')} 
                    onValueChange={(value) => form.setValue('identificationType', value)}
                  >
                    <SelectTrigger id="identificationType">
                      <SelectValue placeholder={t('contactOdoo.fields.selectIdentificationType')} />
                    </SelectTrigger>
                    <SelectContent>
                      {IDENTIFICATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.labelEs}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="identificationNumber">{t('contactOdoo.fields.identificationNumber')}</Label>
                  <Input id="identificationNumber" {...form.register('identificationNumber')} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="arcaResponsibility">{t('contactOdoo.fields.arcaResponsibility')}</Label>
                  <Select 
                    value={form.watch('arcaResponsibility')} 
                    onValueChange={(value) => form.setValue('arcaResponsibility', value)}
                  >
                    <SelectTrigger id="arcaResponsibility">
                      <SelectValue placeholder={t('contactOdoo.fields.selectArcaResponsibility')} />
                    </SelectTrigger>
                    <SelectContent>
                      {ARCA_RESPONSIBILITIES.map((resp) => (
                        <SelectItem key={resp.value} value={resp.value}>
                          {resp.labelEs}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('contactOdoo.sections.tags')}</h3>
            <div className="space-y-2">
              <Label htmlFor="tags">{t('contactOdoo.fields.tags')}</Label>
              <Input 
                id="tags" 
                {...form.register('tags')} 
                placeholder={t('contactOdoo.fields.tagsPlaceholder')}
              />
              <p className="text-sm text-muted-foreground">
                {t('contactOdoo.fields.tagsHelp')}
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'create' ? t('contactOdoo.buttons.creating') : t('contactOdoo.buttons.updating')}
              </>
            ) : (
              mode === 'create' ? t('contactOdoo.buttons.create') : t('contactOdoo.buttons.update')
            )}
          </Button>
        </form>
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
