import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

export function HomeIcon({ size, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="28.25 34 19.5 18.75"
      width={size ?? 19.5}
      height={size ? (size * 18.75) / 19.5 : 18.75}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
    <path d="M40.0732 35.2565L45.0732 38.2868C46.2694 39.0117 47 40.3089 47 41.7076V48C47 50.2091 45.2091 52 43 52H33C30.7909 52 29 50.2091 29 48V41.7076C29 40.3089 29.7306 39.0118 30.9268 38.2868L35.9268 35.2565C37.2011 34.4842 38.7989 34.4842 40.0732 35.2565Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M35 48H41" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}






export function StoreIcon({ size, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="49.25 443.25 18.25 17.5"
      width={size ?? 18.25}
      height={size ? (size * 17.5) / 18.25 : 17.5}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
    <path d="M49.9999 444H66.842V447.368L66.2534 447.722C65.7953 447.997 65.2712 448.142 64.737 448.142C64.2028 448.142 63.6786 447.997 63.2206 447.722L62.6315 447.368L62.0429 447.722C61.5848 447.997 61.0607 448.142 60.5265 448.142C59.9923 448.142 59.4681 447.997 59.01 447.722L58.421 447.368L57.8324 447.722C57.3743 447.997 56.8501 448.142 56.3159 448.142C55.7817 448.142 55.2576 447.997 54.7995 447.722L54.2105 447.368L53.6214 447.722C53.1634 447.997 52.6393 448.142 52.1052 448.142C51.5711 448.142 51.047 447.997 50.589 447.722L49.9999 447.368V444Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M52.105 452.421H50.8418V460H65.9997V452.421H64.7365H52.105Z" fill="currentColor" />
    <path d="M52.105 452.421H50.8418V460H65.9997V452.421H64.7365M52.105 452.421H64.7365M52.105 452.421V448.631M64.7365 452.421V448.631" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CalendarStarIcon({ size, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="49 537 18 20"
      width={size ?? 18}
      height={size ? (size * 20) / 18 : 20}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
    <path d="M65 539H63V537H61V539H55V537H53V539H51C49.9 539 49 539.9 49 541V555C49 556.1 49.9 557 51 557H65C66.1 557 67 556.1 67 555V541C67 539.9 66.1 539 65 539ZM51 555V543H65V541V555H51Z" fill="currentColor" />
    <path d="M59.28 547.59L58 545L56.72 547.59L54 547.82L56.12 549.94L55.18 553L58 551.12L60.82 553L59.88 549.94L62 547.82L59.28 547.59Z" fill="currentColor" />
    </svg>
  )
}

export function ClockIcon({ size, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="47.25 628.25 21.5 21.5"
      width={size ?? 21.5}
      height={size ? (size * 21.5) / 21.5 : 21.5}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
    <path d="M58 633L58 639L64 639" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M68 639C68 644.523 63.5228 649 58 649C52.4772 649 48 644.523 48 639C48 633.477 52.4772 629 58 629C63.5228 629 68 633.477 68 639Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CameraIcon({ size, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="48.25 721.25 19.5 19.5"
      width={size ?? 19.5}
      height={size ? (size * 19.5) / 19.5 : 19.5}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
    <path d="M62 731C62 733.209 60.2091 735 58 735C55.7909 735 54 733.209 54 731C54 728.791 55.7909 727 58 727C60.2091 727 62 728.791 62 731Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M67 727V735C67 737.761 64.7614 740 62 740H54C51.2386 740 49 737.761 49 735V727C49 724.239 51.2386 722 54 722H62C64.7614 722 67 724.239 67 727Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M63.5 725.51L63.51 725.499" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CheckIcon({ size, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="49 816 18 14"
      width={size ?? 18}
      height={size ? (size * 14) / 18 : 14}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
    <path d="M51 824L55 828L65 818" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function BackIcon({ size, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="22.25 34.25 14 13.5"
      width={size ?? 14}
      height={size ? (size * 13.5) / 14 : 13.5}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
    <path d="M35.5 41H23M29 47L23 41L29 35" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PinIcon({ size, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="33.25 231.25 17.5 21.5"
      width={size ?? 17.5}
      height={size ? (size * 21.5) / 17.5 : 21.5}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
    <path d="M50 240C50 244.418 42 252 42 252C42 252 34 244.418 34 240C34 235.582 37.5817 232 42 232C46.4183 232 50 235.582 50 240Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M42 241C42.5523 241 43 240.552 43 240C43 239.448 42.5523 239 42 239C41.4477 239 41 239.448 41 240C41 240.552 41.4477 241 42 241Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ClockSmallIcon({ size, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="206.25 231.25 21.5 21.5"
      width={size ?? 21.5}
      height={size ? (size * 21.5) / 21.5 : 21.5}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
    <path d="M217 236L217 242L223 242" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M227 242C227 247.523 222.523 252 217 252C211.477 252 207 247.523 207 242C207 236.477 211.477 232 217 232C222.523 232 227 236.477 227 242Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ScanBarcodeIcon({ size, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="126.25 697.25 21.5 19.5"
      width={size ?? 21.5}
      height={size ? (size * 19.5) / 21.5 : 19.5}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
    <path d="M131 698H128V701" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M127 707H137H147" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M134 714V712V710" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M137 711V710.5V710" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M140 712V711V710" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M137 716V714.5V713" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M143 698H146V701" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M131 716H128V713" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M143 716H146V713" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function WifiLowIcon({ size, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="17.25 827 21.5 16.25"
      width={size ?? 21.5}
      height={size ? (size * 16.25) / 21.5 : 16.25}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
    <path d="M28 842.51L28.01 842.499" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 831C24 826.5 32 826.5 38 831" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 835C25 832 31 832 35 835" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24.5 838.5C26.7504 837.1 29.2498 837.1 31.5001 838.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
