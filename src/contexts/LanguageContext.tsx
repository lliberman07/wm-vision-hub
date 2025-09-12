import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionary
const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About Us',
    'nav.services': 'Services',
    'nav.industries': 'Industries & Programs',
    'nav.financing': 'Financing',
    'nav.contact': 'Contact',
    'nav.faq': 'FAQ',
    'nav.getStarted': 'Get Started',
    
    // Home page
    'home.hero.badge': 'Real Estate Excellence',
    'home.hero.title': 'Welcome to WM Management & Investments',
    'home.hero.subtitle': 'At WM, we transform complexity into clarity. We are passionate about embracing your visions and challenges, transforming the way we live, work, and develop our communities.',
    'home.hero.description': 'Our experienced team and digital solutions turn intricate real estate challenges into straightforward, actionable opportunities with measurable success.',
    'home.hero.cta1': 'Explore Our Services',
    'home.hero.cta2': 'Discover Financing Solutions',
    'home.hero.feature1': 'Property Management Excellence',
    'home.hero.feature2': 'Strategic Investment Solutions',
    'home.hero.feature3': 'Real Estate Development',
    'home.hero.feature4': 'Expert Consulting Services',
    'home.services.title': 'Integrated Solutions for Real Estate Success',
    'home.services.subtitle': 'From property management to investment trust services, we deliver clarity and results across every aspect of real estate.',
    'home.services.property.title': 'Property Management',
    'home.services.property.description': 'Comprehensive property care from lease administration to strategic optimization.',
    'home.services.brokerage.title': 'Brokerage',
    'home.services.brokerage.description': 'Expert guidance connecting opportunities with precision and transparency.',
    'home.services.consulting.title': 'Consulting Services',
    'home.services.consulting.description': 'Strategic insights that transform complex challenges into clear opportunities.',
    'home.services.development.title': 'Real Estate Development',
    'home.services.development.description': 'From vision to reality—comprehensive development management and execution.',
    'home.services.investments.title': 'Trust & Investments',
    'home.services.investments.description': 'Secure, transparent investment frameworks with risk-adjusted returns.',
    'home.services.financing.title': 'Financing Solutions',
    'home.services.financing.description': 'Competitive financing with interest-free options for your remodeling projects.',
    'home.news.title': 'Latest News & Updates',
    'home.news.content': 'Stay informed about the latest trends, opportunities, and insights in real estate. Our team regularly shares market updates, investment tips, and industry expertise to help you make informed decisions.',
    'home.learnMore': 'Learn More',
    'home.simulator.cta': 'Try Our Simulator',

    // Common
    'common.readyToStart': 'Ready to Get Started?',
    'common.contactTeam': 'Contact Our Team',
    'common.keyFeatures': 'Key Features:',
    'common.language': 'Language',
    'common.trySimulator': 'Try Our Simulator',
    'common.submit': 'Submit',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.required': 'Required',
    'common.optional': 'Optional',
    'common.learnMore': 'Learn More',
    'common.contactUs': 'Contact Us',
    'common.phone': 'Phone',
    'common.email': 'Email',
    'common.address': 'Address',
    'common.name': 'Name',
    'common.message': 'Message',
    'common.send': 'Send',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.close': 'Close',
    'common.open': 'Open',

    // Investment Simulator
    'simulator.title': 'Business Investment Plan Simulator',
    'simulator.description': 'Plan your franchise investment with our interactive tool. Adjust variables to see real-time projections of costs and financing options.',
    'simulator.tabs.basic': 'Basic Configuration',
    'simulator.tabs.advanced': 'Advanced Configuration',
    'simulator.tabs.results': 'Results & Analysis',
    'simulator.totalCost.title': 'Total Franchise Cost',
    'simulator.totalCost.description': 'Enter the total investment required for the franchise',
    'simulator.totalCost.label': 'Total Cost ($)',
    'simulator.breakdown.title': 'Cost Breakdown Percentages',
    'simulator.breakdown.description': 'Adjust your total investment allocation',
    'simulator.breakdown.entranceFee': 'Entrance Fee',
    'simulator.breakdown.infrastructure': 'Infrastructure & Renovation',
    'simulator.breakdown.equipment': 'Equipment & Assets',
    'simulator.breakdown.workingCapital': 'Working Capital',
    'simulator.financing.title': 'Financing Details',
    'simulator.financing.description': 'Configure your financing options for infrastructure costs',
    'simulator.financing.percentage': 'Financed Percentage',
    'simulator.financing.term': 'Financing Term (months)',
    'simulator.financing.rate': 'Interest Rate (%)',
    'simulator.property.title': 'Property Details',
    'simulator.property.description': 'Specific details about your franchise location',
    'simulator.property.size': 'Property Size (m²)',
    'simulator.property.costM2': 'Cost per m² ($)',
    'simulator.property.insurance': 'Insurance Cost ($)',
    'simulator.results.costBreakdown': 'Cost Breakdown',
    'simulator.results.costBreakdown.desc': 'Visual representation of your investment allocation',
    'simulator.results.financingBreakdown': 'Financing Breakdown',
    'simulator.results.financingBreakdown.desc': 'Infrastructure financing vs out-of-pocket costs',
    'simulator.results.summary': 'Financial Summary',
    'simulator.results.summary.desc': 'Complete breakdown of your franchise investment',
    'simulator.results.totalInvestment': 'Total Investment',
    'simulator.results.upfrontPayment': 'Upfront Payment',
    'simulator.results.financedAmount': 'Financed Amount',
    'simulator.results.monthlyPayment': 'Monthly Payment',
    'simulator.results.detailedBreakdown': 'Detailed Breakdown:',
    'simulator.results.save': 'Save Scenario',
    'simulator.results.export': 'Export Report',
    'simulator.chart.financed': 'Financed',
    'simulator.chart.outOfPocket': 'Out of Pocket',
  },
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.about': 'Quiénes Somos',
    'nav.services': 'Servicios',
    'nav.industries': 'Industrias y Programas',
    'nav.financing': 'Financiamiento',
    'nav.contact': 'Contacto',
    'nav.faq': 'Preguntas Frecuentes',
    'nav.getStarted': 'Comenzar',
    
    // Home page
    'home.hero.badge': 'Excelencia Inmobiliaria',
    'home.hero.title': 'Bienvenido a WM Management & Investments',
    'home.hero.subtitle': 'En WM, transformamos la complejidad en claridad. Nos apasiona abrazar sus visiones y desafíos, transformando la forma en que vivimos, trabajamos y desarrollamos nuestras comunidades.',
    'home.hero.description': 'Nuestro equipo experimentado y soluciones digitales convierten los complejos desafíos inmobiliarios en oportunidades claras y accionables con éxito medible.',
    'home.hero.cta1': 'Explorar Nuestros Servicios',
    'home.hero.cta2': 'Descubrir Soluciones de Financiamiento',
    'home.hero.feature1': 'Excelencia en Administración de Propiedades',
    'home.hero.feature2': 'Soluciones Estratégicas de Inversión',
    'home.hero.feature3': 'Desarrollo Inmobiliario',
    'home.hero.feature4': 'Servicios Expertos de Consultoría',
    'home.services.title': 'Soluciones Integradas para el Éxito Inmobiliario',
    'home.services.subtitle': 'Desde administración de propiedades hasta servicios de fideicomiso de inversión, entregamos claridad y resultados en todos los aspectos del sector inmobiliario.',
    'home.services.property.title': 'Administración de Propiedades',
    'home.services.property.description': 'Cuidado integral de propiedades desde administración de arrendamientos hasta optimización estratégica.',
    'home.services.brokerage.title': 'Corretaje',
    'home.services.brokerage.description': 'Orientación experta conectando oportunidades con precisión y transparencia.',
    'home.services.consulting.title': 'Servicios de Consultoría',
    'home.services.consulting.description': 'Perspectivas estratégicas que transforman desafíos complejos en oportunidades claras.',
    'home.services.development.title': 'Desarrollo Inmobiliario',
    'home.services.development.description': 'De la visión a la realidad: gestión y ejecución integral de desarrollo.',
    'home.services.investments.title': 'Fideicomiso e Inversiones',
    'home.services.investments.description': 'Marcos de inversión seguros y transparentes con retornos ajustados al riesgo.',
    'home.services.financing.title': 'Soluciones de Financiamiento',
    'home.services.financing.description': 'Financiamiento competitivo con opciones sin intereses para sus proyectos de remodelación.',
    'home.news.title': 'Últimas Noticias y Actualizaciones',
    'home.news.content': 'Manténgase informado sobre las últimas tendencias, oportunidades e insights en el sector inmobiliario. Nuestro equipo comparte regularmente actualizaciones del mercado, consejos de inversión y experiencia de la industria para ayudarle a tomar decisiones informadas.',
    'home.learnMore': 'Saber Más',
    'home.simulator.cta': 'Probar Nuestro Simulador',

    // Common
    'common.readyToStart': '¿Listo para Comenzar?',
    'common.contactTeam': 'Contactar Nuestro Equipo',
    'common.keyFeatures': 'Características Clave:',
    'common.language': 'Idioma',
    'common.trySimulator': 'Probar Nuestro Simulador',
    'common.submit': 'Enviar',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.required': 'Requerido',
    'common.optional': 'Opcional',
    'common.learnMore': 'Saber Más',
    'common.contactUs': 'Contáctenos',
    'common.phone': 'Teléfono',
    'common.email': 'Correo Electrónico',
    'common.address': 'Dirección',
    'common.name': 'Nombre',
    'common.message': 'Mensaje',
    'common.send': 'Enviar',
    'common.back': 'Atrás',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
    'common.close': 'Cerrar',
    'common.open': 'Abrir',

    // Investment Simulator
    'simulator.title': 'Simulador de Plan de Inversión de Negocio',
    'simulator.description': 'Planifique su inversión de franquicia con nuestra herramienta interactiva. Ajuste variables para ver proyecciones en tiempo real de costos y opciones de financiamiento.',
    'simulator.tabs.basic': 'Configuración Básica',
    'simulator.tabs.advanced': 'Configuración Avanzada',
    'simulator.tabs.results': 'Resultados y Análisis',
    'simulator.totalCost.title': 'Costo Total de Franquicia',
    'simulator.totalCost.description': 'Ingrese la inversión total requerida para la franquicia',
    'simulator.totalCost.label': 'Costo Total ($)',
    'simulator.breakdown.title': 'Porcentajes de Desglose de Costos',
    'simulator.breakdown.description': 'Ajuste la asignación de su inversión total',
    'simulator.breakdown.entranceFee': 'Cuota de Entrada',
    'simulator.breakdown.infrastructure': 'Infraestructura y Remodelación',
    'simulator.breakdown.equipment': 'Equipos y Activos',
    'simulator.breakdown.workingCapital': 'Capital de Trabajo',
    'simulator.financing.title': 'Detalles de Financiamiento',
    'simulator.financing.description': 'Configure sus opciones de financiamiento para costos de infraestructura',
    'simulator.financing.percentage': 'Porcentaje Financiado',
    'simulator.financing.term': 'Plazo de Financiamiento (meses)',
    'simulator.financing.rate': 'Tasa de Interés (%)',
    'simulator.property.title': 'Detalles de la Propiedad',
    'simulator.property.description': 'Detalles específicos sobre la ubicación de su franquicia',
    'simulator.property.size': 'Tamaño del Local (m²)',
    'simulator.property.costM2': 'Costo por m² ($)',
    'simulator.property.insurance': 'Costo de Seguro ($)',
    'simulator.results.costBreakdown': 'Desglose de Costos',
    'simulator.results.costBreakdown.desc': 'Representación visual de la asignación de su inversión',
    'simulator.results.financingBreakdown': 'Desglose de Financiamiento',
    'simulator.results.financingBreakdown.desc': 'Financiamiento de infraestructura vs costos de bolsillo',
    'simulator.results.summary': 'Resumen Financiero',
    'simulator.results.summary.desc': 'Desglose completo de su inversión de franquicia',
    'simulator.results.totalInvestment': 'Inversión Total',
    'simulator.results.upfrontPayment': 'Pago Inicial',
    'simulator.results.financedAmount': 'Monto Financiado',
    'simulator.results.monthlyPayment': 'Pago Mensual',
    'simulator.results.detailedBreakdown': 'Desglose Detallado:',
    'simulator.results.save': 'Guardar Escenario',
    'simulator.results.export': 'Exportar Reporte',
    'simulator.chart.financed': 'Financiado',
    'simulator.chart.outOfPocket': 'De su Bolsillo',
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
