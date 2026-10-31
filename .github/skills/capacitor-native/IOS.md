# iOS (Capacitor 8)

<!-- absorbed from .github-old — verify still applies -->

- Require macOS, Xcode 26+, Command Line Tools, iOS 15+, and the committed SPM setup in `ios/App/CapApp-SPM/`.
- Add every sensitive API usage description to `ios/App/App/Info.plist`; missing calendar, reminder, contacts, or location keys can crash at first use.
- Configure capabilities and signing in Xcode; never commit certificates or provisioning profiles.
- Build then sync with `pnpm run build && npx cap sync ios`; run through Xcode or `npx cap run ios`.
- Do not introduce CocoaPods unless a plugin requires it; this project uses Swift Package Manager.
- Home Screen widgets live in the `BahaiCalendarWidgets` extension target (iOS 17+, `com.bahaicalendar.app.widgets`). They render `widget-snapshot.json`, which `src/services/widgetSnapshot.js` sends through `BahaiCalendarNative.updateWidgetSnapshot` into App Group `group.com.bahaicalendar.app`. When the schema changes, bump `WIDGET_SNAPSHOT_VERSION` and `WidgetStore.snapshotVersion` together.
- Keep `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` identical in the App and BahaiCalendarWidgets targets; App Store validation rejects mismatched extension versions.
