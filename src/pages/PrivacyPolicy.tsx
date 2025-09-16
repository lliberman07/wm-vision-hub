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
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {t('privacy.title')}
          </h1>
          
          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {t('privacy.section1.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('privacy.section1.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {t('privacy.section2.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                {t('privacy.section2.content')}
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>{t('privacy.section2.point1')}</li>
                <li>{t('privacy.section2.point2')}</li>
                <li>{t('privacy.section2.point3')}</li>
                <li>{t('privacy.section2.point4')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {t('privacy.section3.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                {t('privacy.section3.content')}
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>{t('privacy.section3.point1')}</li>
                <li>{t('privacy.section3.point2')}</li>
                <li>{t('privacy.section3.point3')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {t('privacy.section4.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('privacy.section4.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {t('privacy.section5.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                {t('privacy.section5.content')}
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>{t('privacy.section5.point1')}</li>
                <li>{t('privacy.section5.point2')}</li>
                <li>{t('privacy.section5.point3')}</li>
                <li>{t('privacy.section5.point4')}</li>
                <li>{t('privacy.section5.point5')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {t('privacy.section6.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('privacy.section6.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {t('privacy.section7.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('privacy.section7.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {t('privacy.section8.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('privacy.section8.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {t('privacy.section9.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('privacy.section9.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {t('privacy.section10.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('privacy.section10.content')}
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