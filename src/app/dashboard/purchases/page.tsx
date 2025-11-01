'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, ChevronUp, ChevronDown, CalendarDays, ClipboardCopy, ArrowUpDown } from "lucide-react";
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
import { format } from 'date-fns';
import { useFilter } from '../components/filter-context';
import { cn } from '@/lib/utils';


type ProgressUpdateAction = {
  purchase: PurchaseInstallment;
  direction: 'up' | 'down';
} | null;

type SortKey = 'cardName' | 'description' | 'personName' | 'installmentAmount' | 'remainingAmount' | 'progress' | 'paymentDeadline' | 'lastPayment';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

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
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'paymentDeadline', direction: 'desc' });
  const [filterCardId, setFilterCardId] = useState<string>('');

  const getCard = (cardId: string) => cards?.find(c => c.id === cardId);
  const getPersonName = (personId: string) => people?.find(p => p.id === personId)?.name || 'N/A';

  const sortedAndFilteredPurchases = useMemo(() => {
    let filtered = (purchases || []).filter(purchase => {
      const personMatch = filterPersonId ? purchase.personId === filterPersonId : true;
      const cardMatch = filterCardId ? purchase.cardId === filterCardId : true;
      return personMatch && cardMatch;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aVal = getValueForSort(a, sortConfig.key);
        const bVal = getValueForSort(b, sortConfig.key);

        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [purchases, filterPersonId, filterCardId, sortConfig, cards, people]);

  function getValueForSort(purchase: PurchaseInstallment, key: SortKey) {
    switch (key) {
      case 'cardName':
        return getCard(purchase.cardId)?.name || '';
      case 'personName':
        return getPersonName(purchase.personId);
      case 'remainingAmount':
        return (purchase.totalInstallments - purchase.paidInstallments) * purchase.installmentAmount;
      case 'progress':
        return purchase.totalInstallments > 0 ? purchase.paidInstallments / purchase.totalInstallments : 0;
      case 'paymentDeadline':
        return new Date(purchase.paymentDeadline).getTime();
      default:
        return purchase[key as keyof PurchaseInstallment] || '';
    }
  }

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };


  const renderSortIcon = (key: SortKey) => {
    if (sortConfig?.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />;
  };

  const SortableHeader = ({ sortKey, children, className }: { sortKey: SortKey, children: React.ReactNode, className?: string }) => (
    <TableHead className={className}>
      <Button variant="ghost" onClick={() => handleSort(sortKey)} className="px-2 py-1 h-auto">
        {children}
        {renderSortIcon(sortKey)}
      </Button>
    </TableHead>
  );

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value);
  }
  
  const isLoading = purchasesLoading || cardsLoading || peopleLoading;

  const totalFilteredInstallmentAmount = useMemo(() => {
    return sortedAndFilteredPurchases.reduce((acc, purchase) => {
      if (purchase.paidInstallments > 0) {
        return acc + purchase.installmentAmount;
      }
      return acc;
    }, 0);
  }, [sortedAndFilteredPurchases]);

  const handleExport = () => {
    if (sortedAndFilteredPurchases.length === 0) {
      toast({
        variant: "destructive",
        title: "No hay datos para exportar",
        description: "Aplica filtros diferentes o agrega compras.",
      });
      return;
    }

    const groupedByCard = sortedAndFilteredPurchases.reduce((acc, p) => {
      if (!acc[p.cardId]) {
        acc[p.cardId] = [];
      }
      acc[p.cardId].push(p);
      return acc;
    }, {} as Record<string, PurchaseInstallment[]>);

    let totalAmountForExport = 0;
    const allInProgressPurchases = sortedAndFilteredPurchases.filter(p => p.paidInstallments > 0);

    const rows = Object.entries(groupedByCard).map(([cardId, purchases]) => {
      const cardName = getCard(cardId)?.name || 'N/A';
      
      const inProgressPurchases = purchases.filter(p => p.paidInstallments > 0);
      const notStartedPurchases = purchases.filter(p => p.paidInstallments === 0);

      const purchaseLines = inProgressPurchases.map(p => {
        const progress = `${p.paidInstallments}/${p.totalInstallments}`;
        const amount = formatCurrency(p.installmentAmount);
        totalAmountForExport += p.installmentAmount;
        return `${amount} --> ${p.description} --> ${progress}`;
      }).join("\n");

      const notStartedLines = notStartedPurchases.map(p => {
        const progress = `${p.paidInstallments}/${p.totalInstallments}`;
        return `compra ${p.description} no salio, ${progress}`;
      }).join("\n");

      let cardText = `${cardName}\n${purchaseLines}`;
      if (notStartedLines) {
        cardText += `\n${notStartedLines}`;
      }
      
      return cardText;
    }).join("\n\n");

    
    const totalText = `\n\n--------------------\n${allInProgressPurchases.length} compras por ${formatCurrency(totalAmountForExport)}`;
    
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
                  <SortableHeader sortKey="cardName" className="hidden md:table-cell">Tarjeta</SortableHeader>
                  <SortableHeader sortKey="description">Descripción</SortableHeader>
                  <SortableHeader sortKey="personName" className="hidden sm:table-cell">Persona</SortableHeader>
                  <SortableHeader sortKey="installmentAmount" className="text-right">Monto Cuota</SortableHeader>
                  <SortableHeader sortKey="remainingAmount" className="text-right">Restante</SortableHeader>
                  <SortableHeader sortKey="progress" className="text-center">Progreso</SortableHeader>
                  <SortableHeader sortKey="paymentDeadline" className="text-center hidden sm:table-cell">Fecha Compra</SortableHeader>
                  <SortableHeader sortKey="lastPayment" className="text-center hidden sm:table-cell">Último Pago</SortableHeader>
                  <TableHead className="w-[100px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">Cargando...</TableCell>
                  </TableRow>
                )}
                {!isLoading && sortedAndFilteredPurchases.map((purchase) => {
                  const remainingAmount = (purchase.totalInstallments - purchase.paidInstallments) * purchase.installmentAmount;
                  const card = getCard(purchase.cardId);
                  const isCompleted = purchase.paidInstallments >= purchase.totalInstallments && purchase.totalInstallments > 0;
                  const progressPercentage = purchase.totalInstallments > 0 ? (purchase.paidInstallments / purchase.totalInstallments) * 100 : 0;
                  
                  return (
                    <TableRow key={purchase.id} className={cn(isCompleted && 'bg-green-500/10 hover:bg-green-500/20')}>
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
                              <Badge variant={isCompleted ? 'default' : 'outline'} className={cn(isCompleted && 'bg-green-600/80 text-white')}>{purchase.paidInstallments}/{purchase.totalInstallments}</Badge>
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
}
