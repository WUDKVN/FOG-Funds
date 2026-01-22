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
}

export function NewTransactionDialog({
  open,
  onClose,
  onAdd,
  existingPeople,
  initialPersonName = "",
  viewMode,
}: NewTransactionDialogProps) {
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
          <DialogTitle>New Transaction</DialogTitle>
          <DialogDescription>Enter the details for the new transaction</DialogDescription>
        </DialogHeader>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <div className="flex">
            <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              You are in <strong>{viewMode === "they-owe-me" ? "They Owe Me" : "I Owe Them"}</strong> mode. All new
              transactions will be recorded as amounts
              {viewMode === "they-owe-me" ? " others owe you." : " you owe others."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="person" className="text-right">
                Person
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  id="person"
                  placeholder="Enter name or select below..."
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
                        Select from existing contacts...
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search person..." />
                        <CommandList>
                          <CommandEmpty>No person found.</CommandEmpty>
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
                    This person already exists. Do you want to add this transaction to the existing person?
                  </AlertDescription>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
                    onClick={confirmExistingName}
                  >
                    Yes, add to existing person
                  </Button>
                </Alert>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <div className="col-span-3 flex items-center">
                <span className="mr-2">FCFA</span>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
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
                    className="flex-1 pl-8"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                placeholder="e.g., Dinner, Movie tickets"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="col-span-3"
              />
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
                required
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dueDate" className="text-right">
                Due Date
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
                Optional: Set a payment deadline. Overdue entries will be highlighted in red.
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="comment" className="text-right">
                Comment
              </Label>
              <Textarea
                id="comment"
                placeholder="Optional details about this transaction"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-4 text-sm text-muted-foreground text-center">
                Note: Setting amount to 0 will mark the transaction as paid
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
          <DialogFooter className="mt-6 pb-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!nameConfirmed || !personName || !amount || !description || !date}>
              Add Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
