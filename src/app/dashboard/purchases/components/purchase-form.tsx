'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import type { PurchaseInstallment, Card, Person } from '@/app/lib/definitions';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

const FormSchema = z.object({
  description: z.string().min(2, {
    message: 'La descripción debe tener al menos 2 caracteres.',
  }),
  personId: z.string({ required_error: 'Debes seleccionar una persona.' }),
  cardId: z.string({ required_error: 'Debes seleccionar una tarjeta.' }),
  installmentAmount: z.coerce.number().positive({ message: 'El monto debe ser un número positivo.' }),
  paidInstallments: z.coerce.number().int().min(0, { message: 'Debe ser un número no negativo.' }),
  totalInstallments: z.coerce.number().int().positive({ message: 'Debe ser un número positivo.' }),
  paymentDeadline: z.date({ required_error: 'Se requiere una fecha de compra.' }),
  lastPayment: z.string().optional(),
}).refine(data => data.paidInstallments <= data.totalInstallments, {
  message: "Las cuotas pagadas no pueden ser mayores que las cuotas totales.",
  path: ["paidInstallments"],
});


interface PurchaseFormProps {
  purchase?: PurchaseInstallment;
  onSave: () => void;
}

export function PurchaseForm({ purchase, onSave }: PurchaseFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();

  const cardsCollection = useMemoFirebase(() => firestore && user ? collection(firestore, `users/${user.uid}/cards`) : null, [firestore, user]);
  const { data: cards } = useCollection<Card>(cardsCollection);
  
  const peopleCollection = useMemoFirebase(() => firestore && user ? collection(firestore, `users/${user.uid}/people`) : null, [firestore, user]);
  const { data: people } = useCollection<Person>(peopleCollection);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      description: purchase?.description || '',
      personId: purchase?.personId || undefined,
      cardId: purchase?.cardId || undefined,
      installmentAmount: purchase?.installmentAmount || 0,
      paidInstallments: purchase?.paidInstallments || 0,
      totalInstallments: purchase?.totalInstallments || 1,
      paymentDeadline: purchase ? new Date(purchase.paymentDeadline) : new Date(),
      lastPayment: purchase?.lastPayment || '',
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!firestore || !user) return;

    const purchaseData = {
      ...data,
      paymentDeadline: data.paymentDeadline.toISOString(),
    };

    if (purchase?.id) {
      const purchaseRef = doc(firestore, `users/${user.uid}/purchaseInstallments`, purchase.id);
      setDocumentNonBlocking(purchaseRef, purchaseData, { merge: true });
      toast({
        title: 'Compra Actualizada',
        description: `La compra "${data.description}" ha sido actualizada.`,
      });
    } else {
      const newPurchaseId = doc(collection(firestore, `users/${user.uid}/purchaseInstallments`)).id;
      const purchaseRef = doc(firestore, `users/${user.uid}/purchaseInstallments`, newPurchaseId);
      setDocumentNonBlocking(purchaseRef, { id: newPurchaseId, ...purchaseData }, { merge: true });
      toast({
        title: 'Compra Guardada',
        description: `La compra "${data.description}" ha sido guardada.`,
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
                <Input placeholder="ej., Nuevo Portátil" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="personId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Persona</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una persona" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(people || []).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="cardId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tarjeta</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una tarjeta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(cards || []).map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                            {c.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="installmentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto por Cuota</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paidInstallments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuotas Pagadas</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="totalInstallments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuotas Totales</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="paymentDeadline"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Compra</FormLabel>
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
          <FormField
              control={form.control}
              name="lastPayment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Último Pago (Manual)</FormLabel>
                  <FormControl>
                    <Input placeholder="ej., finales de dic 2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        
        <Button type="submit">Guardar Compra</Button>
      </form>
    </Form>
  );
}

    