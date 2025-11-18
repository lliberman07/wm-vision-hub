# Guía Completa del Sistema PMS - Preparación para Demo

## 📋 Resumen del Sistema de Roles

El sistema PMS cuenta con **6 roles principales** con diferentes niveles de acceso y responsabilidades:

### Roles Disponibles

#### 1. **SUPERADMIN** (Tú)
- **Nivel:** Sistema completo
- **Tenant Type:** `sistema`
- **Acceso:** Total al sistema
- **Capacidades:**
  - ✅ Ver y gestionar TODOS los tenants
  - ✅ Crear inmobiliarias, administradores
  - ✅ Aprobar solicitudes de acceso PMS
  - ✅ Gestionar índices económicos (ICL, IPC, UVA)
  - ✅ Acceso a `/admin` y todas las secciones
  - ✅ Ver métricas consolidadas de todo el sistema

#### 2. **GRANADA_ADMIN** (Admin de Granada Platform)
- **Nivel:** Plataforma Granada
- **Rol especial:** Gestiona la plataforma Granada que ofrece PMS como servicio
- **Capacidades:**
  - ✅ Gestionar clientes (inmobiliarias) suscritos
  - ✅ Aprobar/rechazar solicitudes de suscripción
  - ✅ Ver analytics de suscripciones
  - ✅ Gestionar partners del directorio
  - ✅ Ver pagos y facturación
  - ✅ Acceso a `/granada-admin`

#### 3. **INMOBILIARIA**
- **Nivel:** Tenant (Empresa Inmobiliaria)
- **Tenant Type:** `inmobiliaria`
- **Modelo de Negocio:** Administra propiedades de terceros (propietarios) cobrando comisión
- **Capacidades:**
  - ✅ Crear y gestionar propiedades de sus clientes
  - ✅ Crear contratos para propiedades administradas
  - ✅ Registrar propietarios como clientes
  - ✅ Registrar inquilinos
  - ✅ Gestionar pagos y gastos
  - ✅ Generar reportes mensuales para propietarios
  - ✅ Dashboard de negocio (comisiones, rentabilidad)
  - ✅ Crear sucursales (sub-tenants)

#### 4. **ADMINISTRADOR** (Gestor Independiente)
- **Nivel:** Tenant (Administrador Independiente)
- **Tenant Type:** `administrador`
- **Modelo de Negocio:** Igual que INMOBILIARIA, pero como profesional independiente
- **Capacidades:** Idénticas a INMOBILIARIA (gestiona propiedades de terceros)

#### 5. **PROPIETARIO**
- **Nivel:** Usuario / Tenant propio
- **Tenant Type:** `propietario` (si autoadministra)
- **Modelo de Negocio:** Administra sus PROPIAS propiedades (sin cobrar comisión a sí mismo)
- **Dos escenarios:**
  
  **A. Propietario Auto-Administrado:**
  - ✅ Crea su propio tenant tipo `propietario`
  - ✅ Gestiona solo SUS propiedades
  - ✅ Crea contratos para sus propiedades
  - ✅ Registra inquilinos
  - ❌ NO tiene dashboard de comisiones
  - ❌ NO puede crear propietarios (él ES el propietario)
  
  **B. Propietario Administrado por Terceros:**
  - 📧 Recibe email cuando INMOBILIARIA/ADMINISTRADOR crea un contrato
  - ✅ Accede solo a VER sus contratos y reportes
  - ✅ Accede a `/pms/my-contract`
  - ❌ NO puede crear/editar nada
  - ❌ Solo visualización de su información

#### 6. **INQUILINO**
- **Nivel:** Usuario final
- **Acceso:** Solo su contrato activo
- **Capacidades:**
  - 📧 Recibe email cuando se crea/activa su contrato
  - ✅ Ve su contrato y detalles
  - ✅ Ve calendario de pagos
  - ✅ Puede reportar incidencias/mantenimiento
  - ✅ Accede a `/pms/my-contract`
  - ❌ NO puede editar nada

---

## 🔄 Flujo Completo para la Demo

### FASE 1: Configuración Inicial (Como SUPERADMIN)

#### 1.1. Crear Índices Económicos
```
1. Login como SUPERADMIN
2. Ir a /pms/indices
3. Crear índices necesarios (ICL, IPC, UVA)
4. Cargar valores históricos y actuales
```

#### 1.2. Crear Granada Admin (Opcional)
```
1. Ir a /granada-admin (debe existir función de crear admins)
2. Crear usuario con rol GRANADA_ADMIN
3. Este usuario podrá gestionar la plataforma Granada
```

---

