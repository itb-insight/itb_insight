
interface IconProps {
  className?: string
}

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}


/** iconoir:home */
export function HomeIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m2 8l9.732-4.866a.6.6 0 0 1 .536 0L22 8m-2 3v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/>
    </Svg>
  )
}

/** iconoir:trophy */
export function TrophyIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"><path d="M6.745 4h10.568s-.88 13.257-5.284 13.257c-2.15 0-3.461-3.164-4.239-6.4C6.976 7.468 6.745 4 6.745 4"/><path d="M17.313 4s.921-.983 1.687-1c1.5-.034 1.777 1 1.777 1c.294.61.529 2.194-.88 3.657s-2.987 2.743-3.629 3.2M6.745 4S5.785 3.006 5 3c-1.5-.012-1.777 1-1.777 1c-.294.61-.529 2.194.88 3.657a30 30 0 0 0 3.687 3.2M8.507 20c0-1.829 3.522-2.743 3.522-2.743s3.523.914 3.523 2.743z"/></g>
    </Svg>
  )
}

/** iconoir:calendar */
export function CalendarIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 4V2m0 2v2m0-2h-4.5M3 10v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9zm0 0V6a2 2 0 0 1 2-2h2m0-2v4m14 4V6a2 2 0 0 0-2-2h-.5"/>
    </Svg>
  )
}

/** iconoir:chat-bubble */
export function ChatBubbleIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"><path fill="currentColor" d="M17 12.5a.5.5 0 1 0 0-1a.5.5 0 0 0 0 1m-5 0a.5.5 0 1 0 0-1a.5.5 0 0 0 0 1m-5 0a.5.5 0 1 0 0-1a.5.5 0 0 0 0 1"/><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.5 21.5l4.5-.838A9.96 9.96 0 0 0 12 22"/></g>
    </Svg>
  )
}

/** iconoir:coin */
export function CoinIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10"/><path d="M15 8.5c-.685-.685-1.891-1.161-3-1.191M9 15c.644.86 1.843 1.35 3 1.391m0-9.082c-1.32-.036-2.5.561-2.5 2.191c0 3 5.5 1.5 5.5 4.5c0 1.711-1.464 2.446-3 2.391m0-9.082V5.5m0 10.891V18.5"/></g>
    </Svg>
  )
}

/** iconoir:internet */
export function InternetIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <g fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10"/><path strokeLinecap="round" strokeLinejoin="round" d="M13 2.05S16 6 16 12m-5 9.95S8 18 8 12s3-9.95 3-9.95M2.63 15.5H12m-9.37-7h18.74"/><path d="M21.879 17.917c.494.304.463 1.043-.045 1.101l-2.567.291l-1.151 2.312c-.228.459-.933.234-1.05-.334l-1.255-6.116c-.099-.48.333-.782.75-.525z" clipRule="evenodd"/></g>
    </Svg>
  )
}

/** iconoir:closet */
export function ClosetIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <g fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14H8m8 0h-1"/><path d="M12 2h8.4a.6.6 0 0 1 .6.6v18.8a.6.6 0 0 1-.6.6H12m0-20H3.6a.6.6 0 0 0-.6.6v18.8a.6.6 0 0 0 .6.6H12m0-20v20"/></g>
    </Svg>
  )
}

/** iconoir:shop-alt */
export function ShopAltIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <g fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.485 3h-3.992l.5 5s1 1 2.5 1a3.23 3.23 0 0 0 2.139-.806a.5.5 0 0 0 .15-.465L21.076 3.5a.6.6 0 0 0-.591-.5Z"/><path d="m16.493 3l.5 5s-1 1-2.5 1s-2.5-1-2.5-1V3z"/><path d="M11.993 3v5s-1 1-2.5 1s-2.5-1-2.5-1l.5-5z"/><path d="M7.493 3H3.502a.6.6 0 0 0-.592.501L2.205 7.73a.5.5 0 0 0 .15.465c.328.29 1.061.806 2.138.806c1.5 0 2.5-1 2.5-1z"/><path d="M3 9v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9"/><path strokeMiterlimit="16" d="M14.833 21v-6a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v6"/></g>
    </Svg>
  )
}
