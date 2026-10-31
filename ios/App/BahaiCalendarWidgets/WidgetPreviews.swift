import SwiftUI
import WidgetKit

#Preview("Badí' Date", as: .systemSmall) {
    BadiDateWidget()
} timeline: {
    CalendarTimelineProvider.entry(at: .now, data: .sample)
}

#Preview("Gregorian Date", as: .systemSmall) {
    GregorianDateWidget()
} timeline: {
    CalendarTimelineProvider.entry(at: .now, data: .sample)
}

#Preview("Badí' Month", as: .systemSmall) {
    BadiMonthWidget()
} timeline: {
    CalendarTimelineProvider.entry(at: .now, data: .sample)
}

#Preview("Gregorian Month", as: .systemSmall) {
    GregorianMonthWidget()
} timeline: {
    CalendarTimelineProvider.entry(at: .now, data: .sample)
}

#Preview("Four Weeks", as: .systemLarge) {
    FourWeeksWidget()
} timeline: {
    CalendarTimelineProvider.entry(at: .now, data: .sample)
    CalendarEntry(date: .now, day: .now, data: nil)
}

#Preview("Full Gregorian Month", as: .systemLarge) {
    FullMonthWidget(mode: .gregorian)
} timeline: {
    CalendarTimelineProvider.entry(at: .now, data: .sample)
}

#Preview("Full Badí' Month", as: .systemLarge) {
    FullMonthWidget(mode: .badi)
} timeline: {
    CalendarTimelineProvider.entry(at: .now, data: .sample)
}
