import SwiftUI
import WidgetKit

enum FullMonthMode {
    case gregorian
    case badi
}

struct FullMonthWidget: Widget {
    let mode: FullMonthMode

    init() { mode = .gregorian }

    init(mode: FullMonthMode) { self.mode = mode }

    private var kind: String {
        switch mode {
        case .gregorian: "FullGregorianMonthWidget"
        case .badi: "FullBadiMonthWidget"
        }
    }

    private var name: LocalizedStringKey {
        switch mode {
        case .gregorian: "widget.fullGregorianMonth.name"
        case .badi: "widget.fullBadiMonth.name"
        }
    }

    private var description: LocalizedStringKey {
        switch mode {
        case .gregorian: "widget.fullGregorianMonth.description"
        case .badi: "widget.fullBadiMonth.description"
        }
    }

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CalendarTimelineProvider()) { entry in
            FullMonthWidgetView(entry: entry, mode: mode)
        }
        .configurationDisplayName(Text(name))
        .description(Text(description))
        .supportedFamilies([.systemLarge])
        .contentMarginsDisabled()
    }
}

private struct FullMonthWidgetView: View {
    let entry: CalendarEntry
    let mode: FullMonthMode

    var body: some View {
        WidgetShell(entry: entry) { data, today in
            let calendar = Calendar.widgetGregorian
            let firstDate: Date = {
                if mode == .badi {
                    return calendar.date(byAdding: .day, value: 1 - today.day, to: entry.day) ?? entry.day
                }
                return calendar.date(from: calendar.dateComponents([.year, .month], from: entry.day)) ?? entry.day
            }()
            let totalDays: Int = {
                if mode == .badi {
                    if today.month == 0 {
                        return max(data.days(inYear: today.year, month: 0).map(\.day).max() ?? 0, 4)
                    }
                    return 19
                }
                return calendar.range(of: .day, in: .month, for: entry.day)?.count ?? 30
            }()
            let leading = data.column(for: firstDate)
            let rows = (leading + totalDays + 6) / 7

            VStack(spacing: 4) {
                heading(data: data, today: today)
                    .font(.system(size: 14, weight: .semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                    .frame(maxWidth: .infinity)

                WeekdayHeader(initials: data.weekdayInitials, fontSize: 10)

                GeometryReader { geometry in
                    let cellWidth = geometry.size.width / 7
                    let cellHeight = geometry.size.height / CGFloat(rows)

                    VStack(spacing: 0) {
                        ForEach(0..<rows, id: \.self) { row in
                            HStack(spacing: 0) {
                                ForEach(0..<7, id: \.self) { column in
                                    let number = row * 7 + column - leading + 1
                                    Group {
                                        if (1...totalDays).contains(number),
                                           let date = calendar.date(byAdding: .day, value: number - 1, to: firstDate) {
                                            FourWeeksDayCell(
                                                date: date,
                                                day: data.day(for: date),
                                                isToday: calendar.isDate(date, inSameDayAs: entry.day),
                                                locale: data.locale,
                                                mode: mode == .badi ? .badi : .gregorian,
                                                eventLimit: rows == 6 ? 2 : 3
                                            )
                                        } else {
                                            Color.clear
                                        }
                                    }
                                    .frame(width: cellWidth, height: cellHeight)
                                    .clipped()
                                    .overlay(alignment: .leading) {
                                        if column > 0 {
                                            Rectangle()
                                                .fill(WidgetPalette.separator)
                                                .frame(width: 0.5)
                                        }
                                    }
                                }
                            }
                            .overlay(alignment: .top) {
                                Rectangle()
                                    .fill(WidgetPalette.separator)
                                    .frame(height: 0.5)
                            }
                        }
                    }
                }
                .frame(maxHeight: .infinity)
            }
            .padding(.top, 10)
        }
    }

    @ViewBuilder
    private func heading(data: CalendarData, today: WidgetSnapshot.Day) -> some View {
        switch mode {
        case .gregorian:
            Text(verbatim: WidgetFormat.gregorian(entry.day, template: "LLLLy", locale: data.locale))
        case .badi:
            Text(verbatim: "\(data.monthName(today.month)) \(today.year)")
                .foregroundStyle(WidgetPalette.accent)
                .widgetAccentable()
        }
    }
}