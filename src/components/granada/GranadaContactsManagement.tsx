import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Mail,
  Phone,
  MessageCircle,
  Filter,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  source: 'granada';
  status: 'new' | 'contacted' | 'in_progress' | 'qualified' | 'converted' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  last_action_type?: string;
  last_action_date?: string;
  last_action_notes?: string;
  internal_notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  assigned_profile?: {
    first_name: string;
    last_name: string;
  };
}

interface ContactAction {
  id: string;
  contact_id: string;
  action_type: 'email' | 'call' | 'whatsapp' | 'meeting' | 'note' | 'status_change' | 'other';
  action_date: string;
  performed_by: string;
  notes?: string;
  metadata?: any;
  created_at: string;
  performer_profile?: {
    first_name: string;
    last_name: string;
  };
}

const statusConfig = {
  new: { label: 'Nuevo', color: 'bg-blue-500' },
  contacted: { label: 'Contactado', color: 'bg-yellow-500' },
  in_progress: { label: 'En Proceso', color: 'bg-orange-500' },
  qualified: { label: 'Calificado', color: 'bg-purple-500' },
  converted: { label: 'Convertido', color: 'bg-green-500' },
  archived: { label: 'Archivado', color: 'bg-gray-500' }
};

const priorityConfig = {
  low: { label: 'Baja', color: 'bg-gray-400' },
  medium: { label: 'Media', color: 'bg-blue-400' },
  high: { label: 'Alta', color: 'bg-orange-400' },
  urgent: { label: 'Urgente', color: 'bg-red-500' }
};

