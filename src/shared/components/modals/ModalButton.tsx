"use client"

import type { ButtonHTMLAttributes } from "react"

import styles from "./ModalButton.module.css"

interface ModalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "outline"
  /** "md" 48px (bawaan, dipakai modal lama), "sm" 40px untuk pop-up hasil scan. */
  size?: "md" | "sm"
  className?: string
}

export default function ModalButton({
  variant = "solid",
  size = "md",
  className = "",
  children,
  ...props
}: ModalButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
