/**
 * Data Service
 * Handles all Supabase data operations - NO MOCK DATA
 * Returns empty/zero values when no real data exists
 */

import { supabase } from './supabase';

// Types
export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billing_cycle: string;
  next_billing_date?: string;
  category?: string;
  is_active: boolean;
  hours_used?: number;
  last_used_at?: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  due_day: number;
  category?: string;
  is_auto_pay: boolean;
  is_negotiable: boolean;
  potential_savings?: number;
  success_rate?: number;
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  category: string;
  priority: number;
  is_completed: boolean;
}

export interface NetWorthSnapshot {
  id: string;
  date: string;
  net_worth: number;
  total_assets: number;
  total_liabilities: number;
  monthly_income?: number;
  monthly_expenses?: number;
}

export interface UserSettings {
  money_goal?: string;
  tracking_method?: string;
  profile_type?: string;
  budget_fixed_percent: number;
  budget_strategic_percent: number;
  budget_lifestyle_percent: number;
  biometric_enabled: boolean;
  notifications_enabled: boolean;
}

export interface FinancialSnapshot {
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netWorthChange: number;
}

// Empty/default values - NO MOCK DATA
const emptySnapshot: FinancialSnapshot = {
  netWorth: 0,
  monthlyIncome: 0,
  monthlyExpenses: 0,
  netWorthChange: 0,
};

class DataService {
  // Check if user has real data
  async hasRealData(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { count } = await supabase
        .from('net_worth_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      return (count ?? 0) > 0;
    } catch {
      return false;
    }
  }

  // Financial Snapshot - returns zeros if no data
  async getFinancialSnapshot(): Promise<FinancialSnapshot> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in, returning empty snapshot');
        return emptySnapshot;
      }

      const { data, error } = await supabase
        .from('net_worth_history')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(2);

      if (error) {
        console.error('Error fetching financial snapshot:', error);
        return emptySnapshot;
      }

      if (!data?.length) {
        console.log('No financial data found, returning empty snapshot');
        return emptySnapshot;
      }

      const current = data[0];
      const previous = data[1];

      return {
        netWorth: current.net_worth,
        monthlyIncome: current.monthly_income ?? 0,
        monthlyExpenses: current.monthly_expenses ?? 0,
        netWorthChange: previous ? current.net_worth - previous.net_worth : 0,
      };
    } catch (err) {
      console.error('Exception in getFinancialSnapshot:', err);
      return emptySnapshot;
    }
  }

  // Subscriptions - returns empty array if no data
  async getSubscriptions(): Promise<Subscription[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('amount', { ascending: false });

      if (error) {
        console.error('Error fetching subscriptions:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Exception in getSubscriptions:', err);
      return [];
    }
  }

  async addSubscription(subscription: Omit<Subscription, 'id'>): Promise<Subscription | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({ ...subscription, user_id: user.id })
        .select()
        .single();

      return error ? null : data;
    } catch {
      return null;
    }
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  }

  async deleteSubscription(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  }

  // Bills - returns empty array if no data
  async getBills(): Promise<Bill[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .order('due_day', { ascending: true });

      if (error) {
        console.error('Error fetching bills:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Exception in getBills:', err);
      return [];
    }
  }

  async addBill(bill: Omit<Bill, 'id'>): Promise<Bill | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('bills')
        .insert({ ...bill, user_id: user.id })
        .select()
        .single();

      return error ? null : data;
    } catch {
      return null;
    }
  }

  // Goals - returns empty array if no data
  async getGoals(): Promise<Goal[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });

      if (error) {
        console.error('Error fetching goals:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Exception in getGoals:', err);
      return [];
    }
  }

  async addGoal(goal: Omit<Goal, 'id'>): Promise<Goal | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('goals')
        .insert({ ...goal, user_id: user.id })
        .select()
        .single();

      return error ? null : data;
    } catch {
      return null;
    }
  }

  async updateGoalProgress(id: string, currentAmount: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('goals')
        .update({
          current_amount: currentAmount,
          updated_at: new Date().toISOString(),
          is_completed: false,
        })
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  }

  // Net Worth History / Timeline - returns empty array if no data
  async getNetWorthHistory(): Promise<NetWorthSnapshot[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('net_worth_history')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching net worth history:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Exception in getNetWorthHistory:', err);
      return [];
    }
  }

  async addNetWorthSnapshot(snapshot: Omit<NetWorthSnapshot, 'id'>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('net_worth_history')
        .insert({ ...snapshot, user_id: user.id });

      return !error;
    } catch {
      return false;
    }
  }

  // User Settings
  async getUserSettings(): Promise<UserSettings | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Return defaults if no settings exist
        return {
          budget_fixed_percent: 50,
          budget_strategic_percent: 20,
          budget_lifestyle_percent: 30,
          biometric_enabled: false,
          notifications_enabled: true,
        };
      }

      return data;
    } catch {
      return null;
    }
  }

  async saveUserSettings(settings: Partial<UserSettings>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        });

      return !error;
    } catch {
      return false;
    }
  }

  // Transactions (from Plaid or manual) - returns empty array if no data
  async getRecentTransactions(limit = 10) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Exception in getRecentTransactions:', err);
      return [];
    }
  }

  // Scout Actions - returns empty array if no data
  async getScoutActions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('scout_actions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .eq('is_dismissed', false)
        .order('priority', { ascending: true })
        .limit(5);

      if (error) {
        console.error('Error fetching scout actions:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Exception in getScoutActions:', err);
      return [];
    }
  }

  async completeScoutAction(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scout_actions')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  }

  async dismissScoutAction(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scout_actions')
        .update({ is_dismissed: true })
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  }
}

export const dataService = new DataService();
