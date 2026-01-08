# HR Management System (React Native)

Production-ready MVP for an HR Management System built with bare React Native + TypeScript. Includes auth, attendance validation, leave requests, and performance updates.

## AI-Readable Overview
This section is intentionally structured so an AI can quickly understand the full scope.

### Product Goal
Mobile HR app for employees to authenticate, check in with location proof, request leave, and submit performance updates.

### Core Modules
- Authentication: login, secure token storage, automatic refresh on expiry
- Biometrics: PIN, face verification, fingerprint
- Home dashboard: quick access to modules
- Attendance: GPS-based validation plus office-proof upload/verification
- Leave: request form with validation, status chips, optional file attachment
- Performance: cycle submission flow

### Key Flows (Happy Path)
- Sign in -> receive tokens -> store securely -> route to dashboard
- Attendance -> capture GPS -> validate vs office geofence -> upload office proof
- Leave -> fill request -> validate dates/fields -> submit -> show status
- Performance -> fill cycle update -> submit -> show confirmation

### Data & Validation Rules
- Forms use React Hook Form + Zod for client-side validation
- Attendance requires GPS coords and office radius validation
- Leave attachments are optional and sent as multipart when provided

### State Management & Networking
- Server state: TanStack Query
- Auth/session state: Zustand
- HTTP: Axios with refresh interceptor

### App Structure (high level)
- `src/features`: feature modules (auth, attendance, leave, performance)
- `src/navigation`: stack/tab navigation setup
- `src/api`: API clients and request helpers
- `src/store`: auth/session state
- `src/config`: env validation and config

## Features
- Auth flow with secure token storage + refresh handling
- PIN, face verification, and fingerprint support
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
