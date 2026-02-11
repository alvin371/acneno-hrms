import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Keychain from 'react-native-keychain';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/ui/Button';
import { PinDots } from '@/ui/PinDots';

const MAROON = '#6B1A2B';
const PIN_LENGTH = 6;

type Step = 'create' | 'confirm' | 'biometry';

export const PinSetupScreen = () => {
  const { setPin, enableBiometrics, setUnlocked } = useAuthStore();
  const [step, setStep] = useState<Step>('create');
  const [pin, setPinValue] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [biometryType, setBiometryType] =
    useState<Keychain.BIOMETRY_TYPE | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const createInputRef = useRef<TextInput>(null);
  const confirmInputRef = useRef<TextInput>(null);

  useEffect(() => {
    Keychain.getSupportedBiometryType()
      .then((type) => setBiometryType(type ?? null))
      .catch(() => setBiometryType(null));
  }, []);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) {
        clearTimeout(advanceTimer.current);
      }
    };
  }, []);

  // Focus the confirm input when entering confirm step
  useEffect(() => {
    if (step === 'confirm') {
      setTimeout(() => confirmInputRef.current?.focus(), 100);
    }
  }, [step]);

  const biometryLabel = useMemo(() => {
    if (biometryType === Keychain.BIOMETRY_TYPE.FACE_ID) return 'Face ID';
    if (biometryType) return 'Fingerprint';
    return '';
  }, [biometryType]);

  const handleCreateChange = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setError(null);
    setPinValue(clean);
    if (clean.length === PIN_LENGTH) {
      advanceTimer.current = setTimeout(() => {
        setStep('confirm');
      }, 300);
    }
  };

  const handleConfirmChange = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setError(null);
    setConfirmPin(clean);
    if (clean.length === PIN_LENGTH) {
      advanceTimer.current = setTimeout(() => {
        verifyPin(clean);
      }, 300);
    }
  };

  const verifyPin = async (confirm: string) => {
    if (confirm !== pin) {
      setError('PIN tidak cocok. Silakan coba lagi.');
      setConfirmPin('');
      return;
    }
    if (biometryType) {
      setStep('biometry');
      return;
    }
    setIsSaving(true);
    await setPin(pin);
    setIsSaving(false);
    setUnlocked(true);
  };

  const handleBack = () => {
    setConfirmPin('');
    setError(null);
    setStep('create');
    setTimeout(() => createInputRef.current?.focus(), 100);
  };

  const onEnableBiometrics = async () => {
    setError(null);
    setIsSaving(true);
    const enabled = await enableBiometrics();
    await setPin(pin);
    setIsSaving(false);
    if (!enabled) {
      setError('Unable to enable biometrics. You can still use your PIN.');
    }
    setUnlocked(true);
  };

  // ── Biometry step ──
  if (step === 'biometry') {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={{ flex: 1 }}>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              paddingHorizontal: 24,
              gap: 24,
            }}
          >
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: '900',
                  color: '#000',
                  textAlign: 'left',
                }}
              >
                Enable {biometryLabel}
              </Text>
              <Text style={{ fontSize: 16, color: '#71717a', textAlign: 'left' }}>
                Use {biometryLabel} for quick access. If it fails, you can always
                enter your PIN.
              </Text>
            </View>
            {error ? (
              <Text style={{ fontSize: 14, color: '#dc2626', textAlign: 'left' }}>
                {error}
              </Text>
            ) : null}
            <View style={{ gap: 12 }}>
              <Button
                label={`Enable ${biometryLabel}`}
                onPress={onEnableBiometrics}
                loading={isSaving}
                className="rounded-2xl"
                style={{ backgroundColor: MAROON }}
                labelClassName="text-white"
              />
              <Button
                label="Skip for now"
                variant="secondary"
                onPress={async () => {
                  setIsSaving(true);
                  await setPin(pin);
                  setIsSaving(false);
                  setUnlocked(true);
                }}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Confirm step ──
  if (step === 'confirm') {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Maroon header */}
          <View
            style={{
              backgroundColor: MAROON,
              borderBottomLeftRadius: 32,
              borderBottomRightRadius: 32,
              paddingBottom: 40,
            }}
          >
            <SafeAreaView edges={['top']}>
              <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
                <Pressable
                  onPress={handleBack}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="arrow-back" size={22} color="#fff" />
                </Pressable>
              </View>
              <View style={{ alignItems: 'center', paddingTop: 20, gap: 16 }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="lock-closed" size={28} color="#fff" />
                </View>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: '700',
                    color: '#fff',
                    textAlign: 'center',
                  }}
                >
                  Konfirmasi PIN Anda
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.7)',
                    textAlign: 'center',
                    paddingHorizontal: 32,
                  }}
                >
                  Silakan masukkan kembali 6 digit angka yang baru saja Anda buat
                </Text>
              </View>
            </SafeAreaView>
          </View>

          {/* White body */}
          <Pressable
            onPress={() => confirmInputRef.current?.focus()}
            style={{ flex: 1, paddingTop: 32 }}
          >
            <View style={{ alignItems: 'center', gap: 16 }}>
              <PinDots filledCount={confirmPin.length} />
              {error ? (
                <Text
                  style={{
                    fontSize: 14,
                    color: '#dc2626',
                    textAlign: 'center',
                    paddingHorizontal: 24,
                  }}
                >
                  {error}
                </Text>
              ) : null}
            </View>
            {/* Hidden input for device keyboard */}
            <TextInput
              ref={confirmInputRef}
              value={confirmPin}
              onChangeText={handleConfirmChange}
              keyboardType="number-pad"
              maxLength={PIN_LENGTH}
              secureTextEntry
              caretHidden
              contextMenuHidden
              style={{ position: 'absolute', opacity: 0 }}
            />
          </Pressable>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ── Create step ──
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <Pressable
            onPress={() => createInputRef.current?.focus()}
            style={{
              flex: 1,
              justifyContent: 'center',
              paddingBottom: 48,
            }}
          >
            {/* Top content */}
            <View style={{ alignItems: 'center', gap: 20 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: '#F0E8EA',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="lock-closed-outline" size={28} color={MAROON} />
              </View>
              <View style={{ gap: 8, alignItems: 'center', paddingHorizontal: 32 }}>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: '700',
                    color: '#111',
                    textAlign: 'center',
                  }}
                >
                  Buat PIN Keamanan
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: '#71717a',
                    textAlign: 'center',
                  }}
                >
                  Gunakan 6 digit angka untuk mengamankan akun Anda
                </Text>
              </View>
              <View style={{ marginTop: 12 }}>
                <PinDots filledCount={pin.length} />
              </View>
            </View>

            {/* Hidden input for device keyboard */}
            <TextInput
              ref={createInputRef}
              value={pin}
              onChangeText={handleCreateChange}
              keyboardType="number-pad"
              maxLength={PIN_LENGTH}
              secureTextEntry
              autoFocus
              caretHidden
              contextMenuHidden
              style={{ position: 'absolute', opacity: 0 }}
            />
          </Pressable>

          <Pressable
            style={{ alignSelf: 'center', paddingVertical: 8, marginBottom: 16 }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: MAROON }}>
              Lupa PIN?
            </Text>
          </Pressable>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};
