import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  CreditCard,
  Receipt,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Tv,
  Music,
  Cloud,
  Dumbbell,
  Home,
  Zap,
  Car,
  Wifi,
  AlertCircle,
  Smartphone,
  MessageSquare,
  CheckCircle,
  Settings,
  Landmark,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { dataService, Subscription, Bill } from '@/services/data';
import { feedback } from '@/services/feedback';

interface NegotiableBill {
  id: string;
  name: string;
  potentialSavings: number;
  successRate: number;
  icon: string;
  diyTip: string;
}

const subscriptionIcons: Record<string, React.ReactNode> = {
  'tv': <Tv size={18} color={Colors.textSecondary} />,
  'music': <Music size={18} color={Colors.textSecondary} />,
  'cloud': <Cloud size={18} color={Colors.textSecondary} />,
  'dumbbell': <Dumbbell size={18} color={Colors.textSecondary} />,
  'default': <CreditCard size={18} color={Colors.textSecondary} />,
};

const billIcons: Record<string, React.ReactNode> = {
  'home': <Home size={18} color={Colors.textSecondary} />,
  'zap': <Zap size={18} color={Colors.textSecondary} />,
  'car': <Car size={18} color={Colors.textSecondary} />,
  'wifi': <Wifi size={18} color={Colors.textSecondary} />,
  'smartphone': <Smartphone size={18} color={Colors.textSecondary} />,
  'default': <Receipt size={18} color={Colors.textSecondary} />,
};

type TabType = 'subscriptions' | 'bills';

