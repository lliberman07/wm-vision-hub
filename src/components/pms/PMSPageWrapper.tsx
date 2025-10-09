import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePMS } from '@/contexts/PMSContext';

interface PMSPageWrapperProps {
  children: ReactNode;
  requireRoles?: string[];
}

export function PMSPageWrapper({ children, requireRoles }: PMSPageWrapperProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPMSAccess, pmsRoles } = usePMS();

  useEffect(() => {
    if (!user || !hasPMSAccess) {
      navigate('/pms');
      return;
    }

    if (requireRoles && requireRoles.length > 0) {
      const hasRequiredRole = requireRoles.some(role => pmsRoles.includes(role as any));
      if (!hasRequiredRole) {
        navigate('/pms');
        return;
      }
    }
  }, [user, hasPMSAccess, pmsRoles, requireRoles, navigate]);

  return <>{children}</>;
}
