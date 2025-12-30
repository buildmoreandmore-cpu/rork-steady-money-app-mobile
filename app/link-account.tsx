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
import { Link, Building2, CheckCircle, ArrowLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Colors from '@/constants/colors';
import { feedback } from '@/services/feedback';

// Note: In production, you would use react-native-plaid-link-sdk
// For now, we'll create a placeholder that simulates the flow

export default function LinkAccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLinked, setIsLinked] = useState(false);

  const handleLinkAccount = useCallback(async () => {
    feedback.onButtonPress();
    setIsLoading(true);

    try {
      // Simulate Plaid Link flow
      // In production, this would:
      // 1. Call plaid-create-link-token to get a link token
      // 2. Open Plaid Link SDK with the token
      // 3. On success, call plaid-exchange-token with the public token

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mark as linked
      await AsyncStorage.setItem('accounts_linked', 'true');
      setIsLinked(true);
      feedback.onDecisionConfirmed();

      Alert.alert(
        'Account Linked!',
        'Your bank account has been successfully connected. Your transactions will sync shortly.',
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to link account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

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
            ? 'Your transactions will sync automatically. Scout will analyze your spending and help you reach your goals.'
            : 'Securely link your bank accounts to track spending, see your net worth, and get personalized insights from Scout.'}
        </Text>

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
        {!isLinked && (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLinkAccount}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Connect Bank Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSkip}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>Skip for Now</Text>
            </TouchableOpacity>
          </>
        )}

        {isLinked && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
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
    marginBottom: 32,
    paddingHorizontal: 12,
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
