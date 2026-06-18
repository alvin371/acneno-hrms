declare module 'react-native-config' {
  export interface NativeConfig {
    API_BASE_URL: string;
    NOMINATIM_BASE_URL: string;
    NOMINATIM_CONTACT_EMAIL: string;
    OFFICE_LAT: string;
    OFFICE_LNG: string;
    OFFICE_RADIUS_M: string;
    OFFICE_WIFI_SSID: string;
    OFFICE_WIFI_BSSID: string;
  }

  const Config: NativeConfig;
  export default Config;
}
