/** ========================================================
 * ERROR PAGE: 404 Not Found
 * Occurs when accessing url that doesn't exist in /src/app
 * Thrown when notFound()
 * Unauthorized errors are in `unauthorized.tsx`
 ===========================================================*/

import ErrorLayout from "@/shared/components/ErrorLayout/ErrorLayout"

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
          404
        </div>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '10rem' }}> 404 </h1>
        <p style={{ fontSize: '2rem' }}>Not Found</p>
      </div>
    </ErrorLayout>
  )
}
