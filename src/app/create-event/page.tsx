import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CreateEventForm } from "@/components/events/create-event-form"

export default async function CreateEventPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Event</h1>
          <CreateEventForm />
        </div>
      </div>
    </div>
  )
}
