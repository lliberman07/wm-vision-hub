-- Fix existing tenant with active subscription but is_active = false
UPDATE pms_tenants 
SET is_active = true 
WHERE id = '4757c0f3-f4b5-4a2c-9875-611c5429986e';