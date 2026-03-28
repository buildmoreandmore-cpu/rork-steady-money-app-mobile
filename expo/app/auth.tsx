import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Fingerprint, Scan } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Colors from '@/constants/colors';

let LocalAuthentication: any = null;
let isChecked = false;

const getLocalAuth = async () => {
  if (Platform.OS === 'web') return null;
  if (isChecked) return LocalAuthentication;
  
  try {
    LocalAuthentication = await import('expo-local-authentication');
    isChecked = true;
    return LocalAuthentication;
  } catch (e) {
    console.log('Local authentication not available:', e);
    isChecked = true;
    return null;
  }
};

export default function AuthScreen() {
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricType, setBiometricType] = useState<'face' | 'fingerprint' | 'none'>('none');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkBiometricSupport();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkBiometricSupport = async () => {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem('authenticated', 'true');
      router.replace('/(tabs)');
      return;
    }

    const auth = await getLocalAuth();
    if (!auth) {
      await AsyncStorage.setItem('authenticated', 'true');
      router.replace('/(tabs)');
      return;
    }

    const compatible = await auth.hasHardwareAsync();
    const enrolled = await auth.isEnrolledAsync();

    if (compatible && enrolled) {
      const types = await auth.supportedAuthenticationTypesAsync();
      if (types.includes(auth.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('face');
      } else if (types.includes(auth.AuthenticationType.FINGERPRINT)) {
        setBiometricType('fingerprint');
      }
      authenticate();
    } else {
      await AsyncStorage.setItem('authenticated', 'true');
      router.replace('/(tabs)');
    }
  };

  const authenticate = async () => {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem('authenticated', 'true');
      router.replace('/(tabs)');
      return;
    }

    const auth = await getLocalAuth();
    if (!auth) {
      await AsyncStorage.setItem('authenticated', 'true');
      router.replace('/(tabs)');
      return;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      const result = await auth.authenticateAsync({
        promptMessage: 'Authenticate to access Steady',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        await AsyncStorage.setItem('authenticated', 'true');
        router.replace('/(tabs)');
      } else {
        if (result.error === 'user_cancel') {
          setError('Authentication cancelled');
        } else {
          setError('Authentication failed. Please try again.');
        }
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const BiometricIcon = biometricType === 'face' ? Scan : Fingerprint;
  const biometricLabel = biometricType === 'face'
    ? (Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition')
    : 'Touch ID';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo and Branding */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Shield size={48} color={Colors.primary} strokeWidth={2.5} />
          </View>
          <Text style={styles.title}>Steady</Text>
          <Text style={styles.subtitle}>Secure Access</Text>
        </View>

        {/* Auth Card */}
        <View style={styles.authCard}>
          <View style={styles.iconContainer}>
            <BiometricIcon size={64} color={Colors.primary} strokeWidth={1.5} />
          </View>

          <Text style={styles.authTitle}>
            {biometricType !== 'none' ? biometricLabel : 'Biometric Authentication'}
          </Text>

          <Text style={styles.authDescription}>
            {biometricType !== 'none'
              ? `Use ${biometricLabel} to securely access your financial data`
              : 'Set up biometric authentication in your device settings to continue'}
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.authButton, isAuthenticating && styles.authButtonDisabled]}
            onPress={authenticate}
            disabled={isAuthenticating || biometricType === 'none'}
          >
            <BiometricIcon size={24} color={Colors.white} />
            <Text style={styles.authButtonText}>
              {isAuthenticating ? 'Authenticating...' : `Authenticate with ${biometricLabel}`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Shield size={16} color={Colors.textSecondary} />
          <Text style={styles.securityText}>
            Your data is protected with bank-level security
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  authCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${Colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  authDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  authButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
  },
  securityText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
