/** ========================================================
 * MAINTENANCE PAGE: whole site
 * Shown by `src/proxy.ts` (rewrite + 503) when MAINTENANCE_SITE=true
 ===========================================================*/

import type { Metadata } from "next"
import ErrorLayout from "@/shared/components/ErrorLayout/ErrorLayout"

export const metadata: Metadata = {
  title: "Under Maintenance",
  robots: { index: false, follow: false },
}

export default function SiteMaintenance() {
  return (
    <ErrorLayout>
      <div style={{ textAlign: 'center', position: 'relative' }}>
            <div 
            style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '32rem',
                fontFamily: 'Roboto Mono',
                color: 'rgba(255, 255, 255, 0.1)',
                zIndex: -1,
                whiteSpace: 'nowrap',
                fontWeight: 'bold'
            }}
            >
            🚧
            </div>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '4rem' }}>Oops, Sorry!</h1>
        <p style={{ fontSize: '1.5rem' }}>
            We're currently under maintance, we will be right back!
        </p>
      </div>
    </ErrorLayout>
  )
}
