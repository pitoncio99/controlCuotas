import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { expenses } from '@/app/lib/data';
import { format } from 'date-fns';

export default function ExpensesPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gastos</CardTitle>
          <CardDescription>Registra gastos varios e independientes.</CardDescription>
        </div>
        <Button size="sm" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Agregar Gasto
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
              <TableHead className="hidden sm:table-cell">Fecha</TableHead>
              <TableHead className="text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => {
              return (
                <TableRow key={expense.id}>
                  <TableCell>
                    <div className="font-medium">{expense.description}</div>
                    <div className="text-sm text-muted-foreground sm:hidden">
                      {format(new Date(expense.date), 'MMM d, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{format(new Date(expense.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
