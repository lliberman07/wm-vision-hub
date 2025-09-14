import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DocumentUploadProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

interface DocumentRequirement {
  type: string;
  label: string;
  description: string;
  required: boolean;
}

interface UploadedDocument {
  type: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export const DocumentUpload = ({ data, onNext, onBack }: DocumentUploadProps) => {
  const { t } = useLanguage();
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>(
    data.documents || []
  );
  const [uploading, setUploading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getRequiredDocuments = (): DocumentRequirement[] => {
    if (data.type === 'individual') {
      return [
        {
          type: 'id_front',
          label: t('ID Document (Front)'),
          description: t('Front side of your government-issued ID'),
          required: true
        },
        {
          type: 'id_back',
          label: t('ID Document (Back)'),
          description: t('Back side of your government-issued ID'),
          required: true
        },
        {
          type: 'pay_slips',
          label: t('Pay Slips (Last 3 months)'),
          description: t('Your last 3 monthly pay slips or income proof'),
          required: true
        },
        {
          type: 'bank_statements',
          label: t('Bank Statements (Last 3 months)'),
          description: t('Your last 3 monthly bank statements'),
          required: true
        },
        {
          type: 'proof_of_address',
          label: t('Proof of Address'),
          description: t('Utility bill or rental agreement'),
          required: true
        }
      ];
    } else {
      return [
        {
          type: 'balance_sheets',
          label: t('Balance Sheets'),
          description: t('Latest audited balance sheets'),
          required: true
        },
        {
          type: 'tax_returns',
          label: t('Tax Returns'),
          description: t('Last 2 years of tax returns'),
          required: true
        },
        {
          type: 'bank_statements',
          label: t('Bank Statements (Last 3 months)'),
          description: t('Company bank statements for the last 3 months'),
          required: true
        },
        {
          type: 'shareholder_ids',
          label: t('Shareholder IDs'),
          description: t('Government-issued IDs of all shareholders'),
          required: true
        },
        {
          type: 'articles_incorporation',
          label: t('Articles of Incorporation'),
          description: t('Company registration documents'),
          required: false
        }
      ];
    }
  };

  const requiredDocuments = getRequiredDocuments();

  const uploadDocument = async (file: File, documentType: string) => {
    try {
      setUploading(documentType);

      // Create unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${data.resumeCode || 'temp'}_${documentType}_${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('application-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('application-documents')
        .getPublicUrl(fileName);

      // Save document record to database if application exists
      if (data.id) {
        const { error: dbError } = await supabase
          .from('documents')
          .insert({
            application_id: data.id,
            doc_type: documentType,
            file_url: publicUrl
          });

        if (dbError) throw dbError;
      }

      // Update local state
      const newDocument: UploadedDocument = {
        type: documentType,
        fileName: file.name,
        fileUrl: publicUrl,
        uploadedAt: new Date().toISOString()
      };

      setUploadedDocuments(prev => {
        const filtered = prev.filter(doc => doc.type !== documentType);
        return [...filtered, newDocument];
      });

      toast.success(t('Document uploaded successfully'));
      
      // Clear any error for this document type
      if (errors[documentType]) {
        setErrors(prev => ({ ...prev, [documentType]: '' }));
      }

    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(t('Failed to upload document'));
    } finally {
      setUploading(null);
    }
  };

  const removeDocument = async (documentType: string) => {
    try {
      const document = uploadedDocuments.find(doc => doc.type === documentType);
      if (!document) return;

      // Remove from storage
      const fileName = document.fileUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('application-documents')
          .remove([fileName]);
      }

      // Remove from database if application exists
      if (data.id) {
        await supabase
          .from('documents')
          .delete()
          .eq('application_id', data.id)
          .eq('doc_type', documentType);
      }

      // Update local state
      setUploadedDocuments(prev => prev.filter(doc => doc.type !== documentType));
      toast.success(t('Document removed successfully'));

    } catch (error) {
      console.error('Error removing document:', error);
      toast.error(t('Failed to remove document'));
    }
  };

  const validateDocuments = () => {
    const newErrors: Record<string, string> = {};

    requiredDocuments.forEach(doc => {
      if (doc.required) {
        const uploaded = uploadedDocuments.find(uploaded => uploaded.type === doc.type);
        if (!uploaded) {
          newErrors[doc.type] = t('This document is required');
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateDocuments()) {
      onNext({ documents: uploadedDocuments });
    }
  };

  const getUploadedDocument = (type: string) => {
    return uploadedDocuments.find(doc => doc.type === type);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Document Upload')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('Please upload the required documents to complete your application')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {requiredDocuments.map((docReq) => {
          const uploadedDoc = getUploadedDocument(docReq.type);
          const isUploading = uploading === docReq.type;

          return (
            <div key={docReq.type} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">
                    {docReq.label}
                    {docReq.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <p className="text-sm text-muted-foreground">{docReq.description}</p>
                </div>
                {uploadedDoc && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>

              {uploadedDoc ? (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{uploadedDoc.fileName}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeDocument(docReq.type)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type="file"
                      id={`file-${docReq.type}`}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          uploadDocument(file, docReq.type);
                        }
                      }}
                      disabled={isUploading}
                    />
                    <Button
                      variant="outline"
                      className="w-full h-20 border-dashed"
                      onClick={() => document.getElementById(`file-${docReq.type}`)?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span>{t('Uploading...')}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-2">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                          <span className="text-sm">{t('Click to upload')}</span>
                        </div>
                      )}
                    </Button>
                  </div>
                  {errors[docReq.type] && (
                    <p className="text-sm text-destructive">{errors[docReq.type]}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            {t('Accepted File Formats')}
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {t('PDF, JPG, PNG, DOC, DOCX files up to 10MB each')}
          </p>
        </div>

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={onBack}>
            {t('Back')}
          </Button>
          <Button onClick={handleNext} disabled={uploading !== null}>
            {t('Submit Application')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};