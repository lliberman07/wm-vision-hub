import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  pendingCount?: number;
  gradient?: string;
}

export function ModuleCard({
  title,
  description,
  icon: Icon,
  onClick,
  pendingCount,
  gradient = 'from-primary/10 to-primary/20',
}: ModuleCardProps) {
  return (
    <Card
      className="card-elevated group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-lg bg-gradient-to-br ${gradient} group-hover:scale-110 transition-transform`}>
            <Icon className="h-6 w-6 text-primary" />
          </div>
          {pendingCount !== undefined && pendingCount > 0 && (
            <Badge variant="secondary" className="animate-pulse">
              {pendingCount}
            </Badge>
          )}
        </div>
        <div className="space-y-1 mt-4">
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Button
          variant="ghost"
          className="w-full justify-between group/btn hover:bg-primary/5"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Ver todo
          <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}
