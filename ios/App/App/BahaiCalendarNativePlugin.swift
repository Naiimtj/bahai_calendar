import Capacitor
import EventKit
import Foundation

/**
 * In-house replacement for `@ebarooni/capacitor-calendar` (iOS side).
 * Reads/writes the device Calendar and Reminders via EventKit.
 *
 * JS bridge: src/native/bahaiCalendarNative.js
 * Android counterpart: android/app/src/main/java/com/bahaicalendar/app/BahaiCalendarNativePlugin.java
 * (Reminders are iOS-only — not implemented on Android.)
 */
@objc(BahaiCalendarNativePlugin)
public class BahaiCalendarNativePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "BahaiCalendarNativePlugin"
    public let jsName = "BahaiCalendarNative"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestFullCalendarAccess", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkAllPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "listCalendars", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "listEventsInRange", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "createEvent", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "modifyEvent", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteEvent", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestFullRemindersAccess", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getRemindersLists", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getRemindersFromLists", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "createReminder", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "modifyReminder", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteReminder", returnType: CAPPluginReturnPromise),
    ]

    private let store = EKEventStore()

    // MARK: - Calendar permissions

    @objc func requestFullCalendarAccess(_ call: CAPPluginCall) {
        if #available(iOS 17.0, *) {
            store.requestFullAccessToEvents { granted, _ in
                call.resolve(["result": granted ? "granted" : "denied"])
            }
        } else {
            store.requestAccess(to: .event) { granted, _ in
                call.resolve(["result": granted ? "granted" : "denied"])
            }
        }
    }

    @objc func checkAllPermissions(_ call: CAPPluginCall) {
        let calendarStatus = permissionString(EKEventStore.authorizationStatus(for: .event))
        let reminderStatus = permissionString(EKEventStore.authorizationStatus(for: .reminder))
        call.resolve([
            "result": [
                "readCalendar": calendarStatus,
                "writeCalendar": calendarStatus,
                "readReminders": reminderStatus,
                "writeReminders": reminderStatus,
            ],
        ])
    }

    private func permissionString(_ status: EKAuthorizationStatus) -> String {
        switch status {
        case .fullAccess, .authorized:
            return "granted"
        case .notDetermined:
            return "prompt"
        default:
            return "denied"
        }
    }

    // MARK: - Calendars

    @objc func listCalendars(_ call: CAPPluginCall) {
        let calendars = store.calendars(for: .event).map { cal -> [String: Any] in
            [
                "id": cal.calendarIdentifier,
                "title": cal.title,
                "color": cal.cgColor != nil ? hexString(cal.cgColor!) : NSNull(),
                "source": ["title": cal.source?.title ?? ""],
            ]
        }
        call.resolve(["result": calendars])
    }

    // MARK: - Events

    @objc func listEventsInRange(_ call: CAPPluginCall) {
        guard let from = call.getDouble("from"), let to = call.getDouble("to") else {
            call.reject("Missing 'from'/'to'")
            return
        }
        let start = Date(timeIntervalSince1970: from / 1000)
        let end = Date(timeIntervalSince1970: to / 1000)
        let predicate = store.predicateForEvents(withStart: start, end: end, calendars: nil)
        let events = store.events(matching: predicate).map { event -> [String: Any] in
            [
                "id": event.eventIdentifier ?? "",
                "calendarId": event.calendar.calendarIdentifier,
                "title": event.title ?? "",
                "description": event.notes ?? "",
                "location": event.location ?? "",
                "isAllDay": event.isAllDay,
                "startDate": event.startDate.timeIntervalSince1970 * 1000,
                "endDate": event.endDate.timeIntervalSince1970 * 1000,
                "availability": availabilityFromNative(event.availability),
                "alerts": alarmsToMinutes(event.alarms),
            ]
        }
        call.resolve(["result": events])
    }

    @objc func createEvent(_ call: CAPPluginCall) {
        guard let calendarId = call.getString("calendarId"),
              let startMs = call.getDouble("startDate"),
              let endMs = call.getDouble("endDate") else {
            call.reject("Missing 'calendarId'/'startDate'/'endDate'")
            return
        }
        guard let calendar = store.calendar(withIdentifier: calendarId) else {
            call.reject("Unknown calendarId")
            return
        }
        let event = EKEvent(eventStore: store)
        event.calendar = calendar
        applyEventFields(event, call: call, startMs: startMs, endMs: endMs)
        do {
            try store.save(event, span: .thisEvent, commit: true)
            call.resolve(["result": event.eventIdentifier ?? ""])
        } catch {
            call.reject("Failed to create event: \(error.localizedDescription)")
        }
    }

    @objc func modifyEvent(_ call: CAPPluginCall) {
        guard let id = call.getString("id"), let event = store.event(withIdentifier: id) else {
            call.reject("Event not found")
            return
        }
        if let calendarId = call.getString("calendarId"), let calendar = store.calendar(withIdentifier: calendarId) {
            event.calendar = calendar
        }
        let startMs = call.getDouble("startDate") ?? event.startDate.timeIntervalSince1970 * 1000
        let endMs = call.getDouble("endDate") ?? event.endDate.timeIntervalSince1970 * 1000
        applyEventFields(event, call: call, startMs: startMs, endMs: endMs)
        let span: EKSpan = call.getString("span") == "thisAndFutureEvents" ? .futureEvents : .thisEvent
        do {
            try store.save(event, span: span, commit: true)
            call.resolve(["result": true])
        } catch {
            call.reject("Failed to update event: \(error.localizedDescription)")
        }
    }

    @objc func deleteEvent(_ call: CAPPluginCall) {
        guard let id = call.getString("id"), let event = store.event(withIdentifier: id) else {
            call.reject("Event not found")
            return
        }
        let span: EKSpan = call.getString("span") == "thisAndFutureEvents" ? .futureEvents : .thisEvent
        do {
            try store.remove(event, span: span, commit: true)
            call.resolve(["result": true])
        } catch {
            call.reject("Failed to delete event: \(error.localizedDescription)")
        }
    }

    private func applyEventFields(_ event: EKEvent, call: CAPPluginCall, startMs: Double, endMs: Double) {
        if let title = call.getString("title") { event.title = title }
        if let notes = call.getString("description") { event.notes = notes }
        if let location = call.getString("location") { event.location = location }
        if let allDay = call.getBool("isAllDay") { event.isAllDay = allDay }
        event.startDate = Date(timeIntervalSince1970: startMs / 1000)
        event.endDate = Date(timeIntervalSince1970: endMs / 1000)
        if let availability = call.getString("availability") {
            event.availability = availabilityToNative(availability)
        }
        if let recurrence = call.getObject("recurrence") {
            event.recurrenceRules = [buildRecurrenceRule(recurrence)]
        }
        if let alerts = call.getArray("alerts", NSNumber.self) {
            event.alarms = alerts.map { EKAlarm(relativeOffset: TimeInterval(truncating: $0) * 60) }
        }
    }

    // MARK: - Reminders (iOS-only)

    @objc func requestFullRemindersAccess(_ call: CAPPluginCall) {
        if #available(iOS 17.0, *) {
            store.requestFullAccessToReminders { granted, _ in
                call.resolve(["result": granted ? "granted" : "denied"])
            }
        } else {
            store.requestAccess(to: .reminder) { granted, _ in
                call.resolve(["result": granted ? "granted" : "denied"])
            }
        }
    }

    @objc func getRemindersLists(_ call: CAPPluginCall) {
        let lists = store.calendars(for: .reminder).map { list -> [String: Any] in
            [
                "id": list.calendarIdentifier,
                "title": list.title,
                "color": list.cgColor != nil ? hexString(list.cgColor!) : NSNull(),
            ]
        }
        call.resolve(["result": lists])
    }

    @objc func getRemindersFromLists(_ call: CAPPluginCall) {
        let listIds = call.getArray("listIds") as? [String] ?? []
        let lists = store.calendars(for: .reminder).filter { listIds.contains($0.calendarIdentifier) }
        let predicate = store.predicateForReminders(in: lists.isEmpty ? nil : lists)
        store.fetchReminders(matching: predicate) { reminders in
            let out = (reminders ?? []).map { reminder -> [String: Any] in
                [
                    "id": reminder.calendarItemIdentifier,
                    "listId": reminder.calendar.calendarIdentifier,
                    "title": reminder.title ?? "",
                    "notes": reminder.notes ?? "",
                    "url": reminder.url?.absoluteString ?? "",
                    "dueDate": reminder.dueDateComponents?.date.map { $0.timeIntervalSince1970 * 1000 } as Any,
                    "isCompleted": reminder.isCompleted,
                    "priority": reminder.priority,
                ]
            }
            call.resolve(["result": out])
        }
    }

    @objc func createReminder(_ call: CAPPluginCall) {
        let reminder = EKReminder(eventStore: store)
        reminder.calendar = store.defaultCalendarForNewReminders() ?? store.calendars(for: .reminder).first
        applyReminderFields(reminder, call: call)
        do {
            try store.save(reminder, commit: true)
            call.resolve(["result": reminder.calendarItemIdentifier])
        } catch {
            call.reject("Failed to create reminder: \(error.localizedDescription)")
        }
    }

    @objc func modifyReminder(_ call: CAPPluginCall) {
        guard let id = call.getString("id"),
              let reminder = store.calendarItem(withIdentifier: id) as? EKReminder else {
            call.reject("Reminder not found")
            return
        }
        applyReminderFields(reminder, call: call)
        if let completed = call.getBool("isCompleted") {
            reminder.isCompleted = completed
        }
        do {
            try store.save(reminder, commit: true)
            call.resolve(["result": true])
        } catch {
            call.reject("Failed to update reminder: \(error.localizedDescription)")
        }
    }

    @objc func deleteReminder(_ call: CAPPluginCall) {
        guard let id = call.getString("id"),
              let reminder = store.calendarItem(withIdentifier: id) as? EKReminder else {
            call.reject("Reminder not found")
            return
        }
        do {
            try store.remove(reminder, commit: true)
            call.resolve(["result": true])
        } catch {
            call.reject("Failed to delete reminder: \(error.localizedDescription)")
        }
    }

    private func applyReminderFields(_ reminder: EKReminder, call: CAPPluginCall) {
        if let title = call.getString("title") { reminder.title = title }
        if let notes = call.getString("notes") { reminder.notes = notes }
        if let url = call.getString("url"), !url.isEmpty { reminder.url = URL(string: url) }
        if let location = call.getString("location") { reminder.location = location }
        if let priority = call.getInt("priority") { reminder.priority = priority }
        if let dueMs = call.getDouble("dueDate") {
            let date = Date(timeIntervalSince1970: dueMs / 1000)
            reminder.dueDateComponents = Calendar.current.dateComponents(
                [.year, .month, .day, .hour, .minute, .second],
                from: date
            )
        }
        if let recurrence = call.getObject("recurrence") {
            reminder.recurrenceRules = [buildRecurrenceRule(recurrence)]
        }
        if let alerts = call.getArray("alerts", NSNumber.self) {
            reminder.alarms = alerts.map { EKAlarm(relativeOffset: TimeInterval(truncating: $0) * 60) }
        }
        if let completed = call.getBool("isCompleted"), completed {
            reminder.completionDate = Date()
        }
    }

    // MARK: - Shared mapping helpers

    private func buildRecurrenceRule(_ recurrence: JSObject) -> EKRecurrenceRule {
        let frequencyMap: [String: EKRecurrenceFrequency] = [
            "daily": .daily,
            "weekly": .weekly,
            "monthly": .monthly,
            "yearly": .yearly,
        ]
        let frequency = frequencyMap[recurrence["frequency"] as? String ?? "daily"] ?? .daily
        let interval = (recurrence["interval"] as? NSNumber)?.intValue ?? 1
        var end: EKRecurrenceEnd?
        if let count = (recurrence["count"] as? NSNumber)?.intValue {
            end = EKRecurrenceEnd(occurrenceCount: count)
        } else if let untilMs = (recurrence["end"] as? NSNumber)?.doubleValue {
            end = EKRecurrenceEnd(end: Date(timeIntervalSince1970: untilMs / 1000))
        }
        return EKRecurrenceRule(recurrenceWith: frequency, interval: interval, end: end)
    }

    private func alarmsToMinutes(_ alarms: [EKAlarm]?) -> [Int] {
        (alarms ?? []).map { Int($0.relativeOffset / 60) }
    }

    private func availabilityToNative(_ value: String) -> EKEventAvailability {
        switch value {
        case "free": return .free
        case "tentative": return .tentative
        default: return .busy
        }
    }

    private func availabilityFromNative(_ value: EKEventAvailability) -> String {
        switch value {
        case .free: return "free"
        case .tentative: return "tentative"
        default: return "busy"
        }
    }

    private func hexString(_ color: CGColor) -> String {
        guard let components = color.components, components.count >= 3 else { return "#000000" }
        let r = Int(components[0] * 255)
        let g = Int(components[1] * 255)
        let b = Int(components[2] * 255)
        return String(format: "#%02X%02X%02X", r, g, b)
    }
}
