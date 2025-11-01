'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import type { Expense } from '@/app/lib/definitions';
import { useFirestore, setDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

const FormSchema = z.object({
  description: z.string().min(2, {
    message: 'La descripción debe tener al menos 2 caracteres.',
  }),
  amount: z.coerce.number().positive({
      message: 'El monto debe ser un número positivo.'
  }),
});

interface ExpenseFormProps {
  expense?: Expense;
  onSave: () => void;
}

export function ExpenseForm({ expense, onSave }: ExpenseFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      description: expense?.description || '',
      amount: expense?.amount || 0,
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!firestore || !user) return;

    const expenseData = { ...data };

    if (expense?.id) {
      const expenseRef = doc(firestore, `users/${user.uid}/expenses`, expense.id);
      setDocumentNonBlocking(expenseRef, expenseData, { merge: true });
      toast({
        title: 'Gasto Actualizado',
        description: `El gasto "${data.description}" ha sido actualizado.`,
      });
    } else {
      const newExpenseId = doc(collection(firestore, `users/${user.uid}/expenses`)).id;
      const expenseRef = doc(firestore, `users/${user.uid}/expenses`, newExpenseId);
      setDocumentNonBlocking(expenseRef, { id: newExpenseId, ...expenseData }, { merge: true });
      toast({
        title: 'Gasto Guardado',
        description: `El gasto "${data.description}" ha sido guardado.`,
      });
    }
    onSave();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input placeholder="ej., Suscripción a Netflix" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto Mensual</FormLabel>
              <FormControl>
                <Input type="number" placeholder="ej., 9590" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Guardar Gasto</Button>
      </form>
    </Form>
  );
}
