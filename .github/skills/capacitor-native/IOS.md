# iOS (Capacitor 8)

Reference for maintaining the iOS shell of this app on macOS. The `ios/` folder
already exists in this repo and uses **Swift Package Manager** (see
`ios/App/CapApp-SPM/Package.swift`).

## Requirements

- **macOS** with **Xcode 26.0+** (Capacitor 8 minimum), plus **Command Line Tools**:
  ```bash
  xcode-select --install      # once
  xcode-select -p             # verify: /Applications/Xcode.app/Contents/Developer
  ```
- **Dependency manager**: Capacitor 8 defaults to **SPM** (this project uses it — no
  Podfile needed). CocoaPods is optional; only needed if a plugin ships pods, via
  `npx cap add ios --packagemanager CocoaPods` (install with `brew install cocoapods`).
- Support floor: **iOS 15+**, `WKWebView`.

## Platform setup (already done here)

`ios/` is committed. If ever recreating it:

```bash
pnpm add -D @capacitor/ios
pnpm run build
npx cap add ios          # regenerates ./ios from capacitor.config.ts
npx cap open ios         # opens Xcode (App.xcworkspace)
```

## Permissions — usage descriptions

iOS has **no manifest**; instead every sensitive API needs a **usage description**
string in `ios/App/App/Info.plist`. The app already declares (keep these in sync
with what the code actually uses):

| Key                                     | For                                 |
| --------------------------------------- | ----------------------------------- |
| `NSCalendarsFullAccessUsageDescription` | Read/write device calendars         |
| `NSCalendarsUsageDescription`           | Legacy calendar access (pre-iOS 17) |
| `NSRemindersFullAccessUsageDescription` | Create reminders (iOS-only feature) |
| `NSRemindersUsageDescription`           | Legacy reminders access             |
| `NSContactsUsageDescription`            | Add guests to events                |
| `NSLocationWhenInUseUsageDescription`   | Sunrise/sunset during the Fast      |

> The calendar plugin follows Apple's **latest calendar access levels** (TN3152):
> prefer full/write-only access keys; keep the legacy `…UsageDescription` keys for
> older iOS. Missing a key = **instant crash** when the API is first called.

## Capabilities & signing

- **Capabilities** (push, background modes, etc.) are set in Xcode →
  _Signing & Capabilities_, NOT in `Info.plist`.
- Set a **development team** for on-device runs. Never commit signing certs,
  provisioning profiles, or `*.p12` keys.

## Build & run

```bash
pnpm run build && npx cap sync ios     # after every web change
npx cap run ios                        # pick simulator/device, or
npx cap open ios                       # then ▶ in Xcode
```

Wireless device debugging: pair the device in Finder and enable "Show this iPhone
when on Wi-Fi"; it then appears in `npx cap run ios --list`.

## iOS gotchas

- **Missing usage description string** → hard crash the moment the API is invoked.
  Add the key BEFORE shipping any new native permission.
- **Forgot `cap sync`** → the app runs stale `dist/`. Build then sync every time.
- **iPadOS 26 window controls overlap the UI** → add `UIDesignRequiresCompatibility
= YES` to `Info.plist` as a temporary fix.
- **SPM vs CocoaPods**: this project is SPM. Don't introduce a `Podfile` unless a
  plugin truly requires pods; mixing managers causes build confusion.
- App Store submission has extra rules — load the `appstore-compliance` skill for
  UI/privacy/performance checks before a release.
