import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import * as Keychain from 'react-native-keychain';
import { Screen } from '@/ui/Screen';
import { Button } from '@/ui/Button';
import { PinCodeInput } from '@/ui/PinCodeInput';
import { useAuthStore } from '@/store/authStore';

const pinRegex = /^\d{6}$/;

export const PinSetupScreen = () => {
  const { setPin, enableBiometrics, setUnlocked } = useAuthStore();
  const [pin, setPinValue] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [biometryType, setBiometryType] =
    useState<Keychain.BIOMETRY_TYPE | null>(null);
  const [step, setStep] = useState<'pin' | 'biometry'>('pin');
  const [isSaving, setIsSaving] = useState(false);

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

  const onSavePin = async () => {
    setError(null);
    if (!pinRegex.test(pin)) {
      setError('Enter a 6-digit PIN.');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match.');
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
      <Screen className="bg-white">
        <View className="flex-1 justify-center gap-6">
          <View className="gap-2">
            <Text className="text-3xl font-black text-black text-left">
              Enable {biometryLabel}
            </Text>
            <Text className="text-base text-zinc-600 text-left">
              Use {biometryLabel} for quick access. If it fails, you can always
              enter your PIN.
            </Text>
          </View>
          {error ? (
            <Text className="text-sm text-red-600 text-left">{error}</Text>
          ) : null}
          <View className="gap-3">
            <Button
              label={`Enable ${biometryLabel}`}
              onPress={onEnableBiometrics}
              loading={isSaving}
              className="rounded-2xl bg-black"
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
      </Screen>
    );
  }

  return (
    <Screen className="bg-white">
      <View className="flex-1 justify-center gap-8">
        <View className="gap-2">
          <Text className="text-3xl font-black text-black text-left">
            Create your PIN
          </Text>
          <Text className="text-base text-zinc-600 text-left">
            Set a 6-digit PIN for quick sign-in. You can use biometrics later.
          </Text>
        </View>
        <View className="gap-4">
          <PinCodeInput
            label="New PIN"
            value={pin}
            onChangeText={(value) => {
              setPinValue(value);
              setError(null);
            }}
            autoFocus
          />
          <PinCodeInput
            label="Confirm PIN"
            value={confirmPin}
            onChangeText={(value) => {
              setConfirmPin(value);
              setError(null);
            }}
          />
          {error ? (
            <Text className="text-sm text-red-600 text-left">{error}</Text>
          ) : null}
          <Button
            label={isSaving ? 'Saving...' : 'Save PIN'}
            onPress={onSavePin}
            loading={isSaving}
            className="rounded-2xl bg-black"
            labelClassName="text-white"
          />
        </View>
      </View>
    </Screen>
  );
};
