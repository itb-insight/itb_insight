"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Check, ChevronRight, Clock3, FileUp, ShieldCheck, X } from "lucide-react"
import Navbar from "@/shared/components/Navbar/Navbar"
import styles from "./CheckoutPreview.module.css"

type Competition = {
  id: "sar" | "microdrone" | "bpc" | "oe"
  shortName: string
  name: string
  eligibility: string
  period: string
  upload: string
  minor: boolean
  priceOptions: { label: string; price: number; period?: string }[]
  availability?: string
}

const competitions: Competition[] = [
  { id: "sar", shortName: "SAR", name: "Safety and Rescue Robot Competition", eligibility: "Mahasiswa S1/D3/D4, tim 3–5 orang", period: "14 Agu–6 Sep 2026", upload: "KTM", minor: false, priceOptions: [{ label: "Biaya per tim", price: 100000 }] },
  { id: "microdrone", shortName: "Microdrone", name: "Microdrone Obstacle Race/Challenge", eligibility: "Usia di atas 10 tahun", period: "14 Agu–20 Nov 2026", upload: "KTP atau Kartu Pelajar", minor: true, priceOptions: [{ label: "Biaya per tim", price: 30000 }] },
  { id: "bpc", shortName: "BPC", name: "Business Plan Competition", eligibility: "Tim 2–3 orang dari institusi yang sama, tanpa pembimbing", period: "20 Agu–24 Sep 2026 WIB", upload: "KTM/Kartu Pelajar atau surat keterangan mahasiswa aktif", minor: true, priceOptions: [{ label: "Early", price: 135000, period: "20–31 Agu" }, { label: "Normal", price: 150000, period: "1–18 Sep" }, { label: "Extended", price: 200000, period: "19–24 Sep" }] },
  { id: "oe", shortName: "OE", name: "Engineering Olympiad", eligibility: "Tim 3 siswa dan 1 guru", period: "29 Agu–20 Okt 2026 WIB", upload: "Kartu Pelajar atau surat keterangan siswa aktif", minor: true, availability: "Pendaftaran/pricing tersedia mulai 29 Agustus 2026.", priceOptions: [{ label: "Early", price: 120000, period: "29 Agu–20 Sep" }, { label: "Normal", price: 140000, period: "20 Sep–1 Okt" }, { label: "Extended", price: 160000, period: "1–20 Okt" }] },
]

const rupiah = (amount: number) => `Rp${new Intl.NumberFormat("id-ID").format(amount)}`

