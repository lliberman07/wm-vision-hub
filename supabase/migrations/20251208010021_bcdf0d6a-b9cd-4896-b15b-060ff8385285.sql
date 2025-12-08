
-- Make payment_method_id nullable to support simplified payment mode
ALTER TABLE pms_payment_schedule_items 
  ALTER COLUMN payment_method_id DROP NOT NULL;

-- Regenerar el calendario para el contrato PRIMA1204 que no se generó correctamente
DO $$
DECLARE
  v_contract_id UUID;
BEGIN
  SELECT id INTO v_contract_id
  FROM pms_contracts
  WHERE contract_number = 'PRIMA1204'
    AND status = 'active';
  
  IF v_contract_id IS NOT NULL THEN
    PERFORM generate_payment_schedule_items(v_contract_id);
    RAISE NOTICE 'Payment schedule regenerated for contract PRIMA1204';
  END IF;
END $$;
