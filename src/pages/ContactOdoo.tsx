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

const contactSchema = z.object({
  mode: z.enum(['create', 'edit']),
  contactType: z.enum(['person', 'company']),
  searchTerm: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().optional(),
  phone: z.string().optional(),
  street: z.string().optional(),
  street2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  website: z.string().optional(),
  vat: z.string().optional(),
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

export default function ContactOdoo() {
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
      country: '',
      website: '',
      vat: '',
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
    form.setValue('country', contact.country_id?.[1] || '');
    form.setValue('website', contact.website || '');
    form.setValue('vat', contact.vat || '');
    
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
      if (data.phone) {
        contactData.phone = data.phone;
        contactData.mobile = data.phone;
      }
      if (data.street) contactData.street = data.street;
      if (data.street2) contactData.street2 = data.street2;
      if (data.city) contactData.city = data.city;
      if (data.zip) contactData.zip = data.zip;
      if (data.website) contactData.website = data.website;
      if (data.vat) contactData.vat = data.vat;

      // Add person-specific fields
      if (contactType === 'person') {
        if (data.jobPosition) contactData.function = data.jobPosition;
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
        toast({
          title: t('contactOdoo.success.title'),
          description: mode === 'create' 
            ? t('contactOdoo.success.created') 
            : t('contactOdoo.success.updated'),
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{t('contactOdoo.title')}</CardTitle>
            <CardDescription>{t('contactOdoo.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Mode Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">{t('contactOdoo.mode.title')}</Label>
              <RadioGroup
                value={mode}
                onValueChange={(value: 'create' | 'edit') => {
                  setMode(value);
                  form.setValue('mode', value);
                  if (value === 'create') {
                    setSelectedContact(null);
                    setSearchResults([]);
                  }
                }}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-4 flex-1 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="create" id="create" />
                  <Label htmlFor="create" className="cursor-pointer flex-1">
                    {t('contactOdoo.mode.create')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4 flex-1 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="edit" id="edit" />
                  <Label htmlFor="edit" className="cursor-pointer flex-1">
                    {t('contactOdoo.mode.edit')}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Search Section (only in edit mode) */}
            {mode === 'edit' && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <Label className="text-base font-semibold">{t('contactOdoo.search.title')}</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={t('contactOdoo.search.placeholder')}
                    {...form.register('searchTerm')}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((contact) => (
                      <div
                        key={contact.id}
                        className="p-3 border rounded-lg hover:bg-background cursor-pointer transition-colors"
                        onClick={() => loadContactData(contact)}
                      >
                        <div className="flex items-start gap-3">
                          {contact.company_type === 'company' ? (
                            <Building2 className="h-5 w-5 mt-0.5 text-primary" />
                          ) : (
                            <User className="h-5 w-5 mt-0.5 text-primary" />
                          )}
                          <div className="flex-1">
                            <div className="font-semibold">{contact.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {contact.email && <div>{contact.email}</div>}
                              {contact.vat && <div>IVA: {contact.vat}</div>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Contact Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">{t('contactOdoo.type.title')}</Label>
              <RadioGroup
                value={contactType}
                onValueChange={(value: 'person' | 'company') => {
                  setContactType(value);
                  form.setValue('contactType', value);
                }}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-4 flex-1 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="person" id="person" />
                  <Label htmlFor="person" className="cursor-pointer flex-1 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('contactOdoo.type.person')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4 flex-1 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="company" id="company" />
                  <Label htmlFor="company" className="cursor-pointer flex-1 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {t('contactOdoo.type.company')}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Contact Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('contactOdoo.form.basic')}</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {contactType === 'company' 
                        ? t('contactOdoo.form.companyName') 
                        : t('contactOdoo.form.fullName')}
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <Input id="name" {...form.register('name')} />
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t('contactOdoo.form.email')}</Label>
                    <Input id="email" type="email" {...form.register('email')} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('contactOdoo.form.phone')}</Label>
                    <Input id="phone" {...form.register('phone')} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">{t('contactOdoo.form.website')}</Label>
                    <Input id="website" {...form.register('website')} placeholder="https://" />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('contactOdoo.form.address')}</h3>
                
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">{t('contactOdoo.form.street')}</Label>
                    <Input id="street" {...form.register('street')} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="street2">{t('contactOdoo.form.street2')}</Label>
                    <Input id="street2" {...form.register('street2')} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="city">{t('contactOdoo.form.city')}</Label>
                      <Input id="city" {...form.register('city')} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">{t('contactOdoo.form.state')}</Label>
                      <Input id="state" {...form.register('state')} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zip">{t('contactOdoo.form.zip')}</Label>
                      <Input id="zip" {...form.register('zip')} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">{t('contactOdoo.form.country')}</Label>
                      <Input id="country" {...form.register('country')} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax & Legal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('contactOdoo.form.taxInfo')}</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vat">{t('contactOdoo.form.vat')}</Label>
                    <Input id="vat" {...form.register('vat')} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="arcaResponsibility">{t('contactOdoo.form.arca')}</Label>
                    <Input id="arcaResponsibility" {...form.register('arcaResponsibility')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">{t('contactOdoo.form.tags')}</Label>
                  <Input 
                    id="tags" 
                    {...form.register('tags')} 
                    placeholder={t('contactOdoo.form.tagsPlaceholder')}
                  />
                </div>
              </div>

              {/* Person-specific fields */}
              {contactType === 'person' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{t('contactOdoo.form.workInfo')}</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">{t('contactOdoo.form.company')}</Label>
                      <Input id="companyName" {...form.register('companyName')} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jobPosition">{t('contactOdoo.form.position')}</Label>
                      <Input id="jobPosition" {...form.register('jobPosition')} />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    mode === 'create' ? t('contactOdoo.submit.create') : t('contactOdoo.submit.update')
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