export default function CheckoutPreview() {
  const [competitionId, setCompetitionId] = useState<Competition["id"]>("sar")
  const [priceIndex, setPriceIndex] = useState(0)
  const [fileName, setFileName] = useState("")
  const [terms, setTerms] = useState(false)
  const [guardian, setGuardian] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLElement>(null)
  const selected = competitions.find((competition) => competition.id === competitionId)!
  const selectedPrice = selected.priceOptions[priceIndex]

  useEffect(() => {
    if (!modalOpen) return
    closeRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModalOpen(false)
        triggerRef.current?.focus()
        return
      }

      if (event.key !== "Tab") return
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [modalOpen])

  function closeModal() {
    setModalOpen(false)
    triggerRef.current?.focus()
  }

  function selectCompetition(id: Competition["id"]) {
    setCompetitionId(id)
    setPriceIndex(0)
    setFileName("")
    if (fileRef.current) fileRef.current.value = ""
    setGuardian(false)
  }

  return (
    <>
      <Navbar isSolid />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="checkout-title">
          <div>
            <p className={styles.eyebrow}><span /> VERIFIKASI MERCHANT · PREVIEW</p>
            <h1 id="checkout-title">Selesaikan detail<br />pendaftaranmu.</h1>
            <p className={styles.lede}>Ini adalah pratinjau checkout untuk verifikasi tampilan merchant. Pembayaran belum aktif dan tidak ada transaksi yang dibuat.</p>
          </div>
          <aside className={styles.previewNote}><ShieldCheck aria-hidden="true" /><div><strong>Belum ada pembayaran</strong><span>Data dan berkas tetap di perangkatmu.</span></div></aside>
        </section>

        <section className={styles.content} aria-label="Formulir checkout pratinjau">
          <form className={styles.form} onSubmit={(event) => { event.preventDefault(); setModalOpen(true) }}>
            <fieldset className={styles.fieldset}>
              <legend><span>01</span> Pilih kompetisi</legend>
              <div className={styles.competitionGrid}>
                {competitions.map((competition) => (
                  <button key={competition.id} type="button" className={`${styles.competitionCard} ${selected.id === competition.id ? styles.selected : ""}`} onClick={() => selectCompetition(competition.id)} aria-pressed={selected.id === competition.id}>
                    <span className={styles.cardTop}><b>{competition.shortName}</b>{selected.id === competition.id && <Check aria-hidden="true" size={17} />}</span>
                    <span className={styles.cardName}>{competition.name}</span>
                    <span className={styles.cardPrice}>mulai {rupiah(competition.priceOptions[0].price)}</span>
                  </button>
                ))}
              </div>
              <div className={styles.detail}><div><strong>{selected.name}</strong><p>{selected.eligibility}</p></div><div><span>Periode pendaftaran</span><strong>{selected.period}</strong></div></div>
              {selected.availability && <p className={styles.availability}>{selected.availability} Semua kompetisi tetap dapat dipilih pada pratinjau ini.</p>}
            </fieldset>

            <fieldset className={styles.fieldset}>
              <legend><span>02</span> Data ketua tim/peserta</legend>
              <div className={styles.inputGrid}>
                <label>Nama lengkap<input required name="fullName" autoComplete="name" placeholder="Sesuai identitas" /></label>
                <label>Email<input required type="email" name="email" autoComplete="email" placeholder="nama@email.com" /></label>
                <label>Nomor WhatsApp<input required type="tel" name="whatsapp" autoComplete="tel" inputMode="tel" placeholder="08xxxxxxxxxx" /></label>
              </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
              <legend><span>03</span> Identitas</legend>
              <label className={styles.upload} htmlFor="identity-file"><FileUp aria-hidden="true" /><span><strong>Unggah {selected.upload}</strong><small>Hanya dipilih secara lokal untuk pratinjau. Berkas tidak diunggah atau disimpan.</small></span><span className={styles.fileButton}>Pilih berkas</span><input ref={fileRef} id="identity-file" required type="file" accept="image/*,.pdf" onChange={(event) => setFileName(event.currentTarget.files?.[0]?.name ?? "")} /></label>
              <p className={styles.fileName} aria-live="polite">{fileName ? `Dipilih: ${fileName}` : "Belum ada berkas dipilih."}</p>
            </fieldset>

            <fieldset className={styles.fieldset}>
              <legend><span>04</span> Persetujuan</legend>
              <label className={styles.check}><input type="checkbox" required checked={terms} onChange={(event) => setTerms(event.target.checked)} /><span>Saya telah membaca dan menyetujui <Link href="/terms-and-conditions">Syarat & Ketentuan ITB Insight 2026</Link>.</span></label>
               {selected.minor && <label className={styles.check}><input type="checkbox" required checked={guardian} onChange={(event) => setGuardian(event.target.checked)} /><span>Jika peserta masih di bawah umur, saya menyatakan telah memperoleh persetujuan orang tua/wali untuk mengikuti kompetisi dan pemrosesan data yang diperlukan.</span></label>}
            </fieldset>

            <button ref={triggerRef} className={styles.submit} type="submit">Lanjutkan ke pembayaran <ChevronRight aria-hidden="true" size={19} /></button>
          </form>

          <aside className={styles.summary} aria-label="Ringkasan pembayaran">
            <p className={styles.summaryLabel}>RINGKASAN BIAYA</p>
            <h2>{selected.shortName}</h2>
            {selected.priceOptions.length > 1 && <div className={styles.priceOptions} aria-label="Pilih periode harga">{selected.priceOptions.map((option, index) => <button type="button" key={option.label} onClick={() => setPriceIndex(index)} aria-pressed={priceIndex === index} className={priceIndex === index ? styles.priceSelected : ""}><span>{option.label}<small>{option.period} 2026 WIB</small></span><strong>{rupiah(option.price)}</strong></button>)}</div>}
            {selected.priceOptions.length === 1 && <div className={styles.lineItem}><span>{selectedPrice.label}</span><strong>{rupiah(selectedPrice.price)}</strong></div>}
            <div className={styles.lineItem}><span>Subtotal</span><strong>{rupiah(selectedPrice.price)}</strong></div>
            <div className={styles.lineItem}><span>Biaya admin</span><strong>Rp0</strong></div>
            <div className={styles.total}><span>Total</span><strong>{rupiah(selectedPrice.price)}</strong></div>
            <div className={styles.paymentInfo}><ShieldCheck aria-hidden="true" size={19} /><p><strong>Pembayaran aman melalui Midtrans</strong><span>Dalam versi aktif, pembayaran akan memiliki batas waktu 1 jam.</span></p></div>
            <p className={styles.summaryDisclaimer}>PREVIEW — Midtrans belum terhubung. Tidak ada pembayaran, unggahan, atau transaksi pada halaman ini.</p>
          </aside>
        </section>
      </main>
        {modalOpen && <div className={styles.backdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal() }}><section ref={modalRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-description"><button ref={closeRef} className={styles.close} type="button" onClick={closeModal} aria-label="Tutup dialog"><X aria-hidden="true" /></button><Clock3 aria-hidden="true" className={styles.modalIcon} size={32} /><p className={styles.modalEyebrow}>CHECKOUT PREVIEW</p><h2 id="modal-title">Pembayaran belum tersedia.</h2><p id="modal-description">Pratinjau merchant ini tidak membuat transaksi, mengirim data formulir, mengunggah berkas, atau membuka pembayaran Midtrans.</p><button type="button" className={styles.modalAction} onClick={closeModal}>Kembali ke pratinjau</button></section></div>}
    </>
  )
}
