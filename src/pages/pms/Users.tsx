import { PMSLayout } from '@/components/pms/PMSLayout';
import { PropietarioUsersManagement } from '@/components/pms/PropietarioUsersManagement';

const Users = () => {
  return (
    <PMSLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <PropietarioUsersManagement />
      </div>
    </PMSLayout>
  );
};

export default Users;
