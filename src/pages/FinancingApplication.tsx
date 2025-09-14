import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ChatWidget from '@/components/ChatWidget';
import { TypeSelection } from '@/components/financing/TypeSelection';
import { BasicInfo } from '@/components/financing/BasicInfo';
import { FinancialInfo } from '@/components/financing/FinancialInfo';
import { OwnershipInfo } from '@/components/financing/OwnershipInfo';
import { FinancingRequest } from '@/components/financing/FinancingRequest';
import { DocumentUpload } from '@/components/financing/DocumentUpload';
import { LegalDisclaimer } from '@/components/financing/LegalDisclaimer';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ApplicationData {
  id?: string;
  type?: 'individual' | 'company';
  email?: string;
  phone?: string;
  resumeCode?: string;
  basicInfo?: any;
  financialInfo?: any;
  ownershipInfo?: any;
  financingRequest?: any;
  documents?: any[];
}

export const FinancingApplication = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [applicationData, setApplicationData] = useState<ApplicationData>({});
  const [isLoading, setIsLoading] = useState(false);

  const resumeCode = searchParams.get('resume');

  const steps = [
    'Type Selection',
    'Basic Information',
    'Financial Information',
    'Ownership & Directors',
    'Financing Request',
    'Document Upload'
  ];

  // Load existing application if resume code is provided
  useEffect(() => {
    if (resumeCode) {
      loadApplication(resumeCode);
    }
  }, [resumeCode]);

  const loadApplication = async (code: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          applicants(*),
          documents(*)
        `)
        .eq('resume_code', code)
        .single();

      if (error) throw error;

      if (data) {
        setApplicationData({
          id: data.id,
          type: data.type,
          email: data.email,
          phone: data.phone,
          resumeCode: data.resume_code,
        });
        // Determine current step based on data completeness
        setCurrentStep(determineCurrentStep(data));
      }
    } catch (error) {
      console.error('Error loading application:', error);
      toast.error('Failed to load application');
    } finally {
      setIsLoading(false);
    }
  };

  const determineCurrentStep = (data: any) => {
    if (!data.type) return 0;
    if (!data.applicants?.length) return 1;
    // Add more logic based on data completeness
    return 2;
  };

  const saveApplication = async (stepData: any, step: number) => {
    try {
      setIsLoading(true);
      
      let application;
      
      if (applicationData.id) {
        // Update existing application
        const { data, error } = await supabase
          .from('applications')
          .update({
            status: step === steps.length - 1 ? 'completed' : 'draft',
            updated_at: new Date().toISOString()
          })
          .eq('id', applicationData.id)
          .select()
          .single();
          
        if (error) throw error;
        application = data;
      } else {
        // Create new application
        const { data, error } = await supabase
          .from('applications')
          .insert({
            type: applicationData.type!,
            email: stepData.email || applicationData.email!,
            phone: stepData.phone || applicationData.phone,
            status: step === steps.length - 1 ? 'completed' : 'draft'
          })
          .select()
          .single();
          
        if (error) throw error;
        application = data;
        
        setApplicationData(prev => ({
          ...prev,
          id: application.id,
          resumeCode: application.resume_code
        }));
      }

      // Send email notification
      await sendEmailNotification(
        stepData.email || applicationData.email!,
        step === steps.length - 1 ? 'completed' : 'draft',
        application.resume_code
      );

      toast.success(
        step === steps.length - 1 
          ? t('Application submitted successfully!')
          : t('Progress saved successfully!')
      );

      if (step === steps.length - 1) {
        navigate('/financing');
      }

    } catch (error) {
      console.error('Error saving application:', error);
      toast.error('Failed to save application');
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailNotification = async (email: string, type: string, resumeCode: string) => {
    try {
      await supabase.functions.invoke('send-application-email', {
        body: {
          email,
          type,
          resumeCode,
          language: 'en' // TODO: Get from language context
        }
      });
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  const handleNext = async (stepData: any) => {
    setApplicationData(prev => ({ ...prev, ...stepData }));
    await saveApplication(stepData, currentStep);
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <TypeSelection 
            data={applicationData}
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <BasicInfo 
            data={applicationData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <FinancialInfo 
            data={applicationData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return applicationData.type === 'company' ? (
          <OwnershipInfo 
            data={applicationData}
            onNext={handleNext}
            onBack={handleBack}
          />
        ) : (
          <FinancingRequest 
            data={applicationData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return applicationData.type === 'company' ? (
          <FinancingRequest 
            data={applicationData}
            onNext={handleNext}
            onBack={handleBack}
          />
        ) : (
          <DocumentUpload 
            data={applicationData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <DocumentUpload 
            data={applicationData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading && !applicationData.id) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading application...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Header */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-center">
                {t('Financing Application')} - {t(`Step ${currentStep + 1} of ${steps.length}`)}
              </CardTitle>
              <div className="space-y-2">
                <Progress value={progressPercentage} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  {t(steps[currentStep])}
                </p>
              </div>
            </CardHeader>
          </Card>

          {/* Step Content */}
          <div className="mb-8">
            {renderStep()}
          </div>

          {/* Legal Disclaimer */}
          {currentStep === steps.length - 1 && <LegalDisclaimer />}
        </div>
      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
};