import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CreditCard,
  Receipt,
  Sparkles,
  ChevronRight,
  Tv,
  Music,
  Cloud,
  Dumbbell,
  Home,
  Zap,
  Car,
  Wifi,
  AlertCircle,
  Users,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { mockSubscriptions, mockBills, mockScoutActions, mockProfiles } from '@/mocks/data';

const subscriptionIcons: Record<string, React.ReactNode> = {
  'tv': <Tv size={18} color={Colors.textSecondary} />,
  'music': <Music size={18} color={Colors.textSecondary} />,
  'cloud': <Cloud size={18} color={Colors.textSecondary} />,
  'dumbbell': <Dumbbell size={18} color={Colors.textSecondary} />,
};

const billIcons: Record<string, React.ReactNode> = {
  'home': <Home size={18} color={Colors.textSecondary} />,
  'zap': <Zap size={18} color={Colors.textSecondary} />,
  'car': <Car size={18} color={Colors.textSecondary} />,
  'wifi': <Wifi size={18} color={Colors.textSecondary} />,
};

type TabType = 'subscriptions' | 'bills' | 'profiles';

export default function ManageScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('subscriptions');

  const totalSubscriptions = mockSubscriptions.length;
  const totalSubscriptionCost = mockSubscriptions.reduce(
    (sum, sub) => sum + sub.amount,
    0
  );

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const suggestions = mockScoutActions.filter(
    (a) => a.type === 'optimize' || a.type === 'review'
  ).slice(0, 2);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Control Center</Text>
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
          <TouchableOpacity
            style={[styles.tab, activeTab === 'profiles' && styles.tabActive]}
            onPress={() => setActiveTab('profiles')}
          >
            <Users
              size={18}
              color={activeTab === 'profiles' ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[styles.tabText, activeTab === 'profiles' && styles.tabTextActive]}
            >
              Profiles
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'subscriptions' && (
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
              {mockSubscriptions.map((subscription, index) => (
                <TouchableOpacity
                  key={subscription.id}
                  style={[
                    styles.listItem,
                    index === mockSubscriptions.length - 1 && styles.listItemLast,
                  ]}
                >
                  <View style={styles.listItemIcon}>
                    {subscriptionIcons[subscription.icon]}
                  </View>
                  <View style={styles.listItemContent}>
                    <View style={styles.listItemHeader}>
                      <Text style={styles.listItemName}>{subscription.name}</Text>
                      {subscription.hoursUsed === 0 && (
                        <View style={styles.warningBadge}>
                          <AlertCircle size={12} color={Colors.warning} />
                          <Text style={styles.warningText}>Unused</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.listItemMeta}>
                      {subscription.hoursUsed !== undefined && subscription.hoursUsed > 0
                        ? `${subscription.hoursUsed}h this month`
                        : subscription.lastUsed
                        ? `Last used ${subscription.lastUsed}`
                        : subscription.category}
                    </Text>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text style={styles.listItemAmount}>
                      {formatCurrency(subscription.amount)}
                    </Text>
                    <Text style={styles.listItemDate}>
                      Next: {formatDate(subscription.nextBilling)}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={Colors.textLight} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {activeTab === 'bills' && (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Next due</Text>
                <Text style={styles.summaryValue}>
                  {formatDate(mockBills[0]?.dueDate || '')}
                </Text>
              </View>
            </View>

            <View style={styles.listContainer}>
              {mockBills.map((bill, index) => (
                <TouchableOpacity
                  key={bill.id}
                  style={[
                    styles.listItem,
                    index === mockBills.length - 1 && styles.listItemLast,
                  ]}
                >
                  <View style={styles.listItemIcon}>
                    {billIcons[bill.icon]}
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemName}>{bill.name}</Text>
                    <Text style={styles.listItemMeta}>
                      {bill.isAutoPay ? 'Auto-pay enabled' : 'Manual payment'}
                    </Text>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text style={styles.listItemAmount}>
                      {formatCurrency(bill.amount)}
                    </Text>
                    <Text style={styles.listItemDate}>
                      Due: {formatDate(bill.dueDate)}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={Colors.textLight} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {activeTab === 'profiles' && (
          <View style={styles.listContainer}>
            {mockProfiles.map((profile, index) => (
              <TouchableOpacity
                key={profile.id}
                style={[
                  styles.listItem,
                  index === mockProfiles.length - 1 && styles.listItemLast,
                ]}
              >
                <View
                  style={[
                    styles.profileAvatar,
                    profile.isActive && styles.profileAvatarActive,
                  ]}
                >
                  <Text style={styles.profileAvatarText}>
                    {profile.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemName}>{profile.name}</Text>
                  <Text style={styles.listItemMeta}>
                    {profile.type.charAt(0).toUpperCase() + profile.type.slice(1)}
                  </Text>
                </View>
                {profile.isActive && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                )}
                <ChevronRight size={18} color={Colors.textLight} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addProfileButton}>
              <Text style={styles.addProfileText}>+ Add profile</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.suggestionsSection}>
          <View style={styles.suggestionHeader}>
            <Sparkles size={18} color={Colors.primary} />
            <Text style={styles.suggestionTitle}>Scout&apos;s Suggestions</Text>
          </View>

          {suggestions.map((suggestion) => (
            <TouchableOpacity key={suggestion.id} style={styles.suggestionCard}>
              <Text style={styles.suggestionCardTitle}>{suggestion.title}</Text>
              <Text style={styles.suggestionCardDescription}>
                {suggestion.description}
              </Text>
              {suggestion.potentialSavings && (
                <View style={styles.savingsIndicator}>
                  <Text style={styles.savingsText}>
                    Save up to {formatCurrency(suggestion.potentialSavings)}/yr
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
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
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
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
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileAvatarActive: {
    backgroundColor: Colors.primary,
  },
  profileAvatarText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  activeBadge: {
    backgroundColor: `${Colors.success}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  addProfileButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  addProfileText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
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
});
