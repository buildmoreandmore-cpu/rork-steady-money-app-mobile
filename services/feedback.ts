/**
 * Sound & Haptic Feedback Service
 *
 * DESIGN PRINCIPLES:
 * - Sounds are calm, not jarring (lower frequency)
 * - Haptics provide tactile confirmation
 * - Positive actions get feedback, negative states get silence
 * - Build anticipation, celebrate wins
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

let Audio: any = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Audio = require('expo-av').Audio;
}

export type FeedbackType =
  | 'decision_confirmed'    // Satisfying click + medium tap
  | 'goal_achieved'         // Warm celebration + success pattern
  | 'slider_adjusted'       // Subtle tick + light tap
  | 'action_completed'      // Gentle chime + double tap
  | 'weekly_review_opened'  // None (anticipation)
  | 'button_press'          // Light tap only
  | 'selection_made'        // Light tap only
  | 'error';                // Medium tap only (no sound)

interface FeedbackConfig {
  haptic: Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType | null;
  hapticType: 'impact' | 'notification' | null;
  sound: string | null;
}

const feedbackConfigs: Record<FeedbackType, FeedbackConfig> = {
  decision_confirmed: {
    haptic: Haptics.ImpactFeedbackStyle.Medium,
    hapticType: 'impact',
    sound: 'click',
  },
  goal_achieved: {
    haptic: Haptics.NotificationFeedbackType.Success,
    hapticType: 'notification',
    sound: 'celebration',
  },
  slider_adjusted: {
    haptic: Haptics.ImpactFeedbackStyle.Light,
    hapticType: 'impact',
    sound: null, // Subtle - no sound for frequent action
  },
  action_completed: {
    haptic: Haptics.NotificationFeedbackType.Success,
    hapticType: 'notification',
    sound: 'chime',
  },
  weekly_review_opened: {
    haptic: null,
    hapticType: null,
    sound: null, // Build anticipation with silence
  },
  button_press: {
    haptic: Haptics.ImpactFeedbackStyle.Light,
    hapticType: 'impact',
    sound: null,
  },
  selection_made: {
    haptic: Haptics.ImpactFeedbackStyle.Light,
    hapticType: 'impact',
    sound: null,
  },
  error: {
    haptic: Haptics.NotificationFeedbackType.Error,
    hapticType: 'notification',
    sound: null, // No sound for errors - don't punish
  },
};

/**
 * NO FEEDBACK FOR NEGATIVE STATES
 * These actions should have no sound or haptic feedback
 * to avoid negative associations with the app.
 *
 * ❌ Viewing overspending
 * ❌ Subscription renewals
 * ❌ Negative balance changes
 * ❌ Over budget alerts
 * ❌ Missed goals
 */

class FeedbackService {
  private soundObjects: Map<string, any> = new Map();
  private isInitialized = false;
  private isMuted = false;

  /**
   * Initialize the feedback service and preload sounds
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (Platform.OS !== 'web' && Audio) {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: false, // Respect silent mode
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      }

      // Note: In production, you would load actual sound files here
      // For now, we'll use haptics only and log sound intentions

      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize feedback service:', error);
    }
  }

  /**
   * Trigger feedback for a specific action
   */
  async trigger(type: FeedbackType): Promise<void> {
    const config = feedbackConfigs[type];

    // Trigger haptic feedback
    if (config.haptic !== null && config.hapticType !== null) {
      await this.triggerHaptic(config.haptic, config.hapticType);
    }

    // Trigger sound (if not muted and sound exists)
    if (config.sound && !this.isMuted) {
      await this.playSound(config.sound);
    }
  }

  /**
   * Trigger haptic feedback
   */
  private async triggerHaptic(
    style: Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType,
    type: 'impact' | 'notification'
  ): Promise<void> {
    try {
      if (Platform.OS === 'web') return;

      if (type === 'impact') {
        await Haptics.impactAsync(style as Haptics.ImpactFeedbackStyle);
      } else {
        await Haptics.notificationAsync(style as Haptics.NotificationFeedbackType);
      }
    } catch {
      // Haptics may not be available on all devices
      console.debug('Haptic feedback not available');
    }
  }

  /**
   * Play a sound
   * Note: In production, implement actual sound loading
   */
  private async playSound(soundName: string): Promise<void> {
    // Log the intended sound for development
    console.debug(`[Feedback] Would play sound: ${soundName}`);

    // In production, you would:
    // 1. Load the sound file from assets
    // 2. Play it with appropriate volume
    // Example:
    // const sound = this.soundObjects.get(soundName);
    // if (sound) await sound.replayAsync();
  }

  /**
   * Convenience methods for common actions
   */
  async onDecisionConfirmed(): Promise<void> {
    await this.trigger('decision_confirmed');
  }

  async onGoalAchieved(): Promise<void> {
    await this.trigger('goal_achieved');
  }

  async onSliderAdjusted(): Promise<void> {
    await this.trigger('slider_adjusted');
  }

  async onActionCompleted(): Promise<void> {
    await this.trigger('action_completed');
  }

  async onButtonPress(): Promise<void> {
    await this.trigger('button_press');
  }

  async onSelectionMade(): Promise<void> {
    await this.trigger('selection_made');
  }

  /**
   * Mute/unmute sounds (haptics still work)
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  /**
   * Cleanup sounds when app closes
   */
  async cleanup(): Promise<void> {
    for (const sound of this.soundObjects.values()) {
      await sound.unloadAsync();
    }
    this.soundObjects.clear();
  }
}

// Export singleton instance
export const feedback = new FeedbackService();

/**
 * Hook for using feedback in components
 */
export const useFeedback = () => {
  return {
    trigger: feedback.trigger.bind(feedback),
    onDecisionConfirmed: feedback.onDecisionConfirmed.bind(feedback),
    onGoalAchieved: feedback.onGoalAchieved.bind(feedback),
    onSliderAdjusted: feedback.onSliderAdjusted.bind(feedback),
    onActionCompleted: feedback.onActionCompleted.bind(feedback),
    onButtonPress: feedback.onButtonPress.bind(feedback),
    onSelectionMade: feedback.onSelectionMade.bind(feedback),
  };
};

/**
 * Sound Design Specifications (for audio team)
 *
 * NOTIFICATION SOUND:
 * - Soft, two-tone chime
 * - Lower frequency than typical alerts (200-400 Hz base)
 * - Duration: 0.5-0.8 seconds
 * - Calm, not jarring
 * - Distinct enough to recognize as Steady
 *
 * IN-APP SOUNDS:
 *
 * 1. "click" (decision_confirmed)
 *    - Satisfying mechanical click
 *    - Short, crisp (0.1s)
 *    - Frequency: ~800 Hz
 *
 * 2. "celebration" (goal_achieved)
 *    - Warm, ascending tone
 *    - Musical, rewarding feel
 *    - Duration: 0.8-1s
 *    - Think: achievement unlocked
 *
 * 3. "tick" (slider_adjusted)
 *    - Subtle, soft tick
 *    - Very short (0.05s)
 *    - Low volume
 *
 * 4. "chime" (action_completed)
 *    - Gentle, pleasant chime
 *    - Single tone, resonant
 *    - Duration: 0.4s
 */
