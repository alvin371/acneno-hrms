import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useQuery } from '@tanstack/react-query';
import {
  check,
  openSettings,
  PERMISSIONS,
  request,
  RESULTS,
} from 'react-native-permissions';
import { reverseGeocodeCity } from '@/api/nominatim';

type LocationPermissionState =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'permission_denied'
  | 'error';

type DeviceCoordinates = {
  latitude: number;
  longitude: number;
};

export type ProfileCityStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'permission_denied'
  | 'error';

const LOCATION_TIMEOUT_MS = 15000;
const LOCATION_MAX_AGE_MS = 1000 * 60 * 5;
const PROFILE_CITY_STALE_TIME_MS = 1000 * 60 * 60 * 24;
let cachedCoordinates: DeviceCoordinates | null = null;

const roundCoordinate = (value: number) => Number(value.toFixed(3));

const getLocaleHeader = () => {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  return locale ? `${locale},id,en` : 'id,en';
};

const getLocationPermission = () =>
  Platform.select({
    ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  });

const requestLocationPermission = async () => {
  const permission = getLocationPermission();
  if (!permission) {
    return RESULTS.UNAVAILABLE;
  }

  const status = await check(permission);
  if (status === RESULTS.DENIED) {
    return request(permission);
  }

  return status;
};

const getCurrentCoordinates = (): Promise<DeviceCoordinates> =>
  new Promise((resolve, reject) => {
    if (!Geolocation || typeof Geolocation.getCurrentPosition !== 'function') {
      reject(new Error('Geolocation service not available.'));
      return;
    }

    Geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => reject(new Error(error.message || 'Failed to get location.')),
      {
        enableHighAccuracy: false,
        timeout: LOCATION_TIMEOUT_MS,
        maximumAge: LOCATION_MAX_AGE_MS,
      }
    );
  });

export const useProfileCity = () => {
  const [permissionState, setPermissionState] =
    useState<LocationPermissionState>('idle');
  const [coordinates, setCoordinates] = useState<DeviceCoordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isActive = true;

    const loadCoordinates = async () => {
      if (cachedCoordinates) {
        setCoordinates(cachedCoordinates);
        setPermissionState('ready');
        return;
      }

      setPermissionState('loading');
      setLocationError(null);

      try {
        const permissionStatus = await requestLocationPermission();
        if (!isActive) {
          return;
        }

        if (permissionStatus !== RESULTS.GRANTED) {
          setCoordinates(null);
          setPermissionState('permission_denied');
          return;
        }

        const currentCoordinates = await getCurrentCoordinates();
        if (!isActive) {
          return;
        }

        setCoordinates(currentCoordinates);
        cachedCoordinates = currentCoordinates;
        setPermissionState('ready');
      } catch (error) {
        if (!isActive) {
          return;
        }

        setCoordinates(null);
        setPermissionState('error');
        setLocationError(
          error instanceof Error ? error.message : 'Failed to determine city.'
        );
      }
    };

    void loadCoordinates();

    return () => {
      isActive = false;
    };
  }, [attempt]);

  const roundedCoordinates = useMemo(
    () =>
      coordinates
        ? {
            latitude: roundCoordinate(coordinates.latitude),
            longitude: roundCoordinate(coordinates.longitude),
          }
        : null,
    [coordinates]
  );

  const locale = useMemo(() => getLocaleHeader(), []);

  const cityQuery = useQuery({
    queryKey: [
      'profile-city',
      roundedCoordinates?.latitude,
      roundedCoordinates?.longitude,
      locale,
    ],
    queryFn: ({ signal }) => {
      if (!roundedCoordinates) {
        throw new Error('Coordinates unavailable.');
      }

      return reverseGeocodeCity({
        latitude: roundedCoordinates.latitude,
        longitude: roundedCoordinates.longitude,
        locale,
        signal,
      });
    },
    enabled: permissionState === 'ready' && Boolean(roundedCoordinates),
    staleTime: PROFILE_CITY_STALE_TIME_MS,
    gcTime: PROFILE_CITY_STALE_TIME_MS,
    retry: 1,
  });

  const retry = useCallback(() => {
    cachedCoordinates = null;
    setAttempt((value) => value + 1);
  }, []);

  const currentStatus: ProfileCityStatus = useMemo(() => {
    if (permissionState === 'loading' || cityQuery.isLoading) {
      return 'loading';
    }
    if (permissionState === 'permission_denied') {
      return 'permission_denied';
    }
    if (cityQuery.data?.displayLabel) {
      return 'success';
    }
    if (permissionState === 'error' || cityQuery.isError) {
      return 'error';
    }
    return 'idle';
  }, [cityQuery.data?.displayLabel, cityQuery.isError, cityQuery.isLoading, permissionState]);

  return {
    cityLabel: cityQuery.data?.displayLabel ?? null,
    status: currentStatus,
    errorMessage:
      locationError ??
      (cityQuery.error instanceof Error ? cityQuery.error.message : null),
    retry,
    openLocationSettings: openSettings,
  };
};
