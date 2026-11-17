import type { Metadata } from "next"
import Link from "next/link"
import LegalPage, { LEGAL_CONTACT_EMAIL } from "@/features/legal/LegalPage"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using the ITB Insight website, tickets and competition registration.",
  alternates: { canonical: "/terms" },
}

const mailto = `mailto:${LEGAL_CONTACT_EMAIL}`

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" sibling={{ href: "/privacy", label: "Privacy Policy" }}>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of the ITB Insight website and
        its services (the &quot;Service&quot;), run by the ITB Insight organizing committee
        (&quot;ITB Insight&quot;, &quot;we&quot;, &quot;us&quot;), a student-run event at Institut
        Teknologi Bandung. By creating an account or using the Service, you agree to these Terms
        and to our <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do not use the
        Service.
      </p>

      <h2>1. Accounts</h2>
      <ul>
        <li>
          You can sign in with Google or with a link sent to your email. You must give accurate
          information and keep it up to date.
        </li>
        <li>
          You are responsible for activity on your account. Keep your email account secure and tell
          us at <a href={mailto}>{LEGAL_CONTACT_EMAIL}</a> if you think someone else has used it.
        </li>
        <li>One person, one account. Do not create accounts for, or impersonate, someone else.</li>
        <li>
          If you are under 18, make sure a parent, guardian or teacher knows you are using the
          Service and taking part in the event.
        </li>
      </ul>

      <h2>2. Tickets and attendance</h2>
      <ul>
        <li>
          Your ticket QR code is personal and non-transferable. Do not share, copy or sell it.
        </li>
        <li>
          Entry is subject to venue rules and to instructions from the committee and security
          staff. We may refuse entry to, or remove, anyone who breaks these rules or endangers
          others.
        </li>
        <li>
          Schedules, speakers, booths and activities may change. We will post changes on the
          website or our official social media.
        </li>
      </ul>

      <h2>3. Competitions</h2>
      <ul>
        <li>
          Each competition has its own rules, eligibility criteria and timeline, published on its
          page and guidebook. Those rules form part of these Terms.
        </li>
        <li>
          The team leader confirms that all team members agreed to register and to share their
          details with us.
        </li>
        <li>
          A registration counts only after it is submitted, paid (where a fee applies) and verified
          by the committee. We may reject or disqualify a registration that has false information
          or breaks the competition rules.
        </li>
        <li>Judges&apos; decisions are final.</li>
        <li>
          You keep ownership of the work you submit. You allow ITB Insight to display, publish and
          promote it (with credit to your team) for the event and its documentation.
        </li>
      </ul>

      <h2>4. Fees and refunds</h2>
      <ul>
        <li>
          Fees are shown on each competition page in Indonesian Rupiah. Payments are processed by
          Midtrans and are subject to Midtrans&apos;s terms.
        </li>
        <li>
          A registration that is not paid before its payment deadline expires, and you will need to
          register again.
        </li>
        <li>
          <strong>Registration fees are non-refundable</strong>, including when a team withdraws,
          is disqualified or does not attend. We refund the fee only if ITB Insight cancels the
          competition, or if you were charged more than once for the same registration. To request
          such a refund, email <a href={mailto}>{LEGAL_CONTACT_EMAIL}</a> with your order ID.
        </li>
      </ul>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>break the law or infringe anyone&apos;s rights through the Service;</li>
        <li>
          try to access accounts, data or admin areas that are not yours, or test, probe or attack
          the Service&apos;s security without our written permission;
        </li>
        <li>forge or tamper with tickets, QR codes, check-ins, payments or location data;</li>
        <li>use bots or scripts to register, scrape data or overload the Service;</li>
        <li>submit false, offensive or harmful content in forms or feedback.</li>
      </ul>
      <p>
        If you find a security issue, please report it to{" "}
        <a href={mailto}>{LEGAL_CONTACT_EMAIL}</a>.
      </p>

      <h2>6. Content and intellectual property</h2>
      <p>
        The ITB Insight name, logo, website design and content belong to ITB Insight or its
        partners. You may not use them for commercial purposes without our permission. Partner and
        sponsor logos belong to their owners.
      </p>
      <p>
        Photos and videos are taken during the event. By attending, you agree that you may appear
        in them and that ITB Insight may use them for documentation and promotion.
      </p>

      <h2>7. Suspension and termination</h2>
      <p>
        We may suspend or close an account, cancel a ticket, or reject a registration if you break
        these Terms. You can stop using the Service at any time and ask us to delete your account
        as described in the <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>8. Disclaimers and liability</h2>
      <p>
        The Service is provided &quot;as is&quot;. We work to keep it available and accurate, but
        we do not guarantee that it will be uninterrupted or error-free. To the extent the law
        allows, ITB Insight is not liable for indirect losses, or for losses caused by events
        outside our reasonable control. Our total liability for any claim related to a paid
        registration is limited to the fee you paid for it. Nothing in these Terms limits
        liability that cannot be limited under Indonesian law.
      </p>

      <h2>9. Changes to these Terms</h2>
      <p>
        We may update these Terms. We will change the date at the top of this page and, for
        significant changes, notify you by email or on the website. Continuing to use the Service
        after a change means you accept the updated Terms.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These Terms are governed by the laws of the Republic of Indonesia. We will try to resolve
        any dispute by discussion first; if that fails, it will be settled in the courts of
        Bandung, Indonesia.
      </p>

      <h2>11. Contact</h2>
      <p>
        ITB Insight Organizing Committee
        <br />
        Institut Teknologi Bandung, Jl. Ganesa No. 10, Bandung 40132, Indonesia
        <br />
        Email: <a href={mailto}>{LEGAL_CONTACT_EMAIL}</a>
      </p>
    </LegalPage>
  )
}
