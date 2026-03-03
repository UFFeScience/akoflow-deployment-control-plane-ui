"use client"

import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-state"

interface DialogActionsProps {
  onCancel: () => void
  onSubmit: () => void
  submitLabel?: string
  cancelLabel?: string
  isSubmitting?: boolean
  isDisabled?: boolean
}

export function DialogActions({
  onCancel,
  onSubmit,
  submitLabel = "Create",
  cancelLabel = "Cancel",
  isSubmitting = false,
  isDisabled = false,
}: DialogActionsProps) {
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-xs"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        {cancelLabel}
      </Button>
      <Button
        size="sm"
        className="text-xs"
        onClick={onSubmit}
        disabled={isDisabled || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <LoadingSpinner size="sm" className="mr-1.5" />
            {submitLabel}...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </>
  )
}
