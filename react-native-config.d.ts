declare module 'react-native-config' {
  export interface NativeConfig {
    API_BASE_URL: string;
    OFFICE_LAT: string;
    OFFICE_LNG: string;
    OFFICE_RADIUS_M: string;
  }

  const Config: NativeConfig;
  export default Config;
}
