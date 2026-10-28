package com.weddfin.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

public class VenaScheduleWidgetMedium extends AppWidgetProvider {

    public static void updateAppWidgets(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        SharedPreferences prefs = context.getSharedPreferences(WidgetBridgePlugin.PREFS_NAME, Context.MODE_PRIVATE);
        String rawJson = prefs.getString(WidgetBridgePlugin.KEY_WIDGET_DATA, null);

        String businessName = "Vena Pictures";
        String event1Title = "Belum Ada Acara";
        String event1Time = "--:--";
        String event1Countdown = "Hari Ini";
        String event1Location = "-";
        String deepLink1 = "weddfin://calendar";

        String event2Title = "Jadwal Berikutnya";
        String event2Time = "--:--";
        String event2Location = "-";
        String deepLink2 = "weddfin://calendar";

        String activeProjects = "0";
        String formattedRevenue = "Rp 0";

        if (rawJson != null) {
            try {
                JSONObject root = new JSONObject(rawJson);
                businessName = root.optString("businessName", "Vena Pictures");

                if (root.has("nextEvent") && !root.isNull("nextEvent")) {
                    JSONObject e1 = root.getJSONObject("nextEvent");
                    event1Title = e1.optString("title", "Acara Pemotretan");
                    event1Time = e1.optString("time", "14:00") + " WIB";
                    event1Countdown = e1.optString("formattedCountdown", "Hari Ini");
                    event1Location = e1.optString("location", "Venue Utama");
                    deepLink1 = e1.optString("deepLink", "weddfin://calendar");
                }

                if (root.has("upcomingEvents")) {
                    JSONArray arr = root.getJSONArray("upcomingEvents");
                    if (arr.length() > 1) {
                        JSONObject e2 = arr.getJSONObject(1);
                        event2Title = e2.optString("title", "Acara Berikutnya");
                        event2Time = e2.optString("time", "09:00") + " WIB";
                        event2Location = e2.optString("location", "Lokasi Acara");
                        deepLink2 = e2.optString("deepLink", "weddfin://calendar");
                    }
                }

                if (root.has("stats")) {
                    JSONObject stats = root.getJSONObject("stats");
                    activeProjects = String.valueOf(stats.optInt("activeProjects", 0));
                    formattedRevenue = stats.optString("formattedRevenue", "Rp 0");
                }
            } catch (Exception ignored) {}
        }

        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_medium);
            views.setTextViewText(R.id.widget_medium_business, businessName);

            // Card 1
            views.setTextViewText(R.id.widget_medium_card1_countdown, event1Countdown);
            views.setTextViewText(R.id.widget_medium_card1_time, event1Time);
            views.setTextViewText(R.id.widget_medium_card1_title, event1Title);
            views.setTextViewText(R.id.widget_medium_card1_location, event1Location);

            Intent intent1 = new Intent(Intent.ACTION_VIEW, Uri.parse(deepLink1));
            intent1.setClass(context, MainActivity.class);
            intent1.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            views.setOnClickPendingIntent(R.id.widget_medium_card1, PendingIntent.getActivity(
                context, appWidgetId * 10 + 1, intent1, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            ));

            // Card 2
            views.setTextViewText(R.id.widget_medium_card2_time, event2Time);
            views.setTextViewText(R.id.widget_medium_card2_title, event2Title);
            views.setTextViewText(R.id.widget_medium_card2_location, event2Location);

            Intent intent2 = new Intent(Intent.ACTION_VIEW, Uri.parse(deepLink2));
            intent2.setClass(context, MainActivity.class);
            intent2.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            views.setOnClickPendingIntent(R.id.widget_medium_card2, PendingIntent.getActivity(
                context, appWidgetId * 10 + 2, intent2, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            ));

            // Bottom stats
            views.setTextViewText(R.id.widget_medium_projects, activeProjects + " Proyek Aktif");
            views.setTextViewText(R.id.widget_medium_revenue, "Omset: " + formattedRevenue);

            // Header click to open calendar
            Intent intentCal = new Intent(Intent.ACTION_VIEW, Uri.parse("weddfin://calendar"));
            intentCal.setClass(context, MainActivity.class);
            views.setOnClickPendingIntent(R.id.widget_medium_header_btn, PendingIntent.getActivity(
                context, appWidgetId * 10 + 3, intentCal, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            ));

            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        updateAppWidgets(context, appWidgetManager, appWidgetIds);
    }
}
