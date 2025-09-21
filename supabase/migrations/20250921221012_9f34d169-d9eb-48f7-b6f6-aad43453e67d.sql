-- Delete existing knowledge base and repopulate with complete information
DELETE FROM knowledge_base;

-- Insert complete knowledge base for WM Management
INSERT INTO knowledge_base (page_url, page_title, section, content, summary, language, indexed_at, updated_at) VALUES
-- About Us
('/about', 'WM Management - About Us', 'about', 
'WM Management fue fundado con la misión de proporcionar servicios excepcionales de inversión inmobiliaria y gestión de propiedades. Nuestro equipo experimentado de profesionales aporta décadas de experiencia combinada en bienes raíces, finanzas y gestión empresarial. Estamos comprometidos a ayudar a nuestros clientes a alcanzar sus objetivos de inversión a través de soluciones innovadoras y servicio personalizado.',
'Equipo experimentado que proporciona servicios excepcionales de inversión inmobiliaria y gestión de propiedades con soluciones personalizadas.',
'es', NOW(), NOW()),

-- Contact Information
('/contact', 'WM Management - Contact', 'contact', 
'Contacte a WM Management para todas sus necesidades de inversión inmobiliaria y gestión de propiedades. Ofrecemos consultas gratuitas para discutir sus objetivos de inversión y cómo podemos ayudarle a alcanzarlos. Nuestro equipo está disponible para responder preguntas sobre financiamiento, gestión de propiedades y oportunidades de inversión.

INFORMACIÓN DE CONTACTO:
Teléfono: +1 (555) 123-4567 (Disponible Lunes-Viernes 9:00 AM - 6:00 PM)
Email: info@wmmanagement.com (Respuesta dentro de 24 horas)
Dirección: 123 Business District, Suite 456, City, State 12345

HORARIOS DE ATENCIÓN:
Lunes - Viernes: 9:00 AM - 6:00 PM
Sábado: 10:00 AM - 2:00 PM
Domingo: Cerrado

Tenemos chat en vivo disponible en nuestro sitio web para asistencia inmediata. Nuestro equipo se especializa en consultoría de inversión inmobiliaria, servicios de gestión de propiedades, soluciones de financiamiento y planificación empresarial. Contáctenos para consultas gratuitas y servicio personalizado para ayudarle a alcanzar sus objetivos de inversión.',
'Contáctenos al +1 (555) 123-4567 o info@wmmanagement.com. Horarios Lunes-Viernes 9AM-6PM, Sábado 10AM-2PM. Consultas gratuitas disponibles.',
'es', NOW(), NOW()),

-- Property Management Services
('/services/property-management', 'WM Management - Property Management Services', 'property-management', 
'Nuestros servicios de gestión de propiedades incluyen: Evaluación y colocación completa de inquilinos, Cobro mensual de alquileres e informes financieros, Coordinación proactiva de mantenimiento y reparaciones, Inspecciones regulares de propiedades, Gestión de cumplimiento legal, Respuesta de emergencia 24/7. Ofrecemos tres modalidades de servicio: Gestión Básica (servicios esenciales), Gestión Intermedia (cuidado integral), y Gestión Completa (soluciones completas). Nuestro objetivo es maximizar los retornos de su inversión mientras minimizamos su participación.',
'Gestión completa de propiedades incluyendo servicios de inquilinos, coordinación de mantenimiento, informes financieros y respuesta de emergencia.',
'es', NOW(), NOW()),

-- Real Estate Brokerage
('/services/brokerage', 'WM Management - Real Estate Brokerage Services', 'brokerage', 
'Nuestros servicios de brokerage inmobiliario incluyen: Compra y Venta de Propiedades (acompañamiento integral desde la valuación hasta la firma de escritura, asegurando operaciones claras y eficientes), Análisis de Mercado y Valuación (estudios detallados para determinar precios óptimos y oportunidades de inversión), Negociaciones Expertas (representamos sus intereses para alcanzar las mejores condiciones comerciales en cada acuerdo), Gestión de Transacciones (coordinamos todos los aspectos legales, financieros y operativos con profesionales especializados). Proporcionamos orientación profesional durante todo el proceso de transacción inmobiliaria, asegurando resultados exitosos para compradores y vendedores.',
'Servicios de brokerage inmobiliario incluyendo transacciones de propiedades, análisis de mercado, negociaciones y gestión de transacciones.',
'es', NOW(), NOW()),

