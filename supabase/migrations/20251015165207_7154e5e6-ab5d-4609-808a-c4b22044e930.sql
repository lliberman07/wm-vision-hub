-- Actualizar generate_payment_schedule_items para crear ajustes diferenciales
CREATE OR REPLACE FUNCTION public.generate_payment_schedule_items(contract_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  projection_rec RECORD;
  owner_rec RECORD;
  payment_method_rec RECORD;
  calculated_amount NUMERIC;
  item_status TEXT;
  existing_item RECORD;
  difference NUMERIC;
BEGIN
  -- NO limpiar items existentes - preservar los que tienen pagos
  
  -- Iterar sobre todas las proyecciones del contrato
  FOR projection_rec IN
    SELECT * FROM pms_contract_monthly_projections
    WHERE contract_id = contract_id_param
    ORDER BY period_date, item
  LOOP
    -- Para cada proyección, crear/actualizar un item por cada PROPIETARIO
    FOR owner_rec IN
      SELECT op.owner_id, op.share_percent, o.id as owner_id
      FROM pms_owner_properties op
      LEFT JOIN pms_owners o ON o.id = op.owner_id
      WHERE op.property_id = (
        SELECT property_id FROM pms_contracts WHERE id = contract_id_param
      )
      AND (op.end_date IS NULL OR op.end_date >= projection_rec.period_date)
      AND op.share_percent > 0
    LOOP
      -- Buscar el primer método de pago disponible para este item
      SELECT * INTO payment_method_rec
      FROM pms_contract_payment_methods
      WHERE contract_id = contract_id_param
        AND item = projection_rec.item
      LIMIT 1;

      -- Si no hay método de pago configurado, saltar
      IF NOT FOUND THEN
        CONTINUE;
      END IF;

      -- Calcular monto esperado: monto_ajustado × porcentaje del propietario
      calculated_amount := projection_rec.adjusted_amount * (owner_rec.share_percent / 100);

      -- Determinar estado inicial
      IF projection_rec.period_date < CURRENT_DATE THEN
        item_status := 'overdue';
      ELSE
        item_status := 'pending';
      END IF;

      -- Verificar si ya existe un item para este período/propietario/item
      SELECT * INTO existing_item
      FROM pms_payment_schedule_items
      WHERE contract_id = contract_id_param
        AND period_date = projection_rec.period_date
        AND owner_id = owner_rec.owner_id
        AND item = projection_rec.item;

      IF FOUND THEN
        -- Item existe: actualizar SOLO si no tiene pago asociado
        IF existing_item.payment_id IS NULL THEN
          -- No tiene pago: actualizar todo
          UPDATE pms_payment_schedule_items
          SET projection_id = projection_rec.id,
              payment_method_id = payment_method_rec.id,
              owner_percentage = owner_rec.share_percent,
              expected_amount = calculated_amount,
              status = item_status,
              updated_at = NOW()
          WHERE id = existing_item.id;
        ELSE
          -- Ya tiene pago: NO tocar el registro original
          -- Solo actualizar la referencia a la nueva proyección
          UPDATE pms_payment_schedule_items
          SET projection_id = projection_rec.id,
              updated_at = NOW()
          WHERE id = existing_item.id;
          
          -- Calcular diferencia entre nuevo monto esperado y monto ya pagado
          difference := calculated_amount - existing_item.expected_amount;
          
          -- Si hay diferencia positiva, crear item de ajuste complementario
          IF difference > 0 THEN
            -- Verificar que no exista ya un item de ajuste para este período
            IF NOT EXISTS (
              SELECT 1 FROM pms_payment_schedule_items
              WHERE contract_id = contract_id_param
                AND period_date = projection_rec.period_date
                AND owner_id = owner_rec.owner_id
                AND item = projection_rec.item || '-AJUSTE'
            ) THEN
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
                projection_rec.tenant_id,
                projection_rec.id,
                owner_rec.owner_id,
                payment_method_rec.id,
                projection_rec.period_date,
                projection_rec.item || '-AJUSTE',
                owner_rec.share_percent,
                difference,
                item_status
              );
            ELSE
              -- Si ya existe, actualizar el monto del ajuste
              UPDATE pms_payment_schedule_items
              SET expected_amount = difference,
                  projection_id = projection_rec.id,
                  status = item_status,
                  updated_at = NOW()
              WHERE contract_id = contract_id_param
                AND period_date = projection_rec.period_date
                AND owner_id = owner_rec.owner_id
                AND item = projection_rec.item || '-AJUSTE'
                AND payment_id IS NULL; -- Solo si no ha sido pagado
            END IF;
          END IF;
        END IF;
      ELSE
        -- Item NO existe: crearlo
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
          projection_rec.tenant_id,
          projection_rec.id,
          owner_rec.owner_id,
          payment_method_rec.id,
          projection_rec.period_date,
          projection_rec.item,
          owner_rec.share_percent,
          calculated_amount,
          item_status
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$function$;