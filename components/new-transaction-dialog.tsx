"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Check, ChevronsUpDown, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { SignatureCapture } from "@/components/signature-capture"

interface NewTransactionDialogProps {
  open: boolean
  onClose: () => void
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
  existingPeople: string[]
  initialPersonName?: string
  viewMode: "they-owe-me" | "i-owe-them"
  language?: "fr" | "en"
}

const translations = {
  fr: {
    title: "Nouvelle Transaction",
    description: "Entrez les détails de la nouvelle transaction",
    infoTheyOweMe: "Vous êtes en mode",
    theyOweMe: "Ils me doivent",
    iOweThem: "Je leur dois",
    infoSuffix: ". Toutes les nouvelles transactions seront enregistrées comme montants",
    infoTheyOweMeSuffix: " que les autres vous doivent.",
    infoIOweSuffix: " que vous devez aux autres.",
    person: "Personne",
    enterNamePlaceholder: "Entrez le nom ou sélectionnez ci-dessous...",
    selectFromContacts: "Sélectionner parmi les contacts existants...",
    searchPerson: "Rechercher une personne...",
    noPersonFound: "Aucune personne trouvée.",
    personExists: "Cette personne existe déjà. Voulez-vous ajouter cette transaction à la personne existante?",
    yesAddToExisting: "Oui, ajouter à la personne existante",
    amount: "Montant",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Description de la transaction",
    date: "Date",
    dueDate: "Date d'échéance",
    dueDateHint: "Optionnel: Définir une date limite de paiement. Les entrées en retard seront surlignées en rouge.",
    comment: "Commentaire",
    commentPlaceholder: "Détails optionnels sur cette transaction",
    noteZeroAmount: "Note: Mettre le montant à 0 marquera la transaction comme payée",
    signature: "Signature",
    cancel: "Annuler",
    addTransaction: "Ajouter Transaction",
  },
  en: {
    title: "New Transaction",
    description: "Enter the details for the new transaction",
    infoTheyOweMe: "You are in",
    theyOweMe: "They Owe Me",
    iOweThem: "I Owe Them",
    infoSuffix: " mode. All new transactions will be recorded as amounts",
    infoTheyOweMeSuffix: " others owe you.",
    infoIOweSuffix: " you owe others.",
    person: "Person",
    enterNamePlaceholder: "Enter name or select below...",
    selectFromContacts: "Select from existing contacts...",
    searchPerson: "Search person...",
    noPersonFound: "No person found.",
    personExists: "This person already exists. Do you want to add this transaction to the existing person?",
    yesAddToExisting: "Yes, add to existing person",
    amount: "Amount",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Transaction description",
    date: "Date",
    dueDate: "Due Date",
    dueDateHint: "Optional: Set a payment deadline. Overdue entries will be highlighted in red.",
    comment: "Comment",
    commentPlaceholder: "Optional details about this transaction",
    noteZeroAmount: "Note: Setting amount to 0 will mark the transaction as paid",
    signature: "Signature",
    cancel: "Cancel",
    addTransaction: "Add Transaction",
  },
}

