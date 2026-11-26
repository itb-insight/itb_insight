type IconProps = { className?: string }

function Box({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      {children}
    </span>
  )
}

/** fa-solid:monument — Megaprop */
export function MonumentIcon({ className }: IconProps) {
  return (
    <Box className={className}>
      <svg width="18" height="18" viewBox="0 0 384 512" fill="none">
        <path
          fill="currentColor"
          d="M368 448H16c-8.84 0-16 7.16-16 16v32c0 8.84 7.16 16 16 16h352c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16m-78.86-347.26a31.97 31.97 0 0 0-9.21-19.44L203.31 4.69c-6.25-6.25-16.38-6.25-22.63 0l-76.6 76.61a31.97 31.97 0 0 0-9.21 19.44L64 416h256zM240 307.2c0 6.4-6.4 12.8-12.8 12.8h-70.4c-6.4 0-12.8-6.4-12.8-12.8v-38.4c0-6.4 6.4-12.8 12.8-12.8h70.4c6.4 0 12.8 6.4 12.8 12.8z"
        />
      </svg>
    </Box>
  )
}

/** ic:baseline-fastfood — FnB */
export function FastfoodIcon({ className }: IconProps) {
  return (
    <Box className={className}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          fill="currentColor"
          d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26c1.44 1.42 2.43 2.89 2.43 5.29zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1m15.03-7c0-8-15.03-8-15.03 0zM1.02 17h15v2h-15z"
        />
      </svg>
    </Box>
  )
}

/** icon-park-solid:booth — Booth. Digambar 18x18 supaya stroke 4 pada viewBox 48 jatuh ke 1.5px seperti di dump. */
export function BoothIcon({ className }: IconProps) {
  return (
    <Box className={className}>
      <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        >
          <path
            fill="currentColor"
            d="M4 5h40v8l-1.398.84a7 7 0 0 1-7.203 0L34 13l-1.398.84a7 7 0 0 1-7.203 0L24 13l-1.398.84a7 7 0 0 1-7.203 0L14 13l-1.399.84a7 7 0 0 1-7.202 0L4 13z"
          />
          <path d="M6 25h36v18H6zm3-9v9m30-9v9" />
        </g>
      </svg>
    </Box>
  )
}

/** griddy-icons:toilet-filled — Toilet */
export function ToiletIcon({ className }: IconProps) {
  return (
    <Box className={className}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8.5 4a2 2 0 1 1-4 0a2 2 0 0 1 4 0m-6 4.25C2.5 7.56 3.035 7 3.685 7h5.63c.655 0 1.185.56 1.185 1.25v7.25h-2V22h-4v-6.5h-2zM17.5 6a2 2 0 1 0 0-4a2 2 0 0 0 0 4m5.14 9.5h-3.135V22h-4v-6.5h-3.14l2.065-7.58c.145-.54.645-.92 1.205-.92h3.735c.56 0 1.055.38 1.205.92z"
        />
      </svg>
    </Box>
  )
}

/** ic:sharp-mosque — Mushola */
export function MosqueIcon({ className }: IconProps) {
  return (
    <Box className={className}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          fill="currentColor"
          d="M6.12 8h11.76m0 0c.07-.29.12-.59.12-.91c0-1.31-.65-2.53-1.74-3.25L12 1L7.74 3.84A3.89 3.89 0 0 0 6 7.09c0 .32.05.62.12.91"
        />
        <path
          fill="currentColor"
          d="M24 7c0-1.1-2-3-2-3s-2 1.9-2 3c0 .74.4 1.38 1 1.72V13h-2V9H5v4H3V8.72c.6-.34 1-.98 1-1.72c0-1.1-2-3-2-3S0 5.9 0 7c0 .74.4 1.38 1 1.72V21h9v-6h4v6h9V8.72c.6-.34 1-.98 1-1.72"
        />
      </svg>
    </Box>
  )
}

/** ri:parking-fill — Parkir */
export function ParkingIcon({ className }: IconProps) {
  return (
    <Box className={className}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path fill="currentColor" d="M6 3h7a6 6 0 0 1 0 12h-3v6H6zm4 4v4h3a2 2 0 1 0 0-4z" />
      </svg>
    </Box>
  )
}

