import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const TermsOfService = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">
          {t('terms.title')}
        </h1>
        
        <div className="prose prose-lg max-w-none text-foreground/80 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.acceptance.title')}
            </h2>
            <p>{t('terms.acceptance.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.services.title')}
            </h2>
            <p>{t('terms.services.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.simulator.title')}
            </h2>
            <div className="bg-muted/50 p-6 rounded-lg border">
              <p className="font-medium mb-4">{t('terms.simulator.disclaimer.title')}</p>
              <p className="mb-4">{t('terms.simulator.disclaimer.content1')}</p>
              <p className="mb-4">{t('terms.simulator.disclaimer.content2')}</p>
              <p className="mb-4">{t('terms.simulator.disclaimer.content3')}</p>
              <p>{t('terms.simulator.disclaimer.content4')}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.userResponsibilities.title')}
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>{t('terms.userResponsibilities.item1')}</li>
              <li>{t('terms.userResponsibilities.item2')}</li>
              <li>{t('terms.userResponsibilities.item3')}</li>
              <li>{t('terms.userResponsibilities.item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.limitations.title')}
            </h2>
            <p>{t('terms.limitations.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.intellectualProperty.title')}
            </h2>
            <p>{t('terms.intellectualProperty.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.privacy.title')}
            </h2>
            <p>{t('terms.privacy.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.modifications.title')}
            </h2>
            <p>{t('terms.modifications.content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.contact.title')}
            </h2>
            <p>{t('terms.contact.content')}</p>
            <div className="mt-4 text-sm">
              <p><strong>WM Management S.A.</strong></p>
              <p>Email: info@wmmanagement.com</p>
              <p>Teléfono: +1 234 567 8900</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.lastUpdated.title')}
            </h2>
            <p>{t('terms.lastUpdated.content')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;