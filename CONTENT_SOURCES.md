# Content sources

Reviewed for the portfolio update on 2026-11-11.

## Resume-backed information

The supplied resume is the source for the name, contact information, degree, college, academic year, skills, languages, JCE Dry Goods Trading experience, VitalySync and JCE Management System contributions, and Civil Service Professional Eligibility.

Orlandone later confirmed these additional skills directly: Java, TypeScript, PHP, Tailwind CSS, Canva, and deployment on Render and Vercel.

The dates 2026–2027 are displayed as an academic year; no graduation date or year level is inferred. Eligibility is separate from course certifications. The LinkedIn profile URL was supplied directly by Orlandone.

## Certificates

Course certificates come from the PDFs in `assets/certificates/`: Introduction to Modern AI (Cisco Networking Academy, 30 Apr 2026, Cert ID 2d5ce935-708e-4347-b257-92f46521801a), Cyber Threat Management (Cisco Networking Academy, 15 Dec 2025), Introduction to Cybersecurity (Cisco Networking Academy, 01 Oct 2025), and SQL Server Foundations Course (ScholarHat, 13 Sep 2025, Certificate ID BKCG130925, verifiable at scholarhat.com/certificate/verify). Public copies are renamed in `public/certificates/` so filenames do not expose an email address; WebP previews are rendered from page 1 of each PDF.

The public download at `public/resume.pdf` is the supplied original, including reference contact details. The user requested their inclusion after confirming the reference had agreed. Original source files remain local and ignored by Git.

## Repository-backed projects

Thirteen project cards cover fifteen project repositories. Blue vs. Yellow groups its frontend and backend; Floréa Haven groups the React and plain HTML versions. The portfolio repository itself is excluded.

- **VitalySync**: [README](https://github.com/estoceorlan-dev/VitalySync/blob/main/README.md).
- **JCE Management System**: [README](https://github.com/estoceorlan-dev/JCE-Management-System/blob/main/README.md).
- **Floréa Haven**: [README](https://github.com/estoceorlan-dev/Florea-Haven/blob/main/README.md), [HTML / JavaScript version](https://github.com/estoceorlan-dev/Florea-Haven-simple/blob/main/README.md).
- **UniFind**: [README](https://github.com/estoceorlan-dev/UniFind/blob/main/README.md).
- **Mango Classifier**: [README](https://github.com/estoceorlan-dev/Mango-Classifier/blob/main/README.md).
- **Leslie’s Restaurant**: [README](https://github.com/estoceorlan-dev/Leslie-s-Restaurant-Management-System/blob/main/README.md).
- **Romel Hair Salon**: [README](https://github.com/estoceorlan-dev/Hair-Salon/blob/main/README.md).
- **Roel’s Guitar Shop**: [README](https://github.com/estoceorlan-dev/Guitar-Shop/blob/main/README.md).
- **AquaFlow**: [README](https://github.com/estoceorlan-dev/Water-Refilling-Management-System/blob/main/README.md).
- **QuickServe**: [README](https://github.com/estoceorlan-dev/QuickServe/blob/main/README.md).
- **PersonaScope**: [README](https://github.com/estoceorlan-dev/MBTI-Predictor/blob/main/README.md).
- **Blue vs. Yellow**: [README](https://github.com/estoceorlan-dev/blue-vs-yellow-frontend/blob/main/README.md), [Backend repository](https://github.com/estoceorlan-dev/blue-vs-yellow-backend/blob/main/README.md).
- **Red vs. Blue**: [README](https://github.com/estoceorlan-dev/RedvsBlue/blob/main/README.md).
  Descriptions and technology lists follow the repository READMEs. QuickServe's Flask stack was also checked in `app.py` and `requirements.txt`. Contributions are attributed only where the resume supplies them.

Mango Classifier uses MobileNetV2, TensorFlow/Keras, and Flask; the earlier ResNet placeholder was removed. AquaFlow is described as a frontend prototype. Hair Salon and JCE POS retain documented development limits. No production usage, performance numbers, or completion claims are inferred.

Blue vs. Yellow's frontend and Floréa Haven's HTML preview responded successfully during review. This is a page-availability check, not verification of every external backend feature. Other projects link to source code. Gallery artwork is labeled illustrative or as a project cover.

## Domain and branding

The canonical domain is https://www.orlanestoce.online. Title, description, canonical URL, and Open Graph metadata use `src/data/personal.ts`. The favicon, social image, robots file, and sitemap use the current identity and domain.
