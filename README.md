# Acneno HRMS - HR Management System

Production-ready mobile HR Management System built with React Native and TypeScript for employee attendance tracking, leave management, and performance evaluation.

## Overview

Acneno HRMS is a comprehensive mobile application designed for HR operations, enabling employees to:
- Securely authenticate with JWT tokens, PIN, and biometric unlock
- Check in/out with GPS and WiFi validation
- Apply for leave with calendar-based date selection
- Submit performance evaluations against KPI templates
- View attendance history and monthly reports

## Features

### Authentication & Security
- **Username/password login** with JWT token management
- **Automatic token refresh** on expiry
- **Secure token storage** using React Native Keychain (not AsyncStorage)
- **PIN setup** (6-digit) for additional security layer
- **Biometric unlock** (Face ID / Touch ID / Fingerprint)
- **Daily unlock requirement** with PIN or biometrics

### Attendance Management
- **GPS-based validation** with real-time distance calculation
- **WiFi network verification** (SSID/BSSID matching)
- **Dual validation system**: Location + WiFi proof
- **Check-in / Check-out** with office proximity detection
- **Weekly attendance history** display
- **Monthly reports** with detailed daily breakdown
- **CSV export** capability for monthly attendance data
- **Permission handling** for Location and WiFi access (Android 33+)

### Leave Management
- **Interactive calendar picker** with date range selection
- **Holiday detection** and automatic blocking
- **Leave type selection** (Annual, Sick, Personal, etc.)
- **Date validation** (no past dates, no holidays, start ≤ end)
- **File attachment support** (PDF, images, Word documents)
- **Leave quota tracking** with remaining days display
- **Status monitoring** (Pending, Approved, Rejected)
- **Multipart form submission** for attachments

### Performance Management
- **KPI template-based submissions**
- **Actual value vs target tracking**
- **Automatic score calculation** with weighted averages
- **Performance submission history**
- **Department-specific templates**

### User Profile
- **View profile information**
- **Edit profile** (name, email, phone)
- **Logout functionality**

## Tech Stack

### Core
- **React Native** 0.83.1 (bare, not Expo)
- **TypeScript** 5.9.3
- **React** 19.2.3

### UI & Styling
- **NativeWind** 4.2.1 (Tailwind CSS for React Native)
- **React Native Vector Icons** 10.3.0 (Ionicons)
- **React Native Calendars** 1.1310.0

### Navigation
- **React Navigation** 7.1.26
  - Native Stack Navigator
  - Bottom Tabs Navigator

### State Management
- **TanStack Query** 5.90.16 (server state, caching)
- **Zustand** 5.0.9 (auth state management)

### Forms & Validation
- **React Hook Form** 7.70.0
- **Zod** 4.3.5 (schema validation)
- **@hookform/resolvers** 5.2.2

### Networking
- **Axios** 1.13.2 (HTTP client with interceptors)
- **React Native Config** 1.6.1 (environment variables)

### Native Features
- **React Native Keychain** 10.0.0 (secure storage)
- **React Native Permissions** 5.4.4
- **React Native Geolocation Service** 5.3.1 (GPS)
- **React Native Push Notification** 8.1.1
- **@react-native-community/netinfo** 11.4.1
- **@react-native-documents/picker** 12.0.0

## Project Structure

