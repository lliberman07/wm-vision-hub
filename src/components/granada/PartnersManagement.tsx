import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Partner {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  type: 'real_estate_agency' | 'independent_manager';
  province: string | null;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  tiktok: string | null;
  linkedin: string | null;
  is_featured: boolean;
  is_active: boolean;
}

export function PartnersManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [partnerToDelete, setPartnerToDelete] = useState<string | null>(null);

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['partners-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('granada_partners')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Partner[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Partner>) => {
      const { error } = await supabase
        .from('granada_partners')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners-admin'] });
      toast({ title: "Partner creado exitosamente" });
      setDialogOpen(false);
      setSelectedPartner(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Partner> }) => {
      const { error } = await supabase
        .from('granada_partners')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners-admin'] });
      toast({ title: "Partner actualizado exitosamente" });
      setDialogOpen(false);
      setSelectedPartner(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('granada_partners')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners-admin'] });
      toast({ title: "Partner eliminado exitosamente" });
      setDeleteDialogOpen(false);
      setPartnerToDelete(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as 'real_estate_agency' | 'independent_manager',
      province: formData.get('province') as string,
      city: formData.get('city') as string,
      neighborhood: formData.get('neighborhood') as string || null,
      address: formData.get('address') as string || null,
      phone: formData.get('phone') as string || null,
      email: formData.get('email') as string || null,
      website: formData.get('website') as string || null,
      instagram: formData.get('instagram') as string || null,
      facebook: formData.get('facebook') as string || null,
      twitter: formData.get('twitter') as string || null,
      tiktok: formData.get('tiktok') as string || null,
      linkedin: formData.get('linkedin') as string || null,
      logo_url: formData.get('logo_url') as string || null,
      is_featured: formData.get('is_featured') === 'true',
      is_active: formData.get('is_active') === 'true',
    };

    if (selectedPartner) {
      updateMutation.mutate({ id: selectedPartner.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Gestión de Partners</h2>
          <p className="text-muted-foreground">Administra el directorio de inmobiliarias y administradores</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedPartner(null);
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Nuevo Partner</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedPartner ? 'Editar' : 'Nuevo'} Partner</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input id="name" name="name" defaultValue={selectedPartner?.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select name="type" defaultValue={selectedPartner?.type} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="real_estate_agency">Inmobiliaria</SelectItem>
                      <SelectItem value="independent_manager">Administrador Independiente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" name="description" defaultValue={selectedPartner?.description || ''} rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">URL del Logo</Label>
                <Input id="logo_url" name="logo_url" defaultValue={selectedPartner?.logo_url || ''} placeholder="https://..." />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="province">Provincia</Label>
                  <Input id="province" name="province" defaultValue={selectedPartner?.province || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input id="city" name="city" defaultValue={selectedPartner?.city || ''} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Barrio</Label>
                  <Input id="neighborhood" name="neighborhood" defaultValue={selectedPartner?.neighborhood || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input id="address" name="address" defaultValue={selectedPartner?.address || ''} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" name="phone" type="tel" defaultValue={selectedPartner?.phone || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={selectedPartner?.email || ''} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Sitio Web</Label>
                <Input id="website" name="website" type="url" defaultValue={selectedPartner?.website || ''} placeholder="https://..." />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram (usuario)</Label>
                  <Input id="instagram" name="instagram" defaultValue={selectedPartner?.instagram || ''} placeholder="usuario" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook (usuario)</Label>
                  <Input id="facebook" name="facebook" defaultValue={selectedPartner?.facebook || ''} placeholder="usuario" />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter/X (usuario)</Label>
                  <Input id="twitter" name="twitter" defaultValue={selectedPartner?.twitter || ''} placeholder="usuario" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiktok">TikTok (usuario)</Label>
                  <Input id="tiktok" name="tiktok" defaultValue={selectedPartner?.tiktok || ''} placeholder="usuario" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn (usuario)</Label>
                  <Input id="linkedin" name="linkedin" defaultValue={selectedPartner?.linkedin || ''} placeholder="usuario" />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Switch id="is_featured" name="is_featured" defaultChecked={selectedPartner?.is_featured} value="true" />
                  <Label htmlFor="is_featured">Destacado</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="is_active" name="is_active" defaultChecked={selectedPartner?.is_active ?? true} value="true" />
                  <Label htmlFor="is_active">Activo</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">{selectedPartner ? 'Actualizar' : 'Crear'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Partners ({partners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {partner.name}
                      {partner.is_featured && <Star className="h-4 w-4 text-[hsl(var(--granada-gold))]" fill="currentColor" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    {partner.type === 'real_estate_agency' ? 'Inmobiliaria' : 'Administrador'}
                  </TableCell>
                  <TableCell>{partner.city || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={partner.is_active ? 'default' : 'secondary'}>
                      {partner.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPartner(partner);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPartnerToDelete(partner.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El partner será eliminado permanentemente del directorio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => partnerToDelete && deleteMutation.mutate(partnerToDelete)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
