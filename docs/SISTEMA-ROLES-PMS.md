# Sistema de Roles PMS - Documentación

## Descripción General

El sistema PMS (Property Management System) utiliza un sistema de roles jerárquico para gestionar permisos y accesos. Cada rol tiene responsabilidades y capacidades específicas dentro del sistema.

---

## Roles Disponibles

### 1. SUPERADMIN

**Nivel:** Sistema completo  
**Tenant Type:** `sistema`

#### Descripción
El SUPERADMIN es el administrador de más alto nivel con acceso total al sistema. Gestiona todos los tenants, usuarios y configuraciones globales.

#### Permisos y Capacidades
- ✅ Acceso a **todos los tenants** del sistema
- ✅ Crear, editar y eliminar **cualquier tenant** (inmobiliarias, propietarios, etc.)
- ✅ Gestionar **todos los usuarios** del sistema
- ✅ Aprobar o denegar solicitudes de acceso al PMS
- ✅ Asignar y revocar roles a cualquier usuario
- ✅ Ver y gestionar **todas las propiedades, contratos y pagos**
- ✅ Acceso al panel de administración global
- ✅ Configurar índices económicos (IPC, ICL, UVA)
- ✅ Ejecutar operaciones de mantenimiento del sistema
- ✅ Ver logs y auditorías de todo el sistema
- ✅ Exportar reportes consolidados de todo el sistema

#### Casos de Uso
- Administración general del sistema
- Soporte técnico de primer nivel
- Configuración de parámetros globales
- Resolución de conflictos entre tenants
- Auditoría y reportes ejecutivos

#### Limitaciones
- Ninguna (acceso total)

---

### 2. INMOBILIARIA

**Nivel:** Tenant (Inmobiliaria)  
**Tenant Type:** `inmobiliaria`

#### Descripción
El rol INMOBILIARIA representa a una agencia inmobiliaria que gestiona propiedades de múltiples propietarios. Es el administrador principal de su tenant.

#### Permisos y Capacidades
- ✅ Acceso completo a **su tenant y sucursales**
- ✅ Gestionar usuarios de su tenant (ADMINISTRADOR, PROPIETARIO, INQUILINO)
- ✅ Crear y gestionar **propiedades**
- ✅ Crear y gestionar **contratos de alquiler**
- ✅ Registrar y gestionar **propietarios**
- ✅ Registrar y gestionar **inquilinos**
- ✅ Registrar **pagos y gastos**
- ✅ Generar **reportes mensuales para propietarios**
- ✅ Configurar **métodos de pago** por contrato
- ✅ Aplicar **ajustes por índices económicos** a contratos
- ✅ Gestionar **mantenimientos** de propiedades
- ✅ Ver **calendario de pagos** y vencimientos
- ✅ Exportar recibos y comprobantes
- ✅ Crear sucursales (sub-tenants)
- ✅ Recomendar solicitudes de acceso de usuarios para su tenant

#### Casos de Uso
- Gestión diaria de propiedades en alquiler
- Administración de contratos y pagos
- Relación con propietarios e inquilinos
- Generación de reportes mensuales
- Control de gastos y distribución de pagos

#### Limitaciones
- ❌ No puede acceder a otros tenants tipo `inmobiliaria`
- ❌ No puede modificar índices económicos globales
- ❌ No puede aprobar solicitudes de acceso PMS (solo recomendar)

---

### 3. ADMINISTRADOR

**Nivel:** Tenant (Administrador Independiente)  
**Tenant Type:** `administrador`

#### Descripción
El ADMINISTRADOR es un tenant independiente que administra propiedades de terceros. No está vinculado a ninguna INMOBILIARIA y opera de forma autónoma, con capacidades similares a una INMOBILIARIA pero en su propio contexto.

#### Permisos y Capacidades
- ✅ Acceso completo a su tenant
- ✅ Gestionar usuarios de su tenant
- ✅ Crear y gestionar propiedades
- ✅ Crear y gestionar contratos de alquiler
- ✅ Registrar y gestionar propietarios (de terceros)
- ✅ Registrar y gestionar inquilinos
- ✅ Registrar pagos y gastos
- ✅ Generar reportes mensuales para propietarios
- ✅ Configurar métodos de pago por contrato
- ✅ Aplicar ajustes por índices económicos a contratos
- ✅ Gestionar mantenimientos de propiedades
- ✅ Ver calendario de pagos y vencimientos
- ✅ Exportar recibos y comprobantes
- ✅ Recomendar solicitudes de acceso de usuarios para su tenant

