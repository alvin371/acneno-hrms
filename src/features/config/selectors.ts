import type { ConfigResponse, OfficeConfig } from '@/api/types';

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const coerceStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const uniqueStrings = (values: string[]): string[] =>
  Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );

export type ResolvedConfigOffice = {
  id: number | null;
  name: string;
  lat: number | null;
  lng: number | null;
  radiusM: number | null;
  minAccuracyM: number | null;
  requiresIp: boolean | null;
  allowedSsids: string[];
  allowedBssids: string[];
  allowedCidrs: string[];
};

const resolveOffice = (
  office: OfficeConfig,
  config?: ConfigResponse | null
): ResolvedConfigOffice => {
  const globalWifi = config?.wifi;
  const globalAttendance = config?.attendance;

  return {
    id: toNumber(office.id),
    name: office.name ?? '',
    lat: toNumber(office.location?.lat ?? office.lat),
    lng: toNumber(office.location?.lng ?? office.lng),
    radiusM: toNumber(
      office.overrides?.attendance?.radius_m ??
        office.radius_m ??
        globalAttendance?.radius_m
    ),
    minAccuracyM: toNumber(
      office.overrides?.attendance?.min_accuracy_m ??
        office.min_accuracy_m ??
        globalAttendance?.min_accuracy_m
    ),
    requiresIp:
      typeof office.overrides?.attendance?.requires_ip === 'boolean'
        ? office.overrides.attendance.requires_ip
        : typeof globalAttendance?.requires_ip === 'boolean'
        ? globalAttendance.requires_ip
        : null,
    allowedSsids: uniqueStrings([
      ...coerceStringList(office.overrides?.wifi?.allowed_ssids),
      ...coerceStringList(office.allowed_ssids),
      ...coerceStringList(office.wifi_ssids),
      ...coerceStringList(office.wifi_ssid),
      ...coerceStringList(globalWifi?.allowed_ssids),
      ...coerceStringList(globalWifi?.ssids),
    ]),
    allowedBssids: uniqueStrings([
      ...coerceStringList(office.overrides?.wifi?.allowed_bssids),
      ...coerceStringList(office.allowed_bssids),
      ...coerceStringList(office.wifi_bssids),
      ...coerceStringList(office.wifi_bssid),
      ...coerceStringList(globalWifi?.allowed_bssids),
      ...coerceStringList(globalWifi?.bssids),
    ]),
    allowedCidrs: uniqueStrings([
      ...coerceStringList(office.ip?.allowed_cidrs),
      ...coerceStringList(office.allowed_ip_cidrs),
    ]),
  };
};

export const getResolvedConfigOffices = (
  config?: ConfigResponse | null
): ResolvedConfigOffice[] => {
  if (!config) {
    return [];
  }

  if (Array.isArray(config.offices) && config.offices.length > 0) {
    return config.offices.map((office) => resolveOffice(office, config));
  }

  if (config.office) {
    return [resolveOffice(config.office, config)];
  }

  return [];
};

export const getConfigWifiAllowlist = (config?: ConfigResponse | null) => {
  const resolvedOffices = getResolvedConfigOffices(config);
  return {
    allowedSsids: uniqueStrings(
      resolvedOffices.flatMap((office) => office.allowedSsids)
    ),
    allowedBssids: uniqueStrings(
      resolvedOffices.flatMap((office) => office.allowedBssids)
    ),
  };
};

export const getConfigRadiusMeters = (
  config?: ConfigResponse | null
): number | null => {
  const resolvedOffices = getResolvedConfigOffices(config);
  const firstRadius = resolvedOffices.find((office) => office.radiusM != null);
  return firstRadius?.radiusM ?? null;
};
