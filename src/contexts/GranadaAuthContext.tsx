import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const [user, setUser] = useState<User | null>(null);
  const [granadaRole, setGranadaRole] = useState<GranadaRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkGranadaRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkGranadaRole(session.user.id);
      } else {
        setGranadaRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkGranadaRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('granada_platform_users')
        .select('role, is_active')
        .eq('user_id', userId)
        .single();

      if (error || !data || !data.is_active) {
        setGranadaRole(null);
      } else {
        setGranadaRole(data.role as GranadaRole);
      }
    } catch (error) {
      console.error('Error checking Granada role:', error);
      setGranadaRole(null);
    } finally {
      setLoading(false);
    }
  };

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
