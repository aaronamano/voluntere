import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch user's events and registrations
  const { data: hostedEvents } = await supabase
    .from("events")
    .select("*")
    .eq("host_id", user.id)
    .order("created_at", { ascending: false })

  const { data: registrations } = await supabase
    .from("event_registrations")
    .select(`
      *,
      events (
        id,
        title,
        date,
        location
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return <DashboardContent user={user} hostedEvents={hostedEvents || []} registrations={registrations || []} />
}
