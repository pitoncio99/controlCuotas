'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { PurchaseForm } from './components/purchase-form';
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking, useUser } from '@/firebase';
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
} from "@/components/ui/alert-dialog"

export default function PurchasesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const purchasesCollection = useMemoFirebase(() => firestore && user ? collection(firestore, `users/${user.uid}/purchaseInstallments`) : null, [firestore, user]);
  const { data: purchases, isLoading: purchasesLoading } = useCollection<PurchaseInstallment>(purchasesCollection);

  const cardsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'cards') : null, [firestore]);
  const { data: cards, isLoading: cardsLoading } = useCollection<CardType>(cardsCollection);

  const peopleCollection = useMemoFirebase(() => firestore && user ? collection(firestore, `users/${user.uid}/persons`) : null, [firestore, user]);
  const { data: people, isLoading: peopleLoading } = useCollection<Person>(peopleCollection);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseInstallment | undefined>(undefined);
  const [deletingPurchase, setDeletingPurchase] = useState<PurchaseInstallment | undefined>(undefined);

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

  const getCardName = (cardId: string) => cards?.find(c => c.id === cardId)?.name || 'N/A';
  const getPersonName = (personId: string) => people?.find(p => p.id === personId)?.name || 'N/A';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value);
  }
  
  const isLoading = purchasesLoading || cardsLoading || peopleLoading;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Compras en Cuotas</CardTitle>
            <CardDescription>Administra todas tus compras realizadas en cuotas.</CardDescription>
          </div>
          <Button size="sm" className="gap-2" onClick={handleAdd}>
            <PlusCircle className="h-4 w-4" />
            Agregar Compra
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="hidden sm:table-cell">Persona</TableHead>
                <TableHead className="hidden md:table-cell">Tarjeta</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Monto Cuota</TableHead>
                <TableHead className="text-center">Progreso</TableHead>
                <TableHead className="text-right">Total Restante</TableHead>
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Cargando...</TableCell>
                </TableRow>
              )}
              {!isLoading && (purchases || []).map((purchase) => {
                const remainingAmount = (purchase.totalInstallments - purchase.paidInstallments) * purchase.installmentAmount;
                return (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      <div className="font-medium">{purchase.description}</div>
                      <div className="text-sm text-muted-foreground md:hidden">
                        {getPersonName(purchase.personId)} - {getCardName(purchase.cardId)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{getPersonName(purchase.personId)}</TableCell>
                    <TableCell className="hidden md:table-cell">{getCardName(purchase.cardId)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-right">{formatCurrency(purchase.installmentAmount)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono">{purchase.paidInstallments}/{purchase.totalInstallments}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(remainingAmount)}</TableCell>
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
          </Table>
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
    </>
  );
}
