import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  GestureResponderEvent,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, Calendar, DollarSign, Target, Check } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { feedback } from '@/services/feedback';

interface SliderProps {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onValueChange: (value: number) => void;
}

function CustomSlider({ label, leftLabel, rightLabel, value, onValueChange }: SliderProps) {
  const sliderWidth = useRef(0);
  const sliderX = useRef(0);
  const lastHapticValue = useRef(value);

  const handleTouch = useCallback((evt: GestureResponderEvent) => {
    if (sliderWidth.current > 0) {
      const touchX = evt.nativeEvent.pageX - sliderX.current;
      const newValue = Math.max(0, Math.min(1, touchX / sliderWidth.current));

      // Trigger haptic every 10% change
      const lastStep = Math.round(lastHapticValue.current * 10);
      const newStep = Math.round(newValue * 10);
      if (lastStep !== newStep) {
        feedback.onSliderAdjusted();
        lastHapticValue.current = newValue;
      }

      onValueChange(newValue);
    }
  }, [onValueChange]);

  return (
    <View style={styles.sliderContainer}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <View
        style={styles.sliderTrack}
        onLayout={(e) => {
          sliderWidth.current = e.nativeEvent.layout.width;
          e.target.measure((x, y, width, height, pageX) => {
            sliderX.current = pageX;
          });
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleTouch}
        onResponderMove={handleTouch}
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

  // Intent-based budgeting: Fixed, Strategic, Lifestyle (matching landing page)
  const [fixed, setFixed] = useState(0.5);        // Fixed costs (rent, bills, etc.)
  const [strategic, setStrategic] = useState(0.3); // Strategic (savings, debt payoff)
  const [lifestyle, setLifestyle] = useState(0.2); // Lifestyle (fun, discretionary)

  const calculateProjections = useCallback(() => {
    const baseDebtFreeMonths = 24;
    const baseEmergencyMonths = 18;
    const baseBreathingRoom = 450;

    // More strategic allocation = faster debt payoff
    const strategicMultiplier = 1 + (strategic - 0.3) * 1.5;
    // Lower fixed costs = more room for growth
    const fixedImpact = (0.5 - fixed) * 0.5;
    const lifestyleImpact = (lifestyle - 0.2) * 300;

    const debtFreeMonths = Math.round(baseDebtFreeMonths / strategicMultiplier);
    const emergencyMonths = Math.round(baseEmergencyMonths / (strategicMultiplier + fixedImpact));
    const breathingRoom = Math.round(baseBreathingRoom + (lifestyle * 500) - (fixed * 200));

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
      fixedPercent: Math.round(fixed * 100),
      strategicPercent: Math.round(strategic * 100),
      lifestylePercent: Math.round(lifestyle * 100),
    };
  }, [fixed, strategic, lifestyle]);

  const projections = calculateProjections();
  const [planSaved, setPlanSaved] = useState(false);

  const handleSavePlan = useCallback(() => {
    feedback.onDecisionConfirmed();
    setPlanSaved(true);
    Alert.alert(
      'Plan Saved! 🎉',
      `Your budget plan has been saved:\n\n• Fixed: ${projections.fixedPercent}%\n• Strategic: ${projections.strategicPercent}%\n• Lifestyle: ${projections.lifestylePercent}%\n\nScout will help you stay on track!`,
      [{ text: 'Great!' }]
    );
  }, [projections]);

  const handleTryAnother = useCallback(() => {
    feedback.onButtonPress();
    // Reset to default values
    setFixed(0.5);
    setStrategic(0.3);
    setLifestyle(0.2);
    setPlanSaved(false);
    Alert.alert(
      'Reset to Default',
      'Sliders reset to the recommended 50/30/20 split. Try adjusting to see different outcomes!',
      [{ text: 'OK' }]
    );
  }, []);

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
            Plan your intent, not your limits. Adjust sliders to see your future.
          </Text>
        </View>

        <View style={styles.slidersSection}>
          <CustomSlider
            label={`Fixed (Living) - ${projections.fixedPercent}%`}
            leftLabel="Less"
            rightLabel="More"
            value={fixed}
            onValueChange={setFixed}
          />

          <CustomSlider
            label={`Strategic (Growth) - ${projections.strategicPercent}%`}
            leftLabel="Less"
            rightLabel="More"
            value={strategic}
            onValueChange={setStrategic}
          />

          <CustomSlider
            label={`Lifestyle (Fun) - ${projections.lifestylePercent}%`}
            leftLabel="Less"
            rightLabel="More"
            value={lifestyle}
            onValueChange={setLifestyle}
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
          <TouchableOpacity
            style={[styles.primaryActionButton, planSaved && styles.primaryActionButtonSaved]}
            onPress={handleSavePlan}
          >
            {planSaved && <Check size={18} color={Colors.white} style={{ marginRight: 6 }} />}
            <Text style={styles.primaryActionText}>
              {planSaved ? 'Plan saved!' : 'Save this plan'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={handleTryAnother}
          >
            <Text style={styles.secondaryActionText}>Try another scenario</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scoutNote}>
          <Text style={styles.scoutNoteText}>
            💡 Scout&apos;s tip: A balanced split is 50% Fixed, 30% Strategic, 20% Lifestyle. More Strategic = earlier freedom.
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
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionButtonSaved: {
    backgroundColor: Colors.success,
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
