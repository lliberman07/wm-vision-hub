import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePMS } from '@/contexts/PMSContext';

const MAINTENANCE_KEY = 'pms_last_maintenance_check';
const MAINTENANCE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

export function useContractMaintenanceCheck() {
  const { currentTenant } = usePMS();

  useEffect(() => {
    const runMaintenance = async () => {
      if (!currentTenant) return;

      const lastCheck = localStorage.getItem(MAINTENANCE_KEY);
      const now = Date.now();

      // Skip if checked within last 24 hours
      if (lastCheck && now - parseInt(lastCheck) < MAINTENANCE_INTERVAL) {
        return;
      }

      try {
        console.log('Running contract maintenance tasks...');
        
        // Check expired contracts
        await supabase.rpc('check_expired_contracts');
        
        // Update overdue payment items
        await supabase.rpc('update_overdue_payment_items');
        
        // Store last check timestamp
        localStorage.setItem(MAINTENANCE_KEY, now.toString());
        
        console.log('Contract maintenance completed successfully');
      } catch (error) {
        console.error('Error running contract maintenance:', error);
      }
    };

    runMaintenance();
  }, [currentTenant]);
}
