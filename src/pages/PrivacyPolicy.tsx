import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { EnhancedChatbot } from "@/components/EnhancedChatbot";
import { useLanguage } from "@/contexts/LanguageContext";

const PrivacyPolicy = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            Política de Privacidad y Protección de Datos Personales
          </h1>
          
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6 text-center">
            WM Management S.A.
          </h2>
          
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              En cumplimiento de la Ley N° 25.326 de Protección de los Datos Personales y su Decreto Reglamentario N° 1558/2001, WM Management informa a los usuarios del sitio web y de las aplicaciones asociadas que todos los datos personales y empresariales recolectados serán tratados conforme a los principios de licitud, buena fe, transparencia, seguridad y confidencialidad.
            </p>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                1. Identificación del responsable del tratamiento
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                El responsable de la base de datos es WM Management S.A., con domicilio en Ciudad de Buenos Aires, correo electrónico de contacto: privacidad@wmglobal.co.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                El tratamiento de la información se realiza en cumplimiento de la normativa argentina vigente y de acuerdo con las políticas internas de seguridad y confidencialidad.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                2. Finalidad del tratamiento
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Los datos personales y/o corporativos proporcionados por los usuarios serán utilizados con las siguientes finalidades:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Gestionar el registro y autenticación de usuarios en la plataforma.</li>
                <li>Administrar las relaciones contractuales, comerciales y/o profesionales con usuarios y proveedores.</li>
                <li>Enviar notificaciones vinculadas a los servicios ofrecidos o actualizaciones de la plataforma.</li>
                <li>Cumplir con obligaciones legales o requerimientos de autoridad competente.</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
                Los datos no serán utilizados para finalidades diferentes o incompatibles sin consentimiento previo y expreso del titular.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                3. Consentimiento
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                El ingreso voluntario de datos personales en los formularios de registro o contacto implica el consentimiento libre, expreso e informado del usuario para el tratamiento de dichos datos conforme a esta política.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                En el proceso de registro, el usuario deberá marcar expresamente una casilla (checkbox) indicando su aceptación de esta Política de Privacidad y de los Términos y Condiciones del servicio.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                4. Cesión y transferencia internacional de datos
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                WM Management S.A. no cederá ni transferirá datos personales a terceros sin consentimiento, salvo que exista obligación legal o sea estrictamente necesario para la prestación de los servicios (por ejemplo, proveedores de hosting, correo electrónico o soporte técnico).
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                En los casos en que los datos se almacenen o procesen en servidores ubicados fuera del territorio argentino, WM Management S.A. garantizará niveles adecuados de protección conforme a la Ley N° 25.326 y a las normas internacionales aplicables.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                5. Seguridad y confidencialidad
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                WM Management S.A. adopta las medidas técnicas y organizativas necesarias para garantizar la seguridad y confidencialidad de los datos personales, evitando su alteración, pérdida o acceso no autorizado.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                No obstante, el usuario reconoce que ningún sistema informático resulta completamente invulnerable, y exonera a WM Management S.A. de responsabilidad por eventuales daños derivados de fallas técnicas, ataques informáticos o accesos indebidos por parte de terceros.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                6. Responsabilidad sobre la información aportada
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                Los usuarios son únicos responsables de la veracidad, exactitud y actualización de los datos que suministren.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                WM Management S.A. no será responsable por errores, omisiones o falsedades en la información registrada por los usuarios, ni por el uso indebido que terceros realicen de sus credenciales de acceso.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                7. Derechos de los titulares (Acceso, Rectificación, Actualización y Supresión)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Conforme a los artículos 14 y 16 de la Ley 25.326, el titular de los datos tiene derecho a:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Acceder a sus datos personales en forma gratuita.</li>
                <li>Solicitar su rectificación, actualización o supresión.</li>
                <li>Revocar el consentimiento otorgado para su tratamiento.</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3 mb-2">
                Estas solicitudes podrán realizarse mediante correo electrónico a privacidad@wmglobal.co, acreditando identidad.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                La Agencia de Acceso a la Información Pública (AAIP), en su carácter de órgano de control de la Ley N° 25.326, tiene la facultad de atender denuncias o reclamos. Web oficial: www.argentina.gob.ar/aaip
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                8. Política de cookies y analítica
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                El sitio web puede utilizar cookies y herramientas de analítica (como Google Analytics o servicios equivalentes) para mejorar la experiencia del usuario y optimizar la prestación del servicio.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                El usuario puede configurar su navegador para bloquear o eliminar las cookies, aunque ello podría afectar el correcto funcionamiento de ciertas funciones del sitio.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                9. Enlaces a sitios de terceros
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                El sitio puede contener enlaces a otros sitios o servicios externos. WM Management S.A. no se responsabiliza por las políticas de privacidad ni por el tratamiento de datos que realicen dichos terceros.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                10. Actualización de esta política
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                WM Management S.A. podrá modificar esta Política de Privacidad cuando lo considere necesario. Las modificaciones serán publicadas en esta página y entrarán en vigencia a partir de su publicación.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                11. Aceptación
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                El uso del sitio implica la aceptación plena de la presente Política de Privacidad y Protección de Datos Personales.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                WM Management S.A. actúa como responsable del tratamiento únicamente respecto de los datos recopilados en su sitio web y aplicaciones propias, y no se hace responsable por el uso o divulgación de información realizada por terceros usuarios o entidades externas que operen de manera independiente.
              </p>
            </section>

            <section className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-4 mt-8">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                ⚖️ Aviso legal
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic">
                "El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita, con intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326."
              </p>
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
      <EnhancedChatbot />
    </div>
  );
};

export default PrivacyPolicy;