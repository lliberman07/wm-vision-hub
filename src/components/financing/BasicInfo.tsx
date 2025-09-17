import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

interface BasicInfoProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export const BasicInfo = ({ data, onNext, onBack }: BasicInfoProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    // Individual fields
    firstName: data.basicInfo?.firstName || '',
    lastName: data.basicInfo?.lastName || '',
    // Company fields
    companyName: data.basicInfo?.companyName || '',
    // Company contact fields
    contactFirstName: data.basicInfo?.contactFirstName || '',
    contactLastName: data.basicInfo?.contactLastName || '',
    
    contactPhone: data.basicInfo?.contactPhone || '',
    // Common fields
    email: data.email || '',
    confirmEmail: data.basicInfo?.confirmEmail || '',
    phone: data.phone || '',
    documentId: data.basicInfo?.documentId || '',
    country: data.basicInfo?.country || 'argentina',
    province: data.basicInfo?.province || '',
    city: data.basicInfo?.city || '',
    ...data.basicInfo
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (data.type === 'individual') {
      if (!formData.firstName.trim()) newErrors.firstName = t('First name is required');
      if (!formData.lastName.trim()) newErrors.lastName = t('Last name is required');
    } else {
      if (!formData.companyName.trim()) newErrors.companyName = t('Company name is required');
      if (!formData.contactFirstName.trim()) newErrors.contactFirstName = t('Contact first name is required');
      if (!formData.contactLastName.trim()) newErrors.contactLastName = t('Contact last name is required');
      if (!formData.contactPhone.trim()) newErrors.contactPhone = t('Contact phone is required');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('Email is invalid');
    }

    if (!formData.confirmEmail.trim()) {
      newErrors.confirmEmail = t('Email confirmation is required');
    } else if (formData.email !== formData.confirmEmail) {
      newErrors.confirmEmail = t('Email addresses do not match');
    }

    if (!formData.phone.trim()) newErrors.phone = t('Company phone is required');
    if (!formData.documentId.trim()) newErrors.documentId = t('Document ID is required');
    if (!formData.country) newErrors.country = t('Country is required');
    if (!formData.province) newErrors.province = t('Province is required');
    if (!formData.city.trim()) newErrors.city = t('City is required');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext({ 
        basicInfo: formData,
        email: formData.email,
        phone: formData.phone 
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {data.type === 'individual' ? t('Personal Information') : t('Company Information')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.type === 'individual' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('First Name')} *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder={t('Enter your first name')}
                  className={errors.firstName ? 'border-destructive' : ''}
                />
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('Last Name')} *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder={t('Enter your last name')}
                  className={errors.lastName ? 'border-destructive' : ''}
                />
                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="companyName">{t('Company Name')} *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder={t('Enter company name')}
                className={errors.companyName ? 'border-destructive' : ''}
              />
              {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('Contact Information')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactFirstName">{t('Contact First Name')} *</Label>
                  <Input
                    id="contactFirstName"
                    value={formData.contactFirstName}
                    onChange={(e) => handleInputChange('contactFirstName', e.target.value)}
                    placeholder={t('Enter contact first name')}
                    className={errors.contactFirstName ? 'border-destructive' : ''}
                  />
                  {errors.contactFirstName && <p className="text-sm text-destructive">{errors.contactFirstName}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactLastName">{t('Contact Last Name')} *</Label>
                  <Input
                    id="contactLastName"
                    value={formData.contactLastName}
                    onChange={(e) => handleInputChange('contactLastName', e.target.value)}
                    placeholder={t('Enter contact last name')}
                    className={errors.contactLastName ? 'border-destructive' : ''}
                  />
                  {errors.contactLastName && <p className="text-sm text-destructive">{errors.contactLastName}</p>}
                </div>
              </div>


              <div className="space-y-2">
                <Label htmlFor="contactPhone">{t('Contact Phone')} *</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder={t('Enter contact phone number')}
                  className={errors.contactPhone ? 'border-destructive' : ''}
                />
                {errors.contactPhone && <p className="text-sm text-destructive">{errors.contactPhone}</p>}
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('Email')} *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder={t('Enter email address')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmEmail">{t('Confirm Email')} *</Label>
            <Input
              id="confirmEmail"
              type="email"
              value={formData.confirmEmail}
              onChange={(e) => handleInputChange('confirmEmail', e.target.value)}
              placeholder={t('Confirm email address')}
              className={errors.confirmEmail ? 'border-destructive' : ''}
            />
            {errors.confirmEmail && <p className="text-sm text-destructive">{errors.confirmEmail}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t('Company Phone')} *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder={t('Enter company phone number')}
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="documentId">
            {data.type === 'individual' ? t('CUIL / CUIT') : t('CUIT')} *
          </Label>
          <Input
            id="documentId"
            value={formData.documentId}
            onChange={(e) => handleInputChange('documentId', e.target.value)}
            placeholder={data.type === 'individual' ? t('Enter CUIL / CUIT') : t('Enter CUIT')}
            className={errors.documentId ? 'border-destructive' : ''}
          />
          {errors.documentId && <p className="text-sm text-destructive">{errors.documentId}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country">{t('Country')} *</Label>
            <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
              <SelectTrigger className={errors.country ? 'border-destructive' : ''}>
                <SelectValue placeholder={t('Select country')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="argentina">Argentina</SelectItem>
              </SelectContent>
            </Select>
            {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="province">{t('Province')} *</Label>
            <Select value={formData.province} onValueChange={(value) => handleInputChange('province', value)}>
              <SelectTrigger className={errors.province ? 'border-destructive' : ''}>
                <SelectValue placeholder={t('Select province')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buenos-aires">Buenos Aires</SelectItem>
                <SelectItem value="ciudad-autonoma-buenos-aires">Ciudad Autónoma de Buenos Aires</SelectItem>
                <SelectItem value="cordoba">Córdoba</SelectItem>
                <SelectItem value="santa-fe">Santa Fe</SelectItem>
                <SelectItem value="mendoza">Mendoza</SelectItem>
                <SelectItem value="tucuman">Tucumán</SelectItem>
                <SelectItem value="salta">Salta</SelectItem>
                <SelectItem value="entre-rios">Entre Ríos</SelectItem>
                <SelectItem value="misiones">Misiones</SelectItem>
                <SelectItem value="corrientes">Corrientes</SelectItem>
                <SelectItem value="chaco">Chaco</SelectItem>
                <SelectItem value="formosa">Formosa</SelectItem>
                <SelectItem value="jujuy">Jujuy</SelectItem>
                <SelectItem value="santiago-del-estero">Santiago del Estero</SelectItem>
                <SelectItem value="catamarca">Catamarca</SelectItem>
                <SelectItem value="la-rioja">La Rioja</SelectItem>
                <SelectItem value="san-juan">San Juan</SelectItem>
                <SelectItem value="san-luis">San Luis</SelectItem>
                <SelectItem value="rio-negro">Río Negro</SelectItem>
                <SelectItem value="neuquen">Neuquén</SelectItem>
                <SelectItem value="chubut">Chubut</SelectItem>
                <SelectItem value="santa-cruz">Santa Cruz</SelectItem>
                <SelectItem value="tierra-del-fuego">Tierra del Fuego</SelectItem>
                <SelectItem value="la-pampa">La Pampa</SelectItem>
              </SelectContent>
            </Select>
            {errors.province && <p className="text-sm text-destructive">{errors.province}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">{t('City')} *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            placeholder={t('Enter city')}
            className={errors.city ? 'border-destructive' : ''}
          />
          {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
        </div>

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={onBack}>
            {t('Back')}
          </Button>
          <Button onClick={handleNext}>
            {t('Next')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};