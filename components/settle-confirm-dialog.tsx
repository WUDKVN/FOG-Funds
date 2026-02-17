"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface SettleConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  personName: string
}

export function SettleConfirmDialog({ open, onClose, onConfirm, personName }: SettleConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Confirm Account Settlement
          </DialogTitle>
        </DialogHeader>
        <div className="pt-2 text-sm text-muted-foreground">
          Es tu sûr de vouloir changer toute transactions en rapport avec<span className="font-medium">{personName}</span>?
          <div className="mt-2">Cela marquera tous les soldes impayés comme réglés et ramènera le compte à zéro.</div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Yes, Settle Now</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
