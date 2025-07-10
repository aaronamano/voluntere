"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

interface EventSignupFormProps {
  eventId: string
  onSuccess: () => void
}

export function EventSignupForm({ eventId, onSuccess }: EventSignupFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [userName, setUserName] = useState<string>("")
  const supabase = createClient()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

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

      // Check if already registered
      const { data: existingRegistration } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .single()

      if (existingRegistration) {
        setError("You are already registered for this event")
        return
      }

      const { error } = await supabase.from("event_registrations").insert([
        {
          event_id: eventId,
          user_id: user.id,
          message: message || null,
        },
      ])

      if (error) {
        setError(error.message)
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Signing Up..." : "Confirm Registration"}
        </Button>
      </div>
    </form>
  )
}
