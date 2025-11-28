import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailVerificationResult {
  existsInAuth: boolean;
  authUserId: string | null;
  existsInCurrentTenant: boolean;
  currentTenantRoles: string[];
  otherTenants: Array<{
    tenant_id: string;
    tenant_name: string;
    user_type: string;
    is_active: boolean;
    created_at: string;
  }>;
}

interface UseEmailVerificationReturn {
  isVerifying: boolean;
  verificationResult: EmailVerificationResult | null;
  verifyEmail: (email: string, currentTenantId: string) => Promise<EmailVerificationResult | null>;
  clearVerification: () => void;
  hasWarning: boolean;
}

export function useEmailVerification(): UseEmailVerificationReturn {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<EmailVerificationResult | null>(null);
  const { toast } = useToast();

  const verifyEmail = async (
    email: string,
    currentTenantId: string
  ): Promise<EmailVerificationResult | null> => {
    if (!email || !email.includes('@')) {
      return null;
    }

    setIsVerifying(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.rpc('check_email_exists_globally', {
        p_email: email.toLowerCase().trim(),
        p_current_tenant_id: currentTenantId,
        p_action_by: user?.id || null,
        p_request_source: 'form'
      });

      if (error) {
        console.error('Error verifying email:', error);
        toast({
          title: 'Error al verificar email',
          description: 'No se pudo verificar el email. Inténtalo nuevamente.',
          variant: 'destructive',
        });
        return null;
      }

      const result: EmailVerificationResult = {
        existsInAuth: data[0]?.exists_in_auth || false,
        authUserId: data[0]?.auth_user_id || null,
        existsInCurrentTenant: data[0]?.exists_in_current_tenant || false,
        currentTenantRoles: Array.isArray(data[0]?.current_tenant_roles) ? data[0].current_tenant_roles : [],
        otherTenants: Array.isArray(data[0]?.other_tenants) ? data[0].other_tenants as any[] : [],
      };

      setVerificationResult(result);
      return result;
    } catch (error) {
      console.error('Unexpected error during email verification:', error);
      toast({
        title: 'Error inesperado',
        description: 'Ocurrió un error al verificar el email.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsVerifying(false);
    }
  };

  const clearVerification = () => {
    setVerificationResult(null);
  };

  const hasWarning = verificationResult !== null && (
    verificationResult.existsInAuth || 
    verificationResult.otherTenants.length > 0
  );

  return {
    isVerifying,
    verificationResult,
    verifyEmail,
    clearVerification,
    hasWarning,
  };
}
