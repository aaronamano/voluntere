"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Plus, LogOut, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"

interface DashboardContentProps {
  user: User
  hostedEvents: any[]
  registrations: {
    id: string
    message: string | null
    event_slots: {
      id: string
      date: string
      start_time: string
      end_time: string
      volunteers_needed: number
    }
    events: {
      id: string
      title: string
      description: string
      location: string
    }
  }[]
}

export function DashboardContent({ user, hostedEvents, registrations: initialRegistrations }: DashboardContentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [registrations, setRegistrations] = useState(initialRegistrations)
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchRegistrations() {
      setIsLoadingRegistrations(true)
      setError(null)

      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          id,
          message,
          event_slots (
            id,
            date,
            start_time,
            end_time,
            volunteers_needed
          ),
          events (
            id,
            title,
            description,
            location
          )
        `)
        .eq('user_id', user.id)

      if (error) {
        setError('Failed to load registrations')
        console.error('Error:', error)
      } else {
        // Map data to match expected types
        setRegistrations(
          (data || []).map((item: any) => ({
            id: String(item.id),
            message: item.message,
            event_slots: Array.isArray(item.event_slots) ? {
              id: String(item.event_slots[0]?.id ?? ""),
              date: String(item.event_slots[0]?.date ?? ""),
              start_time: String(item.event_slots[0]?.start_time ?? ""),
              end_time: String(item.event_slots[0]?.end_time ?? ""),
              volunteers_needed: Number(item.event_slots[0]?.volunteers_needed ?? 0),
            } : {
              id: String(item.event_slots?.id ?? ""),
              date: String(item.event_slots?.date ?? ""),
              start_time: String(item.event_slots?.start_time ?? ""),
              end_time: String(item.event_slots?.end_time ?? ""),
              volunteers_needed: Number(item.event_slots?.volunteers_needed ?? 0),
            },
            events: Array.isArray(item.events) ? {
              id: String(item.events[0]?.id ?? ""),
              title: String(item.events[0]?.title ?? ""),
              description: String(item.events[0]?.description ?? ""),
              location: String(item.events[0]?.location ?? ""),
            } : {
              id: String(item.events?.id ?? ""),
              title: String(item.events?.title ?? ""),
              description: String(item.events?.description ?? ""),
              location: String(item.events?.location ?? ""),
            }
          }))
        )
      }

      setIsLoadingRegistrations(false)
    }

    fetchRegistrations()
  }, [user.id, supabase])

  async function handleSignOut() {
    setIsLoading(true)
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.user_metadata?.full_name || user.email}</p>
            </div>
            <div className="flex space-x-4">
              <Link href="/create-event">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </Link>
              <Link href="/map">
                <Button variant="outline">
                  <MapPin className="h-4 w-4 mr-2" />
                  View Map
                </Button>
              </Link>
              <Button variant="ghost" onClick={handleSignOut} disabled={isLoading}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="hosted">My Events</TabsTrigger>
            <TabsTrigger value="registered">Registered Events</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Events Hosted</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{hostedEvents.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Events Joined</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{registrations.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Impact Score</CardTitle>
                  <Badge variant="secondary">New</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{hostedEvents.length * 10 + registrations.length * 5}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="hosted" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Events</h2>
              <Link href="/create-event">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Event
                </Button>
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {hostedEvents.map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription>
                      <div className="flex items-center text-sm text-gray-500 mt-2">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {event.location}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{event.description}</p>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">{event.volunteers_needed} volunteers needed</Badge>
                      <Button size="sm" variant="outline">
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="registered" className="space-y-4">
            <h2 className="text-2xl font-bold">Registered Events</h2>
            {error && (
              <div className="text-red-600 bg-red-50 p-4 rounded-md">
                {error}
              </div>
            )}
            {isLoadingRegistrations ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading registrations...</p>
              </div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">You haven't registered for any events yet.</p>
                <Link href="/map" className="text-blue-600 hover:underline mt-2 inline-block">
                  Find events to join
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {registrations.map((registration) => (
                  <Card key={registration.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{registration.events.title}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center text-sm text-gray-500 mt-2">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(registration.event_slots.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Clock className="h-4 w-4 mr-1" />
                          {registration.event_slots.start_time} - {registration.event_slots.end_time}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {registration.events.location}
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{registration.message}</p>
                      <Badge variant="secondary">Registered</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
