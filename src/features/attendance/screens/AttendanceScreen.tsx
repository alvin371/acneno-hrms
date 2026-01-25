import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, Text, View } from 'react-native';
import Geolocation, { type GeoPosition } from 'react-native-geolocation-service';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNetInfo } from '@react-native-community/netinfo';
import {
  check,
  checkMultiple,
  openSettings,
  PERMISSIONS,
  request,
  requestMultiple,
  RESULTS,
} from 'react-native-permissions';
import { Screen } from '@/ui/Screen';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { env } from '@/config/env';
import { haversineDistanceMeters } from '@/utils/distance';
import { getErrorMessage } from '@/api/error';
import { showToast } from '@/utils/toast';
import { showErrorModal } from '@/utils/errorModal';
import { getConfig } from '@/features/config/api';
import {
  checkIn,
  checkOut,
  getAttendanceHistory,
  requestOfficeProof,
  type AttendancePayload,
} from '@/features/attendance/api';
import type { AttendanceRecord } from '@/api/types';
import { parseServerDateTime } from '@/features/attendance/utils';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AttendanceStackParamList } from '@/navigation/types';

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

const getCurrentLocation = () =>
  new Promise<GeoPosition>((resolve, reject) => {
    Geolocation.getCurrentPosition(
      resolve,
      () => {
        Geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 30000,
          forceRequestLocation: true,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        forceRequestLocation: true,
      }
    );
  });

const normalizeBssid = (value?: string | null) =>
  value?.trim().toLowerCase() ?? '';

const normalizeSsid = (value?: string | null) => value?.trim() ?? '';

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

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

const isPlaceholderBssid = (value?: string | null) => {
  const normalized = normalizeBssid(value);
  return normalized === '02:00:00:00:00' || normalized === '02:00:00:00:00:00';
};

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

type Props = NativeStackScreenProps<
  AttendanceStackParamList,
  'AttendanceMain'
>;

