package com.bahaicalendar.app;

import android.Manifest;
import android.content.ContentUris;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.provider.CalendarContract;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.Calendar;
import java.util.TimeZone;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * In-house replacement for `@ebarooni/capacitor-calendar` (Android side).
 * Reads/writes the device calendar via the platform CalendarContract
 * provider. Reminders/Contacts are not implemented here — those are
 * iOS-only features (see the Swift counterpart) and are never invoked on
 * Android because `src/services/calendarSync.js` gates them behind
 * `supportsNativeReminders()` / `supportsNativeContacts()`.
 */
@CapacitorPlugin(
    name = "BahaiCalendarNative",
    permissions = {
        @Permission(
            strings = { Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR },
            alias = "calendar"
        )
    }
)
public class BahaiCalendarNativePlugin extends Plugin {

    private boolean hasCalendarPermission() {
        return getPermissionState("calendar") == PermissionState.GRANTED;
    }

    @PluginMethod
    public void requestFullCalendarAccess(PluginCall call) {
        if (hasCalendarPermission()) {
            JSObject result = new JSObject();
            result.put("result", "granted");
            call.resolve(result);
            return;
        }
        requestPermissionForAlias("calendar", call, "calendarPermissionCallback");
    }

    @PermissionCallback
    private void calendarPermissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("result", hasCalendarPermission() ? "granted" : "denied");
        call.resolve(result);
    }

    @PluginMethod
    public void checkAllPermissions(PluginCall call) {
        String status = hasCalendarPermission() ? "granted" : "denied";
        JSObject result = new JSObject();
        result.put("readCalendar", status);
        result.put("writeCalendar", status);
        // Reminders are not implemented on Android (iOS-only feature).
        result.put("readReminders", "denied");
        result.put("writeReminders", "denied");
        JSObject out = new JSObject();
        out.put("result", result);
        call.resolve(out);
    }

    @PluginMethod
    public void listCalendars(PluginCall call) {
        if (!hasCalendarPermission()) {
            call.reject("Calendar permission not granted");
            return;
        }
        String[] projection = {
            CalendarContract.Calendars._ID,
            CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
            CalendarContract.Calendars.CALENDAR_COLOR,
            CalendarContract.Calendars.ACCOUNT_NAME,
        };
        JSArray out = new JSArray();
        try (
            Cursor cursor = getContext()
                .getContentResolver()
                .query(
                    CalendarContract.Calendars.CONTENT_URI,
                    projection,
                    CalendarContract.Calendars.VISIBLE + " = 1",
                    null,
                    null
                )
        ) {
            if (cursor != null) {
                while (cursor.moveToNext()) {
                    JSObject cal = new JSObject();
                    cal.put("id", String.valueOf(cursor.getLong(0)));
                    cal.put("title", cursor.getString(1) != null ? cursor.getString(1) : "");
                    cal.put("color", colorToHex(cursor.getInt(2)));
                    JSObject source = new JSObject();
                    source.put("title", cursor.getString(3) != null ? cursor.getString(3) : "");
                    cal.put("source", source);
                    out.put(cal);
                }
            }
        }
        JSObject result = new JSObject();
        result.put("result", out);
        call.resolve(result);
    }

    @PluginMethod
    public void listEventsInRange(PluginCall call) {
        if (!hasCalendarPermission()) {
            call.reject("Calendar permission not granted");
            return;
        }
        Long from = call.getLong("from");
        Long to = call.getLong("to");
        if (from == null || to == null) {
            call.reject("Missing 'from'/'to'");
            return;
        }
        String[] projection = {
            CalendarContract.Instances.EVENT_ID,
            CalendarContract.Instances.BEGIN,
            CalendarContract.Instances.END,
            CalendarContract.Instances.TITLE,
            CalendarContract.Instances.DESCRIPTION,
            CalendarContract.Instances.EVENT_LOCATION,
            CalendarContract.Instances.ALL_DAY,
            CalendarContract.Instances.CALENDAR_ID,
            CalendarContract.Instances.AVAILABILITY,
        };
        Uri.Builder builder = CalendarContract.Instances.CONTENT_URI.buildUpon();
        ContentUris.appendId(builder, from);
        ContentUris.appendId(builder, to);
        JSArray out = new JSArray();
        try (Cursor cursor = getContext().getContentResolver().query(builder.build(), projection, null, null, null)) {
            if (cursor != null) {
                while (cursor.moveToNext()) {
                    boolean allDay = cursor.getInt(6) != 0;
                    JSObject ev = new JSObject();
                    ev.put("id", String.valueOf(cursor.getLong(0)));
                    ev.put("calendarId", String.valueOf(cursor.getLong(7)));
                    ev.put("title", cursor.getString(3) != null ? cursor.getString(3) : "");
                    ev.put("description", cursor.getString(4) != null ? cursor.getString(4) : "");
                    ev.put("location", cursor.getString(5) != null ? cursor.getString(5) : "");
                    ev.put("isAllDay", allDay);
                    ev.put("startDate", allDay ? fromAllDayUtcMs(cursor.getLong(1)) : cursor.getLong(1));
                    ev.put("endDate", allDay ? fromAllDayUtcMs(cursor.getLong(2)) : cursor.getLong(2));
                    ev.put("availability", availabilityFromNative(cursor.getInt(8)));
                    ev.put("alerts", new JSArray());
                    out.put(ev);
                }
            }
        }
        JSObject result = new JSObject();
        result.put("result", out);
        call.resolve(result);
    }

    @PluginMethod
    public void createEvent(PluginCall call) {
        if (!hasCalendarPermission()) {
            call.reject("Calendar permission not granted");
            return;
        }
        String calendarId = call.getString("calendarId");
        Long startDate = call.getLong("startDate");
        Long endDate = call.getLong("endDate");
        if (calendarId == null || startDate == null || endDate == null) {
            call.reject("Missing 'calendarId'/'startDate'/'endDate'");
            return;
        }
        boolean allDay = Boolean.TRUE.equals(call.getBoolean("isAllDay"));
        ContentValues values = eventContentValues(call, calendarId, allDay, startDate, endDate);
        Uri uri = getContext().getContentResolver().insert(CalendarContract.Events.CONTENT_URI, values);
        String id = uri != null ? uri.getLastPathSegment() : null;
        if (id == null) {
            call.reject("Failed to create event");
            return;
        }
        insertAlerts(Long.parseLong(id), call.getArray("alerts"));
        JSObject result = new JSObject();
        result.put("result", id);
        call.resolve(result);
    }

    @PluginMethod
    public void modifyEvent(PluginCall call) {
        if (!hasCalendarPermission()) {
            call.reject("Calendar permission not granted");
            return;
        }
        String id = call.getString("id");
        if (id == null) {
            call.reject("Missing 'id'");
            return;
        }
        JSObject data = call.getData();
        boolean allDay = Boolean.TRUE.equals(call.getBoolean("isAllDay"));
        ContentValues values = new ContentValues();
        if (data.has("title")) values.put(CalendarContract.Events.TITLE, call.getString("title"));
        if (data.has("description")) values.put(CalendarContract.Events.DESCRIPTION, call.getString("description"));
        if (data.has("location")) values.put(CalendarContract.Events.EVENT_LOCATION, call.getString("location"));
        if (data.has("calendarId")) values.put(CalendarContract.Events.CALENDAR_ID, call.getString("calendarId"));
        if (data.has("isAllDay")) {
            values.put(CalendarContract.Events.ALL_DAY, allDay ? 1 : 0);
            values.put(CalendarContract.Events.EVENT_TIMEZONE, allDay ? "UTC" : TimeZone.getDefault().getID());
        }
        if (data.has("startDate")) {
            long start = call.getLong("startDate");
            values.put(CalendarContract.Events.DTSTART, allDay ? toAllDayUtcMs(start) : start);
        }
        if (data.has("endDate")) {
            long end = call.getLong("endDate");
            values.put(CalendarContract.Events.DTEND, allDay ? toAllDayUtcMs(end) : end);
        }
        if (data.has("availability")) {
            values.put(CalendarContract.Events.AVAILABILITY, availabilityToNative(call.getString("availability")));
        }
        Uri uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, Long.parseLong(id));
        getContext().getContentResolver().update(uri, values, null, null);
        if (data.has("alerts")) {
            getContext()
                .getContentResolver()
                .delete(
                    CalendarContract.Reminders.CONTENT_URI,
                    CalendarContract.Reminders.EVENT_ID + " = ?",
                    new String[] { id }
                );
            insertAlerts(Long.parseLong(id), call.getArray("alerts"));
        }
        JSObject result = new JSObject();
        result.put("result", true);
        call.resolve(result);
    }

    @PluginMethod
    public void deleteEvent(PluginCall call) {
        if (!hasCalendarPermission()) {
            call.reject("Calendar permission not granted");
            return;
        }
        String id = call.getString("id");
        if (id == null) {
            call.reject("Missing 'id'");
            return;
        }
        Uri uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, Long.parseLong(id));
        getContext().getContentResolver().delete(uri, null, null);
        JSObject result = new JSObject();
        result.put("result", true);
        call.resolve(result);
    }

    private ContentValues eventContentValues(
        PluginCall call,
        String calendarId,
        boolean allDay,
        long startDate,
        long endDate
    ) {
        ContentValues values = new ContentValues();
        values.put(CalendarContract.Events.CALENDAR_ID, calendarId);
        values.put(CalendarContract.Events.TITLE, call.getString("title", ""));
        values.put(CalendarContract.Events.DESCRIPTION, call.getString("description", ""));
        values.put(CalendarContract.Events.EVENT_LOCATION, call.getString("location", ""));
        values.put(CalendarContract.Events.ALL_DAY, allDay ? 1 : 0);
        values.put(CalendarContract.Events.DTSTART, allDay ? toAllDayUtcMs(startDate) : startDate);
        values.put(CalendarContract.Events.EVENT_TIMEZONE, allDay ? "UTC" : TimeZone.getDefault().getID());
        values.put(CalendarContract.Events.AVAILABILITY, availabilityToNative(call.getString("availability")));
        JSObject recurrence = call.getObject("recurrence");
        if (recurrence != null) {
            values.put(CalendarContract.Events.RRULE, buildRRule(recurrence));
            values.put(CalendarContract.Events.DURATION, "P" + ((endDate - startDate) / 60000) + "M");
        } else {
            values.put(CalendarContract.Events.DTEND, allDay ? toAllDayUtcMs(endDate) : endDate);
        }
        return values;
    }

    private void insertAlerts(long eventId, JSArray alerts) {
        if (alerts == null) return;
        try {
            for (int i = 0; i < alerts.length(); i++) {
                long minutes = -alerts.getLong(i);
                ContentValues values = new ContentValues();
                values.put(CalendarContract.Reminders.EVENT_ID, eventId);
                values.put(CalendarContract.Reminders.MINUTES, minutes);
                values.put(CalendarContract.Reminders.METHOD, CalendarContract.Reminders.METHOD_ALERT);
                getContext().getContentResolver().insert(CalendarContract.Reminders.CONTENT_URI, values);
            }
        } catch (JSONException ignored) {
            // Malformed alerts payload — skip silently, event itself is already saved.
        }
    }

    private String buildRRule(JSObject recurrence) {
        String frequency = recurrence.getString("frequency", "daily");
        String freq;
        switch (frequency) {
            case "weekly":
                freq = "WEEKLY";
                break;
            case "monthly":
                freq = "MONTHLY";
                break;
            case "yearly":
                freq = "YEARLY";
                break;
            default:
                freq = "DAILY";
        }
        long interval = recurrence.optLong("interval", 1);
        StringBuilder rule = new StringBuilder("FREQ=").append(freq).append(";INTERVAL=").append(interval);
        if (recurrence.has("count")) {
            rule.append(";COUNT=").append(recurrence.optLong("count", 1));
        } else if (recurrence.has("end")) {
            Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
            cal.setTimeInMillis(recurrence.optLong("end", 0));
            rule
                .append(";UNTIL=")
                .append(
                    String.format(
                        "%04d%02d%02dT%02d%02d%02dZ",
                        cal.get(Calendar.YEAR),
                        cal.get(Calendar.MONTH) + 1,
                        cal.get(Calendar.DAY_OF_MONTH),
                        cal.get(Calendar.HOUR_OF_DAY),
                        cal.get(Calendar.MINUTE),
                        cal.get(Calendar.SECOND)
                    )
                );
        }
        return rule.toString();
    }

    private String colorToHex(int color) {
        return String.format("#%06X", 0xFFFFFF & color);
    }

    private int availabilityToNative(String value) {
        if ("free".equals(value)) return CalendarContract.Events.AVAILABILITY_FREE;
        if ("tentative".equals(value)) return CalendarContract.Events.AVAILABILITY_TENTATIVE;
        return CalendarContract.Events.AVAILABILITY_BUSY;
    }

    private String availabilityFromNative(int value) {
        if (value == CalendarContract.Events.AVAILABILITY_FREE) return "free";
        if (value == CalendarContract.Events.AVAILABILITY_TENTATIVE) return "tentative";
        return "busy";
    }

    /** Converts a device-local-midnight instant to the UTC-midnight instant
     *  (same calendar date) that Android's CalendarProvider requires for
     *  all-day events, per CalendarContract.Events docs. */
    private long toAllDayUtcMs(long localMs) {
        Calendar local = Calendar.getInstance();
        local.setTimeInMillis(localMs);
        Calendar utc = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        utc.clear();
        utc.set(local.get(Calendar.YEAR), local.get(Calendar.MONTH), local.get(Calendar.DAY_OF_MONTH), 0, 0, 0);
        return utc.getTimeInMillis();
    }

    /** Inverse of {@link #toAllDayUtcMs}: converts a UTC-midnight instant back
     *  to a device-local-midnight instant for the same calendar date, so JS's
     *  local-timezone `Date` getters recover the correct day. */
    private long fromAllDayUtcMs(long utcMs) {
        Calendar utc = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        utc.setTimeInMillis(utcMs);
        Calendar local = Calendar.getInstance();
        local.clear();
        local.set(utc.get(Calendar.YEAR), utc.get(Calendar.MONTH), utc.get(Calendar.DAY_OF_MONTH), 0, 0, 0);
        return local.getTimeInMillis();
    }
}
