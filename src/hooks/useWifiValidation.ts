import { useCallback, useState } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { RESULTS } from 'react-native-permissions';
import { useQuery } from '@tanstack/react-query';
import { getConfig } from '@/features/config/api';
import {
  getConfigRadiusMeters,
  getConfigWifiAllowlist,
  getResolvedConfigOffices,
  type ResolvedConfigOffice,
} from '@/features/config/selectors';
import { requestOfficeProof } from '@/features/attendance/api';
import { getErrorMessage } from '@/api/error';
import { env } from '@/config/env';
import { haversineDistanceMeters } from '@/utils/distance';
import {
  normalizeBssid,
  normalizeSsid,
  readCurrentWifiSnapshot,
  requestLocationPermission,
} from '@/utils/wifi';

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

type DeviceLocation = {
  coords: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
  };
};

const getCurrentLocation = (): Promise<DeviceLocation> =>
  new Promise((resolve, reject) => {
    if (!Geolocation || typeof Geolocation.getCurrentPosition !== 'function') {
      reject(new Error('Geolocation service not available.'));
      return;
    }

    Geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(new Error(error.message || 'Failed to get location.')),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });

const hasCoordinates = (
  office: ResolvedConfigOffice
): office is ResolvedConfigOffice & { lat: number; lng: number } =>
  office.lat != null && office.lng != null;

export type WifiErrorCode =
  | 'permission_location'
  | 'permission_wifi'
  | 'not_connected'
  | 'outside_radius'
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
          const configWifi = getConfigWifiAllowlist(freshConfig);
          const allowedSsids = configWifi.allowedSsids
            .map((ssid) => normalizeSsid(ssid))
            .filter(Boolean);
          const allowedBssids = configWifi.allowedBssids
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

          const requiresWifiValidation =
            allowedSsids.length > 0 || allowedBssids.length > 0;

          // Step 1: Check permissions
          const locStatus = await requestLocationPermission();

          if (locStatus !== RESULTS.GRANTED) {
            setWifiProofOk(false);
            setErrorCode('permission_location');
            setWifiProofError('Location permission is required.');
            return;
          }

          const wifiRead = await readCurrentWifiSnapshot();
          const freshSsid = wifiRead.snapshot.ssid;
          const freshBssid = wifiRead.snapshot.bssid;
          setFreshWifiSsid(freshSsid);

          // Step 3: When no local SSID/BSSID list is configured, validate by location
          // against nearest office coordinates.
          if (allowedSsids.length === 0 && allowedBssids.length === 0) {
            try {
              const current = await getCurrentLocation();
              const configuredRadius =
                getConfigRadiusMeters(freshConfig) ?? env.OFFICE_RADIUS_M ?? null;
              const officeCoordinates = getResolvedConfigOffices(freshConfig)
                .filter(hasCoordinates)
                .map((office) => ({
                  lat: office.lat,
                  lng: office.lng,
                  radius: office.radiusM ?? configuredRadius,
                }));
              const fallbackCoordinates =
                env.OFFICE_LAT != null && env.OFFICE_LNG != null
                  ? [{
                      lat: env.OFFICE_LAT,
                      lng: env.OFFICE_LNG,
                      radius: configuredRadius,
                    }]
                  : [];
              const targetCoordinates =
                officeCoordinates.length > 0
                  ? officeCoordinates
                  : fallbackCoordinates;

              if (targetCoordinates.length === 0) {
                setWifiProofOk(false);
                setErrorCode('not_configured');
                setWifiProofError('Office location is not configured.');
                return;
              }

              const nearestOffice = targetCoordinates.reduce(
                (closest, officeCoordinate) => {
                  const distance = haversineDistanceMeters(
                    current.coords.latitude,
                    current.coords.longitude,
                    officeCoordinate.lat,
                    officeCoordinate.lng
                  );
                  if (!Number.isFinite(distance)) {
                    return closest;
                  }
                  if (!closest || distance < closest.distance) {
                    return {
                      distance,
                      radius: officeCoordinate.radius,
                    };
                  }
                  return closest;
                },
                null as { distance: number; radius: number | null } | null
              );

              if (!nearestOffice || nearestOffice.radius == null) {
                setWifiProofOk(false);
                setErrorCode('not_configured');
                setWifiProofError('Office validation radius is not configured.');
                return;
              }

              if (nearestOffice.distance <= nearestOffice.radius) {
                setWifiProofOk(true);
                setWifiProofError(null);
                setErrorCode(null);
              } else {
                setWifiProofOk(false);
                setErrorCode('outside_radius');
                setWifiProofError('You are outside the office location range.');
              }
            } catch {
              setWifiProofOk(false);
              setErrorCode('api_error');
              setWifiProofError('Unable to verify your location.');
            }
            return;
          }

          if (wifiRead.status === 'permission_wifi' && requiresWifiValidation) {
            setWifiProofOk(false);
            setErrorCode('permission_wifi');
            setWifiProofError('Wi-Fi permission is blocked.');
            return;
          }

          if (wifiRead.status === 'not_connected') {
            setWifiProofOk(false);
            setErrorCode('not_connected');
            setWifiProofError('Not connected to Wi-Fi.');
            return;
          }

          if (allowedSsids.length > 0 && !freshSsid) {
            setWifiProofOk(false);
            setErrorCode(
              wifiRead.status === 'permission_wifi'
                ? 'permission_wifi'
                : 'ssid_unreadable'
            );
            setWifiProofError('Unable to read Wi-Fi name.');
            return;
          }

          if (allowedBssids.length > 0 && !freshBssid) {
            setWifiProofOk(false);
            setErrorCode(
              wifiRead.status === 'permission_wifi'
                ? 'permission_wifi'
                : 'bssid_unreadable'
            );
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
