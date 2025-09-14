import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage } from '@/contexts/LanguageContext';

interface FinancialInfoProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export const FinancialInfo = ({ data, onNext, onBack }: FinancialInfoProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    employmentStatus: data.financialInfo?.employmentStatus || '',
    employerName: data.financialInfo?.employerName || '',
    jobSeniority: data.financialInfo?.jobSeniority || '',
    monthlyIncome: data.financialInfo?.monthlyIncome || '',
    hasOtherIncome: data.financialInfo?.hasOtherIncome || '',
    otherIncomeAmount: data.financialInfo?.otherIncomeAmount || '',
    // Company fields
    industrySector: data.financialInfo?.industrySector || '',
    yearsInBusiness: data.financialInfo?.yearsInBusiness || '',
    annualRevenue: data.financialInfo?.annualRevenue || '',
    employeesCount: data.financialInfo?.employeesCount || '',
    ...data.financialInfo
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (data.type === 'individual') {
      if (!formData.employmentStatus) newErrors.employmentStatus = t('Employment status is required');
      if (!formData.employerName.trim()) newErrors.employerName = t('Employer/Activity name is required');
      if (!formData.jobSeniority) newErrors.jobSeniority = t('Job seniority is required');
      if (!formData.monthlyIncome) newErrors.monthlyIncome = t('Monthly income is required');
      if (formData.hasOtherIncome === 'yes' && !formData.otherIncomeAmount.trim()) {
        newErrors.otherIncomeAmount = t('Other income amount is required');
      }
    } else {
      if (!formData.industrySector) newErrors.industrySector = t('Industry sector is required');
      if (!formData.yearsInBusiness) newErrors.yearsInBusiness = t('Years in business is required');
      if (!formData.annualRevenue) newErrors.annualRevenue = t('Annual revenue is required');
      if (!formData.employeesCount) newErrors.employeesCount = t('Number of employees is required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext({ financialInfo: formData });
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
          {data.type === 'individual' ? t('Financial Information') : t('Company Financial Information')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.type === 'individual' ? (
          <>
            <div className="space-y-2">
              <Label>{t('Employment Status')} *</Label>
              <Select value={formData.employmentStatus} onValueChange={(value) => handleInputChange('employmentStatus', value)}>
                <SelectTrigger className={errors.employmentStatus ? 'border-destructive' : ''}>
                  <SelectValue placeholder={t('Select employment status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employed">{t('Employed')}</SelectItem>
                  <SelectItem value="self-employed">{t('Self-employed')}</SelectItem>
                  <SelectItem value="other">{t('Other')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.employmentStatus && <p className="text-sm text-destructive">{errors.employmentStatus}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employerName">{t('Employer Name or Activity')} *</Label>
              <Input
                id="employerName"
                value={formData.employerName}
                onChange={(e) => handleInputChange('employerName', e.target.value)}
                placeholder={t('Enter employer name or activity')}
                className={errors.employerName ? 'border-destructive' : ''}
              />
              {errors.employerName && <p className="text-sm text-destructive">{errors.employerName}</p>}
            </div>

            <div className="space-y-2">
              <Label>{t('Job Seniority')} *</Label>
              <Select value={formData.jobSeniority} onValueChange={(value) => handleInputChange('jobSeniority', value)}>
                <SelectTrigger className={errors.jobSeniority ? 'border-destructive' : ''}>
                  <SelectValue placeholder={t('Select job seniority')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="less-than-1">{t('Less than 1 year')}</SelectItem>
                  <SelectItem value="1-3">{t('1-3 years')}</SelectItem>
                  <SelectItem value="3-5">{t('3-5 years')}</SelectItem>
                  <SelectItem value="5-plus">{t('More than 5 years')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.jobSeniority && <p className="text-sm text-destructive">{errors.jobSeniority}</p>}
            </div>

            <div className="space-y-2">
              <Label>{t('Monthly Net Income')} *</Label>
              <Select value={formData.monthlyIncome} onValueChange={(value) => handleInputChange('monthlyIncome', value)}>
                <SelectTrigger className={errors.monthlyIncome ? 'border-destructive' : ''}>
                  <SelectValue placeholder={t('Select income range')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-500">$0 - $500</SelectItem>
                  <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                  <SelectItem value="1000-2000">$1,000 - $2,000</SelectItem>
                  <SelectItem value="2000-5000">$2,000 - $5,000</SelectItem>
                  <SelectItem value="5000-plus">$5,000+</SelectItem>
                </SelectContent>
              </Select>
              {errors.monthlyIncome && <p className="text-sm text-destructive">{errors.monthlyIncome}</p>}
            </div>

            <div className="space-y-3">
              <Label>{t('Do you have other sources of income?')} *</Label>
              <RadioGroup 
                value={formData.hasOtherIncome} 
                onValueChange={(value) => handleInputChange('hasOtherIncome', value)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="other-income-yes" />
                  <Label htmlFor="other-income-yes">{t('Yes')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="other-income-no" />
                  <Label htmlFor="other-income-no">{t('No')}</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.hasOtherIncome === 'yes' && (
              <div className="space-y-2">
                <Label htmlFor="otherIncomeAmount">{t('Other Income Amount')} *</Label>
                <Input
                  id="otherIncomeAmount"
                  value={formData.otherIncomeAmount}
                  onChange={(e) => handleInputChange('otherIncomeAmount', e.target.value)}
                  placeholder={t('Enter amount')}
                  className={errors.otherIncomeAmount ? 'border-destructive' : ''}
                />
                {errors.otherIncomeAmount && <p className="text-sm text-destructive">{errors.otherIncomeAmount}</p>}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label>{t('Industry Sector')} *</Label>
              <Select value={formData.industrySector} onValueChange={(value) => handleInputChange('industrySector', value)}>
                <SelectTrigger className={errors.industrySector ? 'border-destructive' : ''}>
                  <SelectValue placeholder={t('Select industry sector')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">{t('Technology')}</SelectItem>
                  <SelectItem value="retail">{t('Retail')}</SelectItem>
                  <SelectItem value="manufacturing">{t('Manufacturing')}</SelectItem>
                  <SelectItem value="services">{t('Services')}</SelectItem>
                  <SelectItem value="agriculture">{t('Agriculture')}</SelectItem>
                  <SelectItem value="construction">{t('Construction')}</SelectItem>
                  <SelectItem value="other">{t('Other')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.industrySector && <p className="text-sm text-destructive">{errors.industrySector}</p>}
            </div>

            <div className="space-y-2">
              <Label>{t('Years in Business')} *</Label>
              <Select value={formData.yearsInBusiness} onValueChange={(value) => handleInputChange('yearsInBusiness', value)}>
                <SelectTrigger className={errors.yearsInBusiness ? 'border-destructive' : ''}>
                  <SelectValue placeholder={t('Select years in business')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="less-than-1">{t('Less than 1 year')}</SelectItem>
                  <SelectItem value="1-3">{t('1-3 years')}</SelectItem>
                  <SelectItem value="3-5">{t('3-5 years')}</SelectItem>
                  <SelectItem value="5-10">{t('5-10 years')}</SelectItem>
                  <SelectItem value="10-plus">{t('More than 10 years')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.yearsInBusiness && <p className="text-sm text-destructive">{errors.yearsInBusiness}</p>}
            </div>

            <div className="space-y-2">
              <Label>{t('Annual Revenue')} *</Label>
              <Select value={formData.annualRevenue} onValueChange={(value) => handleInputChange('annualRevenue', value)}>
                <SelectTrigger className={errors.annualRevenue ? 'border-destructive' : ''}>
                  <SelectValue placeholder={t('Select revenue range')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-50k">$0 - $50,000</SelectItem>
                  <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                  <SelectItem value="100k-500k">$100,000 - $500,000</SelectItem>
                  <SelectItem value="500k-1m">$500,000 - $1,000,000</SelectItem>
                  <SelectItem value="1m-plus">$1,000,000+</SelectItem>
                </SelectContent>
              </Select>
              {errors.annualRevenue && <p className="text-sm text-destructive">{errors.annualRevenue}</p>}
            </div>

            <div className="space-y-2">
              <Label>{t('Number of Employees')} *</Label>
              <Select value={formData.employeesCount} onValueChange={(value) => handleInputChange('employeesCount', value)}>
                <SelectTrigger className={errors.employeesCount ? 'border-destructive' : ''}>
                  <SelectValue placeholder={t('Select employee count')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-5">1-5</SelectItem>
                  <SelectItem value="6-10">6-10</SelectItem>
                  <SelectItem value="11-25">11-25</SelectItem>
                  <SelectItem value="26-50">26-50</SelectItem>
                  <SelectItem value="50-plus">50+</SelectItem>
                </SelectContent>
              </Select>
              {errors.employeesCount && <p className="text-sm text-destructive">{errors.employeesCount}</p>}
            </div>
          </>
        )}

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