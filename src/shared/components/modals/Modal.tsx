"use client"

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react"

import styles from "./Modal.module.css"

// Several modals can be open at once (e.g. the feedback form and its "leave?" prompt). Each one
// saving/restoring body.overflow on its own breaks when they unmount together — the last cleanup
// restores "hidden" — so the lock is shared: the first opener saves, the last closer restores.
let scrollLocks = 0
let overflowBeforeLock = ""

function lockScroll() {
  if (scrollLocks++ === 0) {
    overflowBeforeLock = document.body.style.overflow
    document.body.style.overflow = "hidden"
  }
  let released = false
  return () => {
    if (released) return
    released = true
    if (--scrollLocks === 0) document.body.style.overflow = overflowBeforeLock
  }
}

interface ModalProps {
  open: boolean
  onClose: () => void
  label: string
  /** Pixels, or any CSS length (e.g. a calc()) for a pop-up that stretches with the viewport. */
  width: number | string
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

    return lockScroll()
  }, [open])

  const vars = {
    "--modal-width": typeof width === "number" ? `${width}px` : width,
    "--modal-radius": `${radius}px`,
    "--modal-min-height": minHeight ? `${minHeight}px` : "auto",
  } as CSSProperties

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${typeof width === "string" ? styles.fluid : ""}`}
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
