import Foundation
import Capacitor
import WidgetKit

@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "updateWidgetData", returnType: CAPPluginReturnPromise)
    ]

    private let appGroupId = "group.com.weddfin.app"
    private let widgetDataKey = "widget_data_json"

    @objc func updateWidgetData(_ call: CAPPluginCall) {
        guard let json = call.getString("json") else {
            call.reject("Data json cannot be null")
            return
        }

        if let sharedDefaults = UserDefaults(suiteName: appGroupId) {
            sharedDefaults.set(json, forKey: widgetDataKey)
            sharedDefaults.synchronize()

            // Reload all WidgetKit timelines immediately
            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadAllTimelines()
            }
            call.resolve()
        } else {
            // Fallback to standard UserDefaults if App Group is not configured yet
            UserDefaults.standard.set(json, forKey: widgetDataKey)
            call.resolve()
        }
    }
}
