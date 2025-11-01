'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, ChevronUp, ChevronDown, CalendarDays, ClipboardCopy } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { PurchaseForm } from './components/purchase-form';
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking, useUser, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { PurchaseInstallment, Card as CardType, Person } from '@/app/lib/definitions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { addMonths, format } from 'date-fns';
import { useFilter } from '../components/filter-context';


type ProgressUpdateAction = {
  purchase: PurchaseInstallment;
  direction: 'up' | 'down';
} | null;


export default function PurchasesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { filterPersonId } = useFilter();
  
  const purchasesCollection = useMemoFirebase(() => firestore && user ? collection(firestore, `users/${user.uid}/purchaseInstallments`) : null, [firestore, user]);
  const { data: purchases, isLoading: purchasesLoading } = useCollection<PurchaseInstallment>(purchasesCollection);

  const cardsCollection = useMemoFirebase(() => firestore && user ? collection(firestore, `users/${user.uid}/cards`) : null, [firestore, user]);
  const { data: cards, isLoading: cardsLoading } = useCollection<CardType>(cardsCollection);

  const peopleCollection = useMemoFirebase(() => firestore && user ? collection(firestore, `users/${user.uid}/people`) : null, [firestore, user]);
  const { data: people, isLoading: peopleLoading } = useCollection<Person>(peopleCollection);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseInstallment | undefined>(undefined);
  const [deletingPurchase, setDeletingPurchase] = useState<PurchaseInstallment | undefined>(undefined);
  const [progressUpdate, setProgressUpdate] = useState<ProgressUpdateAction>(null);

  const [filterCardId, setFilterCardId] = useState<string>('');

  const handleEdit = (purchase: PurchaseInstallment) => {
    setEditingPurchase(purchase);
    setSheetOpen(true);
  };
  
  const handleAdd = () => {
    setEditingPurchase(undefined);
    setSheetOpen(true);
  };
  
  const handleSheetClose = () => {
    setSheetOpen(false);
    setEditingPurchase(undefined);
  };

  const handleDelete = () => {
    if (firestore && user && deletingPurchase) {
      deleteDocumentNonBlocking(doc(firestore, `users/${user.uid}/purchaseInstallments`, deletingPurchase.id));
    }
    setDeletingPurchase(undefined);
  };

  const handleConfirmProgressUpdate = () => {
    if (!firestore || !user || !progressUpdate) return;
    
    const { purchase, direction } = progressUpdate;
    let newPaidInstallments = purchase.paidInstallments;

    if (direction === 'up' && purchase.paidInstallments < purchase.totalInstallments) {
      newPaidInstallments++;
    } else if (direction === 'down' && purchase.paidInstallments > 0) {
      newPaidInstallments--;
    } else {
      setProgressUpdate(null);
      return; 
    }

    const purchaseRef = doc(firestore, `users/${user.uid}/purchaseInstallments`, purchase.id);
    setDocumentNonBlocking(purchaseRef, { paidInstallments: newPaidInstallments }, { merge: true });

    toast({
      title: 'Progreso Actualizado',
      description: `Se actualizó el progreso de "${purchase.description}".`
    });

    setProgressUpdate(null);
  };

  const getCard = (cardId: string) => cards?.find(c => c.id === cardId);
  const getPersonName = (personId: string) => people?.find(p => p.id === personId)?.name || 'N/A';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value);
  }
  
  const isLoading = purchasesLoading || cardsLoading || peopleLoading;

  const filteredPurchases = useMemo(() => {
    return (purchases || []).filter(purchase => {
      const personMatch = filterPersonId ? purchase.personId === filterPersonId : true;
      const cardMatch = filterCardId ? purchase.cardId === filterCardId : true;
      return personMatch && cardMatch;
    });
  }, [purchases, filterPersonId, filterCardId]);

  const totalFilteredInstallmentAmount = useMemo(() => {
    return filteredPurchases.reduce((acc, purchase) => {
      const remainingInstallments = purchase.totalInstallments - purchase.paidInstallments;
      if (remainingInstallments > 0) {
        return acc + purchase.installmentAmount;
      }
      return acc;
    }, 0);
  }, [filteredPurchases]);

  const handleExport = () => {
    if (filteredPurchases.length === 0) {
      toast({
        variant: "destructive",
        title: "No hay datos para exportar",
        description: "Aplica filtros diferentes o agrega compras.",
      });
      return;
    }

    const rows = filteredPurchases.map(p => {
      const cardName = getCard(p.cardId)?.name || 'N/A';
      const progress = `${p.paidInstallments}/${p.totalInstallments}`;
      const amount = formatCurrency(p.installmentAmount);
      return `${cardName}\n${amount} --> ${p.description} --> ${progress}`;
    }).join("\n\n");

    const totalAmount = filteredPurchases.reduce((sum, p) => sum + p.installmentAmount, 0);
    const totalText = `\n\n--------------------\n${filteredPurchases.length} compras por ${formatCurrency(totalAmount)}`;
    
    const exportText = rows + totalText;

    navigator.clipboard.writeText(exportText).then(() => {
      toast({
        title: "¡Copiado al portapapeles!",
        description: "Los datos de las compras filtradas han sido copiados.",
      });
    }).catch(err => {
      console.error('Error al copiar: ', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron copiar los datos al portapapeles.",
      });
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Compras en Cuotas</CardTitle>
            <CardDescription>Administra todas tus compras realizadas en cuotas.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-2" onClick={handleExport}>
              <ClipboardCopy className="h-4 w-4" />
              Exportar
            </Button>
            <Button size="sm" className="gap-2" onClick={handleAdd}>
              <PlusCircle className="h-4 w-4" />
              Agregar Compra
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Select onValueChange={(value) => setFilterCardId(value === 'all' ? '' : value)} defaultValue="all">
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por tarjeta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las tarjetas</SelectItem>
                {(cards || []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden md:table-cell">Tarjeta</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="hidden sm:table-cell">Persona</TableHead>
                  <TableHead className="text-right">Monto Cuota</TableHead>
                  <TableHead className="text-right">Restante</TableHead>
                  <TableHead className="text-center">Progreso</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">Fecha Compra</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">Último Pago</TableHead>
                  <TableHead className="w-[100px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">Cargando...</TableCell>
                  </TableRow>
                )}
                {!isLoading && filteredPurchases.map((purchase) => {
                  const remainingAmount = (purchase.totalInstallments - purchase.paidInstallments) * purchase.installmentAmount;
                  const card = getCard(purchase.cardId);
                  const progressPercentage = purchase.totalInstallments > 0 ? (purchase.paidInstallments / purchase.totalInstallments) * 100 : 0;
                  
                  return (
                    <TableRow key={purchase.id}>
                      <TableCell className="hidden md:table-cell">
                        <div className="p-1 rounded-md text-center" style={{ backgroundColor: card?.color ? `${card.color}40` : 'transparent' }}>
                          {card?.name || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{purchase.description}</div>
                        <div className="text-sm text-muted-foreground md:hidden">
                          {card?.name}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{getPersonName(purchase.personId)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(purchase.installmentAmount)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(remainingAmount)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 cursor-default">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setProgressUpdate({ purchase, direction: 'down' })} disabled={purchase.paidInstallments <= 0}>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="font-mono text-sm">{purchase.paidInstallments}/{purchase.totalInstallments}</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{progressPercentage.toFixed(0)}% pagado</p>
                            </TooltipContent>
                          </Tooltip>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setProgressUpdate({ purchase, direction: 'up' })} disabled={purchase.paidInstallments >= purchase.totalInstallments}>
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                       <TableCell className="text-center hidden sm:table-cell">
                        <div className="flex items-center justify-center gap-1">
                          <CalendarDays className="h-4 w-4 text-muted-foreground"/>
                          {format(new Date(purchase.paymentDeadline), 'dd/MM/yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="text-center hidden sm:table-cell">{purchase.lastPayment || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(purchase)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setDeletingPurchase(purchase)} className="text-destructive">Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-bold">Total Mensual Filtrado</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(totalFilteredInstallmentAmount)}</TableCell>
                  <TableCell colSpan={5}></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </TooltipProvider>
        </CardContent>
      </Card>
      <Sheet open={sheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingPurchase ? 'Editar Compra' : 'Agregar Compra'}</SheetTitle>
            <SheetDescription>
              {editingPurchase ? 'Modifica los detalles de tu compra.' : 'Agrega una nueva compra a tu lista.'}
            </SheetDescription>
          </SheetHeader>
          <PurchaseForm purchase={editingPurchase} onSave={handleSheetClose} />
        </SheetContent>
      </Sheet>
      <AlertDialog open={!!deletingPurchase} onOpenChange={(open) => !open && setDeletingPurchase(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la compra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!progressUpdate} onOpenChange={(open) => !open && setProgressUpdate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Actualización</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas {progressUpdate?.direction === 'up' ? 'aumentar' : 'disminuir'} las cuotas pagadas de "{progressUpdate?.purchase.description}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProgressUpdate(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmProgressUpdate}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
