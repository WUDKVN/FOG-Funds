"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import type { Person, Transaction } from "@/lib/types"

interface TransactionReceiptProps {
  open: boolean
  onClose: () => void
  title: string
  person: Person
  transaction?: Transaction
  isSettlement?: boolean
  viewMode: "they-owe-me" | "i-owe-them"
  paymentAmount?: number
  language?: "fr" | "en"
}

const translations = {
  fr: {
    transactionDetails: "Détails de la transaction et informations du reçu",
    receipt: "Reçu",
    person: "Personne:",
    description: "Description:",
    comment: "Commentaire:",
    action: "Action:",
    accountSettlement: "Règlement du compte",
    settledAmount: "Montant réglé:",
    amount: "Montant:",
    newBalance: "Nouveau solde:",
    signature: "Signature:",
    thankYou: "Merci d'utiliser l'application Fund Management",
    close: "Fermer",
  },
  en: {
    transactionDetails: "Transaction details and receipt information",
    receipt: "Receipt",
    person: "Person:",
    description: "Description:",
    comment: "Comment:",
    action: "Action:",
    accountSettlement: "Account Settlement",
    settledAmount: "Settled Amount:",
    amount: "Amount:",
    newBalance: "New Balance:",
    signature: "Signature:",
    thankYou: "Thank you for using Fund Management App",
    close: "Close",
  },
}

// Helper function to format currency with spaces
function formatCurrencyWithSpaces(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

export function TransactionReceipt({
  open,
  onClose,
  title,
  person,
  transaction,
  isSettlement = false,
  viewMode,
  paymentAmount,
  language = "fr",
}: TransactionReceiptProps) {
  const t = translations[language]
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0]

  // Early return if person is undefined
  if (!person) {
    return null
  }

  // Calculate total amount for the person
  const calculateTotal = () => {
    if (paymentAmount !== undefined) {
      return paymentAmount
    }

    if (isSettlement) {
      // For settlements, calculate the total of all relevant transactions
      const relevantTransactions = person.transactions.filter((t) =>
        viewMode === "they-owe-me" ? t.amount > 0 : t.amount < 0,
      )
      return relevantTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    }

    if (!transaction) {
      // If no specific transaction, show the total for all transactions
      const relevantTransactions = person.transactions.filter((t) =>
        viewMode === "they-owe-me" ? t.amount > 0 : t.amount < 0,
      )
      return relevantTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    }

    // For a specific transaction, if it has an originalAmount, it means it was updated
    // and we want to show the deducted amount
    if (transaction.originalAmount !== undefined) {
      return Math.abs(transaction.amount) // This is now the deducted amount
    }

    // For a new transaction, show exactly what was entered
    return Math.abs(transaction.amount)
  }

  // Determine if this is a payment transaction (which should show a minus sign)
  const isPaymentTransaction = transaction?.description === "Payment"

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            {title}
          </DialogTitle>
          <DialogDescription>{t.transactionDetails}</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-muted/30 p-4 rounded-lg border">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">{t.receipt}</h3>
              <span className="text-sm text-muted-foreground">{today}</span>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.person}</span>
                <span className="font-medium">{person.name}</span>
              </div>

              {transaction && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.description}</span>
                    <span>{transaction.description}</span>
                  </div>

                  {transaction.comment && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.comment}</span>
                      <span className="text-right max-w-[200px]">{transaction.comment}</span>
                    </div>
                  )}
                </>
              )}

              {isSettlement && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.action}</span>
                  <span>{t.accountSettlement}</span>
                </div>
              )}

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between font-medium">
                  <span>{isSettlement ? t.settledAmount : t.amount}</span>
                  <span
                    className={
                      isPaymentTransaction || isSettlement
                        ? "text-red-500"
                        : viewMode === "they-owe-me"
                          ? "text-green-500"
                          : "text-red-500"
                    }
                  >
                    {/* Show the appropriate sign based on transaction type and view mode */}
                    {isPaymentTransaction
                      ? viewMode === "they-owe-me"
                        ? "- "
                        : "+ "
                      : isSettlement
                        ? "- "
                        : viewMode === "they-owe-me"
                          ? "+ "
                          : "- "}
                    FCFA {formatCurrencyWithSpaces(calculateTotal())}
                  </span>
                </div>

                {isSettlement && (
                  <div className="flex justify-between font-medium mt-2">
                    <span>{t.newBalance}</span>
                    <span className="text-green-500">FCFA 0</span>
                  </div>
                )}
              </div>
            </div>

            {/* Add signature display */}
            {(person.signature || (transaction && transaction.signature)) && (
              <div className="mt-4 border-t pt-4">
                <div className="text-muted-foreground mb-2">{t.signature}</div>
                <div className="border rounded-md p-2 bg-white">
                  <img
                    src={transaction?.signature || person.signature}
                    alt="Signature"
                    className="max-h-[100px] mx-auto"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">{t.thankYou}</div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>{t.close}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
