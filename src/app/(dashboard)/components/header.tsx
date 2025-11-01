'use client';
import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { LogOut } from 'lucide-react';

export function AppHeader() {
  const auth = useAuth();
  
  const handleSignOut = () => {
    signOut(auth);
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-card px-4 sm:h-16 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        {/* You can add a page title here if needed */}
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Cerrar sesión">
            <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
