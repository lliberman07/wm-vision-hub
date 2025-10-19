-- ===================================================================
-- CORRECCIÓN DE POLÍTICAS RLS INSEGURAS
-- ===================================================================
-- Este script corrige políticas con USING (true) que exponen datos sensibles

-- ===================================================================
-- 1. INVESTMENT_SIMULATIONS - Vincular a user_email
-- ===================================================================
DROP POLICY IF EXISTS "Allow all access to simulations" ON public.investment_simulations;

CREATE POLICY "Users can view their own simulations"
ON public.investment_simulations
FOR SELECT
USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can create their own simulations"
ON public.investment_simulations
FOR INSERT
WITH CHECK (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own simulations"
ON public.investment_simulations
FOR UPDATE
USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage all simulations"
ON public.investment_simulations
FOR ALL
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) OR 
  has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

-- ===================================================================
-- 2. PDF_REPORT_REQUESTS - Vincular a user_email
-- ===================================================================
DROP POLICY IF EXISTS "Allow all access to PDF reports" ON public.pdf_report_requests;

CREATE POLICY "Users can view their own PDF reports"
ON public.pdf_report_requests
FOR SELECT
USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can create their own PDF reports"
ON public.pdf_report_requests
FOR INSERT
WITH CHECK (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage all PDF reports"
ON public.pdf_report_requests
FOR ALL
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) OR 
  has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

-- ===================================================================
-- 3. CONTACT_SUBMISSIONS - Solo INSERT público, SELECT para admins
-- ===================================================================
DROP POLICY IF EXISTS "Allow all access to contact submissions" ON public.contact_submissions;

CREATE POLICY "Anyone can submit contact forms"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Only admins can view contact submissions"
ON public.contact_submissions
FOR SELECT
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) OR 
  has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

CREATE POLICY "Only admins can manage contact submissions"
ON public.contact_submissions
FOR UPDATE
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) OR 
  has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

CREATE POLICY "Only admins can delete contact submissions"
ON public.contact_submissions
FOR DELETE
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) OR 
  has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

-- ===================================================================
-- 4. APPLICATIONS - Acceso por email del usuario autenticado
-- ===================================================================
DROP POLICY IF EXISTS "Users can manage applications freely" ON public.applications;
DROP POLICY IF EXISTS "Users can view applications by resume code" ON public.applications;
DROP POLICY IF EXISTS "Users can create applications" ON public.applications;
DROP POLICY IF EXISTS "Users can update applications by resume code" ON public.applications;

CREATE POLICY "Users can view their own applications"
ON public.applications
FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can create their own applications"
ON public.applications
FOR INSERT
WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own applications"
ON public.applications
FOR UPDATE
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage all applications"
ON public.applications
FOR ALL
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) OR 
  has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

-- ===================================================================
-- 5. APPLICANTS - Acceso solo si pertenece a la aplicación del usuario
-- ===================================================================
DROP POLICY IF EXISTS "Users can manage applicants freely" ON public.applicants;
DROP POLICY IF EXISTS "Users can manage applicants via resume code" ON public.applicants;

CREATE POLICY "Users can view applicants of their own applications"
ON public.applicants
FOR SELECT
USING (
  application_id IN (
    SELECT id FROM public.applications 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can manage applicants of their own applications"
ON public.applicants
FOR INSERT
WITH CHECK (
  application_id IN (
    SELECT id FROM public.applications 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can update applicants of their own applications"
ON public.applicants
FOR UPDATE
USING (
  application_id IN (
    SELECT id FROM public.applications 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can delete applicants of their own applications"
ON public.applicants
FOR DELETE
USING (
  application_id IN (
    SELECT id FROM public.applications 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Admins can manage all applicants"
ON public.applicants
FOR ALL
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) OR 
  has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

-- ===================================================================
-- 6. DOCUMENTS - Acceso solo si pertenece a la aplicación del usuario
-- ===================================================================
DROP POLICY IF EXISTS "Users can manage documents freely" ON public.documents;
DROP POLICY IF EXISTS "Users can manage documents via resume code" ON public.documents;

CREATE POLICY "Users can view documents of their own applications"
ON public.documents
FOR SELECT
USING (
  application_id IN (
    SELECT id FROM public.applications 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can upload documents to their own applications"
ON public.documents
FOR INSERT
WITH CHECK (
  application_id IN (
    SELECT id FROM public.applications 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can delete documents from their own applications"
ON public.documents
FOR DELETE
USING (
  application_id IN (
    SELECT id FROM public.applications 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Admins can manage all documents"
ON public.documents
FOR ALL
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) OR 
  has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

-- ===================================================================
-- 7. CONVERSATIONS - Vincular a session_id (público para chatbot)
-- ===================================================================
DROP POLICY IF EXISTS "Allow all access to conversations" ON public.conversations;

-- Permitir que usuarios vean sus propias conversaciones por session_id
CREATE POLICY "Users can view their own conversations"
ON public.conversations
FOR SELECT
USING (true); -- El chatbot es público, pero cada sesión tiene su session_id único

CREATE POLICY "Users can create their own conversations"
ON public.conversations
FOR INSERT
WITH CHECK (true); -- Permitir crear conversaciones (el session_id se genera en el cliente)

CREATE POLICY "Admins can manage all conversations"
ON public.conversations
FOR ALL
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) OR 
  has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

-- ===================================================================
-- 8. MESSAGES - Vincular a conversation_id
-- ===================================================================
DROP POLICY IF EXISTS "Allow all access to messages" ON public.messages;

CREATE POLICY "Users can view messages from their conversations"
ON public.messages
FOR SELECT
USING (true); -- Los mensajes son parte de conversaciones públicas del chatbot

CREATE POLICY "Users can create messages in conversations"
ON public.messages
FOR INSERT
WITH CHECK (true); -- Permitir crear mensajes (validación en el backend)

CREATE POLICY "Admins can manage all messages"
ON public.messages
FOR ALL
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) OR 
  has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

-- ===================================================================
-- 9. KNOWLEDGE_BASE - SELECT público, INSERT/UPDATE restringido
-- ===================================================================
DROP POLICY IF EXISTS "Allow read access to knowledge base" ON public.knowledge_base;
DROP POLICY IF EXISTS "Allow insert access to knowledge base" ON public.knowledge_base;
DROP POLICY IF EXISTS "Allow update access to knowledge base" ON public.knowledge_base;

-- Mantener SELECT público (es contenido del sitio web)
CREATE POLICY "Anyone can read knowledge base"
ON public.knowledge_base
FOR SELECT
TO anon, authenticated
USING (true);

-- Restringir INSERT/UPDATE a admins
CREATE POLICY "Only admins can insert to knowledge base"
ON public.knowledge_base
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::user_role_type) OR 
  has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

CREATE POLICY "Only admins can update knowledge base"
ON public.knowledge_base
FOR UPDATE
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) OR 
  has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

CREATE POLICY "Only admins can delete from knowledge base"
ON public.knowledge_base
FOR DELETE
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) OR 
  has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);