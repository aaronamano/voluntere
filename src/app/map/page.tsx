import { EventMap } from "@/components/map/event-map"
import { createClient } from "@/lib/supabase/server"

export default async function MapPage() {
  const supabase = await createClient()

  // Fetch all active events
  const { data: events } = await supabase
    .from("events")
    .select(`
      id,
      title,
      description,
      date,
      location,
      volunteers_needed,
      latitude,
      longitude,
      host: host_id (
        full_name
      )
    `)
    .gte("date", new Date().toISOString())
    .order("date", { ascending: true })

  // Map the events to match the Event interface
  const mappedEvents =
    (events || []).map((event: any) => ({
      ...event,
      host_id: Array.isArray(event.host) ? event.host[0] : event.host,
    })) ?? []

  return (
    <div className="h-screen">
      <EventMap initialEvents={mappedEvents} />
    </div>
  )
}
