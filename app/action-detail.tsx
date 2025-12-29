import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Shield, DollarSign, Clock, CheckCircle, ExternalLink } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { mockScoutActions } from '@/mocks/data';
import { feedback } from '@/services/feedback';

interface ComparisonTool {
  name: string;
  description: string;
  url: string;
}

export default function ActionDetailScreen() {
  const router = useRouter();
  const action = mockScoutActions[0];

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

  const steps = [
    {
      title: 'Gather your current policy details',
      description: 'Find your declarations page showing current coverage and premium',
      completed: false,
    },
    {
      title: 'Get 3-5 comparison quotes',
      description: 'Use our partner tools or check directly with Progressive, Geico, and State Farm',
      completed: false,
    },
    {
      title: 'Compare coverage, not just price',
      description: 'Make sure deductibles and limits match your current policy',
      completed: false,
    },
    {
      title: 'Switch or negotiate',
      description: 'Found a better rate? Switch or use it to negotiate with your current insurer',
      completed: false,
    },
  ];

  const handleComplete = () => {
    feedback.onActionCompleted(); // Celebration for completing an action
    router.back();
  };

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
          <View style={styles.statCard}>
            <DollarSign size={20} color={Colors.success} />
            <Text style={styles.statValue}>$340</Text>
            <Text style={styles.statLabel}>Potential savings/yr</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={20} color={Colors.warning} />
            <Text style={styles.statValue}>12 days</Text>
            <Text style={styles.statLabel}>Until renewal</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to do this</Text>
          <View style={styles.stepsContainer}>
            {steps.map((step, index) => (
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

        <View style={styles.scoutNote}>
          <Text style={styles.scoutNoteTitle}>Why Scout picked this</Text>
          <Text style={styles.scoutNoteText}>
            Your car insurance has not been reviewed in 2 years, and rates in your area have dropped 12% on average. Drivers like you typically save $200-400 by shopping around at renewal time.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleComplete}>
          <CheckCircle size={20} color={Colors.white} />
          <Text style={styles.primaryButtonText}>Mark as done</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Do this later</Text>
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
