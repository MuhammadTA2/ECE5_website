import type { Metadata } from 'next';
import { LegalShell } from '@/app/legal-shell';
import { getPrivacyOwner } from '@/lib/legal';
import { LEGAL_EFFECTIVE_DATE } from '@/lib/legal-shared';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Terms of Use · Project Gallery',
  description: 'Rules for accessing and contributing to Project Gallery.',
};

export default async function TermsPage() {
  const owner = await getPrivacyOwner();
  return (
    <LegalShell eyebrow="LEGAL · USE" title="Terms of Use" updated={LEGAL_EFFECTIVE_DATE}>
      <p className="legal-lead">These Terms govern access to and use of this Project Gallery. “Site Owner” means the person or organization that owns and administers this gallery. By signing in, viewing restricted content, or uploading content, you agree to these Terms and the Privacy Policy.</p>

      <section><h2>1. Authorized use</h2><p>Use the gallery only for the project, team, course, or organization for which access was provided. Keep account access secure, do not share another person’s credentials, and do not attempt to bypass access controls, rate limits, or security features.</p></section>

      <section><h2>2. Your content and permissions</h2><p>You retain ownership of content you upload. You grant the Site Owner and hosting providers a limited, non-exclusive license to store, reproduce, display, resize, transmit, and back up that content solely to operate, secure, and administer the gallery. This license ends when the content is permanently deleted, except for limited backups or legal obligations.</p><p>By uploading, you confirm that you own the content or have permission to use it, that identifiable people have provided any consent required by law or policy, and that the upload does not violate privacy, publicity, copyright, confidentiality, or other rights.</p></section>

      <section><h2>3. Prohibited content and conduct</h2><p>Do not upload or use the gallery for unlawful, deceptive, infringing, harassing, hateful, exploitative, or malicious material; non-consensual intimate imagery; child sexual abuse material; malware; credentials or secrets; highly sensitive identifiers; or personal information you are not authorized to share. Do not scrape, probe, overload, reverse engineer for abuse, or interfere with the service or another user.</p></section>

      <section><h2>4. Educational and workplace use</h2><p>If the gallery is used by a school, employer, laboratory, or other organization, users must also follow that organization’s policies. Do not upload protected education records, confidential research, export-controlled material, or employee information unless the responsible organization has approved the use and established the required safeguards and permissions.</p></section>

      <section><h2>5. Moderation and removal</h2><p>The Site Owner may restrict access, remove content, or suspend editing to protect people, comply with law, enforce these Terms, or secure the gallery. If you believe content violates your rights or was uploaded without consent, contact the Site Owner with enough information to identify the content and explain the concern.</p></section>

      <section><h2>6. Availability and backups</h2><p>The gallery may change, experience interruptions, or become unavailable. Editors should use the export feature for important records and should not treat this application as the sole archival, safety-critical, or compliance record.</p></section>

      <section><h2>7. Disclaimers and responsibility</h2><p>To the extent permitted by applicable law, the gallery is provided “as is” without a promise that it will be uninterrupted or error-free. Nothing in these Terms excludes rights or liability that cannot legally be excluded. Each uploader remains responsible for their content, permissions, and use of the service.</p></section>

      <section><h2>8. Accessibility</h2><p>The gallery is intended to support keyboard navigation, readable contrast, descriptive text, and assistive technologies. Report an accessibility barrier to the Site Owner so it can be reviewed and addressed.</p></section>

      <section><h2>9. Changes and contact</h2><p>The Site Owner may update these Terms when the service or applicable requirements change. Continued use after notice of a material update constitutes acceptance where permitted by law.</p>{owner ? <p>Questions, removal notices, or accessibility concerns may be sent to {owner.name ? `${owner.name} at ` : ''}<a href={`mailto:${owner.email}`}>{owner.email}</a>.</p> : <p>Contact the person or organization that invited you. The Site Owner must provide a working contact before inviting other people or collecting their content.</p>}</section>
    </LegalShell>
  );
}
