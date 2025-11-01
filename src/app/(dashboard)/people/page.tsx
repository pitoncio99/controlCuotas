'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Person } from '@/app/lib/definitions';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { PersonForm } from './components/person-form';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
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

export default function PeoplePage() {
  const firestore = useFirestore();
  const { data: people, loading } = useCollection<Person>(firestore ? collection(firestore, 'people') : null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | undefined>(undefined);

  const handleEdit = (person: Person) => {
    setEditingPerson(person);
    setSheetOpen(true);
  };

  const handleAdd = () => {
    setEditingPerson(undefined);
    setSheetOpen(true);
  };
  
  const handleSheetClose = () => {
    setSheetOpen(false);
    setEditingPerson(undefined);
  };

  const handleDelete = async (id: string) => {
    if (firestore) {
      await deleteDoc(doc(firestore, 'people', id));
    }
  };


  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Personas</CardTitle>
            <CardDescription>Administra a las personas para asignarles compras.</CardDescription>
          </div>
          <Button size="sm" className="gap-2" onClick={handleAdd}>
            <PlusCircle className="h-4 w-4" />
            Agregar Persona
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">Cargando...</TableCell>
                </TableRow>
              )}
              {!loading && (people || []).map((person) => (
                <TableRow key={person.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={person.avatar} alt={person.name} />
                        <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{person.name}</span>
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
                        <DropdownMenuItem onClick={() => handleEdit(person)}>Editar</DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Eliminar</DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente a la persona.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(person.id)}>Eliminar</AlertDialogAction>
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
            <SheetTitle>{editingPerson ? 'Editar Persona' : 'Agregar Persona'}</SheetTitle>
            <SheetDescription>
              {editingPerson ? 'Modifica los detalles de la persona.' : 'Agrega una nueva persona a tu lista.'}
            </SheetDescription>
          </SheetHeader>
          <PersonForm person={editingPerson} onSave={() => handleSheetClose()} />
        </SheetContent>
      </Sheet>
    </>
  );
}
