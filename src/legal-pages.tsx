import type { ReactNode } from 'react';
import { LEGAL_EFFECTIVE_DATE } from '@/lib/legal-shared';

export function PrivacyPage() {
  return <LegalShell eyebrow="LEGAL · PRIVACY" title="Privacy Policy">
    <p className="legal-lead">Project Gallery is a public visual archive with access-controlled editing. The person or organization that administers the gallery (the “Site Owner”) controls the content and decides who may edit it.</p>
    <section><h2>1. Information processed</h2><p>The gallery processes public photo content, captions, tags, filenames, and timestamps. For people who sign in, it also processes an email address, authentication identifiers, editor role, and security/audit records.</p></section>
    <section><h2>2. Email authentication</h2><p>Supabase Auth sends one-time sign-in links to the address a user provides. The gallery never receives or stores an email password. A valid sign-in proves control of the address; editor privileges still require an invitation from the Site Owner.</p></section>
    <section><h2>3. Photos and consent</h2><p>Editors must have the rights and permissions needed for each upload, including consent where required for identifiable people. Active images are visible to public visitors through short-lived access links because this gallery is designed for public viewing.</p></section>
    <section><h2>4. How information is used</h2><ul><li>Display and organize the project archive.</li><li>Authenticate users and enforce editor permissions.</li><li>Prevent abuse, investigate failures, and preserve auditability.</li><li>Respond to privacy, deletion, accessibility, and content-removal requests.</li></ul></section>
    <section><h2>5. Service providers</h2><p>GitHub Pages serves the static website. Supabase provides authentication, database, and image storage services. Their processing is governed by their respective terms and privacy commitments.</p></section>
    <section><h2>6. Retention and deletion</h2><p>Gallery content remains until an editor removes it or the Site Owner deletes the project. Authentication and audit records may be retained as reasonably necessary for security and accountability. Contact the Site Owner who shared this gallery to request access, correction, deletion, or content removal.</p></section>
    <section><h2>7. Security</h2><p>Database row-level security, storage policies, expiring email links, file validation, least-privilege roles, and owner-controlled invitations protect editing. No internet service can promise absolute security.</p></section>
    <section><h2>8. Children and sensitive content</h2><p>Do not upload sensitive personal information or content involving minors unless the Site Owner has confirmed an appropriate lawful basis and all required permission.</p></section>
    <section><h2>9. Changes and contact</h2><p>The effective date identifies the current version. Contact the Site Owner who provided this gallery link for privacy, deletion, accessibility, or content-removal requests.</p></section>
  </LegalShell>;
}

export function TermsPage() {
  return <LegalShell eyebrow="LEGAL · USE" title="Terms of Use">
    <p className="legal-lead">These Terms govern access to and use of Project Gallery. By signing in, viewing, or uploading content, you agree to these Terms and the Privacy Policy.</p>
    <section><h2>1. Access and accounts</h2><p>Public visitors may view the gallery. Editing requires a verified email session and an active invitation. Do not share sign-in links or attempt to obtain permissions assigned to another person.</p></section>
    <section><h2>2. Acceptable use</h2><p>Do not misuse the gallery, probe its security, disrupt service, evade access controls, upload malware, or use the site in violation of law or another person’s rights.</p></section>
    <section><h2>3. Uploaded content</h2><p>You retain ownership of content you upload. You grant the Site Owner and service providers the permissions needed to store, display, resize, back up, and operate the gallery. You represent that you have the required rights and consent.</p></section>
    <section><h2>4. Public visibility</h2><p>Gallery content is intended to be public and may be copied, cached, or indexed by third parties. Do not upload confidential information or images that should remain private.</p></section>
    <section><h2>5. Moderation and removal</h2><p>The Site Owner may edit metadata, remove content, revoke access, or suspend collaboration to protect the project, comply with law, or address misuse.</p></section>
    <section><h2>6. Availability and backups</h2><p>The service is provided as available and may change or experience interruptions. Editors should export periodic backups of important metadata and retain original image files.</p></section>
    <section><h2>7. Disclaimer and responsibility</h2><p>To the extent permitted by law, the gallery is provided without warranties. Users are responsible for their uploads, account activity, and compliance with applicable rules.</p></section>
    <section><h2>8. Accessibility and contact</h2><p>Report accessibility barriers, removal notices, or other concerns to the Site Owner who provided the gallery link.</p></section>
  </LegalShell>;
}

function LegalShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <main className="legal-page"><header className="legal-hero"><a className="legal-back" href="#/">← Back to gallery</a><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="legal-updated">Effective {LEGAL_EFFECTIVE_DATE}</p></header><article className="legal-card">{children}</article><nav className="legal-nav" aria-label="Legal pages"><a href="#/privacy">Privacy Policy</a><a href="#/terms">Terms of Use</a></nav></main>;
}
