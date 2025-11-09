export type PMSRole = 'SUPERADMIN' | 'INMOBILIARIA' | 'ADMINISTRADOR' | 'PROPIETARIO' | 'INQUILINO' | 'PROVEEDOR';

export interface RoleExample {
  title: string;
  description: string;
  steps: string[];
  moduleLinks: string[];
}

export interface RoleFAQ {
  question: string;
  answer: string;
}

export interface RoleData {
  role: PMSRole;
  level: string;
  tenantType: string;
  description: string;
  permissions: string[];
  useCases: string[];
  limitations: string[];
  examples: RoleExample[];
  faqs: RoleFAQ[];
}

export const rolesData: Record<PMSRole, RoleData> = {
  SUPERADMIN: {
    role: 'SUPERADMIN',
    level: 'Sistema',
    tenantType: 'sistema',
    description: 'Administrador global del sistema PMS. Tiene acceso total y control sobre todos los tenants, usuarios y configuraciones del sistema.',
    permissions: [
      'Acceso completo a todos los tenants',
      'Crear y gestionar tenants (inmobiliarias, administradores)',
      'Aprobar/rechazar solicitudes de acceso al PMS',
      'Gestionar usuarios del sistema',
      'Configurar límites de usuarios por tenant',
      'Gestionar índices económicos globales (ICL, IPC, salario)',
      'Crear y modificar propiedades en cualquier tenant',
      'Acceso total a reportes y analytics del sistema',
      'Configurar parámetros globales del sistema',
      'Monitorear actividad de todos los usuarios'
    ],
    useCases: [
      'Administración central del sistema',
      'Onboarding de nuevas inmobiliarias',
      'Gestión de solicitudes de acceso',
      'Mantenimiento de índices económicos',
      'Soporte técnico avanzado',
      'Auditoría y monitoreo del sistema'
    ],
    limitations: [
      'Responsabilidad sobre la seguridad del sistema',
      'No debe modificar datos de clientes sin autorización',
      'Debe mantener confidencialidad de información sensible'
    ],
    examples: [
      {
        title: 'Aprobar Solicitud de Acceso',
        description: 'Proceso para aprobar una nueva inmobiliaria en el sistema',
        steps: [
          'Ir a Admin → Aprobaciones de Usuarios',
          'Revisar la solicitud y datos del solicitante',
          'Verificar documentación adjunta',
          'Aprobar o rechazar con comentarios',
          'El usuario recibe notificación automática'
        ],
        moduleLinks: ['/admin']
      },
      {
        title: 'Actualizar Índices Económicos',
        description: 'Cómo actualizar ICL, IPC u otros índices',
        steps: [
          'Navegar a PMS → Índices',
          'Hacer clic en "Nuevo Índice"',
          'Seleccionar tipo (ICL, IPC, etc.)',
          'Ingresar fecha y valor',
          'Guardar - se aplicará a todos los contratos correspondientes'
        ],
        moduleLinks: ['/pms/indices']
      }
    ],
    faqs: [
      {
        question: '¿Cómo aprobar una solicitud de acceso al PMS?',
        answer: 'Ve a la sección Admin → Aprobaciones de Usuarios, revisa la solicitud, verifica los datos y aprueba o rechaza según corresponda.'
      },
      {
        question: '¿Puedo eliminar un tenant?',
        answer: 'Sí, pero solo si no tiene datos asociados (propiedades, contratos, etc.). Usa con precaución.'
      },
      {
        question: '¿Cómo se actualizan los índices económicos?',
        answer: 'En PMS → Índices puedes cargar nuevos valores manualmente o mediante importación masiva desde Excel.'
      }
    ]
  },
  INMOBILIARIA: {
    role: 'INMOBILIARIA',
    level: 'Tenant',
    tenantType: 'inmobiliaria',
    description: 'Empresa inmobiliaria que gestiona propiedades propias o de terceros. Opera como un tenant independiente con capacidad de crear sucursales.',
    permissions: [
      'Acceso completo a su tenant',
      'Crear y gestionar sucursales (sub-tenants)',
      'Gestionar usuarios de su tenant',
      'Crear y gestionar propiedades',
      'Crear y gestionar contratos de alquiler',
      'Registrar y gestionar propietarios',
      'Registrar y gestionar inquilinos',
      'Registrar pagos y gastos',
      'Generar reportes mensuales para propietarios',
      'Configurar métodos de pago por contrato',
      'Ver índices económicos (IPC/ICL) para entender ajustes de contratos',
      'Gestionar mantenimientos de propiedades',
      'Ver calendario de pagos y vencimientos',
      'Exportar recibos y comprobantes',
      'Recomendar solicitudes de acceso de usuarios para su tenant'
    ],
    useCases: [
      'Administración de cartera inmobiliaria',
      'Gestión de alquileres a largo plazo',
      'Control de pagos y distribuciones',
      'Relación con propietarios e inquilinos',
      'Generación de reportes mensuales',
      'Expansión con múltiples sucursales'
    ],
    limitations: [
      'No puede acceder a otros tenants tipo inmobiliaria',
      'No puede modificar índices económicos globales (solo SUPERADMIN puede editarlos)',
      'No puede aprobar solicitudes de acceso PMS (solo recomendar)',
      'Límite de usuarios según configuración del tenant'
    ],
    examples: [
      {
        title: 'Crear un Contrato de Alquiler',
        description: 'Pasos para crear un nuevo contrato entre propietario e inquilino',
        steps: [
          'Asegurarse de tener la propiedad creada',
          'Ir a Contratos → Nuevo Contrato',
          'Seleccionar propiedad, propietario e inquilino',
          'Definir monto, tipo de ajuste (ICL/IPC/Fijo), fechas',
          'Configurar método de pago y distribución',
          'Guardar - se genera automáticamente el calendario de pagos'
        ],
        moduleLinks: ['/pms/contracts']
      },
      {
        title: 'Registrar un Pago de Inquilino',
        description: 'Cómo registrar el pago mensual del alquiler',
        steps: [
          'Ir a Pagos',
          'Buscar el contrato correspondiente',
          'Hacer clic en el mes a pagar',
          'Subir comprobante de pago',
          'Confirmar - se distribuye automáticamente al propietario'
        ],
        moduleLinks: ['/pms/payments']
      }
    ],
    faqs: [
      {
        question: '¿Cómo creo una sucursal?',
        answer: 'Contacta al SUPERADMIN para crear un sub-tenant vinculado a tu inmobiliaria.'
      },
      {
        question: '¿Puedo gestionar propiedades de terceros?',
        answer: 'Sí, puedes registrar propietarios y administrar sus propiedades cobrando una comisión.'
      },
      {
        question: '¿Cómo se distribuyen los pagos?',
        answer: 'Al registrar un pago, el sistema calcula automáticamente la distribución según el porcentaje de comisión configurado en el contrato.'
      }
    ]
  },
  ADMINISTRADOR: {
    role: 'ADMINISTRADOR',
    level: 'Tenant (Independiente)',
    tenantType: 'administrador',
    description: 'Tenant independiente que administra propiedades de terceros. No está vinculado a ninguna INMOBILIARIA y opera de forma autónoma, con capacidades similares a una INMOBILIARIA pero en su propio contexto.',
    permissions: [
      'Acceso completo a su tenant',
      'Gestionar usuarios de su tenant',
      'Crear y gestionar propiedades',
      'Crear y gestionar contratos de alquiler',
      'Registrar y gestionar propietarios (de terceros)',
      'Registrar y gestionar inquilinos',
      'Registrar pagos y gastos',
      'Generar reportes mensuales para propietarios',
      'Configurar métodos de pago por contrato',
      'Ver índices económicos (IPC/ICL) para entender ajustes de contratos',
      'Gestionar mantenimientos de propiedades',
      'Ver calendario de pagos y vencimientos',
      'Exportar recibos y comprobantes',
      'Recomendar solicitudes de acceso de usuarios para su tenant'
    ],
    useCases: [
      'Gestor profesional de propiedades de terceros',
      'Administración de carteras inmobiliarias',
      'Gestión integral de alquileres',
      'Relación directa con propietarios e inquilinos',
      'Generación de reportes mensuales independientes'
    ],
    limitations: [
      'No puede acceder a otros tenants tipo administrador o inmobiliaria',
      'No puede modificar índices económicos globales (solo SUPERADMIN)',
      'No puede aprobar solicitudes de acceso PMS (solo recomendar)',
      'Límite de usuarios según configuración del tenant (por defecto 2, configurable)'
    ],
    examples: [
      {
        title: 'Administrar Propiedad de Tercero',
        description: 'Cómo gestionar una propiedad en nombre de un propietario',
        steps: [
          'Crear el propietario en Propietarios',
          'Crear la propiedad asignándola al propietario',
          'Crear contrato con inquilino',
          'Configurar comisión de administración',
          'Registrar pagos mensualmente',
          'Generar y enviar reporte mensual al propietario'
        ],
        moduleLinks: ['/pms/properties', '/pms/owners', '/pms/contracts']
      }
    ],
    faqs: [
      {
        question: '¿Cuál es la diferencia entre ADMINISTRADOR e INMOBILIARIA?',
        answer: 'El ADMINISTRADOR es un tenant independiente, ideal para profesionales que administran propiedades sin una estructura empresarial formal. La INMOBILIARIA puede tener sucursales y más usuarios. Ambos tienen capacidades operativas similares.'
      },
      {
        question: '¿Puedo tener más de 2 usuarios?',
        answer: 'Sí, contacta al SUPERADMIN para aumentar el límite de usuarios de tu tenant.'
      },
      {
        question: '¿Cómo cobro mi comisión de administración?',
        answer: 'Se configura en el contrato mediante el porcentaje de comisión. Al registrar pagos, el sistema calcula automáticamente la distribución.'
      }
    ]
  },
  PROPIETARIO: {
    role: 'PROPIETARIO',
    level: 'Usuario dentro de Tenant',
    tenantType: 'propietario (o dentro de inmobiliaria/administrador)',
    description: 'Dueño de una o más propiedades. Puede gestionar sus propiedades directamente o a través de una inmobiliaria/administrador.',
    permissions: [
      'Ver sus propiedades',
      'Ver contratos de sus propiedades',
      'Ver pagos recibidos y distribuciones',
      'Ver gastos asociados a sus propiedades',
      'Ver índices económicos (IPC/ICL) para entender ajustes de alquiler',
      'Descargar reportes mensuales',
      'Ver calendario de vencimientos',
      'Acceder a recibos y comprobantes',
      'Solicitar mantenimientos (si gestiona directamente)'
    ],
    useCases: [
      'Monitoreo de ingresos por alquileres',
      'Revisión de gastos de propiedades',
      'Descarga de reportes fiscales',
      'Control de pagos de inquilinos',
      'Gestión de propiedades propias'
    ],
    limitations: [
      'No puede modificar contratos (solo verlos)',
      'No puede registrar pagos directamente',
      'No puede crear nuevos inquilinos',
      'Solo ve información de sus propias propiedades',
      'No puede acceder a reportes de otros propietarios'
    ],
    examples: [
      {
        title: 'Descargar Reporte Mensual',
        description: 'Cómo acceder a tu reporte de ingresos mensuales',
        steps: [
          'Ir a Reportes',
          'Seleccionar mes y año',
          'Hacer clic en "Descargar PDF"',
          'El reporte incluye pagos recibidos, gastos deducidos y neto'
        ],
        moduleLinks: ['/pms/reports']
      },
      {
        title: 'Revisar Gastos de tu Propiedad',
        description: 'Verificar qué gastos se descontaron de tus ingresos',
        steps: [
          'Ir a Gastos',
          'Filtrar por tu propiedad',
          'Ver detalles, comprobantes y montos',
          'Los gastos aparecen deducidos en el reporte mensual'
        ],
        moduleLinks: ['/pms/expenses']
      }
    ],
    faqs: [
      {
        question: '¿Cómo sé si mi inquilino pagó?',
        answer: 'En la sección Pagos puedes ver el calendario de vencimientos y cuáles pagos fueron registrados.'
      },
      {
        question: '¿Por qué mi reporte muestra menos dinero del esperado?',
        answer: 'Los gastos asociados a tu propiedad (expensas, reparaciones, comisiones) se descuentan automáticamente. Revisa la sección Gastos para detalles.'
      },
      {
        question: '¿Puedo cambiar el monto del alquiler?',
        answer: 'No directamente. Contacta a la inmobiliaria/administrador que gestiona tu propiedad para solicitar ajustes.'
      }
    ]
  },
  INQUILINO: {
    role: 'INQUILINO',
    level: 'Usuario dentro de Tenant',
    tenantType: 'inquilino (dentro de inmobiliaria/administrador)',
    description: 'Arrendatario de una propiedad. Puede ver información de su contrato, subir comprobantes de pago y solicitar mantenimientos.',
    permissions: [
      'Ver su contrato activo',
      'Ver índices económicos (IPC/ICL) para entender ajustes de alquiler',
      'Ver calendario de pagos y vencimientos',
      'Subir comprobantes de pago',
      'Ver pagos registrados',
      'Solicitar mantenimientos de la propiedad',
      'Ver estado de solicitudes de mantenimiento',
      'Descargar recibos de alquiler'
    ],
    useCases: [
      'Subir comprobantes de pago mensuales',
      'Consultar fechas de vencimiento',
      'Solicitar reparaciones o mantenimiento',
      'Descargar recibos para declaración fiscal',
      'Ver historial de pagos realizados'
    ],
    limitations: [
      'Solo ve información de su propio contrato',
      'No puede modificar montos ni fechas de pago',
      'No puede acceder a reportes del propietario',
      'No puede ver otros contratos o propiedades',
      'No puede registrar pagos directamente (solo subir comprobantes)'
    ],
    examples: [
      {
        title: 'Subir Comprobante de Pago',
        description: 'Cómo informar que realizaste el pago del alquiler',
        steps: [
          'Ir a Mi Contrato o Pagos',
          'Hacer clic en el mes correspondiente',
          'Subir imagen o PDF del comprobante',
          'Confirmar - el administrador lo revisará y registrará el pago'
        ],
        moduleLinks: ['/pms/my-contract', '/pms/payments']
      },
      {
        title: 'Solicitar Mantenimiento',
        description: 'Cómo reportar una reparación necesaria',
        steps: [
          'Ir a Mantenimiento',
          'Hacer clic en "Nueva Solicitud"',
          'Describir el problema y adjuntar fotos',
          'Seleccionar prioridad',
          'Enviar - recibirás notificaciones del estado'
        ],
        moduleLinks: ['/pms/maintenance']
      }
    ],
    faqs: [
      {
        question: '¿Cómo subo mi comprobante de pago?',
        answer: 'En la sección Pagos, haz clic en el mes que pagaste y sube la imagen o PDF del comprobante de transferencia.'
      },
      {
        question: '¿Puedo pagar con tarjeta de crédito?',
        answer: 'Depende de los métodos de pago configurados por la inmobiliaria. Consulta en tu contrato o contacta al administrador.'
      },
      {
        question: '¿Qué hago si tengo una emergencia en la propiedad?',
        answer: 'Crea una solicitud de mantenimiento con prioridad "Urgente" y contacta también por teléfono a la inmobiliaria/administrador.'
      }
    ]
  },
  PROVEEDOR: {
    role: 'PROVEEDOR',
    level: 'Usuario dentro de Tenant',
    tenantType: 'proveedor_servicios',
    description: 'Proveedor de servicios de mantenimiento. Recibe y gestiona solicitudes de reparaciones.',
    permissions: [
      'Ver solicitudes de mantenimiento asignadas',
      'Actualizar estado de solicitudes',
      'Subir evidencia de trabajos realizados',
      'Registrar costos de reparaciones'
    ],
    useCases: [
      'Gestión de órdenes de trabajo',
      'Seguimiento de reparaciones',
      'Facturación de servicios'
    ],
    limitations: [
      'Solo ve solicitudes asignadas a él',
      'No puede acceder a información financiera de contratos',
      'No puede modificar propiedades ni contratos'
    ],
    examples: [],
    faqs: [
      {
        question: '¿Cómo recibo las solicitudes de trabajo?',
        answer: 'Recibirás notificaciones cuando se te asigne una solicitud de mantenimiento.'
      }
    ]
  }
};

