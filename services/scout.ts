/**
 * Scout AI Service
 *
 * Scout is your personal financial advisor that:
 * - Analyzes spending patterns
 * - Provides actionable recommendations
 * - Answers financial questions
 * - Helps with budgeting decisions
 */

import { supabase } from './supabase';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ScoutContext {
  // Financial snapshot
  netWorth?: number;
  netWorthChange?: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  savingsRate?: number;

  // Transactions
  recentTransactions?: {
    merchant: string;
    amount: number;
    category: string;
    type: string;
  }[];

  // Subscriptions
  subscriptions?: {
    name: string;
    amount: number;
    hoursUsed?: number;
    lastUsed?: string;
  }[];

  // Bills
  bills?: {
    name: string;
    amount: number;
    dueDate: string;
    isAutoPay: boolean;
  }[];

  // Goals
  goals?: {
    name: string;
    target: number;
    current: number;
  }[];

  // Budget allocations
  budget?: {
    fixedPercent: number;
    strategicPercent: number;
    lifestylePercent: number;
  };

  // Timeline/Net worth history
  timeline?: {
    label: string;
    netWorth: number;
    isFuture: boolean;
  }[];

  // Profiles
  profiles?: {
    name: string;
    type: string;
    balance: number;
    isActive: boolean;
  }[];
}

const SCOUT_SYSTEM_PROMPT = `You are Scout, a friendly and knowledgeable personal financial advisor in the Steady Money app. Your personality:

- Warm, encouraging, and non-judgmental about money
- Focus on small wins and actionable next steps
- Never shame users about spending habits
- Celebrate progress, no matter how small
- Use simple language, avoid financial jargon
- Be concise - mobile users prefer shorter responses
- When relevant, suggest specific actions they can take in the app

Your capabilities:
- Analyze spending patterns and find savings opportunities
- Help users understand if they can afford purchases
- Provide budgeting advice
- Explain financial concepts simply
- Help prioritize debt payoff vs savings
- Find subscriptions that might be worth canceling

Always maintain a positive, supportive tone. If you don't have specific data about the user's finances, ask clarifying questions or provide general guidance.`;

class ScoutService {
  private conversationHistory: ChatMessage[] = [];
  private context: ScoutContext = {};

  setContext(context: ScoutContext) {
    this.context = context;
  }

