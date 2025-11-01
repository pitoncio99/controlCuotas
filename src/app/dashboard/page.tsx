'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { DollarSign, CreditCard, Calendar, Zap, WalletCards } from "lucide-react";
import { format, getDaysInMonth } from 'date-fns';
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { PurchaseInstallment, Expense, Card as CardType, MonthlyIncome, Person } from "@/app/lib/definitions";
import { useFilter } from './components/filter-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const currentMonthStr = format(new Date(), 'yyyy-MM');
  const { people, filterPersonId } = useFilter();

  const purchasesCollection = useMemoFirebase(() => firestore && user ? collection(firestore, `users/${user.uid}/purchaseInstallments`) : null, [firestore, user]);
  const { data: purchases, isLoading: purchasesLoading } = useCollection<PurchaseInstallment>(purchasesCollection);
  
  const expensesCollection = useMemoFirebase(() => firestore && user ? collection(firestore, `users/${user.uid}/expenses`) : null, [firestore, user]);
  const { data: expenses, isLoading: expensesLoading } = useCollection<Expense>(expensesCollection);

  const cardsCollection = useMemoFirebase(() => firestore && user ? collection(firestore, `users/${user.uid}/cards`) : null, [firestore, user]);
  const { data: cards, isLoading: cardsLoading } = useCollection<CardType>(cardsCollection);

  const incomeQuery = useMemoFirebase(() => 
    firestore && user ? query(collection(firestore, `users/${user.uid}/incomes`), where('month', '==', currentMonthStr)) : null
  , [firestore, user, currentMonthStr]);
  const { data: incomeData, isLoading: incomeLoading } = useCollection<MonthlyIncome>(incomeQuery);
  
  const monthlyIncome = incomeData?.[0]?.amount || 0;

  const totalOutstanding = useMemo(() => {
    const filteredPurchases = filterPersonId ? purchases?.filter(p => p.personId === filterPersonId) : purchases;
    return filteredPurchases?.reduce((acc, p) => {
      const remainingInstallments = p.totalInstallments - p.paidInstallments;
      return acc + remainingInstallments * p.installmentAmount;
    }, 0) || 0;
  }, [purchases, filterPersonId]);
  
  const totalMonthlyFixedExpenses = expenses?.reduce((acc, e) => acc + e.amount, 0) || 0;

  const currentMonthInstallments = useMemo(() => {
    const filteredPurchases = filterPersonId ? purchases?.filter(p => p.personId === filterPersonId) : purchases;
    return filteredPurchases?.reduce((acc, p) => {
      const remainingInstallments = p.totalInstallments - p.paidInstallments;
      if (remainingInstallments > 0) {
        return acc + p.installmentAmount;
      }
      return acc;
    }, 0) || 0;
  }, [purchases, filterPersonId]);


  const totalMonthlySpending = totalMonthlyFixedExpenses + currentMonthInstallments;
  
  const totalMonthlyCommitments = totalMonthlyFixedExpenses + currentMonthInstallments;
  const remainingBudget = monthlyIncome - totalMonthlyCommitments;
  
  const daysInMonth = getDaysInMonth(new Date());
  const remainingDays = daysInMonth - new Date().getDate() + 1;
  const dailyBudget = remainingBudget > 0 && remainingDays > 0 ? remainingBudget / remainingDays : 0;
  const weeklyBudget = dailyBudget * 7;

  const spendingByCard = useMemo(() => {
    const filteredPurchases = filterPersonId ? purchases?.filter(p => p.personId === filterPersonId) : purchases;
    
    return cards?.map(card => {
      const cardPurchases = filteredPurchases?.filter(p => p.cardId === card.id).reduce((acc, p) => {
        const remainingInstallments = p.totalInstallments - p.paidInstallments;
        return acc + remainingInstallments * p.installmentAmount;
      }, 0) || 0;
      return { name: card.name, total: cardPurchases, fill: card.color };
    }) || [];
  }, [cards, purchases, filterPersonId]);


  const chartConfig = {
    total: {
      label: "Deuda Total",
    },
  } satisfies ChartConfig;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value);
  }
  
  const isLoading = purchasesLoading || expensesLoading || cardsLoading || incomeLoading;

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total General Tarjetas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</div>
            <p className="text-xs text-muted-foreground">Total restante en todas las cuotas.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gasto Mensual Comprometido</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonthlySpending)}</div>
             <p className="text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground"></span>Cuotas: {formatCurrency(currentMonthInstallments)}</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground"></span>Gastos Fijos: {formatCurrency(totalMonthlyFixedExpenses)}</span>
            </p>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Límite de Gasto Diario</CardTitle>
             <CardDescription>Gasto diario recomendado con tu presupuesto restante.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
                <Zap className="h-6 w-6 text-muted-foreground" />
                {formatCurrency(dailyBudget)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Límite de Gasto Semanal</CardTitle>
            <CardDescription>Gasto semanal recomendado con tu presupuesto restante.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="h-6 w-6 text-muted-foreground" />
                {formatCurrency(weeklyBudget)}
             </div>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restante este Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-primary-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(remainingBudget)}</div>
            <p className="text-xs text-primary-foreground/70">Después de todos los compromisos.</p>
          </CardContent>
        </Card>
      </div>


      <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Deuda por Tarjeta</CardTitle>
                <CardDescription>Monto total pendiente por tarjeta de crédito ({filterPersonId ? people?.find(p=>p.id === filterPersonId)?.name : 'Todos'}).</CardDescription>
              </div>
            </div>
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
    </div>
  );
}
