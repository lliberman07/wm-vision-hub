-- Crear tabla para logging de activaciones de contratos
CREATE TABLE IF NOT EXISTS pms_contract_activation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES pms_contracts(id) ON DELETE CASCADE NOT NULL,
  tenant_id uuid REFERENCES pms_tenants(id) NOT NULL,
  
  -- Contadores
  owners_notified integer DEFAULT 0,
  owners_created integer DEFAULT 0,
  tenant_notified boolean DEFAULT false,
  tenant_created boolean DEFAULT false,
  admin_notified boolean DEFAULT false,
  superadmin_notified boolean DEFAULT false,
  
  -- Detalles
  owner_emails jsonb,
  errors jsonb,
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE pms_contract_activation_logs ENABLE ROW LEVEL SECURITY;

-- Policy para que admins puedan ver logs
CREATE POLICY "Admins can view activation logs"
ON pms_contract_activation_logs
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) OR
  has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type) OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.tenant_id = pms_contract_activation_logs.tenant_id
      AND ur.module = 'PMS'
      AND ur.status = 'approved'
  )
);

-- Modificar función activate_contract para invocar edge function de notificaciones
CREATE OR REPLACE FUNCTION public.activate_contract(contract_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  contract_rec RECORD;
  owners_count INTEGER;
  payment_methods_total_a NUMERIC;
  payment_methods_total_b NUMERIC;
  has_item_b BOOLEAN;
  indices_count INTEGER;
BEGIN
  -- Obtener contrato
  SELECT * INTO contract_rec
  FROM pms_contracts
  WHERE id = contract_id_param
    AND status = 'draft';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato no encontrado o no está en borrador';
  END IF;

  -- Validación 1: Verificar que existan propietarios activos
  SELECT COUNT(*) INTO owners_count
  FROM pms_owner_properties
  WHERE property_id = contract_rec.property_id
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    AND share_percent > 0;

  IF owners_count = 0 THEN
    RAISE EXCEPTION 'La propiedad debe tener al menos un propietario activo asignado';
  END IF;

  -- Validación 2: Verificar que existan métodos de pago y sumen 100% POR ITEM
  SELECT COALESCE(SUM(percentage), 0) INTO payment_methods_total_a
  FROM pms_contract_payment_methods
  WHERE contract_id = contract_id_param
    AND item = 'A';

  IF payment_methods_total_a = 0 THEN
    RAISE EXCEPTION 'Debe configurar al menos un método de pago para el Item A';
  END IF;

  IF payment_methods_total_a != 100 THEN
    RAISE EXCEPTION 'Los métodos de pago del Item A deben sumar exactamente 100 por ciento (actualmente: % por ciento)', payment_methods_total_a;
  END IF;

  has_item_b := COALESCE(contract_rec.monto_b, 0) > 0;

  IF has_item_b THEN
    SELECT COALESCE(SUM(percentage), 0) INTO payment_methods_total_b
    FROM pms_contract_payment_methods
    WHERE contract_id = contract_id_param
      AND item = 'B';

    IF payment_methods_total_b = 0 THEN
      RAISE EXCEPTION 'Debe configurar al menos un método de pago para el Item B';
    END IF;

    IF payment_methods_total_b != 100 THEN
      RAISE EXCEPTION 'Los métodos de pago del Item B deben sumar exactamente 100 por ciento (actualmente: % por ciento)', payment_methods_total_b;
    END IF;
  END IF;

  -- Validación 3: Si tiene ajustes por índice, verificar que existan índices cargados
  IF contract_rec.indice_ajuste IS NOT NULL AND contract_rec.fecha_primer_ajuste IS NOT NULL THEN
    SELECT COUNT(*) INTO indices_count
    FROM pms_economic_indices
    WHERE index_type = contract_rec.indice_ajuste;

    IF indices_count = 0 THEN
      RAISE EXCEPTION 'No existen índices económicos cargados para el tipo: %', contract_rec.indice_ajuste;
    END IF;
  END IF;

  -- Validar que no exista otro contrato activo para la propiedad
  IF EXISTS (
    SELECT 1 FROM pms_contracts
    WHERE property_id = contract_rec.property_id
      AND status = 'active'
      AND id != contract_id_param
  ) THEN
    RAISE EXCEPTION 'Ya existe un contrato activo para esta propiedad';
  END IF;

  -- Activar contrato
  UPDATE pms_contracts
  SET status = 'active',
      updated_at = NOW()
  WHERE id = contract_id_param;

  -- Generar proyecciones mensuales
  PERFORM generate_contract_monthly_projections(contract_id_param);

  -- Generar items de calendario de pagos
  PERFORM generate_payment_schedule_items(contract_id_param);

  -- Actualizar estado de propiedad
  UPDATE pms_properties
  SET status = 'rented',
      updated_at = NOW()
  WHERE id = contract_rec.property_id
    AND status != 'maintenance';

  -- Invocar edge function para enviar notificaciones (async, no bloqueante)
  PERFORM net.http_post(
    url := 'https://jrzeabjpxkhccopxfwqa.supabase.co/functions/v1/send-contract-activation-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyemVhYmpweGtoY2NvcHhmd3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDI0NjksImV4cCI6MjA3MzI3ODQ2OX0.UUIntagLOquAdC6iURCVgqIyKcaHqvtABmh_NBtFD7Y'
    ),
    body := jsonb_build_object(
      'contract_id', contract_id_param
    )::text
  );
END;
$function$;