/** Car, front view. Drawn for this project in the same solid 24px style as the icons above. */
export function CarIcon({ className }: IconProps) {
  return (
    <Box className={className}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.1 4h11.8c.86 0 1.63.52 1.95 1.32l1.6 4.02A2.4 2.4 0 0 1 23 11.5V17a1 1 0 0 1-1 1h-1v1.5a1.5 1.5 0 0 1-3 0V18H6v1.5a1.5 1.5 0 0 1-3 0V18H2a1 1 0 0 1-1-1v-5.5a2.4 2.4 0 0 1 1.55-2.16l1.6-4.02A2.1 2.1 0 0 1 6.1 4m.4 2L5.1 9.5h13.8L17.5 6zM5.5 15a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3m13 0a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3M9 13.25c0-.41.34-.75.75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75"
        />
      </svg>
    </Box>
  )
}

/** Motorcycle, side view. Drawn for this project in the same solid 24px style as the icons above. */
export function MotorcycleIcon({ className }: IconProps) {
  return (
    <Box className={className}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        {/* wheels */}
        <path
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M5 12.5a4 4 0 1 1 0 8a4 4 0 0 1 0-8m0 2.2a1.8 1.8 0 1 0 0 3.6a1.8 1.8 0 0 0 0-3.6m14-2.2a4 4 0 1 1 0 8a4 4 0 0 1 0-8m0 2.2a1.8 1.8 0 1 0 0 3.6a1.8 1.8 0 0 0 0-3.6"
        />
        {/* seat, tank and engine */}
        <path
          fill="currentColor"
          d="M2 9.6c0-.33.27-.6.6-.6h5.15l1.6-1.6c.23-.23.53-.36.85-.36h4.35c.36 0 .7.16.93.44l1.3 1.6c.24.3.27.72.07 1.05l-2.4 4.1c-.21.37-.6.6-1.03.6H9.6c-.4 0-.77-.2-.99-.53L7.2 12.7c-.36-.53-.96-.85-1.6-.85H3.2c-.66 0-1.2-.54-1.2-1.2z"
        />
        {/* handlebar, fork and swingarm */}
        <path
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.6 4.6h2.6l1.8 11.9M9.4 14.2l-2.7 1.4"
        />
      </svg>
    </Box>
  )
}

/** Exits & Gates: a door with an arrow leading out. Same solid 24px style. */
export function ExitIcon({ className }: IconProps) {
  return (
    <Box className={className}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          fill="currentColor"
          d="M4 2h10a1 1 0 0 1 1 1v5h-2V4H5v16h8v-4h2v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1m12.3 5.3a1 1 0 0 1 1.4 0l4 4a1 1 0 0 1 0 1.4l-4 4a1 1 0 0 1-1.4-1.4l2.3-2.3H9a1 1 0 1 1 0-2h9.6l-2.3-2.3a1 1 0 0 1 0-1.4"
        />
      </svg>
    </Box>
  )
}

/** ion:search-sharp */
export function SearchIcon({ className }: IconProps) {
  return (
    <Box className={className}>
      <svg width="17.49" height="17.49" viewBox="0 0 512 512" fill="none">
        <path
          fill="currentColor"
          d="M464 428L339.92 303.9a160.48 160.48 0 0 0 30.72-94.58C370.64 120.37 298.27 48 209.32 48S48 120.37 48 209.32s72.37 161.32 161.32 161.32a160.48 160.48 0 0 0 94.58-30.72L428 464ZM209.32 319.69a110.38 110.38 0 1 1 110.37-110.37a110.5 110.5 0 0 1-110.37 110.37"
        />
      </svg>
    </Box>
  )
}

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <Box className={className}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M18.25 12H5.75m0 0 6-6m-6 6 6 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  )
}

/** nav-arrow-right */
export function ChevronRightIcon({ className }: IconProps) {
  return (
    <Box className={className}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="m9 6 6 6-6 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  )
}
