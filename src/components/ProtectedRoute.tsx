import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

interface UserProfile {
  role: 'superadmin' | 'admin';
  status: 'pending' | 'approved' | 'denied';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }

      try {
        // Get user roles from unified user_roles table for WM module
        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role, status')
          .eq('user_id', user.id)
          .eq('module', 'WM')
          .in('role', ['admin', 'superadmin']);
        
        if (error) throw error;
        
        if (roles && roles.length > 0) {
          // Use the first role found (typically users should have one WM role)
          setUserProfile({
            role: roles[0].role as 'superadmin' | 'admin',
            status: roles[0].status as 'pending' | 'approved' | 'denied'
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load user profile. Please try logging out and back in.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check if user has appropriate role and status
  if (userProfile.role !== 'admin' && userProfile.role !== 'superadmin') {
    return <Navigate to="/" replace />;
  }

  if (userProfile.status === 'pending') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your account is pending approval by the administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (userProfile.status === 'denied') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your request for admin access has been denied.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (userProfile.status !== 'approved') {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;