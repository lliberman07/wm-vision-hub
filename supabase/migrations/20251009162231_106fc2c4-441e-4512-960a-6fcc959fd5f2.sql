-- Asignar rol SUPERADMIN del PMS al usuario actual
-- IMPORTANTE: Esto es para el sistema PMS, NO para el admin del sitio web

INSERT INTO public.pms_user_roles (user_id, tenant_id, role, created_by)
VALUES (
  'b3d9c2f0-d0e6-445f-9a3c-a00ac16b8868',
  '8c5b46df-6090-4383-8995-a201ce7e5f9e',
  'SUPERADMIN',
  'b3d9c2f0-d0e6-445f-9a3c-a00ac16b8868'
)
ON CONFLICT DO NOTHING;