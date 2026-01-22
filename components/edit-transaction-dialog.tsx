"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SignatureCapture } from "@/components/signature-capture"
import type { Person, Transaction } from "@/lib/types"

// Helper function to format currency with spaces
function formatCurrencyWithSpaces(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

// Update the props interface to make transaction optional
interface EditTransactionDialogProps {
  person: Person
  totalAmount: number
  transaction?: Transaction
  onClose: () => void
  onUpdate: (
    personId: string,
    transactionId: string,
    paymentAmount: number,
    description: string,
    date: string,
    comment: string,
    settled: boolean,
    signature?: string,
  ) => void
  viewMode: "they-owe-me" | "i-owe-them"
}

export function EditTransactionDialog({
  person,
  transaction,
  totalAmount,
  onClose,
  onUpdate,
  viewMode,
}: EditTransactionDialogProps) {
  // Initialize amount state with 0
  const [amount, setAmount] = useState<number>(0)

  // Format amount for display with spaces
  const [displayAmount, setDisplayAmount] = useState<string>("")

  // Initialize date with today's date
  const today = new Date().toISOString().split("T")[0]
  const [date, setDate] = useState(today)

  const [comment, setComment] = useState("")
  const [signature, setSignature] = useState(person.signature || "")

  // Format the total amount with spaces
  const formattedTotalAmount = formatCurrencyWithSpaces(Math.round(totalAmount))

  // Handle amount input changes
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove any non-numeric characters
    const rawValue = e.target.value.replace(/[^\d]/g, "")

    // Convert to number
    const numericValue = rawValue ? Number.parseInt(rawValue, 10) : 0

    // Update the numeric state
    setAmount(numericValue)

    // Format with spaces for display
    setDisplayAmount(rawValue ? rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "")
  }

  // Update the handleSubmit function to ensure consistent logic between both views
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Create a new transaction ID if we don't have a specific transaction
    const transactionId = `t${Date.now()}`

    // Create a description for the payment
    const paymentDescription = "Payment"

    // Pass the entered amount directly to the update handler
    // The sign will be handled in the update handler based on the view mode
    onUpdate(
      person.id,
      transactionId,
      amount,
      paymentDescription,
      date,
      comment,
      false, // We'll determine settled status in the update handler
      signature,
    )
  }

  // Check if the button should be enabled
  const isButtonEnabled = amount > 0 && amount <= totalAmount

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>Enter payment details to reduce the running balance</DialogDescription>
        </DialogHeader>
        <div className="mb-4 pb-2 border-b">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">MONTANT TOTAL</span>
            <span className={`${viewMode === "they-owe-me" ? "text-green-500" : "text-red-500"} font-medium`}>
              {viewMode === "they-owe-me" ? "+" : "-"} FCFA {formattedTotalAmount}
            </span>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="person" className="text-right">
                Person
              </Label>
              <Input id="person" value={person.name} disabled className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <div className="col-span-3 flex items-center">
                <span className="mr-2">FCFA</span>
                <Input
                  id="amount"
                  type="text"
                  inputMode="numeric"
                  value={displayAmount}
                  onChange={handleAmountChange}
                  className="flex-1"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="comment" className="text-right">
                Comment
              </Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="col-span-3"
                rows={3}
                placeholder="Optional payment details"
              />
            </div>

            {/* Update the note text to be clearer about what's happening */}
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-4 text-sm text-muted-foreground text-center">
                Note: This payment of {viewMode === "they-owe-me" ? "-" : "+"} FCFA {displayAmount || "0"} will be
                {viewMode === "they-owe-me" ? " deducted from" : " applied to"} the running balance
              </div>
            </div>

            {/* Show signature for both views */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="signature" className="text-right pt-2">
                Signature
              </Label>
              <div className="col-span-3">
                <SignatureCapture initialSignature={signature} onSignatureCapture={setSignature} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isButtonEnabled}>
              Enregistrer le paiement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
