import React, { useCallback, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
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
  Settings,
  Building2,
} from 'lucide-react-native';
import { feedback } from '@/services/feedback';
import { dataService, FinancialSnapshot } from '@/services/data';

import Colors from '@/constants/colors';

// Helper to get greeting based on time of day
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

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
  const [isLoading, setIsLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<FinancialSnapshot>({
    netWorth: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    netWorthChange: 0,
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [scoutActions, setScoutActions] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [snapshotData, transactionsData, actionsData] = await Promise.all([
          dataService.getFinancialSnapshot(),
          dataService.getRecentTransactions(5),
          dataService.getScoutActions(),
        ]);

        setSnapshot(snapshotData);
        setTransactions(transactionsData);
        setScoutActions(actionsData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const currentAction = scoutActions[0];

  const handleRemindLater = useCallback(() => {
    feedback.onButtonPress();
    setReminderSet(true);
    Alert.alert(
      'Reminder Set',
      'We\'ll remind you about this tomorrow morning.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleTransactionPress = useCallback((transaction: any) => {
    feedback.onButtonPress();
    const name = transaction.merchant_name || transaction.name || 'Transaction';
    const category = Array.isArray(transaction.category) ? transaction.category[0] : (transaction.category || 'Other');
    Alert.alert(
      name,
      `${category}\nAmount: $${Math.abs(transaction.amount).toFixed(2)}\n\nTransaction details coming soon!`,
      [{ text: 'OK' }]
    );
  }, []);

  const handleSeeAllTransactions = useCallback(() => {
    feedback.onButtonPress();
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
      router.push('/action-detail' as any);
    });
  }, [router, scaleValue]);

  const handleLinkAccount = useCallback(() => {
    feedback.onButtonPress();
    router.push('/link-account' as any);
  }, [router]);

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

  const formatTransactionAmount = (amount: number): string => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Math.abs(amount));
    return amount < 0 ? `-${formatted}` : `+${formatted}`;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your finances...</Text>
      </View>
    );
  }

  const hasNoData = snapshot.netWorth === 0 && transactions.length === 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.date}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => {
                feedback.onButtonPress();
                router.push('/settings' as any);
              }}
            >
              <Settings size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.snapshotCard} activeOpacity={0.8}>
          <View style={styles.snapshotHeader}>
            <Text style={styles.snapshotLabel}>Your Snapshot</Text>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </View>
          <Text style={styles.netWorth}>
            {formatCurrency(snapshot.netWorth)}
          </Text>
          <View style={styles.changeContainer}>
            {snapshot.netWorthChange >= 0 ? (
              <TrendingUp size={16} color={Colors.success} />
            ) : (
              <TrendingDown size={16} color={Colors.alert} />
            )}
            <Text
              style={[
                styles.changeText,
                {
                  color:
                    snapshot.netWorthChange >= 0
                      ? Colors.success
                      : Colors.alert,
                },
              ]}
            >
              {formatCurrency(snapshot.netWorthChange, true)} this month
            </Text>
          </View>
        </TouchableOpacity>

        {hasNoData && (
          <TouchableOpacity style={styles.connectBankCard} onPress={handleLinkAccount}>
            <View style={styles.connectBankIcon}>
              <Building2 size={32} color={Colors.primary} />
            </View>
            <Text style={styles.connectBankTitle}>Connect Your Bank</Text>
            <Text style={styles.connectBankDescription}>
              Link your accounts to see your real financial data and get personalized insights from Scout.
            </Text>
            <View style={styles.connectBankButton}>
              <Text style={styles.connectBankButtonText}>Connect Now</Text>
            </View>
          </TouchableOpacity>
        )}

        {currentAction && (
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
                    {currentAction.type?.charAt(0).toUpperCase() +
                      currentAction.type?.slice(1) || 'Tip'}
                  </Text>
                </View>
                <Text style={styles.actionTitle}>{currentAction.title}</Text>
                <Text style={styles.actionDescription}>
                  {currentAction.description}
                </Text>
                {currentAction.potential_savings && (
                  <View style={styles.savingsRow}>
                    <Text style={styles.savingsLabel}>Potential savings:</Text>
                    <Text style={styles.savingsAmount}>
                      {formatCurrency(currentAction.potential_savings)}/yr
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
        )}

        {!currentAction && !hasNoData && (
          <View style={styles.scoutSection}>
            <View style={styles.scoutHeader}>
              <View style={styles.scoutTitleRow}>
                <Sparkles size={18} color={Colors.primary} />
                <Text style={styles.scoutTitle}>Ask Scout</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.askScoutCard}
              onPress={() => router.push('/(tabs)/scout' as any)}
            >
              <Text style={styles.askScoutText}>
                Chat with Scout to get personalized financial advice and insights.
              </Text>
              <ChevronRight size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.flowSection}>
          <View style={styles.flowHeader}>
            <Text style={styles.flowTitle}>Recent Flow</Text>
            {transactions.length > 0 && (
              <TouchableOpacity onPress={handleSeeAllTransactions}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            )}
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <Text style={styles.emptyText}>
                No transactions yet. Connect your bank to see your spending.
              </Text>
            </View>
          ) : (
            <View style={styles.transactionList}>
              {transactions.map((transaction, index) => (
                <TouchableOpacity
                  key={transaction.id || index}
                  style={[
                    styles.transactionItem,
                    index === transactions.length - 1 && styles.lastTransactionItem,
                  ]}
                  onPress={() => handleTransactionPress(transaction)}
                  activeOpacity={0.7}
                >
                  <View style={styles.transactionIcon}>
                    <ShoppingCart size={18} color={Colors.textSecondary} />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionMerchant}>
                      {transaction.merchant_name || transaction.name || 'Transaction'}
                    </Text>
                    <Text style={styles.transactionCategory}>
                      {Array.isArray(transaction.category) ? transaction.category[0] : (transaction.category || 'Other')}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      {
                        color: transaction.amount < 0 ? Colors.text : Colors.success,
                      },
                    ]}
                  >
                    {formatTransactionAmount(transaction.amount)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    marginTop: 4,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
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
  connectBankCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  connectBankIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  connectBankTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  connectBankDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  connectBankButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  connectBankButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
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
  askScoutCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  askScoutText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginRight: 12,
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
  emptyTransactions: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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
