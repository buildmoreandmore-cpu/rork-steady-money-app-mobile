import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { AppState, AppStateStatus, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session } from "@supabase/supabase-js";

import Colors from "@/constants/colors";
import { supabase } from "@/services/supabase";

let SplashScreen: any = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  SplashScreen = require('expo-splash-screen');
  SplashScreen.preventAutoHideAsync();
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const isMounted = useRef(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(false);
  const [biometricVerified, setBiometricVerified] = useState<boolean>(false);

  useEffect(() => {
    isMounted.current = true;
    checkAppStatus();

    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted.current) {
        setSession(session);
      }
    });

    return () => {
      isMounted.current = false;
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
      if (!isMounted.current) return;
      setIsOnboardingComplete(completed === 'true');

      // Check biometric settings
      const bioEnabled = await AsyncStorage.getItem('biometric_enabled');
      if (!isMounted.current) return;
      setBiometricEnabled(bioEnabled === 'true');

      // Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted.current) return;
      setSession(session);

      // If biometric not enabled, consider verified
      if (bioEnabled !== 'true') {
        setBiometricVerified(true);
      }
    } catch (error) {
      console.error('Error checking app status:', error);
      if (isMounted.current) {
        setIsOnboardingComplete(false);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  // Re-check status when segments change
  useEffect(() => {
    checkAppStatus();
  }, [segments]);

  useEffect(() => {
    if (isLoading || isOnboardingComplete === null) return;

    const inOnboarding = (segments[0] as any) === 'onboarding';
    const inLogin = (segments[0] as any) === 'login';
    const inSignup = (segments[0] as any) === 'signup';
    const inAuth = (segments[0] as any) === 'auth';
    const isAuthScreen = inLogin || inSignup;

    if (!isOnboardingComplete && !inOnboarding) {
      router.replace('/onboarding' as any);
    } else if (isOnboardingComplete && !session && !isAuthScreen && !inOnboarding) {
      router.replace('/login' as any);
    } else if (session && biometricEnabled && !biometricVerified && !inAuth) {
      router.replace('/auth' as any);
    } else if (session && (!biometricEnabled || biometricVerified) && (isAuthScreen || inOnboarding || inAuth)) {
      router.replace('/(tabs)');
    }
  }, [isOnboardingComplete, session, biometricEnabled, biometricVerified, isLoading, segments, router]);

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
    if (Platform.OS !== 'web' && SplashScreen) {
      SplashScreen.hideAsync();
    }
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
