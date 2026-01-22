"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronUp, Plus, Search, X, CheckCircle, History, Globe, FileText } from "lucide-react"
import { TransactionDetails } from "@/components/transaction-details"
import { EditTransactionDialog } from "@/components/edit-transaction-dialog"
import { NewTransactionDialog } from "@/components/new-transaction-dialog"
import { SettleConfirmDialog } from "@/components/settle-confirm-dialog"
import { useToast } from "@/hooks/use-toast"
import type { Person, Transaction, ActivityLog, LoginLog } from "@/lib/types"
import { LogsDialog } from "@/components/logs-dialog"
import { initialPeople } from "@/lib/data"
import { TransactionReceipt } from "@/components/transaction-receipt"
import { HistoryDialog } from "@/components/history-dialog"

type FilterType = "all" | "they-owe" | "i-owe"
type ViewMode = "they-owe-me" | "i-owe-them"
type StatusFilter = "all" | "settled" | "unsettled"
type Language = "fr" | "en"

// Translation object
const translations = {
  en: {
    peopleWhoOweMe: "People Who Owe Me",
    peopleIOwe: "People I Owe",
    showingPeopleWhoOweYou: "Showing only people who owe you money.",
    showingPeopleYouOwe: "Showing only people you owe money to.",
    filterByMonth: "Filter by Month",
    company: "Company",
    lastTransaction: "Last Transaction",
    amount: "Total",
    details: "Details",
    noMatchingTransactions: "No matching transactions found.",
    noOneOwesYou: "No one owes you money at the moment.",
    youDontOweAnyone: "You don't owe anyone money at the moment.",
    noRecentTransactions: "No recent transactions",
    settle: "Settle",
    newTransaction: "New Transaction",
    searchPlaceholder: "Search by name, description or amount...",
    viewHistory: "History",
    viewLogs: "Logs",
    language: "Language",
    edit: "edit",
    runningBalance: "Running Balance",
    overdue: "Overdue",
  },
  fr: {
    peopleWhoOweMe: "Personnes qui me doivent",
    peopleIOwe: "Personnes que je dois",
    showingPeopleWhoOweYou: "Affichage uniquement des personnes qui vous doivent de l'argent.",
    showingPeopleYouOwe: "Affichage uniquement des personnes à qui vous devez de l'argent.",
    filterByMonth: "Filtrer par mois",
    company: "Entreprise",
    lastTransaction: "Dernière transaction",
    amount: "Total",
    details: "Détails",
    noMatchingTransactions: "Aucune transaction correspondante trouvée.",
    noOneOwesYou: "Personne ne vous doit d'argent pour le moment.",
    youDontOweAnyone: "Vous ne devez d'argent à personne pour le moment.",
    noRecentTransactions: "Pas de transactions récentes",
    settle: "Solder",
    newTransaction: "Nouvelle transaction",
    searchPlaceholder: "Rechercher par nom, description ou montant...",
    viewHistory: "Historique",
    viewLogs: "Journaux",
    language: "Langue",
    edit: "changer",
    runningBalance: "Solde Courant",
    overdue: "En retard",
  },
}

