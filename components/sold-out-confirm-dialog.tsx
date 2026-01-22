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

interface SoldOutConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  personName: string
}

export function SoldOutConfirmDialog({ open, onClose, onConfirm, personName }: SoldOutConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Settle Account</DialogTitle>
          <DialogDescription>
            Are you sure you want to settle the account with {personName}? This will zero out all outstanding balances.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm}>
            Confirm & Settle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
