import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { OdooSidebar } from '@/components/OdooSidebar';

export default function OdooPMS() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <OdooSidebar />
        <main className="flex-1 bg-gradient-to-b from-background to-muted/20">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