export const AttendanceScreen = ({ navigation }: Props) => {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(new Date());
  const [permissionStatus, setPermissionStatus] = useState<string>();
  const [location, setLocation] = useState<GeoPosition | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [wifiProofOk, setWifiProofOk] = useState<boolean | null>(null);
  const [wifiProofError, setWifiProofError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const appState = useRef(AppState.currentState);

  const configQuery = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
  });

  const netInfo = useNetInfo({
    shouldFetchWiFiSSID: true,
  });
  const wifiDetails =
    netInfo.type === 'wifi'
      ? (netInfo.details as { ssid?: string; bssid?: string })
      : null;
  const rawWifiSsid = wifiDetails?.ssid ?? null;
  const rawWifiBssid = wifiDetails?.bssid ?? null;
  const wifiSsid = isUnknownSsid(rawWifiSsid) ? null : rawWifiSsid;
  const wifiBssid = isPlaceholderBssid(rawWifiBssid) ? null : rawWifiBssid;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (attendanceHistoryQuery.error) {
      showToast('error', getErrorMessage(attendanceHistoryQuery.error));
    }
  }, [attendanceHistoryQuery.error]);


  const isWithinRadius = useMemo(() => {
    if (distanceMeters === null) {
      return false;
    }
    const configuredRadius =
      configQuery.data?.attendance.radius_m ??
      configQuery.data?.office.radius_m ??
      env.OFFICE_RADIUS_M;
    if (!configuredRadius) {
      return false;
    }
    return distanceMeters <= configuredRadius;
  }, [
    distanceMeters,
    configQuery.data?.attendance.radius_m,
    configQuery.data?.office.radius_m,
  ]);

  const canCheck = wifiProofOk === true && !!location;

  const refreshStatus = useCallback(async () => {
    setIsRefreshing(true);
    setWifiProofOk(null);
    setWifiProofError(null);
    try {
      const status = await requestLocationPermission();
      setPermissionStatus(status);
      if (status !== RESULTS.GRANTED) {
        return;
      }

      const wifiStatus = await requestWifiPermission();
      if (wifiStatus !== RESULTS.GRANTED) {
        setWifiProofOk(false);
        setWifiProofError(
          wifiStatus === RESULTS.BLOCKED
            ? 'Wi-Fi permission is blocked. Enable it in settings.'
            : 'Wi-Fi permission is required to verify the network.'
        );
        setIsRefreshing(false);
        return;
      }

      // Retry Wi-Fi detection up to 3 times to ensure permissions are processed
      let attempts = 0;
      const maxAttempts = 3;
      let latestNetInfo = netInfo;
      let currentSsid: string | null = null;
      let currentBssid: string | null = null;
      while (attempts < maxAttempts) {
        const refreshed = await netInfo.refresh?.();
        if (refreshed) {
          latestNetInfo = refreshed;
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Check if we got valid Wi-Fi info
        const currentWifiDetails =
          latestNetInfo.type === 'wifi'
            ? (latestNetInfo.details as { ssid?: string; bssid?: string })
            : null;
        currentSsid = currentWifiDetails?.ssid ?? null;
        currentBssid = currentWifiDetails?.bssid ?? null;

        // If we got valid Wi-Fi info (not unknown/placeholder), break
        if (
          (currentSsid && !isUnknownSsid(currentSsid)) ||
          (currentBssid && !isPlaceholderBssid(currentBssid))
        ) {
          break;
        }

        attempts++;
        if (attempts < maxAttempts) {
          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      const configOffice = configQuery.data?.office as
        | Record<string, unknown>
        | undefined;

          // Step 2: Try to get location (but don't fail Wi-Fi validation if this fails)
          let current: Geolocation.GeoPosition | null = null;
          if (status === RESULTS.GRANTED) {
            try {
              current = await getCurrentLocation();
              setLocation(current);
              setLocationError(null);
            } catch (error) {
              setLocation(null);
              setDistanceMeters(null);
              setLocationError(getErrorMessage(error));
              // Don't return - Wi-Fi validation can still proceed
            }
          } else {
            setLocation(null);
            setDistanceMeters(null);
            setLocationError('Location permission not granted.');
          }

          // Step 3: Calculate distance if we have location
          if (current) {
            const configOffice = configQuery.data?.office as
              | Record<string, unknown>
              | undefined;
            const officeLat = toNumber(
              configOffice?.lat ?? configOffice?.latitude ?? env.OFFICE_LAT
            );
            const officeLng = toNumber(
              configOffice?.lng ?? configOffice?.longitude ?? env.OFFICE_LNG
            );

            if (officeLat != null && officeLng != null) {
              try {
                const distance = haversineDistanceMeters(
                  current.coords.latitude,
                  current.coords.longitude,
                  officeLat,
                  officeLng
                );

                // Ensure distance is a valid number
                if (typeof distance === 'number' && Number.isFinite(distance)) {
                  setDistanceMeters(distance);
                } else {
                  setDistanceMeters(null);
                  setLocationError('Unable to calculate distance to office.');
                }
              } catch (error) {
                setDistanceMeters(null);
                setLocationError('Unable to calculate distance to office.');
              }
            } else {
              setDistanceMeters(null);
            }
          }

          // Step 4: INDEPENDENT Wi-Fi validation (works regardless of location status)
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

      if (latestNetInfo.type !== 'wifi') {
        setWifiProofOk(false);
        setWifiProofError('Not connected to Wi-Fi.');
        return;
      }

      const resolvedSsid = isUnknownSsid(currentSsid) ? null : currentSsid;
      const resolvedBssid = isPlaceholderBssid(currentBssid) ? null : currentBssid;

      if (allowedSsids.length > 0 && !resolvedSsid) {
        setWifiProofOk(false);
        const platformInstructions = Platform.select({
          android:
            Platform.Version >= 33
              ? 'Grant "Nearby Wi-Fi devices" permission in Settings > Apps > Acneno Life > Permissions.'
              : 'Enable Location services in Settings > Location.',
          ios: 'Enable Location services in Settings > Privacy > Location Services.',
        });
        setWifiProofError(
          `Unable to read Wi-Fi name. ${platformInstructions}`
        );
        return;
      }

      if (allowedBssids.length > 0 && !resolvedBssid) {
        setWifiProofOk(false);
        const platformInstructions = Platform.select({
          android:
            Platform.Version >= 33
              ? 'Grant "Nearby Wi-Fi devices" permission in Settings > Apps > Acneno Life > Permissions.'
              : 'Enable Location services in Settings > Location.',
          ios: 'Enable Location services in Settings > Privacy > Location Services.',
        });
        setWifiProofError(
          `Unable to read Wi-Fi access point. ${platformInstructions}`
        );
        return;
      }

      if (
        allowedSsids.length > 0 &&
        !allowedSsids.includes(normalizeSsid(resolvedSsid))
      ) {
        setWifiProofOk(false);
        setWifiProofError('Connected Wi-Fi is not the office network.');
        return;
      }

      if (
        allowedBssids.length > 0 &&
        !allowedBssids.includes(normalizeBssid(resolvedBssid))
      ) {
        setWifiProofOk(false);
        setWifiProofError('Office Wi-Fi access point mismatch.');
        return;
      }

      try {
        const proof = await requestOfficeProof({
          bssid: resolvedBssid ?? undefined,
          ssid: resolvedSsid ?? undefined,
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
        setWifiProofError('Validation timeout. Please try again.');
      } else {
        setWifiProofOk(false);
        setWifiProofError('Validation failed. Please try again.');
      }

      let current: GeoPosition;
      try {
        current = await getCurrentLocation();
        setLocationError(null);
      } catch (error) {
        setLocation(null);
        setDistanceMeters(null);
        setLocationError(getErrorMessage(error));
        return;
      }
      setLocation(current);
      const officeLat = toNumber(
        configOffice?.lat ?? configOffice?.latitude ?? env.OFFICE_LAT
      );
      const officeLng = toNumber(
        configOffice?.lng ?? configOffice?.longitude ?? env.OFFICE_LNG
      );
      if (officeLat == null || officeLng == null) {
        setDistanceMeters(null);
        setLocationError('Office location is not configured.');
        return;
      }
      const distance = haversineDistanceMeters(
        current.coords.latitude,
        current.coords.longitude,
        officeLat,
        officeLng
      );
      setDistanceMeters(distance);
    } finally {
      setIsRefreshing(false);
      setIsValidating(false);
    }
  }, [configQuery.data, netInfo.type, wifiSsid, wifiBssid]);

  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (configQuery.data) {
      refreshStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configQuery.data]);

  // Refresh permission status when app returns from background (e.g., after settings)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        refreshStatus();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createPayload = (): AttendancePayload | null => {
    // If location is available, use full validation
    if (location && distanceMeters !== null) {
      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        gpsAccuracy: location.coords.accuracy ?? 0,
        distanceMeters,
        wifiProof: {
          bssid: wifiBssid ?? undefined,
          ssid: wifiSsid ?? undefined,
        },
      };
    }

    // Fallback: If location failed but Wi-Fi is verified, use Wi-Fi-only validation
    if (locationError && wifiProofOk === true) {
      return {
        lat: 0, // Placeholder when location unavailable
        lng: 0, // Placeholder when location unavailable
        gpsAccuracy: 0,
        distanceMeters: 0,
        wifiProof: {
          bssid: wifiBssid ?? undefined,
          ssid: wifiSsid ?? undefined,
        },
      };
    }

    return null;
  };

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const payload = createPayload();
      if (!payload) {
        throw new Error('Location not available yet.');
      }
      return checkIn(payload);
    },
    onSuccess: () => showToast('success', 'Checked in successfully.'),
    onError: (error) => showErrorModal(getErrorMessage(error)),
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const payload = createPayload();
      if (!payload) {
        throw new Error('Location not available yet.');
      }
      return checkOut(payload);
    },
    onSuccess: () => showToast('success', 'Checked out successfully.'),
    onError: (error) => showErrorModal(getErrorMessage(error)),
  });

  const weeklyRecords = useMemo(() => {
    if (!attendanceHistoryQuery.data) {
      return [];
    }
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    return attendanceHistoryQuery.data
      .map((record) => ({
        record,
        parsedDate: parseServerDateTime(record.created_at),
      }))
      .filter(
        (entry): entry is { record: AttendanceRecord; parsedDate: Date } =>
          !!entry.parsedDate && entry.parsedDate >= weekStart
      )
      .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime())
      .map((entry) => entry.record);
  }, [attendanceHistoryQuery.data, now]);

  const todaySummary = useMemo(() => {
    if (!attendanceHistoryQuery.data) {
      return { hasCheckIn: false, hasCheckOut: false };
    }
    const today = new Date();
    return attendanceHistoryQuery.data.reduce(
      (acc, record) => {
        const parsed = parseServerDateTime(record.created_at);
        if (parsed && isSameDay(parsed, today)) {
          if (record.type === 'IN') {
            acc.hasCheckIn = true;
          }
          if (record.type === 'OUT') {
            acc.hasCheckOut = true;
          }
        }
        return acc;
      },
      { hasCheckIn: false, hasCheckOut: false }
    );
  }, [attendanceHistoryQuery.data]);

  if (permissionStatus && permissionStatus !== RESULTS.GRANTED) {
    return (
      <Screen>
        <View className="gap-4">
          <Text className="text-2xl font-bold text-ink-700">
            Location required
          </Text>
          <Text className="text-base text-ink-500">
            We need your location to validate attendance inside the office radius.
          </Text>
          <Button label="Allow location" onPress={refreshStatus} />
          <Button
            label="Open Settings"
            variant="secondary"
            onPress={() => openSettings()}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View className="gap-6">
        <View>
          <Text className="text-2xl font-bold text-ink-700">Attendance</Text>
          <Text className="text-base text-ink-500">
            Validate your office check-in using GPS and Wi-Fi proof.
          </Text>
        </View>
        <Card className="gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-ink-700">Current time</Text>
            <Text className="text-base text-ink-600">
              {now.toLocaleTimeString()}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-ink-700">Status</Text>
            <Text className={isWithinRadius ? 'text-emerald-600' : locationError && wifiProofOk ? 'text-amber-600' : 'text-rose-600'}>
              {isWithinRadius
                ? 'Inside office radius'
                : locationError && wifiProofOk
                ? 'Wi-Fi verified (Location unavailable)'
                : 'Outside office radius'}
            </Text>
          </View>
        </Card>
        {locationError && wifiProofOk && (
          <Card className="gap-2 bg-amber-50 border-amber-200">
            <Text className="text-sm font-semibold text-amber-800">
              Using Wi-Fi-only validation
            </Text>
            <Text className="text-xs text-amber-700">
              Location services are unavailable, but you can still check in using Wi-Fi verification.
            </Text>
          </Card>
        )}
        <Card className="gap-3">
          <Text className="text-base font-semibold text-ink-700">Validation</Text>
          <View className="gap-2">
            <Text className="text-sm text-ink-500">
              Wi-Fi status: {netInfo.type === 'wifi' ? 'Connected' : 'Not on Wi-Fi'}
            </Text>
            <Text className="text-sm text-ink-500">
              Wi-Fi name: {wifiSsid ?? 'Unknown'}
            </Text>
            <Text className="text-sm text-ink-500">
              Wi-Fi BSSID: {wifiBssid ?? 'Unknown'}
            </Text>
            <Text className="text-sm text-ink-500">
              Location status:{' '}
              {locationError
                ? locationError
                : distanceMeters === null
                ? 'Checking location...'
                : typeof distanceMeters === 'number' && Number.isFinite(distanceMeters)
                ? `${Math.round(distanceMeters)}m from office`
                : 'Unable to calculate distance'}
            </Text>
            <Text className="text-sm text-ink-500">
              Office Wi-Fi proof:{' '}
              {wifiProofOk === null
                ? 'Checking...'
                : wifiProofOk
                ? 'Verified'
                : wifiProofError ?? 'Failed'}
            </Text>
          </View>
          <Button
            label={isRefreshing ? 'Refreshing...' : 'Refresh validation'}
            variant="secondary"
            onPress={refreshStatus}
            loading={isRefreshing}
          />
        </Card>
        <View className="gap-3">
          <Button
            label="Check In"
            onPress={() => setShowCheckInModal(true)}
            disabled={!canCheck || todaySummary.hasCheckIn}
            loading={checkInMutation.isPending}
          />
          <Button
            label="Check Out"
            onPress={() => setShowCheckOutModal(true)}
            disabled={!canCheck || todaySummary.hasCheckOut}
            loading={checkOutMutation.isPending}
            variant="secondary"
          />
        </View>

        <Card className="gap-3">
          <Text className="text-base font-semibold text-ink-700">This week</Text>
          {attendanceHistoryQuery.isLoading ? (
            <Text className="text-sm text-ink-500">
              Loading attendance history...
            </Text>
          ) : weeklyRecords.length > 0 ? (
            <View className="gap-3">
              {weeklyRecords.map((record) => {
                const parsed = parseServerDateTime(record.created_at);
                return (
                  <View
                    key={record.id}
                    className="flex-row items-center justify-between"
                  >
                    <View>
                      <Text className="text-sm font-semibold text-ink-700">
                        {record.type === 'IN' ? 'Check In' : 'Check Out'}
                      </Text>
                      <Text className="text-xs text-ink-500">
                        {parsed
                          ? parsed.toLocaleString([], {
                              month: 'short',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : record.created_at}
                      </Text>
                    </View>
                    <Text className="text-xs text-ink-500">
                      {record.office_name}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text className="text-sm text-ink-500">
              No check-in or check-out records this week.
            </Text>
          )}
        </Card>

        <Card className="gap-3">
          <Text className="text-base font-semibold text-ink-700">
            Monthly detail
          </Text>
          <Text className="text-sm text-ink-500">
            View full monthly report and download it.
          </Text>
          <Button
            label="Open monthly detail"
            variant="secondary"
            onPress={() => navigation.navigate('AttendanceMonthlyDetail')}
          />
        </Card>

        <Modal
          transparent
          visible={showCheckInModal}
          animationType="fade"
          onRequestClose={() => setShowCheckInModal(false)}
        >
          <View className="flex-1 bg-black/50 items-center justify-center p-4">
            <View className="bg-white rounded-lg p-6 w-full max-w-sm gap-4">
              <Text className="text-xl font-bold text-ink-700">
                Confirm Check In
              </Text>
              <Text className="text-base text-ink-600">
                Are you sure you want to check in now?
              </Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button
                    label="Cancel"
                    variant="secondary"
                    onPress={() => setShowCheckInModal(false)}
                    disabled={checkInMutation.isPending}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    label="Confirm"
                    onPress={() => checkInMutation.mutate()}
                    loading={checkInMutation.isPending}
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          transparent
          visible={showCheckOutModal}
          animationType="fade"
          onRequestClose={() => setShowCheckOutModal(false)}
        >
          <View className="flex-1 bg-black/50 items-center justify-center p-4">
            <View className="bg-white rounded-lg p-6 w-full max-w-sm gap-4">
              <Text className="text-xl font-bold text-ink-700">
                Confirm Check Out
              </Text>
              <Text className="text-base text-ink-600">
                Are you sure you want to check out now?
              </Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button
                    label="Cancel"
                    variant="secondary"
                    onPress={() => setShowCheckOutModal(false)}
                    disabled={checkOutMutation.isPending}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    label="Confirm"
                    onPress={() => checkOutMutation.mutate()}
                    loading={checkOutMutation.isPending}
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  );
};
