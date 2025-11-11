-- Permitir NULL en frecuencia_ajuste cuando no hay índice de ajuste configurado
ALTER TABLE pms_contracts
  DROP CONSTRAINT IF EXISTS check_frecuencia_ajuste;

ALTER TABLE pms_contracts
  ADD CONSTRAINT check_frecuencia_ajuste
    CHECK (
      frecuencia_ajuste IS NULL 
      OR frecuencia_ajuste IN ('Mensual', 'Trimestral', 'Semestral', 'Anual')
    );

-- Comentario para documentación
COMMENT ON CONSTRAINT check_frecuencia_ajuste ON pms_contracts IS 
  'Permite NULL cuando indice_ajuste es "none" o NULL. Valores permitidos: Mensual, Trimestral, Semestral, Anual';