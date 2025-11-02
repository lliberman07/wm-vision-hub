-- Corregir generate_payment_schedule_items vinculando correctamente con propietarios
CREATE OR REPLACE FUNCTION public.generate_payment_schedule_items(contract_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  projection_rec RECORD;
  payment_method_rec RECORD;
  owner_rec RECORD;
  calculated_amount NUMERIC;
  contract_tenant_id UUID;
  contract_property_id UUID;
BEGIN
  -- Obtener tenant_id y property_id del contrato
  SELECT tenant_id, property_id 
  INTO contract_tenant_id, contract_property_id
  FROM pms_contracts
  WHERE id = contract_id_param;

  -- Eliminar schedule items existentes del contrato
  DELETE FROM pms_payment_schedule_items
  WHERE contract_id = contract_id_param;

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
      -- Obtener el propietario asociado a este payment method
      -- Buscamos en payment_method.destination_account o notes si contiene el nombre del propietario
      -- O simplemente tomamos los propietarios activos de la propiedad proporcionalmente
      
      FOR owner_rec IN
        SELECT o.id as owner_id, op.share_percent
        FROM pms_owner_properties op
        JOIN pms_owners o ON o.id = op.owner_id
        WHERE op.property_id = contract_property_id
          AND (op.end_date IS NULL OR op.end_date >= projection_rec.period_date)
        ORDER BY op.created_at
      LOOP
        -- Calcular monto: proyección × porcentaje del payment method × porcentaje del propietario
        calculated_amount := projection_rec.adjusted_amount * 
                           (payment_method_rec.percentage / 100.0) * 
                           (owner_rec.share_percent / 100.0);

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
          owner_rec.owner_id,
          payment_method_rec.id,
          projection_rec.period_date,
          projection_rec.item,
          owner_rec.share_percent,
          ROUND(calculated_amount, 2),
          CASE 
            WHEN projection_rec.period_date < CURRENT_DATE THEN 'overdue'
            ELSE 'pending'
          END
        );
      END LOOP; -- end owner loop
    END LOOP; -- end payment method loop
  END LOOP; -- end projection loop
END;
$function$;

-- Limpiar registros incorrectos del contrato PRIMA4302
DELETE FROM pms_payment_schedule_items
WHERE contract_id = 'c7986757-cf43-442e-88d0-1f12ef085de2';

-- Regenerar calendario con la lógica corregida
SELECT generate_payment_schedule_items('c7986757-cf43-442e-88d0-1f12ef085de2'::UUID);