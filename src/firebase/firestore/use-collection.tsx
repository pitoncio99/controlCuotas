'use client';

import {
  onSnapshot,
  type CollectionReference,
  type DocumentData,
  type Query,
} from 'firebase/firestore';
import { useEffect, useState, useRef } from 'react';

type DocumentWithId<T> = T & { id: string };

function isQuery(
  query: CollectionReference | Query | null
): query is Query {
  return (query as Query)?.type === 'query';
}

function isCollectionReference(
  query: CollectionReference | Query | null
): query is CollectionReference {
  return (query as CollectionReference)?.type === 'collection';
}

export function useCollection<T extends DocumentData>(
  query: CollectionReference<T> | Query<T> | null
) {
  const [data, setData] = useState<DocumentWithId<T>[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // We use a ref to store the query to prevent re-running the effect
  // whenever the query object is re-created.
  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    if (!queryRef.current) {
      setData(null);
      setLoading(false);
      return;
    }

    if (!isQuery(queryRef.current) && !isCollectionReference(queryRef.current)) {
      setLoading(false);
      setError(new Error('Invalid query type.'));
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      queryRef.current,
      (snapshot) => {
        const docs = snapshot.docs.map(
          (doc) => ({ ...doc.data(), id: doc.id }) as DocumentWithId<T>
        );
        setData(docs);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching collection:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [queryRef.current]);

  return { data, loading, error };
}
