import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Owner {
  name: string;
  documentId: string;
  ownershipPercentage: string;
  personalIncome: string;
}

interface OwnershipInfoProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export const OwnershipInfo = ({ data, onNext, onBack }: OwnershipInfoProps) => {
  const { t } = useLanguage();
  const [owners, setOwners] = useState<Owner[]>(
    data.ownershipInfo?.owners || [
      { name: '', documentId: '', ownershipPercentage: '', personalIncome: '' }
    ]
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    owners.forEach((owner, index) => {
      if (!owner.name.trim()) {
        newErrors[`owner_${index}_name`] = t('Owner name is required');
      }
      if (!owner.documentId.trim()) {
        newErrors[`owner_${index}_documentId`] = t('Document ID is required');
      }
      if (!owner.ownershipPercentage) {
        newErrors[`owner_${index}_ownershipPercentage`] = t('Ownership percentage is required');
      }
      if (!owner.personalIncome) {
        newErrors[`owner_${index}_personalIncome`] = t('Personal income is required');
      }
    });

    // Check if total ownership adds up to 100%
    const totalOwnership = owners.reduce((sum, owner) => {
      return sum + (parseFloat(owner.ownershipPercentage) || 0);
    }, 0);

    if (Math.abs(totalOwnership - 100) > 0.01) {
      newErrors.totalOwnership = t('Total ownership must equal 100%');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext({ ownershipInfo: { owners } });
    }
  };

  const addOwner = () => {
    setOwners(prev => [...prev, { name: '', documentId: '', ownershipPercentage: '', personalIncome: '' }]);
  };

  const removeOwner = (index: number) => {
    if (owners.length > 1) {
      setOwners(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateOwner = (index: number, field: keyof Owner, value: string) => {
    setOwners(prev => prev.map((owner, i) => 
      i === index ? { ...owner, [field]: value } : owner
    ));
    
    // Clear related errors
    const errorKey = `owner_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  const totalOwnership = owners.reduce((sum, owner) => {
    return sum + (parseFloat(owner.ownershipPercentage) || 0);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Ownership & Directors')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('Please provide information about all company owners and directors')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {owners.map((owner, index) => (
          <div key={index} className="space-y-4 p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">{t('Owner')} {index + 1}</h4>
              {owners.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeOwner(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`owner-name-${index}`}>{t('Full Name')} *</Label>
                <Input
                  id={`owner-name-${index}`}
                  value={owner.name}
                  onChange={(e) => updateOwner(index, 'name', e.target.value)}
                  placeholder={t('Enter full name')}
                  className={errors[`owner_${index}_name`] ? 'border-destructive' : ''}
                />
                {errors[`owner_${index}_name`] && (
                  <p className="text-sm text-destructive">{errors[`owner_${index}_name`]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`owner-doc-${index}`}>{t('Document ID')} *</Label>
                <Input
                  id={`owner-doc-${index}`}
                  value={owner.documentId}
                  onChange={(e) => updateOwner(index, 'documentId', e.target.value)}
                  placeholder={t('Enter document ID')}
                  className={errors[`owner_${index}_documentId`] ? 'border-destructive' : ''}
                />
                {errors[`owner_${index}_documentId`] && (
                  <p className="text-sm text-destructive">{errors[`owner_${index}_documentId`]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`owner-percentage-${index}`}>{t('Ownership %')} *</Label>
                <Input
                  id={`owner-percentage-${index}`}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={owner.ownershipPercentage}
                  onChange={(e) => updateOwner(index, 'ownershipPercentage', e.target.value)}
                  placeholder="0.00"
                  className={errors[`owner_${index}_ownershipPercentage`] ? 'border-destructive' : ''}
                />
                {errors[`owner_${index}_ownershipPercentage`] && (
                  <p className="text-sm text-destructive">{errors[`owner_${index}_ownershipPercentage`]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('Personal Income Range')} *</Label>
                <Select 
                  value={owner.personalIncome} 
                  onValueChange={(value) => updateOwner(index, 'personalIncome', value)}
                >
                  <SelectTrigger className={errors[`owner_${index}_personalIncome`] ? 'border-destructive' : ''}>
                    <SelectValue placeholder={t('Select income range')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1000">$0 - $1,000</SelectItem>
                    <SelectItem value="1000-2000">$1,000 - $2,000</SelectItem>
                    <SelectItem value="2000-5000">$2,000 - $5,000</SelectItem>
                    <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
                    <SelectItem value="10000-plus">$10,000+</SelectItem>
                  </SelectContent>
                </Select>
                {errors[`owner_${index}_personalIncome`] && (
                  <p className="text-sm text-destructive">{errors[`owner_${index}_personalIncome`]}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="flex flex-col space-y-2">
          <Button variant="outline" onClick={addOwner} className="self-start">
            <Plus className="h-4 w-4 mr-2" />
            {t('Add Another Owner')}
          </Button>
          
          <div className="flex justify-between items-center text-sm">
            <span>{t('Total Ownership:')}</span>
            <span className={totalOwnership === 100 ? 'text-green-600' : 'text-destructive'}>
              {totalOwnership.toFixed(2)}%
            </span>
          </div>
          
          {errors.totalOwnership && (
            <p className="text-sm text-destructive">{errors.totalOwnership}</p>
          )}
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