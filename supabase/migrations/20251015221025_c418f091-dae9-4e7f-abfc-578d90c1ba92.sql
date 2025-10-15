-- Función para limpiar todos los movimientos de pago de un contrato
CREATE OR REPLACE FUNCTION public.clear_contract_payments(contract_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  contract_rec RECORD;
BEGIN
  -- Obtener información del contrato
  SELECT * INTO contract_rec
  FROM pms_contracts
  WHERE id = contract_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato no encontrado';
  END IF;

  -- 1. Eliminar distribuciones de pagos
  DELETE FROM pms_payment_distributions
  WHERE contract_id = contract_id_param;

  -- 2. Eliminar submissions de pagos
  DELETE FROM pms_payment_submissions
  WHERE contract_id = contract_id_param;

  -- 3. Eliminar items del calendario de pagos
  DELETE FROM pms_payment_schedule_items
  WHERE contract_id = contract_id_param;

  -- 4. Eliminar pagos
  DELETE FROM pms_payments
  WHERE contract_id = contract_id_param;

  -- 5. Eliminar proyecciones mensuales
  DELETE FROM pms_contract_monthly_projections
  WHERE contract_id = contract_id_param;

  -- 6. Limpiar cashflow relacionado
  DELETE FROM pms_cashflow_property
  WHERE contract_id = contract_id_param;

  RAISE NOTICE 'Todos los movimientos de pago del contrato % han sido eliminados', contract_id_param;
END;
$function$;