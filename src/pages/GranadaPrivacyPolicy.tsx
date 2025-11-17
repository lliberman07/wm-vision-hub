import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GranadaHeader } from "@/components/granada/GranadaHeader";
import { GranadaFooter } from "@/components/granada/GranadaFooter";
import { EnhancedChatbot } from "@/components/EnhancedChatbot";

export default function GranadaPrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GranadaHeader />
      <main className="flex-1 container max-w-4xl mx-auto py-12 px-4">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/granada-platform">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Home
          </Link>
        </Button>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-8">Política de Privacidad y Protección de Datos Personales</h1>
          <h2 className="text-2xl font-semibold mb-6">eSQALAR S.A.</h2>

          <p className="mb-6">
            En cumplimiento de la Ley N° 25.326 de Protección de los Datos Personales y su Decreto Reglamentario N° 1558/2001, 
            eSQALAR S.A. informa a los usuarios del sitio web y de las aplicaciones asociadas que todos los datos personales y 
            empresariales recolectados serán tratados conforme a los principios de licitud, buena fe, transparencia, seguridad 
            y confidencialidad.
          </p>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">1. Identificación del responsable del tratamiento</h3>
            <p>
              El responsable de la base de datos es eSQALAR S.A., con domicilio en Ciudad de Buenos Aires, 
              correo electrónico de contacto: privacidad@wmglobal.co.
            </p>
            <p>
              El tratamiento de la información se realiza en cumplimiento de la normativa argentina vigente y de acuerdo con 
              las políticas internas de seguridad y confidencialidad.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">2. Finalidad del tratamiento</h3>
            <p>Los datos personales y/o corporativos proporcionados por los usuarios serán utilizados con las siguientes finalidades:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Gestionar el registro y autenticación de usuarios en la plataforma.</li>
              <li>Administrar las relaciones contractuales, comerciales y/o profesionales con usuarios y proveedores.</li>
              <li>Enviar notificaciones vinculadas a los servicios ofrecidos o actualizaciones de la plataforma.</li>
              <li>Cumplir con obligaciones legales o requerimientos de autoridad competente.</li>
            </ul>
            <p className="mt-4">
              Los datos no serán utilizados para finalidades diferentes o incompatibles sin consentimiento previo y expreso del titular.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">3. Consentimiento</h3>
            <p>
              El ingreso voluntario de datos personales en los formularios de registro o contacto implica el consentimiento libre, 
              expreso e informado del usuario para el tratamiento de dichos datos conforme a esta política.
            </p>
            <p className="mt-4">
              En el proceso de registro, el usuario deberá marcar expresamente una casilla (checkbox) indicando su aceptación de 
              esta Política de Privacidad y de los Términos y Condiciones del servicio.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">4. Cesión y transferencia internacional de datos</h3>
            <p>
              eSQALAR S.A. no cederá ni transferirá datos personales a terceros sin consentimiento, salvo que exista obligación 
              legal o sea estrictamente necesario para la prestación de los servicios (por ejemplo, proveedores de hosting, 
              correo electrónico o soporte técnico).
            </p>
            <p className="mt-4">
              En los casos en que los datos se almacenen o procesen en servidores ubicados fuera del territorio argentino, 
              eSQALAR S.A. garantizará niveles adecuados de protección conforme a la Ley N° 25.326 y a las normas 
              internacionales aplicables.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">5. Seguridad y confidencialidad</h3>
            <p>
              eSQALAR S.A. adopta las medidas técnicas y organizativas necesarias para garantizar la seguridad y confidencialidad 
              de los datos personales, evitando su alteración, pérdida o acceso no autorizado.
            </p>
            <p className="mt-4">
              No obstante, el usuario reconoce que ningún sistema informático resulta completamente invulnerable, y exonera a 
              eSQALAR S.A. de responsabilidad por eventuales daños derivados de fallas técnicas, ataques informáticos o 
              accesos indebidos por parte de terceros.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">6. Responsabilidad sobre la información aportada</h3>
            <p>
              Los usuarios son únicos responsables de la veracidad, exactitud y actualización de los datos que suministren.
            </p>
            <p className="mt-4">
              eSQALAR S.A. no será responsable por errores, omisiones o falsedades en la información registrada por los usuarios, 
              ni por el uso indebido que terceros realicen de sus credenciales de acceso.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">7. Derechos de los titulares (Acceso, Rectificación, Actualización y Supresión)</h3>
            <p>Conforme a los artículos 14 y 16 de la Ley 25.326, el titular de los datos tiene derecho a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Acceder a sus datos personales en forma gratuita.</li>
              <li>Solicitar su rectificación, actualización o supresión.</li>
              <li>Revocar el consentimiento otorgado para su tratamiento.</li>
            </ul>
            <p className="mt-4">
              Estas solicitudes podrán realizarse mediante correo electrónico a privacidad@wmglobal.co, acreditando identidad.
            </p>
            <p className="mt-4">
              La Agencia de Acceso a la Información Pública (AAIP), en su carácter de órgano de control de la Ley N° 25.326, 
              tiene la facultad de atender denuncias o reclamos. Web oficial: www.argentina.gob.ar/aaip
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">8. Política de cookies y analítica</h3>
            <p>
              El sitio web puede utilizar cookies y herramientas de analítica (como Google Analytics o servicios equivalentes) 
              para mejorar la experiencia del usuario y optimizar la prestación del servicio.
            </p>
            <p className="mt-4">
              El usuario puede configurar su navegador para bloquear o eliminar las cookies, aunque ello podría afectar el 
              correcto funcionamiento de ciertas funciones del sitio.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">9. Enlaces a sitios de terceros</h3>
            <p>
              El sitio puede contener enlaces a otros sitios o servicios externos. eSQALAR S.A. no se responsabiliza por las 
              políticas de privacidad ni por el tratamiento de datos que realicen dichos terceros.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">10. Actualización de esta política</h3>
            <p>
              eSQALAR S.A. podrá modificar esta Política de Privacidad cuando lo considere necesario. Las modificaciones serán 
              publicadas en esta página y entrarán en vigencia a partir de su publicación.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">11. Aceptación</h3>
            <p>
              El uso del sitio implica la aceptación plena de la presente Política de Privacidad y Protección de Datos Personales.
            </p>
            <p className="mt-4">
              eSQALAR S.A. actúa como responsable del tratamiento únicamente respecto de los datos recopilados en su sitio web 
              y aplicaciones propias, y no se hace responsable por el uso o divulgación de información realizada por terceros 
              usuarios o entidades externas que operen de manera independiente.
            </p>
          </section>

          <section className="mb-8 p-6 bg-muted rounded-lg border border-border">
            <h3 className="text-xl font-semibold mb-4">⚖️ Aviso legal</h3>
            <p className="italic">
              "El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita, 
              con intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo conforme lo establecido en el 
              artículo 14, inciso 3 de la Ley Nº 25.326."
            </p>
          </section>
        </div>
      </main>
      <GranadaFooter />
      <EnhancedChatbot />
    </div>
  );
}
