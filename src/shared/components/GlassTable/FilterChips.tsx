import gb from "./GradientBorder.module.css"
import styles from "./FilterChips.module.css"

export interface ChipOption<T extends string> {
  value: T
  label: string
}

interface FilterChipsProps<T extends string> {
  options: ChipOption<T>[]
  value: T
  onChange: (value: T) => void
  variant?: "light" | "dark"
  ariaLabel: string
}

export default function FilterChips<T extends string>({
  options,
  value,
  onChange,
  variant = "light",
  ariaLabel,
}: FilterChipsProps<T>) {
  return (
    <div className={`${styles.group} ${styles[variant]}`} role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            className={`${gb.border} ${styles.chip} ${active ? styles.active : ""}`}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
