import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function ContractsOdoo() {
  return (
    <div className="container max-w-4xl py-12">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-3xl">Contratos de Alquiler</CardTitle>
              <CardDescription>Gestiona los contratos de alquiler en Odoo</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-24 w-24 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Próximamente</h3>
            <p className="text-muted-foreground max-w-md">
              La funcionalidad de gestión de contratos de alquiler estará disponible próximamente.
              Podrás crear, editar y gestionar contratos directamente desde aquí.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
