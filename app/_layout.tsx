import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAppStatus();
  }, []);

  // Re-authenticate when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isOnboardingComplete) {
        checkAuthStatus();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isOnboardingComplete]);

  const checkAppStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem('onboarding_completed');
      const authenticated = await AsyncStorage.getItem('authenticated');
      setIsOnboardingComplete(completed === 'true');
      setIsAuthenticated(authenticated === 'true');
    } catch (error) {
      console.error('Error checking app status:', error);
      setIsOnboardingComplete(false);
      setIsAuthenticated(false);
    }
  };

  const checkAuthStatus = async () => {
    // Clear auth status to require re-authentication
    await AsyncStorage.removeItem('authenticated');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (isOnboardingComplete === null || isAuthenticated === null) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inAuth = segments[0] === 'auth';

    if (!isOnboardingComplete && !inOnboarding) {
      // Not onboarded - go to onboarding
      router.replace('/onboarding');
    } else if (isOnboardingComplete && !isAuthenticated && !inAuth) {
      // Onboarded but not authenticated - go to auth
      router.replace('/auth');
    } else if (isOnboardingComplete && isAuthenticated && (inOnboarding || inAuth)) {
      // Fully authenticated - go to main app
      router.replace('/(tabs)');
    }
  }, [isOnboardingComplete, isAuthenticated, segments]);

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
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
