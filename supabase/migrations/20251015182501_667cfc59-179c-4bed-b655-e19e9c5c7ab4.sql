-- Eliminar pagos duplicados que no están vinculados a schedule items
-- Estos son pagos que se registraron pero no tienen correspondencia en el calendario

-- Crear función para limpiar pagos huérfanos
CREATE OR REPLACE FUNCTION public.cleanup_orphan_payments()
RETURNS TABLE(deleted_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  orphan_count INTEGER;
BEGIN
  -- Contar cuántos pagos huérfanos hay
  SELECT COUNT(*) INTO orphan_count
  FROM pms_payments p
  WHERE p.status = 'paid'
    AND NOT EXISTS (
      SELECT 1 
      FROM pms_payment_schedule_items psi 
      WHERE psi.payment_id = p.id
    );
  
  RAISE NOTICE 'Encontrados % pagos huérfanos', orphan_count;
  
  -- Eliminar distribuciones de pagos huérfanos
  DELETE FROM pms_payment_distributions
  WHERE payment_id IN (
    SELECT p.id
    FROM pms_payments p
    WHERE p.status = 'paid'
      AND NOT EXISTS (
        SELECT 1 
        FROM pms_payment_schedule_items psi 
        WHERE psi.payment_id = p.id
      )
  );
  
  -- Eliminar pagos huérfanos
  DELETE FROM pms_payments
  WHERE id IN (
    SELECT p.id
    FROM pms_payments p
    WHERE p.status = 'paid'
      AND NOT EXISTS (
        SELECT 1 
        FROM pms_payment_schedule_items psi 
        WHERE psi.payment_id = p.id
      )
  );
  
  RAISE NOTICE 'Eliminados % pagos huérfanos', orphan_count;
  
  RETURN QUERY SELECT orphan_count;
END;
$function$;