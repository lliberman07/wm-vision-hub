-- Restaurar la función generate_payment_schedule_items a la lógica correcta
-- Cada payment_method YA representa un propietario específico con su porcentaje
CREATE OR REPLACE FUNCTION public.generate_payment_schedule_items(contract_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  projection_rec RECORD;
  payment_method_rec RECORD;
  calculated_amount NUMERIC;
  contract_tenant_id UUID;
  contract_property_id UUID;
  owner_id_for_method UUID;
BEGIN
  -- Obtener tenant_id y property_id del contrato
  SELECT tenant_id, property_id 
  INTO contract_tenant_id, contract_property_id
  FROM pms_contracts
  WHERE id = contract_id_param;

  -- NO ELIMINAR schedule items que ya tienen pagos registrados
  DELETE FROM pms_payment_schedule_items
  WHERE contract_id = contract_id_param
    AND payment_id IS NULL;  -- Solo eliminar items sin pago

  -- Iterar sobre las proyecciones del contrato
  FOR projection_rec IN
    SELECT *
    FROM pms_contract_monthly_projections
    WHERE contract_id = contract_id_param
    ORDER BY period_date, item
  LOOP
    -- Para cada proyección, iterar sobre los payment methods de ese item específico
    FOR payment_method_rec IN
      SELECT pm.*
      FROM pms_contract_payment_methods pm
      WHERE pm.contract_id = contract_id_param
        AND pm.item = projection_rec.item
        AND pm.percentage > 0
      ORDER BY pm.created_at
    LOOP
      -- Calcular monto: proyección × porcentaje del payment method
      -- El porcentaje del payment method YA representa la distribución del propietario
      calculated_amount := projection_rec.adjusted_amount * (payment_method_rec.percentage / 100.0);

      -- Buscar owner_id del notes del payment method
      -- Extraer de "Propietario: NOMBRE"
      SELECT o.id INTO owner_id_for_method
      FROM pms_owners o
      JOIN pms_owner_properties op ON op.owner_id = o.id
      WHERE op.property_id = contract_property_id
        AND (op.end_date IS NULL OR op.end_date >= projection_rec.period_date)
        AND payment_method_rec.notes ILIKE '%' || o.full_name || '%'
      LIMIT 1;

      -- Si no encontramos owner por nombre, usar el primero disponible
      IF owner_id_for_method IS NULL THEN
        SELECT o.id INTO owner_id_for_method
        FROM pms_owner_properties op
        JOIN pms_owners o ON o.id = op.owner_id
        WHERE op.property_id = contract_property_id
          AND (op.end_date IS NULL OR op.end_date >= projection_rec.period_date)
        ORDER BY op.share_percent DESC
        LIMIT 1;
      END IF;

      -- Verificar si ya existe este schedule item
      IF NOT EXISTS (
        SELECT 1 FROM pms_payment_schedule_items
        WHERE contract_id = contract_id_param
          AND projection_id = projection_rec.id
          AND payment_method_id = payment_method_rec.id
      ) THEN
        -- Insertar registro en schedule items
        INSERT INTO pms_payment_schedule_items (
          contract_id,
          tenant_id,
          projection_id,
          owner_id,
          payment_method_id,
          period_date,
          item,
          owner_percentage,
          expected_amount,
          status
        ) VALUES (
          contract_id_param,
          contract_tenant_id,
          projection_rec.id,
          owner_id_for_method,
          payment_method_rec.id,
          projection_rec.period_date,
          projection_rec.item,
          payment_method_rec.percentage,
          ROUND(calculated_amount, 2),
          CASE 
            WHEN projection_rec.period_date < CURRENT_DATE THEN 'overdue'
            ELSE 'pending'
          END
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$function$;

-- Regenerar solo los schedule items faltantes (sin borrar los que tienen pagos)
SELECT generate_payment_schedule_items('c7986757-cf43-442e-88d0-1f12ef085de2'::UUID);