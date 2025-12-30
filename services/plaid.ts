import { supabase } from './supabase';

const SUPABASE_URL = 'https://lafepahnnxtjqbvebfix.supabase.co';

export interface PlaidAccount {
  id: string;
  name: string;
  mask: string;
  type: string;
  subtype: string;
  balances: {
    available: number | null;
    current: number | null;
  };
}

export interface PlaidTransaction {
  id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name: string | null;
  category: string[];
  pending: boolean;
}

// Create a link token for Plaid Link
export const createLinkToken = async (userId: string): Promise<string> => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/plaid-create-link-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create link token');
  }

  const data = await response.json();
  return data.link_token;
};

// Exchange public token for access token (after user links account)
export const exchangePublicToken = async (publicToken: string, userId: string): Promise<void> => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/plaid-exchange-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({
      public_token: publicToken,
      user_id: userId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to exchange token');
  }
};

// Get linked accounts for a user
export const getLinkedAccounts = async (userId: string): Promise<PlaidAccount[]> => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/plaid-get-accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get accounts');
  }

  const data = await response.json();
  return data.accounts;
};

// Get transactions for a user
export const getTransactions = async (
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<PlaidTransaction[]> => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/plaid-get-transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get transactions');
  }

  const data = await response.json();
  return data.transactions;
};

// Unlink an account
export const unlinkAccount = async (userId: string, itemId: string): Promise<void> => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/plaid-unlink-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({
      user_id: userId,
      item_id: itemId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to unlink account');
  }
};
