"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { TransactionTable } from "@/components/transaction-table"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

const INACTIVITY_TIMEOUT = 3 * 60 * 1000 // 3 minutes in milliseconds

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Log logout to database
  const logLogout = useCallback(async () => {
    const storedUser = localStorage.getItem("loggedInUser")
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        await fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            userName: user.name,
            userEmail: user.name,
            action: "logout",
          }),
        })
      } catch (error) {
        console.error("Error logging logout:", error)
      }
    }
  }, [])

  const handleLogout = useCallback(async () => {
    await logLogout()
    localStorage.removeItem("loggedInUser")
    router.push("/login")
  }, [router, logLogout])

  // Reset inactivity timer on user activity
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }
    inactivityTimerRef.current = setTimeout(() => {
      handleLogout()
    }, INACTIVITY_TIMEOUT)
  }, [handleLogout])

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem("loggedInUser")
    if (!user) {
      router.push("/login")
    } else {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [router])

  // Security: Auto logout on inactivity (3 minutes)
  useEffect(() => {
    if (!isAuthenticated) return

    // Events that indicate user activity
    const activityEvents = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"]

    // Start the inactivity timer
    resetInactivityTimer()

    // Add event listeners for user activity
    for (const event of activityEvents) {
      document.addEventListener(event, resetInactivityTimer)
    }

    return () => {
      // Clean up event listeners
      for (const event of activityEvents) {
        document.removeEventListener(event, resetInactivityTimer)
      }
      // Clear the timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
    }
  }, [isAuthenticated, resetInactivityTimer])

  // Security: Auto logout when user closes the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable logout logging when page closes
      const storedUser = localStorage.getItem("loggedInUser")
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser)
          navigator.sendBeacon(
            "/api/logs",
            JSON.stringify({
              userId: user.id,
              userName: user.name,
              userEmail: user.name,
              action: "logout",
            })
          )
        } catch {
          // Ignore errors during unload
        }
      }
      localStorage.removeItem("loggedInUser")
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <main className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Image src="/images/vonamawu-logo.png" alt="VONAMAWU Logo" width={70} height={70} />
          <h1 className="text-2xl font-bold tracking-tight">Fund Management</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Deconnexion
        </Button>
      </div>
      <TransactionTable />
    </main>
  )
}
