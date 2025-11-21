# 📘 Manual de Usuario - Granada Platform

## Tabla de Contenidos

- [1. Introducción](#1-introducción)
- [2. Roles y Permisos](#2-roles-y-permisos)
- [3. Arquitectura del Sistema](#3-arquitectura-del-sistema)
- [4. Granada Admin](#4-granada-admin)
- [5. Inmobiliaria / CLIENT_ADMIN](#5-inmobiliaria--client_admin)
- [6. Sistema PMS (Property Management)](#6-sistema-pms-property-management)
- [7. Portal Propietario](#7-portal-propietario)
- [8. Portal Inquilino](#8-portal-inquilino)
- [9. Procesos Automatizados](#9-procesos-automatizados)
- [10. Seguridad y Privacidad](#10-seguridad-y-privacidad)
- [11. Mejores Prácticas](#11-mejores-prácticas)
- [12. Casos de Uso Comunes](#12-casos-de-uso-comunes)
- [13. Soporte y Ayuda](#13-soporte-y-ayuda)

---

## 1. Introducción

### ¿Qué es Granada Platform?

Granada Platform es un **sistema integral de gestión inmobiliaria SaaS** que permite a inmobiliarias administrar propiedades, contratos de alquiler, pagos, gastos y generar reportes automáticos para propietarios e inquilinos.

### ¿Para quién es Granada Platform?

<lov-mermaid>
graph TD
    A[Granada Platform] --> B[Granada Admin]
    A --> C[Inmobiliarias]
    A --> D[Propietarios]
    A --> E[Inquilinos]
    
    B --> B1[Gestión de Suscripciones]
    B --> B2[Análisis del Negocio]
    B --> B3[Soporte a Clientes]
    
    C --> C1[Administración de Propiedades]
    C --> C2[Gestión de Contratos]
    C --> C3[Control de Pagos]
    
    D --> D1[Consulta de Propiedades]
    D --> D2[Reportes Mensuales]
    D --> D3[Aprobación de Gastos]
    
    E --> E1[Consulta de Contrato]
    E --> E2[Subida de Comprobantes]
    E --> E3[Solicitudes de Mantenimiento]
</lov-mermaid>

### Características Principales

✅ **Multi-tenancy**: Cada inmobiliaria tiene sus propios datos aislados  
✅ **Gestión completa de contratos**: Desde creación hasta renovación  
✅ **Ajustes automáticos**: Por índices económicos (IPC, ICL)  
✅ **Distribución de pagos**: Automática entre múltiples propietarios  
✅ **Reportes automatizados**: Envío mensual a propietarios  
✅ **Portales de autogestión**: Para propietarios e inquilinos  
✅ **Sistema de roles**: Permisos granulares por funcionalidad  
✅ **Notificaciones inteligentes**: Recordatorios de pago, vencimientos, etc.

---

## 2. Roles y Permisos

### Jerarquía de Roles

<lov-mermaid>
graph TD
    A[GRANADA_SUPERADMIN] --> B[GRANADA_ADMIN]
    B --> C[INMOBILIARIA / CLIENT_ADMIN]
    C --> D[ADMINISTRADOR]
    D --> E[PROPIETARIO]
    D --> F[INQUILINO]
    
    style A fill:#e74c3c,color:#fff
    style B fill:#e67e22,color:#fff
    style C fill:#f39c12,color:#fff
    style D fill:#3498db,color:#fff
    style E fill:#2ecc71,color:#fff
    style F fill:#9b59b6,color:#fff
</lov-mermaid>

### Descripción de Roles

| Rol | Descripción | Acceso Principal |
|-----|-------------|------------------|
| **GRANADA_SUPERADMIN** | Administrador máximo de la plataforma | Acceso total, configuración global |
| **GRANADA_ADMIN** | Administrador de Granada | Gestión de suscripciones, clientes, partners |
| **INMOBILIARIA** | Dueño de la inmobiliaria | Todas las funciones de su tenant |
| **CLIENT_ADMIN** | Administrador de inmobiliaria | Mismos permisos que INMOBILIARIA |
| **ADMINISTRADOR** | Staff administrativo | Operaciones diarias del PMS |
| **PROPIETARIO** | Dueño de propiedades | Portal de consulta y reportes |
| **INQUILINO** | Arrendatario | Portal de consulta y pagos |

### Matriz de Permisos

| Funcionalidad | GRANADA ADMIN | INMOBILIARIA | ADMINISTRADOR | PROPIETARIO | INQUILINO |
|---------------|---------------|--------------|---------------|-------------|-----------|
| Gestionar Suscripciones | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver Analytics Granada | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gestionar Equipo Admin | ❌ | ✅ | ❌ | ❌ | ❌ |
| Crear/Editar Propiedades | ❌ | ✅ | ✅ | ❌ | ❌ |
| Crear/Editar Contratos | ❌ | ✅ | ✅ | ❌ | ❌ |
| Activar Contratos | ❌ | ✅ | ✅ | ❌ | ❌ |
| Registrar Pagos | ❌ | ✅ | ✅ | ❌ | ❌ |
| Aprobar Gastos | ❌ | ✅ | ✅ | ⚠️ | ❌ |
| Ver Reportes Propios | ❌ | ❌ | ❌ | ✅ | ❌ |
| Subir Comprobantes | ❌ | ❌ | ❌ | ❌ | ✅ |
| Solicitar Mantenimiento | ❌ | ❌ | ❌ | ⚠️ | ✅ |

⚠️ = Permiso condicional o limitado

---

## 3. Arquitectura del Sistema

### Flujo de Datos Principal

<lov-mermaid>
graph LR
    A[Login] --> B{Rol?}
    B -->|GRANADA_ADMIN| C[Dashboard Granada]
    B -->|INMOBILIARIA| D[Dashboard PMS]
    B -->|PROPIETARIO| E[Portal Propietario]
    B -->|INQUILINO| F[Portal Inquilino]
    
    D --> G[Propiedades]
    G --> H[Contratos]
    H --> I[Pagos]
    I --> J[Reportes]
    
    H --> K[Gastos]
    K --> I
    
    style A fill:#3498db,color:#fff
    style C fill:#e67e22,color:#fff
    style D fill:#f39c12,color:#fff
    style E fill:#2ecc71,color:#fff
    style F fill:#9b59b6,color:#fff
</lov-mermaid>

### Módulos del Sistema

| Módulo | Descripción |
|--------|-------------|
| **Granada Admin** | Gestión de la plataforma, suscripciones y clientes |
| **PMS** | Sistema de gestión de propiedades (Property Management System) |
| **Portales** | Interfaces de autogestión para propietarios e inquilinos |
| **Automatizaciones** | Procesos programados (emails, ajustes, reportes) |

---

## 4. Granada Admin

### 4.1 Dashboard y Analytics

El dashboard de Granada Admin proporciona una vista general del negocio de la plataforma.

#### KPIs Principales

- **MRR (Monthly Recurring Revenue)**: Ingresos recurrentes mensuales
- **ARR (Annual Recurring Revenue)**: Ingresos recurrentes anuales
- **Total de Clientes**: Número de inmobiliarias activas
- **Tasa de Churn**: Porcentaje de clientes que cancelan

#### Gráficos Disponibles

<lov-mermaid>
pie title Distribución de Suscripciones por Plan
    "Plan Básico" : 45
    "Plan Profesional" : 35
    "Plan Enterprise" : 15
    "Trial" : 5
</lov-mermaid>

### 4.2 Gestión de Solicitudes de Suscripción

#### Proceso de Aprobación

<lov-mermaid>
sequenceDiagram
    participant C as Cliente
    participant W as Web
    participant GA as Granada Admin
    participant S as Sistema
    participant E as Email
    
    C->>W: Completa formulario
    W->>S: Crea solicitud
    S->>GA: Notifica nueva solicitud
    GA->>S: Aprueba solicitud
    S->>S: Crea Tenant
    S->>S: Crea CLIENT_ADMIN
    S->>S: Genera contraseña temporal
    S->>E: Envía email bienvenida
    E->>C: Email con credenciales
    C->>W: Primer login
    C->>S: Cambia contraseña
</lov-mermaid>

#### Pasos para Aprobar una Solicitud

1. **Acceder a Solicitudes Pendientes**
   - Navegar a `Granada Admin > Solicitudes de Suscripción`
   - Ver lista de solicitudes con estado "Pending"

2. **Revisar Detalles**
   - Hacer clic en una solicitud
   - Verificar datos de la empresa
   - Verificar plan seleccionado

3. **Aprobar**
   - Hacer clic en "Aprobar"
   - Confirmar acción

4. **Acciones Automáticas del Sistema**
   - ✅ Crea `tenant` en `pms_tenants`
   - ✅ Crea `CLIENT_ADMIN` en `granada_platform_users`
   - ✅ Crea usuario en `auth.users` con contraseña temporal
   - ✅ Crea suscripción en `pms_tenant_subscriptions`
   - ✅ Envía email de bienvenida con:
     - Enlace de acceso
     - Email de usuario
     - Contraseña temporal
     - Instrucciones de primer login

### 4.3 Gestión de Clientes (Inmobiliarias)

#### Ver Detalles de Cliente

Información disponible:
- Datos de empresa
- Plan actual
- Límites de suscripción
- Uso actual (propiedades, usuarios, contratos)
- Historial de pagos
- Historial de cambios de plan

#### Cambiar Plan de Suscripción

<lov-mermaid>
graph TD
    A[Seleccionar Cliente] --> B[Ver Suscripción Actual]
    B --> C[Seleccionar Nuevo Plan]
    C --> D{¿Plan superior?}
    D -->|Sí| E[Upgrade inmediato]
    D -->|No| F[Downgrade al próximo ciclo]
    E --> G[Actualizar límites]
    F --> G
    G --> H[Notificar por email]
    H --> I[Registrar en historial]
</lov-mermaid>

**Pasos:**
1. Navegar a `Clientes > [Nombre Cliente] > Suscripción`
2. Hacer clic en "Cambiar Plan"
3. Seleccionar nuevo plan
4. Confirmar cambio
5. Sistema notifica automáticamente al cliente

#### Suspender Cliente

⚠️ **Precaución**: Esta acción deshabilita el acceso pero **no elimina datos**.

**Casos de uso:**
- Falta de pago
- Violación de términos de servicio
- Solicitud del cliente

**Efecto:**
- Usuarios del tenant no pueden hacer login
- Datos permanecen intactos en la base de datos
- Puede reactivarse en cualquier momento

### 4.4 Gestión de Planes de Suscripción

#### Crear Nuevo Plan

Campos configurables:
- **Nombre del plan**
- **Descripción**
- **Precio mensual**
- **Moneda** (ARS, USD)
- **Límites:**
  - Número máximo de propiedades
  - Número máximo de usuarios
  - Número máximo de contratos activos
  - Almacenamiento (GB)
- **Período de prueba** (días)
- **Características incluidas** (lista de bullets)

#### Comparador de Planes

<lov-mermaid>
graph LR
    A[Plan Básico] -->|10 propiedades| B[Plan Profesional]
    B -->|50 propiedades| C[Plan Enterprise]
    C -->|Ilimitado| D[Plan Custom]
    
    A -->|3 usuarios| B
    B -->|15 usuarios| C
    C -->|Ilimitado| D
    
    style A fill:#95a5a6,color:#fff
    style B fill:#3498db,color:#fff
    style C fill:#9b59b6,color:#fff
    style D fill:#e74c3c,color:#fff
</lov-mermaid>

### 4.5 Gestión de Suscripciones

#### Estados de Suscripción

| Estado | Descripción | Acceso |
|--------|-------------|--------|
| `trial` | Período de prueba | ✅ Completo |
| `active` | Suscripción pagada activa | ✅ Completo |
| `suspended` | Suspendida por falta de pago | ❌ Sin acceso |
| `cancelled` | Cancelada por el cliente | ❌ Sin acceso |
| `expired` | Trial expirado sin conversión | ❌ Sin acceso |

#### Convertir Trial a Paid

<lov-mermaid>
sequenceDiagram
    participant GA as Granada Admin
    participant S as Sistema
    participant C as Cliente
    participant E as Email
    
    GA->>S: Convierte trial a paid
    S->>S: Actualiza estado a "active"
    S->>S: Actualiza trial_ends_at = null
    S->>S: Registra fecha conversión
    S->>E: Envía confirmación
    E->>C: Email bienvenida plan pago
</lov-mermaid>

**Pasos:**
1. Navegar a `Suscripciones`
2. Filtrar por estado "trial"
3. Seleccionar suscripción
4. Hacer clic en "Convertir a Plan Pago"
5. Seleccionar plan definitivo
6. Confirmar conversión

### 4.6 Gestión de Partners

Granada Platform permite mostrar un directorio de empresas asociadas (constructoras, bancos, servicios).

#### Crear Partner

Campos:
- Nombre de la empresa
- Tipo (Constructora, Banco, Servicio, Tasador, Seguro, etc.)
- Logo (imagen)
- Descripción
- Sitio web
- Redes sociales (Facebook, Instagram, LinkedIn, etc.)
- Ubicación (Provincia, Ciudad, Barrio)
- Destacado (sí/no)
- Activo (sí/no)

#### Directorio Público

Los partners marcados como "destacados" aparecen en:
- Landing page de Granada
- Sección "Partners" del sitio público
- Carrusel de empresas confiables

### 4.7 Gestión de Contactos

Todos los formularios de contacto de la plataforma web se centralizan aquí.

#### Funcionalidades

- **Ver lista de contactos** con filtros por:
  - Estado (Nuevo, En proceso, Contactado, Cerrado)
  - Prioridad (Alta, Media, Baja)
  - Fuente (Web Granada, Web PMS, Formulario Partners)
- **Asignar contacto** a un usuario para seguimiento
- **Cambiar estado** del contacto
- **Agregar notas internas**
- **Registrar acciones** (Llamada, Email, Reunión, etc.)
- **Ver historial** de acciones por contacto

---

## 5. Inmobiliaria / CLIENT_ADMIN

### 5.1 Dashboard

El dashboard de la inmobiliaria proporciona una vista general de su operación.

#### KPIs

- **Propiedades totales**
- **Propiedades ocupadas**
- **Tasa de ocupación (%)**
- **Contratos activos**
- **Pagos pendientes este mes**
- **Ingresos del mes**

#### Gráficos

<lov-mermaid>
pie title Propiedades por Estado
    "Ocupadas" : 65
    "Disponibles" : 25
    "En Mantenimiento" : 10
</lov-mermaid>

### 5.2 Equipo Administrativo

⚡ **NUEVO**: Gestión completa del equipo administrativo de la inmobiliaria.

#### Tipos de Usuarios Administrativos

1. **CLIENT_ADMIN**
   - Mismo nivel de permisos que el INMOBILIARIA original
   - Puede gestionar todo el tenant
   - Puede crear otros administradores

2. **ADMINISTRADOR**
   - Permisos de operación diaria en PMS
   - No puede gestionar suscripción
   - No puede crear otros administradores

#### Agregar Administrador (CLIENT_ADMIN)

<lov-mermaid>
sequenceDiagram
    participant CA as CLIENT_ADMIN
    participant S as Sistema
    participant DB as Base de Datos
    participant E as Email
    participant NA as Nuevo Admin
    
    CA->>S: Completa formulario
    S->>DB: Crea en granada_platform_users
    S->>DB: Crea en auth.users
    S->>S: Genera contraseña temporal
    S->>E: Envía email bienvenida
    E->>NA: Email con credenciales
    NA->>S: Primer login
    NA->>S: Cambia contraseña
</lov-mermaid>

**Pasos:**
1. Navegar a `Equipo Administrativo`
2. Hacer clic en "Agregar Administrador"
3. Completar formulario:
   - Nombre
   - Apellido
   - Email
   - Tipo: CLIENT_ADMIN
4. Hacer clic en "Crear"
5. Sistema envía email automáticamente con:
   - Usuario: [email]
   - Contraseña temporal
   - Enlace de acceso
   - Instrucciones

#### Agregar Usuario Staff (ADMINISTRADOR)

Similar al proceso anterior, pero:
- Se crea en `pms_client_users` en lugar de `granada_platform_users`
- Tiene permisos limitados al PMS
- No puede acceder a `/client-admin`

### 5.3 Analytics

Reportes y gráficos sobre la operación:

- **Ingresos mensuales**: Evolución en el tiempo
- **Ocupación**: Tasa de ocupación histórica
- **Pagos**: Tasa de pago a tiempo vs. atrasados
- **Propiedades**: Distribución por tipo, zona, etc.
- **Contratos**: Distribución por duración, tipo

### 5.4 Reportes

Generación de reportes consolidados:

- Reporte de ingresos por propiedad
- Reporte de gastos por categoría
- Reporte de comisiones generadas
- Exportar a PDF o Excel

### 5.5 Mi Suscripción

#### Ver Detalles del Plan

Muestra:
- Plan actual
- Precio mensual
- Fecha de renovación
- Límites del plan
- Uso actual

#### Alertas de Límites

<lov-mermaid>
graph TD
    A[Uso Actual] --> B{¿Porcentaje?}
    B -->|< 80%| C[Sin alerta]
    B -->|80-89%| D[⚠️ Alerta Amarilla]
    B -->|90-99%| E[🔶 Alerta Naranja]
    B -->|≥ 100%| F[🛑 Límite Alcanzado]
    
    D --> G[Mensaje sugerencia upgrade]
    E --> H[Mensaje recomendación upgrade]
    F --> I[Bloqueo de nuevas creaciones]
    
    style C fill:#2ecc71,color:#fff
    style D fill:#f1c40f,color:#000
    style E fill:#e67e22,color:#fff
    style F fill:#e74c3c,color:#fff
</lov-mermaid>

**Comportamiento del sistema:**
- **80%**: Muestra alerta informativa
- **90%**: Muestra alerta de advertencia
- **100%**: Bloquea creación de nuevos registros (propiedades, contratos, usuarios)

#### Solicitar Cambio de Plan

1. Navegar a `Mi Suscripción`
2. Hacer clic en "Cambiar Plan"
3. Ver comparador de planes
4. Seleccionar nuevo plan
5. Enviar solicitud
6. Granada Admin revisa y aprueba

#### Subir Comprobante de Pago

Para suscripciones con pago manual:
1. Navegar a `Mi Suscripción > Pagos`
2. Hacer clic en "Subir Comprobante"
3. Seleccionar archivo (PDF, JPG, PNG)
4. Indicar mes de pago
5. Enviar
6. Granada Admin verifica pago

### 5.6 Configuración de Empresa

Permite editar:
- **Datos de la empresa:**
  - Razón social
  - CUIT
  - Dirección
  - Teléfono
  - Email de contacto
  - Sitio web
  - Logo

- **Datos bancarios:**
  - Banco
  - Tipo de cuenta
  - Número de cuenta
  - CBU/Alias
  - Titular

Estos datos se usan en:
- Distribuciones de pago
- Reportes generados
- Emails automáticos

---

## 6. Sistema PMS (Property Management)

### 6.1 Dashboard PMS

Vista principal para ADMINISTRADOR e INMOBILIARIA.

#### Módulos Principales

<lov-mermaid>
graph TB
    A[Dashboard PMS] --> B[Propiedades]
    A --> C[Propietarios]
    A --> D[Inquilinos]
    A --> E[Contratos]
    A --> F[Pagos]
    A --> G[Gastos]
    A --> H[Mantenimiento]
    A --> I[Reportes]
    A --> J[Índices Económicos]
    A --> K[Tipos de Cambio]
    
    style A fill:#3498db,color:#fff
    style E fill:#e74c3c,color:#fff
    style F fill:#2ecc71,color:#fff
</lov-mermaid>

### 6.2 Propiedades

#### Crear Propiedad

**Campos obligatorios:**
- Dirección completa
- Tipo (Casa, Departamento, Local, Oficina, Galpón, etc.)
- Superficie (m²)
- Ambientes
- Baños

**Campos opcionales:**
- Código interno
- Descripción
- Amenities
- Características especiales
- Coordenadas GPS

**Subir Fotos:**
- Permite múltiples fotos
- Almacenamiento en Supabase Storage
- Máximo 10 fotos por propiedad (configurable)

#### Estados de Propiedad

| Estado | Descripción | Color |
|--------|-------------|-------|
| Disponible | Lista para alquilar | 🟢 Verde |
| Ocupada | Con contrato activo | 🔵 Azul |
| Mantenimiento | Fuera de servicio | 🟡 Amarillo |
| Reservada | Pre-asignada | 🟠 Naranja |

**Cambio automático de estado:**
- Al activar contrato: `Disponible` → `Ocupada`
- Al cancelar contrato: `Ocupada` → `Disponible`

#### Clonar Propiedad

Útil para propiedades similares (ej: departamentos en mismo edificio).

**Pasos:**
1. Seleccionar propiedad origen
2. Hacer clic en "Clonar"
3. Modificar datos específicos (ej: número de unidad)
4. Guardar

**Datos que se copian:**
- Dirección base
- Tipo
- Superficie
- Amenities
- Características

**Datos que NO se copian:**
- Fotos (opcional)
- Contratos
- Historial de pagos

#### Ver Performance de Propiedad

Métricas disponibles:
- Tasa de ocupación histórica
- Ingresos totales generados
- Gastos totales
- ROI (Return on Investment)
- Tiempo promedio de vacancia

### 6.3 Propietarios

#### Crear Propietario

**Datos personales:**
- Nombre completo
- CUIT/CUIL
- DNI
- Email
- Teléfono
- Dirección

**Datos bancarios:**
- Banco
- Tipo de cuenta
- Número de cuenta
- CBU/Alias

**Configuración de reportes:**
- Frecuencia de envío (Mensual, Trimestral)
- Email alternativo para reportes
- Formato preferido (PDF, Excel)

#### Crear Acceso al Portal

✨ **Importante**: Esta opción permite al propietario acceder a su portal web.

<lov-mermaid>
sequenceDiagram
    participant A as ADMINISTRADOR
    participant S as Sistema
    participant DB as Base de Datos
    participant E as Email
    participant P as Propietario
    
    A->>S: Activa "Crear acceso al portal"
    S->>DB: Crea en pms_client_users
    S->>DB: Asocia owner_id
    S->>DB: Crea en auth.users
    S->>S: Genera contraseña temporal
    S->>E: Envía email bienvenida
    E->>P: Email con credenciales
    P->>S: Primer login al portal
    P->>S: Cambia contraseña
</lov-mermaid>

**Email de bienvenida incluye:**
- Enlace al portal: `https://[dominio]/pms/login`
- Usuario: [email del propietario]
- Contraseña temporal
- Instrucciones de primer acceso

**Permisos del propietario en portal:**
- Ver sus propiedades
- Ver contratos de sus propiedades
- Ver pagos recibidos (con breakdown)
- Ver y aprobar gastos de sus propiedades
- Descargar reportes mensuales

#### Asociar Propietarios a Propiedades

Una propiedad puede tener múltiples propietarios (copropiedad).

**Configurar porcentaje de participación:**
1. Ir a `Propiedades > [Propiedad] > Propietarios`
2. Hacer clic en "Agregar Propietario"
3. Seleccionar propietario
4. Indicar porcentaje (ej: 50%)
5. Guardar

⚠️ **Validación**: La suma de porcentajes debe ser 100%

**Efecto en distribución de pagos:**
- Los pagos se distribuyen automáticamente según porcentaje
- Cada propietario recibe su reporte individual

### 6.4 Inquilinos (Renters)

#### Crear Inquilino

Similar a propietarios, pero sin datos bancarios iniciales.

**Campos:**
- Nombre completo
- CUIT/CUIL
- DNI
- Email
- Teléfono
- Dirección actual
- Datos de garante (opcional)

**Importante**: El usuario portal del inquilino se crea automáticamente al **activar el contrato**, no al crear el registro de inquilino.

### 6.5 Contratos

⚡ **Módulo más crítico del sistema**

#### Crear Contrato - Información Básica

**Paso 1: Datos del Contrato**
- Número de contrato (auto-generado o manual)
- Propiedad
- Inquilino
- Fecha de inicio
- Fecha de fin
- Tipo de contrato (Alquiler, Alquiler temporario, Comercial)

**Paso 2: Condiciones Económicas**

<lov-mermaid>
graph TD
    A[Condiciones Económicas] --> B[Alquiler Base]
    A --> C[Ítems Adicionales]
    A --> D[Depósito en Garantía]
    
    B --> B1[Monto]
    B --> B2[Moneda ARS/USD]
    B --> B3[Día de pago]
    
    C --> C1[Expensas]
    C --> C2[Servicios]
    C --> C3[Otros]
    
    D --> D1[Monto]
    D --> D2[Moneda]
    
    style A fill:#3498db,color:#fff
    style B fill:#2ecc71,color:#fff
    style C fill:#f39c12,color:#fff
    style D fill:#9b59b6,color:#fff
</lov-mermaid>

**Ítems del contrato:**

Cada contrato puede tener múltiples ítems:

| Ítem | Descripción | Ejemplo |
|------|-------------|---------|
| **Item A - Alquiler** | Monto base del alquiler | $100,000 |
| **Item B - Expensas** | Expensas comunes | $15,000 |
| **Servicios** | Luz, gas, agua (opcional) | $10,000 |
| **Otros** | Cualquier concepto adicional | $5,000 |

**Paso 3: Configuración de Ajustes por Índice**

Configuración clave para ajustes automáticos:

- **Índice de ajuste:**
  - IPC (Índice de Precios al Consumidor)
  - ICL (Índice de Contratos de Locación)
  - Sin ajuste

- **Frecuencia:**
  - Mensual
  - Trimestral
  - Semestral
  - Anual

- **Fecha de primer ajuste:** Ej: 2025-04-01

- **Aplica a ítems:**
  - Solo Alquiler
  - Alquiler + Expensas
  - Todos los ítems

- **Modo de redondeo:**
  - Sin redondeo
  - Centena ($100)
  - Millar ($1,000)

**Ejemplo de configuración:**
```
Alquiler inicial: $100,000
Índice: IPC
Frecuencia: Trimestral
Primer ajuste: 2025-04-01
Redondeo: Millar
```

**Proyección:**
- 2025-01 a 2025-03: $100,000
- 2025-04: $100,000 × (IPC Ene/Oct) = $108,456 → **$108,000** (redondeado)

**Paso 4: Métodos de Pago y Distribución**

Configurar cómo se paga cada ítem y cómo se distribuye entre propietarios.

**Método de pago por ítem:**
- Transferencia bancaria
- Efectivo
- Cheque
- Débito automático

**Distribución entre propietarios:**

Si la propiedad tiene múltiples dueños:

| Propietario | % Participación | Cuenta Bancaria |
|-------------|-----------------|-----------------|
| Juan Pérez | 60% | CBU: 123456... |
| María López | 40% | CBU: 789012... |

**Distribución automática:**
- Sistema calcula monto a transferir a cada uno
- Deduce gastos proporcionalmente
- Aplica comisión de administración (si existe)

**Paso 5: Documentos del Contrato**

Subir documentos relevantes:
- Contrato firmado (PDF)
- Comprobante de depósito
- Garantía
- DNI de partes
- Otros

**Almacenamiento:**
- Supabase Storage bucket: `contract-documents`
- Estructura: `/{tenant_id}/{contract_id}/{filename}`

#### Activar Contrato 🚀

⚡ **ACCIÓN CRÍTICA**: Esta es la operación más importante del sistema.

**Validaciones previas:**

Antes de activar, el sistema verifica:
- ✅ Propiedad existe y está disponible
- ✅ Inquilino existe
- ✅ Fechas son válidas (inicio < fin)
- ✅ Propietarios están asociados a la propiedad
- ✅ Suma de % de propietarios = 100%
- ✅ Índices económicos necesarios están cargados (si aplica)
- ✅ No existe otro contrato activo para esa propiedad

**Acciones automáticas al activar:**

<lov-mermaid>
sequenceDiagram
    participant A as ADMINISTRADOR
    participant S as Sistema
    participant DB as Base de Datos
    participant E as Email System
    participant SA as SUPERADMIN
    participant IM as INMOBILIARIA
    participant IN as Inquilino
    participant P1 as Propietario 1
    participant P2 as Propietario 2
    
    A->>S: Click "Activar Contrato"
    S->>DB: Validaciones previas
    S->>DB: Cambiar estado a "active"
    S->>DB: Crear pms_contract_current
    S->>DB: Generar payment_schedule_items
    
    Note over S,DB: Creación de Usuarios Portal
    
    S->>DB: Crear usuario INQUILINO
    S->>DB: Crear usuarios PROPIETARIOS
    
    Note over S,E: Envío de Emails
    
    S->>E: Email a SUPERADMIN
    E->>SA: "Contrato CTR-001 activado"
    
    S->>E: Email a INMOBILIARIA
    E->>IM: "Contrato activado exitosamente"
    
    S->>E: Email bienvenida INQUILINO
    E->>IN: "Credenciales portal: user@mail.com / temp123"
    
    S->>E: Email bienvenida PROPIETARIO 1
    E->>P1: "Credenciales portal: prop1@mail.com / temp456"
    
    S->>E: Email bienvenida PROPIETARIO 2
    E->>P2: "Credenciales portal: prop2@mail.com / temp789"
    
    S->>DB: Registrar en activation_logs
    S->>DB: Cambiar propiedad a "Ocupada"
</lov-mermaid>

**1. Actualización de estado**
```sql
UPDATE pms_contracts 
SET status = 'active', 
    activated_at = NOW()
WHERE id = [contract_id];
```

**2. Creación de registro actual**
```sql
INSERT INTO pms_contract_current (
  contract_id,
  tenant_id,
  current_amount,
  current_from,
  next_adjustment_date
) VALUES (...);
```

**3. Generación de calendario de pagos**

Para cada mes del contrato, crea un ítem en `pms_payment_schedule_items`:

```javascript
// Ejemplo: Contrato 24 meses = 24 registros
for (month = 1; month <= duration; month++) {
  create_schedule_item({
    contract_id,
    month_number: month,
    period_date: calculate_period(start_date, month),
    item: 'ALQUILER',
    base_amount: monthly_rent,
    adjusted_amount: calculate_with_index(month),
    status: 'pending'
  });
}
```

**4. Creación de usuarios portal**

**Para el INQUILINO:**
```sql
-- Si no existe usuario con ese email
INSERT INTO pms_client_users (
  tenant_id,
  user_id, -- referencia a auth.users
  email,
  user_type,
  contract_id
) VALUES (...);

-- Crear en auth.users
INSERT INTO auth.users (
  email,
  encrypted_password, -- temporal generada
  email_confirmed_at
) VALUES (...);
```

**Para cada PROPIETARIO:**
```sql
-- Similar al inquilino, pero con user_type = 'PROPIETARIO'
-- Y asociando owner_id
```

**5. Envío de emails**

| Destinatario | Asunto | Contenido |
|--------------|--------|-----------|
| SUPERADMIN | Contrato [número] activado | Datos del contrato, link al detalle |
| INMOBILIARIA/ADMIN | Contrato activado exitosamente | Resumen, próximos pasos |
| INQUILINO | Bienvenido a tu Portal Granada | Usuario, contraseña temporal, link login |
| PROPIETARIO(S) | Bienvenido a tu Portal Granada | Usuario, contraseña temporal, link login, info del contrato |

**6. Registro de activación**

```sql
INSERT INTO pms_contract_activation_logs (
  contract_id,
  tenant_id,
  owners_created,
  tenant_created,
  owners_notified,
  tenant_notified,
  superadmin_notified,
  admin_notified,
  owner_emails,
  errors
) VALUES (...);
```

**7. Cambio de estado de propiedad**

```sql
UPDATE pms_properties
SET status = 'Ocupada'
WHERE id = [property_id];
```

**Manejo de errores:**

Si algún paso falla:
- Se registra en `errors` del log de activación
- Se notifica al SUPERADMIN
- El contrato permanece en estado "draft"
- Se puede reintentar la activación

#### Ver Proyecciones Mensuales del Contrato

Después de crear el contrato, puedes ver cómo se proyectan los montos mes a mes.

**Tabla de proyecciones:**

| Mes | Período | Alquiler Base | Ajuste | % Ajuste | Alquiler Ajustado | Índices Usados | Estado |
|-----|---------|---------------|--------|----------|-------------------|----------------|--------|
| 1 | 2025-01 | $100,000 | $0 | 0% | $100,000 | - | ✅ |
| 2 | 2025-02 | $100,000 | $0 | 0% | $100,000 | - | ✅ |
| 3 | 2025-03 | $100,000 | $0 | 0% | $100,000 | - | ✅ |
| 4 | 2025-04 | $100,000 | $8,000 | 8% | $108,000 | IPC Ene/Oct | ⏳ Pendiente |
| ... | ... | ... | ... | ... | ... | ... | ... |

**Estados:**
- ✅ **Índices disponibles**: El ajuste se puede calcular
- ⏳ **Índices pendientes**: Faltan índices por cargar

**Recalcular proyecciones:**

Si se cargan nuevos índices o se corrigen valores:
1. Ir a `Contratos > [Contrato] > Proyecciones`
2. Click en "Recalcular"
3. Sistema actualiza todos los períodos futuros

#### Ver Ajustes Aplicados

Historial de ajustes ya ejecutados.

**Tabla de ajustes:**

| Fecha Aplicación | Período Desde | Período Hasta | Factor | % Acumulado | Monto Previo | Monto Nuevo |
|------------------|---------------|---------------|--------|-------------|--------------|-------------|
| 2025-04-01 | 2024-10 | 2025-01 | 1.08 | 8% | $100,000 | $108,000 |
| 2025-07-01 | 2025-01 | 2025-04 | 1.05 | 13.4% | $108,000 | $113,400 |

**Detalle de un ajuste:**
- Índice utilizado (IPC, ICL)
- Valores del índice en ambos períodos
- Cálculo del factor
- Monto antes y después
- Ítems afectados (Alquiler, Expensas, etc.)

#### Renovar Contrato

Cuando un contrato está próximo a vencer, se puede renovar.

<lov-mermaid>
graph TD
    A[Contrato Original] --> B{¿Renovar?}
    B -->|Sí| C[Crear Contrato Renovación]
    B -->|No| D[Finalizar Contrato]
    
    C --> E[Nuevo período]
    C --> F[Ajustar monto]
    C --> G[Mantener configuración]
    
    E --> H[Nuevo contract_number]
    F --> H
    G --> H
    
    H --> I[Generar nuevo calendario]
    I --> J[Vincular a parent_contract]
    
    D --> K[Cambiar estado a 'completed']
    K --> L[Liberar propiedad]
    
    style A fill:#3498db,color:#fff
    style C fill:#2ecc71,color:#fff
    style D fill:#e74c3c,color:#fff
</lov-mermaid>

**Proceso:**
1. Ir a `Contratos > [Contrato] > Acciones > Renovar`
2. Sistema pre-completa datos:
   - Misma propiedad
   - Mismo inquilino
   - Monto: último monto ajustado del contrato anterior
3. Ajustar:
   - Fecha inicio (generalmente día siguiente al fin del anterior)
   - Fecha fin (nueva duración)
   - Monto (si se acuerda cambio)
4. Guardar
5. Sistema:
   - Crea nuevo contrato con `parent_contract_id` = ID del anterior
   - Genera `contract_number` con sufijo: `CTR-001-R1` (renovación 1)
   - Incrementa `renewal_count`
   - Cambia estado del anterior a `completed`
   - Mantiene propiedad como `Ocupada`

**Ventajas:**
- Historial completo de renovaciones
- Tracking de relación inquilino-propiedad a largo plazo
- No pierde información del contrato anterior

#### Extender Contrato

Si solo necesitas extender la duración sin crear contrato nuevo.

**Proceso:**
1. Ir a `Contratos > [Contrato] > Acciones > Extender`
2. Indicar nueva fecha de fin
3. Confirmar
4. Sistema:
   - Actualiza `end_date`
   - Genera `payment_schedule_items` para los nuevos meses
   - Mantiene mismo `contract_number`

**Uso típico:**
- Extensión corta (1-3 meses)
- Sin cambio de condiciones económicas

#### Cancelar Contrato

Para finalizar un contrato antes de su vencimiento.

**Proceso:**
1. Ir a `Contratos > [Contrato] > Acciones > Cancelar`
2. Indicar motivo:
   - Mutuo acuerdo
   - Incumplimiento inquilino
   - Incumplimiento propietario
   - Venta de propiedad
   - Otro (especificar)
3. Confirmar
4. Sistema:
   - Cambia estado a `cancelled`
   - Registra `cancelled_at`, `cancelled_by`, `cancellation_reason`
   - Cambia propiedad a `Disponible`
   - Mantiene historial de pagos intacto
   - Desactiva acceso del inquilino al portal (opcional)

⚠️ **No se elimina información**, solo se marca como cancelado.

#### Documentos del Contrato

**Ver documentos:**
- Listado de todos los documentos subidos
- Preview inline para PDFs e imágenes
- Descarga directa

**Subir nuevo documento:**
1. Click en "Agregar Documento"
2. Seleccionar tipo:
   - Contrato firmado
   - Addenda
   - Comprobante depósito
   - Garantía
   - Inventario
   - Otro
3. Seleccionar archivo
4. (Opcional) Agregar descripción
5. Upload

**Eliminar documento:**
- Solo ADMINISTRADOR/INMOBILIARIA
- Confirmación requerida
- Se elimina de storage

### 6.6 Pagos

El módulo de pagos permite registrar los pagos de alquiler y gestionar la distribución a propietarios.

#### Calendario de Pagos

Vista principal: matriz de contratos vs. meses.

<lov-mermaid>
graph LR
    A[Calendario] --> B[Contratos en filas]
    A --> C[Meses en columnas]
    
    B --> D[Contrato 1]
    B --> E[Contrato 2]
    B --> F[Contrato N]
    
    C --> G[Enero]
    C --> H[Febrero]
    C --> I[Diciembre]
    
    D --> J[Celda: Estado del pago]
    
    J --> K{Color?}
    K -->|Verde| L[Pagado]
    K -->|Amarillo| M[Pendiente]
    K -->|Rojo| N[Vencido]
    K -->|Gris| O[Pago parcial]
    
    style L fill:#2ecc71,color:#fff
    style M fill:#f1c40f,color:#000
    style N fill:#e74c3c,color:#fff
    style O fill:#95a5a6,color:#fff
</lov-mermaid>

**Click en celda:**
Abre modal con detalle del pago del mes:

```
Contrato: CTR-001 - Propiedad: Av. Libertador 1234
Período: Enero 2025
Estado: Pendiente
Vencimiento: 2025-01-10

DETALLE:
Alquiler:         $108,000
Expensas:         $ 15,000
Servicios:        $ 10,000
                  -----------
TOTAL:            $133,000

Gastos deducibles: -$ 5,000
                  -----------
NETO A PROPIETARIOS: $128,000

Distribución:
- Juan Pérez (60%):  $ 76,800
- María López (40%): $ 51,200
```

#### Registrar Pago

**Desde el calendario:**
1. Click en celda del mes
2. Click en "Registrar Pago"
3. Completar formulario:
   - Fecha de pago (default: hoy)
   - Monto (puede ser total o parcial)
   - Método de pago
   - Referencia/Nro. de transacción
   - Subir comprobante (opcional)
4. Guardar

**Desde listado de pagos pendientes:**
1. Ir a `Pagos > Pendientes`
2. Seleccionar pago
3. Click "Registrar"
4. Completar formulario similar

**Acciones del sistema:**

<lov-mermaid>
sequenceDiagram
    participant A as ADMINISTRADOR
    participant S as Sistema
    participant DB as Base de Datos
    participant E as Email
    
    A->>S: Registra pago $133,000
    S->>DB: Crea registro en pms_payments
    S->>S: Calcula distribución
    
    Note over S: Deduce gastos del período
    
    S->>DB: Busca gastos aprobados del período
    S->>S: Total gastos: $5,000
    S->>S: Monto distribuible: $128,000
    
    Note over S: Distribuye según %
    
    S->>DB: Crea pms_payment_distributions
    S->>DB: Juan Pérez: $76,800
    S->>DB: María López: $51,200
    
    S->>DB: Actualiza payment_schedule_items
    S->>DB: Estado: 'paid'
    
    S->>E: Email confirmación a inquilino
    S->>E: Notifica a propietarios (opcional)
</lov-mermaid>

#### Pagos Parciales

Si el inquilino paga en cuotas:

**Ejemplo:**
- Total del mes: $133,000
- Pago 1: $80,000 (día 5)
- Pago 2: $53,000 (día 15)

**Registro:**
1. Registrar primer pago: $80,000
   - Estado queda: `partial_payment`
2. Registrar segundo pago: $53,000
   - Sistema suma: $80,000 + $53,000 = $133,000
   - Estado cambia a: `paid`

**Vista en calendario:**
- Mientras esté incompleto: celda color gris con icono ⚠️
- Al completar: celda color verde ✅

#### Distribución Automática de Pagos

El sistema calcula automáticamente cuánto corresponde a cada propietario.

**Fórmula:**

```
Monto bruto = Alquiler + Expensas + Servicios
Gastos deducibles = Σ gastos aprobados del período
Comisión inmobiliaria = Monto bruto × % comisión
Monto distribuible = Monto bruto - Gastos - Comisión

Por cada propietario:
  Monto propietario = Monto distribuible × % participación
```

**Ejemplo con 2 propietarios:**

```
Alquiler:           $108,000
Expensas:           $ 15,000
Servicios:          $ 10,000
                    ---------
BRUTO:              $133,000

Gastos:             -$ 5,000
Comisión (8%):      -$10,640
                    ---------
DISTRIBUIBLE:       $117,360

Propietario A (60%): $ 70,416
Propietario B (40%): $ 46,944
```

**Registro en base de datos:**

```sql
INSERT INTO pms_payment_distributions (
  payment_id,
  owner_id,
  amount_gross,
  deducted_expenses,
  commission_amount,
  net_amount,
  percentage
) VALUES
  ([payment_id], [owner_a_id], 79800, 3000, 6384, 70416, 60),
  ([payment_id], [owner_b_id], 53200, 2000, 4256, 46944, 40);
```

#### Configurar Cuentas Bancarias para Distribución

Para que el sistema indique dónde transferir a cada propietario:

1. Ir a `Propietarios > [Propietario] > Datos Bancarios`
2. Completar:
   - Banco
   - Tipo de cuenta (CA, CC)
   - Número de cuenta
   - CBU
   - Alias
3. Guardar

**Efecto:**
En el reporte de distribución aparecerá:
```
Transferir a Juan Pérez:
Monto: $70,416
CBU: 1234567890123456789012
Alias: juan.perez.alquileres
Banco: Banco Galicia
```

#### Ver Historial de Pagos

**Por Contrato:**
1. Ir a `Contratos > [Contrato] > Pagos`
2. Ver listado de todos los pagos del contrato
3. Filtros disponibles:
   - Por estado
   - Por período
   - Por monto

**Por Propietario:**
1. Ir a `Propietarios > [Propietario] > Pagos Recibidos`
2. Ver listado de distribuciones
3. Totalizar por período

**Exportar:**
- Excel: Click en "Exportar a Excel"
- PDF: Click en "Exportar a PDF"

### 6.7 Gastos

Gestión de gastos relacionados con las propiedades.

#### Tipos de Gastos

| Categoría | Descripción | Deducible? |
|-----------|-------------|------------|
| Mantenimiento | Reparaciones, pintura, plomería | ✅ Sí |
| Expensas extraordinarias | Gastos no ordinarios del edificio | ✅ Sí |
| Servicios | Luz, gas, agua de espacios comunes | ⚠️ Depende |
| Seguros | Seguro de la propiedad | ✅ Sí |
| Impuestos | ABL, Inmobiliario | ⚠️ Depende |
| Comisión inmobiliaria | Honorarios gestión | ✅ Sí |
| Otros | Cualquier otro gasto | ⚠️ Depende |

#### Crear Gasto

**Formulario:**

1. Seleccionar propiedad
2. (Opcional) Seleccionar contrato específico
3. Seleccionar categoría
4. Indicar fecha del gasto
5. Indicar monto
6. Indicar moneda (ARS, USD)
7. Descripción detallada
8. **Atribuible a:**
   - Propietario (se deduce del pago)
   - Inquilino (se cobra aparte)
   - Ambos (se divide)
9. **Es reembolsable:** (si la inmobiliaria pagó y debe recuperar)
10. Subir comprobante (factura, ticket, etc.)
11. Guardar

**Estado inicial:** `pending` (Pendiente de aprobación)

#### Aprobar Gasto

Solo ADMINISTRADOR/INMOBILIARIA puede aprobar gastos.

**Proceso:**
1. Ir a `Gastos > Pendientes`
2. Revisar gasto:
   - Ver comprobante
   - Verificar monto
   - Verificar atribución
3. Click en "Aprobar"
4. Sistema:
   - Cambia estado a `approved`
   - Registra `approved_by` y `approved_at`
   - Si es deducible y atribuible a propietario:
     - Se vincula al próximo pago del contrato
     - Se incluirá en el cálculo de distribución

**Rechazar gasto:**
1. Click en "Rechazar"
2. Indicar motivo
3. Estado cambia a `rejected`
4. No se deduce de pagos

#### Gastos Deducibles del Pago

Cuando se registra un pago, el sistema:

1. Busca gastos aprobados del período
2. Suma total de gastos
3. Deduce del monto bruto antes de distribuir

**Ejemplo:**

```sql
SELECT SUM(amount) as total_expenses
FROM pms_expenses
WHERE property_id = [property_id]
  AND expense_date BETWEEN '2025-01-01' AND '2025-01-31'
  AND status = 'approved'
  AND attributable_to IN ('PROPIETARIO', 'AMBOS')
  AND is_reimbursable = true;

-- Resultado: $5,000
```

**En el pago:**
```
Alquiler bruto:    $133,000
Gastos deducidos:  -$ 5,000
Comisión:          -$10,640
                   ----------
Distribuible:      $117,360
```

#### Reporte de Gastos

**Por Propiedad:**
1. Ir a `Reportes > Gastos por Propiedad`
2. Seleccionar propiedad
3. Seleccionar período (mes, trimestre, año)
4. Ver gráfico de gastos por categoría
5. Ver tabla detallada

**Por Categoría:**
Agrupa gastos de todas las propiedades por categoría.

**Exportar:**
- PDF con gráficos
- Excel con detalle

### 6.8 Mantenimiento

Gestión de solicitudes de mantenimiento y reparaciones.

#### Crear Solicitud

**Puede crearla:**
- ADMINISTRADOR/INMOBILIARIA (manual)
- INQUILINO (desde su portal)
- PROPIETARIO (desde su portal, si tiene permiso)

**Formulario:**
1. Propiedad
2. Contrato (si aplica)
3. Título de la solicitud (ej: "Pérdida en baño principal")
4. Descripción detallada
5. Prioridad:
   - 🔴 Urgente (ej: rotura de caño)
   - 🟠 Alta (ej: falla de calefón)
   - 🟡 Media (ej: canilla que gotea)
   - 🟢 Baja (ej: pintura descascarada)
6. Categoría:
   - Plomería
   - Electricidad
   - Cerrajería
   - Pintura
   - Climatización
   - Electrodomésticos
   - Otro
7. Subir fotos (hasta 5)
8. Guardar

**Estado inicial:** `open`

#### Workflow de Mantenimiento

<lov-mermaid>
stateDiagram-v2
    [*] --> Open: Crear solicitud
    Open --> InProgress: Asignar técnico
    InProgress --> Completed: Resolver
    InProgress --> Cancelled: Cancelar
    Open --> Cancelled: Cancelar
    Completed --> [*]
    Cancelled --> [*]
    
    note right of Open
        Solicitud nueva
        Color: Amarillo
    end note
    
    note right of InProgress
        Técnico asignado
        Color: Azul
    end note
    
    note right of Completed
        Resuelta
        Color: Verde
    end note
    
    note right of Cancelled
        Cancelada
        Color: Gris
    end note
</lov-mermaid>

#### Asignar Mantenimiento

1. Ir a `Mantenimiento > Pendientes`
2. Seleccionar solicitud
3. Click en "Asignar"
4. Seleccionar:
   - Proveedor/Técnico (de lista o ingresar nuevo)
   - Fecha estimada de resolución
   - Costo estimado
5. Guardar
6. Estado cambia a `in_progress`
7. (Opcional) Sistema notifica al técnico por email

#### Completar Mantenimiento

1. Ir a `Mantenimiento > En Proceso`
2. Seleccionar solicitud
3. Click en "Completar"
4. Indicar:
   - Fecha de resolución real
   - Costo real
   - Descripción de trabajo realizado
   - Subir factura/comprobante
5. Guardar
6. Estado cambia a `completed`
7. Sistema:
   - Notifica a solicitante (inquilino/propietario)
   - Crea gasto automáticamente (si se indicó costo)
   - El gasto queda pendiente de aprobación

#### Cancelar Mantenimiento

Si la solicitud no procede:
1. Click en "Cancelar"
2. Indicar motivo
3. Estado cambia a `cancelled`

#### Ver Historial

**Por Propiedad:**
- Ver todas las solicitudes de una propiedad
- Gráfico de tiempo promedio de resolución
- Gráfico de costos

**Por Prioridad/Categoría:**
- Estadísticas generales
- Identificar problemas recurrentes

### 6.9 Índices Económicos

Gestión de índices para ajustes automáticos de contratos.

#### Tipos de Índices

| Tipo | Descripción | Fuente |
|------|-------------|--------|
| **IPC** | Índice de Precios al Consumidor | INDEC |
| **ICL** | Índice de Contratos de Locación | Banco Central |
| **Otros** | Personalizados por tenant | Manual |

#### Cargar Índice Manualmente

1. Ir a `Índices Económicos`
2. Click en "Nuevo Índice"
3. Completar:
   - Tipo: IPC, ICL, Otro
   - Período: YYYY-MM (ej: 2025-01)
   - Valor: (ej: 315.25)
   - Fuente: (ej: "INDEC - Publicación Febrero 2025")
4. Guardar

**Validación:**
- No permite duplicados (mismo tipo + período)

#### Importación Masiva

Para cargar múltiples índices desde Excel:

1. Descargar plantilla Excel
2. Completar datos:
   ```
   Tipo  | Período | Valor  | Fuente
   IPC   | 2025-01 | 315.25 | INDEC
   IPC   | 2025-02 | 322.10 | INDEC
   ICL   | 2025-01 | 8.5    | BCRA
   ```
3. Ir a `Índices Económicos > Importar`
4. Seleccionar archivo
5. Sistema valida y muestra preview
6. Confirmar importación
7. Ver resumen:
   - X índices importados
   - Y duplicados omitidos
   - Z errores

#### Aplicación Automática de Ajustes

El sistema tiene un proceso automatizado (Cron Job) que ejecuta diariamente.

**Proceso:**

<lov-mermaid>
graph TD
    A[Cron Job diario] --> B[Buscar contratos con ajuste pendiente]
    B --> C{¿Fecha de ajuste llegó?}
    C -->|No| D[No hacer nada]
    C -->|Sí| E{¿Índices disponibles?}
    E -->|No| F[Marcar como pendiente]
    E -->|Sí| G[Calcular factor de ajuste]
    
    G --> H[Buscar índice período base]
    G --> I[Buscar índice período actual]
    
    H --> J[Calcular factor = actual/base]
    I --> J
    
    J --> K[Aplicar factor a monto]
    K --> L[Aplicar redondeo]
    L --> M[Actualizar pms_contract_current]
    M --> N[Crear registro en pms_contract_adjustments]
    N --> O[Actualizar payment_schedule_items futuros]
    O --> P[Notificar partes]
    
    style A fill:#3498db,color:#fff
    style G fill:#f39c12,color:#fff
    style P fill:#2ecc71,color:#fff
</lov-mermaid>

**Ejemplo de cálculo:**

```javascript
// Contrato con ajuste trimestral IPC
// Inicio: 2024-10-01
// Primer ajuste: 2025-01-01
// Monto inicial: $100,000

// Cuando llega 2025-01-01:
const baseIndex = getIndex('IPC', '2024-10'); // 292.0
const currentIndex = getIndex('IPC', '2024-12'); // 315.4

const factor = currentIndex / baseIndex; // 1.0801
const newAmount = 100000 * 1.0801; // 108,010

// Con redondeo a millar:
const rounded = Math.round(newAmount / 1000) * 1000; // 108,000

// Actualizar contrato
updateContractCurrent({
  contract_id: 'xxx',
  current_amount: 108000,
  current_from: '2025-01-01',
  last_adjustment_date: '2025-01-01',
  next_adjustment_date: '2025-04-01' // próximo trimestre
});

// Crear registro de ajuste
createAdjustment({
  contract_id: 'xxx',
  applied_at: '2025-01-01',
  period_from: '2024-10',
  period_to: '2024-12',
  factor: 1.0801,
  pct_cumulative: 8.01,
  prev_amount: 100000,
  new_amount: 108000
});

// Actualizar schedule items futuros
updateScheduleItems({
  contract_id: 'xxx',
  from_period: '2025-01-01',
  new_base_amount: 108000
});
```

**Notificaciones (opcional):**
- Email a inquilino: "Tu alquiler se ajustó a $108,000"
- Email a propietarios: "El alquiler de tu propiedad se ajustó"
- Email a administrador: "Se aplicaron X ajustes hoy"

### 6.10 Tipos de Cambio

Gestión de cotizaciones de moneda para contratos en USD.

#### Sincronización Automática

Edge Function programada que se ejecuta diariamente.

**Flujo:**

<lov-mermaid>
sequenceDiagram
    participant C as Cron
    participant F as Edge Function
    participant API as API Externa
    participant DB as Base de Datos
    
    C->>F: Trigger diario (ej: 10:00 AM)
    F->>API: GET cotización USD
    API-->>F: {date: "2025-01-15", sell: 1050, buy: 1045}
    F->>DB: Verificar si existe para esa fecha
    
    alt No existe
        F->>DB: INSERT pms_exchange_rates
        F->>DB: Guardar API response
    else Ya existe
        F->>F: No hacer nada
    end
    
    F-->>C: OK
</lov-mermaid>

**API utilizada:** (ejemplo)
- Banco Nación API
- DolarSi API
- Otro

**Datos guardados:**
```json
{
  "date": "2025-01-15",
  "sell_rate": 1050.00,
  "buy_rate": 1045.00,
  "source_type": "api",
  "is_manual": false,
  "api_response": {
    "fecha": "15/01/2025",
    "compra": 1045,
    "venta": 1050,
    "casa": "BNA"
  }
}
```

#### Carga Manual de Cotización

Si la API falla o para casos especiales:

1. Ir a `Tipos de Cambio`
2. Click en "Agregar Cotización Manual"
3. Completar:
   - Fecha
   - Cotización de venta (para convertir USD → ARS)
   - Cotización de compra (para convertir ARS → USD)
4. Guardar
5. Se marca como `is_manual = true`

#### Uso en Conversiones

El hook `useCurrencyConverter` permite convertir montos.

**Ejemplo de uso en componente:**

```typescript
const { convertCurrency } = useCurrencyConverter();

// Contrato en USD, mostrar equivalente en ARS
const monthlyRentUSD = 800;
const monthlyRentARS = convertCurrency(
  monthlyRentUSD,
  'USD',
  'ARS',
  '2025-01-15'
);

// Resultado: $840,000 (si cotización es 1050)
```

**Lógica:**
- Usa la cotización de la fecha indicada
- Si no existe cotización para esa fecha, usa la más reciente anterior
- Si el contrato es en ARS, no convierte

### 6.11 Reportes

Generación de reportes consolidados.

#### Reporte de Propietario (Mensual)

El reporte más importante del sistema. Se genera automáticamente cada mes.

**Contenido del reporte:**

```
REPORTE MENSUAL DE LIQUIDACIÓN
Propietario: Juan Pérez
Propiedad: Av. Libertador 1234, Depto 5B
Período: Enero 2025

-----------------------------------
INGRESOS
-----------------------------------
Alquiler                    $108,000
Expensas                    $ 15,000
Servicios                   $ 10,000
                            --------
TOTAL INGRESOS              $133,000

-----------------------------------
DEDUCCIONES
-----------------------------------
Reparación canilla          -$ 3,500
Pintura balcón              -$ 8,200
Expensas extraordinarias    -$ 2,100
                            --------
TOTAL DEDUCCIONES           -$13,800

-----------------------------------
COMISIÓN INMOBILIARIA (8%)
-----------------------------------
Sobre $133,000              -$10,640

-----------------------------------
NETO A TRANSFERIR
-----------------------------------
                            $108,560

-----------------------------------
DATOS DE TRANSFERENCIA
-----------------------------------
Banco: Banco Galicia
CBU: 1234567890123456789012
Alias: juan.perez.alquileres
Titular: Juan Pérez

-----------------------------------
DETALLE DE GASTOS
-----------------------------------
03/01 - Reparación canilla       $ 3,500
         Plomería Martín SRL
         Comprobante: FC-A-00123

15/01 - Pintura balcón            $ 8,200
         Pinturas del Sur
         Comprobante: FC-B-00456

28/01 - Expensas extraordinarias  $ 2,100
         Consorcio Edificio
         Comprobante: Recibo 01/2025
```

**Formato:**
- PDF profesional con logo de la inmobiliaria
- Incluye gráficos (opcional)
- Firmado digitalmente (futuro)

#### Generación Automática

Edge Function programada que se ejecuta el día 5 de cada mes.

**Proceso:**

```javascript
// Edge Function: generate-monthly-reports-batch

// 1. Buscar todos los contratos activos
const activeContracts = await getActiveContracts();

// 2. Para cada contrato
for (const contract of activeContracts) {
  // 3. Obtener pagos del mes anterior
  const payments = await getPayments(contract.id, lastMonth);
  
  // 4. Obtener gastos del mes anterior
  const expenses = await getExpenses(contract.property_id, lastMonth);
  
  // 5. Calcular distribución
  const distribution = calculateDistribution(payments, expenses);
  
  // 6. Generar PDF
  const pdfBuffer = await generatePDF({
    contract,
    payments,
    expenses,
    distribution,
    period: lastMonth
  });
  
  // 7. Guardar PDF en storage
  const pdfUrl = await uploadToStorage(pdfBuffer, `reports/${contract.id}/${lastMonth}.pdf`);
  
  // 8. Enviar por email a cada propietario
  for (const owner of contract.owners) {
    await sendEmail({
      to: owner.email,
      subject: `Reporte Mensual ${lastMonth} - Propiedad ${contract.property.address}`,
      attachments: [{ filename: 'reporte.pdf', path: pdfUrl }],
      body: generateEmailBody(owner, distribution)
    });
  }
}
```

**Configuración:**
- Día de envío (default: día 5)
- Formato (PDF, Excel, o ambos)
- Idioma
- Incluir/excluir gráficos

#### Descarga Manual de Reportes

Propietarios pueden descargar reportes históricos desde su portal:

1. Login en portal propietario
2. Ir a `Reportes`
3. Ver lista de reportes disponibles
4. Click en "Descargar PDF"

#### Reporte de Propiedad

Consolidado de ingresos/gastos de una propiedad.

**Parámetros:**
- Propiedad
- Período (mes, trimestre, año)

**Contenido:**
- Total de ingresos (alquileres)
- Total de gastos (mantenimiento, servicios, etc.)
- Resultado neto
- Gráfico de evolución
- Tabla detallada mensual

#### Reporte de Ingresos Netos (Owner)

Vista consolidada para propietarios con múltiples propiedades.

**Contenido:**
- Listado de propiedades
- Ingresos por propiedad
- Gastos por propiedad
- Neto por propiedad
- Total general
- Gráfico comparativo

---

## 7. Portal Propietario

### 7.1 Acceso

**URL de login:** `https://[dominio]/pms/login`

**Credenciales:**
- Email: [email del propietario]
- Contraseña: [temporal enviada por email, debe cambiarla en primer acceso]

### 7.2 Dashboard Propietario

Vista resumen de su información:

- **Mis Propiedades:** Cantidad y listado
- **Contratos Activos:** Cantidad
- **Próximo Pago:** Fecha estimada de recepción
- **Último Pago Recibido:** Monto y fecha

### 7.3 Mis Propiedades

Listado de propiedades donde es propietario (total o parcial).

**Por cada propiedad:**
- Dirección
- Tipo
- Estado (Ocupada/Disponible)
- % de participación (si es copropiedad)
- Contrato actual (si aplica)
- Inquilino actual (si aplica)

**Acciones:**
- Ver detalles de la propiedad
- Ver historial de contratos
- Ver pagos recibidos

### 7.4 Mis Contratos

Listado de contratos donde es propietario.

**Información visible:**
- Propiedad
- Inquilino
- Fecha inicio - Fecha fin
- Monto actual
- Próximo ajuste
- Estado

**Acciones:**
- Ver proyecciones del contrato
- Ver historial de ajustes
- Ver pagos realizados

### 7.5 Pagos Recibidos

Listado de distribuciones de pago recibidas.

**Tabla:**

| Fecha | Período | Propiedad | Alquiler Bruto | Gastos | Comisión | Neto Recibido |
|-------|---------|-----------|----------------|--------|----------|---------------|
| 05/01/25 | Dic 2024 | Av. Lib. 1234 | $133,000 | -$5,000 | -$10,640 | $117,360 |

**Detalle de pago:**
Al hacer click en una fila, ve el breakdown completo:
- Alquiler
- Expensas
- Servicios
- Detalle de cada gasto deducido
- Cálculo de comisión
- Neto a transferir

**Exportar:**
- Descargar comprobante de pago (PDF)
- Exportar listado a Excel

### 7.6 Gastos

Ver gastos de sus propiedades.

**Filtros:**
- Por propiedad
- Por estado (Pendiente, Aprobado, Rechazado)
- Por categoría
- Por período

**Aprobar/Rechazar Gastos (si tiene permiso):**
Algunos propietarios pueden tener permiso para aprobar gastos menores.

1. Ver gasto pendiente
2. Revisar comprobante
3. Aprobar o rechazar

### 7.7 Reportes Mensuales

Acceso a reportes históricos.

**Listado:**
| Mes | Propiedad | Estado | Descargar |
|-----|-----------|--------|-----------|
| Ene 2025 | Av. Lib. 1234 | Enviado | [PDF] |
| Dic 2024 | Av. Lib. 1234 | Enviado | [PDF] |

**Recepción automática:**
- Sistema envía por email el día 5 de cada mes
- Puede descargarlo también desde el portal

---

## 8. Portal Inquilino

### 8.1 Acceso

Similar al portal propietario:
- URL: `https://[dominio]/pms/login`
- Credenciales: [email y contraseña temporal]

### 8.2 Mi Contrato

Vista del contrato activo.

**Información:**
- Propiedad alquilada (dirección, fotos)
- Fecha inicio - Fecha fin
- Monto actual de alquiler
- Desglose de items (alquiler, expensas, servicios)
- Día de pago
- Próxima fecha de ajuste
- Método de pago acordado

**Datos de pago:**
- CBU/Alias para transferencia
- Monto a pagar este mes
- Fecha de vencimiento

### 8.3 Calendario de Pagos

Vista de calendario con pagos pendientes y realizados.

<lov-mermaid>
gantt
    title Calendario de Pagos 2025
    dateFormat YYYY-MM-DD
    section Pagos
    Enero :done, 2025-01-01, 2025-01-31
    Febrero :done, 2025-02-01, 2025-02-28
    Marzo :active, 2025-03-01, 2025-03-31
    Abril :2025-04-01, 2025-04-30
    Mayo :2025-05-01, 2025-05-31
</lov-mermaid>

**Por cada mes:**
- Monto a pagar
- Estado (Pendiente, Pagado, Vencido)
- Días restantes para vencimiento
- Opción de subir comprobante

### 8.4 Subir Comprobante de Pago

1. Seleccionar mes
2. Click en "Subir Comprobante"
3. Seleccionar archivo (PDF, JPG, PNG)
4. Indicar:
   - Fecha de pago
   - Monto pagado
   - Método (Transferencia, Efectivo, etc.)
   - Referencia/Nro. transacción
5. Enviar
6. Sistema notifica a inmobiliaria (opcional)

**Estado:**
- Comprobante queda "Pendiente de verificación"
- ADMINISTRADOR lo verifica y registra el pago oficial
- Estado cambia a "Verificado"

### 8.5 Solicitudes de Mantenimiento

Crear solicitudes de reparaciones.

**Proceso:**
1. Click en "Nueva Solicitud"
2. Completar:
   - Título (ej: "Pérdida en cocina")
   - Descripción detallada
   - Prioridad (Baja, Media, Alta, Urgente)
   - Subir hasta 5 fotos
3. Enviar
4. Sistema notifica a inmobiliaria
5. Inquilino puede ver estado de su solicitud

**Estados:**
- 🟡 Abierta: Solicitud recibida
- 🔵 En proceso: Técnico asignado
- 🟢 Resuelta: Trabajo completado
- ⚫ Cancelada

**Ver historial:**
Listado de todas sus solicitudes con estado actual.

---

## 9. Procesos Automatizados

### 9.1 Emails Automáticos

El sistema envía múltiples tipos de emails automáticamente.

#### Emails de Bienvenida

| Trigger | Destinatario | Contenido |
|---------|--------------|-----------|
| Aprobación de suscripción | CLIENT_ADMIN (nuevo) | Credenciales de acceso, enlace login |
| Creación de usuario admin | ADMINISTRADOR (nuevo) | Credenciales de acceso, instrucciones |
| Activación de contrato | INQUILINO (nuevo) | Credenciales portal, datos del contrato |
| Activación de contrato | PROPIETARIO (nuevo) | Credenciales portal, datos del contrato |

#### Emails de Recordatorio de Pago

<lov-mermaid>
graph TD
    A[Sistema verifica fechas] --> B{¿7 días antes?}
    B -->|Sí| C[Email: Recordatorio 1]
    B -->|No| D{¿1 día antes?}
    D -->|Sí| E[Email: Recordatorio 2]
    D -->|No| F{¿Día de vencimiento?}
    F -->|Sí| G[Email: Pago vence hoy]
    F -->|No| H{¿+1 día vencido?}
    H -->|Sí| I[Email: Pago vencido]
    H -->|No| J{¿+7 días vencido?}
    J -->|Sí| K[Email: Mora - Urgente]
    
    style C fill:#f1c40f,color:#000
    style E fill:#e67e22,color:#fff
    style G fill:#e74c3c,color:#fff
    style I fill:#c0392b,color:#fff
    style K fill:#7f0000,color:#fff
</lov-mermaid>

**Configuración:**
- Activar/desactivar recordatorios
- Días de anticipación (default: 7 y 1)
- Días de mora antes de alerta (default: 1, 7)

#### Email de Reporte Mensual

**Cuándo:** Día 5 de cada mes (configurable)

**Destinatarios:** Todos los propietarios con contratos activos

**Contenido:**
- Saludo personalizado
- Resumen del mes
- Adjunto: PDF del reporte completo
- Link para descargar desde portal

#### Email de Ajuste de Alquiler

**Cuándo:** Al aplicar ajuste por índice

**Destinatarios:**
- Inquilino
- Propietarios
- Administrador

**Contenido:**
- Monto anterior
- Monto nuevo
- % de ajuste
- Índice utilizado
- Vigencia desde

### 9.2 Ajustes Automáticos por Índice

**Frecuencia:** Cron job diario (00:00 hs)

**Proceso:**
1. Buscar contratos con ajuste pendiente para hoy
2. Verificar disponibilidad de índices
3. Calcular factor de ajuste
4. Aplicar ajuste
5. Actualizar registros
6. Notificar partes

**Logging:**
Cada ajuste se registra en `pms_contract_adjustments` con:
- Fecha de aplicación
- Factor utilizado
- Montos antes/después
- Índices utilizados

### 9.3 Generación de Reportes Batch

**Frecuencia:** Mensual (día 5, 00:00 hs)

**Proceso:**
1. Obtener todos los contratos activos
2. Para cada contrato:
   - Calcular distribución del mes anterior
   - Generar PDF
   - Guardar en storage
   - Enviar por email a propietarios
3. Registrar en tabla de reportes generados
4. Notificar a SUPERADMIN si hubo errores

**Manejo de errores:**
- Si falla generación de un reporte, continúa con los demás
- Registra errores en log
- Permite regeneración manual posterior

### 9.4 Vencimiento de Trials

**Frecuencia:** Cron job diario

**Proceso:**
1. Buscar suscripciones en trial con `trial_ends_at` < HOY
2. Si no se convirtieron a paid:
   - Cambiar estado a `expired`
   - Suspender acceso de usuarios del tenant
   - Notificar a GRANADA_ADMIN
   - Notificar a cliente (último recordatorio)
3. Después de 30 días en `expired`:
   - Opcional: Eliminar datos (según política)

**Recordatorios:**
- 7 días antes: "Tu trial vence en 7 días"
- 3 días antes: "Tu trial vence en 3 días"
- 1 día antes: "Tu trial vence mañana"
- Día de vencimiento: "Tu trial ha vencido"

---

## 10. Seguridad y Privacidad

### 10.1 Multi-Tenancy

Cada inmobiliaria (tenant) tiene sus datos completamente aislados.

**Implementación:**
- Row Level Security (RLS) en Supabase
- Cada tabla tiene columna `tenant_id`
- Políticas RLS verifican que `auth.uid()` pertenezca al tenant

**Ejemplo de política:**

```sql
-- Política para pms_properties
CREATE POLICY "Users can only see properties of their tenant"
ON pms_properties
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM pms_client_users 
    WHERE user_id = auth.uid()
  )
);
```

**Garantía:**
- Usuario de Tenant A **nunca** puede ver datos de Tenant B
- Verificación a nivel de base de datos (no solo frontend)

### 10.2 Control de Acceso por Rol

Cada rol tiene permisos específicos verificados tanto en frontend como backend.

**Niveles de verificación:**

1. **Frontend:** Oculta UI que el usuario no puede usar
2. **Backend:** Edge Functions validan rol antes de ejecutar
3. **Database:** RLS policies verifican permisos

**Ejemplo: Activar contrato**

```typescript
// Frontend: Solo muestra botón si es ADMINISTRADOR o INMOBILIARIA
{hasPermission('ACTIVAR_CONTRATO') && (
  <Button onClick={activateContract}>Activar</Button>
)}

// Edge Function: Verifica rol antes de ejecutar
const { data: user } = await supabase.auth.getUser();
const userRole = await getUserRole(user.id);

if (!['INMOBILIARIA', 'ADMINISTRADOR'].includes(userRole)) {
  throw new Error('No autorizado');
}

// RLS: Solo permite UPDATE si user es ADMIN del tenant
CREATE POLICY "Only admins can activate contracts"
ON pms_contracts
FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM pms_client_users 
    WHERE user_id = auth.uid()
      AND user_type IN ('INMOBILIARIA', 'ADMINISTRADOR')
  )
);
```

### 10.3 Protección de Datos Sensibles

**Datos encriptados:**
- Contraseñas: Hash con bcrypt
- Datos bancarios: (opcional) Encriptación adicional
- Documentos: Almacenados en bucket privado

**Acceso a documentos:**
```typescript
// Generar URL firmada con expiración
const { data } = await supabase.storage
  .from('contract-documents')
  .createSignedUrl(filepath, 3600); // Expira en 1 hora
```

**Auditoría:**
Eventos críticos se registran:
- Login/logout
- Cambios en contratos
- Aprobación de gastos
- Distribución de pagos

### 10.4 Backup y Recuperación

**Backups automáticos:**
- Supabase realiza backups diarios
- Retención: 7 días (configurable)

**Punto de restauración:**
Granada Admin puede solicitar restauración de datos si es necesario.

---

## 11. Mejores Prácticas

### 11.1 Para Inmobiliarias

✅ **Carga inicial ordenada:**
1. Primero cargar propietarios
2. Luego propiedades (asociar propietarios)
3. Luego inquilinos
4. Finalmente contratos

✅ **Cargar índices económicos anticipadamente:**
- Cargar índices de los últimos 12 meses al iniciar
- Actualizar mensualmente

✅ **Activar contratos solo cuando todo esté listo:**
- Verificar que propietarios tengan datos bancarios
- Verificar que índices estén cargados
- Tener documentación completa

✅ **Configurar métodos de pago correctamente:**
- Definir cuentas de destino para cada propietario
- Configurar % de distribución correctamente

✅ **Registrar pagos puntualmente:**
- No esperar a fin de mes para registrar
- Verificar comprobantes antes de registrar

❌ **Evitar:**
- Activar contratos sin verificar datos
- Eliminar registros (mejor marcar como inactivo)
- Cambiar fechas de contratos activos sin entender el impacto

### 11.2 Para Propietarios

✅ **Revisar reportes mensuales:**
- Verificar montos de alquiler
- Revisar gastos deducidos
- Consultar dudas prontamente

✅ **Aprobar gastos en tiempo:**
- Revisar gastos pendientes regularmente
- Aprobar o rechazar con justificación

✅ **Mantener datos bancarios actualizados:**
- Notificar cambios de CBU/Alias
- Verificar datos en reportes

### 11.3 Para Inquilinos

✅ **Pagar puntualmente:**
- Respetar fecha de vencimiento
- Subir comprobante inmediatamente después de pagar

✅ **Comunicar problemas de mantenimiento:**
- Reportar problemas apenas ocurren
- Ser descriptivo en solicitudes
- Subir fotos cuando sea posible

✅ **Revisar ajustes de alquiler:**
- Entender cuándo y cómo se ajusta el alquiler
- Verificar que los montos coincidan con lo acordado

---

## 12. Casos de Uso Comunes

### 12.1 Onboarding de Nueva Inmobiliaria

<lov-mermaid>
journey
    title Onboarding de Nueva Inmobiliaria
    section Solicitud
      Completar formulario web: 5: Cliente
      Enviar solicitud: 5: Cliente
    section Aprobación
      Revisar solicitud: 3: Granada Admin
      Aprobar suscripción: 5: Granada Admin
      Sistema crea tenant: 5: Sistema
      Sistema crea CLIENT_ADMIN: 5: Sistema
      Envía email bienvenida: 5: Sistema
    section Configuración
      Recibe email: 5: Cliente
      Primer login: 4: Cliente
      Cambia contraseña: 5: Cliente
      Configura empresa: 4: Cliente
      Crea usuarios admin: 5: Cliente
    section Operación
      Carga propietarios: 4: Cliente
      Carga propiedades: 4: Cliente
      Carga inquilinos: 4: Cliente
      Carga índices: 3: Cliente
      Crea primer contrato: 5: Cliente
      Activa contrato: 5: Cliente
      Sistema crea usuarios portal: 5: Sistema
      Portales activos: 5: Sistema
</lov-mermaid>

**Duración estimada:** 2-4 horas

### 12.2 Ciclo Completo de Alquiler

<lov-mermaid>
graph TD
    A[Propiedad Disponible] --> B[Crear Contrato]
    B --> C[Configurar Condiciones]
    C --> D[Activar Contrato]
    
    D --> E[Propiedad = Ocupada]
    D --> F[Usuarios Portal Creados]
    D --> G[Calendario Generado]
    
    G --> H[Mes 1]
    H --> I{¿Inquilino paga?}
    I -->|Sí| J[Registrar Pago]
    I -->|No| K[Enviar Recordatorio]
    K --> L{¿Paga?}
    L -->|Sí| J
    L -->|No| M[Gestión de Mora]
    
    J --> N[Deducir Gastos]
    N --> O[Distribuir a Propietarios]
    O --> P[Generar Reporte]
    P --> Q[Enviar por Email]
    
    Q --> R[Mes 2...]
    R --> H
    
    H --> S{¿Mes de ajuste?}
    S -->|Sí| T[Aplicar Ajuste IPC/ICL]
    T --> U[Actualizar Monto]
    U --> V[Notificar Partes]
    V --> H
    S -->|No| H
    
    style A fill:#f39c12,color:#fff
    style D fill:#e74c3c,color:#fff
    style J fill:#2ecc71,color:#fff
    style T fill:#9b59b6,color:#fff
</lov-mermaid>

**Duración:** Indefinida (mientras dure el contrato)

---

## 13. Soporte y Ayuda

### 13.1 Centro de Ayuda

Dentro de la plataforma:
- `Ayuda > Preguntas Frecuentes`
- `Ayuda > Tutoriales en Video`
- `Ayuda > Guías PDF`

### 13.2 Contacto

- **Email de soporte:** soporte@granadaplatform.com
- **WhatsApp:** +54 9 XXX XXX-XXXX
- **Horario:** Lunes a Viernes, 9:00 a 18:00 hs

### 13.3 Recursos Adicionales

- **Portal de documentación:** https://docs.granadaplatform.com
- **Webinars mensuales:** Registro en plataforma
- **Comunidad:** Foro de usuarios

---

## Próximos Pasos

### Para Nuevos Usuarios

1. ✅ **Completar perfil:** Datos de empresa, logo, datos bancarios
2. ✅ **Crear equipo:** Agregar usuarios administrativos
3. ✅ **Cargar datos maestros:** Propietarios, propiedades, inquilinos
4. ✅ **Configurar procesos:** Emails, reportes, notificaciones
5. ✅ **Crear primer contrato:** Practicar flujo completo
6. ✅ **Activar contrato:** Verificar creación de portales
7. ✅ **Registrar primer pago:** Entender distribución

### Para Usuarios Avanzados

- Explorar reportes avanzados
- Configurar automatizaciones personalizadas
- Integrar con sistemas contables (futuro)
- Utilizar API para integraciones (futuro)

---

**Última actualización:** 2025-11-21  
**Versión del manual:** 1.0  
**Versión de la plataforma:** 1.0.0

---

## Glosario

| Término | Definición |
|---------|------------|
| **Tenant** | Instancia aislada de datos para cada inmobiliaria |
| **RLS** | Row Level Security - Seguridad a nivel de fila en base de datos |
| **IPC** | Índice de Precios al Consumidor (INDEC) |
| **ICL** | Índice de Contratos de Locación (BCRA) |
| **MRR** | Monthly Recurring Revenue - Ingresos recurrentes mensuales |
| **ARR** | Annual Recurring Revenue - Ingresos recurrentes anuales |
| **CBU** | Clave Bancaria Uniforme |
| **Churn** | Tasa de cancelación de clientes |
| **Trial** | Período de prueba gratuito |
| **Edge Function** | Función serverless ejecutada en Supabase |
| **Cron Job** | Tarea programada que se ejecuta automáticamente |

---

¿Necesitas ayuda con alguna funcionalidad específica? Consulta la sección correspondiente o contacta a soporte.
