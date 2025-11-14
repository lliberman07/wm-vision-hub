import { ChevronDown } from 'lucide-react';
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

        <DropdownMenuContent align="end" className="w-64">
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

  // Regular users: Group by tenant for better UX
  const contextsByTenant = allContexts.reduce((acc, ctx) => {
    if (!acc[ctx.tenant_name]) {
      acc[ctx.tenant_name] = [];
    }
    acc[ctx.tenant_name].push(ctx);
    return acc;
  }, {} as Record<string, PMSRoleContext[]>);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Badge variant="secondary" className="font-mono text-[10px]">
            {activeContext.role}
          </Badge>
          <span className="hidden sm:inline text-sm">
            {activeContext.tenant_name}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Cambiar Contexto
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {Object.entries(contextsByTenant).map(([tenantName, contexts], idx) => (
          <div key={tenantName}>
            {idx > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              {tenantName}
            </DropdownMenuLabel>
            {contexts.map((ctx) => {
              const isActive = 
                ctx.role === activeContext.role && 
                ctx.tenant_id === activeContext.tenant_id;
              
              return (
                <DropdownMenuItem
                  key={`${ctx.role}-${ctx.tenant_id}`}
                  onClick={() => !isActive && onSwitch(ctx)}
                  disabled={isActive}
                  className="gap-2"
                >
                  <Badge 
                    variant={isActive ? "default" : "outline"} 
                    className="font-mono text-[10px]"
                  >
                    {ctx.role}
                  </Badge>
                  {isActive && (
                    <span className="ml-auto text-xs">✓</span>
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
