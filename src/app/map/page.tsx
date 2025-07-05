import { EventMap } from "@/components/map/event-map"
import { createClient } from "@/lib/supabase/server"

export default async function MapPage() {
  const supabase = await createClient()

  // Fetch all active events
  const { data: events } = await supabase
    .from("events")
    .select(`
      *,
      profiles (
        full_name
      )
    `)
    .gte("date", new Date().toISOString())
    .order("date", { ascending: true })

  return (
    <div className="h-screen">
      <EventMap events={events || []} />
    </div>
  )
}
