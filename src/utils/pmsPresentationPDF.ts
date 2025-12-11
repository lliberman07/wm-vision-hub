import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Granada brand colors
const COLORS = {
  primary: [41, 98, 255] as [number, number, number],      // Blue
  secondary: [30, 41, 59] as [number, number, number],     // Dark slate
  accent: [16, 185, 129] as [number, number, number],      // Green
  white: [255, 255, 255] as [number, number, number],
  lightGray: [241, 245, 249] as [number, number, number],
  textDark: [15, 23, 42] as [number, number, number],
  textMuted: [100, 116, 139] as [number, number, number],
};

// Shared helpers
const addPageNumber = (doc: jsPDF, pageNum: number, totalPages: number) => {
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(`${pageNum} / ${totalPages}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
};

const addHeader = (doc: jsPDF, title: string, subtitle?: string) => {
  const pageWidth = doc.internal.pageSize.width;
  
  // Background header bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Title
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, 28);
  
  if (subtitle) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 20, 38);
  }
};

const addSlideTitle = (doc: jsPDF, title: string, y: number = 55) => {
  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, y);
  return y + 15;
};

const addBulletPoint = (doc: jsPDF, text: string, x: number, y: number, icon: string = '•') => {
  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${icon} ${text}`, x, y);
  return y + 10;
};

const addCoverSlide = (doc: jsPDF, version: string) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Full blue background
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Title
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(42);
  doc.setFont('helvetica', 'bold');
  doc.text('Granada Platform', pageWidth / 2, pageHeight / 2 - 30, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(24);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestión de Propiedades (PMS)', pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });
  
  // Version badge
  doc.setFontSize(14);
  doc.text(`Presentación ${version}`, pageWidth / 2, pageHeight / 2 + 35, { align: 'center' });
  
  // Date
  doc.setFontSize(12);
  doc.text(new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long' }), pageWidth / 2, pageHeight - 30, { align: 'center' });
};

// ============================================
// ULTRA-EXECUTIVE VERSION (5 slides) - 2 min
// ============================================
export const generateUltraExecutivePDF = () => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const totalPages = 5;
  
  // Slide 1: Cover
  addCoverSlide(doc, 'Ultra-Ejecutiva');
  addPageNumber(doc, 1, totalPages);
  
  // Slide 2: The Problem
  doc.addPage();
  addHeader(doc, 'El Problema', 'Lo que enfrentan las inmobiliarias hoy');
  let y = addSlideTitle(doc, '¿Te suena familiar?', 55);
  y += 10;
  
  const problems = [
    '❌ Planillas Excel desactualizadas y propensas a errores',
    '❌ Ajustes de alquiler calculados manualmente (ICL, IPC)',
    '❌ Propietarios llamando para preguntar por sus pagos',
    '❌ Horas perdidas generando reportes y comprobantes',
    '❌ Sin visibilidad de morosidad en tiempo real',
  ];
  
  problems.forEach(problem => {
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.textDark);
    doc.text(problem, 30, y);
    y += 18;
  });
  addPageNumber(doc, 2, totalPages);
  
  // Slide 3: The Solution
  doc.addPage();
  addHeader(doc, 'La Solución', 'Granada Platform automatiza todo');
  y = 55;
  
  const solutions = [
    ['✅ Ajustes automáticos', 'ICL, IPC, Casa Propia - sin calcular nada'],
    ['✅ Portal del propietario', 'Reportes y pagos en tiempo real'],
    ['✅ Alertas automáticas', 'Vencimientos, mora, renovaciones'],
    ['✅ Multi-moneda', 'ARS, USD, EUR con tipo de cambio diario'],
  ];
  
  solutions.forEach(([title, desc]) => {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(title, 30, y);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textMuted);
    doc.text(desc, 30, y + 8);
    y += 25;
  });
  addPageNumber(doc, 3, totalPages);
  
  // Slide 4: Your Earnings
  doc.addPage();
  addHeader(doc, 'Tu Ganancia', 'Modelo de negocio rentable');
  
  // Big numbers
  doc.setFontSize(48);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.accent);
  doc.text('$50,000', 60, 85);
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('por propiedad/mes', 60, 100);
  doc.setFontSize(12);
  doc.text('(8% comisión + fee administración)', 60, 112);
  
  // Plans
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.textDark);
  doc.setFont('helvetica', 'bold');
  doc.text('Planes Granada desde:', 180, 75);
  
  autoTable(doc, {
    startY: 85,
    margin: { left: 180 },
    head: [['Plan', 'Precio/mes']],
    body: [
      ['Básico', '$15,000'],
      ['Profesional', '$50,000'],
      ['Enterprise', '$120,000'],
    ],
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 12 },
    tableWidth: 80,
  });
  addPageNumber(doc, 4, totalPages);
  
  // Slide 5: CTA
  doc.addPage();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text('¡Probalo gratis 14 días!', pageWidth / 2, 70, { align: 'center' });
  
  doc.setFontSize(20);
  doc.setFont('helvetica', 'normal');
  doc.text('Sin tarjeta de crédito • Soporte incluido', pageWidth / 2, 95, { align: 'center' });
  
  doc.setFontSize(24);
  doc.text('📧 info@granada-platform.com', pageWidth / 2, 130, { align: 'center' });
  doc.text('🌐 granada-platform.com', pageWidth / 2, 150, { align: 'center' });
  
  addPageNumber(doc, 5, totalPages);
  
  return doc;
};