```
acneno-hrms/
├── src/
│   ├── api/                      # API clients and types
│   │   ├── client.ts             # Main Axios instance with interceptors
│   │   ├── authClient.ts         # Unauthenticated Axios instance
│   │   ├── types.ts              # API request/response types
│   │   └── error.ts              # Error handling utilities
│   ├── config/                   # Configuration
│   │   ├── env.ts                # Environment variable validation (Zod)
│   │   └── tokens.ts             # Design tokens (spacing, radius)
│   ├── features/                 # Feature modules
│   │   ├── auth/                 # Authentication & Profile
│   │   │   ├── api.ts            # Auth API calls
│   │   │   └── screens/          # Login, PIN, Profile screens
│   │   ├── attendance/           # Attendance tracking
│   │   │   ├── api.ts            # Attendance API calls
│   │   │   ├── screens/          # Attendance screens
│   │   │   └── utils.ts          # Date/CSV utilities
│   │   ├── leave/                # Leave management
│   │   │   ├── api.ts            # Leave API calls
│   │   │   └── screens/          # Leave list/create screens
│   │   ├── performance/          # Performance management
│   │   │   ├── api.ts            # Performance API calls
│   │   │   └── screens/          # Performance screens
│   │   ├── home/                 # Dashboard
│   │   │   └── screens/          # Home screen
│   │   ├── config/               # Config API
│   │   │   └── api.ts            # Office/WiFi config
│   │   └── profile/              # Profile API
│   │       └── api.ts            # Profile updates
│   ├── navigation/               # Navigation configuration
│   │   ├── RootNavigator.tsx     # Root navigation logic
│   │   ├── MainTabs.tsx          # Bottom tab navigator
│   │   ├── types.ts              # Navigation type definitions
│   │   └── stacks/               # Feature-specific stacks
│   │       ├── AttendanceStack.tsx
│   │       ├── LeaveStack.tsx
│   │       ├── PerformanceStack.tsx
│   │       └── ProfileStack.tsx
│   ├── store/                    # State management
│   │   └── authStore.ts          # Zustand auth store
│   ├── ui/                       # Reusable UI components
│   │   ├── Screen.tsx            # Screen wrapper with SafeArea
│   │   ├── Card.tsx              # Card container
│   │   ├── Button.tsx            # Button component
│   │   ├── FormInput.tsx         # React Hook Form input
│   │   ├── FormSelect.tsx        # React Hook Form select
│   │   ├── PinCodeInput.tsx      # PIN entry component
│   │   └── StatusChip.tsx        # Status badge
│   ├── lib/                      # Libraries
│   │   ├── queryClient.ts        # TanStack Query configuration
│   │   └── notifications.ts      # Push notification setup
│   ├── utils/                    # Utilities
│   │   ├── distance.ts           # Haversine GPS distance calculation
│   │   ├── toast.ts              # Toast notifications
│   │   └── cn.ts                 # Class name merging (Tailwind)
│   ├── App.tsx                   # Root component
│   └── [other files]
├── android/                      # Android native project
│   ├── app/
│   │   ├── build.gradle          # App build configuration
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       └── java/             # Native Java/Kotlin code
│   ├── build.gradle              # Root build configuration
│   ├── gradle.properties         # Gradle settings
│   ├── settings.gradle           # Gradle project settings
│   ├── keystore.properties       # Keystore credentials (excluded from git)
│   ├── acneno-hrms-release.keystore  # Production keystore (excluded from git)
│   └── KEYSTORE-README.txt       # Keystore documentation
├── ios/                          # iOS native project
│   ├── HrManagementSystem/       # Main app target
│   │   ├── AppDelegate.swift     # App delegate
│   │   ├── Info.plist            # App configuration
│   │   ├── PrivacyInfo.xcprivacy # Privacy manifest
│   │   └── Images.xcassets/      # App icons
│   ├── HrManagementSystem.xcodeproj/  # Xcode project
│   ├── Podfile                   # CocoaPods dependencies
│   └── .xcode.env                # Node environment
├── .env                          # Environment variables (excluded from git)
├── .env.example                  # Environment template
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── eslint.config.mjs             # ESLint v9 configuration
├── tailwind.config.js            # Tailwind CSS configuration
└── README.md                     # This file
```

## Getting Started

### Prerequisites

