-- Parte 1: Solo agregar el nuevo valor 'gestor' al enum
ALTER TYPE pms_tenant_type ADD VALUE IF NOT EXISTS 'gestor';