export interface ModulePermission {
  read: PMSRole[];
  write: PMSRole[];
}

export const modulePermissions: Record<string, ModulePermission> = {
  properties: {
    read: ['SUPERADMIN', 'INMOBILIARIA', 'ADMINISTRADOR', 'PROPIETARIO'],
    write: ['SUPERADMIN', 'INMOBILIARIA', 'ADMINISTRADOR']
  },
  owners: {
    read: ['SUPERADMIN', 'INMOBILIARIA', 'ADMINISTRADOR', 'PROPIETARIO'],
    write: ['SUPERADMIN', 'INMOBILIARIA', 'ADMINISTRADOR']
  },
  tenants: {
    read: ['SUPERADMIN', 'INMOBILIARIA', 'ADMINISTRADOR'],
    write: ['SUPERADMIN', 'INMOBILIARIA', 'ADMINISTRADOR']
  },
  contracts: {
    read: ['SUPERADMIN', 'INMOBILIARIA', 'ADMINISTRADOR', 'PROPIETARIO', 'INQUILINO'],
    write: ['SUPERADMIN', 'INMOBILIARIA', 'ADMINISTRADOR']
  },
  payments: {
    read: ['SUPERADMIN', 'INMOBILIARIA', 'ADMINISTRADOR', 'PROPIETARIO', 'INQUILINO'],
    write: ['SUPERADMIN', 'INMOBILIARIA', 'ADMINISTRADOR']
  },
  expenses: {
    read: ['SUPERADMIN', 'INMOBILIARIA', 'ADMINISTRADOR', 'PROPIETARIO', 'INQUILINO'],
    write: ['SUPERADMIN', 'INMOBILIARIA', 'ADMINISTRADOR']
  },
  receipts: {
    read: ['SUPERADMIN', 'INMOBILIARIA', 'ADMINISTRADOR', 'PROPIETARIO'],
    write: ['SUPERADMIN', 'INMOBILIARIA', 'ADMINISTRADOR']
  },
  maintenance: {
    read: ['SUPERADMIN', 'INMOBILIARIA', 'ADMINISTRADOR', 'INQUILINO', 'PROVEEDOR'],
    write: ['SUPERADMIN', 'INMOBILIARIA', 'ADMINISTRADOR', 'INQUILINO', 'PROVEEDOR']
  },
  reports: {
    read: ['SUPERADMIN', 'INMOBILIARIA', 'ADMINISTRADOR', 'PROPIETARIO'],
    write: ['SUPERADMIN', 'INMOBILIARIA', 'ADMINISTRADOR']
  },
  indices: {
    read: ['SUPERADMIN', 'INMOBILIARIA', 'ADMINISTRADOR', 'PROPIETARIO', 'INQUILINO'],
    write: ['SUPERADMIN']
  }
};