### FASE 2: Crear Inmobiliaria (Flujo Real)

#### 2.1. Solicitud de Suscripción (Como Usuario Anónimo)
```
1. Ir a /granada-platform/planes
2. Click en "Solicitar Plan Profesional"
3. Completar formulario:
   - Tipo: Inmobiliaria
   - Nombre de la empresa
   - Email de contacto
   - Ubicación (provincia, ciudad)
4. Enviar solicitud
```

#### 2.2. Aprobar Suscripción (Como GRANADA_ADMIN o SUPERADMIN)
```
1. Login como GRANADA_ADMIN
2. Ir a /granada-admin/subscription-requests
3. Ver solicitud pendiente
4. Click "Aprobar"
5. Sistema automáticamente:
   - Crea tenant tipo 'inmobiliaria'
   - Crea usuario con rol INMOBILIARIA
   - Envía email con credenciales
   - Activa suscripción
```

---

### FASE 3: Flujo de Inmobiliaria

#### 3.1. Login como Inmobiliaria
```
1. Usar credenciales recibidas por email
2. Acceso a /pms
3. Ver dashboard de inmobiliaria
```

#### 3.2. Crear Propietario (Cliente)
```
1. Ir a /pms/owners
2. Click "Nuevo Propietario"
3. Completar datos:
   - Nombre completo
   - Email
   - Teléfono
   - CUIT/CUIL
   - Tipo: Persona o Empresa
4. Guardar
5. Sistema crea registro en pms_owners
```

#### 3.3. Crear Propiedad
```
1. Ir a /pms/properties
2. Click "Nueva Propiedad"
3. Completar datos:
   - Dirección
   - Tipo de propiedad
   - Características (habitaciones, baños, m²)
4. Asignar propietario(s) con % de participación
5. Guardar
```

#### 3.4. Crear Inquilino
```
1. Ir a /pms/tenants
2. Click "Nuevo Inquilino"
3. Completar datos:
   - Nombre
   - Email
   - Teléfono
   - DNI
4. Guardar
```

#### 3.5. Crear Contrato (¡Paso Crítico!)
```
1. Ir a /pms/contracts
2. Click "Nuevo Contrato"
3. Completar datos:
   - Seleccionar propiedad
   - Seleccionar inquilino
   - Fecha inicio y fin
   - Monto inicial
   - Item A y B (si aplica ajuste)
   - Tipo de ajuste (ICL, IPC, fijo)
   - Día de vencimiento
   - Garantía
   - Método de pago
   - Distribución de pagos (comisión, gastos)
4. Guardar como "borrador"
5. Click "Activar Contrato"
```

#### 3.6. ¿Qué Sucede al Activar el Contrato?

**🚀 Proceso Automático:**

1. **Se ejecuta `activate_contract()` RPC** que:
   - Cambia status a 'active'
   - Genera schedule de pagos (cuotas mensuales)
   - Crea registro en `pms_contract_current`
   - Crea proyecciones mensuales

2. **Se dispara edge function `send-contract-activation-notification`:**

   **Para CADA PROPIETARIO de la propiedad:**
   - ✅ Busca si tiene user_id
   - ✅ Si NO tiene, crea usuario en auth.users con contraseña temporal
   - ✅ Llama a `auto-create-propietario-user` edge function
   - ✅ Crea registro en `pms_client_users` tipo 'PROPIETARIO'
   - ✅ Vincula owner_id con user_id
   - 📧 **Envía email con:**
     - Credenciales de acceso
     - Link directo al contrato
     - Instrucciones para ver reportes

   **Para el INQUILINO:**
   - ✅ Busca si tiene user_id
   - ✅ Si NO tiene, crea usuario en auth.users con contraseña temporal
   - ✅ Llama a `auto-create-inquilino-user` edge function
   - ✅ Crea registro en `pms_client_users` tipo 'INQUILINO'
   - ✅ Vincula contract_id con user_id
   - 📧 **Envía email con:**
     - Credenciales de acceso
     - Link directo a su contrato
     - Calendario de pagos

   **Para el ADMIN/INMOBILIARIA:**
   - 📧 Notificación de activación exitosa

   **Para el SUPERADMIN:**
   - 📧 Notificación de nuevo contrato activado

3. **Se crea log en `pms_contract_activation_logs`** con:
   - IDs de usuarios creados
   - Emails enviados
   - Errores (si hubo)

---

### FASE 4: Verificar Flujo de Emails

