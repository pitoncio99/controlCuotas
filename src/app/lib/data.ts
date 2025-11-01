import type { Person, Card, Purchase, Expense, MonthlyIncome } from './definitions';

export const people: Person[] = [
  { id: '1', name: 'Alex Johnson', avatar: 'https://picsum.photos/seed/user1/100/100' },
  { id: '2', name: 'Maria Garcia', avatar: 'https://picsum.photos/seed/user2/100/100' },
  { id: '3', name: 'James Smith', avatar: 'https://picsum.photos/seed/user3/100/100' },
  { id: '4', name: 'Shared', avatar: 'https://picsum.photos/seed/user4/100/100' },
];

export const cards: Card[] = [
  { id: '1', name: 'Visa Gold', color: '#FFD700' },
  { id: '2', name: 'Mastercard Black', color: '#333333' },
  { id: '3', name: 'Amex Platinum', color: '#C0C0C0' },
];

export const purchases: Purchase[] = [
  {
    id: '1',
    description: 'New Laptop',
    cardId: '2',
    personId: '1',
    amountPerInstallment: 150.0,
    installmentsPaid: 5,
    totalInstallments: 12,
    paymentDay: 10,
    purchaseDate: '2024-02-15T10:00:00Z',
  },
  {
    id: '2',
    description: 'Smartphone',
    cardId: '1',
    personId: '2',
    amountPerInstallment: 80.5,
    installmentsPaid: 10,
    totalInstallments: 18,
    paymentDay: 25,
    purchaseDate: '2023-09-20T10:00:00Z',
  },
  {
    id: '3',
    description: 'Groceries Store Annual',
    cardId: '3',
    personId: '4',
    amountPerInstallment: 50.0,
    installmentsPaid: 1,
    totalInstallments: 6,
    paymentDay: 5,
    purchaseDate: '2024-06-01T10:00:00Z',
  },
  {
    id: '4',
    description: 'Flight Tickets',
    cardId: '2',
    personId: '3',
    amountPerInstallment: 250.0,
    installmentsPaid: 2,
    totalInstallments: 3,
    paymentDay: 15,
    purchaseDate: '2024-05-10T10:00:00Z',
  },
];

export const expenses: Expense[] = [
    { id: '1', description: 'Netflix Subscription', cardId: '1', amount: 15.99, date: '2024-07-01T10:00:00Z' },
    { id: '2', description: 'Gasoline', cardId: '2', amount: 55.20, date: '2024-07-03T10:00:00Z' },
    { id: '3', description: 'Dinner with friends', cardId: '3', amount: 120.00, date: '2024-07-05T10:00:00Z' },
];


export const income: MonthlyIncome[] = [
    { id: '1', month: '2024-07', amount: 4500 },
];
