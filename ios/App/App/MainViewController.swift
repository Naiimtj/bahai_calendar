import Capacitor
import UIKit

/**
 * Custom bridge view controller so we can manually register the in-house
 * BahaiCalendarNative plugin.
 *
 * Why this is needed: `npx cap sync ios` regenerates
 * `ios/App/App/capacitor.config.json`'s `packageClassList` by scanning only
 * installed npm Capacitor plugins (see @capacitor/cli's `iosplugin.js`). A
 * local plugin living directly in this target (no npm package) is never
 * added to that list, so Capacitor's default auto-registration never loads
 * it — the JS bridge call silently fails ("plugin not found"), which is why
 * device-calendar sync did nothing on iOS. Registering it here survives
 * every `cap sync` since this file is untouched by that regeneration.
 */
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(BahaiCalendarNativePlugin())
    }
}
