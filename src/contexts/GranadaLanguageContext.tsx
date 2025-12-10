import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type GranadaLanguage = 'es' | 'en' | 'pt';

interface GranadaLanguageContextType {
  language: GranadaLanguage;
  setLanguage: (lang: GranadaLanguage) => void;
  t: (key: string) => string;
}

const translations: Record<GranadaLanguage, Record<string, string>> = {
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.inmobiliarias': 'Inmobiliarias y Admin',
    'nav.propietarios': 'Propietarios',
    'nav.planes': 'Planes',
    'nav.proveedores': 'Proveedores',
    'nav.contacto': 'Contacto',
    'nav.access_pms': 'Acceso PMS',
    
    // Home page
    'home.badge': 'Property Management System',
    'home.title': 'La forma simple de administrar propiedades complejas',
    'home.subtitle': 'Plataforma integral para la gestión de alquileres que conecta inmobiliarias, propietarios e inquilinos en un solo lugar.',
    'home.benefit1': 'Control total de contratos y pagos',
    'home.benefit2': 'Seguridad y transparencia garantizada',
    'home.benefit3': 'Reportes automáticos mensuales',
    'home.cta_inmobiliaria': 'Inmobiliaria / Admin',
    'home.cta_propietario': 'Propietario',
    
    // Inmobiliarias page
    'inmobiliarias.badge': 'Para Inmobiliarias y Administradores',
    'inmobiliarias.title': 'Gestión Profesional de Propiedades',
    'inmobiliarias.subtitle': 'Herramientas avanzadas para administrar carteras de alquileres con eficiencia y profesionalismo.',
    'inmobiliarias.features_title': 'Características Principales',
    'inmobiliarias.feature1_title': 'Panel de Control Integral',
    'inmobiliarias.feature1_desc': 'Visualiza todas tus propiedades, contratos y pagos en un solo dashboard.',
    'inmobiliarias.feature2_title': 'Gestión de Contratos',
    'inmobiliarias.feature2_desc': 'Crea, renueva y administra contratos con ajustes automáticos por índices.',
    'inmobiliarias.feature3_title': 'Cobranzas Automatizadas',
    'inmobiliarias.feature3_desc': 'Recordatorios de pago, seguimiento de deudas y reportes de morosidad.',
    'inmobiliarias.feature4_title': 'Reportes Personalizados',
    'inmobiliarias.feature4_desc': 'Genera reportes para propietarios con detalle de ingresos y gastos.',
    'inmobiliarias.feature5_title': 'Multi-usuario',
    'inmobiliarias.feature5_desc': 'Gestiona tu equipo con diferentes niveles de acceso y permisos.',
    'inmobiliarias.feature6_title': 'Integraciones',
    'inmobiliarias.feature6_desc': 'Conecta con sistemas de facturación y bancos para automatizar procesos.',
    'inmobiliarias.cta': 'Solicitar Demo',
    'inmobiliarias.benefits_title': 'Beneficios para tu Inmobiliaria',
    'inmobiliarias.benefit1': 'Reduce hasta 70% el tiempo administrativo',
    'inmobiliarias.benefit2': 'Elimina errores en cálculos de ajustes',
    'inmobiliarias.benefit3': 'Mejora la comunicación con propietarios',
    'inmobiliarias.benefit4': 'Acceso desde cualquier dispositivo',
    
    // Propietarios page
    'propietarios.badge': 'Para Propietarios',
    'propietarios.title': 'Tu Propiedad, Tu Control',
    'propietarios.subtitle': 'Mantén el control de tus inversiones inmobiliarias con información en tiempo real y reportes automáticos.',
    'propietarios.options_title': '¿Cómo prefieres administrar?',
    'propietarios.self_title': 'Auto-Gestión',
    'propietarios.self_subtitle': 'Administra directamente',
    'propietarios.self_desc': 'Ideal si tienes pocas propiedades y quieres control total sobre la gestión.',
    'propietarios.self_feature1': 'Gestión directa de inquilinos',
    'propietarios.self_feature2': 'Control total de cobranzas',
    'propietarios.self_feature3': 'Sin comisiones de administración',
    'propietarios.self_feature4': 'Soporte técnico incluido',
    'propietarios.delegate_title': 'Delegación',
    'propietarios.delegate_subtitle': 'Delega a una inmobiliaria',
    'propietarios.delegate_desc': 'Perfecto si prefieres que profesionales manejen la gestión diaria.',
    'propietarios.delegate_feature1': 'Gestión profesional completa',
    'propietarios.delegate_feature2': 'Reportes automáticos mensuales',
    'propietarios.delegate_feature3': 'Aprobación de gastos desde el portal',
    'propietarios.delegate_feature4': 'Transparencia total',
    'propietarios.portal_title': 'Beneficios del Portal',
    'propietarios.portal_benefit1_title': 'Reportes Automáticos',
    'propietarios.portal_benefit1_desc': 'Recibe reportes mensuales detallados de tus propiedades.',
    'propietarios.portal_benefit2_title': 'Historial de Pagos',
    'propietarios.portal_benefit2_desc': 'Accede al historial completo de pagos e ingresos.',
    'propietarios.portal_benefit3_title': 'Aprobación de Gastos',
    'propietarios.portal_benefit3_desc': 'Aprueba o rechaza gastos desde cualquier dispositivo.',
    'propietarios.portal_benefit4_title': 'Documentación',
    'propietarios.portal_benefit4_desc': 'Todos los documentos de tus propiedades en un solo lugar.',
    'propietarios.portal_benefit5_title': 'Actualizaciones en Tiempo Real',
    'propietarios.portal_benefit5_desc': 'Notificaciones instantáneas sobre eventos importantes.',
    'propietarios.portal_benefit6_title': 'Seguridad',
    'propietarios.portal_benefit6_desc': 'Tus datos protegidos con encriptación de nivel bancario.',
    'propietarios.portal_benefit7_title': 'Gestión Continua',
    'propietarios.portal_benefit7_desc': 'Tu propiedad administrada 24/7, los 365 días del año.',
    
    // Planes page
    'planes.badge': 'Planes y Precios',
    'planes.title': 'Elige el plan perfecto para tu negocio',
    'planes.subtitle': 'Planes flexibles que se adaptan al tamaño de tu cartera. Sin costos ocultos, sin compromisos a largo plazo.',
    'planes.billing_label': 'Suscripción con Pago',
    'planes.monthly': 'Mensual',
    'planes.yearly': 'Anual',
    'planes.off': 'OFF',
    'planes.equivalent': 'Equivalente a',
    'planes.per_month': '/mes',
    'planes.per_year': '/año',
    'planes.start': 'Comenzar',
    'planes.contact': 'Contactar',
    'planes.popular': 'Más Popular',
    'planes.faq_title': 'Preguntas Frecuentes',
    'planes.cta_title': '¿Listo para empezar?',
    'planes.cta_subtitle': 'Agenda una demo personalizada o comienza tu prueba gratuita hoy.',
    'planes.cta_demo': 'Agendar Demo',
    'planes.cta_trial': 'Prueba Gratuita',
    
    // Proveedores page
    'proveedores.badge': 'Red de Proveedores',
    'proveedores.title': 'Conectamos Inmobiliarias con los Mejores Proveedores',
    'proveedores.subtitle': 'Forma parte de nuestra red de proveedores verificados y accede a nuevas oportunidades de negocio.',
    'proveedores.categories_title': 'Categorías de Servicios',
    'proveedores.benefits_title': 'Beneficios',
    'proveedores.for_agencies': 'Para Inmobiliarias',
    'proveedores.for_providers': 'Para Proveedores',
    'proveedores.how_title': '¿Cómo Funciona?',
    'proveedores.cta_register': 'Registrarse como Proveedor',
    'proveedores.cta_directory': 'Ver Directorio',
    
    // Contacto page
    'contacto.badge': 'Contacto',
    'contacto.title': 'Hablemos sobre tu proyecto',
    'contacto.subtitle': 'Estamos aquí para ayudarte. Completa el formulario y nos pondremos en contacto contigo.',
    'contacto.info_title': 'Información de Contacto',
    'contacto.email': 'Email',
    'contacto.phone': 'Teléfono',
    'contacto.address': 'Dirección',
    'contacto.hours': 'Horario de Atención',
    'contacto.hours_value': 'Lunes a Viernes: 9:00 - 18:00',
    
    // Footer
    'footer.rights': 'Todos los derechos reservados',
    'footer.privacy': 'Política de Privacidad',
    'footer.terms': 'Términos de Servicio',
    
    // Final CTA Section
    'cta.title': '¿Listo para transformar tu gestión inmobiliaria?',
    'cta.subtitle': 'Únete a las inmobiliarias que ya confían en Granada para simplificar su operación diaria.',
    'cta.card1_title': 'Inmobiliarias y Administradores',
    'cta.card1_desc': 'Descubre cómo Granada puede optimizar tu gestión de propiedades.',
    'cta.card1_button': 'Ver Soluciones',
    'cta.card2_title': 'Propietarios',
    'cta.card2_desc': 'Mantén el control de tus inversiones con reportes automáticos.',
    'cta.card2_button': 'Conocer Más',
    'cta.card3_title': '¿Tienes Dudas?',
    'cta.card3_desc': 'Nuestro equipo está listo para ayudarte.',
    'cta.card3_button': 'Contactar',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.inmobiliarias': 'Real Estate & Admin',
    'nav.propietarios': 'Property Owners',
    'nav.planes': 'Plans',
    'nav.proveedores': 'Providers',
    'nav.contacto': 'Contact',
    'nav.access_pms': 'PMS Access',
    
    // Home page
    'home.badge': 'Property Management System',
    'home.title': 'The simple way to manage complex properties',
    'home.subtitle': 'Comprehensive rental management platform that connects real estate agencies, property owners, and tenants in one place.',
    'home.benefit1': 'Full control of contracts and payments',
    'home.benefit2': 'Guaranteed security and transparency',
    'home.benefit3': 'Automatic monthly reports',
    'home.cta_inmobiliaria': 'Real Estate / Admin',
    'home.cta_propietario': 'Property Owner',
    
    // Inmobiliarias page
    'inmobiliarias.badge': 'For Real Estate Agencies and Administrators',
    'inmobiliarias.title': 'Professional Property Management',
    'inmobiliarias.subtitle': 'Advanced tools to manage rental portfolios with efficiency and professionalism.',
    'inmobiliarias.features_title': 'Key Features',
    'inmobiliarias.feature1_title': 'Comprehensive Dashboard',
    'inmobiliarias.feature1_desc': 'View all your properties, contracts, and payments in a single dashboard.',
    'inmobiliarias.feature2_title': 'Contract Management',
    'inmobiliarias.feature2_desc': 'Create, renew, and manage contracts with automatic index adjustments.',
    'inmobiliarias.feature3_title': 'Automated Collections',
    'inmobiliarias.feature3_desc': 'Payment reminders, debt tracking, and delinquency reports.',
    'inmobiliarias.feature4_title': 'Custom Reports',
    'inmobiliarias.feature4_desc': 'Generate reports for owners with detailed income and expenses.',
    'inmobiliarias.feature5_title': 'Multi-user',
    'inmobiliarias.feature5_desc': 'Manage your team with different access levels and permissions.',
    'inmobiliarias.feature6_title': 'Integrations',
    'inmobiliarias.feature6_desc': 'Connect with billing systems and banks to automate processes.',
    'inmobiliarias.cta': 'Request Demo',
    'inmobiliarias.benefits_title': 'Benefits for Your Agency',
    'inmobiliarias.benefit1': 'Reduce administrative time by up to 70%',
    'inmobiliarias.benefit2': 'Eliminate adjustment calculation errors',
    'inmobiliarias.benefit3': 'Improve communication with owners',
    'inmobiliarias.benefit4': 'Access from any device',
    
    // Propietarios page
    'propietarios.badge': 'For Property Owners',
    'propietarios.title': 'Your Property, Your Control',
    'propietarios.subtitle': 'Stay in control of your real estate investments with real-time information and automatic reports.',
    'propietarios.options_title': 'How do you prefer to manage?',
    'propietarios.self_title': 'Self-Management',
    'propietarios.self_subtitle': 'Manage directly',
    'propietarios.self_desc': 'Ideal if you have few properties and want total control over management.',
    'propietarios.self_feature1': 'Direct tenant management',
    'propietarios.self_feature2': 'Full control of collections',
    'propietarios.self_feature3': 'No administration fees',
    'propietarios.self_feature4': 'Technical support included',
    'propietarios.delegate_title': 'Delegation',
    'propietarios.delegate_subtitle': 'Delegate to a real estate agency',
    'propietarios.delegate_desc': 'Perfect if you prefer professionals to handle daily management.',
    'propietarios.delegate_feature1': 'Complete professional management',
    'propietarios.delegate_feature2': 'Automatic monthly reports',
    'propietarios.delegate_feature3': 'Expense approval from the portal',
    'propietarios.delegate_feature4': 'Total transparency',
    'propietarios.portal_title': 'Portal Benefits',
    'propietarios.portal_benefit1_title': 'Automatic Reports',
    'propietarios.portal_benefit1_desc': 'Receive detailed monthly reports of your properties.',
    'propietarios.portal_benefit2_title': 'Payment History',
    'propietarios.portal_benefit2_desc': 'Access the complete history of payments and income.',
    'propietarios.portal_benefit3_title': 'Expense Approval',
    'propietarios.portal_benefit3_desc': 'Approve or reject expenses from any device.',
    'propietarios.portal_benefit4_title': 'Documentation',
    'propietarios.portal_benefit4_desc': 'All your property documents in one place.',
    'propietarios.portal_benefit5_title': 'Real-Time Updates',
    'propietarios.portal_benefit5_desc': 'Instant notifications about important events.',
    'propietarios.portal_benefit6_title': 'Security',
    'propietarios.portal_benefit6_desc': 'Your data protected with bank-level encryption.',
    'propietarios.portal_benefit7_title': 'Continuous Management',
    'propietarios.portal_benefit7_desc': 'Your property managed 24/7, 365 days a year.',
    
    // Planes page
    'planes.badge': 'Plans & Pricing',
    'planes.title': 'Choose the perfect plan for your business',
    'planes.subtitle': 'Flexible plans that adapt to your portfolio size. No hidden costs, no long-term commitments.',
    'planes.billing_label': 'Payment Subscription',
    'planes.monthly': 'Monthly',
    'planes.yearly': 'Yearly',
    'planes.off': 'OFF',
    'planes.equivalent': 'Equivalent to',
    'planes.per_month': '/month',
    'planes.per_year': '/year',
    'planes.start': 'Get Started',
    'planes.contact': 'Contact',
    'planes.popular': 'Most Popular',
    'planes.faq_title': 'Frequently Asked Questions',
    'planes.cta_title': 'Ready to get started?',
    'planes.cta_subtitle': 'Schedule a personalized demo or start your free trial today.',
    'planes.cta_demo': 'Schedule Demo',
    'planes.cta_trial': 'Free Trial',
    
    // Proveedores page
    'proveedores.badge': 'Provider Network',
    'proveedores.title': 'We Connect Real Estate Agencies with the Best Providers',
    'proveedores.subtitle': 'Join our network of verified providers and access new business opportunities.',
    'proveedores.categories_title': 'Service Categories',
    'proveedores.benefits_title': 'Benefits',
    'proveedores.for_agencies': 'For Real Estate Agencies',
    'proveedores.for_providers': 'For Providers',
    'proveedores.how_title': 'How Does It Work?',
    'proveedores.cta_register': 'Register as Provider',
    'proveedores.cta_directory': 'View Directory',
    
    // Contacto page
    'contacto.badge': 'Contact',
    'contacto.title': "Let's talk about your project",
    'contacto.subtitle': "We're here to help. Fill out the form and we'll get in touch with you.",
    'contacto.info_title': 'Contact Information',
    'contacto.email': 'Email',
    'contacto.phone': 'Phone',
    'contacto.address': 'Address',
    'contacto.hours': 'Business Hours',
    'contacto.hours_value': 'Monday to Friday: 9:00 AM - 6:00 PM',
    
    // Footer
    'footer.rights': 'All rights reserved',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    
    // Final CTA Section
    'cta.title': 'Ready to transform your property management?',
    'cta.subtitle': 'Join the real estate agencies that already trust Granada to simplify their daily operations.',
    'cta.card1_title': 'Real Estate Agencies & Administrators',
    'cta.card1_desc': 'Discover how Granada can optimize your property management.',
    'cta.card1_button': 'View Solutions',
    'cta.card2_title': 'Property Owners',
    'cta.card2_desc': 'Stay in control of your investments with automatic reports.',
    'cta.card2_button': 'Learn More',
    'cta.card3_title': 'Have Questions?',
    'cta.card3_desc': 'Our team is ready to help you.',
    'cta.card3_button': 'Contact Us',
  },
  pt: {
    // Navigation
    'nav.home': 'Início',
    'nav.inmobiliarias': 'Imobiliárias e Admin',
    'nav.propietarios': 'Proprietários',
    'nav.planes': 'Planos',
    'nav.proveedores': 'Fornecedores',
    'nav.contacto': 'Contato',
    'nav.access_pms': 'Acesso PMS',
    
    // Home page
    'home.badge': 'Property Management System',
    'home.title': 'A forma simples de administrar propriedades complexas',
    'home.subtitle': 'Plataforma integral para a gestão de aluguéis que conecta imobiliárias, proprietários e inquilinos em um só lugar.',
    'home.benefit1': 'Controle total de contratos e pagamentos',
    'home.benefit2': 'Segurança e transparência garantidas',
    'home.benefit3': 'Relatórios automáticos mensais',
    'home.cta_inmobiliaria': 'Imobiliária / Admin',
    'home.cta_propietario': 'Proprietário',
    
    // Inmobiliarias page
    'inmobiliarias.badge': 'Para Imobiliárias e Administradores',
    'inmobiliarias.title': 'Gestão Profissional de Propriedades',
    'inmobiliarias.subtitle': 'Ferramentas avançadas para administrar carteiras de aluguéis com eficiência e profissionalismo.',
    'inmobiliarias.features_title': 'Características Principais',
    'inmobiliarias.feature1_title': 'Painel de Controle Integral',
    'inmobiliarias.feature1_desc': 'Visualize todas as suas propriedades, contratos e pagamentos em um único dashboard.',
    'inmobiliarias.feature2_title': 'Gestão de Contratos',
    'inmobiliarias.feature2_desc': 'Crie, renove e administre contratos com ajustes automáticos por índices.',
    'inmobiliarias.feature3_title': 'Cobranças Automatizadas',
    'inmobiliarias.feature3_desc': 'Lembretes de pagamento, acompanhamento de dívidas e relatórios de inadimplência.',
    'inmobiliarias.feature4_title': 'Relatórios Personalizados',
    'inmobiliarias.feature4_desc': 'Gere relatórios para proprietários com detalhes de receitas e despesas.',
    'inmobiliarias.feature5_title': 'Multi-usuário',
    'inmobiliarias.feature5_desc': 'Gerencie sua equipe com diferentes níveis de acesso e permissões.',
    'inmobiliarias.feature6_title': 'Integrações',
    'inmobiliarias.feature6_desc': 'Conecte com sistemas de faturamento e bancos para automatizar processos.',
    'inmobiliarias.cta': 'Solicitar Demo',
    'inmobiliarias.benefits_title': 'Benefícios para sua Imobiliária',
    'inmobiliarias.benefit1': 'Reduza até 70% o tempo administrativo',
    'inmobiliarias.benefit2': 'Elimine erros nos cálculos de ajustes',
    'inmobiliarias.benefit3': 'Melhore a comunicação com proprietários',
    'inmobiliarias.benefit4': 'Acesso de qualquer dispositivo',
    
    // Propietarios page
    'propietarios.badge': 'Para Proprietários',
    'propietarios.title': 'Sua Propriedade, Seu Controle',
    'propietarios.subtitle': 'Mantenha o controle de seus investimentos imobiliários com informações em tempo real e relatórios automáticos.',
    'propietarios.options_title': 'Como prefere administrar?',
    'propietarios.self_title': 'Autogestão',
    'propietarios.self_subtitle': 'Administre diretamente',
    'propietarios.self_desc': 'Ideal se você tem poucas propriedades e quer controle total sobre a gestão.',
    'propietarios.self_feature1': 'Gestão direta de inquilinos',
    'propietarios.self_feature2': 'Controle total de cobranças',
    'propietarios.self_feature3': 'Sem comissões de administração',
    'propietarios.self_feature4': 'Suporte técnico incluído',
    'propietarios.delegate_title': 'Delegação',
    'propietarios.delegate_subtitle': 'Delegue a uma imobiliária',
    'propietarios.delegate_desc': 'Perfeito se você prefere que profissionais cuidem da gestão diária.',
    'propietarios.delegate_feature1': 'Gestão profissional completa',
    'propietarios.delegate_feature2': 'Relatórios automáticos mensais',
    'propietarios.delegate_feature3': 'Aprovação de despesas pelo portal',
    'propietarios.delegate_feature4': 'Transparência total',
    'propietarios.portal_title': 'Benefícios do Portal',
    'propietarios.portal_benefit1_title': 'Relatórios Automáticos',
    'propietarios.portal_benefit1_desc': 'Receba relatórios mensais detalhados de suas propriedades.',
    'propietarios.portal_benefit2_title': 'Histórico de Pagamentos',
    'propietarios.portal_benefit2_desc': 'Acesse o histórico completo de pagamentos e receitas.',
    'propietarios.portal_benefit3_title': 'Aprovação de Despesas',
    'propietarios.portal_benefit3_desc': 'Aprove ou rejeite despesas de qualquer dispositivo.',
    'propietarios.portal_benefit4_title': 'Documentação',
    'propietarios.portal_benefit4_desc': 'Todos os documentos de suas propriedades em um só lugar.',
    'propietarios.portal_benefit5_title': 'Atualizações em Tempo Real',
    'propietarios.portal_benefit5_desc': 'Notificações instantâneas sobre eventos importantes.',
    'propietarios.portal_benefit6_title': 'Segurança',
    'propietarios.portal_benefit6_desc': 'Seus dados protegidos com criptografia de nível bancário.',
    'propietarios.portal_benefit7_title': 'Gestão Contínua',
    'propietarios.portal_benefit7_desc': 'Sua propriedade administrada 24/7, 365 dias por ano.',
    
    // Planes page
    'planes.badge': 'Planos e Preços',
    'planes.title': 'Escolha o plano perfeito para seu negócio',
    'planes.subtitle': 'Planos flexíveis que se adaptam ao tamanho da sua carteira. Sem custos ocultos, sem compromissos de longo prazo.',
    'planes.billing_label': 'Assinatura com Pagamento',
    'planes.monthly': 'Mensal',
    'planes.yearly': 'Anual',
    'planes.off': 'OFF',
    'planes.equivalent': 'Equivalente a',
    'planes.per_month': '/mês',
    'planes.per_year': '/ano',
    'planes.start': 'Começar',
    'planes.contact': 'Contatar',
    'planes.popular': 'Mais Popular',
    'planes.faq_title': 'Perguntas Frequentes',
    'planes.cta_title': 'Pronto para começar?',
    'planes.cta_subtitle': 'Agende uma demo personalizada ou comece sua avaliação gratuita hoje.',
    'planes.cta_demo': 'Agendar Demo',
    'planes.cta_trial': 'Avaliação Gratuita',
    
    // Proveedores page
    'proveedores.badge': 'Rede de Fornecedores',
    'proveedores.title': 'Conectamos Imobiliárias com os Melhores Fornecedores',
    'proveedores.subtitle': 'Faça parte da nossa rede de fornecedores verificados e acesse novas oportunidades de negócio.',
    'proveedores.categories_title': 'Categorias de Serviços',
    'proveedores.benefits_title': 'Benefícios',
    'proveedores.for_agencies': 'Para Imobiliárias',
    'proveedores.for_providers': 'Para Fornecedores',
    'proveedores.how_title': 'Como Funciona?',
    'proveedores.cta_register': 'Registrar-se como Fornecedor',
    'proveedores.cta_directory': 'Ver Diretório',
    
    // Contacto page
    'contacto.badge': 'Contato',
    'contacto.title': 'Vamos falar sobre seu projeto',
    'contacto.subtitle': 'Estamos aqui para ajudar. Preencha o formulário e entraremos em contato.',
    'contacto.info_title': 'Informações de Contato',
    'contacto.email': 'Email',
    'contacto.phone': 'Telefone',
    'contacto.address': 'Endereço',
    'contacto.hours': 'Horário de Atendimento',
    'contacto.hours_value': 'Segunda a Sexta: 9:00 - 18:00',
    
    // Footer
    'footer.rights': 'Todos os direitos reservados',
    'footer.privacy': 'Política de Privacidade',
    'footer.terms': 'Termos de Serviço',
    
    // Final CTA Section
    'cta.title': 'Pronto para transformar sua gestão imobiliária?',
    'cta.subtitle': 'Junte-se às imobiliárias que já confiam no Granada para simplificar suas operações diárias.',
    'cta.card1_title': 'Imobiliárias e Administradores',
    'cta.card1_desc': 'Descubra como o Granada pode otimizar sua gestão de propriedades.',
    'cta.card1_button': 'Ver Soluções',
    'cta.card2_title': 'Proprietários',
    'cta.card2_desc': 'Mantenha o controle de seus investimentos com relatórios automáticos.',
    'cta.card2_button': 'Saiba Mais',
    'cta.card3_title': 'Tem Dúvidas?',
    'cta.card3_desc': 'Nossa equipe está pronta para ajudá-lo.',
    'cta.card3_button': 'Contatar',
  }
};

const GranadaLanguageContext = createContext<GranadaLanguageContextType | undefined>(undefined);

export function GranadaLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<GranadaLanguage>(() => {
    const saved = localStorage.getItem('granada-language');
    return (saved as GranadaLanguage) || 'es';
  });

  useEffect(() => {
    localStorage.setItem('granada-language', language);
  }, [language]);

  const setLanguage = (lang: GranadaLanguage) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <GranadaLanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </GranadaLanguageContext.Provider>
  );
}

export function useGranadaLanguage() {
  const context = useContext(GranadaLanguageContext);
  if (context === undefined) {
    throw new Error('useGranadaLanguage must be used within a GranadaLanguageProvider');
  }
  return context;
}
