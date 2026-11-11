"use client"

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react"

import styles from "./Modal.module.css"

interface ModalProps {
  open: boolean
  onClose: () => void
  label: string
  width: number
  radius: number
  minHeight?: number
  children: ReactNode
}

export default function Modal({
  open,
  onClose,
  label,
  width,
  radius,
  minHeight,
  children,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open) return

    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  const vars = {
    "--modal-width": `${width}px`,
    "--modal-radius": `${radius}px`,
    "--modal-min-height": minHeight ? `${minHeight}px` : "auto",
  } as CSSProperties

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-label={label}
      style={vars}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
    >
      <div className={styles.panel}>{children}</div>
    </dialog>
  )
}
