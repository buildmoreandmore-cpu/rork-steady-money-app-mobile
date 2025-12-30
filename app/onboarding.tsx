import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Sparkles,
  CreditCard,
  HelpCircle,
  Bell,
  Shield,
  Link,
  PenLine,
  Shuffle,
  User,
  Users,
  Home,
  Briefcase,
  Layers,
  ChevronRight,
  Search,
  CheckCircle,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { MoneyGoal, TrackingMethod, ProfileType } from '@/types';
import { feedback } from '@/services/feedback';



interface OptionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [moneyGoal, setMoneyGoal] = useState<MoneyGoal | null>(null);
  const [trackingMethod, setTrackingMethod] = useState<TrackingMethod | null>(null);
  const [profileType, setProfileType] = useState<ProfileType | null>(null);

  const moneyGoalOptions: OptionItem[] = [
    {
      id: 'spend_less',
      label: 'I want to spend less without feeling it',
      icon: <CreditCard size={22} color={Colors.primary} />,
    },
    {
      id: 'afford_check',
      label: 'I want to know if I can afford something',
      icon: <HelpCircle size={22} color={Colors.primary} />,
    },
    {
      id: 'stop_worrying',
      label: 'I want to stop worrying about bills',
      icon: <Bell size={22} color={Colors.primary} />,
    },
    {
      id: 'feel_control',
      label: 'I just want to feel more in control',
      icon: <Shield size={22} color={Colors.primary} />,
    },
  ];

  const trackingOptions: OptionItem[] = [
    {
      id: 'link_accounts',
      label: 'Link accounts',
      icon: <Link size={22} color={Colors.primary} />,
      description: 'Automatic, always current',
    },
    {
      id: 'manual',
      label: 'Add manually',
      icon: <PenLine size={22} color={Colors.primary} />,
      description: 'Private, you control everything',
    },
    {
      id: 'mix_both',
      label: 'Mix both',
      icon: <Shuffle size={22} color={Colors.primary} />,
      description: 'Link some, add others yourself',
    },
  ];

  const profileOptions: OptionItem[] = [
    {
      id: 'just_me',
      label: 'Just me',
      icon: <User size={22} color={Colors.primary} />,
    },
    {
      id: 'partner',
      label: 'Me + partner',
      icon: <Users size={22} color={Colors.primary} />,
    },
    {
      id: 'family',
      label: 'Me + family',
      icon: <Home size={22} color={Colors.primary} />,
    },
    {
      id: 'side_business',
      label: 'Me + side business',
      icon: <Briefcase size={22} color={Colors.primary} />,
    },
    {
      id: 'all',
      label: 'All of the above',
      icon: <Layers size={22} color={Colors.primary} />,
    },
  ];

  const getInsightForGoal = (): { title: string; cta1: string; cta2: string } => {
    switch (moneyGoal) {
      case 'spend_less':
        return {
          title: 'Most people save $127/month by finding subscriptions they forgot about. Want Scout to look for yours?',
          cta1: 'Yes, find them',
          cta2: "I'll add them manually",
        };
      case 'afford_check':
        return {
          title: 'The average person checks 4 apps before making a purchase decision. Scout gives you one answer in seconds.',
          cta1: 'Show me how',
          cta2: "I'll explore myself",
        };
      case 'stop_worrying':
        return {
          title: "People who automate their bills report 73% less financial anxiety. Let's get your bills organized.",
          cta1: 'Set up bill tracking',
          cta2: "I'll do it later",
        };
      case 'feel_control':
        return {
          title: "Control starts with knowing where you stand. Let's get you a snapshot of your finances in 2 minutes.",
          cta1: "Let's do it",
          cta2: "I'll set up later",
        };
      default:
        return {
          title: "Let's get you started with a quick win.",
          cta1: 'Get started',
          cta2: 'Skip for now',
        };
    }
  };

  const getFirstAction = (): { title: string; description: string } => {
    switch (moneyGoal) {
      case 'spend_less':
        return {
          title: 'Review your subscriptions',
          description: 'Scout found 3 subscriptions you haven\'t used in the last 30 days. Pausing them could save you $47/month.',
        };
      case 'afford_check':
        return {
          title: 'Set up your snapshot',
          description: 'Add your accounts so Scout can give you instant "can I afford this?" answers.',
        };
      case 'stop_worrying':
        return {
          title: 'Add your first bill',
          description: 'Start with your biggest bill. Scout will remind you before it\'s due and help you never miss a payment.',
        };
      case 'feel_control':
        return {
          title: 'Complete your financial snapshot',
          description: 'Add your income and main expenses. This takes 2 minutes and shows you exactly where you stand.',
        };
      default:
        return {
          title: 'Explore your dashboard',
          description: 'Take a look around and see what Scout can do for you.',
        };
    }
  };

  const completeOnboarding = useCallback(async () => {
    try {
      feedback.onGoalAchieved(); // Celebration haptic for completing onboarding
      await AsyncStorage.setItem('onboarding_completed', 'true');
      await AsyncStorage.setItem('onboarding_data', JSON.stringify({
        moneyGoal,
        trackingMethod,
        profileType,
      }));

      // After onboarding, user needs to sign up/log in
      // The _layout will handle routing to login
      // Store whether they want to link accounts for post-auth flow
      if (trackingMethod === 'link_accounts' || trackingMethod === 'mix_both') {
        await AsyncStorage.setItem('should_link_accounts', 'true');
      }

      router.replace('/login' as any);
    } catch (error) {
      console.error('Error saving onboarding state:', error);
      router.replace('/login' as any);
    }
  }, [moneyGoal, trackingMethod, profileType, router]);

  const nextStep = () => {
    feedback.onButtonPress();
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSelection = <T,>(setter: (value: T) => void, value: T) => {
    feedback.onSelectionMade();
    setter(value);
  };

  const renderProgressDots = () => (
    <View style={styles.progressContainer}>
      {[0, 1, 2, 3, 4].map((index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index === currentStep && styles.progressDotActive,
            index < currentStep && styles.progressDotCompleted,
          ]}
        />
      ))}
    </View>
  );

  // Screen 1: The Hook
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.contentSection}>
        <View style={styles.iconHeader}>
          <View style={styles.iconCircle}>
            <Sparkles size={32} color={Colors.primary} />
          </View>
        </View>
        <Text style={styles.title}>What&apos;s one money thing that&apos;s been on your mind?</Text>

        <View style={styles.optionsContainer}>
          {moneyGoalOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                moneyGoal === option.id && styles.optionCardSelected,
              ]}
              onPress={() => handleSelection(setMoneyGoal, option.id as MoneyGoal)}
            >
              <View style={styles.optionIcon}>{option.icon}</View>
              <Text style={[
                styles.optionLabel,
                moneyGoal === option.id && styles.optionLabelSelected,
              ]}>
                {option.label}
              </Text>
              {moneyGoal === option.id && (
                <CheckCircle size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, !moneyGoal && styles.primaryButtonDisabled]}
        onPress={nextStep}
        disabled={!moneyGoal}
      >
        <Text style={styles.primaryButtonText}>Let&apos;s fix that</Text>
        <ChevronRight size={20} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  // Screen 2: Immediate Value
  const renderStep2 = () => {
    const insight = getInsightForGoal();
    return (
      <View style={styles.stepContainer}>
        <View style={styles.contentSection}>
          <View style={styles.iconHeader}>
            <View style={styles.iconCircle}>
              <Search size={32} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.title}>Got it. Let&apos;s get you one quick win.</Text>

          <View style={styles.insightCard}>
            <Sparkles size={24} color={Colors.primary} />
            <Text style={styles.insightText}>{insight.title}</Text>
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
            <Text style={styles.primaryButtonText}>{insight.cta1}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={nextStep}>
            <Text style={styles.secondaryButtonText}>{insight.cta2}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Screen 3: Setup Choice
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.contentSection}>
        <Text style={styles.title}>How do you want to track your money?</Text>

        <View style={styles.optionsContainer}>
          {trackingOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCardLarge,
                trackingMethod === option.id && styles.optionCardSelected,
              ]}
              onPress={() => handleSelection(setTrackingMethod, option.id as TrackingMethod)}
            >
              <View style={styles.optionIconLarge}>{option.icon}</View>
              <View style={styles.optionTextContainer}>
                <Text style={[
                  styles.optionLabel,
                  trackingMethod === option.id && styles.optionLabelSelected,
                ]}>
                  {option.label}
                </Text>
                {option.description && (
                  <Text style={styles.optionDescription}>{option.description}</Text>
                )}
              </View>
              {trackingMethod === option.id && (
                <CheckCircle size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.helperText}>
          No wrong answer. You can change this anytime.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, !trackingMethod && styles.primaryButtonDisabled]}
        onPress={nextStep}
        disabled={!trackingMethod}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
        <ChevronRight size={20} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  // Screen 4: Profile Setup
  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.contentSection}>
        <Text style={styles.title}>Who is this account for?</Text>

        <View style={styles.optionsContainer}>
          {profileOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                profileType === option.id && styles.optionCardSelected,
              ]}
              onPress={() => handleSelection(setProfileType, option.id as ProfileType)}
            >
              <View style={styles.optionIcon}>{option.icon}</View>
              <Text style={[
                styles.optionLabel,
                profileType === option.id && styles.optionLabelSelected,
              ]}>
                {option.label}
              </Text>
              {profileType === option.id && (
                <CheckCircle size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.helperText}>
          Each profile gets its own view, rolls up to one dashboard.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, !profileType && styles.primaryButtonDisabled]}
        onPress={nextStep}
        disabled={!profileType}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
        <ChevronRight size={20} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  // Screen 5: First Action
  const renderStep5 = () => {
    const action = getFirstAction();
    return (
      <View style={styles.stepContainer}>
        <View style={styles.contentSection}>
          <View style={styles.iconHeader}>
            <View style={[styles.iconCircle, styles.iconCircleSuccess]}>
              <CheckCircle size={32} color={Colors.success} />
            </View>
          </View>
          <Text style={styles.title}>You&apos;re in!</Text>
          <Text style={styles.subtitle}>Here&apos;s your first action from Scout:</Text>

          <View style={styles.actionCard}>
            <View style={styles.actionHeader}>
              <Sparkles size={20} color={Colors.primary} />
              <Text style={styles.actionBadge}>Scout&apos;s Pick</Text>
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionDescription}>{action.description}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={completeOnboarding}>
          <Text style={styles.primaryButtonText}>Do it now</Text>
          <ChevronRight size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderStep1();
      case 1:
        return renderStep2();
      case 2:
        return renderStep3();
      case 3:
        return renderStep4();
      case 4:
        return renderStep5();
      default:
        return renderStep1();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderProgressDots()}
      {renderCurrentStep()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.borderLight,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  progressDotCompleted: {
    backgroundColor: Colors.primary,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 32,
  },
  contentSection: {
    flex: 1,
  },
  iconHeader: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSuccess: {
    backgroundColor: `${Colors.success}15`,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconLarge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: `${Colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  optionLabelSelected: {
    color: Colors.primary,
  },
  optionDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  helperText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
  insightCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  insightText: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 26,
  },
  actionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  actionBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  actionDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  buttonGroup: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: Colors.textLight,
    shadowOpacity: 0,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.white,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
