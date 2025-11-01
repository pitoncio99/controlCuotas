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
          <CardTitle>Monthly Income</CardTitle>
          <CardDescription>Set your total monthly income to calculate your budget.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-end gap-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="income">Income for {format(new Date(), 'MMMM yyyy')}</Label>
            <Input type="number" id="income" placeholder="e.g., 4500" defaultValue={currentMonthIncome} />
          </div>
          <Button>Save</Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Spending Limit</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dailyBudget.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Recommended daily spending.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Spending Limit</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${weeklyBudget.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Recommended weekly spending.</p>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-primary-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${remainingBudget.toFixed(2)}</div>
            <p className="text-xs text-primary-foreground/70">After all known commitments.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