#### 4.1. Revisar Logs de Activación
```
1. Como SUPERADMIN o INMOBILIARIA
2. Ir a /pms/contracts
3. Click en el contrato activado
4. Ver tab "Logs de Activación"
5. Verificar:
   - ✅ Propietarios creados
   - ✅ Inquilino creado
   - ✅ Emails enviados
```

#### 4.2. Verificar en Supabase Dashboard
```
1. Ir a https://supabase.com/dashboard/project/jrzeabjpxkhccopxfwqa/auth/users
2. Buscar emails de propietarios e inquilinos
3. Verificar que usuarios fueron creados
4. Ver metadata (user_type: PROPIETARIO/INQUILINO)
```

#### 4.3. Revisar Edge Function Logs
```
1. Ir a https://supabase.com/dashboard/project/jrzeabjpxkhccopxfwqa/functions/send-contract-activation-notification/logs
2. Ver logs de ejecución
3. Verificar envío de emails
```

---

### FASE 5: Probar Acceso de Propietario

#### 5.1. Login como Propietario
```
1. Ir a /pms/login
2. Usar email del propietario
3. Usar contraseña recibida por email
4. Acceso a /pms
```

#### 5.2. Vista de Propietario
```
Ver automáticamente:
- Dashboard con sus propiedades
- Contratos activos
- Reportes mensuales
- Calendario de cobros esperados
- Gastos deducidos

NO puede:
- Crear propiedades
- Editar contratos
- Crear inquilinos
```

---

### FASE 6: Probar Acceso de Inquilino

#### 6.1. Login como Inquilino
```
1. Ir a /pms/login
2. Usar email del inquilino
3. Usar contraseña recibida por email
4. Redirigido automáticamente a /pms/my-contract
```

#### 6.2. Vista de Inquilino
```
Ver automáticamente:
- Su contrato activo
- Detalles de la propiedad
- Calendario de pagos
- Historial de pagos realizados
- Opción de reportar mantenimiento

NO puede:
- Ver otros contratos
- Editar nada
- Acceder a otras secciones
```

---

## 🔧 Crear Administrador Independiente

### Flujo Similar a Inmobiliaria:

```
1. Solicitud en /subscription-request con tipo "Administrador Independiente"
2. Granada Admin aprueba
3. Se crea tenant tipo 'administrador'
4. Usuario recibe credenciales
5. Funciona IGUAL que Inmobiliaria (gestiona propiedades de terceros)
```

---

## 🏠 Crear Propietario Auto-Administrado

### Opción 1: Desde Solicitud de Suscripción
```
1. Ir a /subscription-request
2. Seleccionar tipo "Propietario"
3. Granada Admin aprueba
4. Se crea tenant tipo 'propietario'
5. Usuario accede a PMS para gestionar SUS propiedades
```

### Opción 2: Registro Directo (Si está habilitado)
```
1. Ir a /pms/request-access
2. Solicitar rol PROPIETARIO
3. SUPERADMIN aprueba
4. Se crea tenant tipo 'propietario' automáticamente
```

**Diferencias clave:**
- ❌ NO puede crear "propietarios" (él ES el propietario)
- ❌ NO tiene dashboard de comisiones
- ✅ Crea contratos para SUS propiedades
- ✅ Gestiona gastos de SUS propiedades

---

## 📊 Tablas y Relaciones Clave

### user_roles
```sql
- user_id: UUID (FK a auth.users)
- module: 'WM' | 'PMS'
- role: 'SUPERADMIN' | 'INMOBILIARIA' | 'ADMINISTRADOR' | 'PROPIETARIO' | 'INQUILINO'
- tenant_id: UUID (FK a pms_tenants)
- status: 'pending' | 'approved' | 'denied'
```

### pms_tenants
```sql
- id: UUID
- name: TEXT
- tenant_type: 'sistema' | 'inmobiliaria' | 'administrador' | 'propietario' | 'inquilino'
- parent_tenant_id: UUID (para sucursales)
```

### pms_client_users
```sql
- user_id: UUID (FK a auth.users)
- tenant_id: UUID (FK a pms_tenants)
- user_type: 'CLIENT_ADMIN' | 'PROPIETARIO' | 'INQUILINO'
- owner_id: UUID (solo para PROPIETARIO)
- contract_id: UUID (solo para INQUILINO)
- is_active: BOOLEAN
```

---

## ✅ Checklist Pre-Demo

### Configuración Inicial
- [ ] Crear índices económicos (ICL, IPC)
- [ ] Tener cuenta SUPERADMIN funcional
- [ ] (Opcional) Crear Granada Admin

### Flujo Inmobiliaria
- [ ] Crear solicitud de suscripción Inmobiliaria
- [ ] Aprobar solicitud
- [ ] Verificar email con credenciales
- [ ] Login como Inmobiliaria

