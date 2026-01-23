"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { TransactionTable } from "@/components/transaction-table"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

const INACTIVITY_TIMEOUT = 7 * 1000 // 7 seconds in milliseconds

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Helper to get user from storage
  const getStoredUser = useCallback(() => {
    const localUser = localStorage.getItem("loggedInUser")
    const sessionUser = sessionStorage.getItem("loggedInUser")
    return localUser || sessionUser
  }, [])

  // Log logout to database
  const logLogout = useCallback(async () => {
    const storedUser = getStoredUser()
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
  }, [getStoredUser])

  const handleLogout = useCallback(async () => {
    await logLogout()
    localStorage.removeItem("loggedInUser")
    sessionStorage.removeItem("loggedInUser")
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
    // Check if user is logged in (check both storage types)
    const user = getStoredUser()
    if (!user) {
      router.push("/login")
    } else {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [router, getStoredUser])

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

  // Security: Auto logout when user closes the page (only if not "remember me")
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Check if remember me is enabled
      const localUser = localStorage.getItem("loggedInUser")
      const sessionUser = sessionStorage.getItem("loggedInUser")
      const storedUser = localUser || sessionUser
      
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser)
          // Only log out if rememberMe is false (sessionStorage user)
          if (!user.rememberMe) {
            navigator.sendBeacon(
              "/api/logs",
              JSON.stringify({
                userId: user.id,
                userName: user.name,
                userEmail: user.name,
                action: "logout",
              })
            )
            sessionStorage.removeItem("loggedInUser")
          }
        } catch {
          // Ignore errors during unload
        }
      }
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
    <main className="container mx-auto py-4 px-3 sm:py-6 sm:px-4 md:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-4">
          <Image 
            src="/images/vonamawu-logo.png" 
            alt="VONAMAWU Logo" 
            width={50} 
            height={50}
            className="sm:w-[70px] sm:h-[70px]"
          />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Fund Management</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Deconnexion</span>
        </Button>
      </div>
      <TransactionTable />
    </main>
  )
}
