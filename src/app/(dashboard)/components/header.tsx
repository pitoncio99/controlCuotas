import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-card px-4 sm:h-16 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        {/* You can add a page title here if needed */}
      </div>
      <div className="flex items-center gap-4">
        {/* Placeholder for user menu or actions */}
      </div>
    </header>
  );
}
