import { ChevronDown, Building2, Home, Users, Briefcase, Wrench, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PMSRoleContext {
  role: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
}

interface RoleTenantSelectorProps {
  allContexts: PMSRoleContext[];
  activeContext: PMSRoleContext;
  onSwitch: (context: PMSRoleContext) => void;
}

// Role descriptions and icons for better UX
const roleConfig: Record<string, { description: string; icon: typeof Building2 }> = {
  SUPERADMIN: { description: 'Acceso total', icon: Building2 },
  INMOBILIARIA: { description: 'Gestión completa', icon: Building2 },
  GESTOR: { description: 'Operaciones', icon: Briefcase },
  PROPIETARIO: { description: 'Administrar propiedades', icon: Home },
  INQUILINO: { description: 'Ver mi contrato', icon: UserCheck },
  PROVEEDOR: { description: 'Mantenimiento', icon: Wrench },
};

export function RoleTenantSelector({ 
  allContexts, 
  activeContext, 
  onSwitch 
}: RoleTenantSelectorProps) {
  // Detect if this is a GRANADA_SUPERADMIN (all contexts have SUPERADMIN role)
  const isGranadaSuperAdmin = allContexts.length > 1 && 
    allContexts.every(ctx => ctx.role === 'SUPERADMIN');

  // For GRANADA_SUPERADMIN: Show tenant-only selector
  if (isGranadaSuperAdmin) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Badge variant="destructive" className="font-mono text-[10px]">
              GRANADA
            </Badge>
            <span className="hidden sm:inline text-sm">
              {activeContext.tenant_name}
            </span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 bg-popover">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Cambiar Tenant (Vista Global)
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {allContexts.map((ctx) => {
            const isActive = ctx.tenant_id === activeContext.tenant_id;
            
            return (
              <DropdownMenuItem
                key={ctx.tenant_id}
                onClick={() => !isActive && onSwitch(ctx)}
                disabled={isActive}
                className="gap-2"
              >
                <span className="flex-1">{ctx.tenant_name}</span>
                {isActive && (
                  <span className="ml-auto text-xs">✓</span>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Check if user has multiple roles in the same tenant
  const hasMultipleRolesInSameTenant = allContexts.some((ctx, _, arr) => 
    arr.filter(c => c.tenant_id === ctx.tenant_id).length > 1
  );

  // Get current role config
  const currentRoleConfig = roleConfig[activeContext.role] || { description: '', icon: Users };
  const CurrentIcon = currentRoleConfig.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CurrentIcon className="h-3.5 w-3.5" />
          <Badge variant="secondary" className="font-mono text-[10px]">
            {activeContext.role}
          </Badge>
          {!hasMultipleRolesInSameTenant && (
            <span className="hidden sm:inline text-sm">
              {activeContext.tenant_name}
            </span>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 bg-popover">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Cambiar Contexto
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {allContexts.map((ctx) => {
          const isActive = 
            ctx.role === activeContext.role && 
            ctx.tenant_id === activeContext.tenant_id;
          const config = roleConfig[ctx.role] || { description: '', icon: Users };
          const Icon = config.icon;
          
          return (
            <DropdownMenuItem
              key={`${ctx.role}-${ctx.tenant_id}`}
              onClick={() => !isActive && onSwitch(ctx)}
              disabled={isActive}
              className={`flex items-center gap-3 py-2.5 ${isActive ? 'bg-accent' : ''}`}
            >
              <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={isActive ? "default" : "outline"} 
                    className="font-mono text-[10px]"
                  >
                    {ctx.role}
                  </Badge>
                  {isActive && (
                    <span className="text-xs text-primary">✓</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground truncate">
                  {ctx.tenant_name} • {config.description}
                </span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