#### Casos de Uso
- Gestor profesional de propiedades de terceros
- Administración de carteras inmobiliarias
- Gestión integral de alquileres
- Relación directa con propietarios e inquilinos
- Generación de reportes mensuales independientes

#### Limitaciones
- ❌ No puede acceder a otros tenants tipo `administrador` o `inmobiliaria`
- ❌ No puede modificar índices económicos globales (solo SUPERADMIN)
- ❌ No puede aprobar solicitudes de acceso PMS (solo recomendar)
- ❌ Límite de usuarios según configuración del tenant (por defecto 2, configurable)

**Nota Importante:** 
A diferencia de un empleado de una inmobiliaria, el ADMINISTRADOR opera como un tenant completamente independiente. Esto permite a profesionales del sector inmobiliario administrar propiedades de terceros sin necesidad de crear una estructura empresarial como inmobiliaria, manteniendo plena autonomía operativa.

---

### 4. PROPIETARIO

**Nivel:** Tenant (Propietario Individual o Multi-propiedad)  
**Tenant Type:** `propietario` o `inmobiliaria` (como usuario asignado)

#### Descripción
El PROPIETARIO es el dueño de una o más propiedades. Puede tener dos contextos:
1. **Propietario en tenant `inmobiliaria`**: Asociado a una inmobiliaria que gestiona sus propiedades
2. **Propietario en tenant `propietario`**: Gestiona sus propias propiedades de forma independiente

#### Permisos y Capacidades

**Como Propietario en Inmobiliaria:**
- ✅ Ver **solo sus propiedades** asignadas
- ✅ Ver **contratos activos** de sus propiedades
- ✅ Ver **pagos recibidos** distribuidos según su porcentaje de propiedad
- ✅ Ver **gastos** de sus propiedades
- ✅ Descargar **reportes mensuales** de sus propiedades
- ✅ Ver **calendario de pagos esperados**
- ✅ Ver **historial de ajustes** por índices aplicados
- ✅ Ver **balance neto** por propiedad (ingresos - gastos)

**Como Propietario Independiente (tenant propio):**
- ✅ Todo lo anterior +
- ✅ Crear y gestionar sus propias propiedades
- ✅ Crear y gestionar contratos
- ✅ Registrar pagos y gastos
- ✅ Configurar métodos de pago
- ✅ Aplicar ajustes por índices

#### Casos de Uso
- Seguimiento de ingresos por alquileres
- Revisión de gastos de mantenimiento
- Descarga de reportes mensuales para declaración fiscal
- Consulta de estado de propiedades
- Verificación de distribución de pagos (en co-propiedad)

#### Limitaciones (Propietario en Inmobiliaria)
- ❌ No puede ver propiedades de otros propietarios
- ❌ No puede modificar contratos
- ❌ No puede crear o eliminar propiedades
- ❌ No puede gestionar inquilinos directamente
- ❌ No puede aprobar o rechazar gastos

#### Limitaciones (Propietario Independiente)
- ❌ No puede acceder a propiedades fuera de su tenant
- ❌ Límite de 2 usuarios por tenant (configurable)

---

## Roles Adicionales (Información)

### 5. INQUILINO

**Nivel:** Tenant (Usuario final)  
**Tenant Type:** `inquilino` o asociado a `inmobiliaria`

#### Descripción
El INQUILINO es el arrendatario de una propiedad con acceso limitado a información de su contrato activo.

#### Permisos y Capacidades
- ✅ Ver **su contrato activo**
- ✅ Ver **calendario de pagos** de su contrato
- ✅ Subir **comprobantes de pago**
- ✅ Ver **estado de cuenta** (pagos realizados y pendientes)
- ✅ Descargar **recibos de pago**
- ✅ Ver **gastos a cargo del inquilino**

#### Limitaciones
- ❌ No puede ver información de otros contratos
- ❌ No puede modificar datos del contrato
- ❌ Acceso revocado automáticamente al vencimiento del contrato

---

## Jerarquía de Roles

