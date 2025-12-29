export interface Transaction {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
  type: 'expense' | 'income';
  icon: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  nextBilling: string;
  category: string;
  hoursUsed?: number;
  lastUsed?: string;
  icon: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  isAutoPay: boolean;
  icon: string;
}

export interface ScoutAction {
  id: string;
  title: string;
  description: string;
  type: 'review' | 'save' | 'optimize' | 'celebrate';
  potentialSavings?: number;
  priority: 'high' | 'medium' | 'low';
}

export interface FinancialSnapshot {
  netWorth: number;
  netWorthChange: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
}

export interface Projection {
  debtFreeDate: string;
  emergencyFundDate: string;
  monthlyBreathingRoom: number;
}

export interface TimelinePoint {
  date: string;
  label: string;
  netWorth: number;
  isFuture: boolean;
}

export interface Profile {
  id: string;
  name: string;
  type: 'personal' | 'partner' | 'family' | 'business';
  isActive: boolean;
}
