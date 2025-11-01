'use client';

import React, { useEffect } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);
  
  if (isUserLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        Cargando...
      </div>
    );
  }

  return <>{children}</>;
}
