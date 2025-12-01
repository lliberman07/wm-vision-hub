-- Reactivar usuario clientadmin@test.com en Empresa de Prueba
UPDATE pms_client_users 
SET is_active = true, 
    deactivated_at = null, 
    deactivated_by = null 
WHERE id = 'd96f47d3-4041-4bc8-8d5e-9d0b71f17852';