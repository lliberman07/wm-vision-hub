import { Shield, Building2, Briefcase, Home, User, Wrench } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type PMSRole = 'SUPERADMIN' | 'INMOBILIARIA' | 'GESTOR' | 'PROPIETARIO' | 'INQUILINO' | 'PROVEEDOR';

interface RoleConfig {
  icon: typeof Shield;
  label: string;
  description: string;
  color: string;
}

export const PMS_ROLE_CONFIG: Record<PMSRole, RoleConfig> = {
  SUPERADMIN: {
    icon: Shield,
    label: 'Superadmin',
    description: 'Administrador de la plataforma con acceso completo al sistema',
    color: 'bg-purple-500',
  },
  INMOBILIARIA: {
    icon: Building2,
    label: 'Inmobiliaria',
    description: 'Gestión completa de todas las propiedades, contratos e inquilinos dentro de su organización',
    color: 'bg-blue-500',
  },
  GESTOR: {
    icon: Briefcase,
    label: 'Gestor',
    description: 'Property manager independiente que administra propiedades de terceros (otros propietarios)',
    color: 'bg-indigo-500',
  },
  PROPIETARIO: {
    icon: Home,
    label: 'Propietario',
    description: 'Ve y administra sus propias propiedades, contratos e inquilinos',
    color: 'bg-green-500',
  },
  INQUILINO: {
    icon: User,
    label: 'Inquilino',
    description: 'Acceso a su contrato activo y pagos',
    color: 'bg-orange-500',
  },
  PROVEEDOR: {
    icon: Wrench,
    label: 'Proveedor',
    description: 'Proveedor de servicios',
    color: 'bg-gray-500',
  },
};

export function getRoleDisplayName(role: string): string {
  return PMS_ROLE_CONFIG[role as PMSRole]?.label || role;
}

export function getRoleIcon(role: string) {
  return PMS_ROLE_CONFIG[role as PMSRole]?.icon || User;
}

export function getRoleColor(role: string): string {
  return PMS_ROLE_CONFIG[role as PMSRole]?.color || 'bg-gray-500';
}

export function getRoleDescription(role: string): string {
  return PMS_ROLE_CONFIG[role as PMSRole]?.description || '';
}

interface RoleBadgeProps {
  role: string;
  className?: string;
}

export function RoleBadgeWithTooltip({ role, className }: RoleBadgeProps) {
  const Icon = getRoleIcon(role);
  const config = PMS_ROLE_CONFIG[role as PMSRole];

  if (!config) return <span className={className}>{role}</span>;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-white ${config.color} ${className || ''}`}>
            <Icon className="h-3.5 w-3.5" />
            {config.label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
