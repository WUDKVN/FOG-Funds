"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Search, Plus, CreditCard, CheckCircle2, Undo2, Trash2, Edit } from "lucide-react"
import { Input } from "@/components/ui/input"
import { CheckCircle } from "lucide-react"
import type { ActivityLog } from "@/lib/types"

interface HistoryDialogProps {
  open: boolean
  onClose: () => void
  activityLogs: ActivityLog[]
  viewMode: "they-owe-me" | "i-owe-them"
  language?: "fr" | "en"
}

// Translation object
const translations = {
  en: {
    activityHistory: "Activity History",
    allActivities: "All Activities",
    noActivities: "No activities found.",
    user: "User",
    action: "Action",
    dateTime: "Date & Time",
    details: "Details",
    close: "Close",
    searchPlaceholder: "Search by user, action or details...",
  },
  fr: {
    activityHistory: "Historique des activités",
    allActivities: "Toutes les activités",
    noActivities: "Aucune activité trouvée.",
    user: "Utilisateur",
    action: "Action",
    dateTime: "Date et Heure",
    details: "Détails",
    close: "Fermer",
    searchPlaceholder: "Rechercher par utilisateur, action ou détails...",
  },
}

// Helper function to format currency with spaces
function formatCurrencyWithSpaces(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

// Helper function to get action icon
function getActionIcon(action: string) {
  switch (action) {
    case "create":
      return <Plus className="h-4 w-4 text-green-500" />
    case "payment":
      return <CreditCard className="h-4 w-4 text-blue-500" />
    case "settle":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case "unsettle":
      return <Undo2 className="h-4 w-4 text-orange-500" />
    case "delete":
      return <Trash2 className="h-4 w-4 text-red-500" />
    case "edit":
      return <Edit className="h-4 w-4 text-blue-500" />
    default:
      return <Plus className="h-4 w-4 text-gray-500" />
  }
}

// Helper function to format timestamp
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
  })
  return `${dateStr} ${timeStr}`
}

export function HistoryDialog({ open, onClose, activityLogs, viewMode, language = "fr" }: HistoryDialogProps) {
  // Add search state
  const [searchQuery, setSearchQuery] = useState("")

  // Get translations
  const t = translations[language]

  // Filter activity logs based on view mode
  const filteredByViewMode = activityLogs.filter((log) => log.category === viewMode)

  // Sort by timestamp (most recent first)
  const sortedLogs = [...filteredByViewMode].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  // Apply search filter
  const filteredLogs = sortedLogs.filter((log) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      log.userName.toLowerCase().includes(query) ||
      log.description.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      (log.personName && log.personName.toLowerCase().includes(query)) ||
      (log.amount && formatCurrencyWithSpaces(log.amount).includes(query))
    )
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t.activityHistory}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <h3 className="text-lg font-medium mb-4">{t.allActivities}</h3>

          {/* Add search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.searchPlaceholder}
              className="pl-8 pr-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t.noActivities}</div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">{t.user}</th>
                      <th className="px-4 py-2 text-left font-medium">{t.dateTime}</th>
                      <th className="px-4 py-2 text-left font-medium">{t.details}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="border-t">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span className="font-medium">{log.userName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateTime(log.timestamp)}</td>
                        <td className="px-4 py-3">{log.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>{t.close}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
