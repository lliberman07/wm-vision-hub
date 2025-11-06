import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Building, Edit, Check, X, User, Trash2, Users, Mail, Shield, Eye, Network, Home } from "lucide-react";
import { format } from "date-fns";
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

type TenantType = 'sistema' | 'inmobiliaria' | 'gestor' | 'propietario';

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
  parent_tenant_id?: string | null;
}

interface BranchTenant extends Tenant {
  level: number;
  total_users: number;
  total_properties: number;
  total_active_contracts: number;
}

interface TenantStats {
  type: string;
  count: number;
  label: string;
}

interface TenantUser {
  id: string;
  user_id: string;
  user_email: string;
  role: string;
  created_at: string;
}

const TENANT_TYPES = [
  { value: 'sistema', label: 'Sistema' },
  { value: 'inmobiliaria', label: 'Inmobiliaria' },
  { value: 'gestor', label: 'Property Manager' },
  { value: 'propietario', label: 'Propietario Individual' },
];

export function PMSTenantsManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [viewingTenantUsers, setViewingTenantUsers] = useState<Tenant | null>(null);
  const [isViewUsersDialogOpen, setIsViewUsersDialogOpen] = useState(false);
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [viewingBranches, setViewingBranches] = useState<Tenant | null>(null);
  const [isViewBranchesDialogOpen, setIsViewBranchesDialogOpen] = useState(false);
  const [branches, setBranches] = useState<BranchTenant[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    is_active: true,
    tenant_type: "inmobiliaria" as TenantType,
    maxUsers: 2,
    parent_tenant_id: null as string | null,
    is_headquarters: false,
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
      // Fetch tenants with all necessary fields
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('pms_tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (tenantsError) throw tenantsError;

      // Get user counts for each tenant
      const { data: userCounts, error: userCountsError } = await supabase
        .from('user_roles')
        .select('tenant_id')
        .eq('module', 'PMS')
        .eq('status', 'approved');

      if (userCountsError) throw userCountsError;

      // Count users per tenant
      const userCountMap = new Map<string, number>();
      (userCounts || []).forEach(role => {
        userCountMap.set(role.tenant_id, (userCountMap.get(role.tenant_id) || 0) + 1);
      });

      // Combine data
      const enrichedTenants = (tenantsData || []).map(tenant => {
        const settings = tenant.settings as any;
        // Mapear 'administrador' a 'gestor' durante la transición
        const tenantType = tenant.tenant_type === 'administrador' ? 'gestor' : tenant.tenant_type;
        return {
          ...tenant,
          tenant_type: tenantType as TenantType,
          user_count: userCountMap.get(tenant.id) || 0,
          max_users: settings?.limits?.max_users || 2,
        };
      });

      setTenants(enrichedTenants);
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

  const handleViewBranches = async (tenant: Tenant) => {
    setViewingBranches(tenant);
    setIsViewBranchesDialogOpen(true);
    setLoadingBranches(true);

    try {
      const { data, error } = await supabase
        .rpc('get_tenant_hierarchy', { p_tenant_id: tenant.id });

      if (error) throw error;

      // Filtrar solo las sucursales (level > 1)
      const branchData = (data || [])
        .filter((item: any) => item.level > 1)
        .map((item: any) => ({
          id: item.tenant_id,
          name: item.tenant_name,
          slug: item.tenant_slug,
          tenant_type: item.tenant_type,
          parent_tenant_id: item.parent_tenant_id,
          level: item.level,
          total_users: item.total_users,
          total_properties: item.total_properties,
          total_active_contracts: item.total_active_contracts,
          is_active: true,
          created_at: new Date().toISOString(),
          settings: {},
        }));

      setBranches(branchData);
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las sucursales",
        variant: "destructive",
      });
    } finally {
      setLoadingBranches(false);
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
          },
          is_headquarters: formData.is_headquarters
        };

        const { error } = await supabase
          .from("pms_tenants")
          .update({
            name: formData.name,
            slug: formData.slug,
            is_active: formData.is_active,
            tenant_type: formData.tenant_type,
            settings: settingsToSave,
            parent_tenant_id: formData.parent_tenant_id,
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
          },
          is_headquarters: formData.is_headquarters
        };

        const { error } = await supabase
          .from("pms_tenants")
          .insert([{
            name: formData.name,
            slug: formData.slug,
            is_active: formData.is_active,
            tenant_type: formData.tenant_type,
            settings: settingsToSave,
            parent_tenant_id: formData.parent_tenant_id,
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
      parent_tenant_id: null,
      is_headquarters: false,
    });
    setEditingTenant(null);
  };

  const handleEdit = (tenant: Tenant) => {
    const maxUsers = tenant.settings?.limits?.max_users || tenant.max_users || 2;
    const isHeadquarters = tenant.settings?.is_headquarters || false;
    
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      is_active: tenant.is_active,
      tenant_type: tenant.tenant_type,
      maxUsers: maxUsers,
      parent_tenant_id: tenant.parent_tenant_id || null,
      is_headquarters: isHeadquarters,
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

  const handleViewUsers = async (tenant: Tenant) => {
    setViewingTenantUsers(tenant);
    setIsViewUsersDialogOpen(true);
    setLoadingUsers(true);

    try {
      const { data: rolesData, error } = await supabase
        .from('user_roles')
        .select('id, user_id, role, created_at')
        .eq('tenant_id', tenant.id)
        .eq('module', 'PMS')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (rolesData && rolesData.length > 0) {
        const userIds = [...new Set(rolesData.map(r => r.user_id))];
        const { data: users } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds);

        const userMap = new Map((users || []).map(u => [u.id, u.email]));

        const enrichedData: TenantUser[] = rolesData.map(role => ({
          ...role,
          user_email: userMap.get(role.user_id) || 'Unknown'
        }));

        setTenantUsers(enrichedData);
      } else {
        setTenantUsers([]);
      }
    } catch (error: any) {
      console.error('Error fetching tenant users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios del tenant",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
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

              {(formData.tenant_type === 'inmobiliaria' || formData.tenant_type === 'gestor') && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <Label>Tipo de Organización</Label>
                  
                  <div className="space-y-3">
                    {/* Opción: Casa Matriz */}
                    <div 
                      className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.is_headquarters 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => {
                        setFormData({ 
                          ...formData, 
                          is_headquarters: true,
                          parent_tenant_id: null
                        });
                      }}
                    >
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-primary mt-0.5">
                        {formData.is_headquarters && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-medium">
                          <Home className="h-4 w-4 text-primary" />
                          Casa Matriz
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Independiente, puede tener sucursales asociadas
                        </p>
                      </div>
                    </div>

                    {/* Opción: Sucursal */}
                    <div 
                      className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        !formData.is_headquarters && formData.parent_tenant_id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => {
                        setFormData({ 
                          ...formData, 
                          is_headquarters: false,
                          parent_tenant_id: formData.parent_tenant_id || (
                            tenants.find(t => 
                              t.settings?.is_headquarters && 
                              t.tenant_type === formData.tenant_type &&
                              t.id !== editingTenant?.id
                            )?.id || null
                          )
                        });
                      }}
                    >
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-primary mt-0.5">
                        {!formData.is_headquarters && formData.parent_tenant_id && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-medium">
                          <Network className="h-4 w-4 text-primary" />
                          Sucursal
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Depende de una Casa Matriz existente
                        </p>
                        
                        {!formData.is_headquarters && (
                          <div className="mt-3">
                            <Label htmlFor="parent_tenant_id" className="text-xs">
                              Seleccionar Casa Matriz
                            </Label>
                            <Select
                              value={formData.parent_tenant_id || "none"}
                              onValueChange={(value) => {
                                const newParentId = value === "none" ? null : value;
                                setFormData({ 
                                  ...formData, 
                                  parent_tenant_id: newParentId,
                                  is_headquarters: false
                                });
                              }}
                            >
                              <SelectTrigger id="parent_tenant_id" className="mt-1">
                                <SelectValue placeholder="Seleccionar Casa Matriz" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none" disabled>
                                  Seleccionar Casa Matriz
                                </SelectItem>
                                {tenants
                                  .filter(t => 
                                    t.settings?.is_headquarters && 
                                    t.tenant_type === formData.tenant_type &&
                                    t.id !== editingTenant?.id
                                  )
                                  .map((tenant) => (
                                    <SelectItem key={tenant.id} value={tenant.id}>
                                      <div className="flex items-center gap-2">
                                        <Home className="h-3 w-3" />
                                        {tenant.name}
                                      </div>
                                    </SelectItem>
                                  ))
                                }
                              </SelectContent>
                            </Select>
                            {tenants.filter(t => 
                              t.settings?.is_headquarters && 
                              t.tenant_type === formData.tenant_type &&
                              t.id !== editingTenant?.id
                            ).length === 0 && (
                              <p className="text-xs text-destructive mt-1">
                                No hay Casas Matriz disponibles. Crea una primero.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Opción: Independiente */}
                    <div 
                      className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        !formData.is_headquarters && !formData.parent_tenant_id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => {
                        setFormData({ 
                          ...formData, 
                          is_headquarters: false,
                          parent_tenant_id: null
                        });
                      }}
                    >
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-primary mt-0.5">
                        {!formData.is_headquarters && !formData.parent_tenant_id && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-medium">
                          <Building className="h-4 w-4 text-primary" />
                          Independiente
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Sin relación jerárquica con otras inmobiliarias
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                  <TableHead>Jerarquía</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {tenants.map((tenant) => {
                const isHeadquarters = tenant.settings?.is_headquarters || false;
                const hasBranches = tenants.some(t => t.parent_tenant_id === tenant.id);
                const parentTenant = tenant.parent_tenant_id 
                  ? tenants.find(t => t.id === tenant.parent_tenant_id)
                  : null;

                return (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {isHeadquarters ? (
                        <Home className="h-4 w-4 text-primary" />
                      ) : tenant.parent_tenant_id ? (
                        <Network className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Building className="h-4 w-4 text-muted-foreground" />
                      )}
                      {tenant.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {TENANT_TYPES.find(t => t.value === tenant.tenant_type)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isHeadquarters && (
                      <Badge variant="default" className="gap-1">
                        <Home className="h-3 w-3" />
                        Casa Matriz
                      </Badge>
                    )}
                    {tenant.parent_tenant_id && parentTenant && (
                      <Badge variant="secondary" className="gap-1">
                        <Network className="h-3 w-3" />
                        Sucursal de {parentTenant.name}
                      </Badge>
                    )}
                    {!isHeadquarters && !tenant.parent_tenant_id && (
                      <Badge variant="outline">Independiente</Badge>
                    )}
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
                      {hasBranches && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewBranches(tenant)}
                          title="Ver sucursales"
                        >
                          <Network className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewUsers(tenant)}
                        title="Ver usuarios"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(tenant)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(tenant)}
                        className="text-destructive hover:text-destructive"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View Users Dialog */}
      <Dialog open={isViewUsersDialogOpen} onOpenChange={setIsViewUsersDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuarios de {viewingTenantUsers?.name}
            </DialogTitle>
            <DialogDescription>
              Listado de usuarios y roles asignados a este tenant
            </DialogDescription>
          </DialogHeader>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : tenantUsers.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No hay usuarios asignados a este tenant</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Fecha de Asignación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenantUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{user.user_email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Shield className="h-3 w-3" />
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(user.created_at), 'dd MMM yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Total: {tenantUsers.length} / {viewingTenantUsers?.max_users || 0} usuarios
            </p>
            <Button onClick={() => setIsViewUsersDialogOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Branches Dialog */}
      <Dialog open={isViewBranchesDialogOpen} onOpenChange={setIsViewBranchesDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Sucursales de {viewingBranches?.name}
            </DialogTitle>
            <DialogDescription>
              Listado de sucursales y sus estadísticas
            </DialogDescription>
          </DialogHeader>

          {loadingBranches ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-12">
              <Network className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No hay sucursales registradas</p>
              <p className="text-sm text-muted-foreground mt-2">
                Crea un nuevo tenant y selecciona "{viewingBranches?.name}" como Casa Matriz
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Usuarios</TableHead>
                    <TableHead>Propiedades</TableHead>
                    <TableHead>Contratos Activos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Network className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{branch.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{branch.total_users}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{branch.total_properties}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          {branch.total_active_contracts} activos
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Total: {branches.length} {branches.length === 1 ? 'sucursal' : 'sucursales'}
            </p>
            <Button onClick={() => setIsViewBranchesDialogOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
