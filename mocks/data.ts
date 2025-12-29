import { Transaction, Subscription, Bill, ScoutAction, FinancialSnapshot, TimelinePoint, Profile } from '@/types';

export const mockSnapshot: FinancialSnapshot = {
  netWorth: 47250,
  netWorthChange: 1847,
  monthlyIncome: 6200,
  monthlyExpenses: 4350,
  savingsRate: 29.8,
};

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    merchant: 'Whole Foods',
    category: 'Groceries',
    amount: 127.43,
    date: '2024-12-28',
    type: 'expense',
    icon: 'shopping-cart',
  },
  {
    id: '2',
    merchant: 'Spotify',
    category: 'Subscriptions',
    amount: 10.99,
    date: '2024-12-28',
    type: 'expense',
    icon: 'music',
  },
  {
    id: '3',
    merchant: 'Direct Deposit',
    category: 'Income',
    amount: 3100.00,
    date: '2024-12-27',
    type: 'income',
    icon: 'briefcase',
  },
  {
    id: '4',
    merchant: 'Shell Gas',
    category: 'Transportation',
    amount: 52.18,
    date: '2024-12-27',
    type: 'expense',
    icon: 'fuel',
  },
  {
    id: '5',
    merchant: 'Amazon',
    category: 'Shopping',
    amount: 89.99,
    date: '2024-12-26',
    type: 'expense',
    icon: 'package',
  },
];

export const mockSubscriptions: Subscription[] = [
  {
    id: '1',
    name: 'Netflix',
    amount: 15.99,
    billingCycle: 'monthly',
    nextBilling: '2025-01-15',
    category: 'Entertainment',
    hoursUsed: 12,
    icon: 'tv',
  },
  {
    id: '2',
    name: 'Spotify',
    amount: 10.99,
    billingCycle: 'monthly',
    nextBilling: '2025-01-03',
    category: 'Entertainment',
    hoursUsed: 45,
    icon: 'music',
  },
  {
    id: '3',
    name: 'Hulu',
    amount: 17.99,
    billingCycle: 'monthly',
    nextBilling: '2025-01-08',
    category: 'Entertainment',
    hoursUsed: 0,
    lastUsed: '6 weeks ago',
    icon: 'tv',
  },
  {
    id: '4',
    name: 'iCloud+',
    amount: 2.99,
    billingCycle: 'monthly',
    nextBilling: '2025-01-20',
    category: 'Productivity',
    icon: 'cloud',
  },
  {
    id: '5',
    name: 'Gym Membership',
    amount: 49.99,
    billingCycle: 'monthly',
    nextBilling: '2025-01-01',
    category: 'Health',
    icon: 'dumbbell',
  },
];

export const mockBills: Bill[] = [
  {
    id: '1',
    name: 'Rent',
    amount: 1850,
    dueDate: '2025-01-01',
    isPaid: false,
    isAutoPay: true,
    icon: 'home',
  },
  {
    id: '2',
    name: 'Electric',
    amount: 142,
    dueDate: '2025-01-05',
    isPaid: false,
    isAutoPay: false,
    icon: 'zap',
  },
  {
    id: '3',
    name: 'Car Insurance',
    amount: 167,
    dueDate: '2025-01-10',
    isPaid: false,
    isAutoPay: true,
    icon: 'car',
  },
  {
    id: '4',
    name: 'Internet',
    amount: 79,
    dueDate: '2025-01-12',
    isPaid: false,
    isAutoPay: true,
    icon: 'wifi',
  },
];

export const mockScoutActions: ScoutAction[] = [
  {
    id: '1',
    title: 'Review your car insurance before renewal',
    description: 'Your policy renews in 12 days. Comparing quotes could save you up to $340/year.',
    type: 'review',
    potentialSavings: 340,
    priority: 'high',
  },
  {
    id: '2',
    title: 'Pause your Hulu subscription',
    description: "You haven't opened Hulu in 6 weeks. Pause it? You can always restart.",
    type: 'optimize',
    potentialSavings: 215.88,
    priority: 'medium',
  },
  {
    id: '3',
    title: "You've been consistent for 8 weeks",
    description: "That's rare—most people aren't. Your savings rate is up 4% since you started.",
    type: 'celebrate',
    priority: 'low',
  },
];

export const mockTimeline: TimelinePoint[] = [
  { date: '6 months ago', label: 'Jul 2024', netWorth: 38200, isFuture: false },
  { date: '3 months ago', label: 'Oct 2024', netWorth: 42800, isFuture: false },
  { date: 'Today', label: 'Dec 2024', netWorth: 47250, isFuture: false },
  { date: '3 months', label: 'Mar 2025', netWorth: 52100, isFuture: true },
  { date: '6 months', label: 'Jun 2025', netWorth: 57400, isFuture: true },
  { date: '1 year', label: 'Dec 2025', netWorth: 68200, isFuture: true },
];

export const mockProfiles: Profile[] = [
  { id: '1', name: 'Personal', type: 'personal', isActive: true },
  { id: '2', name: 'Side Business', type: 'business', isActive: false },
];

export const scoutGreetings = [
  "Quick question: Would you rather build savings faster or pay down your card?",
  "I noticed something interesting about your subscriptions...",
  "At your current pace, here's where you'll be in 6 months.",
  "You've been consistent for 8 weeks. That's rare—most people aren't.",
];

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};
