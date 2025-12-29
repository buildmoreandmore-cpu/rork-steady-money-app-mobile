import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Sparkles,
  ShoppingCart,
  Music,
  Briefcase,
  Fuel,
  Package,
  Clock,
} from 'lucide-react-native';
import { feedback } from '@/services/feedback';

import Colors from '@/constants/colors';
import {
  mockSnapshot,
  mockTransactions,
  mockScoutActions,
  getGreeting,
} from '@/mocks/data';

const iconMap: Record<string, React.ReactNode> = {
  'shopping-cart': <ShoppingCart size={18} color={Colors.textSecondary} />,
  'music': <Music size={18} color={Colors.textSecondary} />,
  'briefcase': <Briefcase size={18} color={Colors.textSecondary} />,
  'fuel': <Fuel size={18} color={Colors.textSecondary} />,
  'package': <Package size={18} color={Colors.textSecondary} />,
};

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const [reminderSet, setReminderSet] = useState(false);

  const currentAction = mockScoutActions[0];

  const handleRemindLater = useCallback(() => {
    feedback.onButtonPress();
    setReminderSet(true);
    Alert.alert(
      'Reminder Set',
      'We\'ll remind you about this tomorrow morning.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleTransactionPress = useCallback((transaction: typeof mockTransactions[0]) => {
    feedback.onButtonPress();
    Alert.alert(
      transaction.merchant,
      `${transaction.category}\nAmount: $${transaction.amount.toFixed(2)}\n\nTransaction details coming soon!`,
      [{ text: 'OK' }]
    );
  }, []);

  const handleSeeAllTransactions = useCallback(() => {
    feedback.onButtonPress();
    // Navigate to full transaction list (for now show alert)
    Alert.alert(
      'All Transactions',
      'Full transaction history coming soon!',
      [{ text: 'OK' }]
    );
  }, []);

  const handleActionPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.97,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push('/action-detail');
    });
  }, [router, scaleValue]);

  const formatCurrency = (amount: number, showSign = false): string => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
    
    if (showSign && amount > 0) return `+${formatted}`;
    if (amount < 0) return `-${formatted}`;
    return formatted;
  };

  const formatTransactionAmount = (amount: number, type: string): string => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
    return type === 'income' ? `+${formatted}` : `-${formatted}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}, Francis</Text>
          <View style={styles.dateContainer}>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.snapshotCard} activeOpacity={0.8}>
          <View style={styles.snapshotHeader}>
            <Text style={styles.snapshotLabel}>Your Snapshot</Text>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </View>
          <Text style={styles.netWorth}>
            {formatCurrency(mockSnapshot.netWorth)}
          </Text>
          <View style={styles.changeContainer}>
            {mockSnapshot.netWorthChange > 0 ? (
              <TrendingUp size={16} color={Colors.success} />
            ) : (
              <TrendingDown size={16} color={Colors.alert} />
            )}
            <Text
              style={[
                styles.changeText,
                {
                  color:
                    mockSnapshot.netWorthChange > 0
                      ? Colors.success
                      : Colors.alert,
                },
              ]}
            >
              {formatCurrency(mockSnapshot.netWorthChange, true)} this month
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.scoutSection}>
          <View style={styles.scoutHeader}>
            <View style={styles.scoutTitleRow}>
              <Sparkles size={18} color={Colors.primary} />
              <Text style={styles.scoutTitle}>Scout&apos;s Pick for Today</Text>
            </View>
          </View>

          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleActionPress}
              activeOpacity={0.9}
            >
              <View style={styles.actionBadge}>
                <Text style={styles.actionBadgeText}>
                  {currentAction.type.charAt(0).toUpperCase() +
                    currentAction.type.slice(1)}
                </Text>
              </View>
              <Text style={styles.actionTitle}>{currentAction.title}</Text>
              <Text style={styles.actionDescription}>
                {currentAction.description}
              </Text>
              {currentAction.potentialSavings && (
                <View style={styles.savingsRow}>
                  <Text style={styles.savingsLabel}>Potential savings:</Text>
                  <Text style={styles.savingsAmount}>
                    {formatCurrency(currentAction.potentialSavings)}/yr
                  </Text>
                </View>
              )}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleActionPress}
                >
                  <Text style={styles.primaryButtonText}>Do it now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, reminderSet && styles.secondaryButtonActive]}
                  onPress={handleRemindLater}
                >
                  {reminderSet && <Clock size={14} color={Colors.primary} style={{ marginRight: 4 }} />}
                  <Text style={[styles.secondaryButtonText, reminderSet && styles.secondaryButtonTextActive]}>
                    {reminderSet ? 'Reminder set' : 'Remind me later'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.flowSection}>
          <View style={styles.flowHeader}>
            <Text style={styles.flowTitle}>Recent Flow</Text>
            <TouchableOpacity onPress={handleSeeAllTransactions}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionList}>
            {mockTransactions.slice(0, 5).map((transaction, index) => (
              <TouchableOpacity
                key={transaction.id}
                style={[
                  styles.transactionItem,
                  index === mockTransactions.slice(0, 5).length - 1 &&
                    styles.lastTransactionItem,
                ]}
                onPress={() => handleTransactionPress(transaction)}
                activeOpacity={0.7}
              >
                <View style={styles.transactionIcon}>
                  {iconMap[transaction.icon]}
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionMerchant}>
                    {transaction.merchant}
                  </Text>
                  <Text style={styles.transactionCategory}>
                    {transaction.category}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color:
                        transaction.type === 'income'
                          ? Colors.success
                          : Colors.text,
                    },
                  ]}
                >
                  {formatTransactionAmount(transaction.amount, transaction.type)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    marginTop: 12,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  dateContainer: {
    marginTop: 4,
  },
  date: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  snapshotCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  snapshotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  snapshotLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  netWorth: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -1,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  scoutSection: {
    marginBottom: 24,
  },
  scoutHeader: {
    marginBottom: 12,
  },
  scoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoutTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  actionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  actionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  actionBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  actionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  savingsLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  savingsAmount: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSecondary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonActive: {
    backgroundColor: `${Colors.primary}15`,
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  secondaryButtonTextActive: {
    color: Colors.primary,
  },
  flowSection: {
    marginBottom: 20,
  },
  flowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  flowTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  transactionList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  lastTransactionItem: {
    borderBottomWidth: 0,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionMerchant: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
