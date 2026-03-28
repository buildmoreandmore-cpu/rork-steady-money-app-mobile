import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Link, Building2, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Colors from '@/constants/colors';
import { feedback } from '@/services/feedback';
import { createLinkToken, exchangePublicToken, getLinkedAccounts } from '@/services/plaid';

// Plaid SDK types (for type safety when module is available)
type PlaidLinkSuccess = {
  publicToken: string;
  metadata: {
    institution?: {
      id: string;
      name: string;
    };
  };
};

type PlaidLinkExit = {
  error?: {
    displayMessage?: string;
  };
};

// Dynamic Plaid module reference
let PlaidModule: any = null;
let isPlaidChecked = false;
let isPlaidAvailable = false;

const checkPlaidAvailable = async (): Promise<boolean> => {
  if (isPlaidChecked) {
    return isPlaidAvailable;
  }

  try {
    PlaidModule = await import('react-native-plaid-link-sdk');
    isPlaidAvailable = true;
  } catch (e) {
    console.log('Plaid SDK not available (expected in Expo Go/Rork):', e);
    isPlaidAvailable = false;
  }

  isPlaidChecked = true;
  return isPlaidAvailable;
};

export default function LinkAccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [linkedAccountsCount, setLinkedAccountsCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkExistingAccounts();
  }, []);

  const checkExistingAccounts = async () => {
    try {
      const accounts = await getLinkedAccounts();
      if (accounts && accounts.length > 0) {
        setLinkedAccountsCount(accounts.length);
        setIsLinked(true);
      }
    } catch (err) {
      // No accounts linked yet, that's fine
    }
  };

  const handleSuccess = useCallback(async (success: PlaidLinkSuccess) => {
    console.log('Plaid Link Success:', success);
    feedback.onDecisionConfirmed();
    setIsLoading(true);

    try {
      // Exchange public token for access token
      await exchangePublicToken(
        success.publicToken,
        success.metadata.institution?.id || '',
        success.metadata.institution?.name || ''
      );

      // Mark as linked
      await AsyncStorage.setItem('accounts_linked', 'true');
      setIsLinked(true);
      setLinkedAccountsCount(prev => prev + 1);

      Alert.alert(
        'Account Linked!',
        `Your ${success.metadata.institution?.name || 'bank'} account has been successfully connected. Your transactions will sync shortly.`,
        [
          {
            text: 'Link Another',
            onPress: () => setIsLoading(false),
          },
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (exchangeError: any) {
      console.error('Token exchange error:', exchangeError);
      setError('Failed to connect account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const handleExit = useCallback((exit: PlaidLinkExit) => {
    console.log('Plaid Link Exit:', exit);
    setIsLoading(false);

    if (exit.error) {
      setError(exit.error.displayMessage || 'Connection was cancelled');
    }
  }, []);

  const handleLinkAccount = useCallback(async () => {
    feedback.onButtonPress();
    setIsLoading(true);
    setError(null);

    // Check if Plaid SDK is available
    const plaidAvailable = await checkPlaidAvailable();

    if (!plaidAvailable) {
      setIsLoading(false);
      Alert.alert(
        'Development Build Required',
        'Bank account linking requires a custom development build with native modules. The core app features work without it.\n\nTo enable bank linking, create a development build using EAS Build.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Get link token from backend
      const linkToken = await createLinkToken();

      if (!linkToken) {
        throw new Error('Failed to create link token');
      }

      // Create Plaid Link with token
      PlaidModule.create({ token: linkToken });

      // Open Plaid Link with callbacks
      PlaidModule.open({
        onSuccess: handleSuccess,
        onExit: handleExit,
      });
    } catch (err: any) {
      console.error('Error starting Plaid Link:', err);
      setError(err.message || 'Failed to initialize bank connection');
      setIsLoading(false);
    }
  }, [handleSuccess, handleExit]);

  const handleSkip = useCallback(() => {
    feedback.onButtonPress();
    Alert.alert(
      'Skip Account Linking?',
      'You can link your accounts later from the Manage tab. Some features will be limited without linked accounts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip for Now',
          onPress: () => router.replace('/(tabs)'),
        },
      ]
    );
  }, [router]);

  const handleBack = useCallback(() => {
    feedback.onButtonPress();
    router.back();
  }, [router]);

  const handleContinue = useCallback(() => {
    feedback.onButtonPress();
    router.replace('/(tabs)');
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {isLinked ? (
            <CheckCircle size={64} color={Colors.success} />
          ) : (
            <Building2 size={64} color={Colors.primary} />
          )}
        </View>

        <Text style={styles.title}>
          {isLinked ? 'Account Connected!' : 'Connect Your Bank'}
        </Text>

        <Text style={styles.description}>
          {isLinked
            ? `${linkedAccountsCount} account${linkedAccountsCount > 1 ? 's' : ''} connected. Your transactions will sync automatically. Scout will analyze your spending and help you reach your goals.`
            : 'Securely link your bank accounts to track spending, see your net worth, and get personalized insights from Scout.'}
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={20} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Link size={20} color={Colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Bank-Level Security</Text>
              <Text style={styles.featureDescription}>
                256-bit encryption protects your data
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Building2 size={20} color={Colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>10,000+ Institutions</Text>
              <Text style={styles.featureDescription}>
                Connect most US banks and credit unions
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <CheckCircle size={20} color={Colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Read-Only Access</Text>
              <Text style={styles.featureDescription}>
                We can never move your money
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={isLinked ? handleContinue : handleLinkAccount}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {isLinked ? 'Go to Dashboard' : 'Connect Bank Account'}
            </Text>
          )}
        </TouchableOpacity>

        {isLinked && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleLinkAccount}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>Link Another Account</Text>
          </TouchableOpacity>
        )}

        {!isLinked && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSkip}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.disclaimer}>
          By connecting, you agree to Plaid&apos;s privacy policy and terms of service.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${Colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.error}15`,
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    flex: 1,
  },
  features: {
    width: '100%',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
});
