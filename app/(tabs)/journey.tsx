import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TrendingUp, ChevronRight, Clock, Target, Zap, X, DollarSign, PiggyBank, TrendingDown, Landmark } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { dataService } from '@/services/data';
import { feedback } from '@/services/feedback';

interface TimelinePoint {
  date: string;
  label: string;
  netWorth: number;
  isFuture: boolean;
}

export default function JourneyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [monthlyGrowth, setMonthlyGrowth] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const netWorthHistory = await dataService.getNetWorthHistory();

        if (netWorthHistory.length > 0) {
          // Transform net worth history to timeline format
          const pastPoints: TimelinePoint[] = netWorthHistory.map((n) => {
            const date = new Date(n.date);
            const isToday = new Date().toDateString() === date.toDateString();
            return {
              date: isToday ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
              label: isToday ? 'Current net worth' : '',
              netWorth: n.net_worth,
              isFuture: false,
            };
          });

          // Calculate average monthly growth
          if (netWorthHistory.length >= 2) {
            const oldest = netWorthHistory[0];
            const newest = netWorthHistory[netWorthHistory.length - 1];
            const monthsDiff = Math.max(1, Math.round(
              (new Date(newest.date).getTime() - new Date(oldest.date).getTime()) / (30 * 24 * 60 * 60 * 1000)
            ));
            const totalGrowth = newest.net_worth - oldest.net_worth;
            setMonthlyGrowth(Math.round(totalGrowth / monthsDiff));
          }

          // Generate future projections based on current growth rate
          const currentNetWorth = netWorthHistory[netWorthHistory.length - 1]?.net_worth || 0;
          const avgMonthlyGrowth = monthlyGrowth > 0 ? monthlyGrowth : 1000; // Default projection

          const futurePoints: TimelinePoint[] = [];
          const projectionMonths = [3, 6, 12];

          projectionMonths.forEach((months) => {
            const futureDate = new Date();
            futureDate.setMonth(futureDate.getMonth() + months);
            futurePoints.push({
              date: futureDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
              label: `+${months} months`,
              netWorth: currentNetWorth + (avgMonthlyGrowth * months),
              isFuture: true,
            });
          });

          // Add Today point if not already present
          const hasToday = pastPoints.some(p => p.date === 'Today');
          if (!hasToday && pastPoints.length > 0) {
            pastPoints[pastPoints.length - 1] = {
              ...pastPoints[pastPoints.length - 1],
              date: 'Today',
              label: 'Current net worth',
            };
          }

          setTimeline([...pastPoints, ...futurePoints]);
        }
      } catch (error) {
        console.error('Error loading journey data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [monthlyGrowth]);

  const handleWhatCouldChange = useCallback(() => {
    feedback.onButtonPress();
    setShowChangeModal(true);
  }, []);

  const scenarios = [
    {
      icon: <DollarSign size={20} color={Colors.success} />,
      title: 'Increase income by $500/mo',
      impact: '+$6,000/year',
      newGoal: 'Accelerate your goals',
    },
    {
      icon: <PiggyBank size={20} color={Colors.primary} />,
      title: 'Save an extra 10%',
      impact: '+$3,600/year',
      newGoal: 'Build wealth faster',
    },
    {
      icon: <TrendingDown size={20} color={Colors.warning} />,
      title: 'Cut subscriptions by $100/mo',
      impact: '+$1,200/year',
      newGoal: 'Free up cash flow',
    },
  ];

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const currentNetWorth = timeline.find((p) => p.date === 'Today')?.netWorth || 0;
  const startNetWorth = timeline.filter(p => !p.isFuture)[0]?.netWorth || 0;
  const endNetWorth = timeline.filter(p => !p.isFuture).slice(-1)[0]?.netWorth || 0;
  const totalGrowth = endNetWorth - startNetWorth;
  const growthPercentage = totalGrowth > 0 ? Math.round((totalGrowth / Math.abs(startNetWorth || 1)) * 100) : 0;

  // Show empty state if no data
  if (!isLoading && timeline.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Your Journey</Text>
            <Text style={styles.subtitle}>
              See where you have been and where you are headed
            </Text>
          </View>

          <View style={styles.emptyStateCard}>
            <View style={styles.emptyStateIcon}>
              <Landmark size={32} color={Colors.primary} />
            </View>
            <Text style={styles.emptyStateTitle}>Start Your Journey</Text>
            <Text style={styles.emptyStateDescription}>
              Connect your bank account to see your financial journey over time. Track your progress and see where you're headed.
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

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your journey...</Text>
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
          <Text style={styles.title}>Your Journey</Text>
          <Text style={styles.subtitle}>
            See where you have been and where you are headed
          </Text>
        </View>

        <View style={styles.progressOverview}>
          <View style={styles.progressHeader}>
            <View style={styles.progressIcon}>
              <TrendingUp size={24} color={Colors.primary} />
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Net worth growth</Text>
              <Text style={styles.progressValue}>
                {growthPercentage > 0 ? `+${growthPercentage}%` : `${growthPercentage}%`} since tracking
              </Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(100, Math.abs(growthPercentage))}%` }]} />
          </View>
        </View>

        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Where you have been</Text>
          <View style={styles.timelineContainer}>
            {timeline
              .filter((point) => !point.isFuture)
              .map((point, index, arr) => (
                <View key={point.date} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineDot,
                        point.date === 'Today' && styles.timelineDotCurrent,
                      ]}
                    />
                    {index < arr.length - 1 && (
                      <View style={styles.timelineLine} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineRow}>
                      <View>
                        <Text
                          style={[
                            styles.timelineDate,
                            point.date === 'Today' && styles.timelineDateCurrent,
                          ]}
                        >
                          {point.date}
                        </Text>
                        <Text style={styles.timelineLabel}>{point.label}</Text>
                      </View>
                      <Text
                        style={[
                          styles.timelineAmount,
                          point.date === 'Today' && styles.timelineAmountCurrent,
                        ]}
                      >
                        {formatCurrency(point.netWorth)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
          </View>
        </View>

        <View style={styles.timelineSection}>
          <View style={styles.futureSectionHeader}>
            <Text style={styles.sectionTitle}>Where you are headed</Text>
            <Text style={styles.sectionSubtitle}>at current pace</Text>
          </View>
          <View style={styles.timelineContainer}>
            {timeline
              .filter((point) => point.isFuture)
              .map((point, index, arr) => (
                <View key={point.date} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, styles.timelineDotFuture]} />
                    {index < arr.length - 1 && (
                      <View style={[styles.timelineLine, styles.timelineLineFuture]} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineRow}>
                      <View>
                        <Text style={[styles.timelineDate, styles.timelineDateFuture]}>
                          {point.date}
                        </Text>
                        <Text style={styles.timelineLabel}>{point.label}</Text>
                      </View>
                      <Text style={[styles.timelineAmount, styles.timelineAmountFuture]}>
                        {formatCurrency(point.netWorth)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
          </View>
        </View>

        <TouchableOpacity style={styles.changeButton} onPress={handleWhatCouldChange}>
          <Zap size={18} color={Colors.primary} />
          <Text style={styles.changeButtonText}>What could change this?</Text>
          <ChevronRight size={18} color={Colors.primary} />
        </TouchableOpacity>

        {/* What Could Change Modal */}
        <Modal
          visible={showChangeModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowChangeModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>What could change your journey?</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowChangeModal(false)}
              >
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalSubtitle}>
                Here are some scenarios that could accelerate your progress:
              </Text>

              {scenarios.map((scenario, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.scenarioCard}
                  onPress={() => {
                    feedback.onButtonPress();
                    setShowChangeModal(false);
                    router.push('/(tabs)/scout' as any);
                  }}
                >
                  <View style={styles.scenarioIcon}>{scenario.icon}</View>
                  <View style={styles.scenarioContent}>
                    <Text style={styles.scenarioTitle}>{scenario.title}</Text>
                    <Text style={styles.scenarioImpact}>{scenario.impact}</Text>
                    <Text style={styles.scenarioGoal}>{scenario.newGoal}</Text>
                  </View>
                  <ChevronRight size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => {
                  feedback.onButtonPress();
                  setShowChangeModal(false);
                  router.push('/(tabs)/scout' as any);
                }}
              >
                <Text style={styles.exploreButtonText}>Ask Scout for advice</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>

        <View style={styles.insightsSection}>
          <Text style={styles.insightsTitle}>Journey insights</Text>

          <View style={styles.insightCard}>
            <View style={styles.insightIcon}>
              <Clock size={20} color={Colors.success} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightLabel}>Average monthly growth</Text>
              <Text style={styles.insightValue}>
                {monthlyGrowth >= 0 ? '+' : ''}{formatCurrency(monthlyGrowth)}
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightIcon}>
              <Target size={20} color={Colors.primary} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightLabel}>Current net worth</Text>
              <Text style={styles.insightValue}>{formatCurrency(currentNetWorth)}</Text>
            </View>
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
    marginTop: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyStateCard: {
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
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  connectButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  progressOverview: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  progressInfo: {
    flex: 1,
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  progressValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  timelineSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  futureSectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timelineContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 60,
  },
  timelineLeft: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.textLight,
    marginTop: 4,
  },
  timelineDotCurrent: {
    backgroundColor: Colors.primary,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: `${Colors.primary}30`,
  },
  timelineDotFuture: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.textLight,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.textLight,
    marginVertical: 4,
  },
  timelineLineFuture: {
    backgroundColor: Colors.borderLight,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timelineDate: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  timelineDateCurrent: {
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  timelineDateFuture: {
    color: Colors.textSecondary,
  },
  timelineLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  timelineAmount: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  timelineAmountCurrent: {
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  timelineAmountFuture: {
    color: Colors.textSecondary,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${Colors.primary}10`,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  changeButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  insightsSection: {
    gap: 12,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  modalClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  scenarioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  scenarioIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  scenarioContent: {
    flex: 1,
  },
  scenarioTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  scenarioImpact: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.success,
    marginBottom: 2,
  },
  scenarioGoal: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  exploreButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
