'use client';
import React, { useEffect, useState } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppHeader } from './components/header';
import { AppNav } from './components/nav';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { FilterProvider } from './components/filter-context';
import type { Person } from '@/app/lib/definitions';
import { collection } from 'firebase/firestore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const peopleCollection = useMemoFirebase(() => 
    firestore && user ? collection(firestore, `users/${user.uid}/people`) : null
  , [firestore, user]);
  const { data: people, isLoading: peopleLoading } = useCollection<Person>(peopleCollection);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user || peopleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Cargando...</div>
      </div>
    );
  }

  return (
    <FilterProvider people={people || []}>
      <SidebarProvider>
        <Sidebar>
          <AppNav />
        </Sidebar>
        <SidebarInset>
          <div className="flex flex-col min-h-svh">
            <AppHeader />
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </FilterProvider>
  );
}
