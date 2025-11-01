'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { Expense } from '@/app/lib/definitions';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ExpenseForm } from './components/expense-form';
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
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

export default function ExpensesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const expensesCollection = useMemoFirebase(() => firestore && user ? collection(firestore, `users/${user.uid}/expenses`) : null, [firestore, user]);
  const { data: expenses, isLoading } = useCollection<Expense>(expensesCollection);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  const [deletingExpense, setDeletingExpense] = useState<Expense | undefined>(undefined);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setSheetOpen(true);
  };

  const handleAdd = () => {
    setEditingExpense(undefined);
    setSheetOpen(true);
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setEditingExpense(undefined);
  };
  
  const handleDelete = async () => {
    if (firestore && user && deletingExpense) {
      deleteDocumentNonBlocking(doc(firestore, `users/${user.uid}/expenses`, deletingExpense.id));
    }
    setDeletingExpense(undefined);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value);
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gastos Mensuales Fijos</CardTitle>
            <CardDescription>Registra gastos recurrentes (suscripciones, servicios, etc.).</CardDescription>
          </div>
          <Button size="sm" className="gap-2" onClick={handleAdd}>
            <PlusCircle className="h-4 w-4" />
            Agregar Gasto
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Monto Mensual</TableHead>
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                 <TableRow>
                  <TableCell colSpan={3} className="text-center">Cargando...</TableCell>
                </TableRow>
              )}
              {!isLoading && (expenses || []).map((expense) => {
                return (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div className="font-medium">{expense.description}</div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(expense)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setDeletingExpense(expense)} className="text-destructive">Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Sheet open={sheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingExpense ? 'Editar Gasto' : 'Agregar Gasto'}</SheetTitle>
            <SheetDescription>
              {editingExpense ? 'Modifica los detalles de tu gasto.' : 'Agrega un nuevo gasto a tu lista.'}
            </SheetDescription>
          </SheetHeader>
          <ExpenseForm expense={editingExpense} onSave={() => handleSheetClose()} />
        </SheetContent>
      </Sheet>
      <AlertDialog open={!!deletingExpense} onOpenChange={(open) => !open && setDeletingExpense(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el gasto.
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
