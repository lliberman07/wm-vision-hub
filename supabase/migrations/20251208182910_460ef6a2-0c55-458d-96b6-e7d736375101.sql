-- Paso 1: Corregir tenant_id del tenant_renter para que coincida con el contrato
-- y limpiar el user_id incorrecto
UPDATE pms_tenants_renters 
SET 
  tenant_id = '8c5b46df-6090-4383-8995-a201ce7e5f9e', -- WM Property Management (donde está el contrato)
  user_id = NULL -- Limpiar referencia incorrecta a wminquilino@gmail.com
WHERE id = '0252ff13-834f-4a37-ae70-ac28fd69a349'; -- Dietetica Almendra

-- Paso 2: Crear rol INQUILINO en user_roles (se actualizará con user_id correcto después)
-- Nota: El user_id se establecerá cuando se cree el usuario via edge function