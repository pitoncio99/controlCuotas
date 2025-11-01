'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import type { Person } from '@/app/lib/definitions';
import { useFirestore, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

const FormSchema = z.object({
  name: z.string().min(2, {
    message: 'El nombre debe tener al menos 2 caracteres.',
  }),
  avatar: z.string().url({ message: 'Por favor, introduce una URL de imagen válida.' }).optional().or(z.literal('')),
});

interface PersonFormProps {
  person?: Person;
  onSave: () => void;
}

export function PersonForm({ person, onSave }: PersonFormProps) {
  const firestore = useFirestore();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: person?.name || '',
      avatar: person?.avatar || '',
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!firestore) return;

    if (person?.id) {
      const personRef = doc(firestore, 'people', person.id);
      setDocumentNonBlocking(personRef, data, { merge: true });
      toast({
        title: 'Persona Actualizada',
        description: `La persona "${data.name}" ha sido actualizada.`,
      });
    } else {
      const newPersonId = doc(collection(firestore, 'people')).id;
      const personRef = doc(firestore, 'people', newPersonId);
      setDocumentNonBlocking(personRef, { id: newPersonId, ...data }, { merge: true });
      toast({
        title: 'Persona Agregada',
        description: `La persona "${data.name}" ha sido agregada.`,
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
              <FormLabel>Nombre de la Persona</FormLabel>
              <FormControl>
                <Input placeholder="ej., Alex Johnson" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="avatar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL del Avatar (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Guardar Persona</Button>
      </form>
    </Form>
  );
}
