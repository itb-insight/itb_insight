# Quest Ops & Leaderboard Live (Figma Section 4)

Frontend untuk dua frame Figma Section 4:

| Frame | Route | Komponen |
| --- | --- | --- |
| Desktop - 1 (Leaderboard, layar proyektor) | `/quest/live` | `src/features/quest-ops/live/QuestLiveBoard.tsx` |
| Desktop - 2 (Quest Ops, panitia) | `/admin/quest-ops` | `src/features/quest-ops/ops/QuestOpsDashboard.tsx` |
| Preview lokal tanpa login admin | `/quest-ops-preview` | sama dengan di atas |

Status: **UI + data dummy**. Ketiga route di atas `notFound()` di production sampai tersambung ke API.
Bentuk data dummy (`types.ts`, `mockData.ts`) meniru respons API di branch `feat/sidequest-backend`.

## Pemetaan ke API yang sudah ada (branch `feat/sidequest-backend`)

| UI | API | Catatan |
| --- | --- | --- |
| Daftar leaderboard + hitung mundur freeze | `GET /api/sidequests/leaderboard?limit=10` → `{ window, entries }` | Ganti isi `loadLiveBoard()` di `source.ts`. Nama ditampilkan disingkat (`publicName`). |
| Social posts review queue | `GET /api/admin/sidequests?status=pending`, `POST /api/admin/sidequests { submissionId, decision }` | Bentuk baris sudah sama (`SidequestSubmissionRow`). |
| Help desk manual grant | `POST /api/booths/scan { qrCode, points }` (admin, tanpa `boothId`) | Lihat kebutuhan backend no. 5. |
| Redemptions | `reward_claims` | Perlu endpoint ringkasan, lihat no. 6. |

## Kebutuhan backend yang belum ada

1. **Flash quest**: tabel slot (label, multiplier/bonus, lokasi, durasi), `POST` launch/end, dan endpoint publik untuk kartu "FLASH QUEST LIVE". Poin booth/sidequest selama slot aktif dikali multiplier.
2. **Kill switch**: flag global yang menolak semua grant poin & klaim hadiah. Butuh dua admin berbeda (request lalu confirm), dicatat di `audit_logs`.
3. **Freeze manual & force refresh**: `POST` freeze/unfreeze yang meng-override `getSidequestWindow()`, dan snapshot leaderboard tiap 5 menit.
4. **Status & flag per quest**: kolom state LIVE/PAUSE yang bisa diubah admin (`is_active` sudah ada), plus flag otomatis (QR dipakai ulang, jumlah pending review, stok hadiah habis), dan kode quest (BO-01, LM-04, …).
5. **Manual grant**: menerima `userRef` (ID/kode user, bukan hanya QR), `questId` opsional, dan `reason` wajib yang disimpan ke audit log.
6. **Statistik Quest Ops**: players, participation (dibanding kehadiran), quests done, booth visits unik, redemptions per jenis.
7. **Data publik layar**: jumlah pemain dan quest selesai untuk kartu "Not playing yet?".

## Langkah setelah API siap

1. Ganti tipe di `types.ts` dengan import dari `@/lib/sidequests`.
2. Isi `loadLiveBoard()` dan ganti `mockData` di `QuestOpsDashboard` dengan `fetch` ke API di atas.
3. Hapus `notFound()` di production dari `/quest/live` dan `/admin/quest-ops`, lalu hapus `/quest-ops-preview` dan `mockData.ts`.