- **Node.js** >= 20 ([Download](https://nodejs.org/))
- **pnpm** (recommended) or npm
  ```bash
  npm install -g pnpm
  ```

**For Android Development:**
- **Java Development Kit (JDK)** 17 or higher
- **Android Studio** with Android SDK
  - Android SDK Platform 36 (Android 15)
  - Android Build Tools 36.0.0
  - Android SDK Command-line Tools

**For iOS Development (macOS only):**
- **Xcode** 15.0 or higher
- **CocoaPods**
  ```bash
  sudo gem install cocoapods
  ```
- **Apple Developer Account** (for device testing and distribution)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd acneno-hrms
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and configure your API base URL:
   ```
   API_BASE_URL=https://your-api-server.com/api/hrms
   ```

4. **Link icon fonts** (one-time setup)
   ```bash
   npx react-native-asset
   ```

5. **For iOS: Install pods**
   ```bash
   cd ios && pod install && cd ..
   ```

### Running Development Builds

#### Android

```bash
# Terminal 1: Start Metro bundler
pnpm start

# Terminal 2: Run on Android device/emulator
pnpm android
```

**Note:** Make sure you have either:
- An Android emulator running (via Android Studio), or
- A physical Android device connected via USB with USB debugging enabled

#### iOS (macOS only)

```bash
# Terminal 1: Start Metro bundler
pnpm start

# Terminal 2: Run on iOS simulator
pnpm ios
```

## Environment Variables

Configure these in your `.env` file (copy from `.env.example`):

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `API_BASE_URL` | ✅ Yes | Backend API base URL | `https://api.example.com/api/hrms` |
| `OFFICE_LAT` | ❌ No | Office latitude (fallback) | `-6.2000000` |
| `OFFICE_LNG` | ❌ No | Office longitude (fallback) | `106.8166667` |
| `OFFICE_RADIUS_M` | ❌ No | Geofence radius in meters | `150` |
| `OFFICE_WIFI_SSID` | ❌ No | Comma-separated WiFi SSIDs | `OfficeWifi-1,OfficeWifi-2` |
| `OFFICE_WIFI_BSSID` | ❌ No | Comma-separated WiFi BSSIDs | `aa:bb:cc:dd:ee:ff,11:22:33:44:55:66` |

**Notes:**
- The app fetches configuration from `/config` API endpoint by default
- Local environment variables serve as fallbacks when the API is unavailable
- All environment variables are validated using Zod schema in `src/config/env.ts`

## Production Builds

### Android APK Build

#### Prerequisites

1. **Keystore file configured**
   - Location: `android/acneno-hrms-release.keystore`
   - See `android/KEYSTORE-README.txt` for details

2. **Keystore credentials file**
   - Location: `android/keystore.properties`
   - Contains store password, key password, key alias, and keystore path
   - **This file is excluded from git for security**

3. **JDK and Android SDK installed**

#### Build Steps

1. **Navigate to android directory**
   ```bash
   cd android
   ```

2. **Clean previous builds** (optional but recommended)
   ```bash
   # Windows
   gradlew.bat clean

   # Mac/Linux
   ./gradlew clean
   ```

3. **Build release APK**
   ```bash
   # Windows
   gradlew.bat assembleRelease

   # Mac/Linux
   ./gradlew assembleRelease
   ```

4. **Locate the APK**
   ```
   Output: android/app/build/outputs/apk/release/app-release.apk
   Size: ~50-80MB (estimated)
   ```

#### APK Verification

Verify the APK signature:
```bash
# Using apksigner (from Android SDK build-tools)
apksigner verify --print-certs app-release.apk

# Expected output should show:
# CN=Acneno HRMS, OU=Development, O=Acneno, C=ID
```

Check APK contents and size:
```bash
# Using bundletool or aapt
aapt dump badging app-release.apk
```

#### Distribution Methods

**Internal Distribution (No Google Play Store):**

1. **Direct Installation**
   - Transfer APK to device via USB, email, or file sharing
   - Users must enable "Install from Unknown Sources" in device settings
   - Tap APK file to install

2. **Internal File Server**
   - Host APK on company intranet/file server
   - Employees download via internal network

3. **MDM Solutions** (Recommended for enterprise)
   - Use Mobile Device Management systems like:
     - Microsoft Intune
     - VMware Workspace ONE
     - Google Workspace (managed Play)
   - Push app updates automatically

4. **Cloud Storage**
   - Upload to Google Drive, Dropbox, OneDrive
   - Share link with employees (set appropriate permissions)

**Future: Google Play Store**
- The current keystore is suitable for Play Store distribution
- Google Play App Signing recommended (upload key + app signing key model)
- Requires Google Play Console account ($25 one-time fee)

### iOS IPA Build

#### Prerequisites

1. **macOS with Xcode 15+**
2. **Apple Developer Account**
   - Individual or Organization account ($99/year)
   - Required for device testing and distribution
3. **CocoaPods installed**
4. **Provisioning Profiles and Certificates**
   - Distribution certificate
   - Provisioning profile (Ad Hoc, Enterprise, or App Store)

#### Build Steps

##### 1. Install Pod Dependencies

```bash
cd ios
pod install
cd ..
```

##### 2. Open Workspace in Xcode

```bash
open ios/HrManagementSystem.xcworkspace
```

**Important:** Open `.xcworkspace`, NOT `.xcodeproj`

##### 3. Configure Signing

1. Select **HrManagementSystem** project in left sidebar
2. Select **HrManagementSystem** target
3. Go to **Signing & Capabilities** tab
4. Configure signing:

   **Option A: Automatic Signing** (Recommended)
   - Check "Automatically manage signing"
   - Select your Team from dropdown
   - Xcode will handle certificates and provisioning profiles

   **Option B: Manual Signing**
   - Uncheck "Automatically manage signing"
   - Select Provisioning Profile manually
   - Select Signing Certificate

5. **Set Bundle Identifier** (if not set):
   ```
   com.acneno.hrms
   ```
   Or use your company's bundle ID pattern

##### 4. Build Archive

**Via Xcode GUI:**
1. Select **Generic iOS Device** or **Any iOS Device (arm64)** from device dropdown
2. Go to **Product** → **Archive**
3. Wait for archive to complete (5-15 minutes)

**Via Command Line:**
```bash
cd ios
xcodebuild -workspace HrManagementSystem.xcworkspace \
           -scheme HrManagementSystem \
           -configuration Release \
           -archivePath build/HrManagementSystem.xcarchive \
           clean archive
```

##### 5. Export IPA

1. When archive completes, **Organizer** window opens automatically
2. Select your archive
3. Click **Distribute App**
4. Choose distribution method:

   - **Ad Hoc** (recommended for internal testing)
     - Up to 100 devices
     - Devices must be registered in Apple Developer portal (UDID required)
     - No review process
     - 7-day installation window

   - **Enterprise** (requires Enterprise Developer Program - $299/year)
     - Unlimited devices
     - Internal company distribution only
     - No device registration needed
     - No App Store submission

   - **App Store** (public distribution)
     - Unlimited users
     - Apple review process (1-3 days)
     - Hosted on App Store
     - Version updates managed via App Store Connect

   - **Development** (testing only)
     - For developers only
     - Xcode installation required

5. Follow the wizard to complete export
6. Save IPA file to desired location

#### Output

- **IPA file**: Exported via Xcode Organizer
- **Size**: ~60-100MB (estimated)
- **Location**: Choose during export process

#### Distribution Methods

##### TestFlight (Recommended for Internal Testing)

1. **Upload to App Store Connect**:
   - Select "App Store" distribution in Xcode
   - Upload to App Store Connect
   - Does NOT require App Store approval for internal testing

2. **Add Internal Testers**:
   - Go to App Store Connect → TestFlight
   - Add testers (up to 100 internal, 10,000 external)
   - Testers receive email invitation
   - Install via TestFlight app

3. **Benefits**:
   - Easy installation via TestFlight app
   - Automatic update notifications
   - Crash reports and feedback
   - No UDID registration needed for internal testers
   - 90-day test period

##### Ad Hoc Distribution

1. **Register Devices**:
   - Collect device UDIDs
   - Register in Apple Developer portal
   - Update provisioning profile

2. **Distribute IPA**:
   - Email or cloud storage
   - Install via Xcode, Apple Configurator, or OTA (over-the-air)

##### Enterprise Distribution

1. **Build with Enterprise Certificate**
2. **Host IPA and manifest.plist** on HTTPS server
3. **Distribute download link** to employees
4. **Users install** via Settings → General → VPN & Device Management

## API Integration

The app communicates with a backend API for all data operations.

### Base URL

Configured via `API_BASE_URL` environment variable.

### Authentication

- All protected endpoints require `Authorization: Bearer <accessToken>` header
- Access tokens issued by `/auth/login` endpoint
- Automatic token refresh handled by Axios interceptor
- Refresh tokens stored securely in React Native Keychain

### Endpoints

For complete API documentation, see **[HRMS_API.md](./HRMS_API.md)**

Key endpoint categories:
- **Authentication**: `/auth/login`, `/auth/refresh`
- **Profile**: `/profile`
- **PIN Management**: `/pin/setup`, `/pin/verify`, `/pin/reset`
- **Configuration**: `/config` (office location, WiFi settings)
- **Attendance**: `/attendance/check-in`, `/attendance/check-out`, `/attendance/history`, `/attendance/report`
- **Leave**: `/leave`, `/leave/quota`, `/holidays`
- **Performance**: `/performance` (templates, submissions)

### Error Handling

- HTTP status codes mapped to user-friendly messages
- Server errors extracted from response body
- Network connectivity detection
- Automatic retry with exponential backoff (TanStack Query)

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **start** | `pnpm start` | Start Metro bundler |
| **android** | `pnpm android` | Run on Android device/emulator |
| **ios** | `pnpm ios` | Run on iOS simulator (macOS only) |
| **lint** | `pnpm lint` | Run ESLint on codebase |
| **typecheck** | `pnpm typecheck` | Run TypeScript type checking |
| **test** | `pnpm test` | Run Jest tests |

## Troubleshooting

### Android Build Issues

**Issue: `Execution failed for task ':app:validateSigningRelease'`**
- **Cause**: Missing or invalid `keystore.properties` file
- **Solution**:
  1. Ensure `android/keystore.properties` exists
  2. Verify credentials match the keystore
  3. Check keystore file path is correct
  4. See `android/KEYSTORE-README.txt`

**Issue: `Unable to load script. Make sure you're running Metro`**
- **Cause**: Metro bundler not running or not accessible
- **Solution**:
  ```bash
  # Clear Metro cache
  pnpm start --reset-cache

  # Or clear all caches
  cd android && ./gradlew clean && cd ..
  rm -rf node_modules
  pnpm install
  ```

**Issue: `Could not resolve all dependencies`**
- **Cause**: Gradle dependency resolution failure
- **Solution**:
  ```bash
  cd android
  ./gradlew clean
  ./gradlew --refresh-dependencies
  ```

**Issue: `Task 'installDebug' not found`**
- **Cause**: Gradle sync issue or wrong directory
- **Solution**:
  1. Open `android/` folder in Android Studio
  2. Let Gradle sync complete
  3. Try again from command line

### iOS Build Issues

**Issue: `No such module 'React'`**
- **Cause**: Pods not installed or out of sync
- **Solution**:
  ```bash
  cd ios
  pod deintegrate
  pod install
  cd ..
  ```

**Issue: `Code signing error`**
- **Cause**: Missing or invalid provisioning profile/certificate
- **Solution**:
  1. Open Xcode
  2. Go to Signing & Capabilities
  3. Select your team
  4. Let Xcode download/create profiles automatically
  5. Or manually select valid provisioning profile

**Issue: `Command PhaseScriptExecution failed`**
- **Cause**: Node binary not found or environment issue
- **Solution**:
  1. Edit `ios/.xcode.env.local`:
     ```bash
     export NODE_BINARY=/path/to/node
     ```
  2. Find node path: `which node`

**Issue: `Library not found -lPods-HrManagementSystem`**
- **Cause**: Opening `.xcodeproj` instead of `.xcworkspace`
- **Solution**: Always open `HrManagementSystem.xcworkspace`

### Runtime Issues

**Issue: Location permission denied**
- **Cause**: User denied location permission
- **Solution**:
  - App shows "Open Settings" button
  - User must manually enable in Settings → Apps → HrManagementSystem → Permissions

**Issue: WiFi validation fails even when connected**
- **Cause**:
  - Android 33+: `NEARBY_WIFI_DEVICES` permission not granted
  - WiFi BSSID/SSID not in configured list
- **Solution**:
  - Grant WiFi permission
  - Verify WiFi configuration via `/config` API
  - Check actual WiFi BSSID matches expected (can change per access point)

**Issue: Can't check in/out despite being at office**
- **Cause**:
  - GPS accuracy too low
  - WiFi validation failing
  - Office configuration incorrect
- **Solution**:
  - Wait for better GPS signal (< 50m accuracy)
  - Connect to office WiFi
  - Verify office coordinates via `/config` API
  - Check backend validation logs

**Issue: API calls failing with 401**
- **Cause**: Token expired and refresh failed
- **Solution**:
  - App should automatically refresh token
  - If persistent, clear app data and log in again
  - Check backend refresh token endpoint

**Issue: App crashes on launch**
- **Cause**:
  - Missing environment variables
  - Invalid `.env` configuration
  - Corrupted keychain data
- **Solution**:
  ```bash
  # Clear app data (Android)
  adb shell pm clear com.hrmanagementsystem

  # iOS: Delete app and reinstall
  ```

## Security Considerations

### Data Storage
- **Tokens**: Stored in React Native Keychain (iOS Keychain / Android Keystore)
- **PIN**: Stored encrypted in native keychain
- **Biometric secret**: Protected by device biometric security
- **Never**: AsyncStorage is NOT used for sensitive data

### Network Security
- **HTTPS enforced** for all API calls
- **Certificate pinning**: Not currently implemented (consider for production)
- **Cleartext traffic disabled** in Android manifest

### Code Security
- **Keystore credentials excluded** from git
- **Environment files excluded** from git
- **.gitignore properly configured** for sensitive files
- **ProGuard/R8 obfuscation**: Currently disabled (can enable for additional security)

### App Security
- **Biometric authentication** for additional unlock layer
- **PIN-based unlock** required daily
- **Session expiry** handled automatically
- **Secure token refresh** without exposing credentials

## Dependencies

### Major Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react-native | 0.83.1 | Framework |
| react | 19.2.3 | UI library |
| typescript | 5.9.3 | Type safety |
| @react-navigation/native | 7.1.26 | Navigation |
| @tanstack/react-query | 5.90.16 | Server state |
| zustand | 5.0.9 | Client state |
| axios | 1.13.2 | HTTP client |
| react-hook-form | 7.70.0 | Form handling |
| zod | 4.3.5 | Validation |
| nativewind | 4.2.1 | Styling (Tailwind) |
| react-native-keychain | 10.0.0 | Secure storage |

For complete list, see [package.json](./package.json)

## Contributing

### Code Style

- **ESLint**: Run `pnpm lint` before committing
- **TypeScript**: Run `pnpm typecheck` before committing
- **Prettier**: Configured via `.prettierrc`
- **Commit messages**: Use conventional commits format

### Pull Request Process

1. Create feature branch from `main`
2. Make changes
3. Run tests: `pnpm test`
4. Run type checking: `pnpm typecheck`
5. Run linting: `pnpm lint`
6. Commit with clear message
7. Push and create PR
8. Wait for review

## License

[Specify license here - MIT, Apache 2.0, Proprietary, etc.]

## Support

For issues, questions, or feature requests:

- **Email**: [support email]
- **Issue Tracker**: [GitHub Issues link]
- **Documentation**: See `HRMS_API.md` and `android/KEYSTORE-README.txt`

---

**Version**: 1.0.0
**Last Updated**: January 2026
**Minimum iOS**: 15.1
**Minimum Android**: 7.0 (API 24)
**Target Android**: 15 (API 36)
