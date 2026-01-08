# HR Management System (React Native)

Production-ready MVP for an HR Management System built with bare React Native + TypeScript. Includes auth, attendance validation, leave requests, and performance updates.

## Features
- Auth flow with secure token storage + refresh handling
- Home dashboard with module shortcuts
- Attendance validation (GPS + office proof)
- Leave applications with validation and status chips
- Performance cycle submissions
- TanStack Query for server state + Zustand for auth

## Tech Stack
- React Native (bare) + TypeScript
- NativeWind (Tailwind for RN)
- React Navigation (stack + tabs)
- TanStack Query, Zustand
- React Hook Form + Zod
- Axios with refresh interceptor

## Getting Started
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. If icons are missing, link icon fonts (one-time):
   ```bash
   npx react-native-asset
   ```
3. Create your env file:
   ```bash
   cp .env.example .env
   ```
4. Start Metro:
   ```bash
   pnpm start
   ```
5. Run Android:
   ```bash
   pnpm android
   ```
6. Run iOS (macOS only):
   ```bash
   cd ios && pod install
   cd ..
   pnpm ios
   ```

## Environment Variables
These are loaded using `react-native-config` and validated in `src/config/env.ts`.

- `API_BASE_URL` - Base URL for backend API
- `OFFICE_LAT` - Office latitude
- `OFFICE_LNG` - Office longitude
- `OFFICE_RADIUS_M` - Geofence radius in meters

## Build Instructions
### Android APK
```bash
cd android
./gradlew assembleRelease
```
APK output: `android/app/build/outputs/apk/release/app-release.apk`

### iOS IPA
Open `ios/HrManagementSystem.xcworkspace` in Xcode and archive, or use:
```bash
cd ios
xcodebuild -workspace HrManagementSystem.xcworkspace -scheme HrManagementSystem -configuration Release
```

## Scripts
- `pnpm start` - Metro bundler
- `pnpm android` - Run on Android
- `pnpm ios` - Run on iOS
- `pnpm lint` - Lint the project
- `pnpm typecheck` - TypeScript checks

## Notes
- Attendance validation uses GPS + `/attendance/office-proof` backend verification.
- Leave attachments accept a file URI input and send multipart requests when provided.
