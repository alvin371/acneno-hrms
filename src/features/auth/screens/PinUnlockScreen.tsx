import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import * as Keychain from 'react-native-keychain';
import { Screen } from '@/ui/Screen';
import { Button } from '@/ui/Button';
import { PinCodeInput } from '@/ui/PinCodeInput';
import { useAuthStore } from '@/store/authStore';

const pinRegex = /^\d{6}$/;

export const PinUnlockScreen = () => {
  const { verifyPin, unlockWithBiometrics, biometryEnabled } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [biometryType, setBiometryType] =
    useState<Keychain.BIOMETRY_TYPE | null>(null);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [hasTriedBiometric, setHasTriedBiometric] = useState(false);

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
    setError(null);
    setIsBiometricLoading(true);
    const success = await unlockWithBiometrics();
    setIsBiometricLoading(false);
    if (!success) {
      setError('Biometric authentication failed. Enter your PIN.');
    }
  }, [unlockWithBiometrics]);

  useEffect(() => {
    if (!canUseBiometry || hasTriedBiometric) {
      return;
    }
    setHasTriedBiometric(true);
    handleBiometric();
  }, [canUseBiometry, hasTriedBiometric, handleBiometric]);

  const onUnlock = async () => {
    setError(null);
    if (!pinRegex.test(pin)) {
      setError('Enter a 6-digit PIN.');
      return;
    }
    const success = await verifyPin(pin);
    if (!success) {
      setError('Incorrect PIN.');
      setPin('');
    }
  };

  return (
    <Screen className="bg-white">
      <View className="flex-1 justify-center gap-8">
        <View className="gap-2">
          <Text className="text-3xl font-black text-black text-left">
            Unlock Acme HR
          </Text>
          <Text className="text-base text-zinc-600 text-left">
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
              setError(null);
            }}
            autoFocus
          />
          {error ? (
            <Text className="text-sm text-red-600 text-left">{error}</Text>
          ) : null}
          <Button
            label="Unlock"
            onPress={onUnlock}
            className="rounded-2xl bg-black"
            labelClassName="text-white"
          />
          {canUseBiometry ? (
            <Button
              label={`Use ${biometryLabel}`}
              variant="secondary"
              onPress={handleBiometric}
              loading={isBiometricLoading}
            />
          ) : null}
        </View>
      </View>
    </Screen>
  );
};
