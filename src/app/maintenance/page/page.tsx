/** ========================================================
 * MAINTENANCE PAGE: single page / section
 * Shown by `src/proxy.ts` (rewrite + 503) for paths in MAINTENANCE_PAGES
 ===========================================================*/

import type { Metadata } from "next"
import ErrorLayout from "@/shared/components/ErrorLayout/ErrorLayout"
import ReturnHomeButton from "@/shared/components/ErrorLayout/ReturnHomeButton"

export const metadata: Metadata = {
  title: "Under Maintenance",
  robots: { index: false, follow: false },
}

export default function PageMaintenance() {
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
            <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '4rem' }}>Page Under Construction...</h1>
            <p style={{ fontSize: '1.5rem' }}>
                Page is under development and will be available soon.
            </p>
        </div>
    </ErrorLayout>
  )
}
