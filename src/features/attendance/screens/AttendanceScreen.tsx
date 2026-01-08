import { useEffect, useMemo, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { useMutation } from '@tanstack/react-query';
import { useNetInfo } from '@react-native-community/netinfo';
import {
  check,
  openSettings,
  PERMISSIONS,
  request,
  RESULTS,
} from 'react-native-permissions';
import { Screen } from '@/ui/Screen';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { env } from '@/config/env';
import { haversineDistanceMeters } from '@/utils/distance';
import { getErrorMessage } from '@/api/error';
import { showToast } from '@/utils/toast';
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

export const AttendanceScreen = () => {
  const [now, setNow] = useState(new Date());
  const [permissionStatus, setPermissionStatus] = useState<string>();
  const [location, setLocation] = useState<Geolocation.GeoPosition | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [wifiProofOk, setWifiProofOk] = useState<boolean | null>(null);
  const [wifiProofError, setWifiProofError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const netInfo = useNetInfo();
  const wifiDetails =
    netInfo.type === 'wifi'
      ? (netInfo.details as { ssid?: string; bssid?: string })
      : null;
  const wifiSsid = wifiDetails?.ssid ?? null;
  const wifiBssid = wifiDetails?.bssid ?? null;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isWithinRadius = useMemo(() => {
    if (distanceMeters === null) {
      return false;
    }
    return distanceMeters <= env.OFFICE_RADIUS_M;
  }, [distanceMeters]);

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

      const current = await getCurrentLocation();
      setLocation(current);
      const distance = haversineDistanceMeters(
        current.coords.latitude,
        current.coords.longitude,
        env.OFFICE_LAT,
        env.OFFICE_LNG
      );
      setDistanceMeters(distance);

      const officeSsid = normalizeSsid(env.OFFICE_WIFI_SSID);
      const officeBssid = normalizeBssid(env.OFFICE_WIFI_BSSID);

      if (!officeSsid && !officeBssid) {
        setWifiProofOk(false);
        setWifiProofError('Office Wi-Fi is not configured.');
        return;
      }

      if (netInfo.type !== 'wifi') {
        setWifiProofOk(false);
        setWifiProofError('Not connected to Wi-Fi.');
        return;
      }

      if (!wifiSsid || !wifiBssid) {
        setWifiProofOk(false);
        setWifiProofError(
          'Unable to read Wi-Fi details. Ensure Wi-Fi and location are enabled.'
        );
        return;
      }

      if (officeSsid && normalizeSsid(wifiSsid) !== officeSsid) {
        setWifiProofOk(false);
        setWifiProofError('Connected Wi-Fi is not the office network.');
        return;
      }

      if (officeBssid && normalizeBssid(wifiBssid) !== officeBssid) {
        setWifiProofOk(false);
        setWifiProofError('Office Wi-Fi access point mismatch.');
        return;
      }

      try {
        const proof = await requestOfficeProof();
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

  const createPayload = (): AttendancePayload | null => {
    if (!location || distanceMeters === null) {
      return null;
    }

    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      gpsAccuracy: location.coords.accuracy ?? 0,
      distanceMeters,
      wifiProof: 'office-proof',
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
              {distanceMeters === null
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
