'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import type { Expense } from '@/app/lib/definitions';
import { useFirestore } from '@/firebase';
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';

const FormSchema = z.object({
  description: z.string().min(2, {
    message: 'La descripción debe tener al menos 2 caracteres.',
  }),
  amount: z.coerce.number().positive({
      message: 'El monto debe ser un número positivo.'
  }),
  date: z.date({
    required_error: 'Se requiere una fecha.',
  }),
});

interface ExpenseFormProps {
  expense?: Expense;
  onSave: () => void;
}

export function ExpenseForm({ expense, onSave }: ExpenseFormProps) {
  const firestore = useFirestore();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      description: expense?.description || '',
      amount: expense?.amount || 0,
      date: expense ? new Date(expense.date) : new Date(),
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!firestore) return;

    const expenseData = {
      ...data,
      date: data.date.toISOString(),
    };

    try {
      if (expense?.id) {
        await setDoc(doc(firestore, 'expenses', expense.id), expenseData, { merge: true });
        toast({
          title: 'Gasto Actualizado',
          description: `El gasto "${data.description}" ha sido actualizado.`,
        });
      } else {
        await addDoc(collection(firestore, 'expenses'), expenseData);
        toast({
          title: 'Gasto Guardado',
          description: `El gasto "${data.description}" ha sido guardado.`,
        });
      }
      onSave();
    } catch (error) {
       console.error("Error saving expense: ", error);
       toast({
        variant: "destructive",
        title: 'Error',
        description: 'No se pudo guardar el gasto.',
      });
    }
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
              <FormLabel>Monto</FormLabel>
              <FormControl>
                <Input type="number" placeholder="ej., 9590" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha del Gasto</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Elige una fecha</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Guardar Gasto</Button>
      </form>
    </Form>
  );
}
