# IT student portfolio

A responsive single-page portfolio built with React, TypeScript, Vite, Tailwind CSS, Lucide React, and Framer Motion. Designed for a BSIT student seeking an internship. The original portrait in `assets/images/Portrait.jpg` is used without modifying the source image.

## Local setup

Use Node.js 22.12+ (Node 22 LTS is recommended).

```powershell
cd C:\Users\orlan\MyPersonalWebsite\mypersonalwebsite
npm ci
npm run dev
```

Open the URL printed by Vite (normally http://127.0.0.1:5173).

```sh
npm run build    # Type-check and create dist/
npm run preview  # Serve the production build locally
npm test         # Desktop/mobile browser checks
npm run test:production # Build and test the actual production output
```

Tests use an installed Google Chrome browser by default. Set `PLAYWRIGHT_CHANNEL=msedge` to use Edge. For CI, install Chrome with `npx playwright install chrome` first. The suite checks navigation, modal focus and dismissal, filtering, narrow layouts, contact validation, clipboard drafts, browser errors, and automated WCAG A/AA accessibility checks. Test screenshots go in ignored `.qa/` and failure traces in `test-results/`.

## Everything to replace before publishing

All unprovided facts remain placeholders. Skills, certificates, and achievements are intentionally empty. Project technology lists are taken from the brief; they are not presented as independently confirmed personal skills.

| Location                                        | Replace or confirm                                                                                                                                                                                    |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/personal.ts` → `name`                 | `[Your Name]` with your professional display name.                                                                                                                                                    |
| `personal.ts` → `monogram`                      | `YN` with your initials.                                                                                                                                                                              |
| `personal.ts` → `school`                        | `[University / Institution]` with your school.                                                                                                                                                        |
| `personal.ts` → `academicYear`                  | `[Current year level]` with your current year/academic status.                                                                                                                                        |
| `personal.ts` → `email`                         | Add your professional email address. Leave it empty until ready; do not insert a fake address.                                                                                                        |
| `personal.ts` → `socials`                       | Full HTTPS GitHub and LinkedIn profile URLs. Facebook is optional and hidden while empty.                                                                                                             |
| `personal.ts` → `resumeUrl`                     | Put your real PDF at `public/resume.pdf` and set this field to `/resume.pdf`. A missing resume opens an honest availability dialog.                                                                   |
| `personal.ts` → `siteUrl`                       | Your full HTTPS production URL after deployment. This enables canonical, Open Graph URL, and absolute social image metadata.                                                                          |
| `personal.ts` → other fields                    | Review the role, aspiration, introduction, summary, about paragraphs, interests, availability, degree, portrait alt text, and SEO description so they accurately represent you.                       |
| `assets/images/Portrait.jpg`                    | The supplied photo is already included. Replace it here if desired; adjust width/height in `Hero.tsx` if the dimensions change. The display crop/grayscale are CSS only.                              |
| `src/data/skills.ts`                            | Add only confirmed skills to each category’s `skills` array. Edit category names/descriptions or remove unused categories. No proficiency percentages are used.                                       |
| `src/data/projects.ts` → each `role`            | Replace `[Add your role and contribution]` with your specific responsibilities.                                                                                                                       |
| `projects.ts` → each `repository` / `demo`      | Add real repository/demo URLs if available. Missing links appear as plain status text, never fake anchors.                                                                                            |
| `projects.ts` → each `image` / `imageAlt`       | Optional: put actual screenshots in `public/projects/`, then add e.g. `image: '/projects/vitalysync.webp'` and meaningful alt text. Until then, artwork is explicitly labeled “Illustrative preview.” |
| `projects.ts` → project content                 | Verify titles, descriptions, technologies, and features. Add `Academic Projects` to a project’s `categories` only if it was actually academic. Add dates/results only when verified.                  |
| `src/data/experience.ts`                        | Replace `[Start year]`, `[Project dates]`, and the placeholder contribution text. School/year pull from `personal.ts`. Add only real work/OJT/freelance experience; remove any irrelevant entries.    |
| `src/data/certifications.ts` → `certifications` | Add verified title, issuer, date, optional credential ID, preview image, description, and verification link. Empty data produces an honest empty state; more than 3 entries enables expansion.        |
| `certifications.ts` → `achievements`            | Add actual academic achievements, examinations, and other credentials, with title, organization, date, and description.                                                                               |
| `public/favicon.svg`                            | Replace the placeholder monogram artwork with your initials.                                                                                                                                          |
| `public/social-card.svg`                        | Replace `YN` and customize the social sharing graphic. Run `npm run social-card` after editing to regenerate the included 1200×630 PNG used in social metadata.                                       |

The generic form input hints (“Your name”, “you@company.com”) describe the **visitor’s** details and do not need personalization. Contact placeholders automatically resolve when `personal.email` is set. Copyright year updates automatically. Build-time title/description metadata comes from `personal.ts`; rebuild after changing it.

### Data examples (replace values with real information)

```ts
// skills.ts — only after confirming your skills:
{ title: 'Frontend', icon: 'layout', description: 'Interfaces with people in mind.', skills: ['React', 'Tailwind CSS'] }

// certifications.ts — shape for a real credential:
{
  id: 'unique-credential-id',
  title: 'Your actual certification title',
  issuer: 'Actual issuing organization',
  date: 'Month YYYY',
  // credentialId: 'Actual ID',
  // image: '/certificates/your-certificate.webp',
  // verificationUrl: 'https://the-actual-verification-url',
}
```

## Contact behavior

There is no backend and no message is submitted by this website. The form validates name, email, subject, and a message of at least 10 characters. It prepares a copyable email draft. When `personal.email` is configured, it also opens the visitor’s email client with a `mailto:` draft; the visitor reviews and sends it there. If an email client is unavailable, the copyable draft remains available. Without a configured contact email, the form clearly explains that the owner’s address is missing and nothing has been sent. Form content stays in the browser’s memory and is not persisted; clipboard copy happens only when requested.

For future server integration, replace the submit behavior in `src/components/ContactForm.tsx`. Show success only after a real successful server response. Never put private service keys in `VITE_` environment variables. No environment variables or service accounts are needed for the current implementation.

## Deploy to Vercel

Source repository: [estoceorlan-dev/MyPersonalWebsite](https://github.com/estoceorlan-dev/MyPersonalWebsite), branch `main`. The application files are at the repository root, even though the local workspace contains an extra parent folder.

1. Open [Vercel New Project](https://vercel.com/new) and sign in with your GitHub account.
2. Under **Import Git Repository**, select **MyPersonalWebsite** and click **Import**. If it is missing, use the GitHub access configuration to grant Vercel access to this repository.
3. Use these settings:

   | Setting | Value |
   | --- | --- |
   | Framework Preset | Vite |
   | Root Directory | `./` — leave the default; do not select `mypersonalwebsite` |
   | Production Branch | `main` |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Install Command | `npm ci` |
   | Node.js Version | `22.x` (also pinned in `package.json`) |
   | Environment Variables | None required |

4. Click **Deploy**. Once the deployment is ready, open the assigned URL and check the site.
5. Add that full HTTPS URL to `siteUrl` in `src/data/personal.ts`, then commit and push. This enables the canonical URL and absolute social image metadata. Future pushes to `main` deploy automatically once the repository is connected.
6. Use the replacement checklist above to personalize the current placeholder content. Run `npm run test:production` before significant updates.

`vercel.json` includes the static Vite build settings and basic security headers. Navigation uses section anchors, so client-side route rewrites are unnecessary. The current version is intentionally deployable with placeholders. The contact form still only prepares email drafts; add your real email to enable its email-client flow.

Vercel references: [Git imports](https://vercel.com/docs/git), [build settings](https://vercel.com/docs/builds/configure-a-build), [Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

## Project structure

```text
assets/images/Portrait.jpg  Supplied source photo
public/                     Static favicon, social graphic, future resume/screenshots
src/
  components/               Navigation, modal, timeline, cards, form, shared UI
  data/                     Personal content and editable collections
  hooks/                    Active-section tracking
  sections/                 The seven portfolio sections
  App.tsx                   Page composition and reduced-motion configuration
  styles.css                Responsive layouts and design tokens
tests/                      Browser regression checks
```

Design tokens live at the top of `styles.css`; Tailwind utilities are available throughout. Native dialogs supply modal semantics, focus containment, Escape dismissal, and focus restoration. Section links respect reduced-motion settings. The portrait is 69 KB, project artwork is code-based, and actual project/certificate images load lazily. Google Fonts loads Poppins with `display=swap` and a local fallback; no font availability is required for the app to function.
