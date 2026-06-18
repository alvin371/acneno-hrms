import axios from 'axios';
import { env } from '@/config/env';

const NOMINATIM_TIMEOUT_MS = 10000;
const NOMINATIM_USER_AGENT = 'AcnenoLifeHRMS/1.1.0 (mobile app)';

type ReverseGeocodeParams = {
  latitude: number;
  longitude: number;
  locale: string;
  signal?: AbortSignal;
};

type GeocodeJsonFeature = {
  properties?: {
    geocoding?: {
      city?: string;
      town?: string;
      village?: string;
      county?: string;
      state?: string;
      country?: string;
      country_code?: string;
    };
  };
};

type GeocodeJsonResponse = {
  features?: GeocodeJsonFeature[];
};

export type ReverseGeocodeCityResult = {
  city: string;
  displayLabel: string;
};

const nominatimClient = axios.create({
  baseURL: env.NOMINATIM_BASE_URL,
  timeout: NOMINATIM_TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
    'User-Agent': NOMINATIM_USER_AGENT,
  },
});

const getSettlementName = (feature?: GeocodeJsonFeature) => {
  const geocoding = feature?.properties?.geocoding;
  return (
    geocoding?.city ??
    geocoding?.town ??
    geocoding?.village ??
    geocoding?.county ??
    geocoding?.state ??
    geocoding?.country ??
    null
  );
};

const getCountrySuffix = (feature?: GeocodeJsonFeature) => {
  const geocoding = feature?.properties?.geocoding;
  if (geocoding?.country_code) {
    return geocoding.country_code.toUpperCase();
  }
  return geocoding?.country ?? null;
};

export const reverseGeocodeCity = async ({
  latitude,
  longitude,
  locale,
  signal,
}: ReverseGeocodeParams): Promise<ReverseGeocodeCityResult> => {
  const response = await nominatimClient.get<GeocodeJsonResponse>('/reverse', {
    params: {
      format: 'geocodejson',
      lat: latitude,
      lon: longitude,
      zoom: 10,
      layer: 'address',
      ...(env.NOMINATIM_CONTACT_EMAIL
        ? { email: env.NOMINATIM_CONTACT_EMAIL }
        : {}),
    },
    headers: {
      'Accept-Language': locale,
    },
    signal,
  });

  const feature = response.data.features?.[0];
  const city = getSettlementName(feature);

  if (!city) {
    throw new Error('City unavailable.');
  }

  const countrySuffix = getCountrySuffix(feature);

  return {
    city,
    displayLabel:
      countrySuffix && countrySuffix !== city
        ? `${city}, ${countrySuffix}`
        : city,
  };
};
