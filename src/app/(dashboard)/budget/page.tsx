import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { income, expenses, purchases } from "@/app/lib/data";
import { DollarSign, Calendar, Zap } from 'lucide-react';
import { format, getDaysInMonth } from 'date-fns';

export default function BudgetPage() {
  const currentMonthIncome = income.find(i => i.month === format(new Date(), 'yyyy-MM'))?.amount || 0;
  
  const currentMonthExpenses = expenses
    .filter(e => format(new Date(e.date), 'yyyy-MM') === format(new Date(), 'yyyy-MM'))
    .reduce((acc, e) => acc + e.amount, 0);

  const currentMonthInstallments = purchases.reduce((acc, p) => {
    const remainingInstallments = p.totalInstallments - p.installmentsPaid;
    if (remainingInstallments > 0) {
      return acc + p.amountPerInstallment;
    }
    return acc;
  }, 0);
  
  const totalMonthlyCommitments = currentMonthExpenses + currentMonthInstallments;
  const remainingBudget = currentMonthIncome - totalMonthlyCommitments;
  
  const daysInMonth = getDaysInMonth(new Date());
  const dailyBudget = remainingBudget > 0 ? remainingBudget / daysInMonth : 0;
  const weeklyBudget = dailyBudget * 7;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Ingreso Mensual</CardTitle>
          <CardDescription>Establece tu ingreso mensual total para calcular tu presupuesto.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-end gap-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="income">Ingreso para {format(new Date(), 'MMMM yyyy')}</Label>
            <Input type="number" id="income" placeholder="ej., 4500" defaultValue={currentMonthIncome} />
          </div>
          <Button>Guardar</Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Límite de Gasto Diario</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dailyBudget.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Gasto diario recomendado.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Límite de Gasto Semanal</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${weeklyBudget.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Gasto semanal recomendado.</p>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restante este Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-primary-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${remainingBudget.toFixed(2)}</div>
            <p className="text-xs text-primary-foreground/70">Después de todos los compromisos conocidos.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
