import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting website content scraping and indexing...');

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Define website content to index
    const contentToIndex = [
      {
        pageUrl: '/',
        pageTitle: 'WM Management - Home',
        section: 'home',
        contentEn: `WM Management is a leading real estate investment and property management company. We specialize in financing solutions, property management services, and investment opportunities. Our comprehensive services include business simulation tools, financing applications, and professional consultation for real estate investments.`,
        contentEs: `WM Management es una empresa líder en inversión inmobiliaria y gestión de propiedades. Nos especializamos en soluciones de financiamiento, servicios de gestión de propiedades y oportunidades de inversión. Nuestros servicios integrales incluyen herramientas de simulación empresarial, aplicaciones de financiamiento y consultoría profesional para inversiones inmobiliarias.`,
        summaryEn: 'Leading real estate investment and property management company offering financing solutions and investment opportunities.',
        summaryEs: 'Empresa líder en inversión inmobiliaria y gestión de propiedades que ofrece soluciones de financiamiento y oportunidades de inversión.'
      },
      {
        pageUrl: '/services',
        pageTitle: 'WM Management - Services',
        section: 'services',
        contentEn: `Our comprehensive services include: Property Management (tenant screening, rent collection, maintenance coordination, legal compliance, 24/7 emergency response), Real Estate Brokerage (buying and selling properties, market analysis, transaction management, expert negotiations), Consulting Services (feasibility studies, legal advisory, strategic planning, market research), Real Estate Development (project management, design coordination, construction oversight, quality assurance), and Trust & Investment Services (secure investment frameworks, portfolio management, risk assessment, performance monitoring).`,
        contentEs: `Nuestros servicios integrales incluyen: Gestión de Propiedades (evaluación de inquilinos, cobro de alquileres, coordinación de mantenimiento, cumplimiento legal, respuesta de emergencia 24/7), Brokerage Inmobiliario (compra y venta de propiedades, análisis de mercado, gestión de transacciones, negociaciones expertas), Servicios de Consultoría (estudios de factibilidad, asesoría legal, planificación estratégica, investigación de mercado), Desarrollo Inmobiliario (gestión de proyectos, coordinación de diseño, supervisión de construcción, aseguramiento de calidad), y Servicios de Fideicomiso e Inversión (marcos de inversión seguros, gestión de portafolio, evaluación de riesgo, monitoreo de rendimiento).`,
        summaryEn: 'Property management, real estate brokerage, consulting, development, and trust & investment services.',
        summaryEs: 'Gestión de propiedades, brokerage inmobiliario, consultoría, desarrollo y servicios de fideicomiso e inversión.'
      },
      {
        pageUrl: '/financing',
        pageTitle: 'WM Management - Financing',
        section: 'financing',
        contentEn: `We offer various financing options including traditional loans, investment property financing, business loans, refinancing options, and specialized real estate financing. Our financing solutions are tailored to meet the unique needs of real estate investors and business owners. We provide competitive rates and flexible terms.`,
        contentEs: `Ofrecemos varias opciones de financiamiento incluyendo préstamos tradicionales, financiamiento de propiedades de inversión, préstamos comerciales, opciones de refinanciamiento y financiamiento inmobiliario especializado. Nuestras soluciones de financiamiento están diseñadas para satisfacer las necesidades únicas de inversionistas inmobiliarios y propietarios de negocios. Proporcionamos tasas competitivas y términos flexibles.`,
        summaryEn: 'Various financing options including traditional loans, investment property financing, and business loans with competitive rates.',
        summaryEs: 'Varias opciones de financiamiento incluyendo préstamos tradicionales, financiamiento de propiedades de inversión y préstamos comerciales con tasas competitivas.'
      },
      {
        pageUrl: '/services/property-management',
        pageTitle: 'WM Management - Property Management Services',
        section: 'property-management',
        contentEn: `Our property management services include: Complete tenant screening and placement, Monthly rent collection and financial reporting, Proactive maintenance and repairs coordination, Regular property inspections, Legal compliance management, 24/7 emergency response. We offer three service modalities: Basic Management (essential services), Intermediate Management (comprehensive care), and Full Management (complete solutions). Our goal is to maximize your investment returns while minimizing your involvement.`,
        contentEs: `Nuestros servicios de gestión de propiedades incluyen: Evaluación y colocación completa de inquilinos, Cobro mensual de alquileres e informes financieros, Coordinación proactiva de mantenimiento y reparaciones, Inspecciones regulares de propiedades, Gestión de cumplimiento legal, Respuesta de emergencia 24/7. Ofrecemos tres modalidades de servicio: Gestión Básica (servicios esenciales), Gestión Intermedia (cuidado integral), y Gestión Completa (soluciones completas). Nuestro objetivo es maximizar los retornos de su inversión mientras minimizamos su participación.`,
        summaryEn: 'Complete property management including tenant services, maintenance coordination, financial reporting, and emergency response.',
        summaryEs: 'Gestión completa de propiedades incluyendo servicios de inquilinos, coordinación de mantenimiento, informes financieros y respuesta de emergencia.'
      },
      {
        pageUrl: '/about',
        pageTitle: 'WM Management - About Us',
        section: 'about',
        contentEn: `WM Management was founded with the mission to provide exceptional real estate investment and property management services. Our experienced team of professionals brings decades of combined experience in real estate, finance, and business management. We are committed to helping our clients achieve their investment goals through innovative solutions and personalized service.`,
        contentEs: `WM Management fue fundada con la misión de proporcionar servicios excepcionales de inversión inmobiliaria y gestión de propiedades. Nuestro equipo experimentado de profesionales aporta décadas de experiencia combinada en bienes raíces, finanzas y gestión empresarial. Estamos comprometidos a ayudar a nuestros clientes a alcanzar sus objetivos de inversión a través de soluciones innovadoras y servicio personalizado.`,
        summaryEn: 'Experienced team providing exceptional real estate investment and property management services with personalized solutions.',
        summaryEs: 'Equipo experimentado que proporciona servicios excepcionales de inversión inmobiliaria y gestión de propiedades con soluciones personalizadas.'
      },
      {
        pageUrl: '/contact',
        pageTitle: 'WM Management - Contact',
        section: 'contact',
        contentEn: `Contact WM Management for all your real estate investment and property management needs. We offer free consultations to discuss your investment goals and how we can help you achieve them. Our team is available to answer questions about financing, property management, and investment opportunities.

CONTACT INFORMATION:
Phone: +1 (555) 123-4567 (Available Monday-Friday 9:00 AM - 6:00 PM)
Email: info@wmmanagement.com (Response within 24 hours)
Address: 123 Business District, Suite 456, City, State 12345

BUSINESS HOURS:
Monday - Friday: 9:00 AM - 6:00 PM
Saturday: 10:00 AM - 2:00 PM  
Sunday: Closed

We have live chat available on our website for immediate assistance. Our team specializes in real estate investment consulting, property management services, financing solutions, and business planning. Contact us for free consultations and personalized service to help you achieve your investment goals.`,
        contentEs: `Contacte a WM Management para todas sus necesidades de inversión inmobiliaria y gestión de propiedades. Ofrecemos consultas gratuitas para discutir sus objetivos de inversión y cómo podemos ayudarle a alcanzarlos. Nuestro equipo está disponible para responder preguntas sobre financiamiento, gestión de propiedades y oportunidades de inversión.

INFORMACIÓN DE CONTACTO:
Teléfono: +1 (555) 123-4567 (Disponible Lunes-Viernes 9:00 AM - 6:00 PM)
Email: info@wmmanagement.com (Respuesta dentro de 24 horas)
Dirección: 123 Business District, Suite 456, City, State 12345

HORARIOS DE ATENCIÓN:
Lunes - Viernes: 9:00 AM - 6:00 PM
Sábado: 10:00 AM - 2:00 PM
Domingo: Cerrado

Tenemos chat en vivo disponible en nuestro sitio web para asistencia inmediata. Nuestro equipo se especializa en consultoría de inversión inmobiliaria, servicios de gestión de propiedades, soluciones de financiamiento y planificación empresarial. Contáctenos para consultas gratuitas y servicio personalizado para ayudarle a alcanzar sus objetivos de inversión.`,
        summaryEn: 'Contact us at +1 (555) 123-4567 or info@wmmanagement.com. Office hours Monday-Friday 9AM-6PM, Saturday 10AM-2PM. Free consultations available.',
        summaryEs: 'Contáctenos al +1 (555) 123-4567 o info@wmmanagement.com. Horarios Lunes-Viernes 9AM-6PM, Sábado 10AM-2PM. Consultas gratuitas disponibles.'
      },
      {
        pageUrl: '/industries',
        pageTitle: 'WM Management - Industries',
        section: 'industries',
        contentEn: `WM Management serves various industries including residential real estate, commercial properties, retail spaces, office buildings, industrial facilities, and mixed-use developments. We have expertise in different property types and can provide specialized services for each industry sector. Our team understands the unique challenges and opportunities in each market segment.`,
        contentEs: `WM Management atiende varias industrias incluyendo bienes raíces residenciales, propiedades comerciales, espacios de retail, edificios de oficinas, instalaciones industriales y desarrollos de uso mixto. Tenemos experiencia en diferentes tipos de propiedades y podemos proporcionar servicios especializados para cada sector industrial. Nuestro equipo entiende los desafíos y oportunidades únicos en cada segmento de mercado.`,
        summaryEn: 'Serving various industries including residential, commercial, retail, office, and industrial properties.',
        summaryEs: 'Atendiendo varias industrias incluyendo propiedades residenciales, comerciales, retail, oficinas e industriales.'
      },
      {
        pageUrl: '/faq',
        pageTitle: 'WM Management - FAQ',
        section: 'faq',
        contentEn: `Frequently asked questions about our services: What types of financing do we offer? We provide traditional loans, investment property financing, and business loans. How do we handle property management? We offer full-service management including tenant screening, rent collection, maintenance, and legal compliance. What are our fees? Our fees are competitive and transparent, varying based on the specific services required.`,
        contentEs: `Preguntas frecuentes sobre nuestros servicios: ¿Qué tipos de financiamiento ofrecemos? Proporcionamos préstamos tradicionales, financiamiento de propiedades de inversión y préstamos comerciales. ¿Cómo manejamos la gestión de propiedades? Ofrecemos gestión de servicio completo incluyendo evaluación de inquilinos, cobro de alquileres, mantenimiento y cumplimiento legal. ¿Cuáles son nuestras tarifas? Nuestras tarifas son competitivas y transparentes, variando según los servicios específicos requeridos.`,
        summaryEn: 'Common questions about financing options, property management services, and fee structure.',
        summaryEs: 'Preguntas comunes sobre opciones de financiamiento, servicios de gestión de propiedades y estructura de tarifas.'
      },
      {
        pageUrl: '/business-simulator',
        pageTitle: 'WM Management - Business Simulator',
        section: 'business-simulator',
        contentEn: `Our business simulation tool helps investors analyze potential real estate investments. The simulator allows you to input various parameters such as property value, financing terms, rental income, expenses, and market conditions to calculate potential returns, cash flow, and ROI. This tool helps make informed investment decisions by modeling different scenarios and outcomes.`,
        contentEs: `Nuestra herramienta de simulación empresarial ayuda a los inversionistas a analizar inversiones inmobiliarias potenciales. El simulador le permite ingresar varios parámetros como valor de la propiedad, términos de financiamiento, ingresos de alquiler, gastos y condiciones del mercado para calcular retornos potenciales, flujo de efectivo y ROI. Esta herramienta ayuda a tomar decisiones de inversión informadas modelando diferentes escenarios y resultados.`,
        summaryEn: 'Investment analysis tool for calculating returns, cash flow, and ROI on real estate investments.',
        summaryEs: 'Herramienta de análisis de inversión para calcular retornos, flujo de efectivo y ROI en inversiones inmobiliarias.'
      },
      {
        pageUrl: '/services/investments',
        pageTitle: 'WM Management - Trust & Investment Services',
        section: 'investments',
        contentEn: `We offer secure and transparent investment frameworks through real estate trusts, designed to provide consistent returns while minimizing risk. Our services include: Portfolio Management (comprehensive administration of diversified real estate investments), Investment Strategy (personalized plans based on investment horizon, risk profile and profitability objectives), Risk Assessment (analysis of each investment opportunity ensuring transparency and risk mitigation), Performance Monitoring (periodic reports with performance metrics, projections and strategic adjustments). We offer three types of trusts: Development Trusts (participation in projects from initial stage for higher returns), Income Trusts (investments in properties for constant rental income), Mixed Trusts (combines development and income, balancing risk and liquidity). Benefits include legal security, diversification, accessibility, transparency, and sustained profitability.`,
        contentEs: `Ofrecemos marcos de inversión confiables y transparentes a través de fideicomisos inmobiliarios, diseñados para proporcionar retornos consistentes mientras se minimiza el riesgo. Nuestros servicios incluyen: Gestión de Portafolio (administración integral de inversiones en proyectos inmobiliarios diversificados), Estrategia de Inversión (definición de planes personalizados según horizonte de inversión, perfil de riesgo y objetivos de rentabilidad), Evaluación de Riesgo (análisis de cada oportunidad de inversión, asegurando transparencia y mitigación de riesgos), Monitoreo de Rendimiento (reportes periódicos con métricas de desempeño, proyecciones y ajustes estratégicos). Ofrecemos tres tipos de fideicomisos: Fideicomisos de Desarrollo (participación en proyectos desde la etapa inicial para obtener mayores retornos), Fideicomisos de Renta (inversiones en propiedades destinadas a generar ingresos constantes por alquiler), Fideicomisos Mixtos (combina desarrollo y renta, equilibrando riesgo y liquidez). Los beneficios incluyen seguridad jurídica, diversificación, accesibilidad, transparencia y rentabilidad sostenida.`,
        summaryEn: 'Real estate trust and investment services including portfolio management, investment strategy, risk assessment, and performance monitoring.',
        summaryEs: 'Servicios de fideicomiso e inversión inmobiliaria incluyendo gestión de portafolio, estrategia de inversión, evaluación de riesgo y monitoreo de rendimiento.'
      },
      {
        pageUrl: '/services/brokerage',
        pageTitle: 'WM Management - Real Estate Brokerage Services',
        section: 'brokerage',
        contentEn: `Our real estate brokerage services include: Property Buying and Selling (comprehensive support from valuation to deed signing, ensuring clear and efficient operations), Market Analysis and Valuation (detailed studies to determine optimal prices and investment opportunities), Expert Negotiations (representing your interests to achieve the best commercial conditions in each deal), Transaction Management (coordinating all legal, financial and operational aspects with specialized professionals). We provide professional guidance throughout the entire real estate transaction process, ensuring successful outcomes for buyers and sellers.`,
        contentEs: `Nuestros servicios de brokerage inmobiliario incluyen: Compra y Venta de Propiedades (acompañamiento integral desde la valuación hasta la firma de escritura, asegurando operaciones claras y eficientes), Análisis de Mercado y Valuación (estudios detallados para determinar precios óptimos y oportunidades de inversión), Negociaciones Expertas (representamos sus intereses para alcanzar las mejores condiciones comerciales en cada acuerdo), Gestión de Transacciones (coordinamos todos los aspectos legales, financieros y operativos con profesionales especializados). Proporcionamos orientación profesional durante todo el proceso de transacción inmobiliaria, asegurando resultados exitosos para compradores y vendedores.`,
        summaryEn: 'Real estate brokerage services including property transactions, market analysis, negotiations, and transaction management.',
        summaryEs: 'Servicios de brokerage inmobiliario incluyendo transacciones de propiedades, análisis de mercado, negociaciones y gestión de transacciones.'
      },
      {
        pageUrl: '/services/consulting',
        pageTitle: 'WM Management - Consulting Services',
        section: 'consulting',
        contentEn: `Our consulting services include: Feasibility Studies (comprehensive market analysis and investment viability assessment), Legal Advisory (regulatory compliance, contract review, and legal risk management), Strategic Planning (development of long-term investment strategies and business plans), Market Research (detailed analysis of real estate markets and investment opportunities). We provide expert guidance to help clients make informed real estate investment decisions through comprehensive analysis and strategic planning.`,
        contentEs: `Nuestros servicios de consultoría incluyen: Estudios de Factibilidad (análisis integral de mercado y evaluación de viabilidad de inversión), Asesoría Legal (cumplimiento regulatorio, revisión de contratos y gestión de riesgos legales), Planificación Estratégica (desarrollo de estrategias de inversión a largo plazo y planes de negocio), Investigación de Mercado (análisis detallado de mercados inmobiliarios y oportunidades de inversión). Proporcionamos orientación experta para ayudar a los clientes a tomar decisiones informadas de inversión inmobiliaria a través de análisis integral y planificación estratégica.`,
        summaryEn: 'Consulting services including feasibility studies, legal advisory, strategic planning, and market research.',
        summaryEs: 'Servicios de consultoría incluyendo estudios de factibilidad, asesoría legal, planificación estratégica e investigación de mercado.'
      },
      {
        pageUrl: '/services/development',
        pageTitle: 'WM Management - Real Estate Development Services',
        section: 'development',
        contentEn: `Our real estate development services include: Project Management (comprehensive oversight of development projects from conception to completion), Design Coordination (working with architects and designers to create optimal project plans), Construction Oversight (monitoring construction progress, quality control, and timeline management), Quality Assurance (ensuring all work meets the highest standards and regulatory requirements). We manage all aspects of real estate development to ensure successful project completion and maximum return on investment.`,
        contentEs: `Nuestros servicios de desarrollo inmobiliario incluyen: Gestión de Proyectos (supervisión integral de proyectos de desarrollo desde la concepción hasta la finalización), Coordinación de Diseño (trabajar con arquitectos y diseñadores para crear planes óptimos de proyecto), Supervisión de Construcción (monitoreo del progreso de construcción, control de calidad y gestión de cronogramas), Aseguramiento de Calidad (asegurar que todo el trabajo cumpla con los más altos estándares y requisitos regulatorios). Gestionamos todos los aspectos del desarrollo inmobiliario para asegurar la finalización exitosa del proyecto y el máximo retorno de inversión.`,
        summaryEn: 'Real estate development services including project management, design coordination, construction oversight, and quality assurance.',
        summaryEs: 'Servicios de desarrollo inmobiliario incluyendo gestión de proyectos, coordinación de diseño, supervisión de construcción y aseguramiento de calidad.'
      },
      {
        pageUrl: '/conversation-schema',
        pageTitle: 'WM Management - Conversation Guide',
        section: 'conversation-schema',
        contentEn: `CONVERSATION FLOW SCHEMA FOR WM MANAGEMENT AI ASSISTANT:

GREETING & PROJECT DISCOVERY:
1. Welcome the user warmly and introduce WM Management services
2. Ask: "What type of real estate project are you currently working on or considering?"
3. Listen for project types: residential investment, commercial property, property management needs, financing requirements, business planning

PROJECT-BASED CONVERSATION PATHS:

FOR RESIDENTIAL INVESTMENT PROJECTS:
- Ask about budget range and investment goals
- Suggest: Business Simulator tool for ROI analysis
- Offer: Financing consultation and property management services
- Next steps: Schedule consultation or use investment calculator

FOR COMMERCIAL PROPERTY PROJECTS:
- Ask about property type (office, retail, industrial, mixed-use)
- Suggest: Market analysis and financing options
- Offer: Specialized commercial property management
- Next steps: Connect with commercial specialists

FOR FINANCING NEEDS:
- Ask about loan type needed (traditional, investment property, business loan)
- Suggest: Financing application process
- Offer: Free consultation to discuss terms and rates
- Next steps: Begin financing application or schedule consultation

FOR PROPERTY MANAGEMENT NEEDS:
- Ask about property portfolio size and type
- Suggest: Full-service management solutions
- Offer: Tenant screening, rent collection, maintenance coordination
- Next steps: Property management consultation

FOR BUSINESS PLANNING:
- Ask about business stage (startup, expansion, optimization)
- Suggest: Business simulation and market analysis tools
- Offer: Strategic planning consultation
- Next steps: Use business simulator or schedule planning session

CONVERSATION GUIDELINES:
- Always ask follow-up questions to understand specific needs
- Propose relevant WM Management services based on responses
- Offer concrete next steps (tools, consultations, applications)
- Provide contact information when requested
- Be helpful, professional, and solution-oriented
- Guide users toward appropriate WM Management services`,
        contentEs: `ESQUEMA DE CONVERSACIÓN PARA ASISTENTE IA DE WM MANAGEMENT:

SALUDO Y DESCUBRIMIENTO DE PROYECTOS:
1. Dar la bienvenida al usuario y presentar los servicios de WM Management
2. Preguntar: "¿En qué tipo de proyecto inmobiliario está trabajando o considerando actualmente?"
3. Escuchar tipos de proyectos: inversión residencial, propiedad comercial, necesidades de gestión, requisitos de financiamiento, planificación empresarial

RUTAS DE CONVERSACIÓN BASADAS EN PROYECTOS:

PARA PROYECTOS DE INVERSIÓN RESIDENCIAL:
- Preguntar sobre rango de presupuesto y objetivos de inversión
- Sugerir: Herramienta de Simulador Empresarial para análisis de ROI
- Ofrecer: Consultoría de financiamiento y servicios de gestión de propiedades
- Próximos pasos: Programar consulta o usar calculadora de inversión

PARA PROYECTOS DE PROPIEDAD COMERCIAL:
- Preguntar sobre tipo de propiedad (oficina, retail, industrial, uso mixto)
- Sugerir: Análisis de mercado y opciones de financiamiento
- Ofrecer: Gestión especializada de propiedades comerciales
- Próximos pasos: Conectar con especialistas comerciales

PARA NECESIDADES DE FINANCIAMIENTO:
- Preguntar sobre tipo de préstamo necesario (tradicional, propiedad de inversión, préstamo comercial)
- Sugerir: Proceso de aplicación de financiamiento
- Ofrecer: Consulta gratuita para discutir términos y tasas
- Próximos pasos: Comenzar aplicación de financiamiento o programar consulta

PARA NECESIDADES DE GESTIÓN DE PROPIEDADES:
- Preguntar sobre tamaño y tipo de cartera de propiedades
- Sugerir: Soluciones de gestión de servicio completo
- Ofrecer: Evaluación de inquilinos, cobro de alquileres, coordinación de mantenimiento
- Próximos pasos: Consulta de gestión de propiedades

PARA PLANIFICACIÓN EMPRESARIAL:
- Preguntar sobre etapa del negocio (startup, expansión, optimización)
- Sugerir: Simulación empresarial y herramientas de análisis de mercado
- Ofrecer: Consultoría de planificación estratégica
- Próximos pasos: Usar simulador empresarial o programar sesión de planificación

DIRECTRICES DE CONVERSACIÓN:
- Siempre hacer preguntas de seguimiento para entender necesidades específicas
- Proponer servicios relevantes de WM Management basados en respuestas
- Ofrecer próximos pasos concretos (herramientas, consultas, aplicaciones)
- Proporcionar información de contacto cuando se solicite
- Ser útil, profesional y orientado a soluciones
- Guiar a usuarios hacia servicios apropiados de WM Management`,
        summaryEn: 'Structured conversation flow for AI assistant to discover user projects and propose relevant WM Management services and next steps.',
        summaryEs: 'Flujo de conversación estructurado para que el asistente IA descubra proyectos de usuarios y proponga servicios relevantes de WM Management y próximos pasos.'
      },
      {
        pageUrl: '/project-types',
        pageTitle: 'WM Management - Project Types We Handle',
        section: 'project-types',
        contentEn: `TYPES OF PROJECTS WM MANAGEMENT SPECIALIZES IN:

RESIDENTIAL INVESTMENT PROJECTS:
- Single-family rental properties
- Multi-family apartment buildings
- Condominiums and townhomes
- Fix-and-flip properties
- Buy-and-hold investments
- Vacation rental properties

COMMERCIAL REAL ESTATE PROJECTS:
- Office buildings and complexes
- Retail shopping centers
- Industrial warehouses and facilities
- Mixed-use developments
- Medical and professional buildings
- Hospitality properties

FINANCING PROJECTS:
- First-time investment property purchases
- Portfolio expansion financing
- Refinancing existing properties
- Business acquisition loans
- Construction and development loans
- Bridge financing solutions

PROPERTY MANAGEMENT PROJECTS:
- Full-service residential management
- Commercial property management
- Portfolio management for multiple properties
- Tenant placement and screening
- Maintenance and repair coordination
- Financial reporting and analysis

BUSINESS DEVELOPMENT PROJECTS:
- Real estate investment business startup
- Portfolio optimization and growth
- Market analysis and expansion planning
- Investment strategy development
- Risk assessment and mitigation
- Exit strategy planning

Each project type requires different expertise, financing approaches, and management strategies. WM Management provides specialized services tailored to each project category.`,
        contentEs: `TIPOS DE PROYECTOS EN LOS QUE SE ESPECIALIZA WM MANAGEMENT:

PROYECTOS DE INVERSIÓN RESIDENCIAL:
- Propiedades de alquiler unifamiliares
- Edificios de apartamentos multifamiliares
- Condominios y casas adosadas
- Propiedades para renovar y vender
- Inversiones de compra y retención
- Propiedades de alquiler vacacional

PROYECTOS INMOBILIARIOS COMERCIALES:
- Edificios y complejos de oficinas
- Centros comerciales
- Almacenes e instalaciones industriales
- Desarrollos de uso mixto
- Edificios médicos y profesionales
- Propiedades de hospitalidad

PROYECTOS DE FINANCIAMIENTO:
- Compras de primera propiedad de inversión
- Financiamiento de expansión de cartera
- Refinanciamiento de propiedades existentes
- Préstamos de adquisición de negocios
- Préstamos de construcción y desarrollo
- Soluciones de financiamiento puente

PROYECTOS DE GESTIÓN DE PROPIEDADES:
- Gestión residencial de servicio completo
- Gestión de propiedades comerciales
- Gestión de cartera para múltiples propiedades
- Colocación y evaluación de inquilinos
- Coordinación de mantenimiento y reparaciones
- Informes y análisis financieros

PROYECTOS DE DESARROLLO EMPRESARIAL:
- Startup de negocio de inversión inmobiliaria
- Optimización y crecimiento de cartera
- Análisis de mercado y planificación de expansión
- Desarrollo de estrategia de inversión
- Evaluación y mitigación de riesgos
- Planificación de estrategia de salida

Cada tipo de proyecto requiere diferente experiencia, enfoques de financiamiento y estrategias de gestión. WM Management proporciona servicios especializados adaptados a cada categoría de proyecto.`,
        summaryEn: 'Comprehensive list of residential, commercial, financing, property management, and business development projects that WM Management specializes in.',
        summaryEs: 'Lista completa de proyectos residenciales, comerciales, de financiamiento, gestión de propiedades y desarrollo empresarial en los que WM Management se especializa.'
      }
    ];

    // Clear existing knowledge base
    await supabase.from('knowledge_base').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert content for both languages
    const knowledgeEntries = [];
    
    for (const content of contentToIndex) {
      // English version
      knowledgeEntries.push({
        page_url: content.pageUrl,
        page_title: content.pageTitle,
        content: content.contentEn,
        summary: content.summaryEn,
        section: content.section,
        language: 'en'
      });

      // Spanish version
      knowledgeEntries.push({
        page_url: content.pageUrl,
        page_title: content.pageTitle + ' (Español)',
        content: content.contentEs,
        summary: content.summaryEs,
        section: content.section,
        language: 'es'
      });
    }

    const { error } = await supabase
      .from('knowledge_base')
      .insert(knowledgeEntries);

    if (error) throw error;

    console.log(`Successfully indexed ${knowledgeEntries.length} knowledge base entries`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Successfully indexed ${knowledgeEntries.length} knowledge base entries`,
      entriesIndexed: knowledgeEntries.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in scrape-website-content function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});