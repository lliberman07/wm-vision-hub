import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";

const TermsOfService = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {t('terms.title')}
          </h1>
          
          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {t('terms.acceptance.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('terms.acceptance.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {t('terms.services.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('terms.services.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {t('terms.simulator.title')}
              </h2>
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <p className="font-medium mb-4 text-blue-900">{t('terms.simulator.disclaimer.title')}</p>
                <p className="mb-4 text-gray-700 leading-relaxed">{t('terms.simulator.disclaimer.content1')}</p>
                <p className="mb-4 text-gray-700 leading-relaxed">{t('terms.simulator.disclaimer.content2')}</p>
                <p className="mb-4 text-gray-700 leading-relaxed">{t('terms.simulator.disclaimer.content3')}</p>
                <p className="text-gray-700 leading-relaxed">{t('terms.simulator.disclaimer.content4')}</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {t('terms.userResponsibilities.title')}
              </h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>{t('terms.userResponsibilities.item1')}</li>
                <li>{t('terms.userResponsibilities.item2')}</li>
                <li>{t('terms.userResponsibilities.item3')}</li>
                <li>{t('terms.userResponsibilities.item4')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {t('terms.limitations.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('terms.limitations.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {t('terms.intellectualProperty.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('terms.intellectualProperty.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {t('terms.privacy.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('terms.privacy.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {t('terms.modifications.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('terms.modifications.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {t('terms.contact.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                {t('terms.contact.content')}
              </p>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="font-semibold text-gray-800">WM Management S.A.</p>
                <p className="text-gray-600">Email: info@wmmanagement.com</p>
                <p className="text-gray-600">Teléfono: +1 234 567 8900</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                {t('terms.lastUpdated.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('terms.lastUpdated.content')}
              </p>
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TermsOfService;