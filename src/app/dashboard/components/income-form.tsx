'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import type { MonthlyIncome } from '@/app/lib/definitions';
import { useFirestore, setDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { format } from 'date-fns';

const FormSchema = z.object({
  amount: z.coerce.number().positive({
    message: 'El ingreso debe ser un número positivo.',
  }),
});

interface IncomeFormProps {
  income?: MonthlyIncome;
  onSave: () => void;
}

export function IncomeForm({ income, onSave }: IncomeFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      amount: income?.amount || 0,
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!firestore || !user) return;

    const currentMonthStr = format(new Date(), 'yyyy-MM');
    
    // In this app, we assume one income document per month for simplicity.
    // The ID will be the month string itself.
    const incomeRef = doc(firestore, `users/${user.uid}/incomes`, currentMonthStr);

    const incomeData: MonthlyIncome = {
      id: currentMonthStr,
      month: currentMonthStr,
      amount: data.amount,
      date: new Date().toISOString(),
    };

    setDocumentNonBlocking(incomeRef, incomeData, { merge: true });
    
    toast({
      title: 'Ingreso Actualizado',
      description: `Tu ingreso para este mes se ha establecido en ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(data.amount)}.`,
    });
    
    onSave();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ingreso Mensual Total</FormLabel>
              <FormControl>
                <Input type="number" placeholder="ej., 1000000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Guardar Ingreso</Button>
      </form>
    </Form>
  );
}
