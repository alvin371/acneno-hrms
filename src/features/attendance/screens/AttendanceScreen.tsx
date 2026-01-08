import { useEffect, useMemo, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import * as Geolocation from 'react-native-geolocation-service';
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
import { getConfig } from '@/features/config/api';
import {
  checkIn,
  checkOut,
  requestOfficeProof,
  type AttendancePayload,
} from '@/features/attendance/api';

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
  new Promise<Geolocation.GeoPosition>((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
      forceRequestLocation: true,
    });
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

const isPlaceholderBssid = (value?: string | null) =>
  normalizeBssid(value) === '02:00:00:00:00';

export const AttendanceScreen = () => {
  const [now, setNow] = useState(new Date());
  const [permissionStatus, setPermissionStatus] = useState<string>();
  const [location, setLocation] = useState<Geolocation.GeoPosition | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [wifiProofOk, setWifiProofOk] = useState<boolean | null>(null);
  const [wifiProofError, setWifiProofError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const canCheck = isWithinRadius && wifiProofOk === true && !!location;

  const refreshStatus = async () => {
    setIsRefreshing(true);
    try {
      const status = await requestLocationPermission();
      setPermissionStatus(status);
      if (status !== RESULTS.GRANTED) {
        setIsRefreshing(false);
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
        return;
      }

      let current: Geolocation.GeoPosition;
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
      const configOffice = configQuery.data?.office as
        | Record<string, unknown>
        | undefined;
      const officeLat = toNumber(
        configOffice?.lat ?? configOffice?.latitude ?? env.OFFICE_LAT
      );
      const officeLng = toNumber(
        configOffice?.lng ?? configOffice?.longitude ?? env.OFFICE_LNG
      );
      if (officeLat == null || officeLng == null) {
        setWifiProofOk(false);
        setWifiProofError('Office location is not configured.');
        return;
      }
      const distance = haversineDistanceMeters(
        current.coords.latitude,
        current.coords.longitude,
        officeLat,
        officeLng
      );
      setDistanceMeters(distance);

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

      if (allowedSsids.length > 0 && !allowedSsids.includes(normalizeSsid(wifiSsid))) {
        setWifiProofOk(false);
        setWifiProofError('Connected Wi-Fi is not the office network.');
        return;
      }

      if (allowedBssids.length > 0 && !allowedBssids.includes(normalizeBssid(wifiBssid))) {
        setWifiProofOk(false);
        setWifiProofError('Office Wi-Fi access point mismatch.');
        return;
      }

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
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  useEffect(() => {
    if (configQuery.data) {
      refreshStatus();
    }
  }, [configQuery.data]);

  const createPayload = (): AttendancePayload | null => {
    if (!location || distanceMeters === null) {
      return null;
    }

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
    onError: (error) => showToast('error', getErrorMessage(error)),
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
    onError: (error) => showToast('error', getErrorMessage(error)),
  });

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
            <Text className={isWithinRadius ? 'text-emerald-600' : 'text-rose-600'}>
              {isWithinRadius ? 'Inside office radius' : 'Outside office radius'}
            </Text>
          </View>
        </Card>
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
                : `${Math.round(distanceMeters)}m from office`}
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
            onPress={() => checkInMutation.mutate()}
            disabled={!canCheck}
            loading={checkInMutation.isPending}
          />
          <Button
            label="Check Out"
            onPress={() => checkOutMutation.mutate()}
            disabled={!canCheck}
            loading={checkOutMutation.isPending}
            variant="secondary"
          />
        </View>
      </View>
    </Screen>
  );
};
