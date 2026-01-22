"use client"

import type { Person } from "@/lib/types"

interface TransactionDetailsProps {
  person: Person
  viewMode: "they-owe-me" | "i-owe-them"
  monthFilter: string
  onToggleSettled?: (personId: string, transactionId: string) => void
  language?: "fr" | "en"
}

// Translation object
const translations = {
  en: {
    moneyOwesYou: "Money {name} owes you",
    moneyYouOwe: "Money you owe {name}",
    totalAmount: "TOTAL AMOUNT",
    noTransactions: "No transactions in this category. Add one to get started.",
    product: "Product",
  },
  fr: {
    moneyOwesYou: "Argent que {name} vous doit",
    moneyYouOwe: "Argent que vous devez à {name}",
    totalAmount: "MONTANT TOTAL",
    noTransactions: "Aucune transaction dans cette catégorie. Ajoutez-en une pour commencer.",
    product: "Produit",
  },
}

// Helper function to format currency with spaces
function formatCurrencyWithSpaces(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

// Update the TransactionDetails component to properly display transactions
export function TransactionDetails({
  person,
  viewMode,
  monthFilter,
  onToggleSettled,
  language = "fr",
}: TransactionDetailsProps) {
  // Get translations
  const t = translations[language]

  // Get all transactions, including payments
  const allTransactions = person.transactions

  // Update the filtering and display logic to handle both views consistently

  // Update the filter function to properly handle both views
  const filteredTransactions = allTransactions.filter((transaction) => {
    // Regular transactions based on view mode
    const isRegularTransaction = viewMode === "they-owe-me" ? transaction.amount > 0 : transaction.amount < 0

    // Payment transactions (negative in "they-owe-me", positive in "i-owe-them")
    const isPayment = transaction.description === "Payment" || transaction.isPayment
    const isPaymentForCurrentView = viewMode === "they-owe-me" ? transaction.amount < 0 : transaction.amount > 0

    // Include both regular transactions and payments for the current view
    return (isRegularTransaction && transaction.amount !== 0) || (isPayment && isPaymentForCurrentView)
  })

  // Calculate total balance for all transactions
  const totalAmount = allTransactions.reduce((sum, t) => {
    if (viewMode === "they-owe-me") {
      return sum + t.amount // Include both positive and negative amounts
    } else {
      return sum + t.amount // Include both positive and negative amounts
    }
  }, 0)

  return (
    <div className="p-4 bg-muted/50">
      <div className="mb-4">
        <h3 className="text-lg font-medium">
          {viewMode === "they-owe-me"
            ? t.moneyOwesYou.replace("{name}", person.name)
            : t.moneyYouOwe.replace("{name}", person.name)}
        </h3>
      </div>

      <div className="space-y-1 mb-6">
        <div className="flex justify-between items-center py-3 border-b">
          <div className="font-medium text-muted-foreground">{t.totalAmount}</div>
          <div className={`font-medium ${viewMode === "they-owe-me" ? "text-green-500" : "text-red-500"}`}>
            {viewMode === "they-owe-me" ? "+" : "-"} FCFA {formatCurrencyWithSpaces(Math.abs(totalAmount))}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">{t.noTransactions}</div>
        ) : (
          // Update the display logic in the return statement to handle both views consistently
          // Replace the existing transaction mapping with this:
          filteredTransactions.map((transaction) => {
            // Determine if this is a payment transaction
            const isPayment = transaction.description === "Payment" || transaction.isPayment

            // Determine the appropriate sign and color based on transaction type and view mode
            let sign, colorClass

            if (isPayment) {
              // Payments always reduce the balance, so they're always shown with a minus sign
              sign = "- "
              colorClass = "text-red-500 font-medium"
            } else if (viewMode === "they-owe-me") {
              // Regular transactions in "they-owe-me" view
              sign = transaction.amount > 0 ? "+ " : "- "
              colorClass = transaction.amount > 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"
            } else {
              // Regular transactions in "i-owe-them" view
              sign = transaction.amount < 0 ? "- " : "+ "
              colorClass = transaction.amount < 0 ? "text-red-500 font-medium" : "text-green-500 font-medium"
            }

            return (
              <div key={transaction.id} className="flex justify-between items-start py-3 border-b bg-gray-100">
                <div>
                  <div className="font-medium">{transaction.description}</div>
                  <div className="text-sm text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</div>
                  {transaction.comment && <div className="text-sm text-muted-foreground">{transaction.comment}</div>}
                </div>
                <div className={colorClass}>
                  {sign}FCFA {formatCurrencyWithSpaces(Math.abs(transaction.amount))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
