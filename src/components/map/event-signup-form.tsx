"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

interface Slot {
  id: string
  event_id: string
  date: string
  start_time: string
  end_time: string
  volunteers_needed: number
}

interface EventSignupFormProps {
  eventId: string
  slots: Slot[]
  onSuccess: () => void
}

export function EventSignupForm({ eventId, slots, onSuccess }: EventSignupFormProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [userName, setUserName] = useState<string>("")
  const supabase = createClient()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!selectedSlot) {
      setError("Please select a time slot")
      setIsLoading(false)
      return
    }

    const formData = new FormData(event.currentTarget)
    const message = formData.get("message") as string

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be logged in to sign up for events")
        return
      }

      // Fetch user profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (profileError) {
        setError("Error fetching user profile")
        return
      }

      setUserName(profile.full_name)

      // Check if already registered for this specific slot
      const { data: existingRegistration } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("slot_id", selectedSlot)
        .eq("user_id", user.id)
        .single()

      if (existingRegistration) {
        setError("You are already registered for this time slot")
        return
      }

      const selectedSlotData = slots.find(s => s.id === selectedSlot)!
      if (selectedSlotData.volunteers_needed <= 0) {
        setError("This slot is already full")
        return
      }

      // Start a transaction for both operations
      const { error } = await supabase.rpc('register_for_event', {
        p_event_id: eventId,
        p_slot_id: selectedSlot,
        p_user_id: user.id,
        p_message: message || null
      })

      if (error) {
        if (error.message.includes('no_spots_available')) {
          setError("This slot is now full. Please choose another time slot.")
        } else {
          setError(error.message)
        }
        return
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-green-600 text-lg font-semibold mb-2">Successfully registered!</div>
        <p className="text-gray-600">You'll receive event updates via email.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {userName && (
        <div className="text-sm text-gray-600 mb-4">
          Signing up as: {userName}
        </div>
      )}

      <div className="space-y-2">
        <Label>Select a Time Slot</Label>
        <div className="grid grid-cols-1 gap-2">
          {slots.map((slot) => (
            <Button
              key={slot.id}
              type="button"
              variant={selectedSlot === slot.id ? "default" : "outline"}
              onClick={() => setSelectedSlot(slot.id)}
              className="w-full justify-between"
            >
              <span className="flex flex-col items-start text-left">
                <span className="text-sm font-medium">
                  {new Date(slot.date).toLocaleDateString()}
                </span>
                <span className="text-xs text-gray-500">
                  {slot.start_time} - {slot.end_time}
                </span>
              </span>
              <Badge variant="secondary">
                {slot.volunteers_needed} spots
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="message">Message to Organizer (Optional)</Label>
        <Textarea
          id="message"
          name="message"
          className="mt-1"
          placeholder="Let the organizer know about your skills or availability..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading || !selectedSlot}>
          {isLoading ? "Signing Up..." : "Confirm Registration"}
        </Button>
      </div>
    </form>
  )
}
