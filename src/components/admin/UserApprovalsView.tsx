import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import UserApprovals from "@/components/UserApprovals";
import { Users } from "lucide-react";

export function UserApprovalsView() {
  return (
    <Card className="shadow-strong">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>User Approvals</span>
        </CardTitle>
        <CardDescription>
          Approve or deny user access requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UserApprovals />
      </CardContent>
    </Card>
  );
}
