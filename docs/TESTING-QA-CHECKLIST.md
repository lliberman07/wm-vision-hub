# 📋 Testing & QA Checklist - Granada Platform

## Tabla de Contenidos

- [1. Testing de Autenticación y Roles](#1-testing-de-autenticación-y-roles)
- [2. Testing del Módulo Granada Admin](#2-testing-del-módulo-granada-admin)
- [3. Testing del Módulo CLIENT_ADMIN / Inmobiliaria](#3-testing-del-módulo-client_admin--inmobiliaria)
- [4. Testing del Módulo PMS](#4-testing-del-módulo-pms)
- [5. Testing de Portales (Propietario/Inquilino)](#5-testing-de-portales-propietarioinquilino)
- [6. Testing de Seguridad (RLS Policies)](#6-testing-de-seguridad-rls-policies)
- [7. Testing de Edge Functions](#7-testing-de-edge-functions)
- [8. Testing de Performance](#8-testing-de-performance)
- [9. Testing de Emails](#9-testing-de-emails)
- [10. Testing Responsive](#10-testing-responsive)
- [11. Testing End-to-End](#11-testing-end-to-end)
- [12. Testing de Datos y Validaciones](#12-testing-de-datos-y-validaciones)

---

## 1. Testing de Autenticación y Roles

### 1.1 Login y Registro

- [ ] Login con credenciales válidas (Granada Admin)
- [ ] Login con credenciales válidas (CLIENT_ADMIN)
- [ ] Login con credenciales válidas (ADMINISTRADOR)
- [ ] Login con credenciales válidas (PROPIETARIO)
- [ ] Login con credenciales válidas (INQUILINO)
- [ ] Login con credenciales inválidas muestra error apropiado
- [ ] Login con usuario inactivo (`is_active = false`) es rechazado
- [ ] Logout funciona correctamente
- [ ] Sesión persiste al recargar página
- [ ] Sesión expira después del tiempo configurado
- [ ] Recuperación de contraseña funciona
- [ ] Cambio de contraseña temporal en primer login
- [ ] Redirección correcta después de login según rol

### 1.2 Control de Acceso por Rol

- [ ] GRANADA_SUPERADMIN puede acceder a `/granada-admin`
- [ ] GRANADA_ADMIN puede acceder a `/granada-admin`
- [ ] CLIENT_ADMIN puede acceder a `/client-admin`
- [ ] ADMINISTRADOR puede acceder a `/pms`
- [ ] PROPIETARIO solo puede acceder a su portal
- [ ] INQUILINO solo puede acceder a su portal
- [ ] Usuarios sin rol no pueden acceder a ningún módulo
- [ ] Redirección correcta cuando se intenta acceder sin permiso
- [ ] Multi-tenancy: usuarios de tenant A no ven datos de tenant B

---

## 2. Testing del Módulo Granada Admin

### 2.1 Dashboard y Analytics

- [ ] Dashboard carga con KPIs correctos (MRR, ARR, Total Clientes, Churn)
- [ ] Gráfico de evolución de suscripciones muestra datos correctos
- [ ] Filtros por fecha funcionan correctamente
- [ ] Analytics de suscripciones muestra breakdown por plan
- [ ] Cambios en suscripciones se reflejan en tiempo real

### 2.2 Solicitudes de Suscripción

- [ ] Lista de solicitudes pendientes carga correctamente
- [ ] Ver detalles de solicitud funciona
- [ ] Aprobar solicitud:
  - [ ] Crea tenant en `pms_tenants`
  - [ ] Crea suscripción en `pms_tenant_subscriptions`
  - [ ] Crea usuario CLIENT_ADMIN en `granada_platform_users`
  - [ ] Crea usuario en `auth.users` con contraseña temporal
  - [ ] Envía email de bienvenida con credenciales
  - [ ] Email contiene enlace correcto a `/pms/login`
  - [ ] Estado de solicitud cambia a "approved"
- [ ] Rechazar solicitud:
  - [ ] Estado cambia a "rejected"
  - [ ] No se crea tenant ni usuario
  - [ ] (Opcional) Envía email de rechazo
- [ ] Filtros de estado funcionan (pending, approved, rejected)
- [ ] Búsqueda por nombre/email funciona

### 2.3 Gestión de Clientes (Inmobiliarias)

- [ ] Lista de clientes muestra todos los tenants
- [ ] Ver detalles de cliente funciona
- [ ] Editar datos de cliente funciona
- [ ] Cambiar plan de suscripción:
  - [ ] Actualiza `pms_tenant_subscriptions`
  - [ ] Aplica nuevos límites inmediatamente
  - [ ] Envía notificación por email
  - [ ] Registra cambio en historial
- [ ] Suspender cliente:
  - [ ] Cambia estado a "suspended"
  - [ ] Usuarios del tenant no pueden acceder
  - [ ] Datos se mantienen intactos
- [ ] Reactivar cliente suspendido funciona
- [ ] Ver historial de suscripciones funciona
- [ ] Ver estadísticas de uso del cliente (propiedades, contratos, usuarios)

### 2.4 Gestión de Planes de Suscripción

- [ ] Crear nuevo plan:
  - [ ] Valida campos obligatorios
  - [ ] Permite definir límites (propiedades, usuarios, contratos)
  - [ ] Permite definir precio y moneda
  - [ ] Permite configurar período de prueba
- [ ] Editar plan existente:
  - [ ] Cambios se aplican solo a nuevas suscripciones
  - [ ] Suscripciones activas mantienen configuración original
- [ ] Desactivar plan:
  - [ ] No afecta suscripciones existentes
  - [ ] No aparece en selector para nuevas suscripciones
- [ ] Clonar plan funciona correctamente
- [ ] Comparador de planes muestra diferencias claramente

### 2.5 Gestión de Suscripciones

- [ ] Crear suscripción manual funciona
- [ ] Convertir trial a paid:
  - [ ] Actualiza estado a "active"
  - [ ] Actualiza `trial_ends_at` a null
  - [ ] Registra fecha de conversión
- [ ] Cancelar suscripción:
  - [ ] Cambia estado a "cancelled"
  - [ ] Registra `cancelled_at`
  - [ ] (Opcional) Permite definir fecha de fin de servicio
- [ ] Ver historial de pagos de suscripción
- [ ] Registrar pago manual funciona
- [ ] Notificaciones de vencimiento de trial se envían correctamente

### 2.6 Gestión de Usuarios Granada

- [ ] Crear usuario GRANADA_ADMIN funciona
- [ ] Crear usuario GRANADA_SUPERADMIN funciona
- [ ] Editar permisos de usuario funciona
- [ ] Desactivar usuario funciona
- [ ] Eliminar usuario funciona (con confirmación)

### 2.7 Gestión de Partners

- [ ] Crear partner funciona
- [ ] Editar partner funciona
- [ ] Subir logo de partner funciona
- [ ] Marcar/desmarcar como destacado funciona
- [ ] Desactivar partner funciona
- [ ] Partners aparecen en directorio público

### 2.8 Gestión de Contactos

- [ ] Lista de contactos desde formularios web
- [ ] Asignar contacto a usuario funciona
- [ ] Cambiar estado de contacto funciona
- [ ] Agregar notas internas funciona
- [ ] Registrar acción de seguimiento funciona
- [ ] Ver historial de acciones funciona
- [ ] Filtros por estado, prioridad, fuente funcionan

---

## 3. Testing del Módulo CLIENT_ADMIN / Inmobiliaria

### 3.1 Dashboard

- [ ] KPIs muestran datos correctos del tenant
- [ ] Gráficos de propiedades por estado funcionan
- [ ] Gráfico de ocupación funciona
- [ ] Lista de próximos vencimientos de contratos
- [ ] Lista de pagos pendientes

### 3.2 Equipo Administrativo

- [ ] Crear usuario CLIENT_ADMIN:
  - [ ] Crea en `granada_platform_users`
  - [ ] Crea en `auth.users` con contraseña temporal
  - [ ] Envía email de bienvenida con credenciales
  - [ ] Email contiene enlace correcto
- [ ] Crear usuario ADMINISTRADOR:
  - [ ] Crea en `pms_client_users`
  - [ ] Asigna `tenant_id` correcto
  - [ ] Envía email de bienvenida
- [ ] Editar usuario funciona
- [ ] Desactivar usuario funciona
- [ ] Reactivar usuario funciona
- [ ] Usuario desactivado no puede hacer login
- [ ] Lista muestra solo usuarios del tenant

### 3.3 Analytics

- [ ] Gráficos de ingresos funcionan
- [ ] Métricas de ocupación son correctas
- [ ] Analytics de pagos funcionan
- [ ] Exportar reportes funciona
- [ ] Filtros por fecha funcionan

### 3.4 Mi Suscripción

- [ ] Muestra plan actual correctamente
- [ ] Muestra límites y uso actual
- [ ] Alertas cuando se acerca a límites (80%, 90%, 100%)
- [ ] Muestra historial de pagos
- [ ] Permite subir comprobante de pago
- [ ] Permite solicitar cambio de plan

### 3.5 Configuración de Empresa

- [ ] Editar datos de empresa funciona
- [ ] Editar datos bancarios funciona
- [ ] Subir logo funciona
- [ ] Cambios se guardan correctamente

---

## 4. Testing del Módulo PMS

### 4.1 Propiedades

#### Crear Propiedad
- [ ] Formulario valida campos obligatorios
- [ ] Crear propiedad funciona
- [ ] Respeta límites de suscripción
- [ ] Muestra error si excede límite
- [ ] Subir fotos funciona
- [ ] Fotos se almacenan en storage correcto
- [ ] Eliminar foto funciona
- [ ] Geolocalización funciona (opcional)

#### Editar Propiedad
- [ ] Cargar datos existentes funciona
- [ ] Modificar datos funciona
- [ ] Cambiar estado funciona (Disponible, Ocupada, Mantenimiento)
- [ ] Cambios se reflejan en listado

#### Clonar Propiedad
- [ ] Clonar crea nueva propiedad con datos similares
- [ ] Genera nuevo ID
- [ ] No clona fotos (opcional: permitir clonar fotos)

#### Listar y Filtrar
- [ ] Lista muestra solo propiedades del tenant
- [ ] Filtros por estado funcionan
- [ ] Filtros por tipo funcionan
- [ ] Búsqueda por dirección/nombre funciona
- [ ] Paginación funciona

#### Eliminar Propiedad
- [ ] No permite eliminar si tiene contratos activos
- [ ] Permite eliminar si no tiene dependencias
- [ ] Confirmación obligatoria

### 4.2 Propietarios

#### Crear Propietario
- [ ] Formulario valida campos obligatorios
- [ ] Crear propietario funciona
- [ ] Email es único
- [ ] CUIT/CUIL es único (si aplica)
- [ ] Se asocia automáticamente a tenant

#### Crear Usuario Portal Propietario
- [ ] Checkbox "Crear acceso al portal" funciona
- [ ] Crea usuario en `pms_client_users` con tipo "PROPIETARIO"
- [ ] Crea usuario en `auth.users` con contraseña temporal
- [ ] Envía email de bienvenida con credenciales
- [ ] Email contiene enlace correcto al portal
- [ ] Asocia `owner_id` correctamente

#### Editar Propietario
- [ ] Modificar datos funciona
- [ ] No permite cambiar email si ya tiene usuario portal
- [ ] Cambios se reflejan en listado

#### Listar y Filtrar
- [ ] Lista muestra solo propietarios del tenant
- [ ] Búsqueda por nombre/email funciona
- [ ] Filtro por activo/inactivo funciona

#### Eliminar Propietario
- [ ] No permite eliminar si tiene propiedades asociadas
- [ ] Permite eliminar si no tiene dependencias

### 4.3 Inquilinos (Renters)

#### Crear Inquilino
- [ ] Formulario valida campos obligatorios
- [ ] Crear inquilino funciona
- [ ] Email es único
- [ ] CUIT/CUIL es único (si aplica)

#### Listar y Filtrar
- [ ] Lista muestra solo inquilinos del tenant
- [ ] Búsqueda funciona
- [ ] Filtros funcionan

### 4.4 Contratos

#### Crear Contrato
- [ ] Formulario valida campos obligatorios
- [ ] Seleccionar propiedad funciona
- [ ] Seleccionar inquilino funciona
- [ ] Configurar condiciones económicas:
  - [ ] Monto de alquiler
  - [ ] Moneda (ARS, USD)
  - [ ] Día de pago
  - [ ] Depósito en garantía
- [ ] Configurar ajustes por índice:
  - [ ] Tipo de índice (IPC, ICL, Sin ajuste)
  - [ ] Frecuencia (Mensual, Trimestral, Semestral, Anual)
  - [ ] Fecha de primer ajuste
  - [ ] Modo de redondeo
- [ ] Configurar ítems adicionales (Expensas, Servicios)
- [ ] Configurar métodos de pago y distribución
- [ ] Subir documentos del contrato funciona
- [ ] Estado inicial es "draft"

#### Activar Contrato (CRÍTICO)
- [ ] Solo INMOBILIARIA/ADMINISTRADOR puede activar
- [ ] Validaciones previas:
  - [ ] Propiedad existe
  - [ ] Inquilino existe
  - [ ] Propietarios asociados a la propiedad
  - [ ] Fechas son válidas
  - [ ] Índices económicos necesarios están cargados
- [ ] **Acciones automáticas al activar:**
  - [ ] Cambia estado a "active"
  - [ ] Crea registro en `pms_contract_current`
  - [ ] Genera ítems en `pms_payment_schedule_items` para todo el período
  - [ ] Crea usuario INQUILINO en `pms_client_users` (si no existe)
  - [ ] Crea usuario en `auth.users` para inquilino con contraseña temporal
  - [ ] Crea usuarios PROPIETARIO para cada owner (si no existen)
  - [ ] **Envía emails:**
    - [ ] Email a SUPERADMIN notificando activación
    - [ ] Email a INMOBILIARIA/ADMIN notificando activación
    - [ ] Email de bienvenida a INQUILINO con credenciales
    - [ ] Email de bienvenida a cada PROPIETARIO con credenciales
  - [ ] Registra todo en `pms_contract_activation_logs`
- [ ] Cambio de estado de propiedad a "Ocupada"
- [ ] No permite activar si ya existe contrato activo para esa propiedad

#### Ver Proyecciones Mensuales
- [ ] Tabla de proyecciones muestra todos los meses del contrato
- [ ] Montos base son correctos
- [ ] Ajustes por índice se aplican correctamente
- [ ] Indicador de índices pendientes funciona
- [ ] Montos ajustados se calculan correctamente

#### Ver Ajustes Aplicados
- [ ] Lista de ajustes históricos carga correctamente
- [ ] Muestra porcentaje de variación
- [ ] Muestra monto previo y nuevo

#### Renovar Contrato
- [ ] Permite definir nuevo período
- [ ] Permite ajustar monto
- [ ] Crea nuevo contrato vinculado
- [ ] Marca contrato anterior como "completed"
- [ ] Genera nuevo `contract_number` con sufijo (ej: CTR-001-R1)

#### Extender Contrato
- [ ] Permite extender fecha de fin
- [ ] Genera nuevos `payment_schedule_items` para período extendido
- [ ] Mantiene mismo `contract_number`

#### Cancelar Contrato
- [ ] Solicita motivo de cancelación
- [ ] Cambia estado a "cancelled"
- [ ] Registra `cancelled_at` y `cancelled_by`
- [ ] Libera propiedad (cambia a "Disponible")
- [ ] No elimina datos históricos

#### Documentos del Contrato
- [ ] Subir documentos funciona
- [ ] Descargar documentos funciona
- [ ] Ver preview de documentos funciona
- [ ] Eliminar documentos funciona

### 4.5 Pagos

#### Calendario de Pagos
- [ ] Muestra matriz Contratos x Meses
- [ ] Colores indican estado (Pendiente, Pagado, Vencido)
- [ ] Click en celda abre modal de detalle
- [ ] Modal muestra breakdown:
  - [ ] Alquiler
  - [ ] Expensas
  - [ ] Servicios
  - [ ] Total
  - [ ] Gastos deducibles
  - [ ] Neto al propietario

#### Registrar Pago
- [ ] Formulario permite seleccionar mes y contrato
- [ ] Permite registrar pago total
- [ ] Permite registrar pago parcial
- [ ] Permite subir comprobante
- [ ] Calcula distribución automáticamente según configuración
- [ ] Permite ajustar distribución manualmente
- [ ] Crea registros en `pms_payments`
- [ ] Actualiza estado en `pms_payment_schedule_items`
- [ ] Deduce gastos aprobados del período
- [ ] Genera distribuciones en `pms_payment_distributions`

#### Pagos Parciales
- [ ] Permite múltiples pagos para un mismo período
- [ ] Suma de pagos parciales actualiza estado correctamente
- [ ] Cuando suma = total, marca como "paid"

#### Distribución de Pagos
- [ ] Distribución por porcentaje funciona
- [ ] Distribución por monto fijo funciona
- [ ] Validación: suma de distribuciones = 100% o total
- [ ] Permite configurar cuenta bancaria destino por owner

#### Ver Historial de Pagos
- [ ] Lista de pagos por contrato
- [ ] Lista de pagos por propietario
- [ ] Filtros por fecha funcionan
- [ ] Exportar a Excel/PDF funciona

### 4.6 Gastos

#### Crear Gasto
- [ ] Formulario valida campos obligatorios
- [ ] Permite seleccionar propiedad
- [ ] Permite seleccionar contrato (opcional)
- [ ] Permite seleccionar categoría
- [ ] Permite definir si es reembolsable
- [ ] Permite definir atribuible a (Propietario, Inquilino, Ambos)
- [ ] Permite subir comprobante
- [ ] Estado inicial es "pending"

#### Aprobar Gasto
- [ ] Solo ADMINISTRADOR/INMOBILIARIA puede aprobar
- [ ] Cambio de estado a "approved"
- [ ] Registra `approved_by` y `approved_at`
- [ ] Si es deducible, se vincula a próximo pago

#### Rechazar Gasto
- [ ] Solo ADMINISTRADOR/INMOBILIARIA puede rechazar
- [ ] Cambio de estado a "rejected"
- [ ] Requiere motivo

#### Gastos Deducibles
- [ ] Gastos aprobados se deducen automáticamente del pago
- [ ] Monto deducido se registra en `pms_payment_distributions`
- [ ] Se notifica a propietario en reporte mensual

#### Ver Gastos por Propiedad
- [ ] Reporte muestra gastos agrupados por categoría
- [ ] Filtros por fecha funcionan
- [ ] Filtros por estado funcionan
- [ ] Exportar funciona

### 4.7 Mantenimiento

#### Crear Solicitud de Mantenimiento
- [ ] Formulario valida campos obligatorios
- [ ] Permite seleccionar propiedad
- [ ] Permite seleccionar prioridad (Baja, Media, Alta, Urgente)
- [ ] Permite subir fotos
- [ ] Estado inicial es "open"

#### Asignar Mantenimiento
- [ ] Permite asignar a proveedor/técnico
- [ ] Cambia estado a "in_progress"
- [ ] Notifica a asignado (opcional)

#### Completar Mantenimiento
- [ ] Permite registrar costo real
- [ ] Permite subir factura/comprobante
- [ ] Cambia estado a "completed"
- [ ] Notifica a solicitante

#### Cancelar Mantenimiento
- [ ] Requiere motivo
- [ ] Cambia estado a "cancelled"

#### Ver Historial
- [ ] Lista de mantenimientos por propiedad
- [ ] Filtros por estado funcionan
- [ ] Filtros por prioridad funcionan

### 4.8 Índices Económicos

#### Cargar Índice
- [ ] Formulario permite seleccionar tipo (IPC, ICL)
- [ ] Formulario permite ingresar período (YYYY-MM)
- [ ] Formulario permite ingresar valor
- [ ] Valida que el índice no exista para ese período
- [ ] Guarda en `pms_economic_indices`

#### Importación Masiva
- [ ] Permite cargar múltiples índices vía Excel/CSV
- [ ] Valida formato
- [ ] Previene duplicados
- [ ] Muestra resumen de importación

#### Aplicación Automática
- [ ] Cron job detecta ajustes pendientes
- [ ] Verifica disponibilidad de índices
- [ ] Calcula factor de ajuste correctamente
- [ ] Actualiza `pms_contract_current`
- [ ] Crea registro en `pms_contract_adjustments`
- [ ] Actualiza `pms_payment_schedule_items` futuros
- [ ] Notifica a partes involucradas (opcional)

### 4.9 Tipos de Cambio

#### Sincronización Automática
- [ ] Edge function `sync-exchange-rates` funciona
- [ ] Obtiene cotización de API externa
- [ ] Guarda en `pms_exchange_rates`
- [ ] Maneja errores de API

#### Carga Manual
- [ ] Permite ingresar cotización manual
- [ ] Marca como `is_manual = true`
- [ ] Valida que no exista para esa fecha

#### Conversión de Moneda
- [ ] Hook `useCurrencyConverter` funciona
- [ ] Usa cotización de la fecha correcta
- [ ] Maneja conversión ARS <-> USD

### 4.10 Reportes

#### Reporte de Propietario
- [ ] Genera PDF con breakdown de pagos
- [ ] Incluye alquiler bruto
- [ ] Incluye gastos deducidos
- [ ] Incluye comisión inmobiliaria
- [ ] Incluye neto a transferir
- [ ] Permite descargar
- [ ] Envío automático mensual por email funciona

#### Reporte de Propiedad
- [ ] Genera reporte de ingresos/gastos
- [ ] Permite filtrar por período
- [ ] Exportar a PDF/Excel funciona

#### Reporte de Ingresos Netos
- [ ] Calcula correctamente ingresos netos por propietario
- [ ] Agrupa por período
- [ ] Permite comparar períodos

---

## 5. Testing de Portales (Propietario/Inquilino)

### 5.1 Portal Propietario

#### Acceso
- [ ] Login con credenciales de PROPIETARIO funciona
- [ ] Redirección a portal propietario
- [ ] Cambio de contraseña temporal obligatorio en primer acceso

#### Mis Propiedades
- [ ] Lista muestra solo propiedades del propietario
- [ ] Ver detalles de propiedad funciona
- [ ] Ver contratos de la propiedad funciona

#### Mis Contratos
- [ ] Lista muestra solo contratos donde es propietario
- [ ] Ver detalles de contrato funciona
- [ ] Ver proyecciones del contrato funciona

#### Pagos Recibidos
- [ ] Lista muestra pagos recibidos
- [ ] Muestra breakdown (alquiler, gastos, comisión, neto)
- [ ] Filtros por fecha funcionan
- [ ] Descargar comprobante funciona

#### Gastos
- [ ] Lista muestra gastos de sus propiedades
- [ ] Puede aprobar/rechazar gastos (si tiene permiso)
- [ ] Ver comprobantes funciona

#### Reportes Mensuales
- [ ] Accede a reportes históricos
- [ ] Descarga PDF de reportes funciona
- [ ] Recibe emails automáticos mensuales

### 5.2 Portal Inquilino

#### Acceso
- [ ] Login con credenciales de INQUILINO funciona
- [ ] Redirección a portal inquilino
- [ ] Cambio de contraseña temporal obligatorio

#### Mi Contrato
- [ ] Muestra detalles del contrato
- [ ] Muestra monto actual de alquiler
- [ ] Muestra próxima fecha de ajuste
- [ ] Muestra historial de ajustes

#### Calendario de Pagos
- [ ] Muestra calendario con pagos pendientes
- [ ] Muestra pagos realizados
- [ ] Indica días restantes para vencimiento

#### Subir Comprobantes
- [ ] Permite subir comprobante de pago
- [ ] Vincula a período/mes correcto
- [ ] Notifica a inmobiliaria (opcional)

#### Solicitudes de Mantenimiento
- [ ] Crear solicitud funciona
- [ ] Subir fotos funciona
- [ ] Ver estado de solicitudes funciona
- [ ] Recibe notificaciones de cambios

---

## 6. Testing de Seguridad (RLS Policies)

### 6.1 Row Level Security - Tenants

- [ ] Usuario de tenant A no puede ver datos de tenant B en:
  - [ ] `pms_properties`
  - [ ] `pms_owners`
  - [ ] `pms_tenants_renters`
  - [ ] `pms_contracts`
  - [ ] `pms_payments`
  - [ ] `pms_expenses`
  - [ ] `pms_maintenance_requests`
  - [ ] `pms_economic_indices` (si aplica por tenant)
  - [ ] `pms_documents`

### 6.2 RLS - Granada Platform

- [ ] GRANADA_ADMIN puede ver todos los tenants
- [ ] GRANADA_ADMIN puede ver todas las suscripciones
- [ ] GRANADA_ADMIN puede ver todos los partners
- [ ] Usuario sin rol GRANADA no puede acceder a tablas Granada

### 6.3 RLS - Client Users

- [ ] PROPIETARIO solo ve sus propiedades
- [ ] PROPIETARIO solo ve sus contratos
- [ ] PROPIETARIO solo ve sus pagos
- [ ] INQUILINO solo ve su contrato
- [ ] INQUILINO solo ve sus pagos pendientes
- [ ] ADMINISTRADOR ve todo su tenant

### 6.4 SQL Injection

- [ ] Campos de texto no permiten inyección SQL
- [ ] Búsquedas usan prepared statements
- [ ] Edge functions validan y sanitizan input

### 6.5 XSS (Cross-Site Scripting)

- [ ] Campos de texto no ejecutan scripts
- [ ] HTML en campos se escapa correctamente
- [ ] Mensajes/descripciones no permiten XSS

---

## 7. Testing de Edge Functions

### 7.1 Autenticación y Autorización

- [ ] `create-pms-user`: Solo ADMIN puede ejecutar
- [ ] `create-granada-platform-user`: Solo GRANADA_ADMIN puede ejecutar
- [ ] `delete-user`: Requiere permisos apropiados
- [ ] Funciones validan JWT token

### 7.2 Emails

- [ ] `send-welcome-email`: Envía email correctamente
- [ ] `send-payment-confirmation`: Envía a destinatarios correctos
- [ ] `send-payment-reminders`: Envía antes de vencimiento
- [ ] `send-overdue-alerts`: Envía después de vencimiento
- [ ] `send-owner-monthly-report`: Genera PDF y envía
- [ ] `send-maintenance-notification`: Notifica cambios de estado
- [ ] Emails contienen datos correctos (nombre, monto, fechas)
- [ ] Links en emails funcionan
- [ ] Manejo de errores de SMTP

### 7.3 Procesamiento de Datos

- [ ] `apply-due-index-adjustments`: Aplica ajustes correctamente
- [ ] `regenerate-schedule-items`: Regenera correctamente
- [ ] `fix-partial-payments`: Corrige inconsistencias
- [ ] `sync-exchange-rates`: Obtiene y guarda cotizaciones

### 7.4 Reportes

- [ ] `export-pdf-report`: Genera PDF correctamente
- [ ] `generate-monthly-reports-batch`: Procesa múltiples reportes
- [ ] PDFs contienen datos correctos
- [ ] PDFs se guardan en storage

### 7.5 Activación de Contratos

- [ ] `send-contract-activation-notification`: Orquesta todo el proceso
- [ ] Maneja errores de creación de usuarios
- [ ] Maneja errores de envío de emails
- [ ] Registra logs de activación

---

## 8. Testing de Performance

### 8.1 Tiempos de Carga

- [ ] Dashboard carga en < 2 segundos
- [ ] Listados con paginación cargan en < 1 segundo
- [ ] Formularios responden en < 500ms

### 8.2 Queries Optimizadas

- [ ] Queries usan índices apropiados
- [ ] No hay queries N+1
- [ ] Joins están optimizados
- [ ] Listados usan paginación

### 8.3 Carga de Datos Masivos

- [ ] Importación de 1000+ índices funciona
- [ ] Generación de schedule items para 100+ contratos
- [ ] Exportación de reportes con 1000+ registros

---

## 9. Testing de Emails

### 9.1 Contenido y Formato

- [ ] Emails tienen diseño responsive
- [ ] Imágenes/logos se cargan correctamente
- [ ] Links funcionan correctamente
- [ ] Emails se ven bien en Gmail, Outlook, Apple Mail

### 9.2 Triggers Automáticos

- [ ] Email de bienvenida al crear usuario
- [ ] Email de aprobación de suscripción
- [ ] Email de recordatorio de pago (7 días antes)
- [ ] Email de recordatorio de pago (1 día antes)
- [ ] Email de vencimiento (día del vencimiento)
- [ ] Email de mora (después de vencimiento)
- [ ] Email de reporte mensual a propietarios
- [ ] Email de notificación de ajuste de alquiler

### 9.3 Variables en Emails

- [ ] Variables se reemplazan correctamente ({{nombre}}, {{monto}}, etc.)
- [ ] Fechas se formatean correctamente
- [ ] Montos se formatean con moneda correcta

---

## 10. Testing Responsive

- [ ] Dashboard funciona en móvil (< 768px)
- [ ] Formularios son usables en móvil
- [ ] Tablas tienen scroll horizontal en móvil
- [ ] Navegación se colapsa en móvil (hamburger menu)
- [ ] Modals/dialogs se adaptan a pantalla pequeña
- [ ] Calendario de pagos es usable en tablet
- [ ] Gráficos se redimensionan correctamente

---

## 11. Testing End-to-End

### Flujo Completo: Onboarding Nueva Inmobiliaria

1. [ ] Inmobiliaria solicita suscripción desde web
2. [ ] Granada Admin aprueba solicitud
3. [ ] Tenant se crea en DB
4. [ ] CLIENT_ADMIN recibe email con credenciales
5. [ ] CLIENT_ADMIN hace login y cambia contraseña
6. [ ] CLIENT_ADMIN crea usuarios ADMINISTRADOR
7. [ ] ADMINISTRADOR recibe email y hace login
8. [ ] ADMINISTRADOR carga propietarios
9. [ ] ADMINISTRADOR carga propiedades
10. [ ] ADMINISTRADOR carga inquilinos
11. [ ] ADMINISTRADOR carga índices económicos
12. [ ] ADMINISTRADOR crea contrato
13. [ ] ADMINISTRADOR activa contrato
14. [ ] INQUILINO recibe email y hace login
15. [ ] PROPIETARIOS reciben email y hacen login
16. [ ] Sistema genera calendario de pagos automáticamente

### Flujo Completo: Ciclo de Pago Mensual

1. [ ] Sistema envía recordatorio 7 días antes
2. [ ] Sistema envía recordatorio 1 día antes
3. [ ] INQUILINO sube comprobante de pago
4. [ ] ADMINISTRADOR registra pago en sistema
5. [ ] Sistema calcula distribución
6. [ ] Sistema deduce gastos del período
7. [ ] Sistema genera reporte de propietario
8. [ ] Sistema envía reporte por email
9. [ ] PROPIETARIO recibe y descarga reporte

### Flujo Completo: Ajuste por Índice

1. [ ] Mes de ajuste llega
2. [ ] Índice ya está cargado en sistema
3. [ ] Cron job detecta ajuste pendiente
4. [ ] Sistema calcula nuevo monto
5. [ ] Sistema actualiza `pms_contract_current`
6. [ ] Sistema crea registro en `pms_contract_adjustments`
7. [ ] Sistema actualiza `payment_schedule_items` futuros
8. [ ] (Opcional) Sistema notifica a inquilino

---

## 12. Testing de Datos y Validaciones

### 12.1 Validaciones de Formularios

- [ ] Campos obligatorios muestran error al enviar vacíos
- [ ] Email valida formato correcto
- [ ] Teléfono valida formato (opcional)
- [ ] CUIT/CUIL valida formato argentino
- [ ] Fechas no permiten valores inválidos
- [ ] Montos no permiten valores negativos
- [ ] Porcentajes están entre 0-100

### 12.2 Unicidad

- [ ] Email de usuario es único en `auth.users`
- [ ] Contract number es único por tenant
- [ ] Property code/number es único por tenant (si aplica)

### 12.3 Integridad Referencial

- [ ] No permite eliminar propietario con propiedades
- [ ] No permite eliminar propiedad con contratos activos
- [ ] No permite eliminar contrato con pagos registrados
- [ ] Eliminación en cascada funciona donde es apropiado

### 12.4 Validaciones de Negocio

- [ ] Fecha de fin de contrato > fecha de inicio
- [ ] Fecha de primer ajuste >= fecha de inicio
- [ ] Monto de pago <= monto pendiente
- [ ] Suma de distribución de pago = 100% o total
- [ ] No permite dos contratos activos para misma propiedad

---

## 📊 Resumen de Testing

### Cobertura Esperada

| Módulo | Tests Críticos | Tests Recomendados | Estado |
|--------|----------------|---------------------|---------|
| Autenticación | 13 | 13 | ⏳ |
| Granada Admin | 45 | 60 | ⏳ |
| CLIENT_ADMIN | 25 | 35 | ⏳ |
| PMS - Propiedades | 20 | 25 | ⏳ |
| PMS - Contratos | 35 | 45 | ⏳ |
| PMS - Pagos | 25 | 35 | ⏳ |
| PMS - Gastos | 15 | 20 | ⏳ |
| Portales | 20 | 30 | ⏳ |
| RLS Policies | 25 | 30 | ⏳ |
| Edge Functions | 20 | 30 | ⏳ |
| Emails | 15 | 20 | ⏳ |
| **TOTAL** | **258** | **343** | ⏳ |

---

## 🚀 Checklist Pre-Producción

### Crítico (Bloqueante)

- [ ] Todos los tests de autenticación pasan
- [ ] RLS policies validadas para multi-tenancy
- [ ] Activación de contratos funciona end-to-end
- [ ] Emails de bienvenida se envían correctamente
- [ ] Calendario de pagos se genera correctamente
- [ ] No hay vulnerabilidades de seguridad conocidas

### Importante (Debe resolverse pronto)

- [ ] Performance de listados es aceptable
- [ ] Todos los reportes se generan correctamente
- [ ] Edge functions manejan errores apropiadamente
- [ ] Responsive funciona en dispositivos principales

### Deseable (Puede posponerse)

- [ ] Testing en todos los navegadores
- [ ] Optimización de queries avanzada
- [ ] Tests de carga con 1000+ usuarios concurrentes

---

**Última actualización:** 2025-11-21  
**Versión:** 1.0
