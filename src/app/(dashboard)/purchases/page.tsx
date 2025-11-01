'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { purchases, cards, people } from '@/app/lib/data';
import type { Purchase } from '@/app/lib/definitions';
import { format } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { PurchaseForm } from './components/purchase-form';

export default function PurchasesPage() {
  const getCard = (id: string) => cards.find(c => c.id === id);
  const getPerson = (id: string) => people.find(p => p.id === id);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | undefined>(undefined);

  const handleEdit = (purchase: Purchase) => {
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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Compras en Cuotas</CardTitle>
            <CardDescription>Una lista de todos tus planes de cuotas en curso.</CardDescription>
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
                <TableHead className="hidden md:table-cell">Persona</TableHead>
                <TableHead>Tarjeta</TableHead>
                <TableHead className="text-right">Cuota</TableHead>
                <TableHead className="hidden md:table-cell text-right">Valor Total</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => {
                const card = getCard(purchase.cardId);
                const person = getPerson(purchase.personId);
                const progress = (purchase.installmentsPaid / purchase.totalInstallments) * 100;
                const totalValue = purchase.amountPerInstallment * purchase.totalInstallments;

                return (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      <div className="font-medium">{purchase.description}</div>
                      <div className="text-sm text-muted-foreground md:hidden">{person?.name}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{person?.name}</TableCell>
                    <TableCell>
                      {card && (
                        <Badge style={{ backgroundColor: card.color, color: card.color === '#333333' ? '#fff': '#000' }} variant="outline">{card.name}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">${purchase.amountPerInstallment.toFixed(2)}</TableCell>
                    <TableCell className="hidden md:table-cell text-right">${totalValue.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Progress value={progress} aria-label={`${Math.round(progress)}% pagado`} />
                        <span className="text-xs text-muted-foreground text-center">{purchase.installmentsPaid} de {purchase.totalInstallments} pagadas</span>
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
                          <DropdownMenuItem onClick={() => handleEdit(purchase)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
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
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>{editingPurchase ? 'Editar Compra' : 'Agregar Compra'}</SheetTitle>
            <SheetDescription>
              {editingPurchase ? 'Modifica los detalles de tu compra.' : 'Agrega una nueva compra a tu lista.'}
            </SheetDescription>
          </SheetHeader>
          <PurchaseForm purchase={editingPurchase} onSave={() => handleSheetClose()} />
        </SheetContent>
      </Sheet>
    </>
  );
}