// ============================================
// EXECUTIVE VERSION (10 slides) - 10 min
// ============================================
export const generateExecutivePDF = () => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const totalPages = 10;
  
  // Slide 1: Cover
  addCoverSlide(doc, 'Ejecutiva');
  addPageNumber(doc, 1, totalPages);
  
  // Slide 2: Ecosystem
  doc.addPage();
  addHeader(doc, 'El Ecosistema Granada');
  
  autoTable(doc, {
    startY: 55,
    margin: { left: 20 },
    head: [['Actor', 'Rol', 'Beneficio Principal']],
    body: [
      ['Granada', 'Plataforma SaaS', 'Ingresos recurrentes por suscripciones'],
      ['Inmobiliarias/Admins', 'Suscriptores', 'Automatización + Comisiones'],
      ['Propietarios', 'Clientes finales', 'Transparencia y reportes'],
      ['Inquilinos', 'Usuarios del portal', 'Autogestión de pagos'],
    ],
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 12 },
  });
  addPageNumber(doc, 2, totalPages);
  
  // Slide 3: Subscribers
  doc.addPage();
  addHeader(doc, 'Nuestros Suscriptores', 'Inmobiliarias y Administradores');
  let y = 60;
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.textDark);
  doc.text('Modelo de Negocio del Suscriptor:', 20, y);
  y += 15;
  
  const subscriberModel = [
    '• Comisión sobre alquiler: 5% - 10% mensual',
    '• Fee de administración: $5,000 - $15,000/mes',
    '• Gastos extraordinarios: Se deducen del alquiler',
    '• Honorarios por contrato: 1-2 meses de alquiler',
  ];
  
  subscriberModel.forEach(item => {
    y = addBulletPoint(doc, item.substring(2), 25, y);
    y += 2;
  });
  addPageNumber(doc, 3, totalPages);
  
  // Slide 4: Subscriber Earnings
  doc.addPage();
  addHeader(doc, 'Lo que Gana el Suscriptor', 'Ejemplo con alquiler de $500,000');
  
  autoTable(doc, {
    startY: 55,
    margin: { left: 20 },
    head: [['Concepto', 'Monto']],
    body: [
      ['Alquiler mensual', '$500,000'],
      ['Comisión 8%', '+$40,000'],
      ['Fee administración', '+$10,000'],
      ['Total ingreso/propiedad', '$50,000/mes'],
      ['Con 20 propiedades', '$1,000,000/mes'],
    ],
    headStyles: { fillColor: COLORS.accent },
    styles: { fontSize: 14 },
    tableWidth: 150,
  });
  
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text('💡 El suscriptor paga $15,000-$120,000 de suscripción y gana múltiplos de eso', 20, 140);
  addPageNumber(doc, 4, totalPages);
  
  // Slide 5: Owner Benefits
  doc.addPage();
  addHeader(doc, 'Beneficios para el Propietario');
  y = 60;
  
  const ownerBenefits = [
    ['📊 Dashboard personal', 'Vista de todas sus propiedades en un solo lugar'],
    ['📈 Reportes mensuales', 'Ingresos netos, gastos, comisiones detalladas'],
    ['🔔 Notificaciones', 'Alertas de pagos, vencimientos, novedades'],
    ['📱 Acceso 24/7', 'Portal web responsive, siempre disponible'],
  ];
  
  ownerBenefits.forEach(([title, desc]) => {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.textDark);
    doc.text(title, 25, y);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textMuted);
    doc.text(desc, 25, y + 8);
    y += 22;
  });
  addPageNumber(doc, 5, totalPages);
  
  // Slide 6: Granada Plans
  doc.addPage();
  addHeader(doc, 'Planes Granada', 'Suscripciones mensuales y anuales');
  
  autoTable(doc, {
    startY: 55,
    margin: { left: 20 },
    head: [['Plan', 'Mensual', 'Anual', 'Propiedades', 'Contratos', 'Usuarios']],
    body: [
      ['Básico', '$15,000', '$150,000', '1', '2', '2'],
      ['Profesional', '$50,000', '$500,000', '5', '10', '5'],
      ['Enterprise', '$120,000', '$1,200,000', '15', '30', '10'],
    ],
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 12, halign: 'center' },
    columnStyles: { 0: { halign: 'left' } },
  });
  
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.accent);
  doc.text('✓ Plan anual incluye 2 meses gratis (17% descuento)', 20, 110);
  addPageNumber(doc, 6, totalPages);
  
  // Slide 7: Top 5 Features
  doc.addPage();
  addHeader(doc, 'Top 5 Funcionalidades');
  
  autoTable(doc, {
    startY: 55,
    margin: { left: 20 },
    head: [['#', 'Funcionalidad', 'Descripción']],
    body: [
      ['1', 'Ajustes Automáticos', 'ICL, IPC, Casa Propia aplicados automáticamente'],
      ['2', 'Multi-Moneda', 'ARS, USD, EUR con tipo de cambio diario'],
      ['3', 'Alertas Inteligentes', 'Vencimientos, mora, renovaciones automáticas'],
      ['4', 'Portal Propietario', 'Acceso 24/7 a reportes y pagos'],
      ['5', 'Reembolsos Auto', 'Gastos deducidos y distribuidos automáticamente'],
    ],
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 12 },
  });
  addPageNumber(doc, 7, totalPages);
  
  // Slide 8: Comparison
  doc.addPage();
  addHeader(doc, 'Granada vs Competencia');
  
  autoTable(doc, {
    startY: 55,
    margin: { left: 20 },
    head: [['Característica', 'Granada', 'Otros']],
    body: [
      ['Multi-índice (ICL/IPC)', '✅', '❌'],
      ['Multi-moneda real', '✅', 'Limitado'],
      ['Portal propietario', '✅', '❌'],
      ['Portal inquilino', '✅', '❌'],
      ['Reembolsos automáticos', '✅', '❌'],
      ['Alertas configurables', '✅', 'Básico'],
    ],
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 12, halign: 'center' },
    columnStyles: { 0: { halign: 'left' } },
  });
  addPageNumber(doc, 8, totalPages);
  
  // Slide 9: Benefits by Actor
  doc.addPage();
  addHeader(doc, 'Beneficios por Actor');
  
  autoTable(doc, {
    startY: 55,
    margin: { left: 10 },
    head: [['Granada', 'Inmobiliaria', 'Propietario', 'Inquilino']],
    body: [
      ['Ingresos recurrentes', 'Automatización', 'Transparencia', 'Autogestión'],
      ['Escalabilidad', 'Menos errores', 'Reportes 24/7', 'Portal de pagos'],
      ['Modelo SaaS', 'Más clientes', 'Menos llamadas', 'Historial'],
      ['Data analytics', 'Profesionalización', 'Confianza', 'Comprobantes'],
    ],
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 11, halign: 'center' },
  });
  addPageNumber(doc, 9, totalPages);
  
  // Slide 10: CTA
  doc.addPage();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('Próximos Pasos', pageWidth / 2, 60, { align: 'center' });
  
  const steps = [
    '1. Solicitar demo personalizada',
    '2. Activar prueba gratis 14 días',
    '3. Configurar propiedades y contratos',
    '4. ¡Automatizar tu gestión!',
  ];
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  let stepY = 85;
  steps.forEach(step => {
    doc.text(step, pageWidth / 2, stepY, { align: 'center' });
    stepY += 18;
  });
  
  doc.setFontSize(20);
  doc.text('📧 info@granada-platform.com', pageWidth / 2, 170, { align: 'center' });
  
  addPageNumber(doc, 10, totalPages);
  
  return doc;
};

