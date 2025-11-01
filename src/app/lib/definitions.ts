export type Person = {
  id: string;
  name: string;
  avatar?: string;
};

export type Card = {
  id: string;
  name: string;
  color: string;
};

export type Purchase = {
  id: string;
  description: string;
  cardId: string;
  personId: string;
  amountPerInstallment: number;
  installmentsPaid: number;
  totalInstallments: number;
  purchaseDate: string; // ISO date string
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO date string
};

export type MonthlyIncome = {
  id: string;
  month: string; // YYYY-MM
  amount: number;
};
