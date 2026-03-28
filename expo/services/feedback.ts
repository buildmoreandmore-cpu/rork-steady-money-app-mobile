/**
 * Sound & Haptic Feedback Service
 *
 * DESIGN PRINCIPLES:
 * - Sounds are calm, not jarring (lower frequency)
 * - Haptics provide tactile confirmation
 * - Positive actions get feedback, negative states get silence
 * - Build anticipation, celebrate wins
 */

import { Platform } from 'react-native';

// Dynamic imports to prevent crashes in environments without native modules
let Haptics: any = null;
let Audio: any = null;
let modulesLoaded = false;

const loadModules = async () => {
  if (modulesLoaded) return;
  modulesLoaded = true;

  if (Platform.OS === 'web') return;

  try {
    Haptics = await import('expo-haptics');
  } catch (e) {
    console.log('expo-haptics not available');
  }

  try {
    const av = await import('expo-av');
    Audio = av.Audio;
  } catch (e) {
    console.log('expo-av not available');
  }
};

// Load modules immediately but don't block
loadModules();

export type FeedbackType =
  | 'decision_confirmed'
  | 'goal_achieved'
  | 'slider_adjusted'
  | 'action_completed'
  | 'weekly_review_opened'
  | 'button_press'
  | 'selection_made'
  | 'error';

const HapticStyles = {
  Light: 'light',
  Medium: 'medium',
  Heavy: 'heavy',
  Success: 'success',
  Warning: 'warning',
  Error: 'error',
};

interface FeedbackConfig {
  haptic: string | null;
  hapticType: 'impact' | 'notification' | null;
  sound: string | null;
}

const feedbackConfigs: Record<FeedbackType, FeedbackConfig> = {
  decision_confirmed: {
    haptic: HapticStyles.Medium,
    hapticType: 'impact',
    sound: 'click',
  },
  goal_achieved: {
    haptic: HapticStyles.Success,
    hapticType: 'notification',
    sound: 'celebration',
  },
  slider_adjusted: {
    haptic: HapticStyles.Light,
    hapticType: 'impact',
    sound: null,
  },
  action_completed: {
    haptic: HapticStyles.Success,
    hapticType: 'notification',
    sound: 'chime',
  },
  weekly_review_opened: {
    haptic: null,
    hapticType: null,
    sound: null,
  },
  button_press: {
    haptic: HapticStyles.Light,
    hapticType: 'impact',
    sound: null,
  },
  selection_made: {
    haptic: HapticStyles.Light,
    hapticType: 'impact',
    sound: null,
  },
  error: {
    haptic: HapticStyles.Error,
    hapticType: 'notification',
    sound: null,
  },
};

class FeedbackService {
  private soundObjects: Map<string, any> = new Map();
  private isInitialized = false;
  private isMuted = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Ensure modules are loaded
    await loadModules();

    try {
      if (Audio) {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: false,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      }
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize feedback service:', error);
    }
  }

  async trigger(type: FeedbackType): Promise<void> {
    const config = feedbackConfigs[type];

    if (config.haptic !== null && config.hapticType !== null) {
      await this.triggerHaptic(config.haptic, config.hapticType);
    }

    if (config.sound && !this.isMuted) {
      await this.playSound(config.sound);
    }
  }

  private async triggerHaptic(
    style: string,
    type: 'impact' | 'notification'
  ): Promise<void> {
    try {
      if (Platform.OS === 'web' || !Haptics) return;

      if (type === 'impact') {
        const impactStyle =
          style === 'light' ? Haptics.ImpactFeedbackStyle?.Light :
          style === 'medium' ? Haptics.ImpactFeedbackStyle?.Medium :
          Haptics.ImpactFeedbackStyle?.Heavy;

        if (impactStyle && Haptics.impactAsync) {
          await Haptics.impactAsync(impactStyle);
        }
      } else {
        const notifStyle =
          style === 'success' ? Haptics.NotificationFeedbackType?.Success :
          style === 'warning' ? Haptics.NotificationFeedbackType?.Warning :
          Haptics.NotificationFeedbackType?.Error;

        if (notifStyle && Haptics.notificationAsync) {
          await Haptics.notificationAsync(notifStyle);
        }
      }
    } catch {
      console.debug('Haptic feedback not available');
    }
  }

  private async playSound(soundName: string): Promise<void> {
    console.debug(`[Feedback] Would play sound: ${soundName}`);
  }

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

  setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  async cleanup(): Promise<void> {
    for (const sound of this.soundObjects.values()) {
      try {
        await sound.unloadAsync();
      } catch {
        // Ignore cleanup errors
      }
    }
    this.soundObjects.clear();
  }
}

export const feedback = new FeedbackService();

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
