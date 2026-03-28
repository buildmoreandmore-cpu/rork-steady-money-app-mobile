/**
 * Notification Strategy Service
 *
 * PRINCIPLES:
 * - Weekly rituals build habits (Sunday evening, Saturday morning)
 * - Celebration only - positive reinforcement
 * - Curiosity triggers - pull users in
 * - NEVER send negative/anxiety-inducing notifications
 */

export type NotificationType =
  | 'weekly_ahead'      // Sunday evening
  | 'weekly_review'     // Saturday morning
  | 'goal_achieved'     // Celebration
  | 'streak'            // Consistency celebration
  | 'savings_decision'  // Money saved celebration
  | 'curiosity'         // Pull user in
  | 'projection_good'   // Positive projection change
  | 'quick_question';   // Engagement

export interface NotificationContent {
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, unknown>;
}

// Weekly Ritual Notifications
export const weeklyNotifications = {
  weekAhead: (upcomingBills: number, focusArea: string): NotificationContent => ({
    title: "Your week ahead with Scout",
    body: `${upcomingBills} bills coming up. Focus area: ${focusArea}`,
    type: 'weekly_ahead',
    data: { screen: 'manage', tab: 'bills' },
  }),

  weekReview: (decisionsCount: number, insight: string): NotificationContent => ({
    title: "Your week in review",
    body: `You made ${decisionsCount} decisions. ${insight}`,
    type: 'weekly_review',
    data: { screen: 'journey' },
  }),
};

// Celebration Notifications (ONLY positive)
export const celebrationNotifications = {
  goalAchieved: (goalName: string): NotificationContent => ({
    title: "You hit your savings goal 🎯",
    body: `${goalName} — complete. You did that.`,
    type: 'goal_achieved',
    data: { screen: 'journey' },
  }),

  streak: (weeks: number): NotificationContent => ({
    title: `${weeks} weeks of consistent tracking`,
    body: "That's rare air. Most people don't make it this far.",
    type: 'streak',
    data: { screen: 'today' },
  }),

  savingsDecision: (amount: number, action: string): NotificationContent => ({
    title: "Nice move 💪",
    body: `You made a decision that saves $${amount}/month. ${action}`,
    type: 'savings_decision',
    data: { screen: 'manage' },
  }),

  consistencyMilestone: (days: number): NotificationContent => ({
    title: "Building momentum",
    body: `${days} days of tracking. Your future self will thank you.`,
    type: 'streak',
    data: { screen: 'journey' },
  }),
};

// Curiosity Trigger Notifications
export const curiosityNotifications = {
  somethingInteresting: (teaser: string): NotificationContent => ({
    title: "Scout found something interesting",
    body: teaser,
    type: 'curiosity',
    data: { screen: 'today' },
  }),

  projectionImproved: (improvement: string): NotificationContent => ({
    title: "Your projection just changed",
    body: `In a good way. ${improvement}`,
    type: 'projection_good',
    data: { screen: 'journey' },
  }),

  quickQuestion: (question: string): NotificationContent => ({
    title: "Quick question when you have a sec",
    body: question,
    type: 'quick_question',
    data: { screen: 'decide' },
  }),

  scoutDiscovery: (): NotificationContent => ({
    title: "Scout noticed a pattern",
    body: "Tap to see what's changed.",
    type: 'curiosity',
    data: { screen: 'today' },
  }),
};

/**
 * BLOCKED NOTIFICATIONS
 * These should NEVER be sent as push notifications.
 * They create app avoidance and anxiety.
 *
 * ❌ "You overspent on dining this week"
 * ❌ "Your subscription renewed"
 * ❌ "You're over budget"
 * ❌ "Your balance is low"
 * ❌ "Bill payment failed"
 * ❌ "You missed your savings goal"
 *
 * This information should be available IN-APP for users who seek it,
 * but never pushed to them.
 */
export const BLOCKED_NOTIFICATION_PATTERNS = [
  'overspent',
  'over budget',
  'renewed',
  'failed',
  'missed',
  'low balance',
  'declined',
  'overdue',
  'late',
  'negative',
];

/**
 * Validates notification content to ensure it follows our positive-only policy
 */
export const validateNotification = (content: NotificationContent): boolean => {
  const text = `${content.title} ${content.body}`.toLowerCase();

  for (const pattern of BLOCKED_NOTIFICATION_PATTERNS) {
    if (text.includes(pattern)) {
      console.warn(`Blocked notification containing "${pattern}": ${content.title}`);
      return false;
    }
  }

  return true;
};

/**
 * Schedule configuration for weekly rituals
 */
export const NOTIFICATION_SCHEDULE = {
  weekAhead: {
    dayOfWeek: 0, // Sunday
    hour: 18,     // 6 PM
    minute: 0,
  },
  weekReview: {
    dayOfWeek: 6, // Saturday
    hour: 9,      // 9 AM
    minute: 0,
  },
};

/**
 * Example notification titles for reference
 */
export const NOTIFICATION_EXAMPLES = {
  allowed: [
    "You hit your savings goal 🎯",
    "4 weeks of consistent tracking—rare air",
    "You made a decision that saves $47/month",
    "Scout found something interesting",
    "Your projection just changed—in a good way",
    "Quick question when you have a sec",
    "Your week ahead with Scout",
    "Your week in review",
  ],
  blocked: [
    "You overspent on dining this week",
    "Your subscription renewed",
    "You're over budget",
    "Payment failed",
    "Bill overdue",
  ],
};