export default function ManageScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('subscriptions');
  const [showNegotiation, setShowNegotiation] = useState(false);
  const [selectedBill, setSelectedBill] = useState<NegotiableBill | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [scoutActions, setScoutActions] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [subsData, billsData, actionsData] = await Promise.all([
          dataService.getSubscriptions(),
          dataService.getBills(),
          dataService.getScoutActions(),
        ]);

        setSubscriptions(subsData);
        setBills(billsData);
        setScoutActions(actionsData);
      } catch (error) {
        console.error('Error loading manage data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Generate negotiable bills from actual bills that are marked negotiable
  const negotiableBills: NegotiableBill[] = bills
    .filter(bill => bill.is_negotiable)
    .map(bill => ({
      id: bill.id,
      name: bill.name,
      potentialSavings: bill.potential_savings || Math.round(bill.amount * 0.15),
      successRate: bill.success_rate || 70,
      icon: getBillIcon(bill.category),
      diyTip: `Call ${bill.name} and mention you're considering switching to a competitor. Ask about any loyalty discounts or promotions available.`,
    }));

  const totalPotentialSavings = negotiableBills.reduce(
    (sum, bill) => sum + bill.potentialSavings,
    0
  );

  const totalSubscriptions = subscriptions.length;
  const totalSubscriptionCost = subscriptions.reduce(
    (sum, sub) => sum + sub.amount,
    0
  );

  function getBillIcon(category?: string): string {
    const categoryMap: Record<string, string> = {
      'utilities': 'zap',
      'housing': 'home',
      'auto': 'car',
      'internet': 'wifi',
      'phone': 'smartphone',
    };
    return categoryMap[category?.toLowerCase() || ''] || 'default';
  }

  function getSubscriptionIcon(category?: string): string {
    const categoryMap: Record<string, string> = {
      'streaming': 'tv',
      'entertainment': 'tv',
      'music': 'music',
      'storage': 'cloud',
      'fitness': 'dumbbell',
    };
    return categoryMap[category?.toLowerCase() || ''] || 'default';
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDueDay = (dueDay: number): string => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let dueDate: Date;
    if (dueDay >= currentDay) {
      dueDate = new Date(currentYear, currentMonth, dueDay);
    } else {
      dueDate = new Date(currentYear, currentMonth + 1, dueDay);
    }

    return dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleNegotiateForMe = useCallback(() => {
    feedback.onButtonPress();
    Alert.alert(
      'Coming Soon!',
      'Scout will negotiate this bill for you. This feature is launching soon!',
      [{ text: 'Notify Me', onPress: () => Alert.alert('Great!', 'We\'ll let you know when it\'s ready.') }]
    );
  }, []);

  const handleGetDIYScript = useCallback(() => {
    feedback.onButtonPress();
    if (selectedBill) {
      Alert.alert(
        'DIY Negotiation Script',
        `Here's what to say when you call:\n\n"Hi, I've been a loyal customer and I'm looking at my options. I noticed competitors are offering lower rates. Can you help me get a better deal on my ${selectedBill.name}?"\n\n${selectedBill.diyTip}`,
        [{ text: 'Copy Script', onPress: () => Alert.alert('Copied!', 'Script copied to clipboard.') }, { text: 'Close' }]
      );
    }
  }, [selectedBill]);

  const handleSubscriptionPress = useCallback((subscription: Subscription) => {
    feedback.onButtonPress();
    Alert.alert(
      subscription.name,
      `${formatCurrency(subscription.amount)}/mo\n${subscription.next_billing_date ? `Renews: ${formatDate(subscription.next_billing_date)}` : ''}\n\nManage subscription?`,
      [
        { text: 'Cancel Sub', style: 'destructive', onPress: () => handleCancelSubscription(subscription.id) },
        { text: 'Keep' }
      ]
    );
  }, []);

  const handleCancelSubscription = async (id: string) => {
    const success = await dataService.updateSubscription(id, { is_active: false });
    if (success) {
      setSubscriptions(prev => prev.filter(s => s.id !== id));
      Alert.alert('Done', 'Subscription cancelled.');
    }
  };

  const handleBillPress = useCallback((bill: Bill) => {
    feedback.onButtonPress();
    Alert.alert(
      bill.name,
      `${formatCurrency(bill.amount)}/mo\nDue: Day ${bill.due_day} of each month\n\nBill options:`,
      [
        { text: 'Set Reminder' },
        { text: 'Mark Paid', onPress: () => Alert.alert('Done!', `${bill.name} marked as paid.`) },
        { text: 'Close' }
      ]
    );
  }, []);

  const handleSuggestionPress = useCallback((suggestion: any) => {
    feedback.onButtonPress();
    router.push('/action-detail' as any);
  }, [router]);

  const suggestions = scoutActions.filter(
    (a) => a.type === 'optimize' || a.type === 'review'
  ).slice(0, 2);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your data...</Text>
      </View>
    );
  }

  // Negotiation Detail View
  if (selectedBill) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedBill(null)}
          >
            <ChevronLeft size={20} color={Colors.primary} />
            <Text style={styles.backButtonText}>Back to Negotiate</Text>
          </TouchableOpacity>

          <View style={styles.negotiateHeader}>
            <Text style={styles.negotiateTitle}>{selectedBill.name}</Text>
            <View style={styles.successBadge}>
              <CheckCircle size={12} color={Colors.success} />
              <Text style={styles.successBadgeText}>{selectedBill.successRate}% Success Rate</Text>
            </View>
          </View>

          <View style={styles.savingsCard}>
            <Text style={styles.savingsCardLabel}>Potential Monthly Savings</Text>
            <Text style={styles.savingsCardAmount}>${selectedBill.potentialSavings}</Text>
            <Text style={styles.savingsCardSublabel}>
              ${selectedBill.potentialSavings * 12}/year
            </Text>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.optionPrimary} onPress={handleNegotiateForMe}>
              <MessageSquare size={20} color={Colors.white} />
              <View style={styles.optionContent}>
                <Text style={styles.optionPrimaryTitle}>We Negotiate For You</Text>
                <Text style={styles.optionPrimaryDesc}>
                  Scout handles the call. You save time.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionSecondary} onPress={handleGetDIYScript}>
              <View style={styles.optionContent}>
                <Text style={styles.optionSecondaryTitle}>Get DIY Script</Text>
                <Text style={styles.optionSecondaryDesc}>
                  We give you exactly what to say
                </Text>
              </View>
              <ChevronRight size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.diyTipCard}>
            <Text style={styles.diyTipTitle}>Scout&apos;s DIY Tip</Text>
            <Text style={styles.diyTipText}>{selectedBill.diyTip}</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Negotiation List View
  if (showNegotiation) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowNegotiation(false)}
          >
            <ChevronLeft size={20} color={Colors.primary} />
            <Text style={styles.backButtonText}>Back to Manage</Text>
          </TouchableOpacity>

          <View style={styles.negotiateHeader}>
            <Text style={styles.negotiateTitle}>Negotiate Bills</Text>
            <Text style={styles.negotiateSubtitle}>
              Transparent, optional, and effective
            </Text>
          </View>

          {negotiableBills.length > 0 ? (
            <>
              <View style={styles.totalSavingsCard}>
                <Text style={styles.totalSavingsLabel}>Total Potential Savings</Text>
                <Text style={styles.totalSavingsAmount}>${totalPotentialSavings}/mo</Text>
                <Text style={styles.totalSavingsSublabel}>
                  ${totalPotentialSavings * 12}/year across {negotiableBills.length} bills
                </Text>
              </View>

              <Text style={styles.sectionLabel}>Bills we can negotiate</Text>
              <View style={styles.listContainer}>
                {negotiableBills.map((bill, index) => (
                  <TouchableOpacity
                    key={bill.id}
                    style={[
                      styles.negotiateBillItem,
                      index === negotiableBills.length - 1 && styles.listItemLast,
                    ]}
                    onPress={() => setSelectedBill(bill)}
                  >
                    <View style={styles.listItemIcon}>
                      {billIcons[bill.icon] || billIcons['default']}
                    </View>
                    <View style={styles.listItemContent}>
                      <Text style={styles.listItemName}>{bill.name}</Text>
                      <Text style={styles.listItemMeta}>
                        {bill.successRate}% success rate
                      </Text>
                    </View>
                    <View style={styles.savingsIndicator}>
                      <Text style={styles.savingsText}>-${bill.potentialSavings}/mo</Text>
                    </View>
                    <ChevronRight size={18} color={Colors.textLight} />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateTitle}>No Negotiable Bills</Text>
              <Text style={styles.emptyStateDescription}>
                Add bills marked as negotiable to see potential savings here.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // Empty state when no data
  const hasNoData = subscriptions.length === 0 && bills.length === 0;

  if (hasNoData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Control Center</Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/settings' as any)}
            >
              <Settings size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.emptyStateCardLarge}>
            <View style={styles.emptyStateIcon}>
              <Landmark size={32} color={Colors.primary} />
            </View>
            <Text style={styles.emptyStateTitle}>Manage Your Finances</Text>
            <Text style={styles.emptyStateDescription}>
              Connect your bank account to automatically track subscriptions and bills. Or add them manually to get started.
            </Text>
            <TouchableOpacity
              style={styles.connectButton}
              onPress={() => router.push('/settings' as any)}
            >
              <Text style={styles.connectButtonText}>Connect Bank Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Control Center</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/settings' as any)}
          >
            <Settings size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'subscriptions' && styles.tabActive]}
            onPress={() => setActiveTab('subscriptions')}
          >
            <CreditCard
              size={18}
              color={activeTab === 'subscriptions' ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'subscriptions' && styles.tabTextActive,
              ]}
            >
              Subscriptions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'bills' && styles.tabActive]}
            onPress={() => setActiveTab('bills')}
          >
            <Receipt
              size={18}
              color={activeTab === 'bills' ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[styles.tabText, activeTab === 'bills' && styles.tabTextActive]}
            >
              Bills
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'subscriptions' && (
          <>
            {subscriptions.length > 0 ? (
              <>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{totalSubscriptions} active</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(totalSubscriptionCost)}/month
                    </Text>
                  </View>
                </View>

                <View style={styles.listContainer}>
                  {subscriptions.map((subscription, index) => (
                    <TouchableOpacity
                      key={subscription.id}
                      style={[
                        styles.listItem,
                        index === subscriptions.length - 1 && styles.listItemLast,
                      ]}
                      onPress={() => handleSubscriptionPress(subscription)}
                    >
                      <View style={styles.listItemIcon}>
                        {subscriptionIcons[getSubscriptionIcon(subscription.category)] || subscriptionIcons['default']}
                      </View>
                      <View style={styles.listItemContent}>
                        <View style={styles.listItemHeader}>
                          <Text style={styles.listItemName}>{subscription.name}</Text>
                          {subscription.hours_used === 0 && (
                            <View style={styles.warningBadge}>
                              <AlertCircle size={12} color={Colors.warning} />
                              <Text style={styles.warningText}>Unused</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.listItemMeta}>
                          {subscription.hours_used !== undefined && subscription.hours_used > 0
                            ? `${subscription.hours_used}h this month`
                            : subscription.last_used_at
                            ? `Last used ${formatDate(subscription.last_used_at)}`
                            : subscription.category || 'Subscription'}
                        </Text>
                      </View>
                      <View style={styles.listItemRight}>
                        <Text style={styles.listItemAmount}>
                          {formatCurrency(subscription.amount)}
                        </Text>
                        {subscription.next_billing_date && (
                          <Text style={styles.listItemDate}>
                            Next: {formatDate(subscription.next_billing_date)}
                          </Text>
                        )}
                      </View>
                      <ChevronRight size={18} color={Colors.textLight} />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No Subscriptions</Text>
                <Text style={styles.emptyStateDescription}>
                  Your subscriptions will appear here once you connect your bank account.
                </Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'bills' && (
          <>
            {bills.length > 0 ? (
              <>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Next due</Text>
                    <Text style={styles.summaryValue}>
                      {formatDueDay(bills[0]?.due_day || 1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.listContainer}>
                  {bills.map((bill, index) => (
                    <TouchableOpacity
                      key={bill.id}
                      style={[
                        styles.listItem,
                        index === bills.length - 1 && styles.listItemLast,
                      ]}
                      onPress={() => handleBillPress(bill)}
                    >
                      <View style={styles.listItemIcon}>
                        {billIcons[getBillIcon(bill.category)] || billIcons['default']}
                      </View>
                      <View style={styles.listItemContent}>
                        <Text style={styles.listItemName}>{bill.name}</Text>
                        <Text style={styles.listItemMeta}>
                          {bill.is_auto_pay ? 'Auto-pay enabled' : 'Manual payment'}
                        </Text>
                      </View>
                      <View style={styles.listItemRight}>
                        <Text style={styles.listItemAmount}>
                          {formatCurrency(bill.amount)}
                        </Text>
                        <Text style={styles.listItemDate}>
                          Due: {formatDueDay(bill.due_day)}
                        </Text>
                      </View>
                      <ChevronRight size={18} color={Colors.textLight} />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No Bills</Text>
                <Text style={styles.emptyStateDescription}>
                  Your bills will appear here once you connect your bank account.
                </Text>
              </View>
            )}
          </>
        )}

        {negotiableBills.length > 0 && (
          <TouchableOpacity
            style={styles.negotiateButton}
            onPress={() => {
              feedback.onButtonPress();
              setShowNegotiation(true);
            }}
          >
            <View style={styles.negotiateButtonContent}>
              <Text style={styles.negotiateButtonTitle}>Negotiate Bills</Text>
              <Text style={styles.negotiateButtonSubtitle}>
                Potential Savings: ${totalPotentialSavings}/mo Found
              </Text>
            </View>
            <View style={styles.negotiateButtonIcon}>
              <ChevronRight size={24} color={Colors.white} />
            </View>
          </TouchableOpacity>
        )}

        {suggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <View style={styles.suggestionHeader}>
              <Sparkles size={18} color={Colors.primary} />
              <Text style={styles.suggestionTitle}>Scout&apos;s Suggestions</Text>
            </View>

            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.id}
                style={styles.suggestionCard}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                <Text style={styles.suggestionCardTitle}>{suggestion.title}</Text>
                <Text style={styles.suggestionCardDescription}>
                  {suggestion.description}
                </Text>
                {suggestion.potential_savings && (
                  <View style={styles.savingsIndicator}>
                    <Text style={styles.savingsText}>
                      Save up to {formatCurrency(suggestion.potential_savings)}/yr
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateCardLarge: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyStateIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  connectButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: `${Colors.primary}15`,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  listContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  listItemLast: {
    borderBottomWidth: 0,
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listItemName: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  listItemMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  listItemRight: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  listItemAmount: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  listItemDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${Colors.warning}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  warningText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  suggestionsSection: {
    marginBottom: 20,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  suggestionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  suggestionCardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  suggestionCardDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  savingsIndicator: {
    marginTop: 10,
  },
  savingsText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  // Negotiate Button Styles
  negotiateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  negotiateButtonContent: {
    flex: 1,
  },
  negotiateButtonTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  negotiateButtonSubtitle: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.8,
  },
  negotiateButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Back Button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  // Negotiate Header
  negotiateHeader: {
    marginBottom: 24,
  },
  negotiateTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  negotiateSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  // Total Savings Card
  totalSavingsCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  totalSavingsLabel: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.8,
    marginBottom: 8,
  },
  totalSavingsAmount: {
    fontSize: 40,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  totalSavingsSublabel: {
    fontSize: 13,
    color: Colors.white,
    opacity: 0.7,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  negotiateBillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  // Success Badge
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${Colors.success}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  successBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  // Savings Card (Detail View)
  savingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.success,
  },
  savingsCardLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  savingsCardAmount: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  savingsCardSublabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  // Options Container
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
  },
  optionContent: {
    flex: 1,
  },
  optionPrimaryTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  optionPrimaryDesc: {
    fontSize: 13,
    color: Colors.white,
    opacity: 0.8,
  },
  optionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionSecondaryTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  optionSecondaryDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  // DIY Tip Card
  diyTipCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    padding: 20,
  },
  diyTipTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.white,
    opacity: 0.6,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  diyTipText: {
    fontSize: 15,
    color: Colors.white,
    lineHeight: 22,
  },
});
