import WidgetKit

struct CalendarEntry: TimelineEntry {
    let date: Date
    /// Day shown as "today": the next day after sunset when the app starts days at sunset.
    let day: Date
    let data: CalendarData?
}

struct CalendarTimelineProvider: TimelineProvider {
    private static let horizonDays = 14

    func placeholder(in context: Context) -> CalendarEntry {
        Self.entry(at: Date(), data: .sample)
    }

    func getSnapshot(in context: Context, completion: @escaping (CalendarEntry) -> Void) {
        completion(Self.entry(at: Date(), data: CalendarData.load() ?? .sample))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<CalendarEntry>) -> Void) {
        let now = Date()
        let calendar = Calendar.widgetGregorian
        let today = calendar.startOfDay(for: now)
        guard let data = CalendarData.load() else {
            let tomorrow = calendar.date(byAdding: .day, value: 1, to: today) ?? now.addingTimeInterval(86_400)
            completion(Timeline(entries: [CalendarEntry(date: now, day: today, data: nil)], policy: .after(tomorrow)))
            return
        }
        var instants: Set<Date> = [now]
        for offset in 0...Self.horizonDays {
            guard let midnight = calendar.date(byAdding: .day, value: offset, to: today) else { continue }
            if midnight > now { instants.insert(midnight) }
            if let sunsetMs = data.day(for: midnight)?.sunset {
                let sunset = Date(timeIntervalSince1970: sunsetMs / 1000)
                if sunset > now { instants.insert(sunset) }
            }
        }
        completion(Timeline(entries: instants.sorted().map { Self.entry(at: $0, data: data) }, policy: .atEnd))
    }

    static func entry(at date: Date, data: CalendarData?) -> CalendarEntry {
        let calendar = Calendar.widgetGregorian
        var day = calendar.startOfDay(for: date)
        if let sunsetMs = data?.day(for: day)?.sunset,
           date.timeIntervalSince1970 * 1000 >= sunsetMs,
           let next = calendar.date(byAdding: .day, value: 1, to: day) {
            day = next
        }
        return CalendarEntry(date: date, day: day, data: data)
    }
}
