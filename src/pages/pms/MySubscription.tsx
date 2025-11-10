import { useState } from 'react';
import TenantSubscriptionPanel from '@/components/subscription/TenantSubscriptionPanel';
import { PMSLayout } from '@/components/pms/PMSLayout';
import { PMSPageWrapper } from '@/components/pms/PMSPageWrapper';

export default function MySubscription() {
  return (
    <PMSPageWrapper>
      <PMSLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Mi Suscripción</h1>
            <p className="text-muted-foreground">Gestiona tu plan y facturación</p>
          </div>
          
          <TenantSubscriptionPanel />
        </div>
      </PMSLayout>
    </PMSPageWrapper>
  );
}
