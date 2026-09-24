import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { dataService } from '../services/dataService';
import { api, getApiUrl } from '../services/api';
import { promptRealGoogleSignIn } from '../services/googleAuth';
import GoogleLogo from '../components/GoogleLogo';

export default function SettingsScreen() {
  const { storageMode, switchStorageMode, user, settings, setSettings, triggerRefresh } = useApp();

  const [elecRate, setElecRate] = useState(String(settings.defaultElectricityRate || 11));
  const [roomRent, setRoomRent] = useState(String(settings.defaultRoomRent || 6000));

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState('input'); // 'input' | 'otp'
  const [isRegister, setIsRegister] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const handleSaveDefaults = async () => {
    try {
      const updated = await dataService.updateSettings({
        defaultElectricityRate: Number(elecRate) || 11,
        defaultRoomRent: Number(roomRent) || 6000,
      });
      setSettings(updated);
      Alert.alert('Saved', 'Default rates and settings saved successfully.');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleSyncToCloud = async () => {
    try {
      setSyncing(true);
      const res = await dataService.syncToCloud();
      Alert.alert('Backup Complete! ✅', 'All your local rooms, tenants, and bills are now safely synced to MongoDB Atlas.');
      triggerRefresh();
    } catch (err) {
      Alert.alert('Sync Error', 'Could not sync to cloud: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleSendOtp = async () => {
    if (!authEmail.trim()) {
      setAuthError('Please enter your email address.');
      return;
    }
    if (isRegister && !authName.trim()) {
      setAuthError('Please enter your full name.');
      return;
    }
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);
    try {
      const res = await api.sendOtp(authEmail.trim());
      setAuthStep('otp');
      if (res.emailSent) {
        setAuthSuccess(`Verification code sent to ${authEmail.trim()}! Please check your inbox and spam folder.`);
      } else if (res.devOtp) {
        // Auto-fill dev code so user isn't stuck while configuring SMTP
        setOtpCode(res.devOtp);
        setAuthSuccess(res.message || `Dev Mode: OTP is ${res.devOtp}. (Provide Gmail credentials to receive real emails)`);
      } else {
        setAuthSuccess(`A 6-digit code has been dispatched.`);
      }
      setAuthLoading(false);
    } catch (err) {
      setAuthError(err.message || 'Failed to send verification code');
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setAuthError('Please enter the 6-digit verification code.');
      return;
    }
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);
    try {
      const result = await api.verifyOtp({
        email: authEmail.trim(),
        otp: otpCode.trim(),
        name: authName.trim(),
      });

      await switchStorageMode('cloud', { token: result.token, user: result });
      setAuthSuccess(`Verified! Welcome ${result.name}. Switched to Cloud Mode.`);
      setTimeout(() => {
        setShowAuthModal(false);
        setAuthLoading(false);
        setAuthStep('input');
        setOtpCode('');
        setAuthSuccess('');
      }, 1200);
    } catch (err) {
      setAuthError(err.message || 'Invalid or expired verification code');
      setAuthLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);
    try {
      // 1. Opens the official Google Account Chooser popup!
      const googleUser = await promptRealGoogleSignIn();

      // 2. Registers or logs in the Google user on MongoDB Atlas
      const result = await api.googleAuth(googleUser);

      // 3. Switches mode to Cloud & automatically syncs all local rooms to MongoDB
      await switchStorageMode('cloud', { token: result.token, user: result });

      setAuthSuccess(`Welcome, ${result.name}! Switched to Cloud Mode.`);
      setTimeout(() => {
        setShowAuthModal(false);
        setAuthLoading(false);
        setAuthSuccess('');
      }, 1200);
    } catch (err) {
      console.warn('Google Sign-In failed or canceled:', err);
      setAuthError(err.message || 'Google Sign-In failed or was canceled');
      setAuthLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <Text style={styles.heading}>Settings & Preferences</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Storage Mode Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>STORAGE & SYNC MODE</Text>

          {/* Mode Selector */}
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[styles.modeOption, storageMode === 'offline' && styles.modeOptionActiveOffline]}
              onPress={() => switchStorageMode('offline')}
            >
              <Feather name="smartphone" size={18} color={storageMode === 'offline' ? '#059669' : '#64748b'} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.modeTitle, storageMode === 'offline' && styles.modeTitleActiveOffline]}>
                  Offline Mode (Device)
                </Text>
                <Text style={styles.modeDesc}>No login needed. 100% saved locally on this phone.</Text>
              </View>
              {storageMode === 'offline' && <Feather name="check-circle" size={18} color="#059669" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeOption, storageMode === 'cloud' && styles.modeOptionActiveCloud]}
              onPress={() => {
                if (!user) {
                  setShowAuthModal(true);
                } else {
                  switchStorageMode('cloud');
                }
              }}
            >
              <Feather name="cloud" size={18} color={storageMode === 'cloud' ? '#0284c7' : '#64748b'} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.modeTitle, storageMode === 'cloud' && styles.modeTitleActiveCloud]}>
                  Cloud Mode (MongoDB)
                </Text>
                <Text style={styles.modeDesc}>
                  {user ? `Connected as ${user.name}` : 'Login with Google or Email to enable cloud backup.'}
                </Text>
              </View>
              {storageMode === 'cloud' && <Feather name="check-circle" size={18} color="#0284c7" />}
            </TouchableOpacity>
          </View>

          {/* One-Tap Backup/Sync Button */}
          <TouchableOpacity
            style={styles.syncBtn}
            activeOpacity={0.8}
            onPress={handleSyncToCloud}
            disabled={syncing}
          >
            <Feather name="upload-cloud" size={18} color="#ffffff" />
            <Text style={styles.syncBtnText}>
              {syncing ? 'Syncing to MongoDB...' : 'Backup / Sync Local Data to Cloud'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pricing Defaults Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>GLOBAL PRICING DEFAULTS</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Default Electricity Rate (₹ / unit)</Text>
            <View style={styles.currencyRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={[styles.input, styles.currencyInput]}
                keyboardType="numeric"
                value={elecRate}
                onChangeText={setElecRate}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Default Room Rent (₹ / month)</Text>
            <View style={styles.currencyRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={[styles.input, styles.currencyInput]}
                keyboardType="numeric"
                value={roomRent}
                onChangeText={setRoomRent}
              />
            </View>
          </View>
        </View>

        {/* Save Settings Button */}
        <TouchableOpacity style={styles.saveSettingsBtn} onPress={handleSaveDefaults}>
          <Feather name="save" size={16} color="#ffffff" />
          <Text style={styles.saveSettingsBtnText}>Save Preferences</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Cloud Auth Modal */}
      <Modal visible={showAuthModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>{isRegister ? 'Create Cloud Account' : 'Cloud Login'}</Text>
              <TouchableOpacity onPress={() => setShowAuthModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Log in to sync your rooms, tenants, rent, and photos with MongoDB Atlas.
            </Text>

            {authError ? (
              <View style={styles.authErrorBox}>
                <Feather name="alert-circle" size={14} color="#b91c1c" />
                <Text style={styles.authErrorText}>{authError}</Text>
              </View>
            ) : null}

            {authSuccess ? (
              <View style={styles.authSuccessBox}>
                <Feather name="check-circle" size={14} color="#047857" />
                <Text style={styles.authSuccessText}>{authSuccess}</Text>
              </View>
            ) : null}

            {/* Google One-Tap Login with Rainbow 4-color Logo */}
            <TouchableOpacity
              style={[styles.googleBtn, authLoading && { opacity: 0.6 }]}
              onPress={handleGoogleAuth}
              disabled={authLoading}
            >
              <GoogleLogo size={20} />
              <Text style={styles.googleBtnText}>
                {authLoading ? 'Connecting...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>

            <View style={styles.orDividerRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR EMAIL OTP</Text>
              <View style={styles.orLine} />
            </View>

            {authStep === 'input' ? (
              <>
                {isRegister && (
                  <TextInput
                    style={styles.authInput}
                    placeholder="Full Name"
                    placeholderTextColor="#94a3b8"
                    value={authName}
                    onChangeText={setAuthName}
                    editable={!authLoading}
                  />
                )}
                <TextInput
                  style={styles.authInput}
                  placeholder="Enter email for OTP verification"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={authEmail}
                  onChangeText={setAuthEmail}
                  editable={!authLoading}
                />

                <TouchableOpacity
                  style={[styles.authSubmitBtn, authLoading && { opacity: 0.6 }]}
                  onPress={handleSendOtp}
                  disabled={authLoading}
                >
                  <Text style={styles.authSubmitText}>
                    {authLoading ? 'Sending code...' : 'Send Verification Code (OTP)'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.toggleAuthModeBtn}
                  onPress={() => {
                    setIsRegister(!isRegister);
                    setAuthError('');
                  }}
                >
                  <Text style={styles.toggleAuthModeText}>
                    {isRegister ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              /* Step 2: OTP Verification */
              <View style={{ gap: 12 }}>
                <View style={styles.otpHeaderBox}>
                  <Text style={styles.otpHeading}>Enter 6-Digit Code</Text>
                  <Text style={styles.otpSubText}>
                    Sent to <Text style={{ fontWeight: '700', color: '#0f172a' }}>{authEmail}</Text>
                  </Text>
                </View>

                <TextInput
                  style={styles.otpInput}
                  placeholder="• • • • • •"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  autoFocus
                  editable={!authLoading}
                />

                <TouchableOpacity
                  style={[styles.authSubmitBtn, authLoading && { opacity: 0.6 }]}
                  onPress={handleVerifyOtp}
                  disabled={authLoading}
                >
                  <Text style={styles.authSubmitText}>
                    {authLoading ? 'Verifying...' : 'Verify & Connect to Cloud'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.otpActionRow}>
                  <TouchableOpacity onPress={() => handleSendOtp()} disabled={authLoading}>
                    <Text style={styles.resendText}>Resend Code</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setAuthStep('input');
                      setAuthError('');
                    }}
                  >
                    <Text style={styles.changeEmailText}>Change Email</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  modeSelector: {
    gap: 10,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  modeOptionActiveOffline: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  modeOptionActiveCloud: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
  },
  modeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  modeTitleActiveOffline: {
    color: '#047857',
  },
  modeTitleActiveCloud: {
    color: '#0369a1',
  },
  modeDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  syncBtn: {
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  syncBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#475569',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  currencyInput: {
    flex: 1,
    paddingLeft: 28,
  },
  hint: {
    fontSize: 11,
    color: '#64748b',
  },
  saveSettingsBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveSettingsBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  googleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  orText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  authInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  authSubmitBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  authSubmitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  toggleAuthModeBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  toggleAuthModeText: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '600',
  },
  authErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  authErrorText: {
    fontSize: 12,
    color: '#b91c1c',
    fontWeight: '600',
    flex: 1,
  },
  authSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  authSuccessText: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '700',
    flex: 1,
  },
  otpHeaderBox: {
    alignItems: 'center',
    marginBottom: 6,
  },
  otpHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  otpSubText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  otpInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#f59e0b',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 10,
    textAlign: 'center',
    color: '#0f172a',
    fontFamily: 'monospace',
  },
  otpActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  resendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  changeEmailText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
});