```
SUPERADMIN (Sistema completo)
    │
    ├── INMOBILIARIA (Tenant: inmobiliaria)
    │   │
    │   ├── PROPIETARIO (Dueño de propiedades)
    │   │
    │   └── INQUILINO (Arrendatario)
    │
    ├── ADMINISTRADOR (Tenant: administrador) ← INDEPENDIENTE
    │   │
    │   ├── PROPIETARIO (Propiedades gestionadas)
    │   │
    │   └── INQUILINO (Arrendatario)
    │
    └── PROPIETARIO Independiente (Tenant: propietario)
        │
        └── INQUILINO (Arrendatario)
```

---

## Tenants y Estructura

### Tipos de Tenants

1. **`sistema`**: Tenant especial para SUPERADMIN
2. **`inmobiliaria`**: Agencia inmobiliaria que gestiona propiedades
3. **`propietario`**: Propietario individual que gestiona sus propiedades
4. **`inquilino`**: Tenant personal del inquilino (opcional)
5. **`proveedor_servicios`**: Empresas de mantenimiento/servicios (futuro)

### Jerarquía de Tenants

Una INMOBILIARIA puede tener **sucursales** (sub-tenants):
- Tenant Padre: Inmobiliaria Central
  - Sucursal Norte (sub-tenant)
  - Sucursal Sur (sub-tenant)

**Límite:** Máximo 2 niveles de jerarquía (no se permiten sub-sucursales)

---

## Límites por Tenant

| Tenant Type | Max Usuarios | Configurable |
|-------------|--------------|--------------|
| sistema | 20 | Sí |
| inmobiliaria | 2 | Sí |
| propietario | 2 | Sí |
| inquilino | 2 | Sí |
| administrador | 2 | Sí |
| proveedor_servicios | 1 | Sí |

**Nota:** Los límites se configuran en `pms_tenants.settings->limits->max_users`

---

## Flujo de Aprobación de Usuarios

### 1. Solicitud de Acceso
El usuario completa el formulario en `/pms/request-access` indicando:
- Rol deseado (INMOBILIARIA, ADMINISTRADOR, PROPIETARIO, INQUILINO)
- Tenant (si aplica)
- Datos personales y justificación

### 2. Recomendación (Opcional)
Si solicita acceso a una INMOBILIARIA:
- La INMOBILIARIA puede **recomendar** la solicitud
- La recomendación acelera la aprobación

### 3. Aprobación Final
- **SUPERADMIN** aprueba o rechaza la solicitud
- Al aprobar, se crea el rol en `user_roles` con `status='approved'`

### 4. Activación
- El usuario recibe un email de bienvenida
- Puede acceder al sistema con su rol asignado

---

## Seguridad y RLS (Row-Level Security)

Todas las tablas del PMS implementan **RLS policies** basadas en:

1. **Verificación de rol**: `has_pms_role(auth.uid(), 'ROLE', tenant_id)`
2. **Verificación de tenant**: El usuario solo ve datos de su tenant
3. **Jerarquía**: INMOBILIARIA puede ver sucursales
4. **Propiedad**: PROPIETARIO solo ve sus propiedades asignadas

### Funciones de Seguridad

- `has_pms_role(_user_id, _role, _tenant_id)`: Verifica si el usuario tiene un rol específico
- `is_superadmin_pms()`: Verifica si el usuario es SUPERADMIN
- `can_manage_tenant_roles(_user_id, _tenant_id)`: Verifica si puede gestionar roles de un tenant
- `has_hierarchical_access(_user_id, _target_tenant_id)`: Verifica acceso jerárquico

---

## Ejemplos de Uso por Rol

### SUPERADMIN
```sql
-- Ver todos los tenants
SELECT * FROM pms_tenants;

-- Aprobar solicitud de acceso
UPDATE pms_access_requests 
SET status = 'approved', reviewed_by = auth.uid() 
WHERE id = 'request-id';

-- Ver todas las propiedades del sistema
SELECT * FROM pms_properties;
```

### INMOBILIARIA
```sql
-- Ver propiedades de mi tenant
SELECT * FROM pms_properties WHERE tenant_id = 'my-tenant-id';

-- Crear contrato
INSERT INTO pms_contracts (property_id, tenant_renter_id, ...)
VALUES (...);

-- Generar reporte mensual
SELECT * FROM pms_payment_distributions
WHERE contract_id IN (SELECT id FROM pms_contracts WHERE tenant_id = 'my-tenant-id');
```

