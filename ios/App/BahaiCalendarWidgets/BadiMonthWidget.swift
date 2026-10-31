import SwiftUI
import WidgetKit

struct BadiMonthWidget: Widget {
    private let kind = "BadiMonthWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CalendarTimelineProvider()) { entry in
            BadiMonthWidgetView(entry: entry)
        }
        .configurationDisplayName(Text("widget.month.name"))
        .description(Text("widget.month.description"))
        .supportedFamilies([.systemSmall])
        .contentMarginsDisabled()
    }
}

private struct BadiMonthWidgetView: View {
    let entry: CalendarEntry

    var body: some View {
        WidgetShell(entry: entry) { data, day in
            VStack(spacing: 4) {
                HStack(spacing: 4) {
                    Text(verbatim: data.monthName(day.month))
                        .foregroundStyle(WidgetPalette.accent)
                        .widgetAccentable()
                    Text(verbatim: String(day.year))
                        .foregroundStyle(.secondary)
                }
                .font(.system(size: 13, weight: .bold))
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .frame(maxWidth: .infinity)

                WeekdayHeader(initials: data.weekdayInitials, fontSize: 9)

                let monthDays = data.days(inYear: day.year, month: day.month)
                let totalDays = day.month == 0 ? max(monthDays.map(\.day).max() ?? 0, 4) : 19
                let start = Calendar.widgetGregorian.date(byAdding: .day, value: -(day.day - 1), to: entry.day) ?? entry.day
                let leading = data.column(for: start)
                let eventByDay = Dictionary(monthDays.map { ($0.day, $0) }, uniquingKeysWith: { first, _ in first })

                MonthGrid(rowCount: (leading + totalDays + 6) / 7) { index, diameter in
                    let number = index - leading + 1
                    let inRange = (1...totalDays).contains(number)
                    MonthDayCell(
                        number: inRange ? number : nil,
                        starColor: inRange ? WidgetPalette.starColor(for: eventByDay[number]) : nil,
                        isToday: inRange && number == day.day,
                        diameter: diameter
                    )
                }
            }
            .padding(12)
        }
    }
}
