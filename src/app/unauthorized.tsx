/* ========================================================
 * ERROR PAGE: 401 UNAUTHORIZED
 * Occurs when accessing url the user isn't authorized
 * Thrown when unauthorized()
 * Tried to access unauthorized page e.g. /admin
 * Renders when called unauthorized()
 * TEST on: /app/test-unauthorized/page.tsx
 ===========================================================*/

import ErrorLayout from "@/shared/components/ErrorLayout/ErrorLayout"
import ReturnHomeButton from "@/shared/components/ErrorLayout/ReturnHomeButton"

export default function NotFound() {
  return (
    <ErrorLayout>
      <div style={{ textAlign: 'center', position: 'relative' }}>
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '48rem',
            fontFamily: 'Roboto Mono',
            color: 'rgba(255, 255, 255, 0.1)',
            zIndex: -1,
            whiteSpace: 'nowrap',
            fontWeight: 'bold'
          }}
        >
          401
        </div>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '10rem' }}> 401 </h1>
        <p style={{ fontSize: '2rem' }}>Unauthorized! Ngapain hayo!</p>
        <ReturnHomeButton />
      </div>
    </ErrorLayout>
  )
}
