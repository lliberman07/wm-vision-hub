-- Paso 0: Eliminar solicitudes de cambio que referencian los planes a eliminar
DELETE FROM subscription_change_requests 
WHERE current_plan_id IN ('f289bd8b-d371-43b8-a5ed-df05f44068a3', 'd8fcbd94-b370-46d3-99f6-91fb732b04aa')
   OR requested_plan_id IN ('f289bd8b-d371-43b8-a5ed-df05f44068a3', 'd8fcbd94-b370-46d3-99f6-91fb732b04aa');

-- Paso 1: Migrar suscripciones de Legacy a Enterprise
UPDATE tenant_subscriptions 
SET plan_id = '3793e3ab-67f7-4c66-9575-cae5fbf84aeb',
    updated_at = now()
WHERE plan_id = 'd8fcbd94-b370-46d3-99f6-91fb732b04aa';

-- Paso 2: Eliminar el plan "Plan Básico"
DELETE FROM subscription_plans 
WHERE id = 'f289bd8b-d371-43b8-a5ed-df05f44068a3';

-- Paso 3: Eliminar el plan "Legacy"
DELETE FROM subscription_plans 
WHERE id = 'd8fcbd94-b370-46d3-99f6-91fb732b04aa';