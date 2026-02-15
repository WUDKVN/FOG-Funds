"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { TransactionTable } from "@/components/transaction-table"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

const INACTIVITY_TIMEOUT = 20 * 60 * 1000 // 20 minutes in milliseconds

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Log logout to database
  const logLogout = useCallback(async () => {
    if (currentUser) {
      try {
        await fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            userName: currentUser.name,
            userEmail: currentUser.name,
            action: "logout",
          }),
        })
      } catch (error) {
        console.error("Error logging logout:", error)
      }
    }
  }, [currentUser])

  const handleLogout = useCallback(async () => {
    await logLogout()
    // Clear the HTTP-only cookie via server endpoint
    await fetch("/api/auth/logout", { method: "POST" })
    // Clean up any leftover localStorage/sessionStorage from old auth
    localStorage.removeItem("loggedInUser")
    sessionStorage.removeItem("loggedInUser")
    localStorage.removeItem("savedCredentials")
    localStorage.removeItem("rememberMe")
    localStorage.removeItem("lastLocation")
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

  // Check session via HTTP-only cookie
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setCurrentUser(data.user)
            setIsAuthenticated(true)
            setIsLoading(false)
            return
          }
        }
      } catch {
        // Session check failed
      }
      // No valid session - redirect to login
      // Also clean up any old localStorage data
      localStorage.removeItem("loggedInUser")
      sessionStorage.removeItem("loggedInUser")
      localStorage.removeItem("savedCredentials")
      localStorage.removeItem("rememberMe")
      router.push("/login")
      setIsLoading(false)
    }

    checkSession()
  }, [router])

  // Security: Auto logout on inactivity (20 minutes)
  useEffect(() => {
    if (!isAuthenticated) return

    const activityEvents = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"]

    resetInactivityTimer()

    for (const event of activityEvents) {
      document.addEventListener(event, resetInactivityTimer)
    }

    return () => {
      for (const event of activityEvents) {
        document.removeEventListener(event, resetInactivityTimer)
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
    }
  }, [isAuthenticated, resetInactivityTimer])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (!isAuthenticated || !currentUser) {
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
