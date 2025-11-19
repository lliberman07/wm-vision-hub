-- FASE 4: Validar y crear foreign key constraint si no existe

-- Primero verificar si existe la constraint
DO $$ 
BEGIN
  -- Si no existe la constraint, crearla
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'subscription_requests_requested_plan_id_fkey'
    AND table_name = 'subscription_requests'
  ) THEN
    -- Agregar foreign key constraint
    ALTER TABLE subscription_requests
    ADD CONSTRAINT subscription_requests_requested_plan_id_fkey
    FOREIGN KEY (requested_plan_id) 
    REFERENCES subscription_plans(id)
    ON DELETE RESTRICT;
    
    RAISE NOTICE 'Foreign key constraint created';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists';
  END IF;
END $$;

-- Crear índice en requested_plan_id para mejorar performance de joins
CREATE INDEX IF NOT EXISTS idx_subscription_requests_requested_plan_id 
ON subscription_requests(requested_plan_id);

-- Índice adicional para queries por status y fecha
CREATE INDEX IF NOT EXISTS idx_subscription_requests_status_created 
ON subscription_requests(status, created_at DESC);