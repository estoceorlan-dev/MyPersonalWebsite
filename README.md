# Orlandone Estoce — Personal Portfolio

React, TypeScript, Vite, Tailwind CSS, Lucide React, and Framer Motion portfolio for an IT internship.

- Website: https://www.orlanestoce.online
- Repository: https://github.com/estoceorlan-dev/MyPersonalWebsite
- Production branch: `main`

## Local development

Use Node.js 22.x (22.12 or newer).

```powershell
cd C:\Users\orlan\MyPersonalWebsite\mypersonalwebsite
npm ci
npm run dev
```

Open the URL printed by Vite, normally http://127.0.0.1:5173. Stop a running development server before a clean `npm ci` on Windows to avoid native-module file locks.

```sh
npm run build            # Type-check and build dist/
npm run preview          # Preview the production build
npm test                 # Browser checks against development
npm run test:production  # Build and test production output
npm run social-card      # Regenerate the PNG from the social SVG
```

Tests use installed Google Chrome by default. Set `PLAYWRIGHT_CHANNEL=msedge` for Edge; for CI, install Chrome with `npx playwright install chrome`. Checks cover responsive layout, navigation, gallery filtering/expansion, modal focus, resume downloads, email drafts, domain metadata, theme preferences, and automated WCAG A/AA checks in both themes. Screenshots and traces are ignored by Git.

## Content management

| File                                           | Content                                                                                                                                 |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/personal.ts`                         | Name, biography, contact details, school/academic year, interests, languages, social links, resume URL, domain, and SEO description.    |
| `src/data/skills.ts`                           | Six skill categories from the resume plus confirmed additions (Java, TypeScript, PHP, Tailwind CSS, Canva, Render, Vercel).             |
| `src/data/projects.ts`                         | Thirteen projects, technologies, features, categories, repository/demo links, and optional contribution, status, year, and scope notes. |
| `src/data/experience.ts`                       | Education and the JCE Dry Goods Trading role.                                                                                           |
| `src/data/certifications.ts`                   | Civil Service Professional Eligibility and four course certificates (previews and PDFs in `public/certificates/`).                      |
| `public/resume.pdf`                            | Original resume, including reference contact details as requested.                                                                      |
| `public/favicon.svg`, `public/social-card.svg` | OE branding; run `npm run social-card` after editing the social graphic.                                                                |
| `public/robots.txt`, `public/sitemap.xml`      | Search engine files for the custom domain.                                                                                              |

Six featured projects appear initially; the gallery expands to thirteen and filters the entire collection. Related repositories are linked together in the relevant project dialog.

To add a logo cover and modal UI screenshot carousel to any project, place its images in `assets/images/<Project Title>/`: files with `logo` or `cover` in the filename become the card cover, and numbered screenshots (for example `1. home.png`) are automatically displayed in the modal's interactive carousel.

The portrait at `assets/images/Portrait.jpg` is the supplied original; crop/grayscale are CSS only. Original source files remain ignored locally; the approved download at `public/resume.pdf` includes reference contact details. See [CONTENT_SOURCES.md](CONTENT_SOURCES.md) for the sources and content decisions.

## Contact behavior

The form validates name, email, subject, and message, then prepares a copyable draft. **Open email app** opens a prefilled message to `estoce.orlan@gmail.com`; the visitor reviews and sends it in their email client. The website itself does not send messages. Form data stays in memory and is not persisted.

No backend, account integration, or environment variables are required. If adding an email service later, show success only after a real successful server response and keep private keys on the server.

## Vercel deployment

Import `estoceorlan-dev/MyPersonalWebsite` at [Vercel New Project](https://vercel.com/new). The app is at the repository root, despite the extra parent folder in the local workspace.

| Setting               | Value           |
| --------------------- | --------------- |
| Framework             | Vite            |
| Root Directory        | `./` (default)  |
| Production Branch     | `main`          |
| Build Command         | `npm run build` |
| Output Directory      | `dist`          |
| Install Command       | `npm ci`        |
| Node.js               | `22.x`          |
| Environment Variables | None            |

Keep `www.orlanestoce.online` assigned to this project in Vercel's domain settings. The canonical URL is already configured. Pushes to `main` trigger deployments when Git integration is connected.

`vercel.json` includes build settings and basic security headers. Section-anchor navigation needs no SPA route rewrites. Run `npm run test:production` before significant updates.

## Architecture

- `src/components/`: reusable UI, dialogs, navigation, cards, and contact form.
- `src/data/`: centralized editable content.
- `src/hooks/`: active-section tracking and theme preferences.
- `src/sections/`: the portfolio sections.
- `src/styles.css`: design tokens and responsive layouts.
- `src/theme.css`: dark palette, animated sun/moon toggle, and compact header adjustments.
- `scripts/`: social image generation and production test runner.
- `tests/`: browser and accessibility checks.

Dialogs support keyboard focus containment, Escape dismissal, and focus restoration. Motion respects reduced-motion preferences. Poppins loads with a local fallback.

The theme toggle sits before the header's resume link. New visitors follow their system color preference; an explicit choice is saved under `portfolio-theme` in local storage and synchronized across tabs. The head script applies that preference before the page renders to prevent a light flash. Keep its storage key and theme colors aligned with `useTheme.ts` when editing them.
