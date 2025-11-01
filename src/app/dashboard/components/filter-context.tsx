'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Person } from '@/app/lib/definitions';

interface FilterContextType {
  people: Person[];
  filterPersonId: string;
  setFilterPersonId: (id: string) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children, people }: { children: ReactNode; people: Person[] }) {
  const [filterPersonId, setFilterPersonId] = useState('');

  return (
    <FilterContext.Provider value={{ people, filterPersonId, setFilterPersonId }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}