  getConversationHistory(): ChatMessage[] {
    return this.conversationHistory;
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  private buildContextMessage(): string {
    const parts: string[] = [];

    // Financial Snapshot
    if (this.context.netWorth !== undefined) {
      parts.push(`Current net worth: $${this.context.netWorth.toLocaleString()}`);
    }
    if (this.context.netWorthChange !== undefined) {
      const sign = this.context.netWorthChange >= 0 ? '+' : '';
      parts.push(`Net worth change this month: ${sign}$${this.context.netWorthChange.toLocaleString()}`);
    }
    if (this.context.monthlyIncome !== undefined) {
      parts.push(`Monthly income: $${this.context.monthlyIncome.toLocaleString()}`);
    }
    if (this.context.monthlyExpenses !== undefined) {
      parts.push(`Monthly expenses: $${this.context.monthlyExpenses.toLocaleString()}`);
    }
    if (this.context.savingsRate !== undefined) {
      parts.push(`Savings rate: ${this.context.savingsRate.toFixed(1)}%`);
    }

    // Budget Allocations
    if (this.context.budget) {
      parts.push(`\nBudget allocation: ${this.context.budget.fixedPercent}% fixed (needs), ${this.context.budget.strategicPercent}% strategic (savings/debt), ${this.context.budget.lifestylePercent}% lifestyle (wants)`);
    }

    // Recent Transactions
    if (this.context.recentTransactions?.length) {
      const txSummary = this.context.recentTransactions
        .map(tx => `${tx.merchant} (${tx.category}): ${tx.type === 'income' ? '+' : '-'}$${Math.abs(tx.amount)}`)
        .join(', ');
      parts.push(`\nRecent transactions: ${txSummary}`);
    }

    // Subscriptions
    if (this.context.subscriptions?.length) {
      const subDetails = this.context.subscriptions.map(s => {
        const usage = s.hoursUsed !== undefined ? ` - ${s.hoursUsed}h used` : '';
        const lastUsed = s.lastUsed ? ` (last used: ${s.lastUsed})` : '';
        return `${s.name}: $${s.amount}/mo${usage}${lastUsed}`;
      }).join(', ');
      parts.push(`\nSubscriptions: ${subDetails}`);

      // Highlight unused subscriptions
      const unusedSubs = this.context.subscriptions.filter(s => s.hoursUsed === 0 || s.lastUsed);
      if (unusedSubs.length > 0) {
        parts.push(`⚠️ Potentially unused subscriptions: ${unusedSubs.map(s => s.name).join(', ')}`);
      }
    }

    // Bills
    if (this.context.bills?.length) {
      const billDetails = this.context.bills.map(b => {
        const autoPay = b.isAutoPay ? ' (auto-pay)' : '';
        return `${b.name}: $${b.amount} due ${b.dueDate}${autoPay}`;
      }).join(', ');
      parts.push(`\nUpcoming bills: ${billDetails}`);
    }

    // Goals
    if (this.context.goals?.length) {
      const goalDetails = this.context.goals.map(g => {
        const progress = ((g.current / g.target) * 100).toFixed(0);
        return `${g.name}: $${g.current.toLocaleString()}/$${g.target.toLocaleString()} (${progress}%)`;
      }).join(', ');
      parts.push(`\nGoals: ${goalDetails}`);
    }

    // Timeline
    if (this.context.timeline?.length) {
      const past = this.context.timeline.filter(t => !t.isFuture);
      const future = this.context.timeline.filter(t => t.isFuture);

      if (past.length > 0) {
        const pastSummary = past.map(t => `${t.label}: $${t.netWorth.toLocaleString()}`).join(' → ');
        parts.push(`\nNet worth history: ${pastSummary}`);
      }
      if (future.length > 0) {
        const futureSummary = future.map(t => `${t.label}: $${t.netWorth.toLocaleString()}`).join(' → ');
        parts.push(`Projected: ${futureSummary}`);
      }
    }

    // Profiles
    if (this.context.profiles?.length) {
      const activeProfile = this.context.profiles.find(p => p.isActive);
      if (activeProfile) {
        parts.push(`\nActive profile: ${activeProfile.name} (${activeProfile.type})`);
      }
      const totalAcrossProfiles = this.context.profiles.reduce((sum, p) => sum + p.balance, 0);
      parts.push(`Total across all profiles: $${totalAcrossProfiles.toLocaleString()}`);
    }

    return parts.length > 0
      ? `\n\nUser's complete financial dashboard:\n${parts.join('\n')}`
      : '';
  }

  async sendMessage(userMessage: string): Promise<string> {
    // Add user message to history with unique ID
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    this.conversationHistory.push(userMsg);

    try {
      // Call Supabase Edge Function for AI response
      const { data, error } = await supabase.functions.invoke('scout-chat', {
        body: {
          message: userMessage,
          history: this.conversationHistory.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
          context: this.buildContextMessage(),
          systemPrompt: SCOUT_SYSTEM_PROMPT,
        },
      });

      if (error) {
        console.error('Scout API error:', error);
        throw new Error('Failed to get response from Scout');
      }

      const assistantMessage = data?.message || this.getFallbackResponse(userMessage);

      // Add assistant message to history with unique ID
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date(),
      };
      this.conversationHistory.push(assistantMsg);

      return assistantMessage;
    } catch (error) {
      console.error('Scout service error:', error);
      // Return a helpful fallback response
      const fallback = this.getFallbackResponse(userMessage);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        role: 'assistant',
        content: fallback,
        timestamp: new Date(),
      };
      this.conversationHistory.push(assistantMsg);

      return fallback;
    }
  }

  private getFallbackResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    // Contextual fallback responses
    if (lowerMessage.includes('afford') || lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
      return "To help you figure out if you can afford something, I'd need to look at your current budget and savings. Try linking your bank account in the Manage tab so I can give you a personalized answer!\n\nAs a general rule: if it's not in your budget and you'd need to use credit, it might be worth waiting.";
    }

    if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
      return "Great that you're thinking about saving! Here are some quick wins:\n\n1. Check the Manage tab for unused subscriptions\n2. Use the Decide tab to set your budget allocation\n3. Try the 24-hour rule for non-essential purchases\n\nWant me to help you set a specific savings goal?";
    }

    if (lowerMessage.includes('budget') || lowerMessage.includes('spending')) {
      return "I recommend the 50/30/20 approach:\n\n• 50% for needs (rent, food, bills)\n• 30% for wants (entertainment, dining out)\n• 20% for savings & debt payoff\n\nHead to the Decide tab to set up your personalized budget allocations!";
    }

    if (lowerMessage.includes('debt') || lowerMessage.includes('loan') || lowerMessage.includes('credit')) {
      return "Debt can feel overwhelming, but you've got options:\n\n1. **Avalanche method**: Pay minimums on everything, put extra toward highest interest rate\n2. **Snowball method**: Pay off smallest balances first for quick wins\n\nWhich approach sounds more motivating to you?";
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hey there! I'm Scout, your financial sidekick. I'm here to help you make sense of your money and find easy wins.\n\nWhat's on your mind today? I can help with:\n• Budgeting questions\n• \"Can I afford this?\" decisions\n• Finding money to save\n• Understanding your spending";
    }

    // Default response
    return "I'm here to help with your finances! While I'm getting set up with your full financial picture, I can still offer general guidance.\n\nTry asking me about:\n• Budgeting strategies\n• Saving tips\n• Whether you can afford a purchase\n• How to tackle debt\n\nWhat would you like to explore?";
  }
}

export const scoutService = new ScoutService();
