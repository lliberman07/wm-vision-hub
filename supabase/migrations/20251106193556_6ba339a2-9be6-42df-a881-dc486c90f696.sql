-- Parte 1: Agregar GESTOR a los enums
ALTER TYPE user_role_type ADD VALUE IF NOT EXISTS 'GESTOR';
ALTER TYPE pms_app_role ADD VALUE IF NOT EXISTS 'GESTOR';