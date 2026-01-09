================================================================================
ACNENO HRMS - PRODUCTION KEYSTORE INFORMATION
================================================================================

This document contains important information about the production keystore
used to sign the Acneno HRMS Android application for internal distribution.

================================================================================
KEYSTORE DETAILS
================================================================================

File Name:       acneno-hrms-release.keystore
Location:        android/acneno-hrms-release.keystore
Type:            PKCS12
Algorithm:       RSA 2048-bit
Validity:        10,000 days (approximately 27 years)
Created:         January 8, 2026

Certificate Details:
  CN (Common Name):     Acneno HRMS
  OU (Organizational):  Development
  O (Organization):     Acneno
  L (Locality):         Unknown
  ST (State):           Unknown
  C (Country):          ID

Key Alias:       acneno-hrms

================================================================================
CREDENTIALS
================================================================================

The keystore credentials are stored in:
  android/keystore.properties

Store Password:  AcnenoHRMS2026!Secure
Key Password:    AcnenoHRMS2026!Secure
Key Alias:       acneno-hrms

IMPORTANT: Keep these credentials secure and backed up safely!

================================================================================
SECURITY NOTES
================================================================================

1. The keystore file (.keystore) and keystore.properties are excluded from
   git via .gitignore to prevent accidental commits.

2. BACKUP: Make sure to backup the following files securely:
   - android/acneno-hrms-release.keystore
   - android/keystore.properties

   Store them in a secure location (password manager, encrypted drive, etc.)
   You CANNOT recover the keystore if lost!

3. If you lose the keystore, you will NOT be able to update the app on
   devices that already have it installed. Users will need to uninstall
   and reinstall.

================================================================================
BUILDING RELEASE APK
================================================================================

To build a signed release APK:

1. Navigate to the android directory:
   cd android

2. Run the gradle build command:
   ./gradlew assembleRelease    (Mac/Linux)
   gradlew.bat assembleRelease  (Windows)

3. The signed APK will be generated at:
   android/app/build/outputs/apk/release/app-release.apk

================================================================================
DISTRIBUTING THE APK
================================================================================

The app-release.apk can be distributed for internal use by:

1. Email or file sharing
2. Internal file server
3. MDM (Mobile Device Management) solutions
4. Direct download from internal website

Users will need to:
1. Enable "Install from Unknown Sources" on their Android device
2. Download and install the APK file

================================================================================
APK VERIFICATION
================================================================================

To verify the APK signature, use apksigner:

apksigner verify --print-certs app-release.apk

Expected output should show:
  CN=Acneno HRMS, OU=Development, O=Acneno

================================================================================
GOOGLE PLAY STORE (Future)
================================================================================

This keystore is suitable for Google Play Store distribution if needed in
the future. The same keystore must be used for all future updates.

Note: Google Play App Signing is recommended for Play Store distribution.
You can opt-in to let Google manage your app signing key while keeping
this keystore as your upload key.

================================================================================
