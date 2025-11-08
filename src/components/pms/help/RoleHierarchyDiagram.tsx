import { PMSRole } from '@/data/pmsRolesData';
import { getRoleColor } from '@/lib/pmsRoleHelpers';
import { Card } from '@/components/ui/card';

interface RoleHierarchyDiagramProps {
  currentRole?: PMSRole;
}

interface HierarchyNode {
  role: PMSRole;
  label: string;
  children?: HierarchyNode[];
  note?: string;
}

const hierarchy: HierarchyNode = {
  role: 'SUPERADMIN',
  label: 'SUPERADMIN',
  children: [
    {
      role: 'INMOBILIARIA',
      label: 'INMOBILIARIA',
      children: [
        { role: 'PROPIETARIO', label: 'PROPIETARIO' },
        { role: 'INQUILINO', label: 'INQUILINO' }
      ]
    },
    {
      role: 'ADMINISTRADOR',
      label: 'ADMINISTRADOR',
      note: '← INDEPENDIENTE',
      children: [
        { role: 'PROPIETARIO', label: 'PROPIETARIO (Gestionadas)' },
        { role: 'INQUILINO', label: 'INQUILINO' }
      ]
    },
    {
      role: 'PROPIETARIO',
      label: 'PROPIETARIO Independiente',
      children: [
        { role: 'INQUILINO', label: 'INQUILINO' }
      ]
    }
  ]
};

function RoleNode({ node, currentRole, level = 0 }: { node: HierarchyNode; currentRole?: PMSRole; level?: number }) {
  const isCurrent = node.role === currentRole;
  const colorClass = getRoleColor(node.role);

  return (
    <div className="flex flex-col items-center">
      <div className={`
        px-4 py-2 rounded-lg border-2 transition-all
        ${isCurrent ? 'ring-2 ring-primary border-primary bg-primary/10' : 'border-border'}
      `}>
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${colorClass}`}>{node.label}</span>
          {node.note && (
            <span className="text-xs text-muted-foreground font-normal">{node.note}</span>
          )}
        </div>
      </div>

      {node.children && node.children.length > 0 && (
        <div className="flex flex-col items-center mt-4">
          <div className="w-0.5 h-8 bg-border" />
          <div className="flex gap-8">
            {node.children.map((child, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="w-0.5 h-8 bg-border" />
                <RoleNode node={child} currentRole={currentRole} level={level + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function RoleHierarchyDiagram({ currentRole }: RoleHierarchyDiagramProps) {
  return (
    <Card className="p-8 overflow-x-auto">
      <div className="min-w-[800px]">
        <h3 className="text-lg font-semibold mb-6 text-center">Jerarquía del Sistema PMS</h3>
        <div className="flex justify-center">
          <RoleNode node={hierarchy} currentRole={currentRole} />
        </div>
        <div className="mt-8 text-sm text-muted-foreground text-center">
          <p>Los roles están organizados por tenant type. ADMINISTRADOR e INMOBILIARIA son tenants independientes.</p>
        </div>
      </div>
    </Card>
  );
}
