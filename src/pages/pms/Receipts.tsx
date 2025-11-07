import { PMSLayout } from '@/components/pms/PMSLayout';
import { ReceiptsManagement } from '@/components/pms/ReceiptsManagement';

const Receipts = () => {
  return (
    <PMSLayout>
      <div className="container mx-auto px-4 py-8">
        <ReceiptsManagement />
      </div>
    </PMSLayout>
  );
};

export default Receipts;
