-- PARTE 1: Agregar columnas user_id
ALTER TABLE investment_simulations 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_investment_simulations_user_id ON investment_simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);

-- PARTE 2: Migrar datos existentes (poblar user_id)
UPDATE investment_simulations 
SET user_id = auth.users.id
FROM auth.users
WHERE investment_simulations.user_email = auth.users.email
  AND investment_simulations.user_id IS NULL;

UPDATE applications 
SET user_id = auth.users.id
FROM auth.users
WHERE applications.email = auth.users.email
  AND applications.user_id IS NULL;

-- PARTE 3: Eliminar políticas RLS antiguas
DROP POLICY IF EXISTS "Users can view their own simulations" ON investment_simulations;
DROP POLICY IF EXISTS "Users can update their own simulations" ON investment_simulations;
DROP POLICY IF EXISTS "Users can create simulations" ON investment_simulations;
DROP POLICY IF EXISTS "Admins can manage all simulations" ON investment_simulations;

DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON applications;
DROP POLICY IF EXISTS "Admins can manage all applications" ON applications;

-- PARTE 4: Crear nuevas políticas RLS simplificadas

-- ============================================
-- INVESTMENT_SIMULATIONS - Nuevas políticas
-- ============================================

CREATE POLICY "investment_simulations_select_policy" 
ON investment_simulations FOR SELECT
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) 
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
  OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "investment_simulations_insert_policy" 
ON investment_simulations FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
  OR (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "investment_simulations_update_policy" 
ON investment_simulations FOR UPDATE
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) 
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
  OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

CREATE POLICY "investment_simulations_delete_policy" 
ON investment_simulations FOR DELETE
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) 
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

-- ============================================
-- APPLICATIONS - Nuevas políticas
-- ============================================

CREATE POLICY "applications_select_policy" 
ON applications FOR SELECT
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) 
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
  OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "applications_insert_policy" 
ON applications FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
  OR (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "applications_update_policy" 
ON applications FOR UPDATE
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) 
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
  OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

CREATE POLICY "applications_delete_policy" 
ON applications FOR DELETE
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) 
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);