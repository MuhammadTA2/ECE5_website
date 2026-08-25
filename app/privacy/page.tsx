import type { Metadata } from 'next';
import { LegalShell } from '@/app/legal-shell';
import { getPrivacyOwner } from '@/lib/legal';
import { LEGAL_EFFECTIVE_DATE } from '@/lib/legal-shared';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Privacy Policy · Project Gallery',
  description: 'How Project Gallery collects, uses, shares, retains, and protects information.',
};

export default async function PrivacyPage() {
  const owner = await getPrivacyOwner();
  return (
    <LegalShell eyebrow="LEGAL · PRIVACY" title="Privacy Policy" updated={LEGAL_EFFECTIVE_DATE}>
      <p className="legal-lead">Project Gallery is a private or access-controlled collaborative photo log. The person or organization that owns and administers this gallery (the “Site Owner”) controls the content and decides who may view or edit it.</p>

      <section><h2>1. Information collected</h2><p>The gallery processes:</p><ul>
        <li><strong>Account information:</strong> the authenticated user identifier, email address, and optional display name supplied by Sites authentication.</li>
        <li><strong>Content:</strong> uploaded images, filenames, descriptions, tags, and the date and identity associated with an upload or edit.</li>
        <li><strong>Technical and security data:</strong> file type and size, gallery revision and version data, request-rate counters, and essential session or authentication information.</li>
      </ul><p>The application does not intentionally collect advertising identifiers, payment data, precise location, or behavioral analytics.</p></section>

      <section><h2>2. Sources and purposes</h2><p>Information comes directly from uploaders and editors, or from Sites when a user signs in. It is used to operate and organize the gallery, attribute changes, authenticate and authorize editors, prevent abuse, resolve conflicts, provide backup/export functions, and protect the service and its users.</p></section>

      <section><h2>3. Legal bases</h2><p>Where European Economic Area or United Kingdom data-protection law applies, processing is based on providing the requested gallery service, the Site Owner’s legitimate interests in securely documenting and administering the project, compliance with law, and consent where consent is required. Consent may be withdrawn for future processing by contacting the Site Owner, although prior lawful processing is unaffected.</p></section>

      <section><h2>4. Access and service providers</h2><p>Gallery content is available to viewers allowed by the Site’s current access settings. Authorized editors can add, edit, reorder, export, and remove content. OpenAI Sites provides hosting and authentication, and Cloudflare infrastructure provides database and object storage services. These providers process information to deliver and secure the service. Information may be processed in the United States or other places where these providers operate.</p></section>

      <section><h2>5. No sale, advertising, or profiling</h2><p>The gallery does not sell personal information, share it for cross-context behavioral advertising, serve targeted advertising, or use it for automated decision-making or profiling. Because the application does not sell or share data for advertising, it does not provide a “Do Not Sell or Share” control. A browser Global Privacy Control signal does not change this practice.</p></section>

      <section><h2>6. Retention and deletion</h2><p>Active content is retained while needed for the gallery. Removed photos may remain in recoverable storage until the Site Owner permanently deletes them or deletes the gallery, subject to limited backup, security, dispute, or legal-retention needs. Authentication and security records are retained only as long as reasonably needed to administer and protect the gallery. The Site Owner should periodically remove content that is no longer needed.</p></section>

      <section><h2>7. Your choices and rights</h2><p>Depending on applicable law, a person may request access to, correction of, deletion of, or a copy of personal information; object to or restrict certain processing; withdraw consent; or complain to a data-protection authority. California residents may also have rights to know, correct, delete, limit certain uses, and receive equal service when exercising privacy rights. Identity may need to be verified before a request is completed. The gallery does not discriminate for exercising applicable privacy rights.</p></section>

      <section><h2>8. Images and other people</h2><p>Uploaders must have the necessary rights and authority for every image and must obtain consent where required before uploading identifiable people or personal information. Do not upload confidential records, government identifiers, financial or health information, intimate imagery, or education records unless the Site Owner has specifically approved the use and all legal requirements have been satisfied.</p></section>

      <section><h2>9. Children</h2><p>This gallery is not directed to children under 13 and must not knowingly collect their personal information without legally sufficient parental consent. Do not upload an identifiable child’s image or information unless the Site Owner has confirmed the required authorization and consent.</p></section>

      <section><h2>10. Security</h2><p>The application uses server-side authorization, access-controlled editing, same-origin request checks, file validation, rate limiting, object storage, and secure transport supplied by the hosting platform. No system is completely secure, and the Site Owner should promptly restrict access and investigate suspected misuse.</p></section>

      <section><h2>11. Changes</h2><p>This policy may be updated when the gallery’s practices or legal obligations change. The effective date above identifies the current version. Material changes should be communicated to active users where required.</p></section>

      <section><h2>12. Contact and requests</h2>{owner ? <p>The Site Owner is {owner.name ?? 'the account holder identified by'} ({<a href={`mailto:${owner.email}`}>{owner.email}</a>}). Use that address for privacy, deletion, accessibility, or content-removal requests.</p> : <p>No owner contact is available yet because this gallery has not been claimed. Until an owner claims it, contact the person or organization that provided your gallery invitation. The Site Owner must provide a working privacy contact before inviting other people or collecting their content.</p>}</section>
    </LegalShell>
  );
}
