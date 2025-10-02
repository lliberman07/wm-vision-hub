import { useState } from 'react';
import { ComparisonItem, CreditResult } from '@/types/credit';

export const useCreditComparator = () => {
  const [items, setItems] = useState<ComparisonItem[]>([]);

  const add = (result: CreditResult) => {
    // Evitar duplicados
    if (items.some(item => item.id === result.id)) {
      return;
    }

    setItems(prev => [...prev, { ...result, addedAt: new Date() }]);
  };

  const remove = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clear = () => {
    setItems([]);
  };

  return {
    items,
    add,
    remove,
    clear
  };
};
