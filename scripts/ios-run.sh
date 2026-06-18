#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

pnpm check-node
pnpm check:no-shadow-js

use_booted_simulator=0
pass_through_args=()

for arg in "$@"; do
  case "$arg" in
    --booted)
      use_booted_simulator=1
      ;;
    *)
      pass_through_args+=("$arg")
      ;;
  esac
done

if [[ "$use_booted_simulator" -eq 1 ]]; then
  booted_udid="$(
    node -e '
      const {execFileSync} = require("node:child_process");
      const output = execFileSync("xcrun", ["simctl", "list", "devices", "booted", "--json"], {encoding: "utf8"});
      const data = JSON.parse(output);
      const devices = Object.values(data.devices ?? {})
        .flat()
        .filter((device) => device.isAvailable);

      if (devices.length === 0) {
        process.exit(1);
      }

      process.stdout.write(devices[0].udid);
    '
  )" || {
    echo "No booted iOS simulator found. Boot one in Simulator.app, then rerun with pnpm ios --booted."
    exit 1
  }

  if [[ "${#pass_through_args[@]}" -gt 0 ]]; then
    exec pnpm exec react-native run-ios --no-packager --udid "$booted_udid" "${pass_through_args[@]}"
  fi

  exec pnpm exec react-native run-ios --no-packager --udid "$booted_udid"
fi

if [[ "${#pass_through_args[@]}" -gt 0 ]]; then
  exec pnpm exec react-native run-ios --no-packager "${pass_through_args[@]}"
fi

exec pnpm exec react-native run-ios --no-packager
