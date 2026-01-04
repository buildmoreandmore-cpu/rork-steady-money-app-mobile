import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Sparkles, User, Trash2 } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { scoutService, ChatMessage } from '@/services/scout';
import { feedback } from '@/services/feedback';
import { dataService } from '@/services/data';

const SUGGESTED_PROMPTS = [
  "Can I afford a $500 purchase?",
  "How can I save more money?",
  "Help me understand my spending",
  "What subscriptions should I cancel?",
];

export default function ScoutScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Load real data for Scout context
    const loadScoutContext = async () => {
      try {
        // Fetch real data from Supabase
        const [snapshot, subscriptions, bills, goals, transactions, netWorthHistory] = await Promise.all([
          dataService.getFinancialSnapshot(),
          dataService.getSubscriptions(),
          dataService.getBills(),
          dataService.getGoals(),
          dataService.getRecentTransactions(10),
          dataService.getNetWorthHistory(),
        ]);

        // Calculate savings rate if we have income and expenses
        const savingsRate = snapshot.monthlyIncome > 0
          ? ((snapshot.monthlyIncome - snapshot.monthlyExpenses) / snapshot.monthlyIncome) * 100
          : 0;

        // Set context with real data (empty arrays/zeros if no data yet)
        scoutService.setContext({
          // Financial snapshot
          netWorth: snapshot.netWorth,
          netWorthChange: snapshot.netWorthChange,
          monthlyIncome: snapshot.monthlyIncome,
          monthlyExpenses: snapshot.monthlyExpenses,
          savingsRate: savingsRate,

          // Transactions
          recentTransactions: transactions.map((t: any) => ({
            merchant: t.merchant_name || t.name || 'Unknown',
            amount: t.amount,
            category: Array.isArray(t.category) ? t.category[0] : (t.category || 'Other'),
            type: t.amount < 0 ? 'expense' : 'income',
          })),

          // Subscriptions
          subscriptions: subscriptions.map((s: any) => ({
            name: s.name,
            amount: s.amount,
            hoursUsed: s.hours_used,
            lastUsed: s.last_used_at,
          })),

          // Bills
          bills: bills.map((b: any) => ({
            name: b.name,
            amount: b.amount,
            dueDate: `Day ${b.due_day}`,
            isAutoPay: b.is_auto_pay,
          })),

          // Goals
          goals: goals.map((g: any) => ({
            name: g.name,
            target: g.target_amount,
            current: g.current_amount,
          })),

          // Budget allocations (from settings or defaults)
          budget: {
            fixedPercent: 50,
            strategicPercent: 20,
            lifestylePercent: 30,
          },

          // Timeline/net worth history
          timeline: netWorthHistory.map((n: any) => ({
            label: new Date(n.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            netWorth: n.net_worth,
            isFuture: new Date(n.date) > new Date(),
          })),
        });

        console.log('Scout context loaded with real data');
      } catch (error) {
        console.error('Error loading Scout context:', error);
        // Set empty context if data fails to load
        scoutService.setContext({});
      }
    };

    loadScoutContext();

    // Load conversation history
    setMessages(scoutService.getConversationHistory());

    // Add welcome message if no history
    if (scoutService.getConversationHistory().length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: "Hey! I'm Scout, your personal financial advisor. I'm here to help you make smart money decisions and find easy wins in your budget.\n\nConnect your bank account to get personalized insights, or ask me general financial questions!",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;

    feedback.onButtonPress();
    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      await scoutService.sendMessage(userMessage);
      feedback.onActionCompleted();

      // Update messages from service (includes both user and assistant)
      setMessages(scoutService.getConversationHistory());
    } catch (error) {
      console.error('Error sending message:', error);
      // Update messages to show what was added by service
      setMessages(scoutService.getConversationHistory());
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading]);

  const handlePromptPress = useCallback((prompt: string) => {
    feedback.onSelectionMade();
    setInputText(prompt);
  }, []);

  const handleClearChat = useCallback(() => {
    feedback.onButtonPress();
    scoutService.clearHistory();
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: "Chat cleared! What would you like to talk about?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageContainer, isUser && styles.userMessageContainer]}>
        <View style={[styles.avatarContainer, isUser && styles.userAvatarContainer]}>
          {isUser ? (
            <User size={18} color={Colors.white} />
          ) : (
            <Sparkles size={18} color={Colors.white} />
          )}
        </View>
        <View style={[styles.messageBubble, isUser && styles.userBubble]}>
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  const renderSuggestedPrompts = () => {
    if (messages.length > 2) return null;

    return (
      <View style={styles.suggestedPromptsContainer}>
        <Text style={styles.suggestedTitle}>Try asking:</Text>
        <View style={styles.promptsGrid}>
          {SUGGESTED_PROMPTS.map((prompt, index) => (
            <TouchableOpacity
              key={index}
              style={styles.promptChip}
              onPress={() => handlePromptPress(prompt)}
            >
              <Text style={styles.promptText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.scoutIcon}>
            <Sparkles size={24} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Scout</Text>
            <Text style={styles.headerSubtitle}>Your financial advisor</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearChat}>
          <Trash2 size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListFooterComponent={
          <>
            {isLoading && (
              <View style={styles.loadingContainer}>
                <View style={styles.avatarContainer}>
                  <Sparkles size={18} color={Colors.white} />
                </View>
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.typingText}>Scout is thinking...</Text>
                </View>
              </View>
            )}
            {renderSuggestedPrompts()}
          </>
        }
      />

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask Scout anything about your finances..."
            placeholderTextColor={Colors.textLight}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 100,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    flexDirection: 'row-reverse',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userAvatarContainer: {
    marginRight: 0,
    marginLeft: 10,
    backgroundColor: Colors.secondary,
  },
  messageBubble: {
    maxWidth: '75%',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
  },
  userMessageText: {
    color: Colors.white,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  suggestedPromptsContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  suggestedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  promptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  promptChip: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  promptText: {
    fontSize: 14,
    color: Colors.text,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.background,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 100,
    paddingVertical: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
});
