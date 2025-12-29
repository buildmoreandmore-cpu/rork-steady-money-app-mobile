import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, Calendar, DollarSign, Target } from 'lucide-react-native';

import Colors from '@/constants/colors';

interface SliderProps {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onValueChange: (value: number) => void;
}

function CustomSlider({ label, leftLabel, rightLabel, value, onValueChange }: SliderProps) {
  const sliderWidth = useRef(0);
  const pan = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gestureState) => {
        pan.setOffset(gestureState.x0);
      },
      onPanResponderMove: (evt) => {
        if (sliderWidth.current > 0) {
          const newValue = Math.max(0, Math.min(1, evt.nativeEvent.locationX / sliderWidth.current));
          onValueChange(newValue);
        }
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  return (
    <View style={styles.sliderContainer}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <View
        style={styles.sliderTrack}
        onLayout={(e) => {
          sliderWidth.current = e.nativeEvent.layout.width;
        }}
        {...panResponder.panHandlers}
      >
        <View style={[styles.sliderFill, { width: `${value * 100}%` }]} />
        <View style={[styles.sliderThumb, { left: `${value * 100}%` }]} />
      </View>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderEndLabel}>{leftLabel}</Text>
        <Text style={styles.sliderEndLabel}>{rightLabel}</Text>
      </View>
    </View>
  );
}

export default function DecideScreen() {
  const insets = useSafeAreaInsets();
  
  const [savingsDebt, setSavingsDebt] = useState(0.6);
  const [lifestyle, setLifestyle] = useState(0.5);
  const [timeline, setTimeline] = useState(0.5);

  const calculateProjections = useCallback(() => {
    const baseDebtFreeMonths = 24;
    const baseEmergencyMonths = 18;
    const baseBreathingRoom = 450;

    const debtMultiplier = 1 + (savingsDebt - 0.5) * 0.8;
    const timelineMultiplier = 1 - (timeline - 0.5) * 0.4;
    const lifestyleImpact = (lifestyle - 0.5) * 200;

    const debtFreeMonths = Math.round(baseDebtFreeMonths * debtMultiplier * timelineMultiplier);
    const emergencyMonths = Math.round(baseEmergencyMonths * (2 - debtMultiplier) * timelineMultiplier);
    const breathingRoom = Math.round(baseBreathingRoom - lifestyleImpact);

    const debtFreeDate = new Date();
    debtFreeDate.setMonth(debtFreeDate.getMonth() + debtFreeMonths);

    const emergencyDate = new Date();
    emergencyDate.setMonth(emergencyDate.getMonth() + emergencyMonths);

    return {
      debtFreeDate: debtFreeDate.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      emergencyFundDate: emergencyDate.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      breathingRoom: Math.max(100, breathingRoom),
    };
  }, [savingsDebt, lifestyle, timeline]);

  const projections = calculateProjections();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>What if...</Text>
          <Text style={styles.subtitle}>
            Adjust the sliders to see how different choices affect your future
          </Text>
        </View>

        <View style={styles.slidersSection}>
          <CustomSlider
            label="Put more toward:"
            leftLabel="Savings"
            rightLabel="Debt payoff"
            value={savingsDebt}
            onValueChange={setSavingsDebt}
          />
          
          <CustomSlider
            label="Lifestyle spending:"
            leftLabel="Less"
            rightLabel="More"
            value={lifestyle}
            onValueChange={setLifestyle}
          />
          
          <CustomSlider
            label="Timeline:"
            leftLabel="Steadier"
            rightLabel="Faster"
            value={timeline}
            onValueChange={setTimeline}
          />
        </View>

        <View style={styles.projectionsSection}>
          <Text style={styles.projectionsTitle}>Your projection updates in real-time:</Text>
          
          <View style={styles.projectionCard}>
            <View style={styles.projectionItem}>
              <View style={styles.projectionIcon}>
                <Target size={20} color={Colors.primary} />
              </View>
              <View style={styles.projectionContent}>
                <Text style={styles.projectionLabel}>Debt-free by</Text>
                <Text style={styles.projectionValue}>{projections.debtFreeDate}</Text>
              </View>
              <ArrowRight size={16} color={Colors.textLight} />
            </View>

            <View style={styles.projectionDivider} />

            <View style={styles.projectionItem}>
              <View style={styles.projectionIcon}>
                <Calendar size={20} color={Colors.success} />
              </View>
              <View style={styles.projectionContent}>
                <Text style={styles.projectionLabel}>Emergency fund complete by</Text>
                <Text style={styles.projectionValue}>{projections.emergencyFundDate}</Text>
              </View>
              <ArrowRight size={16} color={Colors.textLight} />
            </View>

            <View style={styles.projectionDivider} />

            <View style={styles.projectionItem}>
              <View style={styles.projectionIcon}>
                <DollarSign size={20} color={Colors.warning} />
              </View>
              <View style={styles.projectionContent}>
                <Text style={styles.projectionLabel}>Monthly breathing room</Text>
                <Text style={styles.projectionValue}>${projections.breathingRoom}</Text>
              </View>
              <ArrowRight size={16} color={Colors.textLight} />
            </View>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.primaryActionButton}>
            <Text style={styles.primaryActionText}>Save this plan</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryActionButton}>
            <Text style={styles.secondaryActionText}>Try another scenario</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scoutNote}>
          <Text style={styles.scoutNoteText}>
            💡 Scout&apos;s tip: Most people find balance around 60% debt focus. You&apos;re at {Math.round(savingsDebt * 100)}%.
          </Text>
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
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  slidersSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    gap: 32,
  },
  sliderContainer: {
    gap: 12,
  },
  sliderLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 4,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    top: -8,
    marginLeft: -12,
    width: 24,
    height: 24,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: Colors.primary,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderEndLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  projectionsSection: {
    marginBottom: 24,
  },
  projectionsTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  projectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  projectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  projectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  projectionContent: {
    flex: 1,
  },
  projectionLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  projectionValue: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  projectionDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 68,
  },
  actionsSection: {
    gap: 12,
    marginBottom: 24,
  },
  primaryActionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryActionText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  secondaryActionButton: {
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryActionText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  scoutNote: {
    backgroundColor: `${Colors.primary}10`,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  scoutNoteText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});
