import SwiftUI
import WidgetKit

struct GregorianDateWidget: Widget {
    private let kind = "GregorianDateWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CalendarTimelineProvider()) { entry in
            GregorianDateWidgetView(entry: entry)
        }
        .configurationDisplayName(Text("widget.gregorianDate.name"))
        .description(Text("widget.gregorianDate.description"))
        .supportedFamilies([.systemSmall])
    }
}

private struct GregorianDateWidgetView: View {
    let entry: CalendarEntry

    var body: some View {
        WidgetShell(entry: entry) { data, day in
            let bahaiEvent = day.events.first(where: { $0.isBahai })
            let monthName = data.monthName(day.month)
            let badiDate = "\(day.day) \(monthName) \(day.year)"

            VStack(spacing: 2) {
                Text(verbatim: WidgetFormat.gregorian(entry.day, template: "LLLL y", locale: data.locale))
                    .font(.system(size: 14, weight: .semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                    .widgetAccentable()

                Text(verbatim: WidgetFormat.gregorian(entry.day, template: "EEEE", locale: data.locale))
                    .font(.caption2.weight(.medium))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)

                ZStack {
                    if let starColor = WidgetPalette.starColor(for: day) {
                        NineStar()
                            .fill(starColor.opacity(0.32))
                            .aspectRatio(1, contentMode: .fit)
                    }
                    Text(verbatim: WidgetFormat.gregorian(entry.day, template: "d", locale: data.locale))
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

                Text(verbatim: badiDate)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            .accessibilityElement(children: .combine)
        }
    }
}