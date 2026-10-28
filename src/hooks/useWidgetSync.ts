import { useEffect } from 'react';
import { useSimplifiedData } from '../contexts/SimplifiedDataContext';
import { Profile } from '../types';
import { buildWidgetPayload, syncWidgetData } from '../services/widgetBridge';

export function useWidgetSync(profile?: Profile) {
  const { calendarEvents, projects, totals } = useSimplifiedData();

  useEffect(() => {
    // Only trigger if data has been fetched or totals are present
    const payload = buildWidgetPayload({
      events: calendarEvents,
      projects,
      profile,
      totals,
    });

    void syncWidgetData(payload);
  }, [calendarEvents, projects, totals, profile?.companyName, profile?.brandColor]);
}
