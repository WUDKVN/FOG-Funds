"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface SignatureCaptureProps {
  initialSignature?: string
  onSignatureCapture: (signature: string) => void
}

export function SignatureCapture({ initialSignature, onSignatureCapture }: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(!!initialSignature)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height)

    // Set up canvas
    context.lineWidth = 2
    context.lineCap = "round"
    context.strokeStyle = "#000"

    // Load initial signature if available
    if (initialSignature) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        context.drawImage(img, 0, 0)
      }
      img.src = initialSignature
    }
  }, [initialSignature])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    setIsDrawing(true)
    setHasSignature(true)

    // Get position
    let clientX: number, clientY: number

    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    context.beginPath()
    context.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    // Get position
    let clientX: number, clientY: number

    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
      e.preventDefault() // Prevent scrolling when drawing
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    context.lineTo(x, y)
    context.stroke()
  }

  const endDrawing = () => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    context.closePath()
    setIsDrawing(false)

    // Save signature
    const signatureData = canvas.toDataURL("image/png")
    onSignatureCapture(signatureData)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    context.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    onSignatureCapture("")
  }

  return (
    <div className="space-y-2">
      <div className="border rounded-md bg-background p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clearSignature} disabled={!hasSignature}>
          Clear
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Sign above to confirm transactions</p>
    </div>
  )
}
