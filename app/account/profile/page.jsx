"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSession } from "next-auth/react"

export default function ProfilePage() {
  const { data: session } = useSession()
  const [user, setUser] = useState(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    if (session?.user) {
      setUser(session.user)
      setName(session.user.name || "")
      setEmail(session.user.email || "")
    }
  }, [session])

  const handleSave = (e) => {
    e.preventDefault()
    alert("Profile updated successfully!")
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="bg-background rounded-lg border border-border p-6">
        <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-2" />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2" />
          </div>

          <Button type="submit">Save Changes</Button>
        </form>
      </div>

      <div className="bg-background rounded-lg border border-border p-6">
        <h2 className="text-xl font-bold mb-4">Saved Addresses</h2>

        {user.addresses && user.addresses.length > 0 ? (
          <div className="space-y-4">
            {user.addresses.map((address) => (
              <div key={address.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{address.name}</p>
                    <p className="text-muted-foreground">{address.street}</p>
                    <p className="text-muted-foreground">
                      {address.city}, {address.state} {address.zip}
                    </p>
                    <p className="text-muted-foreground">{address.country}</p>
                    <p className="text-muted-foreground">{address.phone}</p>
                  </div>
                  {address.isDefault && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">Default</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No saved addresses</p>
        )}

        <Button variant="outline" className="mt-4 bg-transparent">
          Add New Address
        </Button>
      </div>
    </div>
  )
}
