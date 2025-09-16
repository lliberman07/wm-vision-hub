import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const KnowledgeBaseInit: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [entriesCount, setEntriesCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkKnowledgeBaseStatus();
  }, []);

  const checkKnowledgeBaseStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('id', { count: 'exact' });

      if (error) throw error;

      const count = data?.length || 0;
      setEntriesCount(count);
      setIsInitialized(count > 0);
    } catch (error) {
      console.error('Error checking knowledge base:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const initializeKnowledgeBase = async () => {
    setIsInitializing(true);
    setError(null);

    try {
      console.log('Initializing knowledge base...');
      
      const { data, error } = await supabase.functions.invoke('scrape-website-content', {
        body: {}
      });

      if (error) throw error;

      console.log('Knowledge base initialization response:', data);

      toast({
        title: "Éxito / Success",
        description: `Knowledge base initialized with ${data.entriesIndexed} entries`,
      });

      await checkKnowledgeBaseStatus();
    } catch (error) {
      console.error('Error initializing knowledge base:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      
      toast({
        title: "Error",
        description: "Failed to initialize knowledge base",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Knowledge Base</CardTitle>
        </div>
        <CardDescription>
          Initialize the AI chatbot knowledge base with website content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge 
            variant={isInitialized ? "default" : "secondary"}
            className="flex items-center space-x-1"
          >
            {isInitialized ? (
              <>
                <CheckCircle className="w-3 h-3" />
                <span>Initialized</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" />
                <span>Not Initialized</span>
              </>
            )}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Entries:</span>
          <Badge variant="outline">{entriesCount}</Badge>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded border">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Button
            onClick={initializeKnowledgeBase}
            disabled={isInitializing}
            className="w-full"
            variant={isInitialized ? "outline" : "default"}
          >
            {isInitializing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                {isInitialized ? 'Reinitialize' : 'Initialize'} Knowledge Base
              </>
            )}
          </Button>

          {isInitialized && (
            <p className="text-xs text-muted-foreground text-center">
              The chatbot is ready to answer questions about WM Management services
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};