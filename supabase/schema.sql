-- Steady Money Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plaid Items (linked bank connections)
CREATE TABLE IF NOT EXISTS public.plaid_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  institution_id TEXT,
  institution_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plaid Accounts
CREATE TABLE IF NOT EXISTS public.plaid_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_item_id UUID REFERENCES public.plaid_items(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL UNIQUE,
  name TEXT,
  mask TEXT,
  type TEXT,
  subtype TEXT,
  balance_available DECIMAL(12,2),
  balance_current DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions cache
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_account_id UUID REFERENCES public.plaid_accounts(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL UNIQUE,
  amount DECIMAL(12,2),
  date DATE,
  name TEXT,
  merchant_name TEXT,
  category TEXT[],
  pending BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own plaid items" ON public.plaid_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plaid items" ON public.plaid_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own plaid items" ON public.plaid_items
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own accounts" ON public.plaid_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User Settings & Preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  money_goal TEXT, -- spend_less, afford_check, stop_worrying, feel_control
  tracking_method TEXT, -- link_accounts, manual, mix_both
  profile_type TEXT, -- just_me, partner, family, side_business, all
  budget_fixed_percent INTEGER DEFAULT 50,
  budget_strategic_percent INTEGER DEFAULT 20,
  budget_lifestyle_percent INTEGER DEFAULT 30,
  biometric_enabled BOOLEAN DEFAULT FALSE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Manual Subscriptions (user-added or detected)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  billing_cycle TEXT DEFAULT 'monthly', -- monthly, yearly, weekly
  next_billing_date DATE,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  hours_used DECIMAL(5,1) DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bills (recurring payments)
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_day INTEGER, -- day of month (1-31)
  category TEXT,
  is_auto_pay BOOLEAN DEFAULT FALSE,
  is_negotiable BOOLEAN DEFAULT FALSE,
  potential_savings DECIMAL(10,2),
  success_rate INTEGER, -- percentage
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial Goals
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0,
  target_date DATE,
  category TEXT, -- emergency_fund, debt_payoff, savings, investment
  priority INTEGER DEFAULT 1,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Net Worth Snapshots (for timeline/journey)
CREATE TABLE IF NOT EXISTS public.net_worth_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_assets DECIMAL(12,2) DEFAULT 0,
  total_liabilities DECIMAL(12,2) DEFAULT 0,
  net_worth DECIMAL(12,2) DEFAULT 0,
  monthly_income DECIMAL(12,2),
  monthly_expenses DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scout Chat History
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- user, assistant
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scout Actions/Recommendations
CREATE TABLE IF NOT EXISTS public.scout_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- review, optimize, celebrate, reminder
  title TEXT NOT NULL,
  description TEXT,
  potential_savings DECIMAL(10,2),
  priority INTEGER DEFAULT 1,
  is_completed BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS on new tables
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.net_worth_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scout_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Users can manage own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own subscriptions" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bills" ON public.bills
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own goals" ON public.goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own net worth history" ON public.net_worth_history
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own chat history" ON public.chat_history
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own scout actions" ON public.scout_actions
  FOR ALL USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_net_worth_user_date ON public.net_worth_history(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_date ON public.chat_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scout_actions_user_priority ON public.scout_actions(user_id, priority, is_completed);
