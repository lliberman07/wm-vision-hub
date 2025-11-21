# 🚀 Manual de Configuración Inicial - Granada Platform

## Para Nuevas Inmobiliarias

---

## Tabla de Contenidos

- [1. Pre-requisitos y Preparación](#1-pre-requisitos-y-preparación)
- [2. Proceso de Solicitud de Suscripción](#2-proceso-de-solicitud-de-suscripción)
- [3. Activación de Cuenta](#3-activación-de-cuenta)
- [4. Configuración Inicial del Sistema](#4-configuración-inicial-del-sistema)
- [5. Gestión de Usuarios](#5-gestión-de-usuarios)
- [6. Carga de Datos Maestros](#6-carga-de-datos-maestros)
- [7. Configuración de Procesos](#7-configuración-de-procesos)
- [8. Checklist de Verificación Final](#8-checklist-de-verificación-final)
- [9. Roadmap Post-Configuración](#9-roadmap-post-configuración)
- [10. Soporte y Ayuda](#10-soporte-y-ayuda)
- [11. Errores Comunes y Soluciones](#11-errores-comunes-y-soluciones)
- [12. Certificación de Configuración](#12-certificación-de-configuración)

---

## 1. Pre-requisitos y Preparación

### 1.1 Información Necesaria de la Inmobiliaria

Antes de comenzar, asegúrate de tener:

#### 📋 Datos de la Empresa

- [ ] Razón social completa
- [ ] CUIT de la empresa
- [ ] Dirección fiscal
- [ ] Teléfono de contacto principal
- [ ] Email institucional (preferiblemente @nombreempresa.com)
- [ ] Sitio web (opcional)
- [ ] Logo de la empresa (formato PNG o JPG, máx 2MB)

#### 👤 Contacto Administrativo Principal

- [ ] Nombre completo del responsable
- [ ] Email personal/laboral
- [ ] Teléfono/celular directo
- [ ] Cargo en la empresa

#### 💳 Plan Seleccionado

- [ ] Plan elegido (Básico, Profesional, Enterprise)
- [ ] Modalidad de pago (Mensual, Trimestral, Anual)
- [ ] ¿Desea período de prueba? (Trial 15 días)

### 1.2 Datos Iniciales para Migración

Si ya estás operando y quieres migrar datos:

#### 🏢 Propietarios

Por cada propietario, necesitas:
- Nombre completo
- CUIT/CUIL
- Email
- Teléfono
- Dirección
- **Datos bancarios:**
  - Banco
  - Tipo de cuenta (CA/CC)
  - Número de cuenta
  - CBU
  - Alias

#### 🏠 Propiedades

Por cada propiedad:
- Dirección completa
- Tipo (Casa, Departamento, Local, etc.)
- Superficie (m²)
- Ambientes
- Baños
- Propietario(s) asociado(s)
- % de participación de cada propietario

#### 👥 Inquilinos

Por cada inquilino:
- Nombre completo
- CUIT/CUIL o DNI
- Email
- Teléfono

#### 📄 Contratos Activos

Por cada contrato:
- Número de contrato (interno)
- Propiedad
- Inquilino
- Fecha inicio - Fecha fin
- Monto de alquiler
- Moneda (ARS/USD)
- Día de pago
- Configuración de ajuste (IPC, ICL, Sin ajuste)
- Frecuencia de ajuste
- Fecha de próximo ajuste

#### 🏦 Datos Bancarios de la Inmobiliaria

Para distribución de comisiones:
- Banco
- Titular
- Tipo de cuenta
- Número de cuenta
- CBU/Alias

---

## 2. Proceso de Solicitud de Suscripción

### 2.1 Acceder al Formulario Web

1. Visita: `https://[dominio-granada]/subscription-request`
2. Completa el formulario con los datos preparados en el paso 1

<lov-mermaid>
graph TD
    A[Visitar Web Granada] --> B[Click en 'Solicitar Suscripción']
    B --> C[Completar Formulario]
    C --> D[Seleccionar Plan]
    D --> E[Revisar Datos]
    E --> F{¿Todo correcto?}
    F -->|No| C
    F -->|Sí| G[Enviar Solicitud]
    G --> H[Confirmación en Pantalla]
    H --> I[Email de Confirmación Recibido]
    
    style A fill:#3498db,color:#fff
    style G fill:#2ecc71,color:#fff
    style I fill:#f39c12,color:#fff
</lov-mermaid>

### 2.2 Campos del Formulario

| Campo | Descripción | Requerido |
|-------|-------------|-----------|
| Razón Social | Nombre legal de la empresa | ✅ Sí |
| CUIT | 11 dígitos sin guiones | ✅ Sí |
| Email Empresa | Email institucional | ✅ Sí |
| Teléfono | Con código de área | ✅ Sí |
| Dirección | Dirección fiscal completa | ✅ Sí |
| Sitio Web | URL completa (ej: https://...) | ❌ No |
| Nombre Contacto | Responsable principal | ✅ Sí |
| Email Contacto | Email del responsable | ✅ Sí |
| Plan | Básico, Profesional, Enterprise | ✅ Sí |
| Período Prueba | ¿Desea 15 días gratis? | ✅ Sí |

### 2.3 Después de Enviar

**Recibirás un email de confirmación inmediato:**

```
Asunto: Solicitud de Suscripción Recibida - Granada Platform

Estimado [Nombre Contacto],

Hemos recibido tu solicitud de suscripción para [Razón Social].

Datos de tu solicitud:
- Plan solicitado: [Plan]
- Período de prueba: [Sí/No]
- Número de solicitud: #REQ-XXXXX

Nuestro equipo revisará tu solicitud en las próximas 24-48 horas.
Te notificaremos por email cuando tu cuenta esté lista.

Saludos,
Equipo Granada Platform
```

**Estado de la solicitud:**
- Puedes verificar el estado en: `https://[dominio]/subscription-request-status?id=REQ-XXXXX`

---

## 3. Activación de Cuenta

### 3.1 Proceso de Aprobación (Granada Admin)

Una vez que Granada Admin aprueba tu solicitud:

<lov-mermaid>
sequenceDiagram
    participant GA as Granada Admin
    participant S as Sistema
    participant DB as Base de Datos
    participant E as Email System
    participant C as Cliente (Tú)
    
    GA->>S: Aprueba solicitud REQ-XXXXX
    S->>DB: Crear Tenant
    S->>DB: Crear Suscripción
    S->>DB: Crear usuario CLIENT_ADMIN
    S->>S: Generar contraseña temporal
    S->>E: Preparar email de bienvenida
    E->>C: Email con credenciales
    
    Note over C: Email recibido con:<br/>- Usuario<br/>- Contraseña temporal<br/>- Link de acceso
    
    C->>S: Accede por primera vez
    S->>C: Solicita cambio de contraseña
    C->>S: Define nueva contraseña
    S->>C: ¡Bienvenido al sistema!
</lov-mermaid>

### 3.2 Email de Bienvenida

Recibirás un email similar a:

```
Asunto: ¡Bienvenido a Granada Platform! - Tus credenciales de acceso

Estimado [Nombre Contacto],

¡Tu cuenta de Granada Platform está lista!

DATOS DE ACCESO:
---------------------------------
URL: https://[dominio]/pms/login
Usuario: [tu-email@empresa.com]
Contraseña temporal: [TEMP-XXXXX]

IMPORTANTE:
⚠️ Por seguridad, deberás cambiar tu contraseña en el primer inicio de sesión.

PRÓXIMOS PASOS:
1. Accede usando el link y credenciales arriba
2. Cambia tu contraseña
3. Completa los datos de tu empresa
4. Agrega usuarios de tu equipo
5. Comienza a cargar propiedades y contratos

¿Necesitas ayuda?
- Video tutorial: [link]
- Documentación: [link]
- Soporte: soporte@granadaplatform.com

¡Bienvenido!
Equipo Granada Platform
```

### 3.3 Primer Login

**Paso a paso:**

1. **Acceder al link:** Click en el enlace del email o copia/pega en navegador
2. **Ingresar credenciales:**
   - Usuario: tu email
   - Contraseña: la temporal del email
3. **Cambiar contraseña:**
   - El sistema te pedirá inmediatamente cambiarla
   - Requisitos:
     - Mínimo 8 caracteres
     - Al menos 1 mayúscula
     - Al menos 1 número
     - Al menos 1 carácter especial (@, #, $, etc.)
4. **Confirmar nueva contraseña:** Escribir dos veces para validar
5. **Guardar:** Click en "Cambiar Contraseña"

✅ **¡Listo!** Ahora tienes acceso completo a tu cuenta.

---

## 4. Configuración Inicial del Sistema

### 4.1 Tour del Dashboard

Al ingresar por primera vez, verás el Dashboard Principal.

**Secciones visibles:**

```
┌─────────────────────────────────────────────────────────┐
│  🏠 Granada Platform - Dashboard                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📊 INDICADORES (Vacíos al inicio)                      │
│  ┌──────────┬──────────┬──────────┬──────────┐        │
│  │ 0        │ 0        │ 0        │ 0        │        │
│  │ Props    │ Contratos│ Pagos    │ Propiet. │        │
│  └──────────┴──────────┴──────────┴──────────┘        │
│                                                          │
│  📋 MÓDULOS PRINCIPALES                                 │
│  ┌──────────────┬──────────────┬──────────────┐       │
│  │ Propiedades  │ Propietarios │ Inquilinos   │       │
│  │ Contratos    │ Pagos        │ Gastos       │       │
│  │ Reportes     │ Índices      │ Config       │       │
│  └──────────────┴──────────────┴──────────────┘       │
│                                                          │
│  ⚙️ ACCESO RÁPIDO                                       │
│  • Mi Suscripción                                       │
│  • Equipo Administrativo                                │
│  • Datos de la Empresa                                  │
│  • Ayuda y Soporte                                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Verificar Detalles de Suscripción

**Paso 1:** Click en `Mi Suscripción` (sidebar o menú superior)

**Verás:**

| Campo | Valor |
|-------|-------|
| Plan Actual | [Tu plan seleccionado] |
| Estado | Trial / Active |
| Fecha de Inicio | [Fecha aprobación] |
| Próxima Facturación | [Fecha] |
| **Límites del Plan** | |
| Propiedades | 0 / 50 (ejemplo) |
| Usuarios | 1 / 10 |
| Contratos Activos | 0 / 50 |
| Almacenamiento | 0 GB / 5 GB |

**Paso 2:** Familiarízate con los límites de tu plan

⚠️ **Importante:** Si te acercas al límite (80%+), el sistema te alertará para considerar upgrade.

### 4.3 Configurar Datos de la Empresa

**Ubicación:** `Configuración > Datos de la Empresa`

#### Información General

- [ ] Completar/verificar razón social
- [ ] Completar/verificar CUIT
- [ ] Completar dirección completa
- [ ] Completar teléfono(s)
- [ ] Completar email de contacto principal
- [ ] (Opcional) Sitio web
- [ ] **Subir logo de la empresa**
  - Formato: PNG o JPG
  - Tamaño recomendado: 500x500 px
  - Máximo: 2 MB

**Efecto del logo:**
- Aparecerá en reportes PDF generados
- Aparecerá en emails enviados a clientes
- Aparecerá en portales de propietarios/inquilinos

#### Datos Bancarios de la Empresa

⚠️ **Crítico para comisiones**

Si cobras comisión por administración, configura la cuenta donde recibirás tus honorarios:

- [ ] Banco
- [ ] Titular (razón social o nombre)
- [ ] Tipo de cuenta (Caja de Ahorro / Cuenta Corriente)
- [ ] Número de cuenta
- [ ] CBU (22 dígitos)
- [ ] Alias (si tienes)

**Guardar cambios:** Click en `Guardar Datos`

---

## 5. Gestión de Usuarios

### 5.1 Tipos de Usuarios Administrativos

Tu empresa puede tener múltiples usuarios con diferentes niveles de acceso:

| Tipo de Usuario | Descripción | Permisos |
|-----------------|-------------|----------|
| **INMOBILIARIA** | Dueño original (tú) | Todos los permisos |
| **CLIENT_ADMIN** | Co-administrador | Todos los permisos (igual que INMOBILIARIA) |
| **ADMINISTRADOR** | Staff operativo | Operación diaria del PMS (sin acceso a suscripción) |

### 5.2 Agregar Usuarios del Equipo

**Ubicación:** `Equipo Administrativo` (menú principal)

#### Agregar CLIENT_ADMIN (otro administrador)

**Caso de uso:** Quieres que un socio o gerente tenga acceso completo.

<lov-mermaid>
graph TD
    A[Equipo Administrativo] --> B[Click 'Agregar Administrador']
    B --> C[Seleccionar tipo: CLIENT_ADMIN]
    C --> D[Completar formulario]
    D --> E[Click 'Crear']
    
    E --> F[Sistema crea usuario]
    F --> G[Genera contraseña temporal]
    G --> H[Envía email con credenciales]
    
    H --> I[Nuevo admin recibe email]
    I --> J[Accede y cambia contraseña]
    J --> K[¡Listo para trabajar!]
    
    style E fill:#2ecc71,color:#fff
    style H fill:#f39c12,color:#fff
    style K fill:#3498db,color:#fff
</lov-mermaid>

**Formulario:**

```
Tipo de Usuario: ● CLIENT_ADMIN
                  ○ ADMINISTRADOR

Nombre:          [          ]
Apellido:        [          ]
Email:           [          ]

[Crear Usuario]  [Cancelar]
```

**Al hacer click en "Crear Usuario":**

1. Sistema valida que el email no exista
2. Crea registro en base de datos
3. Crea usuario de autenticación
4. Genera contraseña temporal aleatoria
5. **Envía email automáticamente:**

```
Asunto: Invitación a Granada Platform - [Nombre Empresa]

Hola [Nombre],

Has sido invitado a administrar la cuenta de Granada Platform 
de [Nombre Empresa].

DATOS DE ACCESO:
---------------------------------
URL: https://[dominio]/pms/login
Usuario: [email]
Contraseña temporal: [TEMP-XXXXX]

Deberás cambiar tu contraseña en el primer acceso.

Saludos,
Equipo Granada Platform
```

✅ **Verificación:** El nuevo usuario aparece en la lista con estado "Activo"

#### Agregar ADMINISTRADOR (staff operativo)

**Caso de uso:** Empleado que gestionará el día a día (propiedades, contratos, pagos).

**Proceso:** Idéntico al anterior, pero seleccionando tipo `ADMINISTRADOR`

**Diferencia clave:**
- No puede acceder a `/client-admin` (gestión de suscripción y equipo)
- Tiene acceso completo a `/pms` (operación diaria)

### 5.3 Desactivar o Eliminar Usuarios

**Desactivar (recomendado):**

1. Ir a `Equipo Administrativo`
2. Buscar usuario en la lista
3. Click en menú de acciones (⋮)
4. Seleccionar "Desactivar"
5. Confirmar

**Efecto:**
- Usuario no puede hacer login
- Se conserva historial de acciones realizadas
- Se puede reactivar en cualquier momento

**Eliminar (no recomendado):**

Solo si el usuario nunca realizó acciones en el sistema.

⚠️ **Precaución:** Si tiene acciones registradas, la eliminación puede causar problemas de integridad referencial.

---

## 6. Carga de Datos Maestros

### 6.1 Orden Recomendado de Carga

Es **crítico** seguir este orden debido a las dependencias entre entidades:

<lov-mermaid>
graph TD
    A[1. Propietarios] --> B[2. Propiedades]
    B --> C[3. Inquilinos]
    C --> D[4. Índices Económicos]
    D --> E[5. Contratos]
    E --> F[6. Configurar Métodos de Pago]
    
    style A fill:#3498db,color:#fff
    style E fill:#e74c3c,color:#fff
    style F fill:#2ecc71,color:#fff
    
    note1[Propiedades necesitan<br/>propietarios asociados]
    note2[Contratos necesitan<br/>propiedades e inquilinos]
    note3[Ajustes necesitan<br/>índices cargados]
    
    B -.-> note1
    E -.-> note2
    E -.-> note3
</lov-mermaid>

### 6.2 Cargar Propietarios

**Ubicación:** `Propietarios > Nuevo Propietario`

#### Formulario Individual

**Datos Personales:**

- [ ] Nombre completo
- [ ] CUIT/CUIL
- [ ] DNI
- [ ] Email
- [ ] Teléfono
- [ ] Dirección

**Datos Bancarios:**

⚠️ **Crítico para distribución de pagos**

- [ ] Banco (seleccionar de lista)
- [ ] Tipo de cuenta (CA o CC)
- [ ] Número de cuenta
- [ ] CBU (22 dígitos sin guiones ni espacios)
- [ ] Alias (si tiene)
- [ ] Titular (generalmente igual al nombre del propietario)

**Configuración de Reportes:**

- [ ] Frecuencia de envío: Mensual (recomendado)
- [ ] Email alternativo para reportes (opcional)

**Acceso al Portal:**

☑️ **Crear acceso al portal del propietario**

Si marcas esta opción:
- Se creará un usuario portal para que el propietario pueda ver sus datos
- Recibirá email con credenciales
- Podrá consultar pagos, descargar reportes, aprobar gastos

**Guardar:** Click en `Guardar Propietario`

#### Importación Masiva (opcional)

Si tienes muchos propietarios:

1. Descargar plantilla Excel: `Propietarios > Importar > Descargar Plantilla`
2. Completar datos en Excel
3. Importar: `Propietarios > Importar > Seleccionar Archivo`
4. Sistema valida y muestra preview
5. Confirmar importación

### 6.3 Cargar Propiedades

**Ubicación:** `Propiedades > Nueva Propiedad`

#### Formulario de Propiedad

**Datos Básicos:**

- [ ] Dirección completa (Calle, Número, Piso/Depto)
- [ ] Ciudad
- [ ] Provincia
- [ ] Código Postal
- [ ] Tipo de propiedad:
  - Casa
  - Departamento
  - PH
  - Local Comercial
  - Oficina
  - Galpón
  - Terreno
  - Otro
- [ ] Superficie total (m²)
- [ ] Superficie cubierta (m²)
- [ ] Ambientes (número)
- [ ] Dormitorios (número)
- [ ] Baños (número)

**Asociar Propietarios:**

⚠️ **Crítico:** Toda propiedad debe tener al menos un propietario.

**Para propiedad de un solo dueño:**
1. Click en "Agregar Propietario"
2. Seleccionar propietario de la lista
3. Porcentaje: 100%

**Para propiedad compartida (copropiedad):**
1. Click en "Agregar Propietario"
2. Seleccionar primer propietario
3. Indicar porcentaje (ej: 60%)
4. Click en "Agregar Propietario" nuevamente
5. Seleccionar segundo propietario
6. Indicar porcentaje (ej: 40%)

✅ **Validación:** El sistema verifica que la suma sea 100%

**Características (opcional):**

- [ ] Amenities (pileta, quincho, cochera, etc.)
- [ ] Características especiales
- [ ] Observaciones

**Fotos de la Propiedad:**

- Click en "Subir Fotos"
- Seleccionar hasta 10 imágenes
- Formatos: JPG, PNG
- Máximo por foto: 5 MB

**Estado Inicial:**

- Disponible (default)
- Ocupada (si ya tiene contrato activo)
- Mantenimiento (si está en refacción)

**Guardar:** Click en `Guardar Propiedad`

### 6.4 Cargar Inquilinos

**Ubicación:** `Inquilinos > Nuevo Inquilino`

#### Formulario de Inquilino

**Datos Personales:**

- [ ] Nombre completo
- [ ] CUIT/CUIL o DNI
- [ ] Email
- [ ] Teléfono
- [ ] Dirección actual

**Datos del Garante (opcional):**

- [ ] Nombre del garante
- [ ] CUIT/CUIL del garante
- [ ] Teléfono del garante
- [ ] Relación con el inquilino

**Guardar:** Click en `Guardar Inquilino`

⚠️ **Nota:** El usuario portal del inquilino se crea automáticamente al **activar el contrato**, no al crear el registro aquí.

### 6.5 Cargar Índices Económicos

**Ubicación:** `Índices Económicos > Nuevo Índice`

#### ¿Por qué cargar índices?

Si tus contratos tienen ajustes por IPC o ICL, necesitas cargar los valores históricos y actuales de estos índices para que el sistema pueda calcular los ajustes automáticamente.

#### Cargar Índice Individual

**Formulario:**

```
Tipo de Índice:  [Seleccionar ▼]
                 - IPC (Índice Precios Consumidor)
                 - ICL (Índice Contratos Locación)
                 - Otro

Período:         [YYYY-MM]  (ej: 2025-01)

Valor:           [         ]  (ej: 315.25)

Fuente:          [                                    ]
                 (ej: "INDEC - Publicación Feb 2025")

[Guardar Índice]  [Cancelar]
```

**Ejemplo de carga:**

Si hoy es Febrero 2025 y necesitas cargar los últimos 6 meses de IPC:

| Período | Valor | Fuente |
|---------|-------|--------|
| 2024-09 | 280.5 | INDEC |
| 2024-10 | 292.0 | INDEC |
| 2024-11 | 303.8 | INDEC |
| 2024-12 | 315.4 | INDEC |
| 2025-01 | 325.1 | INDEC |

#### Importación Masiva de Índices

1. Descargar plantilla: `Índices > Importar > Descargar Plantilla`
2. Completar Excel:
   ```
   tipo  | periodo  | valor  | fuente
   IPC   | 2024-09  | 280.5  | INDEC
   IPC   | 2024-10  | 292.0  | INDEC
   ICL   | 2024-09  | 8.2    | BCRA
   ICL   | 2024-10  | 8.5    | BCRA
   ```
3. Importar archivo
4. Sistema valida (no permite duplicados)
5. Confirmar

✅ **Recomendación:** Carga al menos los últimos 12 meses de los índices que usarás.

### 6.6 Crear Contratos

⚡ **Paso más crítico de la configuración**

**Ubicación:** `Contratos > Nuevo Contrato`

#### Wizard de Creación de Contrato

El sistema te guiará por 5 pasos:

**PASO 1: Información Básica**

- [ ] Número de contrato (auto o manual)
- [ ] Propiedad (seleccionar de lista)
- [ ] Inquilino (seleccionar de lista)
- [ ] Tipo de contrato:
  - Alquiler (ley 27.551)
  - Alquiler temporario
  - Comercial
  - Otro
- [ ] Fecha de inicio (ej: 2025-01-01)
- [ ] Fecha de fin (ej: 2027-01-01)
- [ ] Duración en meses (auto-calculada)

**PASO 2: Condiciones Económicas**

*Monto Principal:*
- [ ] Monto de alquiler base (ej: $100,000)
- [ ] Moneda: ARS / USD
- [ ] Día de pago del mes (ej: 10)

*Depósito en Garantía:*
- [ ] Monto del depósito (ej: $200,000)
- [ ] Moneda: ARS / USD

*Ítems Adicionales:*

| Ítem | Monto | Incluido |
|------|-------|----------|
| Expensas comunes | $15,000 | ☑️ |
| Servicios (ABL, etc.) | $10,000 | ☑️ |
| Otros | $0 | ☐ |

**PASO 3: Configuración de Ajustes**

⚠️ **Fundamental para ajustes automáticos**

- [ ] **Índice de ajuste:**
  - Sin ajuste
  - IPC (Índice de Precios al Consumidor)
  - ICL (Índice de Contratos de Locación)
  - Otro personalizado

- [ ] **Frecuencia de ajuste:**
  - Mensual
  - Trimestral
  - Cuatrimestral
  - Semestral
  - Anual

- [ ] **Fecha de primer ajuste:** (ej: 2025-04-01)

- [ ] **Aplica a:**
  - Solo alquiler
  - Alquiler + Expensas
  - Todos los ítems

- [ ] **Modo de redondeo:**
  - Sin redondeo
  - A la centena ($100)
  - Al millar ($1,000)

**Ejemplo de configuración:**
```
Índice: IPC
Frecuencia: Trimestral
Primer ajuste: 2025-04-01
Aplica a: Solo alquiler
Redondeo: Millar

Interpretación:
- Cada 3 meses el alquiler se ajustará por IPC
- Primer ajuste: Abril 2025 (comparará IPC Oct vs Ene)
- Resultado se redondeará al múltiplo de $1,000 más cercano
```

**PASO 4: Métodos de Pago y Distribución**

*Método de Pago por Ítem:*

| Ítem | Método de Pago |
|------|----------------|
| Alquiler | Transferencia bancaria |
| Expensas | Transferencia bancaria |
| Servicios | Transferencia bancaria |

*Distribución entre Propietarios:*

El sistema auto-completa según % de propiedad:

| Propietario | % | Cuenta Destino |
|-------------|---|----------------|
| Juan Pérez | 60% | CBU: 1234567890123456789012 |
| María López | 40% | CBU: 9876543210987654321098 |

✅ **Validación:** Suma = 100%

*Comisión de Administración:*

- [ ] Porcentaje de comisión (ej: 8%)
- [ ] Aplica sobre: Alquiler bruto / Alquiler neto

**PASO 5: Documentos del Contrato**

- [ ] Subir contrato firmado (PDF)
- [ ] Subir comprobante de depósito
- [ ] Subir garantía (si aplica)
- [ ] Otros documentos

**Guardar Borrador:** Click en `Guardar como Borrador`

⚠️ **Importante:** El contrato queda en estado `draft` (borrador) hasta que lo actives.

#### Activar el Contrato

🚀 **ACCIÓN CRÍTICA**

Una vez que verificaste que todo está correcto:

1. Ir a `Contratos > Ver Contrato [número]`
2. Verificar todos los datos en el resumen
3. Click en `Activar Contrato`
4. Confirmar acción

**El sistema ejecutará automáticamente:**

<lov-mermaid>
graph TD
    A[Click 'Activar Contrato'] --> B{Validaciones}
    B -->|✅ Pasó| C[Cambiar estado a 'active']
    B -->|❌ Falló| Z[Mostrar error]
    
    C --> D[Crear pms_contract_current]
    D --> E[Generar payment_schedule_items]
    E --> F[Crear usuario INQUILINO]
    F --> G[Crear usuarios PROPIETARIOS]
    G --> H[Enviar email a SUPERADMIN]
    H --> I[Enviar email a INMOBILIARIA]
    I --> J[Enviar email a INQUILINO]
    J --> K[Enviar emails a PROPIETARIOS]
    K --> L[Cambiar propiedad a 'Ocupada']
    L --> M[Registrar en activation_logs]
    M --> N[✅ Activación Completa]
    
    style C fill:#3498db,color:#fff
    style F fill:#9b59b6,color:#fff
    style G fill:#9b59b6,color:#fff
    style N fill:#2ecc71,color:#fff
    style Z fill:#e74c3c,color:#fff
</lov-mermaid>

**Emails enviados:**

1. **Al SUPERADMIN (Granada):**
   - Notificación de contrato activado
   - Datos del contrato
   - Link al detalle

2. **A ti (INMOBILIARIA/ADMIN):**
   - Confirmación de activación exitosa
   - Resumen del contrato
   - Próximos pasos

3. **Al INQUILINO:**
   ```
   Asunto: Bienvenido a tu Portal Granada - Contrato [número]
   
   Hola [Nombre Inquilino],
   
   Tu contrato de alquiler ha sido activado.
   
   ACCESO A TU PORTAL:
   ---------------------
   URL: https://[dominio]/pms/login
   Usuario: [email-inquilino]
   Contraseña temporal: [TEMP-XXXXX]
   
   Desde tu portal podrás:
   - Ver detalles de tu contrato
   - Consultar calendario de pagos
   - Subir comprobantes de pago
   - Solicitar mantenimiento
   
   DATOS DE PAGO:
   ---------------------
   Monto mensual: $133,000
   Día de vencimiento: 10 de cada mes
   CBU para transferencia: [CBU]
   Alias: [alias]
   
   Saludos,
   [Nombre Inmobiliaria]
   ```

4. **A cada PROPIETARIO:**
   ```
   Asunto: Tu propiedad ha sido alquilada - Portal Propietario
   
   Hola [Nombre Propietario],
   
   Tu propiedad en [Dirección] ha sido alquilada.
   
   ACCESO A TU PORTAL:
   ---------------------
   URL: https://[dominio]/pms/login
   Usuario: [email-propietario]
   Contraseña temporal: [TEMP-XXXXX]
   
   Desde tu portal podrás:
   - Ver detalles del contrato
   - Consultar pagos recibidos
   - Descargar reportes mensuales
   - Ver gastos de tu propiedad
   
   DATOS DEL CONTRATO:
   ---------------------
   Inquilino: [Nombre]
   Alquiler mensual: $133,000
   Inicio: [Fecha] - Fin: [Fecha]
   Tu participación: [%]
   
   Recibirás reportes mensuales automáticamente.
   
   Saludos,
   [Nombre Inmobiliaria]
   ```

✅ **Verificación Post-Activación:**

- [ ] Estado del contrato cambió a "Activo"
- [ ] Propiedad cambió a estado "Ocupada"
- [ ] Aparece en Calendario de Pagos
- [ ] Inquilino puede acceder a su portal
- [ ] Propietarios pueden acceder a sus portales

### 6.7 Configurar Métodos de Pago

Esto ya se hace al crear el contrato (Paso 4), pero puede editarse después:

1. Ir a `Contratos > [Contrato] > Métodos de Pago`
2. Editar si es necesario
3. Guardar cambios

---

## 7. Configuración de Procesos

### 7.1 Notificaciones Automáticas

**Ubicación:** `Configuración > Notificaciones`

#### Emails de Recordatorio de Pago

Configura cuándo y cómo notificar a inquilinos:

- [ ] **Recordatorio 7 días antes:** ☑️ Activo
  - Asunto: "Recordatorio: Pago de alquiler próximo"
  
- [ ] **Recordatorio 1 día antes:** ☑️ Activo
  - Asunto: "Importante: Vence mañana tu alquiler"
  
- [ ] **Día de vencimiento:** ☑️ Activo
  - Asunto: "Tu pago vence hoy"
  
- [ ] **Pago vencido (+1 día):** ☑️ Activo
  - Asunto: "Tu pago está vencido"
  
- [ ] **Pago vencido (+7 días):** ☑️ Activo
  - Asunto: "Urgente: Pago con 7 días de mora"

**Personalizar templates (opcional):**
- Puedes editar el contenido de cada email
- Variables disponibles: `{{nombre}}`, `{{monto}}`, `{{fecha_vencimiento}}`, etc.

#### Notificaciones a Inmobiliaria

- [ ] **Pago registrado:** Email cuando se registra un pago
- [ ] **Gasto pendiente de aprobación:** Cuando se crea un gasto
- [ ] **Mantenimiento solicitado:** Cuando inquilino solicita reparación
- [ ] **Vencimiento de contrato cercano:** 30 días antes del fin

### 7.2 Reportes Automáticos

**Ubicación:** `Configuración > Reportes`

#### Configuración de Reportes Mensuales

- [ ] **Activar envío automático:** ☑️ Sí
- [ ] **Día de envío:** 5 de cada mes (configurable 1-10)
- [ ] **Formato:** PDF (default) / Excel / Ambos
- [ ] **Incluir gráficos:** ☑️ Sí
- [ ] **Idioma:** Español

**Destinatarios:**
- ☑️ Propietarios (automático, según contratos activos)
- ☑️ Copia a inmobiliaria (email configurado en datos empresa)

### 7.3 Sincronización de Tipos de Cambio

**Ubicación:** `Tipos de Cambio > Configuración`

Si trabajas con contratos en USD:

- [ ] **Sincronización automática:** ☑️ Activa
- [ ] **Fuente de cotización:**
  - Banco Nación API
  - DolarSi API
  - Otro
- [ ] **Horario de sync:** 10:00 AM (diario)
- [ ] **Notificar si falla:** ☑️ Sí (email a admin)

---

## 8. Checklist de Verificación Final

### ✅ Pre-Launch Checklist

Antes de comenzar a operar en producción, verifica:

#### Configuración de Empresa

- [ ] Logo de la empresa subido y visible
- [ ] Datos de contacto completos y correctos
- [ ] Datos bancarios de la empresa configurados
- [ ] Email institucional verificado

#### Usuarios y Accesos

- [ ] Al menos 1 usuario ADMINISTRADOR creado (además del principal)
- [ ] Todos los usuarios creados recibieron y confirmaron email
- [ ] Contraseñas temporales fueron cambiadas
- [ ] Permisos de cada usuario verificados

#### Datos Maestros

- [ ] Al menos 1 propietario cargado con datos bancarios completos
- [ ] Al menos 1 propiedad cargada y asociada a propietario
- [ ] Al menos 1 inquilino cargado
- [ ] Índices económicos últimos 12 meses cargados (si usas ajustes)

#### Contratos

- [ ] Al menos 1 contrato de prueba creado
- [ ] Contrato de prueba activado exitosamente
- [ ] Verificado que se crearon usuarios portal (inquilino + propietarios)
- [ ] Verificado que se enviaron emails de bienvenida
- [ ] Verificado que calendario de pagos se generó correctamente

#### Procesos Automatizados

- [ ] Notificaciones de pago configuradas y activas
- [ ] Reportes mensuales configurados
- [ ] Día de envío de reportes definido
- [ ] (Si aplica) Sincronización de USD configurada

#### Portales

- [ ] Probado acceso a portal de inquilino (con usuario de prueba)
- [ ] Probado acceso a portal de propietario (con usuario de prueba)
- [ ] Verificado que la información mostrada es correcta

#### Testing Completo

- [ ] Crear contrato desde cero
- [ ] Activar contrato
- [ ] Registrar pago de prueba
- [ ] Verificar distribución a propietarios
- [ ] Crear gasto de prueba
- [ ] Aprobar gasto
- [ ] Verificar que gasto se deduce del pago
- [ ] Generar reporte manual de propietario
- [ ] Descargar PDF del reporte

### 🚨 Puntos Críticos de Verificación

Estos son los errores más comunes. Verifica especialmente:

| Aspecto | ¿Qué verificar? | ✅/❌ |
|---------|-----------------|-------|
| **Propietarios** | Todos tienen datos bancarios (CBU) | [ ] |
| **Propiedades** | Suma de % de propietarios = 100% | [ ] |
| **Contratos** | Índices necesarios están cargados | [ ] |
| **Contratos** | Fechas de ajuste son futuras (no pasadas) | [ ] |
| **Distribución** | Cuentas destino están correctas | [ ] |
| **Emails** | No van a spam (verificar carpeta spam) | [ ] |

---

## 9. Roadmap Post-Configuración

### Primeros 30 Días

<lov-mermaid>
gantt
    title Plan de Implementación - Primeros 30 Días
    dateFormat YYYY-MM-DD
    
    section Semana 1
    Configuración inicial           :done, 2025-01-01, 3d
    Carga de datos maestros         :done, 2025-01-04, 4d
    
    section Semana 2
    Creación de contratos           :active, 2025-01-08, 5d
    Activación progresiva           :2025-01-13, 2d
    
    section Semana 3
    Pruebas de portales             :2025-01-15, 3d
    Ajustes y correcciones          :2025-01-18, 4d
    
    section Semana 4
    Capacitación equipo             :2025-01-22, 3d
    Monitoreo procesos automáticos  :2025-01-25, 5d
    
    section Semana 5+
    Operación normal                :2025-02-01, 30d
</lov-mermaid>

### Semana 1: Configuración

**Días 1-3:**
- Primer login y cambio de contraseña
- Configurar datos de empresa
- Subir logo
- Crear usuarios del equipo

**Días 4-7:**
- Cargar propietarios (todos o primeros 10)
- Cargar propiedades (todas o primeras 10)
- Cargar inquilinos
- Cargar índices económicos

### Semana 2: Contratos

**Días 8-12:**
- Crear contratos (todos o por fases)
- Revisar configuración de cada contrato
- Verificar proyecciones mensuales

**Días 13-14:**
- Activar contratos (progresivamente)
- Verificar emails enviados
- Verificar accesos a portales

### Semana 3: Testing

**Días 15-17:**
- Probar portal de inquilino
- Probar portal de propietario
- Subir comprobantes de prueba
- Solicitar mantenimiento de prueba

**Días 18-21:**
- Registrar pagos históricos (si migraste contratos en curso)
- Corregir errores encontrados
- Afinar configuraciones

### Semana 4: Capacitación

**Días 22-24:**
- Capacitar a tu equipo en uso del sistema
- Documentar procedimientos internos
- Definir responsables de cada proceso

**Días 25-30:**
- Monitorear que procesos automáticos funcionen
- Verificar envío de recordatorios
- Verificar generación de reportes

### Mes 2 en adelante: Operación Normal

- Registro de pagos mensual
- Aprobación de gastos
- Gestión de mantenimiento
- Revisión de reportes
- Ajustes de contratos (automáticos)
- Renovaciones de contratos próximos a vencer

---

## 10. Soporte y Ayuda

### 10.1 Canales de Soporte

Durante la configuración inicial y siempre que lo necesites:

| Canal | Uso | Tiempo de Respuesta |
|-------|-----|---------------------|
| **Email** | soporte@granadaplatform.com | 24-48 hs |
| **WhatsApp** | +54 9 XXX XXX-XXXX | Inmediato (horario laboral) |
| **Chat en vivo** | Desde la plataforma (💬 esquina inferior derecha) | Inmediato (horario laboral) |
| **Base de conocimiento** | https://docs.granadaplatform.com | 24/7 |

**Horario de atención:**
- Lunes a Viernes: 9:00 a 18:00 hs (GMT-3)
- Sábados: 9:00 a 13:00 hs
- Domingos y feriados: Solo urgencias

### 10.2 Recursos de Ayuda

**Dentro de la plataforma:**
- `Ayuda > Preguntas Frecuentes`
- `Ayuda > Tutoriales en Video`
- `Ayuda > Guías en PDF`

**Videos recomendados:**
1. "Configuración Inicial - 15 minutos"
2. "Crear tu Primer Contrato - 10 minutos"
3. "Activar Contratos y Portales - 8 minutos"
4. "Registrar Pagos y Distribuciones - 12 minutos"

### 10.3 Webinars de Onboarding

Granada ofrece webinars grupales de onboarding:

- **Frecuencia:** Semanales (martes y jueves 15:00 hs)
- **Duración:** 90 minutos
- **Contenido:**
  - Demo completa de la plataforma
  - Mejores prácticas
  - Q&A en vivo
- **Registro:** Desde tu cuenta en `Ayuda > Webinars`

### 10.4 Sesión Personalizada

Si tu plan lo incluye, puedes solicitar:

- **Sesión 1-on-1 con especialista:** 60 minutos
- **Asistencia en migración de datos:** Según volumen
- **Configuración avanzada:** Personalizaciones

**Solicitar:** Enviar email a onboarding@granadaplatform.com

---

## 11. Errores Comunes y Soluciones

### 11.1 Error al Activar Contrato

**Síntoma:**
```
Error: No se puede activar el contrato.
Motivo: Índices económicos no disponibles.
```

**Causa:** Faltan índices para calcular el primer ajuste.

**Solución:**
1. Verificar qué índice usa el contrato (IPC, ICL)
2. Verificar fecha de primer ajuste
3. Ir a `Índices Económicos`
4. Cargar índices del período base y actual
5. Reintentar activación

---

**Síntoma:**
```
Error: No se puede crear usuario portal para inquilino.
Motivo: Email ya existe.
```

**Causa:** Ya existe un usuario (posiblemente de otro tenant o prueba anterior).

**Solución:**
1. Verificar email del inquilino
2. Si es correcto, contactar a soporte
3. Si es incorrecto, editar inquilino y cambiar email
4. Reintentar activación

---

### 11.2 Email de Bienvenida no Llega

**Síntoma:** Usuario creado pero no recibe email.

**Posibles causas y soluciones:**

1. **Email en carpeta de Spam:**
   - Pedir al usuario revisar spam/correo no deseado
   - Marcar como "No es spam"
   - Agregar `@granadaplatform.com` a contactos

2. **Email incorrecto:**
   - Verificar que el email esté bien escrito
   - Editar usuario y corregir
   - Reenviar email manualmente (botón en listado de usuarios)

3. **Proveedor de email bloqueando:**
   - Algunos proveedores corporativos tienen filtros estrictos
   - Pedir al usuario verificar con su IT
   - Agregar dominio a whitelist

**Reenviar credenciales manualmente:**
1. Ir a `Equipo Administrativo` o listado de usuarios
2. Buscar usuario
3. Click en menú (⋮)
4. Seleccionar "Reenviar Email de Bienvenida"

---

### 11.3 Suma de % de Propietarios ≠ 100%

**Síntoma:**
```
Error: La suma de porcentajes debe ser 100%.
Actual: 98%
```

**Solución:**
1. Ir a `Propiedades > [Propiedad] > Propietarios`
2. Revisar % de cada uno
3. Ajustar hasta que sume exactamente 100%
4. Guardar

**Truco:** Si tienes problema redondeando decimales, el sistema acepta hasta 2 decimales (ej: 33.33%, 33.33%, 33.34%)

---

### 11.4 No Puedo Registrar Más Propiedades

**Síntoma:**
```
Error: Límite de propiedades alcanzado.
Tu plan permite 50 propiedades. Actualmente tienes 50.
```

**Solución:**
1. Ir a `Mi Suscripción`
2. Ver plan actual y límites
3. Opciones:
   - **Eliminar propiedades inactivas** (si tienes)
   - **Solicitar upgrade de plan:**
     - Click en "Cambiar Plan"
     - Seleccionar plan superior
     - Enviar solicitud
     - Granada Admin aprobará en 24-48 hs

---

### 11.5 Aplicación de Índice No Funciona

**Síntoma:** Llegó la fecha de ajuste pero el contrato no se ajustó.

**Diagnóstico:**
1. Ir a `Contratos > [Contrato] > Proyecciones`
2. Buscar el mes del ajuste
3. Ver columna "Estado"
   - Si dice "Índices pendientes" → Faltan índices
   - Si dice "Listo" → El ajuste debería haberse aplicado

**Solución si faltan índices:**
1. Ver qué índice necesita (ej: IPC Enero)
2. Ir a `Índices Económicos`
3. Cargar índice faltante
4. El cron job del día siguiente aplicará el ajuste automáticamente
5. O puedes forzar recálculo: `Contratos > [Contrato] > Proyecciones > Recalcular`

**Solución si índices están pero no se aplicó:**
1. Verificar que fecha de ajuste haya pasado
2. Contactar a soporte (puede ser problema del cron job)

---

## 12. Certificación de Configuración

### 12.1 Checklist de Certificación

Una vez completados todos los pasos, puedes certificar tu configuración:

#### ✅ Nivel 1: Configuración Básica (Obligatorio)

- [ ] Empresa configurada con logo y datos completos
- [ ] Al menos 1 usuario ADMINISTRADOR adicional creado
- [ ] Al menos 1 propietario con datos bancarios
- [ ] Al menos 1 propiedad asociada a propietario
- [ ] Al menos 1 inquilino registrado
- [ ] Índices económicos cargados (si usas ajustes)

#### ✅ Nivel 2: Primer Contrato (Obligatorio)

- [ ] Al menos 1 contrato creado
- [ ] Contrato activado exitosamente
- [ ] Portales de inquilino y propietario funcionando
- [ ] Emails de bienvenida recibidos y confirmados
- [ ] Calendario de pagos generado correctamente

#### ✅ Nivel 3: Procesos (Recomendado)

- [ ] Al menos 1 pago registrado
- [ ] Distribución a propietarios verificada
- [ ] Al menos 1 gasto creado y aprobado
- [ ] Reporte de propietario generado manualmente
- [ ] Notificaciones automáticas configuradas

#### ✅ Nivel 4: Avanzado (Opcional)

- [ ] Múltiples contratos activos
- [ ] Configuración personalizada de emails
- [ ] Integración con tipos de cambio (si usas USD)
- [ ] Equipo completo capacitado

### 12.2 Solicitar Revisión

Si quieres que Granada Admin revise tu configuración:

1. Completar checklist arriba
2. Ir a `Ayuda > Solicitar Revisión de Configuración`
3. Completar breve cuestionario
4. Enviar solicitud
5. Especialista revisará en 48 hs
6.Recibirás feedback y recomendaciones

### 12.3 ¡Listo para Producción!

🎉 **Felicidades!** Si completaste todos los niveles obligatorios, tu sistema está listo para operar.

**Próximos pasos:**
- Comenzar a cargar tus contratos reales
- Migrar pagos históricos (si aplica)
- Comunicar a propietarios e inquilinos sobre los nuevos portales
- Aprovechar las automatizaciones para ahorrar tiempo

**Recuerda:**
- El sistema está diseñado para crecer contigo
- Puedes actualizar tu plan en cualquier momento
- Soporte está disponible siempre que lo necesites

---

## 📊 Resumen Visual del Proceso

<lov-mermaid>
graph TB
    A[🚀 Inicio] --> B[📋 Solicitud Suscripción]
    B --> C[⏳ Esperar Aprobación]
    C --> D[✅ Cuenta Activada]
    
    D --> E[👤 Configurar Usuario]
    E --> F[🏢 Configurar Empresa]
    F --> G[👥 Crear Equipo]
    
    G --> H[📦 Cargar Datos Maestros]
    H --> H1[Propietarios]
    H --> H2[Propiedades]
    H --> H3[Inquilinos]
    H --> H4[Índices]
    
    H1 --> I[📄 Crear Contratos]
    H2 --> I
    H3 --> I
    H4 --> I
    
    I --> J[⚡ Activar Contratos]
    J --> K[🔔 Configurar Procesos]
    K --> L[✅ Verificación]
    L --> M[🎉 ¡A Operar!]
    
    style A fill:#3498db,color:#fff
    style J fill:#e74c3c,color:#fff
    style M fill:#2ecc71,color:#fff
</lov-mermaid>

---

**Última actualización:** 2025-11-21  
**Versión:** 1.0  

**¿Dudas o problemas?**  
📧 soporte@granadaplatform.com  
💬 Chat en vivo desde la plataforma  
📱 WhatsApp: +54 9 XXX XXX-XXXX

---

**¡Bienvenido a Granada Platform!** 🏠✨
