import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import * as Keychain from 'react-native-keychain';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/ui/Button';
import { PinCodeInput } from '@/ui/PinCodeInput';
import { useAuthStore } from '@/store/authStore';
import { logos } from '@/assets/image';

const pinRegex = /^\d{6}$/;

export const PinUnlockScreen = () => {
  const { verifyPin, unlockWithBiometrics, biometryEnabled } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [biometryType, setBiometryType] =
    useState<Keychain.BIOMETRY_TYPE | null>(null);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [hasTriedBiometric, setHasTriedBiometric] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    Keychain.getSupportedBiometryType()
      .then((type) => setBiometryType(type ?? null))
      .catch(() => setBiometryType(null));
  }, []);

  const biometryLabel = useMemo(() => {
    if (biometryType === Keychain.BIOMETRY_TYPE.FACE_ID) {
      return 'Face ID';
    }
    if (biometryType) {
      return 'Fingerprint';
    }
    return '';
  }, [biometryType]);

  const canUseBiometry = biometryEnabled && Boolean(biometryType);

  const handleBiometric = useCallback(async () => {
    if (isBiometricLoading || isUnlocking) {
      return;
    }
    setError(null);
    setIsBiometricLoading(true);
    const success = await unlockWithBiometrics();
    setIsBiometricLoading(false);
    if (!success) {
      setError('Biometric authentication failed. Enter your PIN.');
    }
  }, [isBiometricLoading, isUnlocking, unlockWithBiometrics]);

  useEffect(() => {
    if (!canUseBiometry || hasTriedBiometric) {
      return;
    }
    setHasTriedBiometric(true);
    handleBiometric();
  }, [canUseBiometry, hasTriedBiometric, handleBiometric]);

  const onUnlock = useCallback(
    async (value: string) => {
      if (isUnlocking) {
        return;
      }
      setError(null);
      if (!pinRegex.test(value)) {
        setError('Enter a 6-digit PIN.');
        return;
      }
      setIsUnlocking(true);
      const success = await verifyPin(value);
      setIsUnlocking(false);
      if (!success) {
        setError('Incorrect PIN.');
        setPin('');
      }
    },
    [isUnlocking, verifyPin]
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <SafeAreaView className="flex-1">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingVertical: 32,
            }}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View className="items-center pt-8">
              <View className="h-24 w-24 items-center justify-center rounded-3xl bg-zinc-100">
                <Image
                  source={logos.forbes}
                  className="h-16 w-16"
                  resizeMode="contain"
                />
              </View>
            </View>

            <View className="pt-10">
              <View className="gap-6 rounded-[28px] bg-zinc-50 p-6">
                <View className="gap-2">
                  <Text className="text-3xl font-black text-black">
                    Unlock Acneno Life
                  </Text>
                  <Text className="text-base text-zinc-600">
                    {canUseBiometry
                      ? `Use ${biometryLabel} or enter your 6-digit PIN.`
                      : 'Enter your 6-digit PIN to continue.'}
                  </Text>
                </View>

                <View className="gap-4">
                  <PinCodeInput
                    label="PIN"
                    value={pin}
                    onChangeText={(value) => {
                      setPin(value);
                      if (error) {
                        setError(null);
                      }
                    }}
                    onComplete={onUnlock}
                    autoFocus
                  />
                  {error ? (
                    <Text className="text-sm text-red-600">{error}</Text>
                  ) : (
                    <Text className="text-sm text-zinc-500">
                      Your PIN will verify automatically after the sixth digit.
                    </Text>
                  )}

                  {canUseBiometry ? (
                    <Button
                      label={`Use ${biometryLabel}`}
                      variant="secondary"
                      onPress={handleBiometric}
                      loading={isBiometricLoading}
                      disabled={isUnlocking}
                    />
                  ) : null}
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};
