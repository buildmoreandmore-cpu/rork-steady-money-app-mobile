import { supabase } from './supabase';

const SUPABASE_URL = 'https://lafepahnnxtjqbvebfix.supabase.co';

export interface PlaidAccount {
  id: string;
  name: string;
  mask: string;
  type: string;
  subtype: string;
  institution_name: string;
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

// Helper to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
};

// Create a link token for Plaid Link
export const createLinkToken = async (): Promise<string> => {
  const headers = await getAuthHeaders();

  const response = await fetch(`${SUPABASE_URL}/functions/v1/plaid-create-link-token`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create link token');
  }

  const data = await response.json();
  return data.link_token;
};

// Exchange public token for access token (after user links account)
export const exchangePublicToken = async (
  publicToken: string,
  institutionId: string,
  institutionName: string
): Promise<void> => {
  const headers = await getAuthHeaders();

  const response = await fetch(`${SUPABASE_URL}/functions/v1/plaid-exchange-token`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      public_token: publicToken,
      institution_id: institutionId,
      institution_name: institutionName,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to exchange token');
  }
};

// Get linked accounts for the current user
export const getLinkedAccounts = async (): Promise<PlaidAccount[]> => {
  const headers = await getAuthHeaders();

  const response = await fetch(`${SUPABASE_URL}/functions/v1/plaid-get-accounts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get accounts');
  }

  const data = await response.json();
  return data.accounts;
};

// Get transactions for the current user
export const getTransactions = async (
  startDate?: string,
  endDate?: string
): Promise<PlaidTransaction[]> => {
  const headers = await getAuthHeaders();

  const response = await fetch(`${SUPABASE_URL}/functions/v1/plaid-get-transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
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
export const unlinkAccount = async (itemId: string): Promise<void> => {
  const headers = await getAuthHeaders();

  const response = await fetch(`${SUPABASE_URL}/functions/v1/plaid-unlink-account`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      item_id: itemId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to unlink account');
  }
};
