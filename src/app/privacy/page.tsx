import type { Metadata } from "next"
import Link from "next/link"
import LegalPage, { LEGAL_CONTACT_EMAIL } from "@/features/legal/LegalPage"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How ITB Insight collects, uses, stores and shares your personal data.",
  alternates: { canonical: "/privacy" },
}

const mailto = `mailto:${LEGAL_CONTACT_EMAIL}`

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" sibling={{ href: "/terms", label: "Terms of Service" }}>
      <p>
        This Privacy Policy explains how the ITB Insight organizing committee (&quot;ITB
        Insight&quot;, &quot;we&quot;, &quot;us&quot;), a student-run event at Institut Teknologi
        Bandung, collects, uses, stores and shares personal data when you use this website and its
        services (the &quot;Service&quot;): accounts, event tickets, competition registration,
        payments, check-in, feedback forms and partnership inquiries.
      </p>
      <p>
        We process personal data in line with Indonesia&apos;s Personal Data Protection Law (Law
        No. 27 of 2022, &quot;UU PDP&quot;). If you have questions, email us at{" "}
        <a href={mailto}>{LEGAL_CONTACT_EMAIL}</a>.
      </p>

      <h2>1. Data we collect</h2>
      <h3>Account data</h3>
      <ul>
        <li>
          <strong>When you sign in with Google:</strong> your name, email address and profile
          picture, from the basic <code>openid</code>, <code>email</code> and <code>profile</code>{" "}
          scopes. We do not request access to your Gmail, Drive, Calendar, contacts or any other
          Google data.
        </li>
        <li>
          <strong>When you sign in with an email link:</strong> your email address.
        </li>
        <li>
          <strong>Profile details you add:</strong> full name, phone number and institution
          (school or university).
        </li>
      </ul>

      <h3>Event and competition data</h3>
      <ul>
        <li>
          <strong>Tickets and attendance:</strong> your ticket QR code, gate check-in time, and the
          booths you visit when booth staff scan your ticket.
        </li>
        <li>
          <strong>Competition registration:</strong> team name and, for each team member, their
          name, email address, phone number and institution. If you register a team, you confirm
          that your teammates agreed to share their details with us.
        </li>
        <li>
          <strong>Payments:</strong> order ID, amount, payment method and payment status. Payments
          are handled by Midtrans; we never receive or store your full card number, CVV or banking
          password.
        </li>
        <li>
          <strong>Location (self check-in only):</strong> if you choose to check in yourself, your
          browser sends your current location once so we can confirm you are at the venue. We use
          it for that check only and do not store your coordinates.
        </li>
        <li>
          <strong>Location for booth visits (optional, event days only):</strong> if you turn it
          on, your phone&apos;s browser sends its location about once a minute while you are at
          the event venue (ITB Ganesha campus) with this site open. We use it only to work out
          which booth you are at and for how long, and store only the booth and the times, never
          your coordinates. Nothing is sent or stored while you are outside the venue. It does not
          affect points. You can turn it off at any time from the notice on screen, which also
          deletes the booth-visit records we hold about you.
        </li>
        <li>
          <strong>Feedback forms:</strong> your answers, name, email and school, and the time you
          gave consent. Each form states its own retention period (see section 5).
        </li>
        <li>
          <strong>Invitations and partnerships:</strong> name, institution, position, email and
          phone number of invited guests and of organizations that send a partnership inquiry.
        </li>
      </ul>

      <h3>Technical data</h3>
      <ul>
        <li>
          <strong>Usage analytics:</strong> pages visited and how long you stay, interactions (such
          as scroll depth, sign-up steps and clicks on partner logos), page-speed measurements, and
          device type, browser and approximate location (country or city). These are linked to a random ID kept in your
          browser&apos;s local storage until you clear it. The ID is not linked to your account,
          name or email. We remove anything after the <code>?</code> or <code>#</code> in page
          addresses before sending, and our analytics provider discards your IP address. We do not
          record your screen or what you type.
        </li>
        <li>
          <strong>Security data:</strong> IP address (used in hashed form for rate limiting),
          request logs, and an audit log of administrative actions. We use Cloudflare Turnstile to
          block bots on some forms.
        </li>
      </ul>

      <h2>2. How we use your data</h2>
      <ul>
        <li>To create and secure your account and sign you in.</li>
        <li>To issue tickets, check you in, and record attendance at booths and sessions.</li>
        <li>To process competition registrations and payments, and to contact participants.</li>
        <li>To send messages about the event, your registration or your payment.</li>
        <li>To evaluate and improve the event using feedback and aggregated analytics.</li>
        <li>To prevent fraud, abuse and spam, and to keep the Service secure.</li>
        <li>To meet legal, accounting and tax obligations.</li>
      </ul>
      <p>
        Our legal bases under UU PDP are your consent, performing our agreement with you (for
        example, your competition registration), our legal obligations, and our legitimate interest
        in running a safe and secure event.
      </p>

      <h2>3. Google user data</h2>
      <p>
        We use Google Sign-In only to authenticate you. From your Google Account we receive your
        name, email address and profile picture, and we use them only to create your account,
        identify you on your tickets and registrations, and contact you about the event.
      </p>
      <p>
        ITB Insight&apos;s use and transfer of information received from Google APIs adheres to
        the{" "}
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements. We do not sell Google user data, use it for
        advertising, or transfer it to anyone except as needed to provide the Service (section 4),
        to comply with the law, or with your consent. We do not use it to train AI or machine
        learning models.
      </p>

      <h2>4. Who we share data with</h2>
      <p>We do not sell your personal data. We share it only with:</p>
      <ul>
        <li>
          <strong>Service providers</strong> that run the Service for us: Supabase (database and
          authentication), Vercel (hosting), Midtrans (payment processing), Cloudflare (bot
          protection), Google (sign-in) and PostHog (usage analytics, stored in the United
          States). They process data on our instructions and may store it
          on servers outside Indonesia.
        </li>
        <li>
          <strong>Competition judges and the ITB Insight committee</strong>, who see registration
          details as needed to run the competition.
        </li>
        <li>
          <strong>Authorities</strong>, when the law requires it or to protect the safety of
          participants.
        </li>
      </ul>

      <h2>5. How long we keep data</h2>
      <ul>
        <li>
          Account, ticket and registration data: for the duration of the event and up to 12 months
          afterward, then deleted or anonymized, unless you ask us to delete it sooner.
        </li>
        <li>Payment records: as long as Indonesian accounting and tax law requires.</li>
        <li>
          Feedback forms: names and contact details are deleted after the period stated on each
          form (180 days by default, at most 2 years); anonymous answers are kept for reporting.
        </li>
        <li>
          Booth-visit records (optional location feature): deleted within 30 days after the
          event, or as soon as you turn the feature off.
        </li>
        <li>
          Analytics data: stored without account identifiers for up to 12 months, then deleted;
          reports we keep afterward contain only aggregate numbers.
        </li>
      </ul>

      <h2>6. Cookies and browser storage</h2>
      <p>
        We use cookies that are necessary to keep you signed in and to secure the Service. Our
        analytics do not use cookies: they keep the random ID described in section 1 in your
        browser&apos;s local storage, plus a short note of your progress through sign-up in session
        storage, which is cleared when you close the tab. You can remove both at any time by
        clearing this site&apos;s data in your browser settings, after which you are counted as a
        new visitor. We do not use
        advertising or cross-site tracking cookies.
      </p>

      <h2>7. Security</h2>
      <p>
        Data is encrypted in transit (HTTPS). Access to the database is restricted with row-level
        security, and only authorized committee members can see participant data. No system is
        completely secure; if a breach affects your data, we will notify you and the authorities as
        UU PDP requires.
      </p>

      <h2>8. Your rights</h2>
      <p>Under UU PDP you can:</p>
      <ul>
        <li>request access to, or a copy of, your personal data;</li>
        <li>correct inaccurate data;</li>
        <li>request deletion of your account and data;</li>
        <li>withdraw your consent, or object to or restrict processing.</li>
      </ul>
      <p>
        To use these rights, email <a href={mailto}>{LEGAL_CONTACT_EMAIL}</a> from the address on
        your account. We respond to access and correction requests within 3 x 24 hours, as UU PDP
        requires, and to other requests as soon as we can. Deleting your
        account may cancel your tickets or registrations. You can also revoke ITB Insight&apos;s
        access to your Google Account at any time at{" "}
        <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">
          myaccount.google.com/permissions
        </a>
        .
      </p>

      <h2>9. Children</h2>
      <p>
        Some activities, such as school visits, involve participants under 18. We collect only the
        data needed for the activity, and ask participants under 18 to make sure a parent,
        guardian or teacher knows they are taking part. A parent or guardian can contact us to
        review or delete their child&apos;s data.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We may update this policy. We will change the date at the top of this page and, for
        significant changes, notify you by email or on the website.
      </p>

      <h2>11. Contact</h2>
      <p>
        ITB Insight Organizing Committee
        <br />
        Institut Teknologi Bandung, Jl. Ganesa No. 10, Bandung 40132, Indonesia
        <br />
        Email: <a href={mailto}>{LEGAL_CONTACT_EMAIL}</a>
      </p>
      <p>
        See also our <Link href="/terms">Terms of Service</Link>.
      </p>
    </LegalPage>
  )
}
