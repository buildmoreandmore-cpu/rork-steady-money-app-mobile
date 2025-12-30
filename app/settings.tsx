import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Shield,
  Fingerprint,
  Scan,
  ChevronRight,
  Lock,
  FileText,
  HelpCircle,
  Mail,
  ExternalLink,
} from 'lucide-react-native';

import Colors from '@/constants/colors';

export default function SettingsScreen() {
  const router = useRouter();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<'face' | 'fingerprint' | 'none'>('none');

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    // Check if device supports biometrics
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);

    if (compatible && enrolled) {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('face');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('fingerprint');
      }
    }

    // Check if user has enabled biometrics
    const enabled = await AsyncStorage.getItem('biometric_enabled');
    setBiometricEnabled(enabled === 'true');
  };

  const toggleBiometric = async (value: boolean) => {
    if (value) {
      // Verify biometric before enabling
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify to enable biometric lock',
        fallbackLabel: 'Use passcode',
      });

      if (result.success) {
        await AsyncStorage.setItem('biometric_enabled', 'true');
        setBiometricEnabled(true);
        Alert.alert('Enabled', 'Biometric lock has been enabled. You\'ll need to authenticate when opening the app.');
      }
    } else {
      await AsyncStorage.setItem('biometric_enabled', 'false');
      setBiometricEnabled(false);
    }
  };

  const biometricLabel = biometricType === 'face'
    ? (Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition')
    : 'Touch ID';

  const BiometricIcon = biometricType === 'face' ? Scan : Fingerprint;

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const resetOnboarding = async () => {
    Alert.alert(
      'Reset App',
      'This will reset all app data and show the onboarding again. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/onboarding' as any);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Security Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${Colors.primary}15` }]}>
                <BiometricIcon size={20} color={Colors.primary} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{biometricLabel} Lock</Text>
                <Text style={styles.settingDescription}>
                  {biometricAvailable
                    ? 'Require authentication to open app'
                    : 'Not available on this device'}
                </Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={toggleBiometric}
              disabled={!biometricAvailable}
              trackColor={{ false: Colors.borderLight, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>
      </View>

      {/* Legal Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => openLink('https://steadymoney.app/privacy')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${Colors.textSecondary}15` }]}>
                <FileText size={20} color={Colors.textSecondary} />
              </View>
              <Text style={styles.settingTitle}>Privacy Policy</Text>
            </View>
            <ExternalLink size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => openLink('https://steadymoney.app/terms')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${Colors.textSecondary}15` }]}>
                <FileText size={20} color={Colors.textSecondary} />
              </View>
              <Text style={styles.settingTitle}>Terms of Service</Text>
            </View>
            <ExternalLink size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => openLink('https://steadymoney.app/security')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${Colors.textSecondary}15` }]}>
                <Shield size={20} color={Colors.textSecondary} />
              </View>
              <Text style={styles.settingTitle}>Security</Text>
            </View>
            <ExternalLink size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => openLink('mailto:buildmoreandmore@gmail.com')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${Colors.primary}15` }]}>
                <Mail size={20} color={Colors.primary} />
              </View>
              <Text style={styles.settingTitle}>Contact Support</Text>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => openLink('https://steadymoney.app')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${Colors.textSecondary}15` }]}>
                <HelpCircle size={20} color={Colors.textSecondary} />
              </View>
              <Text style={styles.settingTitle}>Help Center</Text>
            </View>
            <ExternalLink size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={resetOnboarding}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                <Lock size={20} color="#DC2626" />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: '#DC2626' }]}>Reset App Data</Text>
                <Text style={styles.settingDescription}>Clear all data and start fresh</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>Steady v1.0.0</Text>
        <Text style={styles.copyright}>© 2024 Steady Money Inc.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 64,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 24,
  },
  appVersion: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  copyright: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
