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
import type { Person } from "@/lib/types"

// Helper function to format currency with spaces
function formatCurrencyWithSpaces(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

const translations = {
  fr: {
    title: "Ajouter au solde",
    description: "Entrez les détails pour augmenter le solde courant",
    totalAmount: "MONTANT TOTAL",
    person: "Personne",
    date: "Date",
    amount: "Montant",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Description de la transaction",
    comment: "Commentaire",
    commentPlaceholder: "Détails optionnels sur cette transaction",
    noteAdd: "Note: Ce montant de",
    willBeAdded: "sera ajouté au",
    runningBalance: "solde courant",
    cancel: "Annuler",
    addAmount: "Ajouter au solde",
    dueDate: "Date d'échéance",
    dueDateHint: "Optionnel: Définir une date limite de paiement.",
  },
  en: {
    title: "Add to balance",
    description: "Enter details to increase the running balance",
    totalAmount: "TOTAL AMOUNT",
    person: "Person",
    date: "Date",
    amount: "Amount",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Transaction description",
    comment: "Comment",
    commentPlaceholder: "Optional details about this transaction",
    noteAdd: "Note: This amount of",
    willBeAdded: "will be added to the",
    runningBalance: "running balance",
    cancel: "Cancel",
    addAmount: "Add to balance",
    dueDate: "Due Date",
    dueDateHint: "Optional: Set a payment deadline.",
  },
}

interface AddAmountDialogProps {
  open: boolean
  onClose: () => void
  person: Person
  currentTotal: number
  viewMode: "they-owe-me" | "i-owe-them"
  language?: "fr" | "en"
  onAdd: (
    personName: string,
    amount: number,
    description: string,
    date: string,
    comment: string,
    settled: boolean,
    signature?: string,
    dueDate?: string,
  ) => void
}

export function AddAmountDialog({
  open,
  onClose,
  person,
  currentTotal,
  viewMode,
  language = "fr",
  onAdd,
}: AddAmountDialogProps) {
  const t = translations[language]
  const [amount, setAmount] = useState<number>(0)
  const [displayAmount, setDisplayAmount] = useState<string>("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState("")
  const [comment, setComment] = useState("")

  const formattedTotalAmount = formatCurrencyWithSpaces(Math.round(currentTotal))

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, "")
    const numericValue = rawValue ? Number.parseInt(rawValue, 10) : 0
    setAmount(numericValue)
    setDisplayAmount(rawValue ? rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !description || !date) return
    onAdd(person.name, amount, description, date, comment, false, undefined, dueDate || undefined)
    onClose()
  }

  const isButtonEnabled = amount > 0 && description.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>
        <div className="mb-4 pb-2 border-b">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t.totalAmount}</span>
            <span className={`${viewMode === "they-owe-me" ? "text-green-500" : "text-red-500"} font-bold text-2xl`}>
              {viewMode === "they-owe-me" ? "+" : "-"} FCFA {formattedTotalAmount}
            </span>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-person" className="text-right">
                {t.person}
              </Label>
              <Input id="add-person" value={person.name} disabled className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-amount" className="text-right text-base font-semibold">
                {t.amount}
              </Label>
              <div className="col-span-3 flex items-center">
                <span className="mr-2 text-xl font-bold">FCFA</span>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl font-bold text-green-600">
                    +
                  </span>
                  <Input
                    id="add-amount"
                    type="text"
                    inputMode="numeric"
                    value={displayAmount}
                    onChange={handleAmountChange}
                    className="flex-1 pl-8 h-16 text-4xl font-bold tracking-wide"
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-description" className="text-right">
                {t.descriptionLabel}
              </Label>
              <Input
                id="add-description"
                placeholder={t.descriptionPlaceholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-date" className="text-right">
                {t.date}
              </Label>
              <Input
                id="add-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-due-date" className="text-right">
                {t.dueDate}
              </Label>
              <Input
                id="add-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="col-span-3"
                min={date}
              />
              <div className="col-span-3 col-start-2 text-xs text-muted-foreground">
                {t.dueDateHint}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-comment" className="text-right">
                {t.comment}
              </Label>
              <Textarea
                id="add-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="col-span-3"
                rows={3}
                placeholder={t.commentPlaceholder}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-4 text-sm text-muted-foreground text-center">
                {t.noteAdd} + FCFA {displayAmount || "0"} {t.willBeAdded} {t.runningBalance}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={!isButtonEnabled}>
              {t.addAmount}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
