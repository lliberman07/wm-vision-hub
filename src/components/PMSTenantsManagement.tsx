import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Building, Edit, Check, X } from "lucide-react";
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
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    is_active: true,
    tenant_type: "inmobiliaria" as TenantType,
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
        .from("pms_tenants")
        .select("*")
        .order("created_at", { ascending: false });

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
        const { error } = await supabase
          .from("pms_tenants")
          .update({
            name: formData.name,
            slug: formData.slug,
            is_active: formData.is_active,
            tenant_type: formData.tenant_type,
          })
          .eq("id", editingTenant.id);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Tenant actualizado correctamente",
        });
      } else {
        const { error } = await supabase
          .from("pms_tenants")
          .insert([{
            name: formData.name,
            slug: formData.slug,
            is_active: formData.is_active,
            tenant_type: formData.tenant_type,
            settings: {},
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
    });
    setEditingTenant(null);
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      is_active: tenant.is_active,
      tenant_type: tenant.tenant_type,
    });
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(tenant)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
