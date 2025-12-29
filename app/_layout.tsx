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
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(false);

  useEffect(() => {
    checkAppStatus();
  }, []);

  // Re-authenticate when app comes to foreground (only if biometric is enabled)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isOnboardingComplete && biometricEnabled) {
        checkAuthStatus();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isOnboardingComplete, biometricEnabled]);

  const checkAppStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem('onboarding_completed');
      const authenticated = await AsyncStorage.getItem('authenticated');
      const bioEnabled = await AsyncStorage.getItem('biometric_enabled');

      setIsOnboardingComplete(completed === 'true');
      setBiometricEnabled(bioEnabled === 'true');

      // If biometric is not enabled, consider user authenticated
      if (bioEnabled !== 'true') {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(authenticated === 'true');
      }
    } catch (error) {
      console.error('Error checking app status:', error);
      setIsOnboardingComplete(false);
      setIsAuthenticated(true); // Default to authenticated if error
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
    } else if (isOnboardingComplete && biometricEnabled && !isAuthenticated && !inAuth) {
      // Onboarded, biometric enabled, but not authenticated - go to auth
      router.replace('/auth');
    } else if (isOnboardingComplete && isAuthenticated && (inOnboarding || inAuth)) {
      // Fully authenticated - go to main app
      router.replace('/(tabs)');
    }
  }, [isOnboardingComplete, isAuthenticated, biometricEnabled, segments]);

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
