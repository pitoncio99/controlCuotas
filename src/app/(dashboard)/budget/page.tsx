'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DollarSign, Calendar, Zap } from 'lucide-react';
import { format, getDaysInMonth } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import type { Purchase, Expense, MonthlyIncome } from '@/app/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase';

export default function BudgetPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const currentMonthStr = format(new Date(), 'yyyy-MM');

  const incomeQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'income'), where('month', '==', currentMonthStr)) : null
  , [firestore, currentMonthStr]);
  const { data: incomeData, isLoading: incomeLoading } = useCollection<MonthlyIncome>(incomeQuery);

  const expensesCollection = useMemoFirebase(() => firestore ? collection(firestore, 'expenses') : null, [firestore]);
  const { data: expenses, isLoading: expensesLoading } = useCollection<Expense>(expensesCollection);

  const purchasesCollection = useMemoFirebase(() => firestore ? collection(firestore, 'purchases') : null, [firestore]);
  const { data: purchases, isLoading: purchasesLoading } = useCollection<Purchase>(purchasesCollection);
  
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  
  useEffect(() => {
    if (incomeData && incomeData.length > 0) {
      setMonthlyIncome(incomeData[0].amount);
    } else {
      setMonthlyIncome(0);
    }
  }, [incomeData]);

  const currentMonthExpenses = expenses
    ?.filter(e => format(new Date(e.date), 'yyyy-MM') === currentMonthStr)
    .reduce((acc, e) => acc + e.amount, 0) || 0;

  const currentMonthInstallments = purchases?.reduce((acc, p) => {
    const remainingInstallments = p.totalInstallments - p.installmentsPaid;
    if (remainingInstallments > 0) {
      // This logic assumes an installment is due every month. 
      // A more precise calculation might be needed based on purchaseDate.
      return acc + p.amountPerInstallment;
    }
    return acc;
  }, 0) || 0;
  
  const totalMonthlyCommitments = currentMonthExpenses + currentMonthInstallments;
  const remainingBudget = monthlyIncome - totalMonthlyCommitments;
  
  const daysInMonth = getDaysInMonth(new Date());
  const dailyBudget = remainingBudget > 0 ? remainingBudget / (daysInMonth - new Date().getDate() + 1) : 0;
  const weeklyBudget = dailyBudget * 7;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value);
  }

  const handleSaveIncome = () => {
    if (!firestore) return;
    const incomeId = incomeData && incomeData.length > 0 ? incomeData[0].id : doc(collection(firestore, 'income')).id;
    
    const incomeDocRef = doc(firestore, 'income', incomeId);
    const dataToSave = { id: incomeId, month: currentMonthStr, amount: monthlyIncome };

    setDocumentNonBlocking(incomeDocRef, dataToSave, { merge: true });

    toast({
        title: 'Guardando ingreso...',
        description: `Tu ingreso de ${formatCurrency(monthlyIncome)} para ${format(new Date(), 'MMMM')} está siendo guardado.`,
    });
  };
  
  const isLoading = incomeLoading || expensesLoading || purchasesLoading;

  if (isLoading) {
      return <div>Cargando...</div>
  }

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
            <Input 
              type="number" 
              id="income" 
              placeholder="ej., 450000" 
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
            />
          </div>
          <Button onClick={handleSaveIncome}>Guardar</Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Límite de Gasto Diario</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dailyBudget)}</div>
            <p className="text-xs text-muted-foreground">Gasto diario recomendado.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Límite de Gasto Semanal</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(weeklyBudget)}</div>
            <p className="text-xs text-muted-foreground">Gasto semanal recomendado.</p>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restante este Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-primary-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(remainingBudget)}</div>
            <p className="text-xs text-primary-foreground/70">Después de todos los compromisos conocidos.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
