import Foundation

/// Shared-container contract between the app plugin and the widget extension (compiled into both targets).
enum WidgetStore {
    static let appGroup = "group.com.bahaicalendar.app"
    static let snapshotFileName = "widget-snapshot.json"
    /// Must match WIDGET_SNAPSHOT_VERSION in src/services/widgetSnapshot.js.
    static let snapshotVersion = 2

    static var snapshotURL: URL? {
        FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: appGroup)?
            .appendingPathComponent(snapshotFileName)
    }
}
