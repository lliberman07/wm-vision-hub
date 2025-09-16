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
        contentEn: `Our services include comprehensive property management, real estate investment consulting, financing solutions, business planning and analysis, market research and evaluation, portfolio management, and strategic investment planning. We provide end-to-end solutions for real estate investors and property owners.`,
        contentEs: `Nuestros servicios incluyen gestión integral de propiedades, consultoría en inversión inmobiliaria, soluciones de financiamiento, planificación y análisis empresarial, investigación y evaluación de mercado, gestión de cartera y planificación estratégica de inversiones. Proporcionamos soluciones integrales para inversionistas inmobiliarios y propietarios.`,
        summaryEn: 'Comprehensive property management, investment consulting, financing solutions, and strategic planning services.',
        summaryEs: 'Gestión integral de propiedades, consultoría en inversión, soluciones de financiamiento y servicios de planificación estratégica.'
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
        pageUrl: '/property-management',
        pageTitle: 'WM Management - Property Management',
        section: 'property-management',
        contentEn: `Our property management services include tenant screening and placement, rent collection and financial reporting, maintenance and repairs coordination, property inspections, legal compliance management, and 24/7 emergency response. We handle all aspects of property management to maximize your investment returns.`,
        contentEs: `Nuestros servicios de gestión de propiedades incluyen evaluación y colocación de inquilinos, cobro de alquileres e informes financieros, coordinación de mantenimiento y reparaciones, inspecciones de propiedades, gestión de cumplimiento legal y respuesta de emergencia 24/7. Manejamos todos los aspectos de la gestión de propiedades para maximizar los retornos de su inversión.`,
        summaryEn: 'Complete property management including tenant services, maintenance coordination, and financial reporting.',
        summaryEs: 'Gestión completa de propiedades incluyendo servicios de inquilinos, coordinación de mantenimiento e informes financieros.'
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
        contentEn: `Contact WM Management for all your real estate investment and property management needs. We offer free consultations to discuss your investment goals and how we can help you achieve them. Our team is available to answer questions about financing, property management, and investment opportunities.`,
        contentEs: `Contacte a WM Management para todas sus necesidades de inversión inmobiliaria y gestión de propiedades. Ofrecemos consultas gratuitas para discutir sus objetivos de inversión y cómo podemos ayudarle a alcanzarlos. Nuestro equipo está disponible para responder preguntas sobre financiamiento, gestión de propiedades y oportunidades de inversión.`,
        summaryEn: 'Contact us for real estate investment and property management services with free consultations available.',
        summaryEs: 'Contáctenos para servicios de inversión inmobiliaria y gestión de propiedades con consultas gratuitas disponibles.'
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