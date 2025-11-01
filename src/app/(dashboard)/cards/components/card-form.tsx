'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import type { Card } from '@/app/lib/definitions';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

const FormSchema = z.object({
  name: z.string().min(2, {
    message: 'El nombre debe tener al menos 2 caracteres.',
  }),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, {
    message: 'Por favor, introduce un color hexadecimal válido.',
  }),
});

interface CardFormProps {
  card?: Card;
  onSave: () => void;
}

export function CardForm({ card, onSave }: CardFormProps) {
  const firestore = useFirestore();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: card?.name || '',
      color: card?.color || '#000000',
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!firestore) return;
    
    if (card?.id) {
      // Update existing card
      const cardRef = doc(firestore, 'cards', card.id);
      setDocumentNonBlocking(cardRef, data, { merge: true });
      toast({
        title: 'Tarjeta Actualizada',
        description: `La tarjeta "${data.name}" ha sido actualizada.`,
      });
    } else {
      // Add new card
      const newCardId = doc(collection(firestore, 'cards')).id;
      const cardRef = doc(firestore, 'cards', newCardId);
      setDocumentNonBlocking(cardRef, { id: newCardId, ...data }, { merge: true });
      toast({
        title: 'Tarjeta Agregada',
        description: `La tarjeta "${data.name}" ha sido agregada.`,
      });
    }
    onSave();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Tarjeta</FormLabel>
              <FormControl>
                <Input placeholder="ej., Visa Gold" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                   <Input type="color" className="w-12 h-10 p-1" {...field} />
                   <Input placeholder="ej., #FFD700" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Guardar</Button>
      </form>
    </Form>
  );
}
