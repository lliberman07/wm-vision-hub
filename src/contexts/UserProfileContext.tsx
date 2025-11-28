import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface GranadaPlatformUser {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'GRANADA_SUPERADMIN' | 'GRANADA_ADMIN';
  is_active: boolean;
}

interface UserProfileContextType {
  user: User | null;
  granadaUser: GranadaPlatformUser | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within UserProfileProvider');
  }
  return context;
};

export const UserProfileProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [granadaUser, setGranadaUser] = useState<GranadaPlatformUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGranadaUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('granada_platform_users')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data?.is_active) {
        setGranadaUser(data as GranadaPlatformUser);
      } else {
        setGranadaUser(null);
      }
    } catch (error) {
      console.error('[UserProfile] Error fetching granada user:', error);
      setGranadaUser(null);
    }
  };

  const refetch = async () => {
    if (user) {
      await fetchGranadaUser(user.id);
    }
  };

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        fetchGranadaUser(currentUser.id).finally(() => setLoading(false));
      } else {
        setGranadaUser(null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        setLoading(true);
        await fetchGranadaUser(currentUser.id);
        setLoading(false);
      } else {
        setGranadaUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserProfileContext.Provider value={{ user, granadaUser, loading, refetch }}>
      {children}
    </UserProfileContext.Provider>
  );
};
