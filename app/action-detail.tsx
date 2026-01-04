import React, { useCallback, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Shield, DollarSign, Clock, CheckCircle, ExternalLink, Sparkles } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { dataService } from '@/services/data';
import { feedback } from '@/services/feedback';

interface ScoutAction {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: number;
  potential_savings?: number;
  deadline?: string;
}

interface ComparisonTool {
  name: string;
  description: string;
  url: string;
}

export default function ActionDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [action, setAction] = useState<ScoutAction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAction = async () => {
      try {
        // Try to get action from params or fetch first available action
        const actions = await dataService.getScoutActions();
        if (actions.length > 0) {
          const actionId = params.id as string;
          const foundAction = actionId
            ? actions.find((a: any) => a.id === actionId)
            : actions[0];
          setAction(foundAction || actions[0]);
        }
      } catch (error) {
        console.error('Error loading action:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAction();
  }, [params.id]);

  const comparisonTools: ComparisonTool[] = [
    {
      name: 'The Zebra',
      description: 'Compare rates from 100+ companies',
      url: 'https://www.thezebra.com/auto-insurance/',
    },
    {
      name: 'Policygenius',
      description: 'Free quotes, no spam',
      url: 'https://www.policygenius.com/auto-insurance/',
    },
  ];

  const openLink = useCallback(async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.POPOVER,
        controlsColor: Colors.primary,
      });
    } catch (error) {
      console.error('Error opening browser:', error);
    }
  }, []);

  const getStepsForAction = (actionType: string) => {
    // Generic steps based on action type
    const stepsMap: Record<string, any[]> = {
      optimize: [
        {
          title: 'Review your current situation',
          description: 'Take stock of what you currently have and what you are paying',
          completed: false,
        },
        {
          title: 'Research alternatives',
          description: 'Look for better options that could save you money',
          completed: false,
        },
        {
          title: 'Compare and decide',
          description: 'Weigh the pros and cons of each option',
          completed: false,
        },
        {
          title: 'Take action',
          description: 'Make the switch or negotiate for a better rate',
          completed: false,
        },
      ],
      review: [
        {
          title: 'Gather your documents',
          description: 'Collect all relevant statements and information',
          completed: false,
        },
        {
          title: 'Analyze your spending',
          description: 'Look for patterns and areas to improve',
          completed: false,
        },
        {
          title: 'Identify opportunities',
          description: 'Find ways to save or optimize',
          completed: false,
        },
        {
          title: 'Implement changes',
          description: 'Put your new plan into action',
          completed: false,
        },
      ],
      default: [
        {
          title: 'Review the recommendation',
          description: 'Understand what Scout is suggesting',
          completed: false,
        },
        {
          title: 'Gather information',
          description: 'Collect what you need to take action',
          completed: false,
        },
        {
          title: 'Take action',
          description: 'Complete the recommended task',
          completed: false,
        },
      ],
    };

    return stepsMap[actionType] || stepsMap.default;
  };

  const handleComplete = async () => {
    if (action) {
      await dataService.completeScoutAction(action.id);
    }
    feedback.onActionCompleted();
    router.back();
  };

  const handleDismiss = async () => {
    if (action) {
      await dataService.dismissScoutAction(action.id);
    }
    router.back();
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading action...</Text>
      </View>
    );
  }

  if (!action) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIcon}>
            <Sparkles size={32} color={Colors.primary} />
          </View>
          <Text style={styles.emptyStateTitle}>No Action Available</Text>
          <Text style={styles.emptyStateDescription}>
            Scout will suggest actions when there are opportunities to improve your finances.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const steps = getStepsForAction(action.type);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Shield size={32} color={Colors.primary} />
          </View>
          <Text style={styles.title}>{action.title}</Text>
          <Text style={styles.description}>{action.description}</Text>
        </View>

        <View style={styles.statsRow}>
          {action.potential_savings && (
            <View style={styles.statCard}>
              <DollarSign size={20} color={Colors.success} />
              <Text style={styles.statValue}>${action.potential_savings}</Text>
              <Text style={styles.statLabel}>Potential savings/yr</Text>
            </View>
          )}
          {action.deadline && (
            <View style={styles.statCard}>
              <Clock size={20} color={Colors.warning} />
              <Text style={styles.statValue}>
                {new Date(action.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              <Text style={styles.statLabel}>Deadline</Text>
            </View>
          )}
          {!action.potential_savings && !action.deadline && (
            <View style={styles.statCard}>
              <Sparkles size={20} color={Colors.primary} />
              <Text style={styles.statValue}>Priority {action.priority}</Text>
              <Text style={styles.statLabel}>Importance level</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to do this</Text>
          <View style={styles.stepsContainer}>
            {steps.map((step: any, index: number) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepLeft}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  {index < steps.length - 1 && <View style={styles.stepLine} />}
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {action.type === 'optimize' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick comparison tools</Text>
            {comparisonTools.map((tool, index) => (
              <TouchableOpacity
                key={index}
                style={styles.linkCard}
                onPress={() => openLink(tool.url)}
              >
                <View style={styles.linkContent}>
                  <Text style={styles.linkTitle}>{tool.name}</Text>
                  <Text style={styles.linkDescription}>{tool.description}</Text>
                </View>
                <ExternalLink size={18} color={Colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.scoutNote}>
          <Text style={styles.scoutNoteTitle}>Why Scout picked this</Text>
          <Text style={styles.scoutNoteText}>
            Based on your financial data, Scout identified this as a high-impact opportunity to improve your finances. Taking action on this recommendation could help you reach your financial goals faster.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleComplete}>
          <CheckCircle size={20} color={Colors.white} />
          <Text style={styles.primaryButtonText}>Mark as done</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleDismiss}>
          <Text style={styles.secondaryButtonText}>Dismiss this</Text>
        </TouchableOpacity>
      </View>
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 24,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  stepsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  stepItem: {
    flexDirection: 'row',
  },
  stepLeft: {
    width: 32,
    alignItems: 'center',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  stepContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  linkDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  scoutNote: {
    backgroundColor: `${Colors.primary}08`,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  scoutNoteTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  scoutNoteText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '500' as const,
  },
});
