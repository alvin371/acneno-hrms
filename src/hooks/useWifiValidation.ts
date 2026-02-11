import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
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

export type WifiErrorCode =
  | 'permission_location'
  | 'permission_wifi'
  | 'not_connected'
  | 'ssid_unreadable'
  | 'bssid_unreadable'
  | 'ssid_mismatch'
  | 'bssid_mismatch'
  | 'not_configured'
  | 'proof_failed'
  | 'api_error'
  | 'timeout';

export type WifiValidationState = {
  isValidating: boolean;
  wifiProofOk: boolean | null;
  wifiProofError: string | null;
  wifiSsid: string | null;
  errorCode: WifiErrorCode | null;
  refreshValidation: () => Promise<void>;
};

export const useWifiValidation = (): WifiValidationState => {
  const [isValidating, setIsValidating] = useState(false);
  const [wifiProofOk, setWifiProofOk] = useState<boolean | null>(null);
  const [wifiProofError, setWifiProofError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<WifiErrorCode | null>(null);
  const [freshWifiSsid, setFreshWifiSsid] = useState<string | null>(null);

  const { refetch: refetchConfig } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
  });

  const refreshValidation = useCallback(async () => {
    setIsValidating(true);
    setWifiProofError(null);
    setErrorCode(null);

    try {
      // Re-fetch config to get latest allowed SSIDs/BSSIDs
      const { data: freshConfig } = await refetchConfig();

      const validationTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Validation timeout')), 10000);
      });

      await Promise.race([
        (async () => {
          // Step 1: Check permissions
          const locStatus = await requestLocationPermission();

          if (locStatus !== RESULTS.GRANTED) {
            setWifiProofOk(false);
            setErrorCode('permission_location');
            setWifiProofError('Location permission is required.');
            return;
          }

          const wifiStatus = await requestWifiPermission();
          if (wifiStatus !== RESULTS.GRANTED) {
            setWifiProofOk(false);
            setErrorCode('permission_wifi');
            setWifiProofError('Wi-Fi permission is blocked.');
            return;
          }

          // Step 2: Fetch fresh Wi-Fi state (critical for iOS where
          // SSID/BSSID are only readable after location permission is granted)
          const freshState = await NetInfo.refresh();
          const freshDetails =
            freshState.type === 'wifi'
              ? (freshState.details as { ssid?: string; bssid?: string })
              : null;
          const freshRawSsid = freshDetails?.ssid ?? null;
          const freshRawBssid = freshDetails?.bssid ?? null;
          const freshSsid = isUnknownSsid(freshRawSsid) ? null : freshRawSsid;
          const freshBssid = isPlaceholderBssid(freshRawBssid) ? null : freshRawBssid;

          // Store fresh SSID for display (iOS needs this)
          setFreshWifiSsid(freshSsid);

          if (freshState.type !== 'wifi') {
            setWifiProofOk(false);
            setErrorCode('not_connected');
            setWifiProofError('Not connected to Wi-Fi.');
            return;
          }

          // Step 3: Wi-Fi validation using fresh config
          const configOffice = freshConfig?.office as
            | Record<string, unknown>
            | undefined;
          const configWifi = freshConfig?.wifi as
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

          // When no local SSID/BSSID list is configured, skip local checks
          // and go straight to backend proof (backend validates by its own rules)
          if (allowedSsids.length === 0 && allowedBssids.length === 0) {
            try {
              const proof = await requestOfficeProof({
                bssid: freshBssid ?? undefined,
                ssid: freshSsid ?? undefined,
              });
              if (proof.ok) {
                setWifiProofOk(true);
                setWifiProofError(null);
                setErrorCode(null);
              } else {
                setWifiProofOk(false);
                setErrorCode('proof_failed');
                setWifiProofError('Server could not verify your Wi-Fi.');
              }
            } catch (error) {
              setWifiProofOk(false);
              setErrorCode('api_error');
              setWifiProofError(getErrorMessage(error));
            }
            return;
          }

          if (allowedSsids.length > 0 && !freshSsid) {
            setWifiProofOk(false);
            setErrorCode('ssid_unreadable');
            setWifiProofError('Unable to read Wi-Fi name.');
            return;
          }

          if (allowedBssids.length > 0 && !freshBssid) {
            setWifiProofOk(false);
            setErrorCode('bssid_unreadable');
            setWifiProofError('Unable to read Wi-Fi info.');
            return;
          }

          if (
            allowedSsids.length > 0 &&
            !allowedSsids.includes(normalizeSsid(freshSsid))
          ) {
            setWifiProofOk(false);
            setErrorCode('ssid_mismatch');
            setWifiProofError(
              `Wrong Wi-Fi network: "${freshSsid}".`
            );
            return;
          }

          if (
            allowedBssids.length > 0 &&
            !allowedBssids.includes(normalizeBssid(freshBssid))
          ) {
            setWifiProofOk(false);
            setErrorCode('bssid_mismatch');
            setWifiProofError(
              "Wi-Fi access point doesn't match office network."
            );
            return;
          }

          // Final step: Verify with backend
          try {
            const proof = await requestOfficeProof({
              bssid: freshBssid ?? undefined,
              ssid: freshSsid ?? undefined,
            });
            if (proof.ok) {
              setWifiProofOk(true);
              setWifiProofError(null);
              setErrorCode(null);
            } else {
              setWifiProofOk(false);
              setErrorCode('proof_failed');
              setWifiProofError('Server could not verify your Wi-Fi.');
            }
          } catch (error) {
            setWifiProofOk(false);
            setErrorCode('api_error');
            setWifiProofError(getErrorMessage(error));
          }
        })(),
        validationTimeout,
      ]);
    } catch (error) {
      if (getErrorMessage(error).includes('timeout')) {
        setWifiProofOk(false);
        setErrorCode('timeout');
        setWifiProofError('Verification timed out.');
      } else {
        setWifiProofOk(false);
        setErrorCode('api_error');
        setWifiProofError(getErrorMessage(error));
      }
    } finally {
      setIsValidating(false);
    }
  }, [refetchConfig]);

  return {
    isValidating,
    wifiProofOk,
    wifiProofError,
    wifiSsid: freshWifiSsid,
    errorCode,
    refreshValidation,
  };
};
