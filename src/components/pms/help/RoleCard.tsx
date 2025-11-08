import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RoleData } from '@/data/pmsRolesData';
import { getRoleIcon, getRoleColor } from '@/lib/pmsRoleHelpers';

interface RoleCardProps {
  roleData: RoleData;
  isCurrentRole?: boolean;
  defaultExpanded?: boolean;
}

export function RoleCard({ roleData, isCurrentRole = false, defaultExpanded = false }: RoleCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const Icon = getRoleIcon(roleData.role);
  const colorClass = getRoleColor(roleData.role);

  return (
    <Card className={`transition-all ${isCurrentRole ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
              <Icon className={`h-5 w-5 ${colorClass}`} />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {roleData.role}
                {isCurrentRole && (
                  <Badge variant="default" className="text-xs">
                    Tu Rol Actual
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                {roleData.level} • Tenant: {roleData.tenantType}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{roleData.description}</p>

        {expanded && (
          <>
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Permisos y Capacidades</h4>
                <ul className="space-y-1">
                  {roleData.permissions.map((permission, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                      <span>{permission}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Casos de Uso</h4>
                <ul className="space-y-1">
                  {roleData.useCases.map((useCase, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400">•</span>
                      <span>{useCase}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {roleData.limitations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Limitaciones</h4>
                  <ul className="space-y-1">
                    {roleData.limitations.map((limitation, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-red-600 dark:text-red-400 mt-0.5">✗</span>
                        <span>{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
