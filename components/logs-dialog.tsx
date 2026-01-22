"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, LogIn, LogOut, RefreshCw } from "lucide-react"
import type { LoginLog } from "@/lib/types"

interface LogsDialogProps {
  open: boolean
  onClose: () => void
  language?: "fr" | "en"
  isAdmin: boolean
}

const translations = {
  en: {
    loginLogs: "Login Logs",
    allLogs: "All Login/Logout Activities",
    noLogs: "No login logs found.",
    user: "User",
    email: "Email",
    action: "Action",
    dateTime: "Date & Time",
    ipAddress: "IP Address",
    close: "Close",
    searchPlaceholder: "Search by user, email or action...",
    login: "Login",
    logout: "Logout",
    noAccess: "You do not have permission to view logs.",
    autoDeleteNote: "Note: Logs are automatically deleted after 2 weeks.",
  },
  fr: {
    loginLogs: "Journaux de connexion",
    allLogs: "Toutes les activités de connexion/déconnexion",
    noLogs: "Aucun journal de connexion trouvé.",
    user: "Utilisateur",
    email: "Email",
    action: "Action",
    dateTime: "Date et Heure",
    ipAddress: "Adresse IP",
    close: "Fermer",
    searchPlaceholder: "Rechercher par utilisateur, email ou action...",
    login: "Connexion",
    logout: "Déconnexion",
    noAccess: "Vous n'avez pas la permission de voir les journaux.",
    autoDeleteNote: "Note: Les journaux sont automatiquement supprimés après 2 semaines.",
  },
}

function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp)
  const dateStr = date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  const timeStr = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
  return `${dateStr} ${timeStr}`
}

export function LogsDialog({ open, onClose, language = "fr", isAdmin }: LogsDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const t = translations[language]

  // Fetch logs from database when dialog opens
  useEffect(() => {
    if (open && isAdmin) {
      fetchLogs()
    }
  }, [open, isAdmin])

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/logs")
      const data = await response.json()
      if (data.logs) {
        setLoginLogs(data.logs)
      }
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Sort by timestamp (most recent first)
  const sortedLogs = [...loginLogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // Apply search filter
  const filteredLogs = sortedLogs.filter((log) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      log.userName.toLowerCase().includes(query) ||
      log.userEmail.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(query))
    )
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t.loginLogs}</DialogTitle>
        </DialogHeader>

        {!isAdmin ? (
          <div className="py-8 text-center text-muted-foreground">
            {t.noAccess}
          </div>
        ) : (
          <div className="py-4">
            <h3 className="text-lg font-medium mb-2">{t.allLogs}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t.autoDeleteNote}</p>

            {/* Search bar with refresh */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.searchPlaceholder}
                  className="pl-8 pr-4"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchLogs} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">{t.noLogs}</div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">{t.user}</th>
                        <th className="px-4 py-2 text-left font-medium">{t.email}</th>
                        <th className="px-4 py-2 text-left font-medium">{t.action}</th>
                        <th className="px-4 py-2 text-left font-medium">{t.dateTime}</th>
                        <th className="px-4 py-2 text-left font-medium">{t.ipAddress}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="border-t">
                          <td className="px-4 py-3 font-medium">{log.userName}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{log.userEmail}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {log.action === "login" ? (
                                <LogIn className="h-4 w-4 text-green-500" />
                              ) : (
                                <LogOut className="h-4 w-4 text-red-500" />
                              )}
                              <span className={log.action === "login" ? "text-green-600" : "text-red-600"}>
                                {log.action === "login" ? t.login : t.logout}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{formatDateTime(log.createdAt)}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{log.ipAddress || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>{t.close}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
