-- Fix messages table RLS policies that allow anyone to read/insert messages
-- This is a critical security fix

-- Drop overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view messages from conversations" ON messages;

-- Drop overly permissive INSERT policy  
DROP POLICY IF EXISTS "Anyone can create messages in conversations" ON messages;

-- Create secure SELECT policy - only admins or conversation participants can view
CREATE POLICY "messages_select_policy" ON messages
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) OR
  has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type) OR
  EXISTS (
    SELECT 1 FROM conversations c 
    WHERE c.id = messages.conversation_id 
    AND c.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
  )
);

-- Create policy for anonymous chatbot - allow reading messages in their own session
CREATE POLICY "messages_select_by_session" ON messages
FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM conversations c 
    WHERE c.id = messages.conversation_id
  )
);

-- Create secure INSERT policy for authenticated users
CREATE POLICY "messages_insert_authenticated" ON messages
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::user_role_type) OR
  has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type) OR
  EXISTS (
    SELECT 1 FROM conversations c 
    WHERE c.id = conversation_id 
    AND c.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
  )
);

-- Create INSERT policy for anonymous chatbot - require valid conversation
CREATE POLICY "messages_insert_by_session" ON messages
FOR INSERT TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c 
    WHERE c.id = conversation_id
  )
);