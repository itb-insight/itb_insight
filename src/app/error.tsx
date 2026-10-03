/** ========================================================
 * ERROR PAGE: 500 Unknown Error
 * Occurs when an unexpected runtime error is thrown while rendering
 * Catches errors from pages and nested layouts (not the root layout)
 * TEST on: /app/test-error/page.tsx
 ===========================================================*/

"use client";

import { useEffect } from "react";
import ErrorLayout from "@/shared/components/ErrorLayout/ErrorLayout"
import styles from "@/shared/components/ErrorLayout/ReturnHomeButton.module.css"

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error); // swap for an error reporting service later
  }, [error]);

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
          500
        </div>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '10rem' }}> Whoops! </h1>
        <p style={{ fontSize: '2rem' }}>Something went wrong</p>
        <button type="button" onClick={() => unstable_retry()} className={styles.btn}>
          Try again
        </button>
      </div>
    </ErrorLayout>
  );
}
