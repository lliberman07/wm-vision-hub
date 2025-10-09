import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { PMSSidebar } from './PMSSidebar';
import { PMSBreadcrumbs } from './PMSBreadcrumbs';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface PMSLayoutProps {
  children: ReactNode;
}

export function PMSLayout({ children }: PMSLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <SidebarProvider defaultOpen>
        <div className="flex flex-1 w-full">
          <PMSSidebar />
          
          <main className="flex-1 flex flex-col">
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b">
              <div className="container mx-auto px-4 py-3 flex items-center gap-4">
                <SidebarTrigger />
                <PMSBreadcrumbs />
              </div>
            </div>
            
            <div className="flex-1">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>

      <Footer />
    </div>
  );
}
