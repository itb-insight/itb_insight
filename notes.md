Change the minimum stretch for the header to turn into mobile ||| button for the Dashboard, since dashboard title crashes into it.

dashboard/ wont compile???

## Competition Biodata list. 
X required for account creation
[X] Email
- Nama Tim
- Asal Perguruan Tinggi <- Prepare a list
[X] Nama lengkap
- NIM
- Prodi & Fakultas
- Angkatan
- Nomor Whatsapp

- Berkas??
- Bukti Twibbon* .png, .jpg, .jpg, personal
- Bukti folllow Instagram* .png, .jpg, .jpg, personal
- Bukti share informasi kompetisi* .png, .jpg, .jpg, ,.pdf personal, minimal 3 grup
- KTM .png, .jpg, .jpg, personal
- Post story instagram poster, .png, .jpg, .jpg, personal
- [Lembar Pernyataan Orisinalitas Karya, BPC](https://docs.google.com/document/d/10z7iq35EcOfHntMYxbhsv-N1Pe8PVWcCO5GAz2a2Z0c/edit?tab=t.sq2a4sxb6s56) Group
Transfer Bank
Bank Jago
No. Rekening : 100957787855
a.n. Baginda Muhammad Achtar Kahar

Mohon transfer sesuai nominal gelombang. Simpan bukti transfer Anda.

• Normal Registration     : Rp150.000 / tim  : periode 23 September – 11 Oktober 2026

[!] Teams have minimums of 2
[!] Update the guidebook


CHECK ADMIN CREDS
`/admin`
Landing page change if you're already logged in
Map <- limit area
Compe Mobile Scaling
Compe disable??
Events disable??
Hide SUPABASE link in google login
[x] Countdownnya udh dari awal aja
Dashboard Selection
Competition card delay
Personal Profile QR
Login -> Profil - Mobile view personal QR must be ontop.
Mobile view QR width is still wrong
Header start mobile view is wrong (check dashboard)
DASHBOARD DROPDOWN ISNT STICKY!
[x] Gallery
Media Partner
[x] Footer links
[x] ITB Insight section
Prize pool
PLACEHOLDER DATA MARK


[+] on Dashboard

Notification system
CLOSE DEPLOY AFTER ALUMN GATH
# HOW TO STATIC DEPLOY
## Don't use a static export on Vercel

Vercel runs Next.js natively, so you don't need `output: 'export'`. The build already pre-renders about 40 of the 49 routes as static HTML, and Vercel serves those from its CDN with no extra setup. A true static export would mean removing several things the docs list as unsupported (`node_modules/next/dist/docs/01-app/02-guides/static-exports.md:274`):
- the proxy
- the server action in [action.ts](src/features/profile/action.ts)
- every route handler, including `/auth/callback`
- `cookies()`
- ISR and `dynamicParams` in [competition/[slug]/page.tsx](src/app/competition/[slug]/page.tsx#L21-L22)
- the default image optimizer

That's a lot of work and gains nothing on Vercel. Deploy it as a normal Next.js project.

## What to fix or set up

**1. Environment variables.** `.env.local` isn't deployed, so add the variables in Vercel → Project → Settings → Environment Variables. The `NEXT_PUBLIC_*` ones are baked into the code at build time, so you have to redeploy after changing them.
- **`NEXT_PUBLIC_SITE_URL`:** if it's missing, the sitemap, robots file and page metadata all point at `http://localhost:3000` ([layout.tsx:31](src/app/layout.tsx#L31), [sitemap.ts](src/app/sitemap.ts), [robots.ts](src/app/robots.ts)). The two hardcoded fallbacks also disagree: `itbinsight.com` in [competition/seo.ts:5](src/features/competition/seo.ts#L5) and `itbinsight.vercel.app` in [events/seo.ts:8](src/features/events/seo.ts#L8).
- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. `SUPABASE_SERVICE_ROLE_KEY` is only needed if the API routes are live; never give it a `NEXT_PUBLIC_` prefix.
- **Other:** `ADMIN_EMAILS`, plus `MAINTENANCE_*` if you want maintenance mode.

**2. Decide whether Supabase is on or off for this deploy.**
- **On:** the login code redirects to `${window.location.origin}/auth/callback` ([LoginHifi.tsx:24](src/features/auth/LoginHifi/LoginHifi.tsx#L24)). Add your Vercel domain to Supabase → Auth → URL Configuration, as both the Site URL and a Redirect URL. Add `https://*-<team>.vercel.app/**` too if you want preview deploys to log in. If you use Google login, its provider settings need the same domain.
- **Off:** the proxy quietly skips its session refresh and the `/dashboard` login check ([middleware.ts:35](src/lib/supabase/middleware.ts#L35)). Then:
  - Anyone can open `/dashboard`.
  - `/dashboard/profile` will crash with a 500, because [server.ts](src/lib/supabase/server.ts) uses `process.env...!` and passes `undefined`.
  - The login and signup buttons will throw for the same reason in [client.ts](src/lib/supabase/client.ts).

  So either keep Supabase on, or hide the login, signup and dashboard entry points.

**3. The proxy runs on every page request.** The matcher in [proxy.ts:68](src/proxy.ts#L68) covers every path except `/api` and static files. So even the static pages trigger a function call plus a Supabase `getUser()` round trip on each view. It works, but it adds delay and cost. To fix it, narrow the matcher to `/dashboard/:path*` (and `/auth/:path*`). The catch is that the maintenance-mode feature needs the broad matcher, so pick one.

**4. In-memory state doesn't work on Vercel.** Each Vercel instance keeps its own memory, and it's wiped on restart.
- The analytics buffer ([eventStore.ts](src/lib/analytics/server/eventStore.ts)) will show a random partial slice of events, as its own comment admits.
- The rate limiter ([rate-limit.ts:6](src/lib/rate-limit.ts#L6)) is per-instance too, so its limits are leaky.

It's fine for an MVP, but don't trust either one in production.

**5. Asset weight (speed, not a blocker).** `public/` is 91 MB.
- `bg-main.png` is 8.7 MB and loaded through CSS in [LandingPage.module.css](src/features/landing/LandingPage.module.css), which skips image optimization. There are also two copies of it: `public/` and `public/images/`.
- `models/drone.glb` is 23 MB.
- `oe.png`, `mor.png` and `bpc.png` are 4–8 MB each.

These will make the first load on mobile very slow. Converting them to WebP or AVIF and shrinking the model would help a lot.

**6. Smaller items:**
- **Vercel plan:** the free Hobby plan is for non-commercial use only. Paid registration (Rp150.000 per team) may push you onto Pro.
- **Committed Supabase files:** `supabase/.temp/` is in the repo and contains your project ref and pooler URL. There's no password in it, but it belongs in `.gitignore`.
- **API endpoint:** even though you're moving the pages later, note that [api/admin/events](src/app/api/admin/events/route.ts) is an API route with no login check. Anyone can read the event feed from it.
- **No action needed:** the repo root is the app root, so no "Root Directory" setting is required. The `authInterrupts` flag only serves the test page and is harmless.

**Suggested order:** set the env vars → add the Supabase redirect URLs → hide or move the dev pages → do a preview deploy (`vercel` or the `/vercel:deploy` skill) → check login and `/sitemap.xml` on the preview URL → promote to production.