import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Mail, Phone, Building, Calendar, MessageSquare, User, Eye, Users, FileText } from "lucide-react";
import { format } from "date-fns";
import UserApprovals from "@/components/UserApprovals";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ApplicationManagement } from "@/components/ApplicationManagement";
import { KnowledgeBaseInit } from "@/components/KnowledgeBaseInit";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  created_at: string;
}

const Admin = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [userProfile, setUserProfile] = useState<{role: string, status: string} | null>(null);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchContacts();
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
    }
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contacts:', error);
        toast({
          title: "Error",
          description: "Failed to load contacts",
          variant: "destructive"
        });
        return;
      }

      setContacts(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive"
      });
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

  const formatMessagePreview = (message: string) => {
    return message.length > 50 ? `${message.substring(0, 50)}...` : message;
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">WM Management</p>
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
      <main className="container mx-auto p-6">
        <Tabs defaultValue="contacts" className="space-y-6">
          <TabsList className={`grid w-full ${userProfile?.role === 'superadmin' ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Contact Submissions
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Financing Applications
            </TabsTrigger>
            <TabsTrigger value="chatbot" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              AI Chatbot
            </TabsTrigger>
            {userProfile?.role === 'superadmin' && (
              <TabsTrigger value="approvals" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Approvals
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="contacts">
            <Card className="shadow-strong">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Contact Submissions</span>
                </CardTitle>
                <CardDescription>
                  Total submissions: {contacts.length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contacts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No contact submissions yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Message Preview</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contacts.map((contact) => (
                          <TableRow key={contact.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">
                              {contact.first_name} {contact.last_name}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{contact.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {contact.company && (
                                <div className="flex items-center space-x-2">
                                  <Building className="h-4 w-4 text-muted-foreground" />
                                  <span>{contact.company}</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {formatMessagePreview(contact.message)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {format(new Date(contact.created_at), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Sheet>
                                <SheetTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedContact(contact)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </Button>
                                </SheetTrigger>
                                <SheetContent className="w-[400px] sm:w-[540px]">
                                  {selectedContact && (
                                    <>
                                      <SheetHeader>
                                        <SheetTitle className="flex items-center space-x-2">
                                          <User className="h-5 w-5" />
                                          <span>{selectedContact.first_name} {selectedContact.last_name}</span>
                                        </SheetTitle>
                                        <SheetDescription>
                                          Contact submission details
                                        </SheetDescription>
                                      </SheetHeader>
                                      
                                      <div className="mt-6 space-y-6">
                                        <div className="space-y-4">
                                          <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                                            <Mail className="h-5 w-5 text-primary" />
                                            <div>
                                              <p className="font-semibold">Email</p>
                                              <p className="text-sm text-muted-foreground">{selectedContact.email}</p>
                                            </div>
                                          </div>

                                          {selectedContact.phone && (
                                            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                                              <Phone className="h-5 w-5 text-primary" />
                                              <div>
                                                <p className="font-semibold">Phone</p>
                                                <p className="text-sm text-muted-foreground">{selectedContact.phone}</p>
                                              </div>
                                            </div>
                                          )}

                                          {selectedContact.company && (
                                            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                                              <Building className="h-5 w-5 text-primary" />
                                              <div>
                                                <p className="font-semibold">Company</p>
                                                <p className="text-sm text-muted-foreground">{selectedContact.company}</p>
                                              </div>
                                            </div>
                                          )}

                                          <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                                            <Calendar className="h-5 w-5 text-primary mt-0.5" />
                                            <div>
                                              <p className="font-semibold">Submitted</p>
                                              <p className="text-sm text-muted-foreground">
                                                {format(new Date(selectedContact.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
                                              </p>
                                            </div>
                                          </div>

                                          <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                              <MessageSquare className="h-5 w-5 text-primary" />
                                              <p className="font-semibold">Message</p>
                                            </div>
                                            <div className="bg-muted/50 p-4 rounded-lg">
                                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                {selectedContact.message}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </SheetContent>
                              </Sheet>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <Card className="shadow-strong">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Financing Applications</span>
                </CardTitle>
                <CardDescription>
                  Manage individual and business financing applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ApplicationManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chatbot">
            <Card className="shadow-strong">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>AI Chatbot Management</span>
                </CardTitle>
                <CardDescription>
                  Initialize and manage the AI chatbot knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-8">
                <KnowledgeBaseInit />
              </CardContent>
            </Card>
          </TabsContent>

          {userProfile?.role === 'superadmin' && (
            <TabsContent value="approvals">
              <Card className="shadow-strong">
                <CardContent className="pt-6">
                  <UserApprovals />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;