// ============================================
// FULL VERSION (20 slides) - 30 min
// ============================================
export const generateFullPDF = () => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const totalPages = 20;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // ========== SECTION 1: OVERVIEW (Slides 1-3) ==========
  
  // Slide 1: Cover
  addCoverSlide(doc, 'Completa');
  addPageNumber(doc, 1, totalPages);
  
  // Slide 2: Ecosystem
  doc.addPage();
  addHeader(doc, 'El Ecosistema Granada', 'Modelo de negocio multi-actor');
  
  autoTable(doc, {
    startY: 55,
    margin: { left: 20 },
    head: [['Nivel', 'Actor', 'Función', 'Flujo de Dinero']],
    body: [
      ['1', 'Granada Platform', 'Proveedor SaaS', 'Recibe suscripciones'],
      ['2', 'Inmobiliarias/Admins', 'Suscriptores operadores', 'Pagan suscripción, cobran comisiones'],
      ['3', 'Propietarios', 'Dueños de inmuebles', 'Reciben neto de alquiler'],
      ['4', 'Inquilinos', 'Arrendatarios', 'Pagan alquiler + expensas'],
    ],
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 11 },
  });
  
  let y = 115;
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.textDark);
  doc.text('Flujo simplificado:', 20, y);
  y += 10;
  doc.setFontSize(12);
  doc.text('Inquilino → paga → Inmobiliaria → deduce comisión → Propietario', 20, y);
  y += 8;
  doc.text('Inmobiliaria → paga suscripción → Granada', 20, y);
  addPageNumber(doc, 2, totalPages);
  
  // Slide 3: Who are Subscribers
  doc.addPage();
  addHeader(doc, '¿Quiénes son los Suscriptores?');
  
  autoTable(doc, {
    startY: 55,
    margin: { left: 20 },
    head: [['Tipo', 'Descripción', 'Tamaño típico']],
    body: [
      ['Inmobiliarias', 'Empresas que gestionan propiedades de terceros', '10-500 propiedades'],
      ['Administradores independientes', 'Profesionales autónomos', '5-50 propiedades'],
      ['Administradores de consorcios', 'Gestión de edificios completos', '1-20 edificios'],
      ['Desarrolladores', 'Gestión de propiedades propias', '10-100 unidades'],
    ],
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 11 },
  });
  addPageNumber(doc, 3, totalPages);
  
  // ========== SECTION 2: PERSPECTIVES (Slides 4-6) ==========
  
  // Slide 4: Real Estate Perspective
  doc.addPage();
  addHeader(doc, 'Perspectiva: Inmobiliaria/Administrador');
  
  y = 55;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.textDark);
  doc.text('Funcionalidades principales:', 20, y);
  
  autoTable(doc, {
    startY: y + 5,
    margin: { left: 20 },
    body: [
      ['📁 Gestión de propiedades', '📝 Administración de contratos'],
      ['💰 Control de pagos', '📊 Reportes automáticos'],
      ['📈 Ajustes por índices', '🔔 Sistema de alertas'],
      ['👥 Multi-propietario', '💱 Multi-moneda'],
    ],
    styles: { fontSize: 11 },
    tableWidth: 200,
  });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Modelo de ingresos:', 20, 115);
  
  autoTable(doc, {
    startY: 120,
    margin: { left: 20 },
    head: [['Concepto', 'Rango típico', 'Ejemplo']],
    body: [
      ['Comisión mensual', '5% - 10%', '$40,000 (8% de $500,000)'],
      ['Fee administración', '$5,000 - $15,000', '$10,000/mes'],
      ['Honorarios contrato', '1-2 meses alquiler', '$500,000 - $1,000,000'],
    ],
    headStyles: { fillColor: COLORS.accent },
    styles: { fontSize: 10 },
    tableWidth: 200,
  });
  addPageNumber(doc, 4, totalPages);
  
  // Slide 5: Owner Perspective
  doc.addPage();
  addHeader(doc, 'Perspectiva: Propietario');
  
  y = 55;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.textDark);
  doc.text('¿Qué recibe el propietario?', 20, y);
  
  const ownerReceives = [
    ['🔔 Notificaciones en tiempo real', 'Pagos recibidos, gastos, novedades'],
    ['📊 Reportes mensuales automáticos', 'Detalle de ingresos y deducciones'],
    ['🌐 Portal de acceso 24/7', 'Dashboard con todas sus propiedades'],
    ['📜 Historial completo', 'Todos los movimientos y documentos'],
  ];
  
  y += 10;
  ownerReceives.forEach(([title, desc]) => {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(title, 25, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textMuted);
    doc.text(desc, 25, y + 6);
    y += 18;
  });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.textDark);
  doc.text('Cálculo de ingreso neto:', 170, 55);
  
  autoTable(doc, {
    startY: 60,
    margin: { left: 170 },
    body: [
      ['Alquiler bruto', '$500,000'],
      ['- Comisión (8%)', '-$40,000'],
      ['- Fee admin', '-$10,000'],
      ['- Gastos mes', '-$25,000'],
      ['= Neto propietario', '$425,000'],
    ],
    styles: { fontSize: 11 },
    tableWidth: 90,
    theme: 'striped',
  });
  addPageNumber(doc, 5, totalPages);
  
  // Slide 6: Granada Perspective
  doc.addPage();
  addHeader(doc, 'Perspectiva: Granada Platform');
  
  y = 55;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.textDark);
  doc.text('Modelo de negocio: SaaS por suscripción', 20, y);
  
  autoTable(doc, {
    startY: y + 5,
    margin: { left: 20 },
    head: [['Plan', 'Mensual', 'Anual', 'Props', 'Contratos', 'Usuarios', 'Sucursales']],
    body: [
      ['Básico', '$15,000', '$150,000', '1', '2', '2', '1'],
      ['Profesional', '$50,000', '$500,000', '5', '10', '5', '2'],
      ['Enterprise', '$120,000', '$1,200,000', '15', '30', '10', '5'],
    ],
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 10, halign: 'center' },
    columnStyles: { 0: { halign: 'left' } },
  });
  
  y = 110;
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.accent);
  doc.text('✓ Plan anual = 17% descuento (2 meses gratis)', 20, y);
  doc.text('✓ 14 días de prueba gratis en todos los planes', 20, y + 8);
  doc.text('✓ Packs adicionales disponibles para expandir límites', 20, y + 16);
  addPageNumber(doc, 6, totalPages);
  
  // ========== SECTION 3: BUSINESS FLOWS (Slides 7-9) ==========
  
  // Slide 7: Granada Billing Flow
  doc.addPage();
  addHeader(doc, 'Flujo de Facturación Granada');
  
  autoTable(doc, {
    startY: 55,
    margin: { left: 20 },
    head: [['Ciclo', 'Acción', 'Responsable']],
    body: [
      ['Día 1', 'Suscripción activa', 'Sistema automático'],
      ['Mensual', 'Generación de factura', 'Sistema automático'],
      ['Día 1-5', 'Pago del suscriptor', 'Suscriptor'],
      ['Día 5+', 'Verificación de pago', 'Admin Granada'],
      ['Mes 12', 'Notificación de renovación', 'Sistema automático'],
      ['Renovación', 'Nueva suscripción o upgrade', 'Suscriptor'],
    ],
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 11 },
  });
  
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Nota: El sistema genera alertas automáticas de vencimiento y mora de suscripción', 20, 130);
  addPageNumber(doc, 7, totalPages);
  
  // Slide 8: Money Flow
  doc.addPage();
  addHeader(doc, 'Flujo del Dinero', 'Desde el inquilino hasta Granada');
  
  autoTable(doc, {
    startY: 55,
    margin: { left: 20 },
    head: [['Origen', 'Destino', 'Concepto', 'Monto ejemplo']],
    body: [
      ['Inquilino', 'Inmobiliaria', 'Alquiler + Expensas', '$520,000'],
      ['Inmobiliaria', 'Propietario', 'Neto (menos comisiones)', '$425,000'],
      ['Inmobiliaria', 'Proveedores', 'Gastos de la propiedad', '$25,000'],
      ['Inmobiliaria', 'Granada', 'Suscripción mensual', '$50,000'],
    ],
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 11 },
  });
  
  y = 115;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.textDark);
  doc.text('Resumen para la inmobiliaria:', 20, y);
  y += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('• Ingreso por comisiones: $40,000 + $10,000 = $50,000', 25, y);
  y += 7;
  doc.text('• Gasto en suscripción Granada: $50,000 (plan Profesional)', 25, y);
  y += 7;
  doc.text('• Con 5+ propiedades, el ROI es positivo desde el primer mes', 25, y);
  addPageNumber(doc, 8, totalPages);
  
  // Slide 9: Benefits by Actor
  doc.addPage();
  addHeader(doc, 'Beneficios por Actor');
  
  autoTable(doc, {
    startY: 55,
    margin: { left: 10 },
    head: [['Granada', 'Inmobiliaria/Admin', 'Propietario', 'Inquilino']],
    body: [
      ['Ingresos recurrentes', 'Automatización total', 'Transparencia', 'Autogestión'],
      ['Modelo escalable', 'Reducción de errores', 'Reportes 24/7', 'Portal de pagos'],
      ['Data para mejoras', 'Más tiempo para ventas', 'Menos llamadas', 'Historial completo'],
      ['Expansión regional', 'Profesionalización', 'Confianza', 'Comprobantes'],
      ['Upgrades y addons', 'Diferenciación', 'Control real', 'Mantenimiento fácil'],
    ],
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 10, halign: 'center' },
  });
  addPageNumber(doc, 9, totalPages);
  
  // ========== SECTION 4: FEATURES (Slides 10-19) ==========
  
  // Slide 10: Automatic Adjustments
  doc.addPage();
  addHeader(doc, 'Ajustes Automáticos por Índices');
  
  autoTable(doc, {
    startY: 55,
    margin: { left: 20 },
    head: [['Índice', 'Descripción', 'Frecuencia típica']],
    body: [
      ['ICL', 'Índice de Contratos de Locación (BCRA)', 'Mensual'],
      ['IPC', 'Índice de Precios al Consumidor (INDEC)', 'Mensual'],
      ['Casa Propia', 'Índice Casa Propia', 'Mensual'],
      ['Personalizado', 'Porcentaje fijo definido por usuario', 'Configurable'],
    ],
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 11 },
  });
  
  y = 110;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.textDark);
  doc.text('Ejemplo de ajuste:', 20, y);
  
  autoTable(doc, {
    startY: y + 5,
    margin: { left: 20 },
    body: [
      ['Alquiler base', '$500,000'],
      ['Índice ICL mayo', '+5.2%'],
      ['Nuevo alquiler', '$526,000'],
      ['Aplicación', 'Automática el 1ro del mes'],
    ],
    styles: { fontSize: 11 },
    tableWidth: 120,
    theme: 'grid',
  });
  addPageNumber(doc, 10, totalPages);
  
  // Slide 11: Alert System
  doc.addPage();
  addHeader(doc, 'Sistema de Alertas Automáticas');
  
  autoTable(doc, {
    startY: 55,
    margin: { left: 20 },
    head: [['Tipo', 'Destinatario', 'Momento', 'Canal']],
    body: [
      ['Pre-vencimiento', 'Inquilino', 'X días antes', 'Email'],
      ['Vencimiento', 'Inquilino', 'Día del pago', 'Email'],
      ['Mora nivel 1', 'Inquilino + Admin', '5 días después', 'Email'],
      ['Mora nivel 2', 'Inquilino + Admin + Propietario', '15 días después', 'Email'],
      ['Resumen diario', 'Staff inmobiliaria', 'Cada mañana', 'Email'],
      ['Renovación próxima', 'Admin', '60 días antes fin contrato', 'Email'],
    ],
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 10 },
  });
  
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.accent);
  doc.text('✓ Todas las alertas son configurables por el administrador', 20, 130);
  addPageNumber(doc, 11, totalPages);
  
  // Slide 12: Multi-Currency
  doc.addPage();
  addHeader(doc, 'Gestión Multi-Moneda');
  
  y = 55;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.textDark);
  doc.text('Monedas soportadas:', 20, y);
  
  autoTable(doc, {
    startY: y + 5,
    margin: { left: 20 },
    head: [['Moneda', 'Símbolo', 'Uso típico']],
    body: [
      ['Peso Argentino', 'ARS $', 'Operaciones locales'],
      ['Dólar Estadounidense', 'USD $', 'Contratos dolarizados'],
      ['Euro', 'EUR €', 'Propiedades premium'],
    ],
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 11 },
    tableWidth: 150,
  });
  
  y = 105;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Funcionalidades:', 20, y);
  y += 10;
  
  const currencyFeatures = [
    '• Tipos de cambio actualizados diariamente (automático)',
    '• Contratos en USD con liquidación en ARS',
    '• Reportes con conversión automática',
    '• Historial de tipos de cambio para auditoría',
  ];
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  currencyFeatures.forEach(feature => {
    doc.setTextColor(...COLORS.textDark);
    doc.text(feature, 25, y);
    y += 8;
  });
  addPageNumber(doc, 12, totalPages);
  
  // Slide 13: Owner Portal
  doc.addPage();
  addHeader(doc, 'Portal del Propietario');
  
  autoTable(doc, {
    startY: 55,
    margin: { left: 20 },
    head: [['Módulo', 'Funcionalidad']],
    body: [
      ['Dashboard', 'Vista general de todas las propiedades'],
      ['Propiedades', 'Detalle de cada inmueble, fotos, datos'],
      ['Contratos', 'Estado actual, fechas, inquilino'],
      ['Pagos', 'Historial de cobros y pendientes'],
      ['Gastos', 'Deducciones y comprobantes'],
      ['Reportes', 'Descarga de reportes mensuales en PDF'],
      ['Notificaciones', 'Centro de alertas y novedades'],
    ],
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 11 },
  });
  
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.accent);
  doc.text('✓ Acceso con email y contraseña propia', 20, 135);
  doc.text('✓ Responsive: funciona en celular y computadora', 20, 143);
  addPageNumber(doc, 13, totalPages);
  
  // Slide 14: Tenant Portal
  doc.addPage();
  addHeader(doc, 'Portal del Inquilino');
  
  autoTable(doc, {
    startY: 55,
    margin: { left: 20 },
    head: [['Módulo', 'Funcionalidad']],
    body: [
      ['Mi Contrato', 'Vista del contrato activo y condiciones'],
      ['Calendario', 'Fechas de pago y vencimientos'],
      ['Pagos', 'Historial y estado de cada período'],
      ['Comprobantes', 'Carga de comprobantes de pago'],
      ['Mantenimiento', 'Solicitud de reparaciones'],
      ['Documentos', 'Acceso a contrato y recibos'],
    ],
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 11 },
  });
  
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.accent);
  doc.text('✓ El inquilino puede cargar comprobantes que el admin verifica', 20, 125);
  doc.text('✓ Reduce llamadas y consultas a la inmobiliaria', 20, 133);
  addPageNumber(doc, 14, totalPages);
  
  // Slide 15: Automatic Reimbursements
  doc.addPage();
  addHeader(doc, 'Reembolsos Automáticos de Gastos');
  
  y = 55;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.textDark);
  doc.text('¿Cómo funciona?', 20, y);
  y += 10;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const reimbursementSteps = [
    '1. Se registra un gasto asociado a una propiedad',
    '2. Se marca como "a cargo del inquilino" o "deducible"',
    '3. El sistema distribuye el monto en las cuotas siguientes',
    '4. Se descuenta automáticamente del próximo pago',
    '5. El propietario ve el gasto y el reembolso en su reporte',
  ];
  
  reimbursementSteps.forEach(step => {
    doc.text(step, 25, y);
    y += 8;
  });
  
  y += 5;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Ejemplo:', 20, y);
  
  autoTable(doc, {
    startY: y + 5,
    margin: { left: 20 },
    body: [
      ['Gasto de plomería', '$30,000'],
      ['Distribuido en', '3 cuotas'],
      ['Deducción mensual', '$10,000 por 3 meses'],
    ],
    styles: { fontSize: 11 },
    tableWidth: 120,
    theme: 'grid',
  });
  addPageNumber(doc, 15, totalPages);
  
  // Slide 16: Reports & Analytics
  doc.addPage();
  addHeader(doc, 'Reportes y Analytics');
  
  autoTable(doc, {
    startY: 55,
    margin: { left: 20 },
    head: [['Reporte', 'Contenido', 'Frecuencia']],
    body: [
      ['Dashboard KPIs', 'Ocupación, morosidad, ingresos', 'Tiempo real'],
      ['Reporte propietario', 'Ingresos netos, gastos, comisiones', 'Mensual automático'],
      ['Calendario de pagos', 'Estado de todos los pagos del mes', 'Diario'],
      ['Proyección contratos', 'Flujo de caja estimado 12 meses', 'A demanda'],
      ['Distribución gastos', 'Análisis de gastos por categoría', 'Mensual'],
      ['Comisiones', 'Total cobrado por comisiones', 'Mensual'],
    ],
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 10 },
  });
  
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.accent);
  doc.text('✓ Exportación a PDF y Excel', 20, 130);
  doc.text('✓ Envío automático de reportes por email', 20, 138);
  addPageNumber(doc, 16, totalPages);
  
  // Slide 17: Multi-Owner
  doc.addPage();
  addHeader(doc, 'Gestión Multi-Propietario');
  
  y = 55;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.textDark);
  doc.text('Una propiedad, varios dueños', 20, y);
  y += 15;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('El sistema permite asignar múltiples propietarios a una propiedad,', 20, y);
  y += 7;
  doc.text('cada uno con su porcentaje de participación.', 20, y);
  
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('Ejemplo: Propiedad con 2 propietarios', 20, y);
  
  autoTable(doc, {
    startY: y + 5,
    margin: { left: 20 },
    head: [['Propietario', 'Porcentaje', 'Ingreso neto']],
    body: [
      ['Juan Pérez', '60%', '$255,000'],
      ['María García', '40%', '$170,000'],
      ['Total', '100%', '$425,000'],
    ],
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 11 },
    tableWidth: 150,
  });
  
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.accent);
  doc.text('✓ Cada propietario recibe su reporte individualizado', 20, 135);
  doc.text('✓ Portal de acceso separado para cada dueño', 20, 143);
  addPageNumber(doc, 17, totalPages);
  
  // Slide 18: Contract Projections
  doc.addPage();
  addHeader(doc, 'Proyecciones de Contratos');
  
  autoTable(doc, {
    startY: 55,
    margin: { left: 20 },
    head: [['Mes', 'Alquiler base', 'Ajuste', 'Alquiler ajustado']],
    body: [
      ['Enero 2025', '$500,000', '-', '$500,000'],
      ['Febrero 2025', '$500,000', '+5.2% ICL', '$526,000'],
      ['Marzo 2025', '$526,000', '-', '$526,000'],
      ['Abril 2025', '$526,000', '+4.8% ICL', '$551,248'],
      ['...', '...', '...', '...'],
      ['Diciembre 2025', '$650,000', '+3.5% ICL', '$672,750'],
    ],
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 10 },
  });
  
  y = 120;
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.textDark);
  doc.text('El sistema genera proyecciones a 12 meses considerando:', 20, y);
  y += 10;
  doc.text('• Índices de ajuste configurados', 25, y);
  y += 7;
  doc.text('• Frecuencia de ajuste del contrato', 25, y);
  y += 7;
  doc.text('• Alertas de vencimiento de contrato', 25, y);
  addPageNumber(doc, 18, totalPages);
  
  // Slide 19: Comparison Table
  doc.addPage();
  addHeader(doc, 'Granada vs Competencia', 'Cuadro comparativo detallado');
  
  autoTable(doc, {
    startY: 55,
    margin: { left: 15 },
    head: [['Característica', 'Granada', 'Software A', 'Software B', 'Excel']],
    body: [
      ['Multi-índice (ICL/IPC/Casa Propia)', '✅', '❌', 'Solo IPC', '❌'],
      ['Ajustes automáticos', '✅', 'Manual', 'Manual', '❌'],
      ['Multi-moneda con TC diario', '✅', 'Limitado', '❌', '❌'],
      ['Portal propietario', '✅', '❌', '❌', '❌'],
      ['Portal inquilino', '✅', '❌', '❌', '❌'],
      ['Reembolsos automáticos', '✅', '❌', '❌', '❌'],
      ['Multi-propietario', '✅', '❌', 'Limitado', '❌'],
      ['Alertas configurables', '✅', 'Básico', 'Básico', '❌'],
      ['Reportes automáticos', '✅', 'Manual', 'Manual', '❌'],
      ['Proyecciones 12 meses', '✅', '❌', '❌', '❌'],
      ['Soporte incluido', '✅', 'Extra', 'Extra', '❌'],
    ],
    headStyles: { fillColor: COLORS.primary },
    styles: { fontSize: 9, halign: 'center' },
    columnStyles: { 0: { halign: 'left' } },
  });
  addPageNumber(doc, 19, totalPages);
  
  // ========== SECTION 5: CLOSING (Slide 20) ==========
  
  // Slide 20: Next Steps
  doc.addPage();
  
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('Próximos Pasos', pageWidth / 2, 50, { align: 'center' });
  
  const finalSteps = [
    '1. Solicitar suscripción online',
    '2. Aprobación y activación (24-48hs)',
    '3. Configuración inicial guiada',
    '4. Carga de propiedades y propietarios',
    '5. Creación de contratos',
    '6. ¡Gestión automatizada!',
  ];
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  y = 80;
  finalSteps.forEach(step => {
    doc.text(step, pageWidth / 2, y, { align: 'center' });
    y += 15;
  });
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('¡14 días de prueba gratis!', pageWidth / 2, 175, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('📧 info@granada-platform.com', pageWidth / 2, 195, { align: 'center' });
  
  addPageNumber(doc, 20, totalPages);
  
  return doc;
};

// Download helpers
export const downloadUltraExecutivePDF = () => {
  const doc = generateUltraExecutivePDF();
  doc.save('Granada-PMS-Pitch-5-slides.pdf');
};

export const downloadExecutivePDF = () => {
  const doc = generateExecutivePDF();
  doc.save('Granada-PMS-Ejecutiva-10-slides.pdf');
};

export const downloadFullPDF = () => {
  const doc = generateFullPDF();
  doc.save('Granada-PMS-Completa-20-slides.pdf');
};
