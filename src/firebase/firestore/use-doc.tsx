'use client';

import {
  onSnapshot,
  type DocumentReference,
  type DocumentData,
} from 'firebase/firestore';
import { useEffect, useState, useRef } from 'react';

type DocumentWithId<T> = T & { id: string };

export function useDoc<T extends DocumentData>(
  docRef: DocumentReference<T> | null
) {
  const [data, setData] = useState<DocumentWithId<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const docRefRef = useRef(docRef);
  useEffect(() => {
    docRefRef.current = docRef;
  }, [docRef]);

  useEffect(() => {
    if (!docRefRef.current) {
      setData(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      docRefRef.current,
      (doc) => {
        if (doc.exists()) {
          setData({ ...doc.data(), id: doc.id } as DocumentWithId<T>);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching document:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRefRef.current]);

  return { data, loading, error };
}
