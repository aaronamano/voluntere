"use client"

import { useState, useCallback, useEffect } from "react"
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, MapPin, Users, Clock } from "lucide-react"
import { EventSignupForm } from "./event-signup-form"

interface Slot {
  id: string
  event_id: string
  date: string
  start_time: string
  end_time: string
  volunteers_needed: number
}

interface Event {
  id: string
  title: string
  description: string
  location: string
  latitude: number
  longitude: number
  host_id: {
    full_name: string
  }
  created_at: string
  updated_at: string
  slots: Slot[]
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
}

const defaultCenter = {
  lat: 42.58067066959867, 
  lng: -83.00978950460713
}

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  minZoom: 3, // Prevent zooming out too far
  maxZoom: 18,
  restriction: {
    latLngBounds: {
      north: 85,
      south: -85,
      west: -180,
      east: 180
    },
    strictBounds: true
  }
}

interface EventMapProps {
  initialEvents: Event[]
}

export function EventMap({ initialEvents }: EventMapProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showSignupForm, setShowSignupForm] = useState(false)
  const [activeMarker, setActiveMarker] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          location,
          latitude,
          longitude,
          host_id(
            full_name
          ),
          created_at,
          updated_at,
          event_slots(
            id,
            event_id,
            date,
            start_time,
            end_time,
            volunteers_needed
          )
        `)

      if (error) {
        console.error('Error fetching events:', error)
        return
      }

      if (data) {
        setEvents(
          data.map((event: any) => ({
            ...event,
            host_id: Array.isArray(event.host_id) ? event.host_id[0] : event.host_id,
            slots: event.event_slots // Rename event_slots to slots
          }))
        )
      }
    }

    fetchEvents()
  }, [])

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  })

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      if (events.length > 0) {
        const bounds = new google.maps.LatLngBounds()
        events.forEach((event) => {
          bounds.extend({ lat: event.latitude, lng: event.longitude })
        })
        map.fitBounds(bounds)

        // Add minimum zoom check after fitting bounds
        const listener = map.addListener('idle', () => {
          if (map.getZoom()! > 18) map.setZoom(18)
          google.maps.event.removeListener(listener)
        })
      }
    },
    [events],
  )

  const onUnmount = useCallback(() => {
    // Clean up if needed
  }, [])

  const handleMarkerClick = (event: Event) => {
    setActiveMarker(event.id)
  }

  const handleInfoWindowClose = () => {
    setActiveMarker(null)
  }

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event)
    setActiveMarker(null)
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Error loading Google Maps</p>
          <p className="text-sm text-gray-500 mt-2">Please check your API key configuration</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={20}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {events.map((event) => (
          <Marker
            key={event.id}
            position={{ lat: event.latitude, lng: event.longitude }}
            onClick={() => handleMarkerClick(event)}
            title={event.title}
          >
            {activeMarker === event.id && (
              <InfoWindow
                onCloseClick={handleInfoWindowClose}
                options={{
                  pixelOffset: new google.maps.Size(0, -30),
                }}
              >
                {/* Update the InfoWindow content */}
                <div className="p-2 max-w-xs">
                  <h3 className="font-semibold text-sm mb-2">{event.title}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" />
                        {event.location}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{event.description}</p>
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <Users className="h-3 w-3 mr-1" />
                      Hosted by {event.host_id?.full_name}
                    </div>
                  </div>
                  <Button size="sm" className="w-full text-xs mt-3" onClick={() => handleViewDetails(event)}>
                    View Details
                  </Button>
                </div>
              </InfoWindow>
            )}
          </Marker>
        ))}
      </GoogleMap>

      {/* Event List Sidebar */}
      <div className="absolute top-4 left-4 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg p-4">
        <h3 className="font-bold text-lg mb-4">Upcoming Events ({events.length})</h3>
        <div className="space-y-3">
          {events.map((event) => (
            <Card
              key={event.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewDetails(event)}
            >
              {/* Update the Event List Card content */}
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm">{event.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-xs text-gray-500">
                    <MapPin className="h-3 w-3 mr-1" />
                    {event.location}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{event.description}</p>
                  <div className="flex items-center text-xs text-gray-400 pt-1">
                    <Users className="h-3 w-3 mr-1" />
                    Hosted by {event.host_id?.full_name}
                  </div>
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
                    <MapPin className="h-4 w-4 mr-2" />
                    {selectedEvent.location}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Badge variant="outline">Hosted by {selectedEvent.host_id.full_name}</Badge>
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
              slots={selectedEvent.slots}
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
