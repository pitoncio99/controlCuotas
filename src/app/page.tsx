'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

export default function RootPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        // This case should be handled by the anonymous sign-in in the provider
        // but as a fallback, we can redirect to a loading/error or stay here.
        // For now, we assume anonymous sign-in will work.
      }
    }
  }, [user, isUserLoading, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      Cargando...
    </div>
  );
}
