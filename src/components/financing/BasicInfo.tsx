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
    fullName: data.basicInfo?.fullName || '',
    companyName: data.basicInfo?.companyName || '',
    email: data.email || '',
    phone: data.phone || '',
    documentId: data.basicInfo?.documentId || '',
    country: data.basicInfo?.country || '',
    province: data.basicInfo?.province || '',
    ...data.basicInfo
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (data.type === 'individual') {
      if (!formData.fullName.trim()) newErrors.fullName = t('Full name is required');
    } else {
      if (!formData.companyName.trim()) newErrors.companyName = t('Company name is required');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('Email is invalid');
    }

    if (!formData.phone.trim()) newErrors.phone = t('Phone is required');
    if (!formData.documentId.trim()) newErrors.documentId = t('Document ID is required');
    if (!formData.country) newErrors.country = t('Country is required');
    if (!formData.province) newErrors.province = t('Province is required');

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
          <div className="space-y-2">
            <Label htmlFor="fullName">{t('Full Name')} *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder={t('Enter your full name')}
              className={errors.fullName ? 'border-destructive' : ''}
            />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
          </div>
        ) : (
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
            <Label htmlFor="phone">{t('Phone')} *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder={t('Enter phone number')}
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="documentId">
            {data.type === 'individual' ? t('ID Number') : t('CUIT/Tax ID')} *
          </Label>
          <Input
            id="documentId"
            value={formData.documentId}
            onChange={(e) => handleInputChange('documentId', e.target.value)}
            placeholder={data.type === 'individual' ? t('Enter ID number') : t('Enter CUIT/Tax ID')}
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
                <SelectItem value="brazil">Brazil</SelectItem>
                <SelectItem value="chile">Chile</SelectItem>
                <SelectItem value="colombia">Colombia</SelectItem>
                <SelectItem value="mexico">Mexico</SelectItem>
                <SelectItem value="usa">United States</SelectItem>
              </SelectContent>
            </Select>
            {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="province">{t('Province/State')} *</Label>
            <Select value={formData.province} onValueChange={(value) => handleInputChange('province', value)}>
              <SelectTrigger className={errors.province ? 'border-destructive' : ''}>
                <SelectValue placeholder={t('Select province/state')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buenos-aires">Buenos Aires</SelectItem>
                <SelectItem value="cordoba">Córdoba</SelectItem>
                <SelectItem value="santa-fe">Santa Fe</SelectItem>
                <SelectItem value="mendoza">Mendoza</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.province && <p className="text-sm text-destructive">{errors.province}</p>}
          </div>
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