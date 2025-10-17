import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationManagement } from "@/components/ApplicationManagement";
import { FileText } from "lucide-react";

export function ApplicationsView() {
  return (
    <Card className="shadow-strong">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Financing Applications</span>
        </CardTitle>
        <CardDescription>
          Manage individual and business financing applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ApplicationManagement />
      </CardContent>
    </Card>
  );
}
