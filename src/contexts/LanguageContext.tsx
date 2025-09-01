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
    'home.simulator.cta': 'Try Our Simulator',
    'home.learnMore': 'Learn More',
    'home.news.title': 'News & Updates – March 2025',
    'home.news.content': 'New Market Insights: Our latest research highlights emerging trends in property management that are revolutionizing the industry. Check back monthly for fresh updates and actionable strategies.',
    
    // About page
    'about.hero.badge': 'About WM Management',
    'about.hero.title': 'Transforming Real Estate Challenges into Opportunities',
    'about.hero.subtitle': 'We leverage data-driven insights and deep industry expertise to deliver solutions that add real value to every client relationship.',
    'about.mission.title': 'Our Mission',
    'about.mission.content1': 'At WM Management & Investments, our mission is to convert real estate challenges into tangible opportunities. We leverage data-driven insights and deep industry expertise to deliver solutions that add real value.',
    'about.mission.content2': 'We believe that by embracing transparency, integrity, and a pragmatic approach, we can empower every investor to reach their full potential.',
    'about.vision.title': 'Our Vision',
    'about.vision.content': 'Our vision is to be the trusted partner that simplifies the complex world of real estate, enabling our clients to make informed decisions and achieve lasting success.',
    'about.team.title': 'Meet Our Team',
    'about.team.subtitle': 'Our team is our cornerstone. Composed of industry veterans and innovative strategists, we bring together a wealth of experience and fresh ideas to drive success.',
    'about.team.leadership': 'Leadership Team',
    'about.team.leadership.desc': 'Industry veterans with decades of combined experience in real estate management and investment.',
    'about.team.strategy': 'Strategy Experts',
    'about.team.strategy.desc': 'Data analysts and strategic planners who transform market insights into actionable opportunities.',
    'about.team.client': 'Client Partners',
    'about.team.client.desc': 'Dedicated professionals who work side by side with clients to craft effective, innovative solutions.',
    'about.values.title': 'Our Core Values',
    'about.values.subtitle': 'The principles that guide every decision and drive our success',
    'about.values.transparency': 'Transparency',
    'about.values.transparency.desc': 'Clear communication and honest reporting in every interaction and transaction.',
    'about.values.integrity': 'Integrity',
    'about.values.integrity.desc': 'Ethical practices and principled decision-making that builds lasting trust.',
    'about.values.excellence': 'Excellence',
    'about.values.excellence.desc': 'Committed to delivering exceptional results through continuous improvement and innovation.',
    
    // Services page
    'services.hero.badge': 'Professional Services',
    'services.hero.title': 'Comprehensive Real Estate Solutions',
    'services.hero.subtitle': 'Our services are at the heart of what we do. Each offering is designed to deliver clarity, drive value, and provide measurable results.',
    'services.property.title': 'Property Management',
    'services.property.description': 'Managing your property shouldn\'t be complicated. Our property management service covers everything from lease administration and routine maintenance to strategic performance optimization.',
    'services.brokerage.title': 'Brokerage',
    'services.brokerage.description': 'Real estate transactions demand precision and transparency. Our brokerage services connect buyers, sellers, and lessees with the best opportunities available.',
    'services.consulting.title': 'Consulting Services',
    'services.consulting.description': 'When complexity meets clarity, success follows. Our consulting services break down real estate challenges into clear, actionable strategies.',
    'services.development.title': 'Real Estate Development',
    'services.development.description': 'Turning vision into reality—our real estate development team manages projects from concept through completion with innovative design and strategic planning.',
    'services.investments.title': 'Trust & Investments',
    'services.investments.description': 'Invest with assurance. Our trust and investment services provide a secure and transparent framework for managing real estate assets.',
    
    // Common
    'common.readyToStart': 'Ready to Get Started?',
    'common.contactTeam': 'Contact Our Team',
    'common.keyFeatures': 'Key Features:',
    'common.language': 'Language',
    'common.trySimulator': 'Try Our Simulator',
    
    // Footer
    'footer.description': 'Transforming complexity into clarity. Your trusted partner in real estate consulting, investment, and development.',
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
    'home.hero.subtitle': 'En WM, transformamos la complejidad en claridad. Somos apasionados por abrazar sus visiones y desafíos, transformando la forma en que vivimos, trabajamos y desarrollamos nuestras comunidades.',
    'home.hero.description': 'Nuestro equipo experimentado y las soluciones digitales convierten los complejos desafíos inmobiliarios en oportunidades claras y accionables con éxito medible.',
    'home.hero.cta1': 'Explorar Nuestros Servicios',
    'home.hero.cta2': 'Descubrir Soluciones de Financiamiento',
    'home.hero.feature1': 'Excelencia en Gestión de Propiedades',
    'home.hero.feature2': 'Soluciones Estratégicas de Inversión',
    'home.hero.feature3': 'Desarrollo Inmobiliario',
    'home.hero.feature4': 'Servicios Expertos de Consultoría',
    'home.services.title': 'Soluciones Integradas para el Éxito Inmobiliario',
    'home.services.subtitle': 'Desde la gestión de propiedades hasta los servicios de fideicomiso de inversión, ofrecemos claridad y resultados en cada aspecto de los bienes raíces.',
    'home.services.property.title': 'Gestión de Propiedades',
    'home.services.property.description': 'Cuidado integral de propiedades desde la administración de arrendamientos hasta la optimización estratégica.',
    'home.services.brokerage.title': 'Corretaje',
    'home.services.brokerage.description': 'Orientación experta conectando oportunidades con precisión y transparencia.',
    'home.services.consulting.title': 'Servicios de Consultoría',
    'home.services.consulting.description': 'Insights estratégicos que transforman desafíos complejos en oportunidades claras.',
    'home.services.development.title': 'Desarrollo Inmobiliario',
    'home.services.development.description': 'De la visión a la realidad—gestión y ejecución integral de desarrollo.',
    'home.services.investments.title': 'Fideicomisos e Inversiones',
    'home.services.investments.description': 'Marcos de inversión seguros y transparentes con retornos ajustados al riesgo.',
    'home.services.financing.title': 'Soluciones de Financiamiento',
    'home.services.financing.description': 'Financiamiento competitivo con opciones sin intereses para sus proyectos de remodelación.',
    'home.simulator.cta': 'Probar Nuestro Simulador',
    'home.learnMore': 'Saber Más',
    'home.news.title': 'Noticias y Actualizaciones – Marzo 2025',
    'home.news.content': 'Nuevos Insights del Mercado: Nuestra última investigación destaca tendencias emergentes en la gestión de propiedades que están revolucionando la industria. Vuelva mensualmente para actualizaciones frescas y estrategias accionables.',
    
    // About page
    'about.hero.badge': 'Acerca de WM Management',
    'about.hero.title': 'Transformando Desafíos Inmobiliarios en Oportunidades',
    'about.hero.subtitle': 'Aprovechamos insights basados en datos y profunda experiencia de la industria para entregar soluciones que agregan valor real a cada relación con el cliente.',
    'about.mission.title': 'Nuestra Misión',
    'about.mission.content1': 'En WM Management & Investments, nuestra misión es convertir los desafíos inmobiliarios en oportunidades tangibles. Aprovechamos insights basados en datos y profunda experiencia de la industria para entregar soluciones que agregan valor real.',
    'about.mission.content2': 'Creemos que al abrazar la transparencia, integridad y un enfoque pragmático, podemos empoderar a cada inversor para alcanzar su máximo potencial.',
    'about.vision.title': 'Nuestra Visión',
    'about.vision.content': 'Nuestra visión es ser el socio de confianza que simplifica el complejo mundo de los bienes raíces, permitiendo a nuestros clientes tomar decisiones informadas y lograr un éxito duradero.',
    'about.team.title': 'Conoce Nuestro Equipo',
    'about.team.subtitle': 'Nuestro equipo es nuestra piedra angular. Compuesto por veteranos de la industria y estrategas innovadores, reunimos una gran riqueza de experiencia e ideas frescas para impulsar el éxito.',
    'about.team.leadership': 'Equipo de Liderazgo',
    'about.team.leadership.desc': 'Veteranos de la industria con décadas de experiencia combinada en gestión inmobiliaria e inversión.',
    'about.team.strategy': 'Expertos en Estrategia',
    'about.team.strategy.desc': 'Analistas de datos y planificadores estratégicos que transforman insights del mercado en oportunidades accionables.',
    'about.team.client': 'Socios de Clientes',
    'about.team.client.desc': 'Profesionales dedicados que trabajan lado a lado con los clientes para crear soluciones efectivas e innovadoras.',
    'about.values.title': 'Nuestros Valores Fundamentales',
    'about.values.subtitle': 'Los principios que guían cada decisión e impulsan nuestro éxito',
    'about.values.transparency': 'Transparencia',
    'about.values.transparency.desc': 'Comunicación clara y reportes honestos en cada interacción y transacción.',
    'about.values.integrity': 'Integridad',
    'about.values.integrity.desc': 'Prácticas éticas y toma de decisiones basada en principios que construye confianza duradera.',
    'about.values.excellence': 'Excelencia',
    'about.values.excellence.desc': 'Comprometidos a entregar resultados excepcionales a través de la mejora continua e innovación.',
    
    // Services page
    'services.hero.badge': 'Servicios Profesionales',
    'services.hero.title': 'Soluciones Inmobiliarias Integrales',
    'services.hero.subtitle': 'Nuestros servicios están en el corazón de lo que hacemos. Cada oferta está diseñada para entregar claridad, impulsar valor y proporcionar resultados medibles.',
    'services.property.title': 'Gestión de Propiedades',
    'services.property.description': 'Gestionar su propiedad no debería ser complicado. Nuestro servicio de gestión de propiedades cubre todo desde la administración de arrendamientos y mantenimiento rutinario hasta la optimización estratégica del rendimiento.',
    'services.brokerage.title': 'Corretaje',
    'services.brokerage.description': 'Las transacciones inmobiliarias exigen precisión y transparencia. Nuestros servicios de corretaje conectan compradores, vendedores y arrendatarios con las mejores oportunidades disponibles.',
    'services.consulting.title': 'Servicios de Consultoría',
    'services.consulting.description': 'Cuando la complejidad se encuentra con la claridad, el éxito sigue. Nuestros servicios de consultoría descomponen los desafíos inmobiliarios en estrategias claras y accionables.',
    'services.development.title': 'Desarrollo Inmobiliario',
    'services.development.description': 'Convirtiendo visión en realidad—nuestro equipo de desarrollo inmobiliario gestiona proyectos desde el concepto hasta la finalización con diseño innovador y planificación estratégica.',
    'services.investments.title': 'Fideicomisos e Inversiones',
    'services.investments.description': 'Invierta con seguridad. Nuestros servicios de fideicomiso e inversión proporcionan un marco seguro y transparente para gestionar activos inmobiliarios.',
    
    // Common
    'common.readyToStart': '¿Listo para Comenzar?',
    'common.contactTeam': 'Contactar Nuestro Equipo',
    'common.keyFeatures': 'Características Clave:',
    'common.language': 'Idioma',
    'common.trySimulator': 'Probar Nuestro Simulador',
    
    // Footer
    'footer.description': 'Transformando la complejidad en claridad. Su socio de confianza en consultoría, inversión y desarrollo inmobiliario.',
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