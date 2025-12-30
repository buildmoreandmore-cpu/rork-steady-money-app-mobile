import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session } from "@supabase/supabase-js";

import Colors from "@/constants/colors";
import { supabase } from "@/services/supabase";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(false);
  const [biometricVerified, setBiometricVerified] = useState<boolean>(false);

  useEffect(() => {
    checkAppStatus();

    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Re-authenticate with biometric when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && session && biometricEnabled) {
        setBiometricVerified(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [session, biometricEnabled]);

  const checkAppStatus = async () => {
    try {
      // Check onboarding status
      const completed = await AsyncStorage.getItem('onboarding_completed');
      setIsOnboardingComplete(completed === 'true');

      // Check biometric settings
      const bioEnabled = await AsyncStorage.getItem('biometric_enabled');
      setBiometricEnabled(bioEnabled === 'true');

      // Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      // If biometric not enabled, consider verified
      if (bioEnabled !== 'true') {
        setBiometricVerified(true);
      }
    } catch (error) {
      console.error('Error checking app status:', error);
      setIsOnboardingComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-check status when segments change
  useEffect(() => {
    checkAppStatus();
  }, [segments]);

  useEffect(() => {
    if (isLoading || isOnboardingComplete === null) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inLogin = segments[0] === 'login';
    const inSignup = segments[0] === 'signup';
    const inAuth = segments[0] === 'auth';
    const inLinkAccount = segments[0] === 'link-account';
    const inTabs = segments[0] === '(tabs)';
    const isAuthScreen = inLogin || inSignup;

    if (!isOnboardingComplete && !inOnboarding) {
      // Not onboarded - go to onboarding
      router.replace('/onboarding');
    } else if (isOnboardingComplete && !session && !isAuthScreen && !inOnboarding) {
      // Onboarded but not logged in - go to login
      router.replace('/login');
    } else if (session && biometricEnabled && !biometricVerified && !inAuth) {
      // Logged in but needs biometric verification
      router.replace('/auth');
    } else if (session && (!biometricEnabled || biometricVerified) && (isAuthScreen || inOnboarding || inAuth)) {
      // Fully authenticated - go to main app
      router.replace('/(tabs)');
    }
  }, [isOnboardingComplete, session, biometricEnabled, biometricVerified, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="link-account" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="action-detail"
        options={{
          presentation: "modal",
          headerShown: true,
          headerTitle: "Scout's Pick",
          headerStyle: { backgroundColor: Colors.surface },
          headerTitleStyle: { color: Colors.text, fontWeight: '600' },
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: true,
          headerTitle: "Settings",
          headerStyle: { backgroundColor: Colors.background },
          headerTitleStyle: { color: Colors.text, fontWeight: '600' },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <RootLayoutNav />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
