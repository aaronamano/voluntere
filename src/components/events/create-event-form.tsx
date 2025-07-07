"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { LoadScript, Autocomplete } from "@react-google-maps/api"

export function CreateEventForm({ onEventCreated }: { onEventCreated?: (event: any) => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState("")
  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  function handlePlaceChanged() {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace()
      console.log('Selected place:', place)
      
      if (place.formatted_address && place.geometry && place.geometry.location) {
        const newLatLng = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        }
        console.log('Coordinates obtained:', newLatLng)
        
        setAddress(place.formatted_address)
        setLatLng(newLatLng)
      } else {
        console.warn('Place selected but missing required data:', place)
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    console.log('Form submission - Current coordinates:', latLng)
    console.log('Form submission - Current address:', address)

    const formData = new FormData(event.currentTarget)
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const date = formData.get("date") as string
    const time = formData.get("time") as string
    const volunteersNeeded = Number.parseInt(formData.get("volunteersNeeded") as string)

    if (!address || !latLng) {
      setError("Please select a valid address from the suggestions.")
      setIsLoading(false)
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be logged in to create an event")
        return
      }

      const { data, error } = await supabase.from("events").insert([
        {
          title,
          description,
          date: `${date}T${time}`,
          location: address,
          volunteers_needed: volunteersNeeded,
          latitude: latLng.lat,
          longitude: latLng.lng,
          host_id: user.id,
        },
      ]).select().single()

      if (error) {
        setError(error.message)
        return
      }

      // Call the callback with the new event
      if (onEventCreated && data) {
        onEventCreated(data)
      }

      router.push("/dashboard")
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="title">Event Title</Label>
        <Input id="title" name="title" type="text" required className="mt-1" placeholder="Enter event title" />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          required
          className="mt-1"
          placeholder="Describe your volunteer event"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="time">Time</Label>
          <Input id="time" name="time" type="time" required className="mt-1" />
        </div>
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        {apiKey ? (
          <LoadScript googleMapsApiKey={apiKey} libraries={["places"]}>
            <Autocomplete
              onLoad={ac => (autocompleteRef.current = ac)}
              onPlaceChanged={handlePlaceChanged}
            >
              <Input
                id="location"
                name="location"
                type="text"
                required
                className="mt-1"
                placeholder="Event location address"
                value={address}
                onChange={e => setAddress(e.target.value)}
                autoComplete="off"
              />
            </Autocomplete>
          </LoadScript>
        ) : (
          <Input
            id="location"
            name="location"
            type="text"
            required
            className="mt-1"
            placeholder="Event location address"
            value={address}
            onChange={e => setAddress(e.target.value)}
            autoComplete="off"
            disabled
          />
        )}
      </div>

      <div>
        <Label htmlFor="volunteersNeeded">Volunteers Needed</Label>
        <Input
          id="volunteersNeeded"
          name="volunteersNeeded"
          type="number"
          min="1"
          required
          className="mt-1"
          placeholder="10"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating Event..." : "Create Event"}
      </Button>
    </form>
  )
}