-- Investment Services
('/services/investments', 'WM Management - Trust & Investment Services', 'investments', 
'Ofrecemos marcos de inversión confiables y transparentes a través de fideicomisos inmobiliarios, diseñados para proporcionar retornos consistentes mientras se minimiza el riesgo. Nuestros servicios incluyen: Gestión de Portafolio (administración integral de inversiones en proyectos inmobiliarios diversificados), Estrategia de Inversión (definición de planes personalizados según horizonte de inversión, perfil de riesgo y objetivos de rentabilidad), Evaluación de Riesgo (análisis de cada oportunidad de inversión, asegurando transparencia y mitigación de riesgos), Monitoreo de Rendimiento (reportes periódicos con métricas de desempeño, proyecciones y ajustes estratégicos). Ofrecemos tres tipos de fideicomisos: Fideicomisos de Desarrollo (participación en proyectos desde la etapa inicial para obtener mayores retornos), Fideicomisos de Renta (inversiones en propiedades destinadas a generar ingresos constantes por alquiler), Fideicomisos Mixtos (combina desarrollo y renta, equilibrando riesgo y liquidez). Los beneficios incluyen seguridad jurídica, diversificación, accesibilidad, transparencia y rentabilidad sostenida.',
'Servicios de fideicomiso e inversión inmobiliaria incluyendo gestión de portafolio, estrategia de inversión, evaluación de riesgo y monitoreo de rendimiento.',
'es', NOW(), NOW()),

-- Financing Services
('/financing', 'WM Management - Financing Services', 'financing', 
'Nuestros servicios de financiamiento incluyen: Préstamos tradicionales, Financiamiento de propiedades de inversión, Préstamos comerciales. Ofrecemos soluciones de financiamiento personalizadas para ayudar a nuestros clientes a alcanzar sus objetivos de inversión inmobiliaria. Nuestro equipo trabaja con múltiples prestamistas para encontrar las mejores tasas y términos para cada situación específica.',
'Servicios de financiamiento incluyendo préstamos tradicionales, financiamiento de propiedades de inversión y préstamos comerciales.',
'es', NOW(), NOW()),

-- Real Estate Development
('/services/development', 'WM Management - Real Estate Development Services', 'development', 
'Nuestros servicios de desarrollo inmobiliario incluyen gestión de proyectos, coordinación de diseño, supervisión de construcción y aseguramiento de calidad. Proporcionamos supervisión integral de proyectos de desarrollo desde la concepción hasta la finalización.',
'Servicios de desarrollo inmobiliario incluyendo gestión de proyectos, coordinación de diseño, supervisión de construcción y aseguramiento de calidad.',
'es', NOW(), NOW()),

-- Business Simulator
('/business-simulator', 'WM Management - Business Simulator', 'business-simulator', 
'Nuestra herramienta de simulación empresarial ayuda a los inversionistas a analizar inversiones inmobiliarias potenciales. El simulador le permite ingresar varios parámetros como valor de la propiedad, términos de financiamiento, ingresos de alquiler, gastos y condiciones del mercado para calcular retornos potenciales, flujo de efectivo y ROI. Esta herramienta ayuda a tomar decisiones de inversión informadas modelando diferentes escenarios y resultados.',
'Herramienta de análisis de inversión para calcular retornos, flujo de efectivo y ROI en inversiones inmobiliarias.',
'es', NOW(), NOW()),

-- FAQ
('/faq', 'WM Management - FAQ', 'faq', 
'Preguntas frecuentes sobre nuestros servicios: ¿Qué tipos de financiamiento ofrecemos? Proporcionamos préstamos tradicionales, financiamiento de propiedades de inversión y préstamos comerciales. ¿Cómo manejamos la gestión de propiedades? Ofrecemos gestión de servicio completo incluyendo evaluación de inquilinos, cobro de alquileres, mantenimiento y cumplimiento legal. ¿Cuáles son nuestras tarifas? Nuestras tarifas son competitivas y transparentes, variando según los servicios específicos requeridos.',
'Preguntas comunes sobre opciones de financiamiento, servicios de gestión de propiedades y estructura de tarifas.',
'es', NOW(), NOW());