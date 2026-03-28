/**
 * Plaid Service
 * Uses supabase.functions.invoke() for proper authentication handling
 */

import { supabase } from './supabase';

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

// Create a link token for Plaid Link
export const createLinkToken = async (): Promise<string> => {
  // Get user ID from session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    throw new Error('Not authenticated - please log in first');
  }

  console.log('Creating link token for user:', session.user.id);

  const { data, error } = await supabase.functions.invoke('plaid-create-link-token', {
    body: { user_id: session.user.id },
  });

  console.log('Link token response:', { data, error });

  if (error) {
    console.error('Plaid create link token error:', error);
    // Extract meaningful error message
    const errorMsg = error.message || 'Failed to create link token';
    throw new Error(errorMsg);
  }

  if (data?.error) {
    console.error('Plaid API error:', data);
    throw new Error(data.error);
  }

  if (!data?.link_token) {
    console.error('No link token in response:', data);
    throw new Error('Unable to connect to Plaid. Please try again.');
  }

  return data.link_token;
};

// Exchange public token for access token (after user links account)
export const exchangePublicToken = async (
  publicToken: string,
  institutionId: string,
  institutionName: string
): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  console.log('Exchanging public token for institution:', institutionName);

  const { data, error } = await supabase.functions.invoke('plaid-exchange-token', {
    body: {
      user_id: session.user.id,
      public_token: publicToken,
      institution_id: institutionId,
      institution_name: institutionName,
    },
  });

  console.log('Exchange token response:', { data, error });

  if (error) {
    console.error('Plaid exchange token error:', error);
    throw new Error(error.message || 'Failed to exchange token');
  }

  if (data?.error) {
    throw new Error(data.error);
  }
};

// Get linked accounts for the current user
export const getLinkedAccounts = async (): Promise<PlaidAccount[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('plaid-get-accounts', {
    body: { user_id: session.user.id },
  });

  if (error) {
    console.error('Plaid get accounts error:', error);
    throw new Error(error.message || 'Failed to get accounts');
  }

  return data?.accounts || [];
};

// Get transactions for the current user
export const getTransactions = async (
  startDate?: string,
  endDate?: string
): Promise<PlaidTransaction[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('plaid-get-transactions', {
    body: {
      user_id: session.user.id,
      start_date: startDate,
      end_date: endDate,
    },
  });

  if (error) {
    console.error('Plaid get transactions error:', error);
    throw new Error(error.message || 'Failed to get transactions');
  }

  return data?.transactions || [];
};

// Unlink an account
export const unlinkAccount = async (itemId: string): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('plaid-unlink-account', {
    body: {
      user_id: session.user.id,
      item_id: itemId,
    },
  });

  if (error) {
    console.error('Plaid unlink account error:', error);
    throw new Error(error.message || 'Failed to unlink account');
  }
};