// Helper function to format currency amounts with spaces
export function formatCurrency(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

export function TransactionTable() {
  const [people, setPeople] = useState<Person[]>(initialPeople)
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([])
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<{
    personId: string
    transactionId: string | null
    totalAmount: number
  } | null>(null)
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [soldOutPerson, setSoldOutPerson] = useState<Person | null>(null)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const { toast } = useToast()

  // Add state for month filter and status filter
  const [monthFilter, setMonthFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("unsettled")

  // Add state for history dialog
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // Add state for language
  const [language, setLanguage] = useState<Language>("fr")

  // Add state for activity logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])

  // Add state for login logs
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([])

  // Add state for logs dialog
  const [isLogsOpen, setIsLogsOpen] = useState(false)

  // Get logged-in user from localStorage (simulated - in real app would come from auth)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: "admin" | "user" }>({
    id: "user1",
    name: "Admin",
    role: "admin",
  })

  // Check if current user is admin
  const isAdmin = currentUser.role === "admin"

  // Load user from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("loggedInUser")
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser)
          setCurrentUser({
            id: user.id || "user1",
            name: user.name || user.email || "Admin",
            role: user.role || "admin",
          })

          // Add login log when user loads
          const loginLog: LoginLog = {
            id: `login-${Date.now()}`,
            userId: user.id || "user1",
            userName: user.name || user.email || "Admin",
            userEmail: user.email || "",
            action: "login",
            createdAt: new Date().toISOString(),
          }
          setLoginLogs((prev) => [loginLog, ...prev])
        } catch {
          // Use default user if parsing fails
        }
      }
    }
  }, [])

  // Helper function to add activity log
  const addActivityLog = (
    action: ActivityLog["action"],
    description: string,
    personName?: string,
    amount?: number,
  ) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      category: viewMode,
      description,
      personName,
      amount,
    }
    setActivityLogs((prev) => [newLog, ...prev])
  }

  // Get translations based on current language
  const t = translations[language]

  // Add state for receipt
  const [receiptData, setReceiptData] = useState<{
    open: boolean
    title: string
    person: Person
    transaction?: Transaction
    isSettlement?: boolean
    paymentAmount?: number
  }>({
    open: false,
    title: "",
    person: people[0],
    isSettlement: false,
  })

  // Add state for view mode
  const [viewMode, setViewMode] = useState<ViewMode>("they-owe-me")

  // Add state for settled message
  const [showSettledMessage, setShowSettledMessage] = useState(false)
  const [recentlySettledPerson, setRecentlySettledPerson] = useState<string | null>(null)

  // Check for zero balances and auto-settle them
  useEffect(() => {
    let hasChanges = false

    const updatedPeople = people.map((person) => {
      // Calculate total for this person in the current view mode
      let total = 0

      // Only consider transactions that match the current view mode
      const relevantTransactions = person.transactions.filter((t) =>
        viewMode === "they-owe-me" ? t.amount > 0 : t.amount < 0,
      )

      // Calculate total
      for (const t of person.transactions) {
        if (viewMode === "they-owe-me") {
          total += t.amount
        } else {
          total += t.amount
        }
      }

      // If total is very close to 0 but there are unsettled transactions
      if (Math.abs(total) < 0.01 && relevantTransactions.some((t) => !t.settled)) {
        hasChanges = true

        // Mark all relevant transactions as settled
        const updatedTransactions = person.transactions.map((transaction) => {
          if ((viewMode === "they-owe-me" ? transaction.amount > 0 : transaction.amount < 0) && !transaction.settled) {
            return {
              ...transaction,
              originalAmount: transaction.amount,
              amount: 0,
              settled: true,
              settlementDate: new Date().toISOString().split("T")[0], // Add settlement date
            }
          }
          return transaction
        })

        return {
          ...person,
          transactions: updatedTransactions,
        }
      }

      return person
    })

    if (hasChanges) {
      setPeople(updatedPeople)
    }
  }, [people, viewMode])

  // Apply filters and search based on view mode, month, and status
  useEffect(() => {
    // First filter by view mode
    let result = people.filter((person) => {
      // Filter transactions based on view mode
      const relevantTransactions = person.transactions.filter((transaction) => {
        // View mode filter
        const viewModeMatch = viewMode === "they-owe-me" ? transaction.amount > 0 : transaction.amount < 0

        // Only show unsettled transactions (amount != 0)
        return viewModeMatch && transaction.amount !== 0
      })

      // Only include people who have transactions that match the view mode
      return relevantTransactions.length > 0
    })

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((person) => {
        // Search by name
        if (person.name.toLowerCase().includes(query)) return true

        // Search by transaction details
        return person.transactions.some(
          (transaction) =>
            transaction.description.toLowerCase().includes(query) ||
            transaction.comment?.toLowerCase().includes(query) ||
            transaction.amount.toString().includes(query),
        )
      })
    }

    setFilteredPeople(result)
  }, [people, searchQuery, filterType, viewMode])

  const toggleExpand = (personId: string) => {
    setExpandedPerson(expandedPerson === personId ? null : personId)
  }

  // Updated to handle editing the running balance instead of a specific transaction
  const handleEditTransaction = (personId: string) => {
    const person = people.find((p) => p.id === personId)
    if (!person) return

    const totalAmount = calculateTotalAmount(person)

    setEditingTransaction({
      personId,
      transactionId: null, // No specific transaction
      totalAmount,
    })
  }

  // Update the handleUpdateTransaction function to work with running balance
  const handleUpdateTransaction = (
    personId: string,
    transactionId: string,
    updatedAmount: number,
    updatedDescription: string,
    updatedDate: string,
    updatedComment: string,
    settled: boolean,
    signature?: string,
  ) => {
    // Find the person
    const person = people.find((p) => p.id === personId)
    if (!person) return

    // Create a new transaction to record the payment
    // For "they-owe-me", payment is negative; for "i-owe-them", payment is positive
    const paymentTransaction: Transaction = {
      id: transactionId,
      date: updatedDate,
      description: updatedDescription || "Payment",
      // The sign depends on the view mode
      amount: viewMode === "they-owe-me" ? -updatedAmount : updatedAmount,
      comment: updatedComment || "Payment",
      settled: true,
      signature: signature,
      // Add a flag to identify this as a payment transaction
      isPayment: true,
    }

    // Calculate if this payment will settle the account
    const currentTotal = calculateTotalAmount(person)
    const willBeSettled = Math.abs(updatedAmount - currentTotal) < 0.01

    // Update the people state by adding the new payment transaction
    setPeople(
      people.map((p) => {
        if (p.id === personId) {
          // If this payment will settle the account, mark all transactions as settled
          if (willBeSettled) {
            const settledTransactions = p.transactions.map((t) => {
              if ((viewMode === "they-owe-me" ? t.amount > 0 : t.amount < 0) && !t.settled) {
                return {
                  ...t,
                  originalAmount: t.amount,
                  amount: 0,
                  settled: true,
                  settlementDate: new Date().toISOString().split("T")[0], // Add settlement date
                }
              }
              return t
            })

            return {
              ...p,
              transactions: [...settledTransactions, paymentTransaction],
              signature: signature || p.signature,
            }
          }

          // Otherwise just add the payment transaction
          return {
            ...p,
            transactions: [...p.transactions, paymentTransaction],
            signature: signature || p.signature,
          }
        }
        return p
      }),
    )

    // Show receipt after update
    if (person) {
      setReceiptData({
        open: true,
        title: willBeSettled ? "Account Settled" : "Payment Recorded",
        person,
        transaction: paymentTransaction,
        isSettlement: willBeSettled,
        paymentAmount: updatedAmount,
      })

      // If account was settled, show success message
      if (willBeSettled) {
        setRecentlySettledPerson(person.name)
        setShowSettledMessage(true)

        // Hide the message after 5 seconds
        setTimeout(() => {
          setShowSettledMessage(false)
          setRecentlySettledPerson(null)
        }, 5000)
      }
    }

    // Expand the person details to show the new payment transaction
    setExpandedPerson(personId)

    // Log the activity
    if (willBeSettled) {
      addActivityLog(
        "payment",
        `${currentUser.name} a enregistré un paiement de FCFA ${formatCurrency(updatedAmount)} pour ${person.name} et a soldé le compte.`,
        person.name,
        updatedAmount,
      )
    } else {
      addActivityLog(
        "payment",
        `${currentUser.name} a enregistré un paiement de FCFA ${formatCurrency(updatedAmount)} pour ${person.name}.`,
        person.name,
        updatedAmount,
      )
    }

    setEditingTransaction(null)
  }

  // Update handleAddTransaction to include settled status and auto-settle if amount is 0
  const handleAddTransaction = (
    personName: string,
    amount: number,
    description: string,
    date: string,
    comment: string,
    settled = false,
    signature?: string,
    dueDate?: string,
  ) => {
    // Apply the correct sign based on view mode
    const signedAmount =
      viewMode === "they-owe-me"
        ? Math.abs(amount) // Positive amount (they owe me)
        : -Math.abs(amount) // Negative amount (I owe them)

    // If amount is 0, automatically mark as settled
    const isSettled = signedAmount === 0 ? true : settled

    // Check if person exists
    const existingPerson = people.find((p) => p.name.toLowerCase() === personName.toLowerCase())
    let updatedPerson: Person
    const newTransaction: Transaction = {
      id: `t${Date.now()}`,
      date,
      description,
      amount: signedAmount,
      comment,
      settled: isSettled,
      signature,
      dueDate,
    }

    if (existingPerson) {
      // Calculate if this transaction will settle the account
      const currentTotal = calculateTotalAmount(existingPerson)
      const newTotal = viewMode === "they-owe-me" ? currentTotal + signedAmount : currentTotal - signedAmount
      const willBeSettled = Math.abs(newTotal) < 0.01

      // If this transaction will settle the account, mark all transactions as settled
      if (willBeSettled) {
        const settledTransactions = existingPerson.transactions.map((t) => {
          if ((viewMode === "they-owe-me" ? t.amount > 0 : t.amount < 0) && !t.settled) {
            return {
              ...t,
              originalAmount: t.amount,
              amount: 0,
              settled: true,
              settlementDate: new Date().toISOString().split("T")[0], // Add settlement date
            }
          }
          return t
        })

        updatedPerson = {
          ...existingPerson,
          transactions: [...settledTransactions, { ...newTransaction, settled: true }],
          signature: signature || existingPerson.signature,
        }
      } else {
        // Add transaction to existing person
        updatedPerson = {
          ...existingPerson,
          transactions: [...existingPerson.transactions, newTransaction],
          signature: signature || existingPerson.signature,
        }
      }

      setPeople(people.map((person) => (person.id === existingPerson.id ? updatedPerson : person)))
    } else {
      // Create new person with transaction
      updatedPerson = {
        id: `p${Date.now()}`,
        name: personName,
        transactions: [newTransaction],
        signature,
      }

      setPeople([...people, updatedPerson])
    }

    // Show receipt
    setReceiptData({
      open: true,
      title: "Transaction Added",
      person: updatedPerson,
      transaction: newTransaction,
      isSettlement: false,
    })

    // Log the activity
    addActivityLog(
      "create",
      `${currentUser.name} a créé une nouvelle transaction de FCFA ${formatCurrency(Math.abs(signedAmount))} pour ${personName} (${description}).`,
      personName,
      Math.abs(signedAmount),
    )

    setIsNewTransactionOpen(false)
  }

  // Update the handleSoldOutClick function to show confirmation first
  const handleSoldOutClick = (person: Person) => {
    setSoldOutPerson(person)
    // Show confirmation dialog first instead of immediately sending PIN
    setIsConfirmationOpen(true)
  }

  // Add a new function to handle confirmation
  const handleSettleConfirmation = () => {
    // Close confirmation dialog
    setIsConfirmationOpen(false)

    if (!soldOutPerson) return

    // Store the person's name before settlement for the success message
    const personName = soldOutPerson.name

    // Mark all transactions as settled
    setPeople(
      people.map((person) => {
        if (person.id === soldOutPerson.id) {
          // Mark all transactions as settled
          const updatedTransactions = person.transactions.map((transaction) => {
            // Only update transactions that match the current view mode
            if (
              (viewMode === "they-owe-me" && transaction.amount > 0) ||
              (viewMode === "i-owe-them" && transaction.amount < 0)
            ) {
              return {
                ...transaction,
                originalAmount: transaction.amount, // Store original amount
                amount: 0, // Set amount to 0 to indicate fully paid
                settled: true, // Mark as settled
                settlementDate: new Date().toISOString().split("T")[0], // Add settlement date
              }
            }
            return transaction
          })

          return {
            ...person,
            transactions: updatedTransactions,
          }
        }
        return person
      }),
    )

    // Close any expanded person to prevent referencing a person that might disappear from the filtered list
    setExpandedPerson(null)

    // Show receipt
    setReceiptData({
      open: true,
      title: "Account Settled",
      person: soldOutPerson,
      isSettlement: true,
    })

    // Show success message
    setRecentlySettledPerson(personName)
    setShowSettledMessage(true)

    // Log the activity
    const totalAmount = calculateTotalAmount(soldOutPerson)
    addActivityLog(
      "settle",
      `${currentUser.name} a soldé le compte de ${personName} (FCFA ${formatCurrency(totalAmount)}).`,
      personName,
      totalAmount,
    )

    // Hide the message after 5 seconds
    setTimeout(() => {
      setShowSettledMessage(false)
      setRecentlySettledPerson(null)
    }, 5000)

    // Reset state
    setSoldOutPerson(null)
  }

  // Calculate total amount for a person based on view mode
  const calculateTotalAmount = (person: Person) => {
    // Get all transactions that match the view mode (they owe me or I owe them)
    // and include payment transactions
    let total = 0

    for (const t of person.transactions) {
      if (viewMode === "they-owe-me") {
        // For "they-owe-me" view:
        // - Add positive amounts (debts)
        // - Subtract negative amounts (payments)
        total += t.amount
      } else {
        // For "i-owe-them" view:
        // - Add negative amounts (debts)
        // - Subtract positive amounts (payments)
        total += t.amount
      }
    }

    // Return exactly 0 if the total is very close to 0 (to handle floating point precision issues)
    if (Math.abs(total) < 0.01) return 0

    // Return the absolute value for display purposes
    return Math.abs(total)
  }

  // Check if a person has overdue transactions (due date passed with unpaid amount)
  const isPersonOverdue = (person: Person): boolean => {
    const today = new Date().toISOString().split("T")[0]
    
    return person.transactions.some((t) => {
      // Check if transaction matches the view mode
      const matchesViewMode = viewMode === "they-owe-me" ? t.amount > 0 : t.amount < 0
      
      // Check if transaction is not settled and has a due date that has passed
      return matchesViewMode && 
             !t.settled && 
             t.amount !== 0 && 
             t.dueDate && 
             t.dueDate < today
    })
  }

  // Get the most recent transaction for a person that matches the current view mode
  const getMostRecentTransaction = (person: Person): Transaction | null => {
    if (person.transactions.length === 0) return null

    // Filter transactions based on view mode
    const relevantTransactions = person.transactions.filter((transaction) => {
      // View mode filter
      const viewModeMatch = viewMode === "they-owe-me" ? transaction.amount > 0 : transaction.amount < 0

      // Only show unsettled transactions (amount != 0)
      return viewModeMatch && transaction.amount !== 0
    })

    if (relevantTransactions.length === 0) return null

    // Sort by date (most recent first) and return the first one
    return [...relevantTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  const toggleViewMode = () => {
    setViewMode(viewMode === "they-owe-me" ? "i-owe-them" : "they-owe-me")
    setExpandedPerson(null) // Close any expanded rows when switching views
  }

  // Function to toggle a transaction's settled status (for "unsettle" functionality)
  const toggleTransactionSettled = (personId: string, transactionId: string) => {
    // Find the person and transaction for logging
    const person = people.find((p) => p.id === personId)
    const transaction = person?.transactions.find((t) => t.id === transactionId)

    setPeople(
      people.map((p) => {
        if (p.id === personId) {
          const updatedTransactions = p.transactions.map((t) => {
            if (t.id === transactionId) {
              // If currently settled (amount is 0), restore the original amount
              if (t.amount === 0) {
                // Determine the appropriate amount based on view mode
                const restoredAmount =
                  viewMode === "they-owe-me"
                    ? Math.abs(t.originalAmount || 50)
                    : // Default to 50 if no original amount
                      -Math.abs(t.originalAmount || 50)

                return {
                  ...t,
                  amount: restoredAmount,
                  settled: false,
                }
              } else {
                // If not settled, save the original amount and set to 0
                return {
                  ...t,
                  originalAmount: t.amount, // Store original amount
                  amount: 0,
                  settled: true,
                  settlementDate: new Date().toISOString().split("T")[0], // Add settlement date
                }
              }
            }
            return t
          })

          return {
            ...p,
            transactions: updatedTransactions,
          }
        }
        return p
      }),
    )

    // Log the activity
    if (person && transaction) {
      const amount = Math.abs(transaction.originalAmount || transaction.amount || 0)
      if (transaction.amount === 0) {
        // Was settled, now unsettling
        addActivityLog(
          "unsettle",
          `${currentUser.name} a annulé le règlement de la transaction "${transaction.description}" pour ${person.name} (FCFA ${formatCurrency(amount)}).`,
          person.name,
          amount,
        )
      } else {
        // Was unsettled, now settling
        addActivityLog(
          "settle",
          `${currentUser.name} a réglé la transaction "${transaction.description}" pour ${person.name} (FCFA ${formatCurrency(amount)}).`,
          person.name,
          amount,
        )
      }
    }
  }

  // Toggle language between French and English
  const toggleLanguage = () => {
    setLanguage(language === "fr" ? "en" : "fr")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {/* View Mode Switch */}
        <div className="bg-muted/40 p-4 rounded-lg border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Switch id="view-mode" checked={viewMode === "i-owe-them"} onCheckedChange={toggleViewMode} />
              <Label htmlFor="view-mode" className="font-medium">
                {viewMode === "they-owe-me" ? t.peopleWhoOweMe : t.peopleIOwe}
              </Label>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {viewMode === "they-owe-me" ? t.showingPeopleWhoOweYou : t.showingPeopleYouOwe}
              </p>
              <Button variant="outline" size="sm" onClick={toggleLanguage} className="flex items-center gap-2 bg-transparent">
                <Globe className="h-4 w-4" />
                {language === "fr" ? "English" : "Français"}
              </Button>
            </div>
          </div>
        </div>

        {/* Settlement Success Message */}
        {showSettledMessage && recentlySettledPerson && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Account Settled Successfully</p>
              <p className="text-sm mt-1">
                All transactions with {recentlySettledPerson} have been settled and marked as paid.
              </p>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.searchPlaceholder}
              className="pl-8 pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-9 w-9" onClick={clearSearch}>
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Button variant="outline" onClick={() => setIsHistoryOpen(true)}>
                  <History className="h-4 w-4 mr-2" />
                  {t.viewHistory}
                </Button>
                <Button variant="outline" onClick={() => setIsLogsOpen(true)}>
                  <FileText className="h-4 w-4 mr-2" />
                  {t.viewLogs}
                </Button>
              </>
            )}
            <Button onClick={() => setIsNewTransactionOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t.newTransaction}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <div className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white">
              <TableRow>
                <TableHead className="w-[200px]">{t.company}</TableHead>
                <TableHead className="text-center">{t.runningBalance}</TableHead>
                <TableHead className="w-[120px] text-right">{t.details}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPeople.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    {searchQuery
                      ? t.noMatchingTransactions
                      : viewMode === "they-owe-me"
                        ? t.noOneOwesYou
                        : t.youDontOweAnyone}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPeople.map((person) => {
                  // Calculate the total amount for all transactions for this person
                  const totalAmount = calculateTotalAmount(person)

// Check if person has overdue transactions
                                  const personIsOverdue = isPersonOverdue(person)

                                  return (
                                    <>
                                      <TableRow key={`row-${person.id}`} className={personIsOverdue ? "bg-red-50" : ""}>
                                        <TableCell className={`font-medium ${personIsOverdue ? "text-red-600" : ""}`}>
                                          {person.name}
                                          {personIsOverdue && (
                                            <span className="ml-2 text-xs text-red-500 font-normal">({t.overdue})</span>
                                          )}
                                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`${viewMode === "they-owe-me" ? "text-green-500" : "text-red-500"}`}>
                            {viewMode === "they-owe-me" ? "+" : "-"} FCFA {formatCurrency(totalAmount)}
                          </span>
                          {totalAmount > 0 ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs ml-2 bg-transparent"
                              onClick={() => handleEditTransaction(person.id)}
                            >
                              {t.edit}
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" className="h-6 px-2 text-xs ml-2 bg-transparent" disabled>
                              {t.edit}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSoldOutClick(person)}
                              disabled={totalAmount === 0}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {t.settle}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => toggleExpand(person.id)}>
                              {expandedPerson === person.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                              <span className="sr-only">Toggle details</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedPerson === person.id && (
                        <TableRow key={`expanded-${person.id}`}>
                          <TableCell colSpan={3} className="p-0">
                            <TransactionDetails
                              person={person}
                              viewMode={viewMode}
                              monthFilter={monthFilter}
                              onToggleSettled={toggleTransactionSettled}
                              language={language}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {editingTransaction && (
        <EditTransactionDialog
          person={people.find((p) => p.id === editingTransaction.personId)!}
          totalAmount={editingTransaction.totalAmount}
          onClose={() => setEditingTransaction(null)}
          onUpdate={handleUpdateTransaction}
          viewMode={viewMode}
        />
      )}

      <NewTransactionDialog
        open={isNewTransactionOpen}
        onClose={() => setIsNewTransactionOpen(false)}
        onAdd={handleAddTransaction}
        existingPeople={people.map((p) => p.name)}
        initialPersonName={expandedPerson ? people.find((p) => p.id === expandedPerson)?.name : ""}
        viewMode={viewMode}
      />

      <SettleConfirmDialog
        open={isConfirmationOpen}
        onClose={() => {
          setIsConfirmationOpen(false)
          setSoldOutPerson(null)
        }}
        onConfirm={handleSettleConfirmation}
        personName={soldOutPerson?.name || ""}
      />

      <HistoryDialog
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        activityLogs={activityLogs}
        viewMode={viewMode}
        language={language}
      />

      <LogsDialog
        open={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        loginLogs={loginLogs}
        language={language}
        isAdmin={isAdmin}
      />

      {/* Add the TransactionReceipt component to the JSX */}
      <TransactionReceipt
        open={receiptData.open}
        onClose={() => setReceiptData({ ...receiptData, open: false })}
        title={receiptData.title}
        person={receiptData.person}
        transaction={receiptData.transaction}
        isSettlement={receiptData.isSettlement}
        viewMode={viewMode}
        paymentAmount={receiptData.paymentAmount}
      />
    </div>
  )
}
