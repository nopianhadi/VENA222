import WidgetKit
import SwiftUI

// MARK: - Models
struct WidgetEventData: Decodable {
    let id: String
    let title: String
    let eventType: String?
    let date: String
    let time: String
    let location: String
    let formattedCountdown: String?
    let deepLink: String
}

struct WidgetStatsData: Decodable {
    let activeProjects: Int
    let formattedRevenue: String
    let formattedUnpaid: String
}

struct WidgetPayloadData: Decodable {
    let businessName: String
    let nextEvent: WidgetEventData?
    let upcomingEvents: [WidgetEventData]?
    let stats: WidgetStatsData?
}

// MARK: - Timeline Entry
struct VenaEntry: TimelineEntry {
    let date: Date
    let payload: WidgetPayloadData?
}

// MARK: - Timeline Provider
struct VenaTimelineProvider: TimelineProvider {
    let appGroupId = "group.com.weddfin.app"
    let widgetDataKey = "widget_data_json"

    private func loadPayload() -> WidgetPayloadData? {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let jsonString = defaults.string(forKey: widgetDataKey),
              let data = jsonString.data(using: .utf8) else {
            return nil
        }
        return try? JSONDecoder().decode(WidgetPayloadData.self, from: data)
    }

    func placeholder(in context: Context) -> VenaEntry {
        VenaEntry(date: Date(), payload: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (VenaEntry) -> Void) {
        let entry = VenaEntry(date: Date(), payload: loadPayload())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<VenaEntry>) -> Void) {
        let entry = VenaEntry(date: Date(), payload: loadPayload())
        // Refresh every 30 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

// MARK: - Widget Views
struct VenaSmallWidgetView: View {
    let entry: VenaEntry

    var body: some View {
        let event = entry.payload?.nextEvent
        let business = entry.payload?.businessName ?? "Vena Pictures"

        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Circle()
                    .fill(Color.green)
                    .frame(width: 6, height: 6)
                Text(business.uppercased())
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(.secondary)
                Spacer()
                Image(systemName: "clock")
                    .font(.system(size: 10))
                    .foregroundColor(.secondary)
            }

            Spacer()

            Text(event?.formattedCountdown ?? "Hari Ini")
                .font(.system(size: 9, weight: .semibold))
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(Color.indigo.opacity(0.2))
                .foregroundColor(.indigo)
                .cornerRadius(6)

            Text(event?.title ?? "Sarah & Dimas")
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(.primary)
                .lineLimit(1)

            Text("\(event?.time ?? "14:00") WIB")
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.secondary)

            Spacer()

            HStack {
                Text(event?.location ?? "Hotel Mulia")
                    .font(.system(size: 9))
                    .foregroundColor(.secondary)
                    .lineLimit(1)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(.indigo)
            }
        }
        .padding(12)
        .widgetURL(URL(string: event?.deepLink ?? "weddfin://calendar"))
    }
}

struct VenaMediumWidgetView: View {
    let entry: VenaEntry

    var body: some View {
        let e1 = entry.payload?.nextEvent
        let e2 = entry.payload?.upcomingEvents?.count ?? 0 > 1 ? entry.payload?.upcomingEvents?[1] : nil

        VStack(spacing: 8) {
            HStack {
                Label("Agenda Pemotretan", systemImage: "calendar")
                    .font(.system(size: 12, weight: .bold))
                Spacer()
                Link(destination: URL(string: "weddfin://calendar")!) {
                    Text("Kalender ➔")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(.indigo)
                }
            }

            HStack(spacing: 8) {
                // Event 1
                Link(destination: URL(string: e1?.deepLink ?? "weddfin://calendar")!) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(e1?.formattedCountdown ?? "Hari Ini")
                            .font(.system(size: 8, weight: .bold))
                            .foregroundColor(.indigo)
                        Text(e1?.title ?? "Sarah & Dimas")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.primary)
                            .lineLimit(1)
                        Text("\(e1?.time ?? "14:00") - \(e1?.location ?? "Venue")")
                            .font(.system(size: 9))
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(8)
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(12)
                }

                // Event 2
                Link(destination: URL(string: e2?.deepLink ?? "weddfin://calendar")!) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text("Mendatang")
                            .font(.system(size: 8, weight: .bold))
                            .foregroundColor(.green)
                        Text(e2?.title ?? "Rian & Jessica")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.primary)
                            .lineLimit(1)
                        Text("\(e2?.time ?? "09:00") - \(e2?.location ?? "Mangunan")")
                            .font(.system(size: 9))
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(8)
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(12)
                }
            }

            HStack {
                Text("\(entry.payload?.stats?.activeProjects ?? 8) Proyek Aktif")
                    .font(.system(size: 9))
                    .foregroundColor(.secondary)
                Spacer()
                Text("Omset: \(entry.payload?.stats?.formattedRevenue ?? "Rp 48.5 jt")")
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundColor(.green)
            }
        }
        .padding(12)
    }
}

// MARK: - Main Widget Bundle
@main
struct VenaWidgetBundle: WidgetBundle {
    var body: some Widget {
        VenaHomeWidget()
    }
}

struct VenaHomeWidget: Widget {
    let kind: String = "VenaHomeWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: VenaTimelineProvider()) { entry in
            VenaWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Vena Pictures")
        .description("Pantau jadwal pemotretan dan performa studio pernikahan Anda.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct VenaWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: VenaEntry

    var body: some View {
        switch family {
        case .systemSmall:
            VenaSmallWidgetView(entry: entry)
        case .systemMedium:
            VenaMediumWidgetView(entry: entry)
        default:
            VenaMediumWidgetView(entry: entry)
        }
    }
}
