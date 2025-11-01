import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { purchases, expenses, cards, people } from '../lib/data';
import { DollarSign, CreditCard, Users, Cpu, MemoryStick, Server } from "lucide-react";
import { format } from 'date-fns';

export default function DashboardPage() {
  const totalOutstanding = purchases.reduce((acc, p) => {
    const remainingInstallments = p.totalInstallments - p.installmentsPaid;
    return acc + remainingInstallments * p.amountPerInstallment;
  }, 0);

  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthlyExpenses = expenses
    .filter(e => format(new Date(e.date), 'yyyy-MM') === currentMonth)
    .reduce((acc, e) => acc + e.amount, 0);

  const monthlyInstallments = purchases.reduce((acc, p) => {
    const dueDate = new Date(p.purchaseDate);
    dueDate.setMonth(dueDate.getMonth() + p.installmentsPaid);
    if (format(dueDate, 'yyyy-MM') === currentMonth) {
        return acc + p.amountPerInstallment;
    }
    return acc;
  }, 0);

  const totalMonthlySpending = monthlyExpenses + monthlyInstallments;
  
  const spendingByCard = cards.map(card => {
    const cardPurchases = purchases.filter(p => p.cardId === card.id).reduce((acc, p) => acc + p.amountPerInstallment * (p.totalInstallments - p.installmentsPaid), 0);
    const cardExpenses = expenses.filter(e => e.cardId === card.id).reduce((acc, e) => acc + e.amount, 0);
    return { name: card.name, total: cardPurchases + cardExpenses, fill: card.color };
  });

  const chartConfig = {
    total: {
      label: "Total Debt",
    },
  } satisfies ChartConfig;

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding Debt</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Total remaining on all installments.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month's Spending</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMonthlySpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Includes installments and one-off expenses.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active People</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{people.length}</div>
            <p className="text-xs text-muted-foreground">Total people in the system.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Card</CardTitle>
            <CardDescription>Total outstanding amount per credit card.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={spendingByCard} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <ChartTooltip
                  cursor={{fill: 'hsl(var(--muted))'}}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {spendingByCard.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Basic application monitoring metrics.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">CPU Usage</span>
              </div>
              <span className="text-sm font-semibold text-green-600">Normal</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MemoryStick className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Memory</span>
              </div>
              <span className="text-sm font-semibold">128MB / 512MB</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Requests</span>
              </div>
              <span className="text-sm font-semibold">45/min</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
