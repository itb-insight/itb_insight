"use client"

import type { ButtonHTMLAttributes } from "react"

import styles from "./ModalButton.module.css"

interface ModalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "outline"
  className?: string
}

export default function ModalButton({
  variant = "solid",
  className = "",
  children,
  ...props
}: ModalButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.button} ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
