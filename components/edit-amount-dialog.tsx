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
import { formatCurrency } from "@/components/transaction-table"

interface EditAmountDialogProps {
  open: boolean
  onClose: () => void
  personName: string
  personId: string
  currentAmount: number
  viewMode: "they-owe-me" | "i-owe-them"
  language: "fr" | "en"
  onSave: (personId: string, newAmount: number) => Promise<void>
}

const translations = {
  fr: {
    title: "Modifier le montant",
    description: "Modifier directement le solde courant",
    currentAmount: "Montant actuel",
    newAmount: "Nouveau montant",
    person: "Personne",
    cancel: "Annuler",
    save: "Enregistrer",
    note: "Note: Cela modifiera directement le solde sans ajouter ni soustraire.",
  },
  en: {
    title: "Edit amount",
    description: "Directly change the running balance",
    currentAmount: "Current amount",
    newAmount: "New amount",
    person: "Person",
    cancel: "Cancel",
    save: "Save",
    note: "Note: This will directly change the balance without adding or subtracting.",
  },
}

export function EditAmountDialog({
  open,
  onClose,
  personName,
  personId,
  currentAmount,
  viewMode,
  language,
  onSave,
}: EditAmountDialogProps) {
  const t = translations[language]
  const [newAmount, setNewAmount] = useState("")
  const [displayAmount, setDisplayAmount] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, "")
    const numericValue = rawValue ? Number.parseInt(rawValue, 10) : 0
    setNewAmount(numericValue.toString())
    setDisplayAmount(rawValue ? rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAmount || Number(newAmount) === currentAmount) return

    setIsSaving(true)
    try {
      await onSave(personId, Number(newAmount))
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const isValid = newAmount && Number(newAmount) !== currentAmount && Number(newAmount) >= 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t.person}</Label>
              <Input value={personName} disabled className="col-span-3" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t.currentAmount}</Label>
              <div className="col-span-3">
                <div className={`text-2xl font-bold ${viewMode === "they-owe-me" ? "text-green-600" : "text-red-600"}`}>
                  FCFA {formatCurrency(currentAmount)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-amount" className="text-right text-base font-semibold">
                {t.newAmount}
              </Label>
              <div className="col-span-3 flex items-center">
                <span className="mr-2 text-lg font-bold">FCFA</span>
                <Input
                  id="new-amount"
                  type="text"
                  inputMode="numeric"
                  value={displayAmount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="flex-1 h-14 text-2xl font-bold tracking-wide"
                  autoFocus
                />
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center px-4">
              {t.note}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={!isValid || isSaving}>
              {isSaving ? "..." : t.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
