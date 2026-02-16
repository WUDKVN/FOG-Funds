"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, Calendar, ChevronDown, ChevronUp } from "lucide-react"
import { formatCurrency } from "@/components/transaction-table"

interface SettledRecord {
  id: string
  personName: string
  personId: string
  totalAmount: number
  currency: string
  type: string
  settledByUserId: string
  settledByUserName: string
  transactions: any[]
  settledAt: string
  notes: string
}

interface SettledListDialogProps {
  open: boolean
  onClose: () => void
  language: "fr" | "en"
}

const translations = {
  fr: {
    title: "Comptes Soldes",
    description: "Historique de tous les comptes qui ont ete soldes",
    searchPlaceholder: "Rechercher par nom, montant, date...",
    noRecords: "Aucun compte solde pour le moment.",
    person: "Personne",
    amount: "Montant",
    settledBy: "Solde par",
    settledOn: "Solde le",
    type: "Type",
    theyOwedMe: "Ils me devaient",
    iOwedThem: "Je leur devais",
    dateFrom: "Du",
    dateTo: "Au",
    clearFilters: "Effacer filtres",
    transactions: "Transactions",
    loading: "Chargement...",
    close: "Fermer",
  },
  en: {
    title: "Settled Accounts",
    description: "History of all accounts that have been settled",
    searchPlaceholder: "Search by name, amount, date...",
    noRecords: "No settled accounts yet.",
    person: "Person",
    amount: "Amount",
    settledBy: "Settled by",
    settledOn: "Settled on",
    type: "Type",
    theyOwedMe: "They owed me",
    iOwedThem: "I owed them",
    dateFrom: "From",
    dateTo: "To",
    clearFilters: "Clear filters",
    transactions: "Transactions",
    loading: "Loading...",
    close: "Close",
  },
}

export function SettledListDialog({ open, onClose, language }: SettledListDialogProps) {
  const t = translations[language]
  const [records, setRecords] = useState<SettledRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchRecords()
    }
  }, [open])

  const fetchRecords = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/settled")
      const data = await response.json()
      if (data.records) {
        setRecords(data.records)
      }
    } catch (error) {
      console.error("Error fetching settled records:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRecords = useMemo(() => {
    let result = records

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((record) => {
        if (record.personName.toLowerCase().includes(query)) return true
        if (String(record.totalAmount).includes(query)) return true
        if (formatCurrency(Number(record.totalAmount)).includes(query)) return true
        if (record.settledByUserName?.toLowerCase().includes(query)) return true
        if (record.notes?.toLowerCase().includes(query)) return true
        return false
      })
    }

    if (dateFrom) {
      result = result.filter((record) => {
        const settledDate = new Date(record.settledAt).toISOString().split("T")[0]
        return settledDate >= dateFrom
      })
    }

    if (dateTo) {
      result = result.filter((record) => {
        const settledDate = new Date(record.settledAt).toISOString().split("T")[0]
        return settledDate <= dateTo
      })
    }

    return result
  }, [records, searchQuery, dateFrom, dateTo])

  const clearFilters = () => {
    setSearchQuery("")
    setDateFrom("")
    setDateTo("")
  }

  const hasActiveFilters = searchQuery || dateFrom || dateTo

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 flex-shrink-0">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.searchPlaceholder}
              className="pl-8 pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>

          {/* Date range filter */}
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground whitespace-nowrap">{t.dateFrom}</span>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
              <span className="text-sm text-muted-foreground whitespace-nowrap">{t.dateTo}</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1"
              />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs whitespace-nowrap">
                <X className="h-3 w-3 mr-1" />
                {t.clearFilters}
              </Button>
            )}
          </div>
        </div>

        {/* Records list */}
        <div className="flex-1 overflow-y-auto mt-2 space-y-2 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">{t.loading}</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">{t.noRecords}</div>
          ) : (
            filteredRecords.map((record) => {
              const isExpanded = expandedRecord === record.id
              const settledDate = new Date(record.settledAt)
              const formattedDate = settledDate.toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
              const isTheyOwedMe = record.type === "they-owe-me"

              return (
                <div key={record.id} className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    className="w-full p-3 sm:p-4 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedRecord(isExpanded ? null : record.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{record.personName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{formattedDate}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <div className={`font-semibold text-sm ${isTheyOwedMe ? "text-green-600" : "text-red-600"}`}>
                            FCFA {formatCurrency(Math.abs(Number(record.totalAmount)))}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {isTheyOwedMe ? t.theyOwedMe : t.iOwedThem}
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t bg-muted/20 p-3 sm:p-4 space-y-2">
                      {record.settledByUserName && (
                        <div className="text-xs text-muted-foreground">
                          {t.settledBy}: <span className="font-medium text-foreground">{record.settledByUserName}</span>
                        </div>
                      )}
                      {record.transactions && record.transactions.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">{t.transactions}:</div>
                          <div className="space-y-1">
                            {record.transactions.map((txn: any, idx: number) => (
                              <div
                                key={txn.id || idx}
                                className="flex items-center justify-between text-xs bg-background rounded px-2 py-1.5 border"
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="text-muted-foreground">
                                    {txn.date ? new Date(txn.date).toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", { day: "2-digit", month: "short" }) : ""}
                                  </span>
                                  <span className="ml-2 truncate">{txn.description}</span>
                                </div>
                                <span className={`font-medium ml-2 whitespace-nowrap ${Number(txn.amount) >= 0 ? "text-green-600" : "text-red-600"}`}>
                                  {Number(txn.amount) >= 0 ? "+" : ""}{formatCurrency(Number(txn.amount))} FCFA
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {record.notes && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {record.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        <div className="flex justify-end pt-2 flex-shrink-0 border-t">
          <Button variant="outline" onClick={onClose}>
            {t.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
