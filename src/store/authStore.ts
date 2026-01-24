import { create } from 'zustand';
import type { User } from '@/api/types';
import { refreshTokens } from '@/features/auth/api';
import * as Keychain from 'react-native-keychain';

const ACCESS_TOKEN_KEY = 'hrms.accessToken';
const REFRESH_TOKEN_KEY = 'hrms.refreshToken';
const USER_KEY = 'hrms.user';
const PIN_KEY = 'hrms.pin';
const BIOMETRY_ENABLED_KEY = 'hrms.biometry.enabled';
const BIOMETRY_SECRET_KEY = 'hrms.biometry.secret';

type SessionPayload = {
  accessToken: string;
  refreshToken: string;
  user: User | null;
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isHydrating: boolean;
  hasPin: boolean;
  biometryEnabled: boolean;
  isUnlocked: boolean;
  bootstrap: () => Promise<void>;
  setSession: (payload: SessionPayload) => Promise<void>;
  clearSession: () => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  setUnlocked: (value: boolean) => void;
  enableBiometrics: () => Promise<boolean>;
  disableBiometrics: () => Promise<void>;
  unlockWithBiometrics: () => Promise<boolean>;
};

const saveSecret = async (service: string, value: string) => {
  await Keychain.setGenericPassword('token', value, { service });
};

const loadSecret = async (service: string) => {
  const result = await Keychain.getGenericPassword({ service });
  if (result) {
    return result.password;
  }
  return null;
};

const clearSecret = async (service: string) => {
  await Keychain.resetGenericPassword({ service });
};

const saveSession = async ({ accessToken, refreshToken, user }: SessionPayload) => {
  await saveSecret(ACCESS_TOKEN_KEY, accessToken);
  await saveSecret(REFRESH_TOKEN_KEY, refreshToken);
  if (user) {
    await saveSecret(USER_KEY, JSON.stringify(user));
  } else {
    await clearSecret(USER_KEY);
  }
};

const clearStoredSession = async () => {
  await clearSecret(ACCESS_TOKEN_KEY);
  await clearSecret(REFRESH_TOKEN_KEY);
  await clearSecret(USER_KEY);
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isHydrating: true,
  hasPin: false,
  biometryEnabled: false,
  isUnlocked: false,
  bootstrap: async () => {
    try {
      let accessToken = await loadSecret(ACCESS_TOKEN_KEY);
      let refreshToken = await loadSecret(REFRESH_TOKEN_KEY);
      const userRaw = await loadSecret(USER_KEY);
      let user = userRaw ? (JSON.parse(userRaw) as User) : null;
      const storedPin = await loadSecret(PIN_KEY);
      let hasPin = Boolean(storedPin);
      let biometryEnabled = (await loadSecret(BIOMETRY_ENABLED_KEY)) === '1';

      if (refreshToken) {
        try {
          const tokens = await refreshTokens(refreshToken);
          await saveSession({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user,
          });
          set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user,
            hasPin,
            biometryEnabled,
            isUnlocked: !hasPin,
            isHydrating: false,
          });
          return;
        } catch {
          await clearStoredSession();
          await clearSecret(PIN_KEY);
          await clearSecret(BIOMETRY_ENABLED_KEY);
          await clearSecret(BIOMETRY_SECRET_KEY);
          accessToken = null;
          refreshToken = null;
          user = null;
          hasPin = false;
          biometryEnabled = false;
        }
      }

      set({
        accessToken: accessToken ?? null,
        refreshToken: refreshToken ?? null,
        user,
        hasPin,
        biometryEnabled,
        isUnlocked: !hasPin && Boolean(accessToken),
        isHydrating: false,
      });
    } catch {
      set({ isHydrating: false });
    }
  },
  setSession: async ({ accessToken, refreshToken, user }) => {
    await saveSession({ accessToken, refreshToken, user });
    set({ accessToken, refreshToken, user, isUnlocked: true });
  },
  clearSession: async () => {
    await clearStoredSession();
    await clearSecret(PIN_KEY);
    await clearSecret(BIOMETRY_ENABLED_KEY);
    await clearSecret(BIOMETRY_SECRET_KEY);
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      hasPin: false,
      biometryEnabled: false,
      isUnlocked: false,
    });
  },
  setPin: async (pin) => {
    await saveSecret(PIN_KEY, pin);
    set({ hasPin: true });
  },
  verifyPin: async (pin) => {
    const storedPin = await loadSecret(PIN_KEY);
    if (storedPin && storedPin === pin) {
      set({ isUnlocked: true });
      return true;
    }
    return false;
  },
  setUnlocked: (value) => {
    set({ isUnlocked: value });
  },
  enableBiometrics: async () => {
    try {
      await Keychain.setGenericPassword('biometry', 'enabled', {
        service: BIOMETRY_SECRET_KEY,
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      await saveSecret(BIOMETRY_ENABLED_KEY, '1');
      set({ biometryEnabled: true });
      return true;
    } catch {
      return false;
    }
  },
  disableBiometrics: async () => {
    await clearSecret(BIOMETRY_ENABLED_KEY);
    await clearSecret(BIOMETRY_SECRET_KEY);
    set({ biometryEnabled: false });
  },
  unlockWithBiometrics: async () => {
    try {
      const result = await Keychain.getGenericPassword({
        service: BIOMETRY_SECRET_KEY,
        authenticationPrompt: {
          title: 'Unlock Acneno Life',
          subtitle: 'Use biometric authentication',
        },
      });
      if (result) {
        set({ isUnlocked: true });
        return true;
      }
    } catch {
      return false;
    }
    return false;
  },
}));
