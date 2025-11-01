'use client';
import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFilter } from './filter-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export function AppHeader() {
  const auth = useAuth();
  const router = useRouter();
  const { people, filterPersonId, setFilterPersonId } = useFilter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };
  
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-card px-4 sm:h-16 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex flex-1 items-center gap-4">
        <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <Select onValueChange={(value) => setFilterPersonId(value === 'all' ? '' : value)} value={filterPersonId || 'all'}>
              <SelectTrigger className="w-auto h-8 text-sm border-dashed bg-transparent">
                <SelectValue placeholder="Filtrar por persona..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las personas</SelectItem>
                {(people || []).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
            <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
