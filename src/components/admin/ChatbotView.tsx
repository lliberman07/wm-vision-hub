import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KnowledgeBaseInit } from "@/components/KnowledgeBaseInit";
import { MessageSquare } from "lucide-react";

export function ChatbotView() {
  return (
    <Card className="shadow-strong">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>AI Chatbot Management</span>
        </CardTitle>
        <CardDescription>
          Initialize and manage the AI chatbot knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-8">
        <KnowledgeBaseInit />
      </CardContent>
    </Card>
  );
}
