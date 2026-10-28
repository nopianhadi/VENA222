package com.weddfin.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;
import org.json.JSONObject;

public class VenaScheduleWidgetSmall extends AppWidgetProvider {

    public static void updateAppWidgets(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        SharedPreferences prefs = context.getSharedPreferences(WidgetBridgePlugin.PREFS_NAME, Context.MODE_PRIVATE);
        String rawJson = prefs.getString(WidgetBridgePlugin.KEY_WIDGET_DATA, null);

        String businessName = "Vena Pictures";
        String eventTitle = "Belum Ada Jadwal";
        String eventCountdown = "Hari Ini";
        String eventTime = "--:--";
        String eventLocation = "Buka aplikasi";
        String deepLinkUri = "weddfin://calendar";

        if (rawJson != null) {
            try {
                JSONObject root = new JSONObject(rawJson);
                businessName = root.optString("businessName", "Vena Pictures");

                if (root.has("nextEvent") && !root.isNull("nextEvent")) {
                    JSONObject next = root.getJSONObject("nextEvent");
                    eventTitle = next.optString("title", "Acara Pemotretan");
                    eventCountdown = next.optString("formattedCountdown", "Hari Ini");
                    eventTime = next.optString("time", "14:00") + " WIB";
                    eventLocation = next.optString("location", "Venue Utama");
                    deepLinkUri = next.optString("deepLink", "weddfin://calendar");
                }
            } catch (Exception ignored) {}
        }

        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_small);
            views.setTextViewText(R.id.widget_small_business, businessName);
            views.setTextViewText(R.id.widget_small_countdown, eventCountdown);
            views.setTextViewText(R.id.widget_small_title, eventTitle);
            views.setTextViewText(R.id.widget_small_time, eventTime);
            views.setTextViewText(R.id.widget_small_location, eventLocation);

            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(deepLinkUri));
            intent.setClass(context, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                appWidgetId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_small_container, pendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        updateAppWidgets(context, appWidgetManager, appWidgetIds);
    }
}
