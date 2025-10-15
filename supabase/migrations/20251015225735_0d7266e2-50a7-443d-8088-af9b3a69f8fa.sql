-- Limpiar todos los datos de PMS manteniendo solo índices económicos
-- Orden respetando foreign keys: de más dependientes a menos

-- 1. Eliminar submissions de pagos
DELETE FROM pms_payment_submissions;

-- 2. Eliminar distribuciones de pagos
DELETE FROM pms_payment_distributions;

-- 3. Eliminar items del calendario de pagos
DELETE FROM pms_payment_schedule_items;

-- 4. Eliminar flujo de caja
DELETE FROM pms_cashflow_property;

-- 5. Eliminar proyecciones mensuales de contratos
DELETE FROM pms_contract_monthly_projections;

-- 6. Eliminar ajustes de contratos
DELETE FROM pms_contract_adjustments;

-- 7. Eliminar métodos de pago de contratos
DELETE FROM pms_contract_payment_methods;

-- 8. Eliminar gastos
DELETE FROM pms_expenses;

-- 9. Eliminar solicitudes de mantenimiento
DELETE FROM pms_maintenance_requests;

-- 10. Eliminar pagos
DELETE FROM pms_payments;

-- 11. Eliminar contratos
DELETE FROM pms_contracts;

-- 12. Eliminar relaciones propietario-propiedad
DELETE FROM pms_owner_properties;

-- 13. Eliminar propiedades
DELETE FROM pms_properties;

-- 14. Eliminar propietarios
DELETE FROM pms_owners;

-- 15. Eliminar inquilinos/arrendatarios
DELETE FROM pms_tenants_renters;

-- 16. Eliminar documentos
DELETE FROM pms_documents;

-- 17. Eliminar solicitudes de acceso PMS pendientes
DELETE FROM pms_access_requests;

-- NO SE ELIMINAN:
-- - pms_economic_indices (según solicitud del usuario)
-- - pms_tenants (mantener tenant principal)
-- - user_roles (mantener permisos de usuarios)
-- - users (mantener usuarios del sistema)