### Crear Entidades
- [ ] Crear 1-2 propietarios
- [ ] Crear 2-3 propiedades
- [ ] Asignar propietarios a propiedades
- [ ] Crear 2 inquilinos

### Contratos y Activación
- [ ] Crear contrato en borrador
- [ ] Completar TODOS los campos requeridos
- [ ] Activar contrato
- [ ] Verificar logs de activación
- [ ] Verificar creación de usuarios en Supabase Auth

### Verificar Emails
- [ ] Revisar logs de edge functions
- [ ] Confirmar emails enviados a propietarios
- [ ] Confirmar emails enviados a inquilinos

### Probar Accesos
- [ ] Login como propietario → Ver dashboard
- [ ] Login como inquilino → Ver contrato
- [ ] Verificar permisos correctos

### Flujo Administrador Independiente (Opcional)
- [ ] Crear solicitud tipo Administrador
- [ ] Aprobar y verificar funcionalidad

### Flujo Propietario Auto-Administrado (Opcional)
- [ ] Crear solicitud tipo Propietario
- [ ] Aprobar y verificar tenant propio
- [ ] Verificar diferencias con Inmobiliaria

---

## 🚨 Problemas Comunes y Soluciones

### 1. No se envían emails al activar contrato
**Causa:** Falta configurar RESEND_API_KEY  
**Solución:** 
```
1. Ir a https://supabase.com/dashboard/project/jrzeabjpxkhccopxfwqa/settings/functions
2. Verificar variable RESEND_API_KEY
```

### 2. Propietario/Inquilino no pueden hacer login
**Causa:** Usuario no fue creado correctamente  
**Solución:** 
```
1. Revisar logs de edge function
2. Verificar tabla pms_client_users
3. Recrear usuario manualmente si es necesario
```

### 3. Propietario ve más de lo que debería
**Causa:** RLS policies incorrectas  
**Solución:** 
```
1. Verificar políticas RLS en pms_properties
2. Verificar pms_owner_properties JOIN
```

### 4. Inconsistencia GESTOR vs ADMINISTRADOR
**Causa:** Discrepancia entre código y documentación  
**Nota:** En la documentación aparece "ADMINISTRADOR" pero en algunos archivos de código como `pmsRoleHelpers.tsx` dice "GESTOR". Ambos se refieren al mismo rol (administrador independiente).

---

## 📧 Templates de Email

Los emails se envían con estas plantillas (ver edge functions):

### Email a Propietario:
```
Asunto: Nuevo Contrato Activado - [Dirección Propiedad]

Hola [Nombre],

Se ha activado un nuevo contrato para tu propiedad en [Dirección].

Accede a tu panel para ver detalles:
[Link a /pms/login]

Usuario: [email]
Contraseña temporal: [password]

Podrás ver:
- Detalles del contrato
- Reportes mensuales
- Calendario de cobros
```

### Email a Inquilino:
```
Asunto: Tu Contrato de Alquiler - [Dirección]

Hola [Nombre],

Tu contrato de alquiler ha sido activado.

Accede a tu panel:
[Link a /pms/login]

Usuario: [email]
Contraseña temporal: [password]

Podrás ver:
- Tu contrato
- Calendario de pagos
- Reportar incidencias
```

---

## 🎯 Funcionalidades Extras a Implementar

Basado en el flujo completo, aquí hay funcionalidades que podrías necesitar:

1. **Panel de Cliente Admin (CLIENT_ADMIN)**
   - Dashboard de negocio para Inmobiliaria
   - Métricas de comisiones
   - Reportes consolidados

2. **Gestión de Sucursales**
   - Crear sub-tenants para inmobiliarias
   - Asignar propiedades a sucursales

3. **Portal de Propietario Mejorado**
   - Notificaciones de pagos recibidos
   - Aprobar/rechazar gastos
   - Ver rendimiento de propiedades

4. **Portal de Inquilino Mejorado**
   - Pago online de cuotas
   - Chat con administración
   - Reportar mantenimiento con fotos

5. **Reportes Automáticos**
   - Email mensual a propietarios
   - Recordatorios de pago a inquilinos
   - Alertas de contratos por vencer

---

## 📞 Contacto y Soporte

Para dudas sobre el sistema de roles o flujos:
- Revisar documentación en `/docs/SISTEMA-ROLES-PMS.md`
- Consultar datos de roles en `/src/data/pmsRolesData.ts`
- Ver helpers de roles en `/src/lib/pmsRoleHelpers.tsx`
