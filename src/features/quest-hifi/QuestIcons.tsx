/*
 * Ikon halaman Quest, diekspor apa adanya dari Figma (halaman "Quest", Section 2).
 *
 * Ikon yang memakai gradient butuh `id` unik per instance: kalau dua ikon memakai id
 * yang sama dan yang pertama tersembunyi (display: none), browser tidak menggambar
 * gradient-nya di ikon kedua. Karena itu ikon bergradient menerima prop `uid`.
 */

interface GradientIconProps {
  /** Awalan id gradient, unik per instance di halaman. */
  uid: string
  className?: string
}

interface IconProps {
  className?: string
}

const ICE_TOP = "#ACC7FF"
const ICE_BOTTOM = "#DEE8FB"

function IceStops() {
  return (
    <>
      <stop stopColor={ICE_BOTTOM} />
      <stop offset="1" stopColor={ICE_TOP} />
    </>
  )
}

/** Figma "user", 38 x 38 di header desktop. */
export function UserIcon({ uid, className }: GradientIconProps) {
  return (
    <svg className={className} width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden="true">
      <path
        d="M7.91667 31.6667V30.0833C7.91667 23.9622 12.8788 19 19 19C25.1212 19 30.0833 23.9622 30.0833 30.0833V31.6667"
        strokeWidth="2.375"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={`url(#${uid}-a)`}
      />
      <path
        d="M25.3333 12.6667C25.3333 16.1645 22.4978 19 19 19C15.5022 19 12.6667 16.1645 12.6667 12.6667C12.6667 9.16887 15.5022 6.33334 19 6.33334C22.4978 6.33334 25.3333 9.16887 25.3333 12.6667Z"
        strokeWidth="2.375"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={`url(#${uid}-b)`}
      />
      <defs>
        <linearGradient id={`${uid}-a`} x1="19" y1="31.6667" x2="19" y2="19" gradientUnits="userSpaceOnUse">
          <IceStops />
        </linearGradient>
        <linearGradient id={`${uid}-b`} x1="19" y1="19" x2="19" y2="6.33334" gradientUnits="userSpaceOnUse">
          <IceStops />
        </linearGradient>
      </defs>
    </svg>
  )
}

/** Figma "timer", 20 x 20 di pill poin mobile. */
export function TimerIcon({ uid, className }: GradientIconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M7.5 1.66663L12.5 1.66662" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke={`url(#${uid}-a)`} />
      <path d="M10 8.33337L10 11.6667" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke={`url(#${uid}-b)`} />
      <path
        d="M16.6667 11.6667C16.6667 15.3486 13.6819 18.3333 10 18.3333C6.31814 18.3333 3.33337 15.3486 3.33337 11.6667C3.33337 7.98477 6.31814 5 10 5C13.6819 5 16.6667 7.98477 16.6667 11.6667Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={`url(#${uid}-c)`}
      />
      <defs>
        <linearGradient id={`${uid}-a`} x1="10" y1="2.66663" x2="10" y2="1.66663" gradientUnits="userSpaceOnUse">
          <IceStops />
        </linearGradient>
        <linearGradient id={`${uid}-b`} x1="10.5" y1="11.6667" x2="10.5" y2="8.33337" gradientUnits="userSpaceOnUse">
          <IceStops />
        </linearGradient>
        <linearGradient id={`${uid}-c`} x1="10" y1="18.3333" x2="10" y2="5" gradientUnits="userSpaceOnUse">
          <IceStops />
        </linearGradient>
      </defs>
    </svg>
  )
}

/** Figma "menu", 31 x 31 di tombol hamburger mobile. */
export function MenuIcon({ className }: IconProps) {
  return (
    <svg className={className} width="31" height="31" viewBox="0 0 31 31" fill="none" aria-hidden="true">
      <path d="M3.87502 6.45834H27.125" strokeWidth="1.9375" strokeLinecap="round" strokeLinejoin="round" stroke="#1B3B7D" />
      <path d="M3.87502 15.4999H27.125" strokeWidth="1.9375" strokeLinecap="round" strokeLinejoin="round" stroke="#091B3F" />
      <path d="M3.87502 24.5417H27.125" strokeWidth="1.9375" strokeLinecap="round" strokeLinejoin="round" stroke="#091B3F" />
    </svg>
  )
}

/** Figma "cancel", 40 x 40 di pojok kiri atas How to play. */
export function CancelIcon({ uid, className }: GradientIconProps) {
  return (
    <svg className={className} width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M11.2638 28.7377L20.0015 20M20.0015 20L28.7393 11.2623M20.0015 20L11.2638 11.2623M20.0015 20L28.7393 28.7377"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={`url(#${uid})`}
      />
      <defs>
        <linearGradient id={uid} x1="28.7393" y1="28.7377" x2="11.2638" y2="11.2623" gradientUnits="userSpaceOnUse">
          <IceStops />
        </linearGradient>
      </defs>
    </svg>
  )
}

