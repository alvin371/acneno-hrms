#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

pnpm check-node
pnpm check:no-shadow-js

# Remove cloud-sync conflict copies from generated Android build outputs.
# Files like "foo 2.xml" and "bar 3.png" break Android resource validation.
cleanup_android_conflict_files() {
  local removed_any=0
  while IFS= read -r -d '' file; do
    rm -f "$file"
    removed_any=1
  done < <(
    find android -type f \
      \( -path "*/build/*" -o -path "*/.cxx/*" \) \
      \( -name '* [0-9].*' -o -name '* [0-9][0-9].*' \) \
      -print0
  )

  if [[ "$removed_any" -eq 1 ]]; then
    echo "Removed Android build conflict-copy files."
  fi
}

cleanup_android_conflict_files

APP_ID="com.hrmanagementsystem"

has_online_device() {
  adb devices | awk 'NR > 1 && $2 == "device" { found = 1 } END { exit(found ? 0 : 1) }'
}

connected_device_abi() {
  adb shell getprop ro.product.cpu.abi 2>/dev/null | tr -d '\r'
}

retry_install_after_uninstall_if_needed() {
  local apk_path="$1"
  local install_log
  install_log="$(mktemp)"

  if adb install -r "$apk_path" 2>&1 | tee "$install_log"; then
    rm -f "$install_log"
    return 0
  fi

  if grep -qi "not enough space" "$install_log"; then
    echo "adb install hit low device storage; uninstalling existing $APP_ID and retrying..."
    adb uninstall "$APP_ID" >/dev/null 2>&1 || true
    adb install "$apk_path"
    rm -f "$install_log"
    return 0
  fi

  rm -f "$install_log"
  return 1
}

run_android_args=(--no-packager)

if has_online_device; then
  run_android_args+=(--active-arch-only)
fi

run_android_args+=("$@")

if pnpm exec react-native run-android "${run_android_args[@]}"; then
  exit 0
fi

echo "react-native run-android failed; retrying with Gradle assemble + adb install..."

if ! has_online_device; then
  echo "No online Android device/emulator found. Start one and run pnpm android again."
  exit 1
fi

DEVICE_ABI="$(connected_device_abi)"
GRADLE_ARGS=(app:assembleDebug)

if [[ -n "$DEVICE_ABI" ]]; then
  GRADLE_ARGS+=("-PreactNativeArchitectures=$DEVICE_ABI")
fi

(
  cd android
  ./gradlew "${GRADLE_ARGS[@]}"
)

retry_install_after_uninstall_if_needed android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.hrmanagementsystem/.MainActivity >/dev/null 2>&1 || true

echo "Installed debug APK with adb fallback."
