package com.weddfin.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    public static final String PREFS_NAME = "weddfin_widget_prefs";
    public static final String KEY_WIDGET_DATA = "widget_data_json";

    @PluginMethod
    public void updateWidgetData(PluginCall call) {
        String json = call.getString("json");
        if (json == null) {
            call.reject("Data json cannot be null");
            return;
        }

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_WIDGET_DATA, json).apply();

        // Broadcast update to all Vena Pictures home screen widgets
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);

        // Small widget
        int[] smallIds = appWidgetManager.getAppWidgetIds(new ComponentName(context, VenaScheduleWidgetSmall.class));
        if (smallIds != null && smallIds.length > 0) {
            VenaScheduleWidgetSmall.updateAppWidgets(context, appWidgetManager, smallIds);
        }

        // Medium widget
        int[] mediumIds = appWidgetManager.getAppWidgetIds(new ComponentName(context, VenaScheduleWidgetMedium.class));
        if (mediumIds != null && mediumIds.length > 0) {
            VenaScheduleWidgetMedium.updateAppWidgets(context, appWidgetManager, mediumIds);
        }

        // Large widget
        int[] largeIds = appWidgetManager.getAppWidgetIds(new ComponentName(context, VenaDashboardWidgetLarge.class));
        if (largeIds != null && largeIds.length > 0) {
            VenaDashboardWidgetLarge.updateAppWidgets(context, appWidgetManager, largeIds);
        }

        call.resolve();
    }
}
