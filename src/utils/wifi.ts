import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  check,
  checkMultiple,
  PERMISSIONS,
  request,
  requestMultiple,
  RESULTS,
  type PermissionStatus,
} from 'react-native-permissions';

export type WifiSnapshot = {
  ssid: string | null;
  bssid: string | null;
  ip: string | null;
  subnet: string | null;
  strength: number | null;
  frequency: number | null;
  isWifiConnected: boolean;
};

export type WifiReadStatus =
  | 'ok'
  | 'permission_location'
  | 'permission_wifi'
  | 'not_connected'
  | 'ssid_unreadable'
  | 'bssid_unreadable';

type NetInfoWifiDetails = {
  ssid?: string;
  bssid?: string;
  ipAddress?: string | null;
  subnet?: string | null;
  strength?: number | null;
  frequency?: number | null;
};

const EMPTY_SNAPSHOT: WifiSnapshot = {
  ssid: null,
  bssid: null,
  ip: null,
  subnet: null,
  strength: null,
  frequency: null,
  isWifiConnected: false,
};

export const normalizeBssid = (value?: string | null) =>
  value?.trim().toLowerCase() ?? '';

export const normalizeSsid = (value?: string | null) => value?.trim() ?? '';

export const isUnknownSsid = (value?: string | null) => {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return normalized === '<unknown ssid>' || normalized === 'unknown ssid';
};

export const isPlaceholderBssid = (value?: string | null) => {
  const normalized = normalizeBssid(value);
  return normalized === '02:00:00:00:00' || normalized === '02:00:00:00:00:00';
};

export const requestLocationPermission = async (): Promise<PermissionStatus> => {
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

export const requestWifiPermission = async (): Promise<PermissionStatus> => {
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

export const readCurrentWifiSnapshot = async (): Promise<{
  snapshot: WifiSnapshot;
  status: WifiReadStatus;
}> => {
  const locationStatus = await requestLocationPermission();
  if (locationStatus !== RESULTS.GRANTED) {
    return { snapshot: EMPTY_SNAPSHOT, status: 'permission_location' };
  }

  const wifiStatus = await requestWifiPermission();
  if (wifiStatus !== RESULTS.GRANTED) {
    return { snapshot: EMPTY_SNAPSHOT, status: 'permission_wifi' };
  }

  const freshState = await NetInfo.refresh();
  if (freshState.type !== 'wifi') {
    return { snapshot: EMPTY_SNAPSHOT, status: 'not_connected' };
  }

  const details = freshState.details as NetInfoWifiDetails;
  const snapshot: WifiSnapshot = {
    ssid: isUnknownSsid(details?.ssid) ? null : (details?.ssid ?? null),
    bssid: isPlaceholderBssid(details?.bssid) ? null : (details?.bssid ?? null),
    ip: details?.ipAddress ?? null,
    subnet: details?.subnet ?? null,
    strength: details?.strength ?? null,
    frequency: details?.frequency ?? null,
    isWifiConnected: true,
  };

  if (!snapshot.ssid) {
    return { snapshot, status: 'ssid_unreadable' };
  }

  if (!snapshot.bssid) {
    return { snapshot, status: 'bssid_unreadable' };
  }

  return { snapshot, status: 'ok' };
};
