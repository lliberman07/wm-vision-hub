import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { RoleData } from '@/data/pmsRolesData';
import { Badge } from '@/components/ui/badge';

interface InteractiveExamplesProps {
  roleData: RoleData;
}

export function InteractiveExamples({ roleData }: InteractiveExamplesProps) {
  if (!roleData.examples || roleData.examples.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hay ejemplos disponibles para este rol.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {roleData.examples.map((example, idx) => (
        <Card key={idx} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">{example.title}</CardTitle>
            <CardDescription>{example.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Pasos a seguir:</h4>
                <ol className="space-y-2">
                  {example.steps.map((step, stepIdx) => (
                    <li key={stepIdx} className="text-sm text-muted-foreground flex gap-2">
                      <Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center shrink-0">
                        {stepIdx + 1}
                      </Badge>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {example.moduleLinks && example.moduleLinks.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {example.moduleLinks.map((link, linkIdx) => (
                    <Button
                      key={linkIdx}
                      variant="secondary"
                      size="sm"
                      asChild
                    >
                      <Link to={link} className="flex items-center gap-2">
                        Ir al módulo
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
