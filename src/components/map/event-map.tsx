"use client"

import { useState } from "react"
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, MapPin, Users, Clock } from "lucide-react"
import { EventSignupForm } from "./event-signup-form"

interface Event {
  id: string
  title: string
  description: string
  date: string
  location: string
  volunteers_needed: number
  latitude: number
  longitude: number
  profiles: {
    full_name: string
  }
}

interface EventMapProps {
  events: Event[]
}

const containerStyle = {
  width: "100%",
  height: "100vh",
  minHeight: "400px",
}

const defaultCenter = { lat: 40.7128, lng: -74.006 } // NYC

export function EventMap({ events }: EventMapProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showSignupForm, setShowSignupForm] = useState(false)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  return (
    <div className="relative h-full">
      {/* Map Container */}
      <div className="w-full" style={{ height: "100vh", minHeight: 400 }}>
        {apiKey ? (
          <LoadScript googleMapsApiKey={apiKey} libraries={["places"]}>
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={events.length > 0 ? { lat: events[0].latitude, lng: events[0].longitude } : defaultCenter}
              zoom={10}
            >
              {events.map((event) => (
                <Marker
                  key={event.id}
                  position={{ lat: event.latitude, lng: event.longitude }}
                  title={event.title}
                  onClick={() => setSelectedEvent(event)}
                />
              ))}
            </GoogleMap>
          </LoadScript>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading map...</p>
              <p className="text-sm text-gray-500 mt-2">Google Maps API key missing</p>
            </div>
          </div>
        )}
      </div>

      {/* Event List Sidebar */}
      <div className="absolute top-4 left-4 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg p-4">
        <h3 className="font-bold text-lg mb-4">Upcoming Events</h3>
        <div className="space-y-3">
          {events.map((event) => (
            <Card
              key={event.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedEvent(event)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{event.title}</CardTitle>
                <CardDescription className="text-xs">By {event.profiles.full_name}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center text-xs text-gray-500 mb-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(event.date).toLocaleDateString()}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Users className="h-3 w-3 mr-1" />
                  {event.volunteers_needed} volunteers needed
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-gray-600">{selectedEvent.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(selectedEvent.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-2" />
                    {new Date(selectedEvent.date).toLocaleTimeString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-2" />
                    {selectedEvent.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-2" />
                    {selectedEvent.volunteers_needed} volunteers needed
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Badge variant="outline">Hosted by {selectedEvent.profiles.full_name}</Badge>
                  <Button onClick={() => setShowSignupForm(true)}>Sign Up to Volunteer</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Signup Form Modal */}
      <Dialog open={showSignupForm} onOpenChange={setShowSignupForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Up for {selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <EventSignupForm
              eventId={selectedEvent.id}
              onSuccess={() => {
                setShowSignupForm(false)
                setSelectedEvent(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
