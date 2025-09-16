import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Download, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Application {
  id: string;
  type: 'individual' | 'company';
  email: string;
  phone: string;
  status: 'draft' | 'pending' | 'completed' | 'approved' | 'denied' | 'under_analysis_fi' | 'under_analysis_wm';
  resume_code: string;
  created_at: string;
  updated_at: string;
  applicants?: any[];
  documents?: any[];
}

export const ApplicationManagement = () => {
  const { t } = useLanguage();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          applicants(*),
          documents(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: 'approved' | 'denied' | 'under_analysis_fi' | 'under_analysis_wm') => {
    try {
      const application = applications.find(app => app.id === applicationId);
      if (!application) return;

      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      // Send email notification
      await supabase.functions.invoke('send-application-email', {
        body: {
          email: application.email,
          type: newStatus,
          resumeCode: application.resume_code,
          language: 'en'
        }
      });

      toast.success(`Application ${newStatus} successfully`);
      fetchApplications();
      setDetailsOpen(false);
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', variant: 'secondary' as const, icon: Clock },
      pending: { label: 'Pending', variant: 'default' as const, icon: Clock },
      completed: { label: 'Completed', variant: 'default' as const, icon: FileText },
      approved: { label: 'Approved', variant: 'default' as const, icon: CheckCircle },
      denied: { label: 'Denied', variant: 'destructive' as const, icon: XCircle },
      under_analysis_fi: { label: 'Under Analysis by FI', variant: 'secondary' as const, icon: Clock },
      under_analysis_wm: { label: 'Under Analysis by WM', variant: 'secondary' as const, icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {t(config.label)}
      </Badge>
    );
  };

  const filteredApplications = applications.filter(app => 
    statusFilter === 'all' || app.status === statusFilter
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>{t('Financing Applications')}</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('Filter by status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All Status')}</SelectItem>
                <SelectItem value="draft">{t('Draft')}</SelectItem>
                <SelectItem value="pending">{t('Pending')}</SelectItem>
                <SelectItem value="completed">{t('Completed')}</SelectItem>
                <SelectItem value="under_analysis_fi">{t('Under Analysis by FI')}</SelectItem>
                <SelectItem value="under_analysis_wm">{t('Under Analysis by WM')}</SelectItem>
                <SelectItem value="approved">{t('Approved')}</SelectItem>
                <SelectItem value="denied">{t('Denied')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Type')}</TableHead>
                  <TableHead>{t('Email')}</TableHead>
                  <TableHead>{t('Status')}</TableHead>
                  <TableHead>{t('Submitted')}</TableHead>
                  <TableHead>{t('Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t('No applications found')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {t(application.type === 'individual' ? 'Individual' : 'Company')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{application.email}</TableCell>
                      <TableCell>{getStatusBadge(application.status)}</TableCell>
                      <TableCell>
                        {new Date(application.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedApplication(application)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {t('View')}
                            </Button>
                          </DialogTrigger>
                          {selectedApplication && (
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  {t('Application Details')} - {selectedApplication.email}
                                </DialogTitle>
                              </DialogHeader>
                              
                              <div className="space-y-6">
                                {/* Application Info */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">{t('Application Info')}</h4>
                                    <div className="space-y-1 text-sm">
                                      <div><strong>{t('Type')}:</strong> {t(selectedApplication.type === 'individual' ? 'Individual' : 'Company')}</div>
                                      <div><strong>{t('Email')}:</strong> {selectedApplication.email}</div>
                                      <div><strong>{t('Phone')}:</strong> {selectedApplication.phone || 'N/A'}</div>
                                      <div><strong>{t('Status')}:</strong> {getStatusBadge(selectedApplication.status)}</div>
                                      <div><strong>{t('Resume Code')}:</strong> {selectedApplication.resume_code}</div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-medium mb-2">{t('Dates')}</h4>
                                    <div className="space-y-1 text-sm">
                                      <div><strong>{t('Created')}:</strong> {new Date(selectedApplication.created_at).toLocaleString()}</div>
                                      <div><strong>{t('Updated')}:</strong> {new Date(selectedApplication.updated_at).toLocaleString()}</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Applicants */}
                                {selectedApplication.applicants && selectedApplication.applicants.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">{t('Applicants')}</h4>
                                    <div className="space-y-2">
                                      {selectedApplication.applicants.map((applicant, index) => (
                                        <div key={index} className="p-3 border rounded-lg text-sm">
                                          <div className="grid grid-cols-2 gap-2">
                                            <div><strong>{t('Name')}:</strong> {applicant.full_name || 'N/A'}</div>
                                            <div><strong>{t('Document ID')}:</strong> {applicant.document_id || 'N/A'}</div>
                                            {applicant.role_in_company && (
                                              <div><strong>{t('Role')}:</strong> {applicant.role_in_company}</div>
                                            )}
                                            {applicant.ownership_percentage && (
                                              <div><strong>{t('Ownership')}:</strong> {applicant.ownership_percentage}%</div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Documents */}
                                {selectedApplication.documents && selectedApplication.documents.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">{t('Documents')} ({selectedApplication.documents.length})</h4>
                                    <div className="space-y-2">
                                      {selectedApplication.documents.map((document, index) => (
                                        <div key={index} className="flex justify-between items-center p-2 border rounded">
                                          <div className="flex items-center space-x-2">
                                            <FileText className="h-4 w-4" />
                                            <span className="text-sm">{document.doc_type}</span>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => window.open(document.file_url, '_blank')}
                                          >
                                            <Download className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                {/* Actions */}
                {(selectedApplication.status === 'completed' || selectedApplication.status === 'pending' || selectedApplication.status === 'under_analysis_fi' || selectedApplication.status === 'under_analysis_wm') && (
                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => updateApplicationStatus(selectedApplication.id, 'under_analysis_fi')}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {t('Under Analysis by FI')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => updateApplicationStatus(selectedApplication.id, 'under_analysis_wm')}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {t('Under Analysis by WM')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => updateApplicationStatus(selectedApplication.id, 'denied')}
                      className="text-destructive hover:text-destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {t('Deny')}
                    </Button>
                    <Button
                      onClick={() => updateApplicationStatus(selectedApplication.id, 'approved')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t('Approve')}
                    </Button>
                  </div>
                )}
                              </div>
                            </DialogContent>
                          )}
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};