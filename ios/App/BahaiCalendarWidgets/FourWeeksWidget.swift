import SwiftUI
import WidgetKit

struct FourWeeksWidget: Widget {
    private let kind = "FourWeeksWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CalendarTimelineProvider()) { entry in
            FourWeeksWidgetView(entry: entry)
        }
        .configurationDisplayName(Text("widget.fourWeeks.name"))
        .description(Text("widget.fourWeeks.description"))
        .supportedFamilies([.systemLarge])
        .contentMarginsDisabled()
    }
}

private struct FourWeeksWidgetView: View {
    let entry: CalendarEntry

    var body: some View {
        WidgetShell(entry: entry) { data, day in
            let calendar = Calendar.widgetGregorian
            let start = calendar.date(byAdding: .day, value: -data.column(for: entry.day), to: entry.day) ?? entry.day

            VStack(spacing: 6) {
                HStack(spacing: 5) {
                    Text(verbatim: WidgetFormat.gregorian(entry.day, template: "LLLLy", locale: data.locale))
                        .foregroundStyle(.primary)
                    Text(verbatim: "·")
                        .foregroundStyle(.secondary)
                    Text(verbatim: "\(data.monthName(day.month)) \(day.year)")
                        .foregroundStyle(WidgetPalette.accent)
                        .widgetAccentable()
                }
                .font(.system(size: 14, weight: .semibold))
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .frame(maxWidth: .infinity)

                WeekdayHeader(initials: data.weekdayInitials, fontSize: 10)

                GeometryReader { geometry in
                    let cellWidth = geometry.size.width / 7
                    let cellHeight = geometry.size.height / 4

                    VStack(spacing: 0) {
                        ForEach(0..<4, id: \.self) { week in
                            HStack(spacing: 0) {
                                ForEach(0..<7, id: \.self) { col in
                                    let offset = (week * 7) + col
                                    let date = calendar.date(byAdding: .day, value: offset, to: start) ?? start
                                    FourWeeksDayCell(
                                        date: date,
                                        day: data.day(for: date),
                                        isToday: calendar.isDate(date, inSameDayAs: entry.day),
                                        locale: data.locale
                                    )
                                    .frame(width: cellWidth, height: cellHeight)
                                    .clipped()
                                    .overlay(alignment: .leading) {
                                        if col > 0 {
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
}

enum LargeCalendarMode {
    case gregorian
    case badi
    case mixed
}

struct FourWeeksDayCell: View {
    let date: Date
    let day: WidgetSnapshot.Day?
    let isToday: Bool
    let locale: Locale
    var mode: LargeCalendarMode = .mixed
    var eventLimit = 3

    var body: some View {
        let events = Array((day?.events ?? []).prefix(eventLimit))
        let more = (day?.more ?? 0) + max(0, (day?.events.count ?? 0) - eventLimit)
        let gregorianText: String = {
            let dayNumber = Calendar.widgetGregorian.component(.day, from: date)
            if dayNumber == 1 && mode == .mixed {
                return WidgetFormat.gregorian(date, template: "MMMd", locale: locale)
            }
            return String(dayNumber)
        }()

        VStack(alignment: .leading, spacing: mode == .mixed ? 2 : 0) {
            HStack(alignment: .top, spacing: 2) {
                ZStack {
                    if let color = WidgetPalette.starColor(for: day) {
                        NineStar()
                            .fill(color.opacity(0.45))
                            .frame(width: 13, height: 13)
                    }
                    if mode == .mixed, let badiDay = day?.day {
                        Text(verbatim: String(badiDay))
                            .font(.system(size: 9, weight: .semibold, design: .rounded))
                            .foregroundStyle(WidgetPalette.accent)
                            .lineLimit(1)
                    }
                }

                Spacer(minLength: 0)

                if isToday {
                    Text(verbatim: mode == .badi ? String(day?.day ?? 0) : gregorianText)
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                        .padding(.horizontal, 4)
                        .todayBadge(Capsule())
                } else {
                    Text(verbatim: mode == .badi ? String(day?.day ?? 0) : gregorianText)
                        .font(.system(size: 11, weight: .regular, design: .rounded))
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                        .foregroundStyle(.primary)
                }
            }

            ForEach(Array(events.enumerated()), id: \.offset) { _, event in
                EventChip(event: event, compact: mode != .mixed, showColorBar: mode == .mixed)
            }

            if more > 0 {
                Text(verbatim: "+\(more)")
                    .font(.system(size: 8, weight: .semibold))
                    .foregroundStyle(.secondary)
            }

            Spacer(minLength: 0)
        }
        .padding(.horizontal, mode == .mixed ? 1.5 : 1)
        .padding(.vertical, mode == .mixed ? 3 : 1)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .overlay {
            if isToday {
                RoundedRectangle(cornerRadius: 5, style: .continuous)
                    .strokeBorder(Color.primary.opacity(0.7), lineWidth: 1.2)
            }
        }
        .clipped()
        .accessibilityElement(children: .combine)
    }
}

private struct EventChip: View {
    let event: WidgetSnapshot.Event
    var compact = false
    var showColorBar = true

    var body: some View {
        let color = WidgetPalette.color(for: event)

        HStack(spacing: 2) {
            if event.isReminder == true {
                Image(systemName: event.isCompleted == true ? "checkmark" : "square")
                    .font(.system(size: 8, weight: .semibold))
                    .accessibilityLabel(Text(event.isCompleted == true ? "widget.reminder.completed" : "widget.reminder.pending"))
            }
            GeometryReader { geometry in
                Text(verbatim: event.title)
                    .fixedSize(horizontal: true, vertical: false)
                    .frame(width: geometry.size.width, height: geometry.size.height, alignment: .leading)
                    .clipped()
            }
            .frame(height: 11)
        }
            .font(.system(size: 9, weight: .medium))
            .foregroundStyle(.primary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.leading, showColorBar ? 3.5 : 1)
            .padding(.trailing, 1)
            .padding(.vertical, compact ? 0 : 1)
            .background(
                RoundedRectangle(cornerRadius: 3, style: .continuous)
                    .fill(color.opacity(0.2))
            )
            .overlay(alignment: .leading) {
                if showColorBar {
                    Rectangle()
                        .fill(color)
                        .frame(width: 2)
                }
            }
            .environment(\.layoutDirection, .leftToRight)
    }
}