/** Figma "pin-alt", 16 x 16 di catatan lokasi How to play. */
export function PinIcon({ uid, className }: GradientIconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13.3334 6.66671C13.3334 9.61223 8.00002 14.6667 8.00002 14.6667C8.00002 14.6667 2.66669 9.61223 2.66669 6.66671C2.66669 3.72119 5.0545 1.33337 8.00002 1.33337C10.9455 1.33337 13.3334 3.72119 13.3334 6.66671Z"
        strokeWidth="2"
        stroke={`url(#${uid}-a)`}
      />
      <path
        d="M7.99998 7.33333C8.36817 7.33333 8.66665 7.03486 8.66665 6.66667C8.66665 6.29848 8.36817 6 7.99998 6C7.63179 6 7.33331 6.29848 7.33331 6.66667C7.33331 7.03486 7.63179 7.33333 7.99998 7.33333Z"
        fill={`url(#${uid}-b)`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={`url(#${uid}-b)`}
      />
      <defs>
        <linearGradient id={`${uid}-a`} x1="8.00002" y1="14.6667" x2="8.00002" y2="1.33337" gradientUnits="userSpaceOnUse">
          <IceStops />
        </linearGradient>
        <linearGradient id={`${uid}-b`} x1="7.99998" y1="7.33333" x2="7.99998" y2="6" gradientUnits="userSpaceOnUse">
          <IceStops />
        </linearGradient>
      </defs>
    </svg>
  )
}

/** Figma "arrow-left", 24 x 24 di kepala Quest Map. */
export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18.5 12H6M12 18L6 12L12 6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="#DEE8FB" />
    </svg>
  )
}

/** Figma "check", 18 x 18: tanda quest selesai di peta, juga centang kotak aturan. */
export function CheckIcon({ uid, className }: GradientIconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3.75 9.75L6.75 12.75L14.25 5.25"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={`url(#${uid})`}
        strokeOpacity="0.5"
      />
      <defs>
        <linearGradient id={uid} x1="10.5" y1="9" x2="7.5" y2="6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FAFAFA" />
          <stop offset="1" stopColor="#D3D3D3" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/* Navbar bawah. Warna garis ikut warna teks item (currentColor): #dee8fb aktif, #7fa9f6 lainnya. */

export function QuestsTabIcon({ className }: IconProps) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 9C9 5.49997 14.5 5.5 14.5 9C14.5 11.5 12 10.9999 12 13.9999" />
        <path d="M12 18.01L12.01 17.9989" />
        <path d="M5 18C4.58969 15.1278 3.50595 7.54165 3.13036 4.91253C3.05646 4.39524 3.39389 3.91247 3.90398 3.79912L11.5661 2.09641C11.8519 2.03291 12.1481 2.03291 12.4339 2.09641L20.096 3.79912C20.6061 3.91247 20.9435 4.39524 20.8696 4.91252C20.4941 7.54165 19.4103 15.1278 19 18C18.9293 18.495 18.5 21.5 12 21.5C5.5 21.5 5.07071 18.495 5 18Z" />
      </g>
    </svg>
  )
}

export function MapTabIcon({ className }: IconProps) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 5L9 3L3.41026 4.86325C3.16526 4.94491 3 5.1742 3 5.43246L3 20.1675C3 20.5771 3.40122 20.8663 3.78974 20.7368L9 19M15 5L20.2103 3.26325C20.5988 3.13374 21 3.42292 21 3.83246L21 18.5675C21 18.8258 20.8347 19.0551 20.5897 19.1368L15 21L9 19M9 19L9 3M15 21L15 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function BoardTabIcon({ className }: IconProps) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H15V12.6C15 12.2686 14.7314 12 14.4 12H9.6C9.26863 12 9 12.2686 9 12.6V21Z" />
        <path d="M15 21H20.4C20.7314 21 21 20.7314 21 20.4V18.1C21 17.7686 20.7314 17.5 20.4 17.5H15.6C15.2686 17.5 15 17.7686 15 18.1V21Z" />
        <path d="M9 21V16.1C9 15.7686 8.73137 15.5 8.4 15.5H3.6C3.26863 15.5 3 15.7686 3 16.1V20.4C3 20.7314 3.26863 21 3.6 21H9Z" />
        <path d="M10.8056 5.11325L11.7147 3.1856C11.8314 2.93813 12.1686 2.93813 12.2853 3.1856L13.1944 5.11325L15.2275 5.42427C15.4884 5.46418 15.5923 5.79977 15.4035 5.99229L13.9326 7.4917L14.2797 9.60999C14.3243 9.88202 14.0515 10.0895 13.8181 9.96099L12 8.96031L10.1819 9.96099C9.94851 10.0895 9.67568 9.88202 9.72026 9.60999L10.0674 7.4917L8.59651 5.99229C8.40766 5.79977 8.51163 5.46418 8.77248 5.42427L10.8056 5.11325Z" />
      </g>
    </svg>
  )
}

export function RewardsTabIcon({ className }: IconProps) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12V21.4C20 21.7314 19.7314 22 19.4 22H4.6C4.26863 22 4 21.7314 4 21.4V12" />
        <path d="M2.6 12H21.4C21.7314 12 22 11.7314 22 11.4V7.6C22 7.26863 21.7314 7 21.4 7H2.6C2.26863 7 2 7.26863 2 7.6V11.4C2 11.7314 2.26863 12 2.6 12Z" />
        <path d="M12 22V7" />
        <path d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C11 2 12 7 12 7Z" />
        <path d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z" />
      </g>
    </svg>
  )
}

/** Figma "scanning", 24 x 24 di tombol scan tengah. Warnanya memang beda per garis di Figma. */
export function ScanIcon({ className }: IconProps) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3H3V6" stroke="#1B3B7D" />
        <path d="M2 12H12L22 12" stroke="#0B0B0B" />
        <path d="M18 3H21V6" stroke="#0B0B0B" />
        <path d="M6 21H3V18" stroke="#0B0B0B" />
        <path d="M18 21H21V18" stroke="#0B0B0B" />
      </g>
    </svg>
  )
}
