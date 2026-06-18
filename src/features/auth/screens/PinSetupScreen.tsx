import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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

type PinEntryStepProps = {
  title: string;
  description: string;
  value: string;
  inputRef: React.RefObject<TextInput | null>;
  onChangeText: (text: string) => void;
  autoFocus?: boolean;
  error?: string | null;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  theme: 'light' | 'maroon';
  onBack?: () => void;
};

const sanitizePin = (text: string) => text.replace(/\D/g, '').slice(0, PIN_LENGTH);

const PinEntryStep = ({
  title,
  description,
  value,
  inputRef,
  onChangeText,
  autoFocus,
  error,
  icon,
  theme,
  onBack,
}: PinEntryStepProps) => {
  const isMaroon = theme === 'maroon';

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle={isMaroon ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingVertical: 28,
            }}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View
              style={{
                gap: 24,
                paddingTop: isMaroon ? 4 : 32,
              }}
            >
              {onBack ? (
                <Pressable
                  onPress={onBack}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-start',
                    gap: 6,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 20,
                    backgroundColor: 'rgba(107,26,43,0.08)',
                  }}
                >
                  <Ionicons name="arrow-back" size={20} color={MAROON} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: MAROON }}>
                    Ubah PIN
                  </Text>
                </Pressable>
              ) : null}

              <View
                style={{
                  gap: 20,
                  alignItems: 'center',
                  backgroundColor: isMaroon ? MAROON : '#fff',
                  borderRadius: 32,
                  paddingHorizontal: 24,
                  paddingVertical: isMaroon ? 28 : 0,
                }}
              >
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: isMaroon ? 'rgba(255,255,255,0.15)' : '#F0E8EA',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name={icon}
                    size={30}
                    color={isMaroon ? '#fff' : MAROON}
                  />
                </View>

                <View style={{ gap: 8, alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: '700',
                      color: isMaroon ? '#fff' : '#111',
                      textAlign: 'center',
                    }}
                  >
                    {title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: isMaroon ? 'rgba(255,255,255,0.72)' : '#71717a',
                      textAlign: 'center',
                      lineHeight: 20,
                    }}
                  >
                    {description}
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={() => inputRef.current?.focus()}
              style={{
                marginTop: 40,
                gap: 18,
                alignItems: 'center',
                borderRadius: 28,
                backgroundColor: '#FAFAFA',
                paddingHorizontal: 24,
                paddingVertical: 32,
              }}
            >
              <PinDots filledCount={value.length} />
              {error ? (
                <Text
                  style={{
                    fontSize: 14,
                    color: '#dc2626',
                    textAlign: 'center',
                    minHeight: 20,
                  }}
                >
                  {error}
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: 14,
                    color: '#71717a',
                    textAlign: 'center',
                    minHeight: 20,
                  }}
                >
                  PIN will continue automatically after the sixth digit.
                </Text>
              )}

              <TextInput
                ref={inputRef}
                value={value}
                onChangeText={onChangeText}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                maxLength={PIN_LENGTH}
                secureTextEntry
                autoFocus={autoFocus}
                caretHidden
                contextMenuHidden
                style={{ position: 'absolute', opacity: 0 }}
              />
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};

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

  const clearAdvanceTimer = () => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  };

  useEffect(() => clearAdvanceTimer, []);

  useEffect(() => {
    const nextInput = step === 'confirm' ? confirmInputRef : createInputRef;
    const timer = setTimeout(() => nextInput.current?.focus(), 100);

    return () => clearTimeout(timer);
  }, [step]);

  const biometryLabel = useMemo(() => {
    if (biometryType === Keychain.BIOMETRY_TYPE.FACE_ID) return 'Face ID';
    if (biometryType) return 'Fingerprint';
    return '';
  }, [biometryType]);

  const scheduleAdvance = (callback: () => void) => {
    clearAdvanceTimer();
    advanceTimer.current = setTimeout(() => {
      advanceTimer.current = null;
      callback();
    }, 250);
  };

  const handleCreateChange = (text: string) => {
    const clean = sanitizePin(text);
    clearAdvanceTimer();
    setError(null);
    setPinValue(clean);

    if (clean.length === PIN_LENGTH) {
      scheduleAdvance(() => {
        setConfirmPin('');
        setStep('confirm');
      });
    }
  };

  const verifyPin = async (confirm: string) => {
    if (confirm !== pin) {
      setError('PIN tidak cocok. Coba lagi atau ketuk "Ubah PIN" untuk membuat PIN baru.');
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

  const handleConfirmChange = (text: string) => {
    const clean = sanitizePin(text);
    clearAdvanceTimer();
    setError(null);
    setConfirmPin(clean);

    if (clean.length === PIN_LENGTH) {
      scheduleAdvance(() => {
        void verifyPin(clean);
      });
    }
  };

  const handleBack = () => {
    clearAdvanceTimer();
    setConfirmPin('');
    setError(null);
    setStep('create');
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
                disabled={isSaving}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (step === 'confirm') {
    return (
      <PinEntryStep
        title="Konfirmasi PIN Anda"
        description="Silakan masukkan kembali 6 digit angka yang baru saja Anda buat."
        value={confirmPin}
        inputRef={confirmInputRef}
        onChangeText={handleConfirmChange}
        error={error}
        icon="lock-closed"
        theme="maroon"
        onBack={handleBack}
      />
    );
  }

  return (
    <PinEntryStep
      title="Buat PIN Keamanan"
      description="Gunakan 6 digit angka untuk mengamankan akun Anda."
      value={pin}
      inputRef={createInputRef}
      onChangeText={handleCreateChange}
      autoFocus
      error={error}
      icon="lock-closed-outline"
      theme="light"
    />
  );
};
