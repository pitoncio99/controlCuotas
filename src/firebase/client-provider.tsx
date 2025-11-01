'use client';

import { useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from '.';

// This provider is intended to be used in the root layout of your application.
// It will ensure that Firebase is initialized only once and that the same
// instance is used across your application.
export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { app, auth, firestore } = useMemo(() => initializeFirebase(), []);

  if (!app) return <>{children}</>;

  return (
    <FirebaseProvider app={app} auth={auth} firestore={firestore}>
      {children}
    </FirebaseProvider>
  );
}