export function GranadaContactsManagement() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactActions, setContactActions] = useState<ContactAction[]>([]);
  const [granadaAdmins, setGranadaAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionForm, setActionForm] = useState({
    type: 'call' as const,
    notes: '',
    outcome: ''
  });
  
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assigned: 'all',
    search: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchContacts();
    fetchGranadaAdmins();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [contacts, filters]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select(`
          *,
          assigned_profile:profiles!contact_submissions_assigned_to_fkey(first_name, last_name)
        `)
        .eq('source', 'granada')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data as any || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los contactos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGranadaAdmins = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', (
        await supabase
          .from('granada_platform_users')
          .select('user_id')
          .eq('is_active', true)
      ).data?.map(u => u.user_id) || []);
    
    setGranadaAdmins(data || []);
  };

  const fetchContactActions = async (contactId: string) => {
    const { data } = await supabase
      .from('contact_actions')
      .select(`
        *,
        performer_profile:profiles!contact_actions_performed_by_fkey(first_name, last_name)
      `)
      .eq('contact_id', contactId)
      .order('action_date', { ascending: false });
    
    setContactActions(data as any || []);
  };

  const applyFilters = () => {
    let filtered = [...contacts];

    if (filters.status !== 'all') {
      filtered = filtered.filter(c => c.status === filters.status);
    }
    if (filters.priority !== 'all') {
      filtered = filtered.filter(c => c.priority === filters.priority);
    }
    if (filters.assigned !== 'all') {
      filtered = filtered.filter(c => c.assigned_to === filters.assigned);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(c =>
        c.first_name.toLowerCase().includes(search) ||
        c.last_name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.company?.toLowerCase().includes(search)
      );
    }

    setFilteredContacts(filtered);
  };

  const handleEmailClick = (contact: Contact) => {
    window.location.href = `mailto:${contact.email}?subject=Re: Tu consulta en Granada Platform`;
  };

  const handleCallClick = (contact: Contact) => {
    if (contact.phone) {
      if (/Mobi|Android/i.test(navigator.userAgent)) {
        window.location.href = `tel:${contact.phone}`;
      } else {
        navigator.clipboard.writeText(contact.phone);
        toast({ title: 'Número copiado', description: contact.phone });
      }
    }
  };

  const handleWhatsAppClick = (contact: Contact) => {
    if (contact.phone) {
      const phone = contact.phone.replace(/[^0-9]/g, '');
      const message = encodeURIComponent(`Hola ${contact.first_name}, te contacto desde Granada Platform...`);
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    }
  };

  const handleUpdateStatus = async (contactId: string, newStatus: string) => {
    const { error } = await supabase
      .from('contact_submissions')
      .update({ status: newStatus })
      .eq('id', contactId);

    if (!error) {
      toast({ title: 'Estado actualizado' });
      fetchContacts();
      await supabase.from('contact_actions').insert({
        contact_id: contactId,
        action_type: 'status_change',
        performed_by: (await supabase.auth.getUser()).data.user?.id,
        notes: `Estado cambiado a: ${statusConfig[newStatus].label}`
      });
    }
  };

  const handleUpdatePriority = async (contactId: string, newPriority: string) => {
    const { error } = await supabase
      .from('contact_submissions')
      .update({ priority: newPriority })
      .eq('id', contactId);

    if (!error) {
      toast({ title: 'Prioridad actualizada' });
      fetchContacts();
    }
  };

  const handleAssignTo = async (contactId: string, userId: string) => {
    const { error } = await supabase
      .from('contact_submissions')
      .update({ assigned_to: userId || null })
      .eq('id', contactId);

    if (!error) {
      toast({ title: 'Contacto asignado' });
      fetchContacts();
    }
  };

  const handleRegisterAction = async () => {
    if (!selectedContact) return;

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { error: actionError } = await supabase
      .from('contact_actions')
      .insert({
        contact_id: selectedContact.id,
        action_type: actionForm.type,
        performed_by: user.id,
        notes: actionForm.notes,
        metadata: actionForm.outcome ? { outcome: actionForm.outcome } : null
      });

    if (actionError) {
      toast({ title: 'Error', description: 'No se pudo registrar la acción', variant: 'destructive' });
      return;
    }

    await supabase
      .from('contact_submissions')
      .update({
        last_action_type: actionForm.type,
        last_action_date: new Date().toISOString(),
        last_action_notes: actionForm.notes
      })
      .eq('id', selectedContact.id);

    toast({ title: 'Acción registrada' });
    setShowActionDialog(false);
    setActionForm({ type: 'call', notes: '', outcome: '' });
    fetchContactActions(selectedContact.id);
    fetchContacts();
  };

  const handleUpdateNotes = async (contactId: string, notes: string) => {
    await supabase
      .from('contact_submissions')
      .update({ internal_notes: notes })
      .eq('id', contactId);
    
    toast({ title: 'Notas actualizadas' });
    fetchContacts();
  };

  const stats = {
    total: contacts.length,
    new: contacts.filter(c => c.status === 'new').length,
    contacted: contacts.filter(c => c.status === 'contacted').length,
    converted: contacts.filter(c => c.status === 'converted').length,
    high_priority: contacts.filter(c => c.priority === 'high' || c.priority === 'urgent').length
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-muted rounded"></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nuevos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contactados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.contacted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Convertidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.converted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alta Prioridad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.high_priority}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Buscar</Label>
              <Input
                placeholder="Nombre, email, empresa..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={filters.status} onValueChange={(val) => setFilters({...filters, status: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="new">Nuevo</SelectItem>
                  <SelectItem value="contacted">Contactado</SelectItem>
                  <SelectItem value="in_progress">En Proceso</SelectItem>
                  <SelectItem value="qualified">Calificado</SelectItem>
                  <SelectItem value="converted">Convertido</SelectItem>
                  <SelectItem value="archived">Archivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridad</Label>
              <Select value={filters.priority} onValueChange={(val) => setFilters({...filters, priority: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Asignado a</Label>
              <Select value={filters.assigned} onValueChange={(val) => setFilters({...filters, assigned: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="unassigned">Sin asignar</SelectItem>
                  {granadaAdmins.map(admin => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.first_name} {admin.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contactos ({filteredContacts.length})</CardTitle>
          <CardDescription>
            Gestiona todos los contactos de Granada Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contacto</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Asignado</TableHead>
                <TableHead>Última Acción</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map(contact => (
                <TableRow 
                  key={contact.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedContact(contact);
                    fetchContactActions(contact.id);
                  }}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {contact.first_name} {contact.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">{contact.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{contact.company || '-'}</TableCell>
                  <TableCell>
                    <Badge className={statusConfig[contact.status].color}>
                      {statusConfig[contact.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityConfig[contact.priority].color}>
                      {priorityConfig[contact.priority].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {contact.assigned_profile 
                      ? `${contact.assigned_profile.first_name} ${contact.assigned_profile.last_name}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {contact.last_action_type 
                      ? `${contact.last_action_type} - ${format(new Date(contact.last_action_date!), 'dd/MM/yy')}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {format(new Date(contact.created_at), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEmailClick(contact)}
                        title="Enviar email"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      {contact.phone && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCallClick(contact)}
                            title="Llamar"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleWhatsAppClick(contact)}
                            title="WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Contact Detail Sheet */}
      <Sheet open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedContact && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {selectedContact.first_name} {selectedContact.last_name}
                </SheetTitle>
                <SheetDescription>
                  {selectedContact.email}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Quick Actions */}
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={() => handleEmailClick(selectedContact)}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  {selectedContact.phone && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleCallClick(selectedContact)}>
                        <Phone className="h-4 w-4 mr-2" />
                        Llamar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleWhatsAppClick(selectedContact)}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        WhatsApp
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setShowActionDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Acción
                  </Button>
                </div>

                {/* Contact Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Información</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><strong>Empresa:</strong> {selectedContact.company || '-'}</div>
                    <div><strong>Teléfono:</strong> {selectedContact.phone || '-'}</div>
                    <div><strong>Mensaje:</strong></div>
                    <div className="p-3 bg-muted rounded-md whitespace-pre-wrap">
                      {selectedContact.message}
                    </div>
                  </CardContent>
                </Card>

                {/* Status & Priority */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Gestión</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Estado</Label>
                      <Select 
                        value={selectedContact.status} 
                        onValueChange={(val) => handleUpdateStatus(selectedContact.id, val)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Prioridad</Label>
                      <Select 
                        value={selectedContact.priority} 
                        onValueChange={(val) => handleUpdatePriority(selectedContact.id, val)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(priorityConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Asignar a</Label>
                      <Select 
                        value={selectedContact.assigned_to || 'unassigned'} 
                        onValueChange={(val) => handleAssignTo(selectedContact.id, val === 'unassigned' ? '' : val)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Sin asignar</SelectItem>
                          {granadaAdmins.map(admin => (
                            <SelectItem key={admin.id} value={admin.id}>
                              {admin.first_name} {admin.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Internal Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Notas Internas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={selectedContact.internal_notes || ''}
                      onChange={(e) => setSelectedContact({...selectedContact, internal_notes: e.target.value})}
                      onBlur={() => handleUpdateNotes(selectedContact.id, selectedContact.internal_notes || '')}
                      placeholder="Agregar notas privadas sobre este contacto..."
                      rows={4}
                    />
                  </CardContent>
                </Card>

                {/* Actions Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Historial de Acciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {contactActions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hay acciones registradas</p>
                    ) : (
                      <div className="space-y-4">
                        {contactActions.map(action => (
                          <div key={action.id} className="flex gap-3 border-l-2 border-muted pl-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">{action.action_type}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(action.action_date), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                                </span>
                              </div>
                              {action.notes && (
                                <p className="text-sm">{action.notes}</p>
                              )}
                              {action.performer_profile && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Por: {action.performer_profile.first_name} {action.performer_profile.last_name}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Register Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Acción</DialogTitle>
            <DialogDescription>
              Documenta una interacción con este contacto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Acción</Label>
              <Select 
                value={actionForm.type} 
                onValueChange={(val: any) => setActionForm({...actionForm, type: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="call">Llamada</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="meeting">Reunión</SelectItem>
                  <SelectItem value="note">Nota</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Resultado (opcional)</Label>
              <Input
                placeholder="ej: Demo agendada para el 15/11"
                value={actionForm.outcome}
                onChange={(e) => setActionForm({...actionForm, outcome: e.target.value})}
              />
            </div>

            <div>
              <Label>Notas</Label>
              <Textarea
                placeholder="Detalles de la interacción..."
                value={actionForm.notes}
                onChange={(e) => setActionForm({...actionForm, notes: e.target.value})}
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowActionDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRegisterAction}>
                Guardar Acción
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}