"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronUp, Plus, Minus, Search, X, CheckCircle, History, Globe, FileText, Archive } from "lucide-react"
import { TransactionDetails } from "@/components/transaction-details"
import { EditTransactionDialog } from "@/components/edit-transaction-dialog"
import { NewTransactionDialog } from "@/components/new-transaction-dialog"
import { SettleConfirmDialog } from "@/components/settle-confirm-dialog"
import { EditAmountDialog } from "@/components/edit-amount-dialog"
import { SettledListDialog } from "@/components/settled-list-dialog"
import { useToast } from "@/hooks/use-toast"
import type { Person, Transaction, ActivityLog, LoginLog } from "@/lib/types"
import { LogsDialog } from "@/components/logs-dialog"
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
  const [people, setPeople] = useState<Person[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
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

  // Add state for settled list dialog
  const [isSettledListOpen, setIsSettledListOpen] = useState(false)

  // Add state for inline amount editing
  const [editingAmount, setEditingAmount] = useState<{
    personId: string
    personName: string
    currentAmount: number
  } | null>(null)

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

  // Fetch persons and transactions from database (shared across all users)
  const fetchPersonsFromDB = async () => {
    try {
      setIsLoadingData(true)
      const response = await fetch("/api/persons")
      const data = await response.json()
      if (data.persons) {
        // Transform data to match the expected format
        const formattedPersons = data.persons.map((p: any) => ({
          id: p.id,
          name: p.name,
          signature: p.signature,
          transactions: (p.transactions || []).map((t: any) => ({
            id: t.id,
            date: t.date ? new Date(t.date).toISOString().split("T")[0] : "",
            dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split("T")[0] : undefined,
            description: t.description,
            amount: Number(t.amount),
            comment: t.comment,
            settled: t.settled,
            signature: t.signature,
            type: t.type,
            isPayment: t.isPayment,
          })),
        }))
        setPeople(formattedPersons)
      }
    } catch (error) {
      console.error("Error fetching persons:", error)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Load data from database on mount and refresh periodically
  useEffect(() => {
    fetchPersonsFromDB()
    
    // Refresh data every 5 seconds for real-time sync
    const interval = setInterval(() => {
      fetchPersonsFromDB()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Load user from localStorage or sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("loggedInUser") || sessionStorage.getItem("loggedInUser")
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

      // Restore saved table state after re-login
      const savedState = localStorage.getItem("tableState")
      if (savedState) {
        try {
          const state = JSON.parse(savedState)
          if (state.viewMode) setViewMode(state.viewMode)
          if (state.language) setLanguage(state.language)
          if (state.expandedPerson) setExpandedPerson(state.expandedPerson)
          if (state.searchQuery) setSearchQuery(state.searchQuery)
          if (state.monthFilter) setMonthFilter(state.monthFilter)
          if (state.statusFilter) setStatusFilter(state.statusFilter)
          localStorage.removeItem("tableState")
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [])

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

  // Helper function to add activity log - saves to database
  const addActivityLog = async (
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

    // Save to database
    try {
      await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          action,
          category: viewMode,
          description,
          personName,
          amount,
        }),
      })
    } catch (error) {
      console.error("Error saving activity log:", error)
    }
  }

  // Fetch activity logs from database
  const fetchActivityLogs = async () => {
    try {
      const response = await fetch(`/api/activity?role=${currentUser.role}`)
      const data = await response.json()
      if (data.logs) {
        setActivityLogs(data.logs)
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error)
    }
  }

  // Load activity logs on mount and auto-refresh every 3 seconds (admin only)
  useEffect(() => {
    if (currentUser.role === "admin") {
      fetchActivityLogs()
      
      // Auto-refresh every 3 seconds for real-time sync
      const interval = setInterval(() => {
        fetchActivityLogs()
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [currentUser.role])

  // Get translations based on current language
  const t = translations[language]

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

  // Update the handleUpdateTransaction function to work with running balance and save to database
  const handleUpdateTransaction = async (
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

    // Calculate if this payment will settle the account
    const currentTotal = calculateTotalAmount(person)
    const willBeSettled = Math.abs(updatedAmount - currentTotal) < 0.01

    try {
      // Save payment transaction to database
      const response = await fetch("/api/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId,
          paymentAmount: updatedAmount,
          description: updatedDescription || (language === "fr" ? "Paiement" : "Payment"),
          date: updatedDate,
          comment: updatedComment || (language === "fr" ? "Paiement" : "Payment"),
          settled: willBeSettled,
          signature,
          type: viewMode,
          isPayment: true,
          userId: currentUser.id,
        }),
      })
      const data = await response.json()

      // Create local payment transaction object for UI
      const paymentTransaction: Transaction = {
        id: data.id || `t${Date.now()}`,
        date: updatedDate,
        description: updatedDescription || (language === "fr" ? "Paiement" : "Payment"),
        amount: viewMode === "they-owe-me" ? -updatedAmount : updatedAmount,
        comment: updatedComment || (language === "fr" ? "Paiement" : "Payment"),
        settled: true,
        signature: signature,
        isPayment: true,
      }

      // Show receipt after update
      setReceiptData({
        open: true,
        title: willBeSettled 
          ? (language === "fr" ? "Compte Soldé" : "Account Settled") 
          : (language === "fr" ? "Paiement Enregistré" : "Payment Recorded"),
        person,
        transaction: paymentTransaction,
        isSettlement: willBeSettled,
        paymentAmount: updatedAmount,
      })

      // Log the activity
      if (willBeSettled) {
        addActivityLog(
          "payment",
          `${currentUser.name} a enregistré un paiement de FCFA ${formatCurrency(updatedAmount)} pour ${person.name} et a soldé le compte. Toutes les transactions ont été supprimées.`,
          person.name,
          updatedAmount,
        )

        // Archive to settled list before deleting
        await fetch("/api/settled", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personName: person.name,
            personId: personId,
            totalAmount: currentTotal,
            currency: "FCFA",
            type: viewMode,
            userId: currentUser.id,
            userName: currentUser.name,
            transactions: person.transactions,
            notes: `Settled via full payment of FCFA ${formatCurrency(updatedAmount)}`,
          }),
        })

        // If fully settled, delete the person and all their transactions from the DB
        await fetch(`/api/transactions?personId=${personId}`, {
          method: "DELETE",
        })

        setRecentlySettledPerson(person.name)
        setShowSettledMessage(true)

        setTimeout(() => {
          setShowSettledMessage(false)
          setRecentlySettledPerson(null)
        }, 5000)

        // Close expanded since the person will be gone
        setExpandedPerson(null)
      } else {
        addActivityLog(
          "payment",
          `${currentUser.name} a enregistré un paiement de FCFA ${formatCurrency(updatedAmount)} pour ${person.name}.`,
          person.name,
          updatedAmount,
        )

        // Expand the person details
        setExpandedPerson(personId)
      }

      // Refresh data from database to ensure sync
      await fetchPersonsFromDB()
    } catch (error) {
      console.error("Error updating transaction:", error)
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description: language === "fr" ? "Impossible d'enregistrer le paiement" : "Failed to record payment",
        variant: "destructive",
      })
    }

    setEditingTransaction(null)
  }

  // Update handleAddTransaction to include settled status and save to database
  const handleAddTransaction = async (
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

    try {
      // Check if person exists in database or create new one
      const personResponse = await fetch("/api/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: personName, signature, userId: currentUser.id }),
      })
      const personData = await personResponse.json()
      const personId = personData.id

      // Create transaction in database
      const txnResponse = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId,
          description,
          amount: signedAmount,
          date,
          dueDate,
          comment,
          settled: isSettled,
          signature,
          type: viewMode,
          isPayment: false,
          userId: currentUser.id,
        }),
      })
      const txnData = await txnResponse.json()

      // Refresh from database to get the canonical data for all users
      await fetchPersonsFromDB()

      // Create local transaction object for receipt display
      const newTransaction: Transaction = {
        id: txnData.id,
        date,
        description,
        amount: signedAmount,
        comment,
        settled: isSettled,
        signature,
        dueDate,
      }

      // Find the person for the receipt
      const updatedPerson: Person = {
        id: personId,
        name: personName,
        transactions: [newTransaction],
        signature,
      }

      // Show receipt
      setReceiptData({
        open: true,
        title: language === "fr" ? "Transaction Ajoutée" : "Transaction Added",
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

    } catch (error) {
      console.error("Error adding transaction:", error)
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description: language === "fr" ? "Impossible d'ajouter la transaction" : "Failed to add transaction",
        variant: "destructive",
      })
    }

    setIsNewTransactionOpen(false)
  }

  // Update the handleSoldOutClick function to show confirmation first
  const handleSoldOutClick = (person: Person) => {
    setSoldOutPerson(person)
    // Show confirmation dialog first instead of immediately sending PIN
    setIsConfirmationOpen(true)
  }

  // Add a new function to handle confirmation
  const handleSettleConfirmation = async () => {
    // Close confirmation dialog
    setIsConfirmationOpen(false)

    if (!soldOutPerson) return

    // Store the person's name and amount before settlement for the success message
    const personName = soldOutPerson.name
    const totalAmount = calculateTotalAmount(soldOutPerson)
    const personCopy = { ...soldOutPerson }

    try {
      // Archive the person and their transactions to the settled list
      await fetch("/api/settled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personName: soldOutPerson.name,
          personId: soldOutPerson.id,
          totalAmount: totalAmount,
          currency: "FCFA",
          type: viewMode,
          userId: currentUser.id,
          userName: currentUser.name,
          transactions: soldOutPerson.transactions,
        }),
      })

      // Delete the person and all their transactions from the active database
      await fetch(`/api/transactions?personId=${soldOutPerson.id}`, {
        method: "DELETE",
      })

      // Refresh from database to ensure sync across all users
      await fetchPersonsFromDB()
    } catch (error) {
      console.error("Error settling transactions:", error)
    }

    // Close any expanded person
    setExpandedPerson(null)

    // Show receipt
    setReceiptData({
      open: true,
      title: language === "fr" ? "Compte Soldé" : "Account Settled",
      person: personCopy,
      isSettlement: true,
    })

    // Show success message
    setRecentlySettledPerson(personName)
    setShowSettledMessage(true)

    // Log the activity (this persists the history in the activity_logs table)
    addActivityLog(
      "settle",
      `${currentUser.name} a soldé le compte de ${personName} (FCFA ${formatCurrency(totalAmount)}). Toutes les transactions ont été supprimées.`,
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
  const toggleTransactionSettled = async (personId: string, transactionId: string) => {
    // Find the person and transaction for logging
    const person = people.find((p) => p.id === personId)
    const transaction = person?.transactions.find((t) => t.id === transactionId)

    if (!transaction) return

    try {
      // Persist the change to the database
      await fetch("/api/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          paymentAmount: transaction.amount === 0 ? -(transaction.originalAmount || 50) : Math.abs(transaction.amount),
          settled: transaction.amount !== 0,
          userId: currentUser.id,
        }),
      })

      // Refresh from database to ensure sync
      await fetchPersonsFromDB()
    } catch (error) {
      console.error("Error toggling settled status:", error)
    }

    // Log the activity
    if (transaction) {
      const amount = Math.abs(transaction.originalAmount || transaction.amount || 0)
      if (transaction.amount === 0) {
        addActivityLog(
          "unsettle",
          `${currentUser.name} a annulé le règlement de la transaction "${transaction.description}" pour ${person?.name} (FCFA ${formatCurrency(amount)}).`,
          person?.name || "",
          amount,
        )
      } else {
        addActivityLog(
          "settle",
          `${currentUser.name} a réglé la transaction "${transaction.description}" pour ${person?.name} (FCFA ${formatCurrency(amount)}).`,
          person?.name || "",
          amount,
        )
      }
    }
  }

  // Handle direct amount edit (click on amount to change it)
  const handleDirectAmountEdit = async (personId: string, newAmount: number) => {
    try {
      await fetch("/api/transactions/edit-amount", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId,
          newAmount,
          type: viewMode,
          userId: currentUser.id,
        }),
      })

      const person = people.find((p) => p.id === personId)
      if (person) {
        addActivityLog(
          "edit",
          `${currentUser.name} a modifie directement le montant de ${person.name} a FCFA ${formatCurrency(newAmount)}.`,
          person.name,
          newAmount,
        )
      }

      await fetchPersonsFromDB()

      toast({
        title: language === "fr" ? "Montant modifie" : "Amount updated",
        description: language === "fr" ? "Le solde a ete mis a jour." : "The balance has been updated.",
      })
    } catch (error) {
      console.error("Error editing amount:", error)
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description: language === "fr" ? "Impossible de modifier le montant" : "Failed to edit amount",
        variant: "destructive",
      })
    }
  }

  // Toggle language between French and English
  const toggleLanguage = () => {
    setLanguage(language === "fr" ? "en" : "fr")
  }

  // Save table state before logout (triggered by storage event)
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === "lastLocation" && e.newValue) {
      saveTableState()
    }
  }

  const saveTableState = () => {
    const state = {
      viewMode,
      language,
      expandedPerson,
      searchQuery,
      monthFilter,
      statusFilter,
    }
    localStorage.setItem("tableState", JSON.stringify(state))
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange)
      
      // Also save periodically to handle same-tab logout
      const interval = setInterval(() => {
        if (localStorage.getItem("lastLocation")) {
          saveTableState()
        }
      }, 500)

      return () => {
        window.removeEventListener("storage", handleStorageChange)
        clearInterval(interval)
      }
    }
  }, [viewMode, language, expandedPerson, searchQuery, monthFilter, statusFilter])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {/* View Mode Switch */}
        <div className="bg-muted/40 p-3 sm:p-4 rounded-lg border">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch id="view-mode" checked={viewMode === "i-owe-them"} onCheckedChange={toggleViewMode} />
                <Label htmlFor="view-mode" className="font-medium text-sm sm:text-base">
                  {viewMode === "they-owe-me" ? t.peopleWhoOweMe : t.peopleIOwe}
                </Label>
              </div>
              <Button variant="outline" size="sm" onClick={toggleLanguage} className="flex items-center gap-1 sm:gap-2 bg-transparent text-xs sm:text-sm">
                <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{language === "fr" ? "English" : "Français"}</span>
                <span className="sm:hidden">{language === "fr" ? "EN" : "FR"}</span>
              </Button>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              {viewMode === "they-owe-me" ? t.showingPeopleWhoOweYou : t.showingPeopleYouOwe}
            </p>
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
          <div className="flex gap-1 sm:gap-2 flex-wrap justify-end">
            {isAdmin && (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsHistoryOpen(true)} className="text-xs sm:text-sm">
                  <History className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t.viewHistory}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsLogsOpen(true)} className="text-xs sm:text-sm">
                  <FileText className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t.viewLogs}</span>
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsSettledListOpen(true)} className="text-xs sm:text-sm">
              <Archive className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{language === "fr" ? "Soldes" : "Settled"}</span>
            </Button>
            <Button size="sm" onClick={() => setIsNewTransactionOpen(true)} className="text-xs sm:text-sm">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t.newTransaction}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="max-h-[60vh] sm:max-h-[600px] overflow-y-auto overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="min-w-[120px] sm:w-[200px]">{t.company}</TableHead>
                <TableHead className="text-center min-w-[140px]">{t.runningBalance}</TableHead>
                <TableHead className="min-w-[100px] sm:w-[120px] text-right">{t.details}</TableHead>
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
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                            <button
                              type="button"
                              className={`text-sm sm:text-base whitespace-nowrap font-medium cursor-pointer hover:underline underline-offset-2 transition-colors ${viewMode === "they-owe-me" ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"}`}
                              onClick={() => {
                                if (totalAmount > 0) {
                                  setEditingAmount({
                                    personId: person.id,
                                    personName: person.name,
                                    currentAmount: totalAmount,
                                  })
                                }
                              }}
                              title={language === "fr" ? "Cliquez pour modifier le montant" : "Click to edit amount"}
                            >
                              {viewMode === "they-owe-me" ? "+" : "-"} FCFA {formatCurrency(totalAmount)}
                            </button>
                            {totalAmount > 0 ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 bg-transparent"
                                onClick={() => handleEditTransaction(person.id)}
                                title={language === "fr" ? "Soustraire du solde" : "Subtract from balance"}
                              >
                                <Minus className="h-3.5 w-3.5" />
                                <span className="sr-only">{language === "fr" ? "Soustraire" : "Subtract"}</span>
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" className="h-7 w-7 p-0 bg-transparent" disabled>
                                <Minus className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSoldOutClick(person)}
                              disabled={totalAmount === 0}
                              className="text-xs sm:text-sm px-2 sm:px-3"
                            >
                              <CheckCircle className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">{t.settle}</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => toggleExpand(person.id)} className="h-8 w-8 sm:h-9 sm:w-9">
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
          language={language}
        />
      )}

      <NewTransactionDialog
        open={isNewTransactionOpen}
        onClose={() => setIsNewTransactionOpen(false)}
        onAdd={handleAddTransaction}
        existingPeople={people.map((p) => p.name)}
        initialPersonName={expandedPerson ? people.find((p) => p.id === expandedPerson)?.name : ""}
        viewMode={viewMode}
        language={language}
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
        language={language}
        isAdmin={isAdmin}
      />

      {/* Edit Amount Dialog (inline click-to-edit) */}
      {editingAmount && (
        <EditAmountDialog
          open={true}
          onClose={() => setEditingAmount(null)}
          personName={editingAmount.personName}
          personId={editingAmount.personId}
          currentAmount={editingAmount.currentAmount}
          viewMode={viewMode}
          language={language}
          onSave={handleDirectAmountEdit}
        />
      )}

      {/* Settled List Dialog */}
      <SettledListDialog
        open={isSettledListOpen}
        onClose={() => setIsSettledListOpen(false)}
        language={language}
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
        language={language}
      />
    </div>
  )
}
