import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Routes, Route, Navigate } from "react-router-dom";
import { ContactSubmissionsView } from "@/components/admin/ContactSubmissionsView";
import { SimulationsView } from "@/components/admin/SimulationsView";
import { ApplicationsView } from "@/components/admin/ApplicationsView";
import { ChatbotView } from "@/components/admin/ChatbotView";
import { PMSTenantsView } from "@/components/admin/PMSTenantsView";
import { PMSAccessView } from "@/components/admin/PMSAccessView";
import { PMSRolesView } from "@/components/admin/PMSRolesView";
import { UserApprovalsView } from "@/components/admin/UserApprovalsView";
import { AdminUsersView } from "@/components/admin/AdminUsersView";

// Admin Dashboard with Sidebar Layout
const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{role: string, status: string} | null>(null);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase.rpc('get_current_user_profile');
      if (error) throw error;
      if (data && data.length > 0) {
        setUserProfile(data[0]);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Success",
      description: "Successfully signed out",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar userRole={userProfile?.role} />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-card/50 backdrop-blur">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                  <p className="text-muted-foreground">WM Management</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <LanguageSwitcher />
                <Badge variant="outline" className="px-3 py-1">
                  <User className="h-3 w-3 mr-1" />
                  {user?.email}
                </Badge>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <Routes>
              <Route index element={<Navigate to="/admin/contacts" replace />} />
              <Route path="contacts" element={<ContactSubmissionsView />} />
              <Route path="simulations" element={<SimulationsView />} />
              <Route path="applications" element={<ApplicationsView />} />
              <Route path="chatbot" element={<ChatbotView />} />
              {userProfile?.role === 'superadmin' && (
                <>
                  <Route path="pms-tenants" element={<PMSTenantsView />} />
                  <Route path="pms-access" element={<PMSAccessView />} />
                  <Route path="pms-roles" element={<PMSRolesView />} />
                  <Route path="approvals" element={<UserApprovalsView />} />
                  <Route path="admin-users" element={<AdminUsersView />} />
                </>
              )}
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
