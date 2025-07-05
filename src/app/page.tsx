import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Users, Calendar, Heart } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">VolunteerHub</h1>
          </div>
          <div className="space-x-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">Connect. Volunteer. Make a Difference.</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover volunteer opportunities in your community, create events, and build a network of changemakers.
          </p>
          <div className="space-x-4">
            <Link href="/register">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                Get Started
              </Button>
            </Link>
            <Link href="/map">
              <Button size="lg" variant="outline">
                Explore Events
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <MapPin className="h-12 w-12 text-indigo-600 mb-4" />
                <CardTitle>Discover Events</CardTitle>
                <CardDescription>
                  Find volunteer opportunities on our interactive map and filter by location, cause, and date.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Calendar className="h-12 w-12 text-indigo-600 mb-4" />
                <CardTitle>Create Events</CardTitle>
                <CardDescription>
                  Host your own volunteer events and manage registrations with our easy-to-use event creation tools.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-indigo-600 mb-4" />
                <CardTitle>Build Community</CardTitle>
                <CardDescription>
                  Connect with like-minded volunteers, track your impact, and build lasting relationships.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
