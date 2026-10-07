'use client';

import React from 'react'
import { useActionState, useRef, useState } from 'react';
import styles from './ProfileCard.module.css'
import { updateProfile, type ProfileState } from './action'
import Image from 'next/image';

type Initial = { 
    full_name: string;
    email: string;
    phone: string;
    institution: string }

const FIELDS = [
  { name: 'full_name',   label: 'Nama',        type: 'text', placeholder: 'Insert Name' },
  { name: 'email',       label: 'Email',       type: 'email', readOnly: true },
  { name: 'phone',       label: 'No. Telepon', type: 'tel',  placeholder: '08xxxxxxxxxx' },
  { name: 'institution', label: 'Institusi',   type: 'text', placeholder: 'Asal institusi' },
] as const

export default function ProfileCard({ initial }: { initial: Initial }) {
  const [isEditing, setIsEditing] = useState(false)
  const [iconFailed, setIconFailed] = useState(false) // pencil icon missing -> show text only
  const [qrFailed, setQrFailed] = useState(false)       // QR image missing -> show fallback text
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    async (prev, formData) => {
      const result = await updateProfile(prev, formData)
      if (result?.ok) setIsEditing(false)
      return null
    },
    null,
  )

  const handleCancel = () => {
    formRef.current?.reset() // Back to saved values
    setIsEditing(false)
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.pageTitle}>Profil</h1>
          <div className={styles.grid}>
            <form ref={formRef} className={styles.card} action={formAction}>
              <div className={styles.inner}>
                <ul className={styles.list}>
                  {FIELDS.map((f) => {
                    const locked = 'readOnly' in f                // email, never editable
                    return (
                      <li key={f.name} className={styles.row}>
                        <label className={styles.label} htmlFor={f.name}>
                          {f.label}<span className={styles.required}> *</span>
                        </label>
                        <input
                          id={f.name}
                          name={f.name}
                          type={f.type}
                          className={`${styles.input} ${locked ? styles.inputLocked : ''}`}
                          defaultValue={initial[f.name]}
                          placeholder={'placeholder' in f ? f.placeholder : undefined}
                          readOnly={locked || !isEditing}
                          required
                        />
                      </li>
                    )
                  })}
                </ul>

                <div className={styles.footer}>
                  {state && (
                    <p className={state.ok ? styles.messageOk : styles.messageError} role="status">
                      {state.message}
                    </p>
                  )}
                  {isEditing ? (
                    <>
                      <button type="button" className={styles.buttonCancel} onClick={handleCancel} disabled={pending}>
                        Batal
                      </button>
                      <button type="submit" className={styles.button} disabled={pending}>
                        {pending ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className={`${styles.button} ${styles.buttonWithIcon}`}
                      onClick={() => setIsEditing(true)}
                    >
                      {!iconFailed && (
                        <Image
                          src="/images/icons/pencil.ico"
                          alt=""
                          width={20}
                          height={20}
                          unoptimized
                          onError={() => setIconFailed(true)}
                        />
                      )}
                      Edit profile
                    </button>
                  )}
                </div>
              </div>
            </form>

            <section className={styles.qrColumn}>
              <h2 className={styles.qrTitle}>Personal QR</h2>
              <div className={styles.qrCard}>
                {/* Caption always renders (hidden on failure) so the card keeps its exact height */}
                <p className={styles.qrHint} style={qrFailed ? { visibility: 'hidden' } : undefined} aria-hidden={qrFailed}>
                  Tunjukkan QR di Booth
                </p>
                {qrFailed ? (
                  <div className={styles.qrFallback}>
                    <p className={styles.qrHint}>Hmm.. QRnya belum muncul...</p>
                  </div>
                ) : (
                  <>
                    <Image
                      src="/images/qr-placeholder.png"
                      alt="Personal QR"
                      width={240}
                      height={240}
                      className={styles.qrImage}
                      onError={() => setQrFailed(true)}
                    />
                  </>
                )}
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  )
}