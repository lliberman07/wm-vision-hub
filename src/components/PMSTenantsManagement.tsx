import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Building, Edit, Check, X, User, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type TenantType = 'sistema' | 'inmobiliaria' | 'administrador' | 'propietario' | 'inquilino' | 'proveedor_servicios';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  settings: any;
  tenant_type: TenantType;
  user_count?: number;
  max_users?: number;
}

interface TenantStats {
  type: string;
  count: number;
  label: string;
}

const TENANT_TYPES = [
  { value: 'sistema', label: 'Sistema' },
  { value: 'inmobiliaria', label: 'Inmobiliaria' },
  { value: 'administrador', label: 'Administrador' },
  { value: 'propietario', label: 'Propietario' },
  { value: 'inquilino', label: 'Inquilino' },
  { value: 'proveedor_servicios', label: 'Proveedor de Servicios' },
];

export function PMSTenantsManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    is_active: true,
    tenant_type: "inmobiliaria" as TenantType,
    maxUsers: 2,
  });
  const { toast } = useToast();

  const getTenantStats = (): TenantStats[] => {
    return TENANT_TYPES.map(type => ({
      type: type.value,
      label: type.label,
      count: tenants.filter(t => t.tenant_type === type.value).length
    }));
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_tenants_with_user_count');

      if (error) throw error;
      setTenants(data || []);
    } catch (error: any) {
      console.error("Error fetching tenants:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los tenants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTenant) {
        const settingsToSave = {
          ...editingTenant.settings,
          limits: {
            ...editingTenant.settings?.limits,
            max_users: formData.maxUsers
          }
        };

        const { error } = await supabase
          .from("pms_tenants")
          .update({
            name: formData.name,
            slug: formData.slug,
            is_active: formData.is_active,
            tenant_type: formData.tenant_type,
            settings: settingsToSave,
          })
          .eq("id", editingTenant.id);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Tenant actualizado correctamente",
        });
      } else {
        const settingsToSave = {
          limits: {
            max_users: formData.maxUsers
          }
        };

        const { error } = await supabase
          .from("pms_tenants")
          .insert([{
            name: formData.name,
            slug: formData.slug,
            is_active: formData.is_active,
            tenant_type: formData.tenant_type,
            settings: settingsToSave,
          }]);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Tenant creado correctamente",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchTenants();
    } catch (error: any) {
      console.error("Error saving tenant:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el tenant",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      is_active: true,
      tenant_type: "inmobiliaria",
      maxUsers: 2,
    });
    setEditingTenant(null);
  };

  const handleEdit = (tenant: Tenant) => {
    const maxUsers = tenant.settings?.limits?.max_users || tenant.max_users || 2;
    
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      is_active: tenant.is_active,
      tenant_type: tenant.tenant_type,
      maxUsers: maxUsers,
    });
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleDelete = async (tenant: Tenant) => {
    setDeletingTenant(tenant);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingTenant) return;

    try {
      // Verificar si tiene registros asociados
      const { data: recordsCheck, error: checkError } = await supabase
        .rpc('check_tenant_has_records' as any, { tenant_id_param: deletingTenant.id });

      if (checkError) throw checkError;

      // Tipear correctamente la respuesta
      const checkResult = recordsCheck as unknown as Array<{
        has_records: boolean;
        total_records: number;
        details: any;
      }>;

      if (checkResult && checkResult.length > 0 && checkResult[0].has_records) {
        toast({
          title: "No se puede eliminar",
          description: `El tenant tiene ${checkResult[0].total_records} registros asociados. Debe eliminar todos los datos antes de borrar el tenant.`,
          variant: "destructive",
        });
        setIsDeleteDialogOpen(false);
        setDeletingTenant(null);
        return;
      }

      // Si no tiene registros, proceder a eliminar
      const { error: deleteError } = await supabase
        .from("pms_tenants")
        .delete()
        .eq("id", deletingTenant.id);

      if (deleteError) throw deleteError;

      toast({
        title: "Éxito",
        description: "Tenant eliminado correctamente",
      });

      fetchTenants();
    } catch (error: any) {
      console.error("Error deleting tenant:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el tenant",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingTenant(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas por tipo */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {getTenantStats().map((stat) => (
          <Card key={stat.type}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{stat.count}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Total de tenants: {tenants.length}
        </p>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTenant ? "Editar Tenant" : "Crear Nuevo Tenant"}
              </DialogTitle>
              <DialogDescription>
                {editingTenant
                  ? "Modifica los datos del tenant existente"
                  : "Crea un nuevo tenant para el sistema PMS"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="Ej: Inmobiliaria Principal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (identificador único)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    })
                  }
                  required
                  placeholder="ej: inmobiliaria-principal"
                  pattern="^[a-z0-9-]+$"
                />
                <p className="text-xs text-muted-foreground">
                  Solo letras minúsculas, números y guiones
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant_type">Tipo de Tenant</Label>
                <Select
                  value={formData.tenant_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tenant_type: value as TenantType })
                  }
                >
                  <SelectTrigger id="tenant_type">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TENANT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Activo</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUsers">Límite de Usuarios</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.maxUsers}
                  onChange={(e) =>
                    setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 2 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Cantidad máxima de usuarios permitidos en este tenant
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTenant ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tenants.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            No hay tenants creados aún
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      {tenant.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {TENANT_TYPES.find(t => t.value === tenant.tenant_type)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="px-2 py-1 bg-muted rounded text-xs">
                      {tenant.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{tenant.user_count || 0}</span>
                      <span className="text-xs text-muted-foreground">
                        / {tenant.max_users || 2}
                      </span>
                      {(tenant.user_count || 0) >= (tenant.max_users || 2) && (
                        <Badge variant="destructive" className="text-xs">
                          Límite
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tenant.is_active ? "default" : "secondary"}>
                      {tenant.is_active ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Activo
                        </>
                      ) : (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Inactivo
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(tenant.created_at).toLocaleDateString("es-AR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(tenant)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(tenant)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tenant?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el tenant <strong>{deletingTenant?.name}</strong>.
              Solo se puede eliminar si no tiene registros asociados (propiedades, contratos, usuarios, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
