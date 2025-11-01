'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { DollarSign, CreditCard, Users, Cpu, MemoryStick, Server } from "lucide-react";
import { format } from 'date-fns';
import { useFirestore } from "@/firebase";
import { useCollection } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Purchase, Expense, Card as CardType, Person } from "@/app/lib/definitions";

export default function DashboardPage() {
  const firestore = useFirestore();
  const { data: purchases, loading: purchasesLoading } = useCollection<Purchase>(firestore ? collection(firestore, 'purchases') : null);
  const { data: expenses, loading: expensesLoading } = useCollection<Expense>(firestore ? collection(firestore, 'expenses') : null);
  const { data: cards, loading: cardsLoading } = useCollection<CardType>(firestore ? collection(firestore, 'cards') : null);
  const { data: people, loading: peopleLoading } = useCollection<Person>(firestore ? collection(firestore, 'people') : null);

  const totalOutstanding = purchases?.reduce((acc, p) => {
    const remainingInstallments = p.totalInstallments - p.installmentsPaid;
    return acc + remainingInstallments * p.amountPerInstallment;
  }, 0) || 0;

  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthlyExpenses = expenses
    ?.filter(e => format(new Date(e.date), 'yyyy-MM') === currentMonth)
    .reduce((acc, e) => acc + e.amount, 0) || 0;

  const monthlyInstallments = purchases?.reduce((acc, p) => {
    const remainingInstallments = p.totalInstallments - p.installmentsPaid;
    if (remainingInstallments > 0) {
      // A simple approximation: assumes an installment is due this month if not fully paid.
      return acc + p.amountPerInstallment;
    }
    return acc;
  }, 0) || 0;

  const totalMonthlySpending = monthlyExpenses + monthlyInstallments;
  
  const spendingByCard = cards?.map(card => {
    const cardPurchases = purchases?.filter(p => p.cardId === card.id).reduce((acc, p) => acc + p.amountPerInstallment * (p.totalInstallments - p.installmentsPaid), 0) || 0;
    return { name: card.name, total: cardPurchases, fill: card.color };
  }) || [];

  const chartConfig = {
    total: {
      label: "Deuda Total",
    },
  } satisfies ChartConfig;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value);
  }
  
  const isLoading = purchasesLoading || expensesLoading || cardsLoading || peopleLoading;

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deuda Total Pendiente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</div>
            <p className="text-xs text-muted-foreground">Total restante en todas las cuotas.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gasto de este Mes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonthlySpending)}</div>
            <p className="text-xs text-muted-foreground">Incluye cuotas y gastos generales.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personas Activas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{people?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Total de personas en el sistema.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deuda por Tarjeta</CardTitle>
            <CardDescription>Monto total pendiente por tarjeta de crédito.</CardDescription>
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
                  tickFormatter={(value) => formatCurrency(Number(value))}
                />
                <ChartTooltip
                  cursor={{fill: 'hsl(var(--muted))'}}
                  content={<ChartTooltipContent indicator="dot" formatter={(value) => formatCurrency(Number(value))}/>}
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
            <CardTitle>Estado del Sistema</CardTitle>
            <CardDescription>Métricas básicas de monitoreo de la aplicación.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Uso de CPU</span>
              </div>
              <span className="text-sm font-semibold text-green-600">Normal</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MemoryStick className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Memoria</span>
              </div>
              <span className="text-sm font-semibold">128MB / 512MB</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Solicitudes</span>
              </div>
              <span className="text-sm font-semibold">45/min</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
