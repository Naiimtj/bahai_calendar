import SwiftUI
import WidgetKit

enum WidgetPalette {
    static let accent = Color("AccentColor")
    static let holyDay = Color("HolyDay")
    static let feast = Color("Feast")
    static let ridvan = Color("Ridvan")
    static let today = Color.red
    static let separator = Color.secondary.opacity(0.25)

    static func color(for event: WidgetSnapshot.Event) -> Color {
        switch event.kind {
        case "holyDay":
            return holyDay
        case "feast":
            return feast
        case "ridvan":
            return ridvan
        case "personal":
            return event.color.flatMap(Color.init(hex:)) ?? accent
        default:
            return accent
        }
    }

    static func starColor(for day: WidgetSnapshot.Day?) -> Color? {
        guard let event = day?.events.first(where: { $0.isBahai }) else { return nil }
        return color(for: event)
    }
}

extension Color {
    init?(hex: String) {
        let raw = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        guard raw.hasPrefix("#") else { return nil }
        let value = String(raw.dropFirst())

        let red: Double
        let green: Double
        let blue: Double
        let alpha: Double

        switch value.count {
        case 3:
            let chars = Array(value)
            guard
                let r = Int(String(repeating: chars[0], count: 2), radix: 16),
                let g = Int(String(repeating: chars[1], count: 2), radix: 16),
                let b = Int(String(repeating: chars[2], count: 2), radix: 16)
            else { return nil }
            red = Double(r) / 255
            green = Double(g) / 255
            blue = Double(b) / 255
            alpha = 1
        case 6:
            guard let packed = UInt32(value, radix: 16) else { return nil }
            red = Double((packed >> 16) & 0xFF) / 255
            green = Double((packed >> 8) & 0xFF) / 255
            blue = Double(packed & 0xFF) / 255
            alpha = 1
        case 8:
            guard let packed = UInt32(value, radix: 16) else { return nil }
            red = Double((packed >> 24) & 0xFF) / 255
            green = Double((packed >> 16) & 0xFF) / 255
            blue = Double((packed >> 8) & 0xFF) / 255
            alpha = Double(packed & 0xFF) / 255
        default:
            return nil
        }

        self = Color(.sRGB, red: red, green: green, blue: blue, opacity: alpha)
    }
}

struct NineStar: Shape {
    func path(in rect: CGRect) -> Path {
        let outer = min(rect.width, rect.height) / 2
        let inner = outer * 7.2 / 11
        let center = CGPoint(x: rect.midX, y: rect.midY)

        var path = Path()
        for index in 0..<18 {
            let angle = (Double(index) * .pi / 9) - (.pi / 2)
            let radius = index.isMultiple(of: 2) ? outer : inner
            let point = CGPoint(
                x: center.x + CGFloat(cos(angle)) * radius,
                y: center.y + CGFloat(sin(angle)) * radius
            )
            if index == 0 {
                path.move(to: point)
            } else {
                path.addLine(to: point)
            }
        }
        path.closeSubpath()
        return path
    }
}

enum WidgetFormat {
    static func gregorian(_ date: Date, template: String, locale: Locale) -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar.widgetGregorian
        formatter.locale = locale
        formatter.timeZone = .current
        formatter.setLocalizedDateFormatFromTemplate(template)
        formatter.monthSymbols = formatter.monthSymbols.map { $0.prefix(1).uppercased(with: locale) + $0.dropFirst() }
        formatter.standaloneMonthSymbols = formatter.standaloneMonthSymbols.map { $0.prefix(1).uppercased(with: locale) + $0.dropFirst() }
        formatter.shortMonthSymbols = formatter.shortMonthSymbols.map { $0.prefix(1).uppercased(with: locale) + $0.dropFirst() }
        formatter.shortStandaloneMonthSymbols = formatter.shortStandaloneMonthSymbols.map { $0.prefix(1).uppercased(with: locale) + $0.dropFirst() }
        return formatter.string(from: date)
    }

    static func badiMonthTitle(name: String, meaning: String) -> AttributedString {
        var title = AttributedString(name)
        title.foregroundColor = WidgetPalette.accent
        guard !meaning.isEmpty else { return title }
        var suffix = AttributedString(" (\(meaning))")
        suffix.foregroundColor = .secondary
        return title + suffix
    }
}

