"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for success messages from redirects
    if (searchParams.get("registered") === "true") {
      setSuccessMessage("Account created successfully! Please sign in.")
    } else if (searchParams.get("reset") === "true") {
      setSuccessMessage("Password reset successfully! Please sign in with your new password.")
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate authentication delay
    setTimeout(() => {
      // Store the logged in user info in localStorage
      const userName = email.split("@")[0] // Use the part before @ as username
      localStorage.setItem(
        "loggedInUser",
        JSON.stringify({
          id: `user-${Date.now()}`,
          name: userName.charAt(0).toUpperCase() + userName.slice(1), // Capitalize first letter
          email: email,
        }),
      )
      setIsLoading(false)
      router.push("/")
    }, 1500)
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <Alert className="border-green-500 bg-green-50 text-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-gray-900">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember-me"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
          />
          <Label htmlFor="remember-me" className="text-sm font-normal">
            Remember me
          </Label>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <div className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  )
}
