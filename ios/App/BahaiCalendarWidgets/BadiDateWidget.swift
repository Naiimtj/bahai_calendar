import SwiftUI
import WidgetKit

struct BadiDateWidget: Widget {
    private let kind = "BadiDateWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CalendarTimelineProvider()) { entry in
            BadiDateWidgetView(entry: entry)
        }
        .configurationDisplayName(Text("widget.date.name"))
        .description(Text("widget.date.description"))
        .supportedFamilies([.systemSmall])
    }
}

private struct BadiDateWidgetView: View {
    let entry: CalendarEntry

    var body: some View {
        WidgetShell(entry: entry) { data, day in
            let bahaiEvent = day.events.first(where: { $0.isBahai })

            VStack(spacing: 2) {
                Text(WidgetFormat.badiMonthTitle(name: data.monthName(day.month), meaning: data.monthMeaning(day.month)))
                    .font(.system(size: 14, weight: .semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.5)
                    .allowsTightening(true)
                    .widgetAccentable()
                Text(verbatim: data.badiWeekday(for: entry.day))
                    .font(.caption2.weight(.medium))
                    .foregroundStyle(.secondary)
                .lineLimit(1)

                ZStack {
                    NineStar()
                        .fill((WidgetPalette.starColor(for: day) ?? WidgetPalette.accent).opacity(bahaiEvent != nil ? 0.32 : 0.16))
                        .aspectRatio(1, contentMode: .fit)
                    Text(verbatim: String(day.day))
                        .font(.system(size: 58, weight: .bold, design: .rounded))
                        .lineLimit(1)
                        .minimumScaleFactor(0.5)
                }
                .frame(maxHeight: .infinity)

                if let event = bahaiEvent {
                    Text(verbatim: event.title)
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(WidgetPalette.color(for: event))
                        .lineLimit(1)
                }

                Text(verbatim: WidgetFormat.gregorian(entry.day, template: "EEEdMMM", locale: data.locale))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            .accessibilityElement(children: .combine)
        }
    }
}
