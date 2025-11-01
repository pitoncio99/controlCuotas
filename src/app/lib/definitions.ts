export type Person = {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
};

export type Card = {
  id: string;
  name: string;
  color: string;
};

export type PurchaseInstallment = {
  id: string;
  description: string;
  cardId: string;
  personId: string;
  installmentAmount: number;
  paidInstallments: number;
  totalInstallments: number;
  paymentDeadline: string; // ISO date string
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO date string
  cardId?: string; 
};

export type MonthlyIncome = {
  id: string;
  month: string; // YYYY-MM
  amount: number;
  date?: string;
  description?: string;
};
