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

public class VenaDashboardWidgetLarge extends AppWidgetProvider {

    public static void updateAppWidgets(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        SharedPreferences prefs = context.getSharedPreferences(WidgetBridgePlugin.PREFS_NAME, Context.MODE_PRIVATE);
        String rawJson = prefs.getString(WidgetBridgePlugin.KEY_WIDGET_DATA, null);

        String businessName = "Vena Pictures";
        String formattedRevenue = "Rp 48.5 jt";
        String formattedUnpaid = "Rp 14.2 jt";
        String activeProjects = "8";

        String item1Title = "Sarah & Dimas (Akad)";
        String item1Time = "14:00";
        String item2Title = "Rian & Jessica (Prewed)";
        String item2Time = "09:00";

        if (rawJson != null) {
            try {
                JSONObject root = new JSONObject(rawJson);
                businessName = root.optString("businessName", "Vena Pictures");

                if (root.has("stats")) {
                    JSONObject stats = root.getJSONObject("stats");
                    formattedRevenue = stats.optString("formattedRevenue", "Rp 0");
                    formattedUnpaid = stats.optString("formattedUnpaid", "Rp 0");
                    activeProjects = String.valueOf(stats.optInt("activeProjects", 0));
                }

                if (root.has("upcomingEvents")) {
                    JSONArray arr = root.getJSONArray("upcomingEvents");
                    if (arr.length() > 0) {
                        JSONObject e1 = arr.getJSONObject(0);
                        item1Title = e1.optString("title", "Sarah & Dimas (Akad)");
                        item1Time = e1.optString("time", "14:00");
                    }
                    if (arr.length() > 1) {
                        JSONObject e2 = arr.getJSONObject(1);
                        item2Title = e2.optString("title", "Rian & Jessica (Prewed)");
                        item2Time = e2.optString("time", "09:00");
                    }
                }
            } catch (Exception ignored) {}
        }

        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_large);
            views.setTextViewText(R.id.widget_large_business, businessName);

            // Metrics
            views.setTextViewText(R.id.widget_large_revenue, formattedRevenue);
            views.setTextViewText(R.id.widget_large_unpaid, formattedUnpaid);
            views.setTextViewText(R.id.widget_large_projects, activeProjects + " Acara");

            // Events
            views.setTextViewText(R.id.widget_large_item1_title, item1Title);
            views.setTextViewText(R.id.widget_large_item1_time, item1Time);
            views.setTextViewText(R.id.widget_large_item2_title, item2Title);
            views.setTextViewText(R.id.widget_large_item2_time, item2Time);

            // Quick Actions: +Klien
            Intent intentClient = new Intent(Intent.ACTION_VIEW, Uri.parse("weddfin://clients?action=new"));
            intentClient.setClass(context, MainActivity.class);
            views.setOnClickPendingIntent(R.id.widget_large_btn_client, PendingIntent.getActivity(
                context, appWidgetId * 10 + 4, intentClient, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            ));

            // Quick Actions: Kalender
            Intent intentCal = new Intent(Intent.ACTION_VIEW, Uri.parse("weddfin://calendar"));
            intentCal.setClass(context, MainActivity.class);
            views.setOnClickPendingIntent(R.id.widget_large_btn_cal, PendingIntent.getActivity(
                context, appWidgetId * 10 + 5, intentCal, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            ));

            // Quick Actions: Finance
            Intent intentFin = new Intent(Intent.ACTION_VIEW, Uri.parse("weddfin://finance"));
            intentFin.setClass(context, MainActivity.class);
            views.setOnClickPendingIntent(R.id.widget_large_btn_fin, PendingIntent.getActivity(
                context, appWidgetId * 10 + 6, intentFin, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            ));

            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        updateAppWidgets(context, appWidgetManager, appWidgetIds);
    }
}