### PROPIETARIO
```sql
-- Ver mis propiedades
SELECT p.* FROM pms_properties p
JOIN pms_owner_properties op ON op.property_id = p.id
JOIN pms_owners o ON o.id = op.owner_id
WHERE o.user_id = auth.uid();

-- Ver mis pagos distribuidos
SELECT * FROM pms_payment_distributions pd
JOIN pms_owners o ON o.id = pd.owner_id
WHERE o.user_id = auth.uid();
```

### INQUILINO
```sql
-- Ver mi contrato activo
SELECT * FROM pms_contracts c
JOIN pms_tenants_renters tr ON tr.id = c.tenant_renter_id
WHERE tr.user_id = auth.uid() 
  AND c.status = 'active'
  AND c.start_date <= CURRENT_DATE 
  AND c.end_date >= CURRENT_DATE;
```

---

## Tablas Relacionadas

### user_roles
Almacena la asignación de roles a usuarios:
```sql
- user_id: UUID del usuario (auth.users)
- role: Rol PMS (SUPERADMIN, INMOBILIARIA, ADMINISTRADOR, PROPIETARIO, INQUILINO)
- module: 'PMS'
- tenant_id: UUID del tenant asignado
- status: 'approved' | 'pending' | 'denied'
```

### pms_tenants
Define los tenants del sistema:
```sql
- id: UUID
- name: Nombre del tenant
- slug: Identificador único
- tenant_type: Tipo de tenant
- parent_tenant_id: UUID del tenant padre (para sucursales)
- settings: JSONB con configuración (límites, etc.)
```

### pms_access_requests
Solicitudes de acceso al PMS:
```sql
- user_id: UUID del solicitante
- requested_role: Rol solicitado
- tenant_id: Tenant al que solicita acceso
- status: 'pending' | 'approved' | 'denied'
- recommended_by: UUID de quien recomienda (INMOBILIARIA)
- reviewed_by: UUID de quien aprueba/rechaza (SUPERADMIN)
```

---

## Mejores Prácticas

### Para SUPERADMIN
1. Aprobar solicitudes solo después de verificar identidad
2. Configurar límites de usuarios según necesidad del tenant
3. Auditar regularmente los logs del sistema
4. No crear usuarios manualmente, usar el flujo de solicitud

### Para INMOBILIARIA
1. Recomendar solo usuarios verificados
2. Asignar ADMINISTRADOR con cuidado (delegan muchos permisos)
3. Mantener actualizada la información de propietarios
4. Generar reportes mensuales antes del día 10
5. Verificar pagos antes de distribuir a propietarios

### Para ADMINISTRADOR
1. Gestionar de forma autónoma su cartera de propiedades
2. Mantener comunicación directa con propietarios e inquilinos
3. Registrar pagos puntualmente para evitar inconsistencias
4. Revisar y enviar reportes mensuales a propietarios
5. Aplicar ajustes por índices según corresponda
6. Recomendar solicitudes de acceso para su tenant

### Para PROPIETARIO
1. Revisar reportes mensuales
2. Reportar errores en distribución de pagos inmediatamente
3. Mantener actualizados datos fiscales

---

## Preguntas Frecuentes (FAQ)

**¿Un usuario puede tener múltiples roles?**  
Sí, un usuario puede tener roles en diferentes tenants. Por ejemplo, ser PROPIETARIO en una INMOBILIARIA y tener su propio tenant como PROPIETARIO independiente.

**¿Cómo se asigna el tenant a un PROPIETARIO?**  
Al aprobar la solicitud, SUPERADMIN asigna el tenant. Si el PROPIETARIO solicita ser independiente, se crea un tenant tipo `propietario` automáticamente.

**¿Qué pasa cuando expira un contrato del INQUILINO?**  
El sistema cambia automáticamente su `status` a `'denied'` y pierde acceso al PMS.

**¿Puede una INMOBILIARIA aprobar solicitudes?**  
No, solo puede **recomendar**. La aprobación final es siempre de SUPERADMIN.

**¿Cuántas propiedades puede gestionar un PROPIETARIO independiente?**  
Sin límite de propiedades, pero está limitado a 2 usuarios en su tenant (configurable).

---

## Soporte y Contacto

Para dudas sobre el sistema de roles, contactar a:
- **Soporte Técnico**: soporte@wealthmigrate.com
- **Documentación Adicional**: `/docs/`

---

**Última actualización:** 2025-11-08  
**Versión:** 1.0
