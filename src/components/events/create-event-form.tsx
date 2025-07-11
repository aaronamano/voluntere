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

interface TimeSlot {
  date: string;
  startTime: string;
  startPeriod: 'AM' | 'PM';
  endTime: string;
  endPeriod: 'AM' | 'PM';
  volunteersNeeded: number;
}

export function CreateEventForm({ onEventCreated }: { onEventCreated?: (event: any) => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState("")
  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([{
    date: '',
    startTime: '9:00',
    startPeriod: 'AM',
    endTime: '5:00',
    endPeriod: 'PM',
    volunteersNeeded: 1
  }])
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

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, {
      date: '',
      startTime: '9:00',
      startPeriod: 'AM',
      endTime: '5:00',
      endPeriod: 'PM',
      volunteersNeeded: 1
    }])
  }

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index))
  }

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: string | number) => {
    const newSlots = [...timeSlots]
    newSlots[index] = { ...newSlots[index], [field]: value }
    setTimeSlots(newSlots)
  }

  const convertTo24Hour = (time: string, period: 'AM' | 'PM'): string => {
    const [hours, minutes] = time.split(':').map(num => parseInt(num, 10))
    let hour = hours % 12
    if (period === 'PM') hour += 12
    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  const validateTimeSlots = (slots: TimeSlot[]): boolean => {
    return slots.every(slot => {
      if (!slot.date || !slot.startTime || !slot.endTime) {
        setError("All dates and times must be filled out")
        return false
      }
      return true
    })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const title = formData.get("title") as string
    const description = formData.get("description") as string

    if (!address || !latLng) {
      setError("Please select a valid address from the suggestions.")
      setIsLoading(false)
      return
    }

    if (!validateTimeSlots(timeSlots)) {
      setIsLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be logged in to create an event")
        return
      }

      // Insert the event first
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .insert([{
          title,
          description,
          location: address,
          latitude: latLng.lat,
          longitude: latLng.lng,
          host_id: user.id
        }])
        .select()
        .single()

      if (eventError) {
        setError(eventError.message)
        return
      }

      // Prepare the time slots data
      const slotsData = timeSlots.map(slot => ({
        event_id: eventData.id,
        date: slot.date,
        start_time: convertTo24Hour(slot.startTime, slot.startPeriod),
        end_time: convertTo24Hour(slot.endTime, slot.endPeriod),
        volunteers_needed: slot.volunteersNeeded,
      }))

      // Insert all time slots
      const { error: slotsError } = await supabase
        .from("event_slots")
        .insert(slotsData)

      if (slotsError) {
        setError(slotsError.message)
        return
      }

      if (onEventCreated && eventData) {
        onEventCreated(eventData)
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

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Time Slots</Label>
          <Button type="button" variant="outline" onClick={addTimeSlot}>
            Add Time Slot
          </Button>
        </div>
        
        {timeSlots.map((slot, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-4">
            <div className="flex justify-between">
              <h4>Slot {index + 1}</h4>
              {timeSlots.length > 1 && (
                <Button type="button" variant="destructive" size="sm" onClick={() => removeTimeSlot(index)}>
                  Remove
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={slot.date}
                  onChange={(e) => updateTimeSlot(index, 'date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Volunteers Needed</Label>
                <Input
                  type="number"
                  min="1"
                  value={slot.volunteersNeeded}
                  onChange={(e) => updateTimeSlot(index, 'volunteersNeeded', parseInt(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label>Start Time</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    pattern="^(1[0-2]|0?[1-9]):[0-5][0-9]$"
                    placeholder="9:00"
                    value={slot.startTime}
                    onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                    required
                    className="flex-1"
                  />
                  <select
                    className="w-20 rounded-md border border-input bg-background px-3"
                    value={slot.startPeriod}
                    onChange={(e) => updateTimeSlot(index, 'startPeriod', e.target.value as 'AM' | 'PM')}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>End Time</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    pattern="^(1[0-2]|0?[1-9]):[0-5][0-9]$"
                    placeholder="5:00"
                    value={slot.endTime}
                    onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                    required
                    className="flex-1"
                  />
                  <select
                    className="w-20 rounded-md border border-input bg-background px-3"
                    value={slot.endPeriod}
                    onChange={(e) => updateTimeSlot(index, 'endPeriod', e.target.value as 'AM' | 'PM')}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}
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

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating Event..." : "Create Event"}
      </Button>
    </form>
  )
}
