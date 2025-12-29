import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrendingUp, ChevronRight, Clock, Target, Zap } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { mockTimeline } from '@/mocks/data';

export default function JourneyScreen() {
  const insets = useSafeAreaInsets();

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  

  const currentNetWorth = mockTimeline.find((p) => p.date === 'Today')?.netWorth || 0;
  const startNetWorth = mockTimeline[0]?.netWorth || 0;
  const endNetWorth = mockTimeline[mockTimeline.length - 1]?.netWorth || 0;
  const totalGrowth = endNetWorth - startNetWorth;
  const currentGrowth = currentNetWorth - startNetWorth;
  const growthPercentage = Math.round((currentGrowth / totalGrowth) * 100);

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
              <Text style={styles.progressLabel}>Progress toward 1-year goal</Text>
              <Text style={styles.progressValue}>{growthPercentage}% complete</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${growthPercentage}%` }]} />
          </View>
        </View>

        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Where you have been</Text>
          <View style={styles.timelineContainer}>
            {mockTimeline
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
            {mockTimeline
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

        <TouchableOpacity style={styles.changeButton}>
          <Zap size={18} color={Colors.primary} />
          <Text style={styles.changeButtonText}>What could change this?</Text>
          <ChevronRight size={18} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.insightsSection}>
          <Text style={styles.insightsTitle}>Journey insights</Text>
          
          <View style={styles.insightCard}>
            <View style={styles.insightIcon}>
              <Clock size={20} color={Colors.success} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightLabel}>Average monthly growth</Text>
              <Text style={styles.insightValue}>+$1,508</Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightIcon}>
              <Target size={20} color={Colors.primary} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightLabel}>Months to $100k</Text>
              <Text style={styles.insightValue}>35 months</Text>
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
    borderStyle: 'dashed',
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
});
