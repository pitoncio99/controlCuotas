'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { Card as CardType } from '@/app/lib/definitions';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { CardForm } from './components/card-form';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function CardsPage() {
  const firestore = useFirestore();
  const { data: cards, loading } = useCollection<CardType>(firestore ? collection(firestore, 'cards') : null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardType | undefined>(undefined);

  const handleEdit = (card: CardType) => {
    setEditingCard(card);
    setSheetOpen(true);
  };

  const handleAdd = () => {
    setEditingCard(undefined);
    setSheetOpen(true);
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setEditingCard(undefined);
  };

  const handleDelete = async (id: string) => {
    if (firestore) {
      await deleteDoc(doc(firestore, 'cards', id));
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tarjetas de Crédito</CardTitle>
            <CardDescription>Administra tus tarjetas de crédito registradas.</CardDescription>
          </div>
          <Button size="sm" className="gap-2" onClick={handleAdd}>
            <PlusCircle className="h-4 w-4" />
            Agregar Tarjeta
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre de la Tarjeta</TableHead>
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">Cargando...</TableCell>
                </TableRow>
              )}
              {!loading && (cards || []).map((card) => (
                <TableRow key={card.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: card.color }} />
                      <span className="font-medium">{card.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(card)}>Editar</DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Eliminar</DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente la tarjeta.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(card.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Sheet open={sheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingCard ? 'Editar Tarjeta' : 'Agregar Tarjeta'}</SheetTitle>
            <SheetDescription>
              {editingCard ? 'Modifica los detalles de tu tarjeta.' : 'Agrega una nueva tarjeta a tu lista.'}
            </SheetDescription>
          </SheetHeader>
          <CardForm card={editingCard} onSave={() => handleSheetClose()} />
        </SheetContent>
      </Sheet>
    </>
  );
}
