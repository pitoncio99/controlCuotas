import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { purchases, cards, people } from '@/app/lib/data';
import { format } from 'date-fns';

export default function PurchasesPage() {
  const getCard = (id: string) => cards.find(c => c.id === id);
  const getPerson = (id: string) => people.find(p => p.id === id);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Installment Purchases</CardTitle>
          <CardDescription>A list of all your ongoing installment plans.</CardDescription>
        </div>
        <Button size="sm" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Purchase
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="hidden md:table-cell">Person</TableHead>
              <TableHead>Card</TableHead>
              <TableHead className="text-right">Installment</TableHead>
              <TableHead className="hidden md:table-cell text-right">Total Value</TableHead>
              <TableHead>Progress</TableHead>
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
                      <Progress value={progress} aria-label={`${Math.round(progress)}% paid`} />
                      <span className="text-xs text-muted-foreground text-center">{purchase.installmentsPaid} of {purchase.totalInstallments} paid</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
