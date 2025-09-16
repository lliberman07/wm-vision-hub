-- Create conversations table to store chat sessions
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_email TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table to store individual chat messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create knowledge_base table to store website content for AI responses
CREATE TABLE public.knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_url TEXT NOT NULL,
  page_title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  section TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  indexed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations (allow all for now as it's a public chatbot)
CREATE POLICY "Allow all access to conversations" 
ON public.conversations 
FOR ALL 
USING (true);

-- Create policies for messages
CREATE POLICY "Allow all access to messages" 
ON public.messages 
FOR ALL 
USING (true);

-- Create policies for knowledge base (read-only for public)
CREATE POLICY "Allow read access to knowledge base" 
ON public.knowledge_base 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert access to knowledge base" 
ON public.knowledge_base 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update access to knowledge base" 
ON public.knowledge_base 
FOR UPDATE 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_conversations_session_id ON public.conversations(session_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_knowledge_base_language ON public.knowledge_base(language);
CREATE INDEX idx_knowledge_base_section ON public.knowledge_base(section);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at
BEFORE UPDATE ON public.knowledge_base
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();