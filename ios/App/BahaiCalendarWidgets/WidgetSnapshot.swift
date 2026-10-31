import Foundation

/// JSON written by `buildWidgetSnapshot` (src/services/widgetSnapshot.js).
struct WidgetSnapshot: Decodable {
    struct Month: Decodable {
        let name: String
        let meaning: String
    }

    struct Event: Decodable {
        let title: String
        /// "holyDay" | "ridvan" | "feast" | "personal"
        let kind: String
        let color: String?
        let isReminder: Bool?
        let isCompleted: Bool?

        var isBahai: Bool { kind != "personal" }
    }

    struct Day: Decodable {
        let date: String
        let year: Int
        let month: Int
        let day: Int
        let events: [Event]
        let more: Int?
        let sunset: Double?
    }

    let version: Int
    let lang: String
    let rtl: Bool
    let firstWeekday: Int
    let weekdayInitials: [String]
    let badiWeekdays: [String]
    let months: [Month]
    let days: [Day]
}

extension Calendar {
    /// Snapshot dates are Gregorian: `Calendar.current` may be Persian, Buddhist… for some regions.
    static var widgetGregorian: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = .current
        return calendar
    }
}

struct CalendarData {
    let snapshot: WidgetSnapshot
    private let daysByKey: [String: WidgetSnapshot.Day]

    init(snapshot: WidgetSnapshot) {
        self.snapshot = snapshot
        daysByKey = Dictionary(snapshot.days.map { ($0.date, $0) }, uniquingKeysWith: { first, _ in first })
    }

    static func load() -> CalendarData? {
        guard let url = WidgetStore.snapshotURL,
              let data = try? Data(contentsOf: url),
              let snapshot = try? JSONDecoder().decode(WidgetSnapshot.self, from: data),
              snapshot.version == WidgetStore.snapshotVersion
        else { return nil }
        return CalendarData(snapshot: snapshot)
    }

    var locale: Locale { Locale(identifier: snapshot.lang) }
    private var firstWeekday: Int { ((snapshot.firstWeekday % 7) + 7) % 7 }

    func day(for date: Date) -> WidgetSnapshot.Day? { daysByKey[Self.key(for: date)] }

    func days(inYear year: Int, month: Int) -> [WidgetSnapshot.Day] {
        snapshot.days.filter { $0.year == year && $0.month == month }
    }

    func monthName(_ number: Int) -> String {
        snapshot.months.indices.contains(number) ? snapshot.months[number].name : ""
    }

    func monthMeaning(_ number: Int) -> String {
        snapshot.months.indices.contains(number) ? snapshot.months[number].meaning : ""
    }

    func badiWeekday(for date: Date) -> String {
        let index = Calendar.widgetGregorian.component(.weekday, from: date) - 1
        return snapshot.badiWeekdays.indices.contains(index) ? snapshot.badiWeekdays[index] : ""
    }

    var weekdayInitials: [String] {
        if snapshot.weekdayInitials.count == 7 { return snapshot.weekdayInitials }
        var calendar = Calendar.widgetGregorian
        calendar.locale = locale
        let symbols = calendar.veryShortStandaloneWeekdaySymbols
        return (0..<7).map { symbols[(firstWeekday + $0) % 7] }
    }

    func column(for date: Date) -> Int {
        let weekday = Calendar.widgetGregorian.component(.weekday, from: date) - 1
        return (weekday - firstWeekday + 7) % 7
    }

    static func key(for date: Date) -> String {
        let parts = Calendar.widgetGregorian.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year ?? 0, parts.month ?? 0, parts.day ?? 0)
    }
}

extension CalendarData {
    static let sample: CalendarData = {
        let months = [
            WidgetSnapshot.Month(name: "Ayyám-i-Há", meaning: ""),
            WidgetSnapshot.Month(name: "Bahá", meaning: ""),
            WidgetSnapshot.Month(name: "Jalál", meaning: ""),
            WidgetSnapshot.Month(name: "Jamál", meaning: ""),
            WidgetSnapshot.Month(name: "‘Aẓamat", meaning: ""),
            WidgetSnapshot.Month(name: "Núr", meaning: ""),
            WidgetSnapshot.Month(name: "Raḥmat", meaning: ""),
            WidgetSnapshot.Month(name: "Kalimát", meaning: ""),
            WidgetSnapshot.Month(name: "Kamál", meaning: ""),
            WidgetSnapshot.Month(name: "Asmá’", meaning: ""),
            WidgetSnapshot.Month(name: "‘Izzat", meaning: ""),
            WidgetSnapshot.Month(name: "Mashíyyat", meaning: ""),
            WidgetSnapshot.Month(name: "‘Ilm", meaning: ""),
            WidgetSnapshot.Month(name: "Qudrat", meaning: ""),
            WidgetSnapshot.Month(name: "Qawl", meaning: ""),
            WidgetSnapshot.Month(name: "Masá’il", meaning: ""),
            WidgetSnapshot.Month(name: "Sharaf", meaning: ""),
            WidgetSnapshot.Month(name: "Sulṭán", meaning: ""),
            WidgetSnapshot.Month(name: "Mulk", meaning: ""),
            WidgetSnapshot.Month(name: "‘Alá’", meaning: ""),
        ]
        let weekdays = ["Jamál", "Kamál", "Fiḍál", "‘Idál", "Istijlál", "Istiqlál", "Jalál"]
        let calendar = Calendar.widgetGregorian
        let today = calendar.startOfDay(for: Date())
        let formatter = DateFormatter()
        formatter.calendar = calendar
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "yyyy-MM-dd"

        let baseMonth = 11
        let baseDay = 5
        let baseYear = 183

        let days: [WidgetSnapshot.Day] = (-31...45).compactMap { offset in
            guard let date = calendar.date(byAdding: .day, value: offset, to: today) else { return nil }
            let index = ((baseMonth - 1) * 19 + (baseDay - 1) + offset)
            let month = index / 19 + 1
            let day = index % 19 + 1
            let event: [WidgetSnapshot.Event]
            if day == 1 {
                let title = months.indices.contains(month) ? months[month].name : ""
                event = [WidgetSnapshot.Event(title: title, kind: "feast", color: nil, isReminder: nil, isCompleted: nil)]
            } else {
                event = []
            }
            return WidgetSnapshot.Day(
                date: formatter.string(from: date),
                year: baseYear,
                month: month,
                day: day,
                events: event,
                more: 0,
                sunset: nil
            )
        }

        let lang = Locale.current.language.languageCode?.identifier ?? "en"
        let rtl = Locale.Language(identifier: lang).characterDirection == .rightToLeft

        let snapshot = WidgetSnapshot(
            version: WidgetStore.snapshotVersion,
            lang: lang,
            rtl: rtl,
            firstWeekday: 1,
            weekdayInitials: [],
            badiWeekdays: weekdays,
            months: months,
            days: days
        )
        return CalendarData(snapshot: snapshot)
    }()
}