struct MonthGrid<Cell: View>: View {
    let rowCount: Int
    @ViewBuilder let cell: (_ index: Int, _ diameter: CGFloat) -> Cell

    var body: some View {
        GeometryReader { geo in
            let rows = max(rowCount, 1)
            let spacing: CGFloat = 1
            let rowHeight = min((geo.size.height - spacing * CGFloat(rows - 1)) / CGFloat(rows), 22)
            let columnWidth = geo.size.width / 7
            let diameter = min(rowHeight, columnWidth, 18)
            VStack(spacing: spacing) {
                ForEach(0..<rows, id: \.self) { row in
                    HStack(spacing: 0) {
                        ForEach(0..<7, id: \.self) { column in
                            cell(row * 7 + column, diameter)
                                .frame(width: columnWidth, height: rowHeight)
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        }
    }
}

struct MonthDayCell: View {
    let number: Int?
    let starColor: Color?
    let isToday: Bool
    let diameter: CGFloat

    var body: some View {
        ZStack {
            if let number {
                if let starColor {
                    NineStar()
                        .fill(starColor.opacity(0.45))
                        .frame(width: diameter + 3, height: diameter + 3)
                        .offset(x: -1)
                }
                let label = Text(verbatim: String(number))
                    .font(.system(size: min(11, max(9, diameter * 0.66)), weight: isToday ? .bold : .regular, design: .rounded))
                    .monospacedDigit()
                    .frame(width: diameter, height: diameter, alignment: .center)
                if isToday {
                    label
                        .todayBadge(Circle())
                } else {
                    label
                        .foregroundStyle(.primary)
                        .offset(x: starColor == nil ? 0 : -1)
                }
            }
        }
    }
}

/// Filled "today" badge. Tinted/clear Home Screens repaint every color (even black), so there the number is cut out of the badge.
private struct TodayBadge<BadgeShape: Shape>: ViewModifier {
    @Environment(\.widgetRenderingMode) private var renderingMode
    let shape: BadgeShape

    @ViewBuilder
    func body(content: Content) -> some View {
        if renderingMode == .fullColor {
            content
                .foregroundStyle(Color.white)
                .background { shape.fill(WidgetPalette.today) }
        } else {
            content
                .blendMode(.destinationOut)
                .background { shape }
                .compositingGroup()
                .widgetAccentable()
        }
    }
}

extension View {
    func todayBadge<BadgeShape: Shape>(_ shape: BadgeShape) -> some View {
        modifier(TodayBadge(shape: shape))
    }
}

struct WidgetBackdrop: View {
    var body: some View {
        LinearGradient(
            colors: [Color("WidgetBackgroundTint"), Color("WidgetBackground")],
            startPoint: .top,
            endPoint: .bottom
        )
    }
}

struct WidgetShell<Content: View>: View {
    let entry: CalendarEntry
    @ViewBuilder let content: (CalendarData, WidgetSnapshot.Day) -> Content

    var body: some View {
        Group {
            if let data = entry.data, let day = data.day(for: entry.day) {
                content(data, day)
                    .environment(\.layoutDirection, data.snapshot.rtl ? .rightToLeft : .leftToRight)
            } else {
                OpenAppMessage()
            }
        }
        .containerBackground(for: .widget) {
            WidgetBackdrop()
        }
    }
}

struct OpenAppMessage: View {
    var body: some View {
        VStack(spacing: 6) {
            NineStar()
                .fill(WidgetPalette.accent.opacity(0.35))
                .frame(width: 26, height: 26)
            Text("widget.openApp")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(8)
    }
}

struct WeekdayHeader: View {
    let initials: [String]
    let fontSize: CGFloat

    var body: some View {
        HStack(spacing: 0) {
            ForEach(Array(initials.enumerated()), id: \.offset) { _, value in
                Text(verbatim: value)
                    .font(.system(size: fontSize, weight: .semibold))
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity)
            }
        }
        .accessibilityHidden(true)
    }
}
