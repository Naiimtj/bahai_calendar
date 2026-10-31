package com.bahaicalendar.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.util.AtomicFile;
import android.util.TypedValue;
import android.view.View;
import android.widget.RemoteViews;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class BahaiWidgetProvider extends AppWidgetProvider {
    private static final int[] EVENT_SLOT_IDS = {
        R.id.widget_cell_event,
        R.id.widget_cell_event_2,
        R.id.widget_cell_event_3
    };

    public static class BadiDate extends BahaiWidgetProvider {}
    public static class GregorianDate extends BahaiWidgetProvider {}
    public static class BadiMonth extends BahaiWidgetProvider {}
    public static class GregorianMonth extends BahaiWidgetProvider {}
    public static class FourWeeks extends BahaiWidgetProvider {}
    public static class FullGregorianMonth extends BahaiWidgetProvider {}
    public static class FullBadiMonth extends BahaiWidgetProvider {}

    public static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        Class<?>[] providers = { BadiDate.class, GregorianDate.class, BadiMonth.class,
            GregorianMonth.class, FourWeeks.class, FullGregorianMonth.class, FullBadiMonth.class };
        for (Class<?> provider : providers) {
            int[] ids = manager.getAppWidgetIds(new ComponentName(context, provider));
            for (int id : ids) render(context, manager, id, provider);
        }
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) render(context, manager, id, getClass());
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (Intent.ACTION_DATE_CHANGED.equals(intent.getAction())
            || Intent.ACTION_TIMEZONE_CHANGED.equals(intent.getAction())) {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            onUpdate(context, manager, manager.getAppWidgetIds(new ComponentName(context, getClass())));
        }
    }

    private static void render(Context context, AppWidgetManager manager, int id, Class<?> provider) {
        JSONObject snapshot = load(context);
        Calendar displayDay = Calendar.getInstance();
        JSONObject today = null;
        HashMap<String, JSONObject> days = new HashMap<>();
        if (snapshot != null) {
            JSONArray entries = snapshot.optJSONArray("days");
            for (int index = 0; entries != null && index < entries.length(); index++) {
                JSONObject day = entries.optJSONObject(index);
                if (day != null) days.put(day.optString("date"), day);
            }
            JSONObject calendarDay = days.get(key(displayDay));
            if (calendarDay != null && calendarDay.has("sunset")
                && System.currentTimeMillis() >= calendarDay.optDouble("sunset")) {
                displayDay.add(Calendar.DAY_OF_MONTH, 1);
            }
            today = days.get(key(displayDay));
        }

        boolean dateWidget = provider == BadiDate.class || provider == GregorianDate.class;
        boolean compactMonthWidget = provider == BadiMonth.class || provider == GregorianMonth.class;
        int layout = dateWidget ? R.layout.widget_date
            : (compactMonthWidget ? R.layout.widget_month : R.layout.widget_calendar);
        RemoteViews views = new RemoteViews(context.getPackageName(), layout);
        views.setInt(dateWidget ? R.id.widget_date : R.id.widget_calendar,
            "setLayoutDirection", snapshot != null && snapshot.optBoolean("rtl")
                ? View.LAYOUT_DIRECTION_RTL : View.LAYOUT_DIRECTION_LTR);
        Intent launch = new Intent(context, MainActivity.class);
        launch.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        views.setOnClickPendingIntent(dateWidget ? R.id.widget_date : R.id.widget_calendar,
            PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        if (today == null) {
            views.setTextViewText(R.id.widget_heading, context.getString(R.string.app_name));
            if (dateWidget) {
                views.setTextViewText(R.id.widget_number, "--");
                views.setTextViewText(R.id.widget_subtitle, "");
                views.setTextViewText(R.id.widget_event, "");
                views.setTextViewText(R.id.widget_footer, "");
            } else {
                views.removeAllViews(R.id.widget_weekdays);
                views.removeAllViews(R.id.widget_grid);
            }
        } else if (dateWidget) {
            renderDate(context, views, snapshot, today, displayDay, provider == BadiDate.class);
        } else {
            renderGrid(context, views, snapshot, days, today, displayDay, provider);
        }
        manager.updateAppWidget(id, views);
    }

    private static JSONObject load(Context context) {
        try {
            byte[] bytes = new AtomicFile(new File(context.getFilesDir(), "widget-snapshot.json")).readFully();
            JSONObject snapshot = new JSONObject(new String(bytes, StandardCharsets.UTF_8));
            return snapshot.optInt("version") == 2 ? snapshot : null;
        } catch (IOException | JSONException error) {
            return null;
        }
    }

    private static void renderDate(Context context, RemoteViews views, JSONObject snapshot, JSONObject day,
        Calendar now, boolean badi) {
        Locale locale = locale(snapshot);
        String month = month(snapshot, day.optInt("month"));
        views.setTextViewText(R.id.widget_heading, badi
            ? month + " (" + meaning(snapshot, day.optInt("month")) + ")"
            : format(now.getTime(), "LLLL yyyy", locale));
        views.setTextViewText(R.id.widget_subtitle, badi
            ? badiWeekday(snapshot, now) : format(now.getTime(), "EEEE", locale));
        views.setTextViewText(R.id.widget_number, badi
            ? String.valueOf(day.optInt("day")) : format(now.getTime(), "d", locale));
        views.setTextViewText(R.id.widget_footer, badi
            ? format(now.getTime(), "EEE d MMM", locale)
            : day.optInt("day") + " " + month + " " + day.optInt("year"));
        JSONArray events = day.optJSONArray("events");
        views.setTextViewText(R.id.widget_event, "");
        views.setInt(R.id.widget_event, "setBackgroundColor", Color.TRANSPARENT);
        views.setViewPadding(R.id.widget_event, 0, 0, 0, 0);
        for (int index = 0; events != null && index < events.length(); index++) {
            JSONObject event = events.optJSONObject(index);
            if (event != null && !"personal".equals(event.optString("kind"))) {
                views.setTextViewText(R.id.widget_event, event.optString("title"));
                int color = eventColor(context, event);
                views.setInt(R.id.widget_event, "setBackgroundColor", withAlpha(color, 51));
                views.setTextColor(R.id.widget_event, context.getColor(R.color.widget_text));
                int horizontal = dp(context, 6);
                int vertical = dp(context, 2);
                views.setViewPadding(R.id.widget_event, horizontal, vertical, horizontal, vertical);
                break;
            }
        }
    }

    private static void renderGrid(Context context, RemoteViews views, JSONObject snapshot,
        HashMap<String, JSONObject> days, JSONObject today, Calendar displayDay, Class<?> provider) {
        Calendar now = (Calendar) displayDay.clone();
        boolean badi = provider == BadiMonth.class || provider == FullBadiMonth.class;
        boolean compact = provider == BadiMonth.class || provider == GregorianMonth.class;
        boolean fourWeeks = provider == FourWeeks.class;
        Locale locale = locale(snapshot);
        String heading = badi
            ? month(snapshot, today.optInt("month")) + " " + today.optInt("year")
            : format(now.getTime(), "LLLL yyyy", locale);
        if (fourWeeks) heading += "  /  " + month(snapshot, today.optInt("month")) + " " + today.optInt("year");
        views.setTextViewText(R.id.widget_heading, heading);
        views.removeAllViews(R.id.widget_weekdays);
        views.removeAllViews(R.id.widget_grid);
        int cellLayout = compact ? R.layout.widget_month_cell : R.layout.widget_cell;
        JSONArray initials = snapshot.optJSONArray("weekdayInitials");
        RemoteViews weekdayRow = new RemoteViews(context.getPackageName(), R.layout.widget_weekday_row);
        for (int col = 0; col < 7; col++) {
            RemoteViews cell = new RemoteViews(context.getPackageName(), cellLayout);
            cell.setTextViewText(R.id.widget_cell_number,
                initials != null ? initials.optString(col, "") : "");
            cell.setTextColor(R.id.widget_cell_number, context.getColor(R.color.widget_muted));
            if (!compact) clearEventSlots(cell);
            weekdayRow.addView(R.id.widget_row, cell);
        }
        views.addView(R.id.widget_weekdays, weekdayRow);

        if (badi) now.add(Calendar.DAY_OF_MONTH, 1 - today.optInt("day"));
        else if (!fourWeeks) now.set(Calendar.DAY_OF_MONTH, 1);
        int firstWeekday = snapshot.optInt("firstWeekday", 1);
        int leading = (now.get(Calendar.DAY_OF_WEEK) - 1 - firstWeekday + 14) % 7;
        int length = badi ? (today.optInt("month") == 0 ? badiMonthLength(days, today) : 19)
            : now.getActualMaximum(Calendar.DAY_OF_MONTH);
        int rows = fourWeeks ? 4 : (leading + length + 6) / 7;
        now.add(Calendar.DAY_OF_MONTH, -leading);
        String todayKey = key(displayDay);
        for (int row = 0; row < rows; row++) {
            RemoteViews rowView = new RemoteViews(context.getPackageName(), R.layout.widget_row);
            for (int col = 0; col < 7; col++) {
                boolean inMonth = fourWeeks || (row * 7 + col >= leading && row * 7 + col < leading + length);
                JSONObject entry = days.get(key(now));
                RemoteViews cell = new RemoteViews(context.getPackageName(), cellLayout);
                String number = badi ? (entry == null ? "" : String.valueOf(entry.optInt("day")))
                    : String.valueOf(now.get(Calendar.DAY_OF_MONTH));
                cell.setTextViewText(R.id.widget_cell_number, inMonth ? number : "");
                boolean isToday = todayKey.equals(key(now));
                JSONObject starEvent = inMonth ? firstBahaiEvent(entry) : null;
                renderDayNumber(context, cell, starEvent, inMonth && isToday, compact);
                if (!compact) {
                    clearEventSlots(cell);
                    String secondaryText = fourWeeks && entry != null ? String.valueOf(entry.optInt("day")) : "";
                    JSONArray events = inMonth && entry != null ? entry.optJSONArray("events") : null;
                    int nextSlot = 0;
                    if (!secondaryText.isEmpty()) {
                        showPlainLabel(context, cell, EVENT_SLOT_IDS[nextSlot], secondaryText);
                        nextSlot++;
                    }
                    int eventLimit = rows == 6 ? 2 : 3;
                    for (int index = 0; events != null && index < events.length(); index++) {
                        if (nextSlot >= EVENT_SLOT_IDS.length || index >= eventLimit) break;
                        JSONObject event = events.optJSONObject(index);
                        if (event == null) continue;
                        showEventChip(context, cell, EVENT_SLOT_IDS[nextSlot],
                            event.optString("title"), eventColor(context, event));
                        nextSlot++;
                    }
                }
                rowView.addView(R.id.widget_row, cell);
                now.add(Calendar.DAY_OF_MONTH, 1);
            }
            views.addView(R.id.widget_grid, rowView);
        }
    }

    private static int badiMonthLength(HashMap<String, JSONObject> days, JSONObject today) {
        int length = 4;
        for (JSONObject day : days.values()) {
            if (day.optInt("year") == today.optInt("year") && day.optInt("month") == 0) {
                length = Math.max(length, day.optInt("day"));
            }
        }
        return length;
    }

    private static String month(JSONObject snapshot, int index) {
        JSONArray months = snapshot.optJSONArray("months");
        JSONObject value = months == null ? null : months.optJSONObject(index);
        return value == null ? "" : value.optString("name");
    }

    private static String meaning(JSONObject snapshot, int index) {
        JSONArray months = snapshot.optJSONArray("months");
        JSONObject value = months == null ? null : months.optJSONObject(index);
        return value == null ? "" : value.optString("meaning");
    }

    private static String badiWeekday(JSONObject snapshot, Calendar now) {
        JSONArray weekdays = snapshot.optJSONArray("badiWeekdays");
        return weekdays == null ? "" : weekdays.optString(now.get(Calendar.DAY_OF_WEEK) - 1, "");
    }

    private static Locale locale(JSONObject snapshot) {
        return Locale.forLanguageTag(snapshot.optString("lang", "en"));
    }

    private static String format(Date date, String pattern, Locale locale) {
        return new SimpleDateFormat(pattern, locale).format(date);
    }

    private static String key(Calendar date) {
        return String.format(Locale.ROOT, "%04d-%02d-%02d", date.get(Calendar.YEAR),
            date.get(Calendar.MONTH) + 1, date.get(Calendar.DAY_OF_MONTH));
    }

    private static int eventColor(Context context, JSONObject event) {
        String kind = event.optString("kind");
        if ("holyDay".equals(kind)) return context.getColor(R.color.widget_holy_day);
        if ("feast".equals(kind)) return context.getColor(R.color.widget_feast);
        if ("ridvan".equals(kind)) return context.getColor(R.color.widget_ridvan);
        if ("personal".equals(kind)) {
            String color = event.optString("color", "");
            if (!color.isEmpty()) {
                try {
                    return Color.parseColor(color);
                } catch (IllegalArgumentException error) {
                    return context.getColor(R.color.widget_accent);
                }
            }
        }
        return context.getColor(R.color.widget_accent);
    }

    private static JSONObject firstBahaiEvent(JSONObject day) {
        if (day == null) return null;
        JSONArray events = day.optJSONArray("events");
        for (int index = 0; events != null && index < events.length(); index++) {
            JSONObject event = events.optJSONObject(index);
            if (event != null && !"personal".equals(event.optString("kind"))) return event;
        }
        return null;
    }

    private static int withAlpha(int color, int alpha) {
        return Color.argb(alpha, Color.red(color), Color.green(color), Color.blue(color));
    }

    private static void clearEventSlots(RemoteViews cell) {
        for (int viewId : EVENT_SLOT_IDS) {
            cell.setTextViewText(viewId, "");
            cell.setInt(viewId, "setBackgroundColor", Color.TRANSPARENT);
            cell.setViewPadding(viewId, 0, 0, 0, 0);
            cell.setViewVisibility(viewId, View.GONE);
        }
    }

    private static void showPlainLabel(Context context, RemoteViews cell, int viewId, String text) {
        cell.setTextViewText(viewId, text);
        cell.setBoolean(viewId, "setSingleLine", true);
        cell.setTextColor(viewId, context.getColor(R.color.widget_muted));
        cell.setInt(viewId, "setBackgroundColor", Color.TRANSPARENT);
        cell.setViewPadding(viewId, 0, 0, 0, 0);
        cell.setViewVisibility(viewId, View.VISIBLE);
    }

    private static void renderDayNumber(Context context, RemoteViews cell,
        JSONObject starEvent, boolean today, boolean compact) {
        cell.setTextColor(R.id.widget_cell_number, today ? Color.WHITE : context.getColor(R.color.widget_text));
        cell.setTextViewTextSize(R.id.widget_cell_number, TypedValue.COMPLEX_UNIT_DIP, compact ? 11 : 13);
        Bitmap badge = null;
        if (starEvent != null || today) {
            int size = dp(context, compact ? 21 : 22);
            badge = starEvent != null
                ? starBitmap(size, withAlpha(eventColor(context, starEvent), 115))
                : Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        }
        if (today) {
            Canvas canvas = new Canvas(badge);
            Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
            paint.setStyle(Paint.Style.FILL);
            paint.setColor(context.getColor(R.color.widget_today));
            float center = badge.getWidth() / 2f;
            canvas.drawCircle(center, center, dp(context, compact ? 18 : 19) / 2f, paint);
        }
        cell.setImageViewBitmap(R.id.widget_cell_badge, badge);
        cell.setViewVisibility(R.id.widget_cell_badge, badge == null ? View.INVISIBLE : View.VISIBLE);
    }

    private static void showEventChip(Context context, RemoteViews cell, int viewId,
        String text, int color) {
        cell.setTextViewText(viewId, text);
        cell.setBoolean(viewId, "setSingleLine", true);
        cell.setTextColor(viewId, context.getColor(R.color.widget_text));
        cell.setInt(viewId, "setBackgroundColor", withAlpha(color, 51));
        int horizontal = dp(context, 3);
        int vertical = dp(context, 1);
        cell.setViewPadding(viewId, horizontal, vertical, horizontal, vertical);
        cell.setViewVisibility(viewId, View.VISIBLE);
    }

    private static int dp(Context context, int value) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value,
            context.getResources().getDisplayMetrics()));
    }

    private static Bitmap starBitmap(int sizePx, int color) {
        Bitmap bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(color);

        float outer = (sizePx / 2f) - 1f;
        float inner = outer * 7.2f / 11f;
        float center = sizePx / 2f;
        Path path = new Path();
        for (int index = 0; index < 18; index++) {
            double angle = (index * Math.PI / 9d) - (Math.PI / 2d);
            float radius = index % 2 == 0 ? outer : inner;
            float x = center + (float) (Math.cos(angle) * radius);
            float y = center + (float) (Math.sin(angle) * radius);
            if (index == 0) path.moveTo(x, y);
            else path.lineTo(x, y);
        }
        path.close();
        canvas.drawPath(path, paint);
        return bitmap;
    }
}