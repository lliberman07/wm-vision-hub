import { createContext, useContext, ReactNode } from 'react';
import { useUserProfile } from './UserProfileContext';
import { User } from '@supabase/supabase-js';

type GranadaRole = 'GRANADA_SUPERADMIN' | 'GRANADA_ADMIN' | null;

interface GranadaAuthContextType {
  user: User | null;
  granadaRole: GranadaRole;
  isGranadaAdmin: boolean;
  isGranadaSuperAdmin: boolean;
  loading: boolean;
}

const GranadaAuthContext = createContext<GranadaAuthContextType | undefined>(undefined);

export function GranadaAuthProvider({ children }: { children: ReactNode }) {
  const { user, granadaUser, loading } = useUserProfile();
  
  const granadaRole: GranadaRole = granadaUser?.role || null;

  const isGranadaAdmin = granadaRole === 'GRANADA_ADMIN' || granadaRole === 'GRANADA_SUPERADMIN';
  const isGranadaSuperAdmin = granadaRole === 'GRANADA_SUPERADMIN';

  return (
    <GranadaAuthContext.Provider 
      value={{ 
        user, 
        granadaRole, 
        isGranadaAdmin, 
        isGranadaSuperAdmin, 
        loading 
      }}
    >
      {children}
    </GranadaAuthContext.Provider>
  );
}

export function useGranadaAuth() {
  const context = useContext(GranadaAuthContext);
  if (context === undefined) {
    throw new Error('useGranadaAuth must be used within a GranadaAuthProvider');
  }
  return context;
}
