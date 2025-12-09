
-- Insertar el registro faltante de INQUILINO para el contrato PRIMA1204
INSERT INTO pms_client_users (
  user_id,
  tenant_id,
  contract_id,
  email,
  first_name,
  last_name,
  phone,
  cuit_cuil,
  user_type,
  is_active
)
SELECT 
  tr.user_id,
  c.tenant_id,
  c.id as contract_id,
  tr.email,
  tr.first_name,
  tr.last_name,
  tr.mobile_phone,
  tr.document_number,
  'INQUILINO'::pms_client_user_type,
  true
FROM pms_contracts c
JOIN pms_tenants_renters tr ON tr.id = c.tenant_renter_id
WHERE c.id = '564c4d46-7787-4cc3-b111-0abd0d86a73f'
  AND tr.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM pms_client_users cu 
    WHERE cu.user_id = tr.user_id 
      AND cu.contract_id = c.id 
      AND cu.user_type = 'INQUILINO'
  );
