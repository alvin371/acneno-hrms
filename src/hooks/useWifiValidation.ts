import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import {
  check,
  checkMultiple,
  PERMISSIONS,
  request,
  requestMultiple,
  RESULTS,
} from 'react-native-permissions';
import { useQuery } from '@tanstack/react-query';
import { getConfig } from '@/features/config/api';
import { requestOfficeProof } from '@/features/attendance/api';
import { getErrorMessage } from '@/api/error';
import { env } from '@/config/env';

const requestLocationPermission = async () => {
  const permission = Platform.select({
    ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  });

  if (!permission) {
    return RESULTS.UNAVAILABLE;
  }

  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const permissions = [
      PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      PERMISSIONS.ANDROID.NEARBY_WIFI_DEVICES,
    ];
    let statuses = await checkMultiple(permissions);
    if (
      statuses[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] === RESULTS.DENIED ||
      statuses[PERMISSIONS.ANDROID.NEARBY_WIFI_DEVICES] === RESULTS.DENIED
    ) {
      statuses = await requestMultiple(permissions);
    }
    return statuses[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION];
  }

  let status = await check(permission);
  if (status === RESULTS.DENIED) {
    status = await request(permission);
  }
  return status;
};

const requestWifiPermission = async () => {
  if (Platform.OS !== 'android' || Platform.Version < 33) {
    return RESULTS.GRANTED;
  }
  const permission = PERMISSIONS.ANDROID.NEARBY_WIFI_DEVICES;
  let status = await check(permission);
  if (status === RESULTS.DENIED) {
    status = await request(permission);
  }
  return status;
};

const normalizeBssid = (value?: string | null) =>
  value?.trim().toLowerCase() ?? '';

const normalizeSsid = (value?: string | null) => value?.trim() ?? '';

const coerceStringList = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string') as string[];
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const isUnknownSsid = (value?: string | null) => {
  if (!value) {
    return true;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === '<unknown ssid>' || normalized === 'unknown ssid';
};

const isPlaceholderBssid = (value?: string | null) =>
  normalizeBssid(value) === '02:00:00:00:00';

export type WifiValidationState = {
  isValidating: boolean;
  wifiProofOk: boolean | null;
  wifiProofError: string | null;
  wifiSsid: string | null;
  refreshValidation: () => Promise<void>;
};

export const useWifiValidation = (): WifiValidationState => {
  const [isValidating, setIsValidating] = useState(false);
  const [wifiProofOk, setWifiProofOk] = useState<boolean | null>(null);
  const [wifiProofError, setWifiProofError] = useState<string | null>(null);

  const configQuery = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
  });

  const netInfo = useNetInfo();
  const wifiDetails =
    netInfo.type === 'wifi'
      ? (netInfo.details as { ssid?: string; bssid?: string })
      : null;
  const rawWifiSsid = wifiDetails?.ssid ?? null;
  const rawWifiBssid = wifiDetails?.bssid ?? null;
  const wifiSsid = isUnknownSsid(rawWifiSsid) ? null : rawWifiSsid;
  const wifiBssid = isPlaceholderBssid(rawWifiBssid) ? null : rawWifiBssid;

  const refreshValidation = useCallback(async () => {
    setIsValidating(true);
    setWifiProofError(null);

    try {
      const validationTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Validation timeout')), 10000);
      });

      await Promise.race([
        (async () => {
          // Step 1: Check permissions
          await requestLocationPermission();

          const wifiStatus = await requestWifiPermission();
          if (wifiStatus !== RESULTS.GRANTED) {
            setWifiProofOk(false);
            setWifiProofError(
              wifiStatus === RESULTS.BLOCKED
                ? 'Wi-Fi permission is blocked. Enable it in settings.'
                : 'Wi-Fi permission is required to verify the network.'
            );
            return;
          }

          // Step 2: Wi-Fi validation
          const configOffice = configQuery.data?.office as
            | Record<string, unknown>
            | undefined;
          const configWifi = configQuery.data?.wifi as
            | Record<string, unknown>
            | undefined;

          const rawAllowedSsids = coerceStringList(
            configWifi?.allowed_ssids ??
              configWifi?.ssids ??
              configOffice?.allowed_ssids ??
              configOffice?.wifi_ssids ??
              configOffice?.wifi_ssid
          );
          const rawAllowedBssids = coerceStringList(
            configWifi?.allowed_bssids ??
              configWifi?.bssids ??
              configOffice?.allowed_bssids ??
              configOffice?.wifi_bssids ??
              configOffice?.wifi_bssid
          );
          const allowedSsids = rawAllowedSsids
            .map((ssid) => normalizeSsid(ssid))
            .filter(Boolean);
          const allowedBssids = rawAllowedBssids
            .map((bssid) => normalizeBssid(bssid))
            .filter(Boolean);

          if (allowedSsids.length === 0) {
            allowedSsids.push(
              ...coerceStringList(env.OFFICE_WIFI_SSID)
                .map((ssid) => normalizeSsid(ssid))
                .filter(Boolean)
            );
          }

          if (allowedBssids.length === 0) {
            allowedBssids.push(
              ...coerceStringList(env.OFFICE_WIFI_BSSID)
                .map((bssid) => normalizeBssid(bssid))
                .filter(Boolean)
            );
          }

          if (allowedSsids.length === 0 && allowedBssids.length === 0) {
            setWifiProofOk(false);
            setWifiProofError('Office Wi-Fi is not configured.');
            return;
          }

          if (netInfo.type !== 'wifi') {
            setWifiProofOk(false);
            setWifiProofError('Not connected to Wi-Fi.');
            return;
          }

          if (allowedSsids.length > 0 && !wifiSsid) {
            setWifiProofOk(false);
            setWifiProofError(
              'Unable to read Wi-Fi name. Ensure Wi-Fi and location are enabled.'
            );
            return;
          }

          if (allowedBssids.length > 0 && !wifiBssid) {
            setWifiProofOk(false);
            setWifiProofError(
              'Unable to read Wi-Fi access point. Ensure Wi-Fi and location are enabled.'
            );
            return;
          }

          if (
            allowedSsids.length > 0 &&
            !allowedSsids.includes(normalizeSsid(wifiSsid))
          ) {
            setWifiProofOk(false);
            setWifiProofError('Connected Wi-Fi is not the office network.');
            return;
          }

          if (
            allowedBssids.length > 0 &&
            !allowedBssids.includes(normalizeBssid(wifiBssid))
          ) {
            setWifiProofOk(false);
            setWifiProofError('Office Wi-Fi access point mismatch.');
            return;
          }

          // Final step: Verify with backend
          try {
            const proof = await requestOfficeProof({
              bssid: wifiBssid ?? undefined,
              ssid: wifiSsid ?? undefined,
            });
            if (proof.ok) {
              setWifiProofOk(true);
              setWifiProofError(null);
            } else {
              setWifiProofOk(false);
              setWifiProofError('Office Wi-Fi proof failed.');
            }
          } catch (error) {
            setWifiProofOk(false);
            setWifiProofError(getErrorMessage(error));
          }
        })(),
        validationTimeout,
      ]);
    } catch (error) {
      if (getErrorMessage(error).includes('timeout')) {
        setWifiProofOk(false);
        setWifiProofError('Validation timeout. Please try again.');
      } else {
        setWifiProofOk(false);
        setWifiProofError('Validation failed. Please try again.');
      }
    } finally {
      setIsValidating(false);
    }
  }, [configQuery.data, netInfo.type, wifiSsid, wifiBssid]);

  return {
    isValidating,
    wifiProofOk,
    wifiProofError,
    wifiSsid,
    refreshValidation,
  };
};
