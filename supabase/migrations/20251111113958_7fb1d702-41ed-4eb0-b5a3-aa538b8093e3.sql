-- Agregar INQUILINO al enum user_role_type
-- Nota: Esta operación no se puede ejecutar dentro de una transacción
ALTER TYPE public.user_role_type ADD VALUE IF NOT EXISTS 'INQUILINO';