export function NewTransactionDialog({
  open,
  onClose,
  onAdd,
  existingPeople,
  initialPersonName = "",
  viewMode,
  language = "fr",
}: NewTransactionDialogProps) {
  const t = translations[language]
  const [personName, setPersonName] = useState(initialPersonName)
  const [openCombobox, setOpenCombobox] = useState(false)
  const [amount, setAmount] = useState("")
  const [displayAmount, setDisplayAmount] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState("")
  const [comment, setComment] = useState("")
  const [nameExists, setNameExists] = useState(false)
  const [nameConfirmed, setNameConfirmed] = useState(false)
  const [signature, setSignature] = useState("")

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setPersonName(initialPersonName || "")
      setAmount("")
      setDisplayAmount("")
      setDescription("")
      setDate(new Date().toISOString().split("T")[0])
      setDueDate("")
      setComment("")
      setNameExists(false)
      setNameConfirmed(false)
      setSignature("")
    }
  }, [open, initialPersonName])

  // Check if name exists as user types
  useEffect(() => {
    if (personName) {
      const exists = existingPeople.some(
        (name) => name.toLowerCase() === personName.toLowerCase() && personName !== initialPersonName,
      )
      setNameExists(exists)

      // If name doesn't exist or it's the initial name or it was selected from dropdown, auto-confirm
      if (!exists || personName === initialPersonName || openCombobox === false) {
        setNameConfirmed(true)
      } else {
        setNameConfirmed(false)
      }
    } else {
      setNameExists(false)
      setNameConfirmed(false)
    }
  }, [personName, existingPeople, initialPersonName, openCombobox])

  // Handle amount input changes with formatting
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove any non-numeric characters
    const rawValue = e.target.value.replace(/[^\d]/g, "")

    // Convert to number
    const numericValue = rawValue ? Number.parseInt(rawValue, 10) : 0

    // Update the numeric state
    setAmount(numericValue.toString())

    // Format with spaces for display
    setDisplayAmount(rawValue ? rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!personName || !amount || !description || !date || !nameConfirmed) {
      return // Basic validation
    }

    const numericAmount = Number.parseFloat(amount)
    // If amount is 0, it's automatically considered settled
    const isSettled = numericAmount === 0 ? true : false

    onAdd(personName, numericAmount, description, date, comment, isSettled, signature, dueDate || undefined)
  }

  const confirmExistingName = () => {
    setNameConfirmed(true)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <div className="flex">
            <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              {t.infoTheyOweMe} <strong>{viewMode === "they-owe-me" ? t.theyOweMe : t.iOweThem}</strong>{t.infoSuffix}
              {viewMode === "they-owe-me" ? t.infoTheyOweMeSuffix : t.infoIOweSuffix}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="person" className="text-right">
                {t.person}
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  id="person"
                  placeholder={t.enterNamePlaceholder}
                  value={personName}
                  onChange={(e) => {
                    setPersonName(e.target.value)
                    // Auto-confirm new names that don't exist
                    const exists = existingPeople.some(
                      (name) => name.toLowerCase() === e.target.value.toLowerCase()
                    )
                    if (!exists && e.target.value.trim()) {
                      setNameConfirmed(true)
                    }
                  }}
                  className="w-full"
                />
                {existingPeople.length > 0 && (
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-full justify-between bg-transparent text-muted-foreground"
                      >
                        {t.selectFromContacts}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder={t.searchPerson} />
                        <CommandList>
                          <CommandEmpty>{t.noPersonFound}</CommandEmpty>
                          <CommandGroup>
                            {existingPeople.map((person) => (
                              <CommandItem
                                key={person}
                                value={person}
                                onSelect={(currentValue) => {
                                  setPersonName(currentValue)
                                  setOpenCombobox(false)
                                  setNameConfirmed(true)
                                }}
                              >
                                <Check
                                  className={cn("mr-2 h-4 w-4", personName === person ? "opacity-100" : "opacity-0")}
                                />
                                {person}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            {nameExists && !nameConfirmed && (
              <div className="col-span-4 col-start-2">
                <Alert variant="warning" className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    {t.personExists}
                  </AlertDescription>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
                    onClick={confirmExistingName}
                  >
                    {t.yesAddToExisting}
                  </Button>
                </Alert>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right text-base font-semibold">
                {t.amount}
              </Label>
              <div className="col-span-3 flex items-center">
                <span className="mr-2 text-xl font-bold">FCFA</span>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl font-bold">
                    {viewMode === "they-owe-me" ? "+" : ""}
                  </span>
                  <Input
                    id="amount"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={displayAmount}
                    onChange={handleAmountChange}
                    required
                    className="flex-1 pl-8 h-16 text-4xl font-bold tracking-wide"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                {t.descriptionLabel}
              </Label>
              <Input
                id="description"
                placeholder={t.descriptionPlaceholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                {t.date}
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dueDate" className="text-right">
                {t.dueDate}
              </Label>
              <Input
                id="dueDate"
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
              <Label htmlFor="comment" className="text-right">
                {t.comment}
              </Label>
              <Textarea
                id="comment"
                placeholder={t.commentPlaceholder}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-4 text-sm text-muted-foreground text-center">
                {t.noteZeroAmount}
              </div>
            </div>


          </div>
          <DialogFooter className="mt-6 pb-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={!nameConfirmed || !personName || !amount || !description || !date}>
              {t.addTransaction}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
