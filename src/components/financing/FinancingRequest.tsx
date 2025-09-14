import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';

interface FinancingRequestProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export const FinancingRequest = ({ data, onNext, onBack }: FinancingRequestProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    requestedAmount: data.financingRequest?.requestedAmount || '',
    desiredTerm: data.financingRequest?.desiredTerm || '',
    useOfFunds: data.financingRequest?.useOfFunds || '',
    creditHistoryAuthorization: data.financingRequest?.creditHistoryAuthorization || false,
    ...data.financingRequest
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.requestedAmount.trim()) {
      newErrors.requestedAmount = t('Requested amount is required');
    } else if (isNaN(Number(formData.requestedAmount)) || Number(formData.requestedAmount) <= 0) {
      newErrors.requestedAmount = t('Please enter a valid amount');
    }

    if (!formData.desiredTerm) {
      newErrors.desiredTerm = t('Desired term is required');
    }

    if (!formData.useOfFunds) {
      newErrors.useOfFunds = t('Use of funds is required');
    }

    if (!formData.creditHistoryAuthorization) {
      newErrors.creditHistoryAuthorization = t('Credit history authorization is required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext({ financingRequest: formData });
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(parseInt(numericValue));
    }
    return '';
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    handleInputChange('requestedAmount', numericValue);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Financing Request Details')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('Please provide details about your financing needs')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="requestedAmount">{t('Requested Amount')} *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="requestedAmount"
              value={formatCurrency(formData.requestedAmount)}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              className={`pl-8 ${errors.requestedAmount ? 'border-destructive' : ''}`}
            />
          </div>
          {errors.requestedAmount && <p className="text-sm text-destructive">{errors.requestedAmount}</p>}
        </div>

        <div className="space-y-2">
          <Label>{t('Desired Term')} *</Label>
          <Select value={formData.desiredTerm} onValueChange={(value) => handleInputChange('desiredTerm', value)}>
            <SelectTrigger className={errors.desiredTerm ? 'border-destructive' : ''}>
              <SelectValue placeholder={t('Select desired term')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6-months">{t('6 months')}</SelectItem>
              <SelectItem value="12-months">{t('12 months')}</SelectItem>
              <SelectItem value="18-months">{t('18 months')}</SelectItem>
              <SelectItem value="24-months">{t('24 months')}</SelectItem>
              <SelectItem value="36-months">{t('36 months')}</SelectItem>
              <SelectItem value="48-months">{t('48 months')}</SelectItem>
              <SelectItem value="60-months">{t('60 months')}</SelectItem>
            </SelectContent>
          </Select>
          {errors.desiredTerm && <p className="text-sm text-destructive">{errors.desiredTerm}</p>}
        </div>

        <div className="space-y-2">
          <Label>{t('Use of Funds')} *</Label>
          <Select value={formData.useOfFunds} onValueChange={(value) => handleInputChange('useOfFunds', value)}>
            <SelectTrigger className={errors.useOfFunds ? 'border-destructive' : ''}>
              <SelectValue placeholder={t('Select use of funds')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="working-capital">{t('Working Capital')}</SelectItem>
              <SelectItem value="asset-purchase">{t('Asset Purchase')}</SelectItem>
              <SelectItem value="refinancing">{t('Refinancing')}</SelectItem>
              <SelectItem value="business-expansion">{t('Business Expansion')}</SelectItem>
              <SelectItem value="inventory">{t('Inventory')}</SelectItem>
              <SelectItem value="equipment">{t('Equipment')}</SelectItem>
              <SelectItem value="other">{t('Other')}</SelectItem>
            </SelectContent>
          </Select>
          {errors.useOfFunds && <p className="text-sm text-destructive">{errors.useOfFunds}</p>}
        </div>

        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="creditAuthorization"
              checked={formData.creditHistoryAuthorization}
              onCheckedChange={(checked) => handleInputChange('creditHistoryAuthorization', checked as boolean)}
              className={errors.creditHistoryAuthorization ? 'border-destructive' : ''}
            />
            <Label htmlFor="creditAuthorization" className="text-sm leading-5">
              {t('I authorize the consultation of my credit history and the verification of the information provided in this application. I understand that this may involve credit bureau inquiries.')} *
            </Label>
          </div>
          {errors.creditHistoryAuthorization && (
            <p className="text-sm text-destructive ml-6">{errors.creditHistoryAuthorization}</p>
          )}
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">{t('Request Summary')}</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>{t('Amount:')}</span>
              <span className="font-medium">
                {formData.requestedAmount ? formatCurrency(formData.requestedAmount) : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t('Term:')}</span>
              <span className="font-medium">
                {formData.desiredTerm ? t(formData.desiredTerm.replace('-', ' ')) : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t('Purpose:')}</span>
              <span className="font-medium">
                {formData.useOfFunds ? t(formData.useOfFunds.replace('-', ' ')) : '-'}
              </span>
            </div>
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