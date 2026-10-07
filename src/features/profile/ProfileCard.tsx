'use client';

import React from 'react'
import { useActionState } from 'react';
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
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(updateProfile, null)

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.pageTitle}>Profil</h1>
          <div className={styles.grid}>
            <form className={styles.card} action={formAction}>
              <div className={styles.inner}>
                <ul className={styles.list}>
                  {FIELDS.map((f) => (
                    <li key={f.name} className={styles.row}>
                      <label className={styles.label} htmlFor={f.name}>
                        {f.label}<span className={styles.required}> *</span>
                      </label>
                      <input 
                      id={f.name}
                      name={f.name}
                      type={f.type}
                      className={styles.input}
                      defaultValue={initial[f.name]}
                      placeholder={'placeholder' in f ? f.placeholder : undefined}
                      readOnly={'readOnly' in f}
                      required
                      />
                    </li>
                  ))}
                </ul>

                  <div className={styles.footer}>
                    {state && (
                      <p className={state.ok ? styles.messageOk : styles.messageError} role = "status">
                        {state.message}
                      </p>
                    )}
                    <button type="submit" className={styles.button} disabled={pending}>
                      {pending ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
              </div>
            </form>

            <section className={styles.qrColumn}>
              <h2 className={styles.qrTitle}>Personal QR</h2>
              <div className={styles.qrCard}>
                <p className={styles.qrHint}>Tunjukkan QR di Booth</p>
                <Image 
                src="/images/qr-placeholder.png"
                alt="Personal QR"
                width={240}
                height={240}
                className={styles.qrImage}
                />
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  )
}