import { z } from 'zod';
import Config from 'react-native-config';

const envSchema = z.object({
  API_BASE_URL: z.string().url(),
  OFFICE_LAT: z.coerce.number(),
  OFFICE_LNG: z.coerce.number(),
  OFFICE_RADIUS_M: z.coerce.number().positive(),
  OFFICE_WIFI_SSID: z.string().optional().default(''),
  OFFICE_WIFI_BSSID: z.string().optional().default(''),
});

const raw = {
  API_BASE_URL: Config.API_BASE_URL,
  OFFICE_LAT: Config.OFFICE_LAT,
  OFFICE_LNG: Config.OFFICE_LNG,
  OFFICE_RADIUS_M: Config.OFFICE_RADIUS_M,
  OFFICE_WIFI_SSID: Config.OFFICE_WIFI_SSID,
  OFFICE_WIFI_BSSID: Config.OFFICE_WIFI_BSSID,
};

const parsed = envSchema.safeParse(raw);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => issue.message).join(', ');
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const env = parsed.data;
