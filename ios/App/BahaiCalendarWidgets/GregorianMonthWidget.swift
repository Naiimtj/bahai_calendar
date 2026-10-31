import SwiftUI
import WidgetKit

struct GregorianMonthWidget: Widget {
    private let kind = "GregorianMonthWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CalendarTimelineProvider()) { entry in
            GregorianMonthWidgetView(entry: entry)
        }
        .configurationDisplayName(Text("widget.gregorianMonth.name"))
        .description(Text("widget.gregorianMonth.description"))
        .supportedFamilies([.systemSmall])
        .contentMarginsDisabled()
    }
}

private struct GregorianMonthWidgetView: View {
    let entry: CalendarEntry

    var body: some View {
        WidgetShell(entry: entry) { data, _ in
            let calendar = Calendar.widgetGregorian
            let monthStart = calendar.dateInterval(of: .month, for: entry.day)?.start ?? entry.day
            let daysInMonth = calendar.range(of: .day, in: .month, for: entry.day)?.count ?? 30
            let leading = data.column(for: monthStart)
            let today = calendar.component(.day, from: entry.day)

            VStack(spacing: 4) {
                HStack(spacing: 4) {
                    Text(verbatim: WidgetFormat.gregorian(entry.day, template: "LLLL", locale: data.locale))
                        .foregroundStyle(WidgetPalette.accent)
                        .widgetAccentable()
                    Text(verbatim: WidgetFormat.gregorian(entry.day, template: "y", locale: data.locale))
                        .foregroundStyle(.secondary)
                }
                .font(.system(size: 13, weight: .bold))
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .frame(maxWidth: .infinity)

                WeekdayHeader(initials: data.weekdayInitials, fontSize: 9)

                MonthGrid(rowCount: (leading + daysInMonth + 6) / 7) { index, diameter in
                    let number = index - leading + 1
                    let inRange = (1...daysInMonth).contains(number)
                    let date = calendar.date(byAdding: .day, value: number - 1, to: monthStart) ?? monthStart
                    MonthDayCell(
                        number: inRange ? number : nil,
                        starColor: inRange ? WidgetPalette.starColor(for: data.day(for: date)) : nil,
                        isToday: inRange && number == today,
                        diameter: diameter
                    )
                }
            }
            .padding(12)
        }
    }
}
