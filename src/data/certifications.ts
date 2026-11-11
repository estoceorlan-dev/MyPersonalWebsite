export type Certification = {
  id: string;
  title: string;
  issuer: string;
  date: string;
  credentialId?: string;
  image?: string;
  verificationUrl?: string;
  description?: string;
  pdfUrl?: string;
};
export type Achievement = {
  title: string;
  organization: string;
  date: string;
  description: string;
};
// Eligibility is separate from course certifications, as in the resume.
// Previews and PDFs live in public/certificates (sources: assets/certificates).
export const certifications: Certification[] = [
  {
    id: "introduction-to-modern-ai",
    title: "Introduction to Modern AI",
    issuer: "Cisco Networking Academy",
    date: "April 2026",
    credentialId: "2d5ce935-708e-4347-b257-92f46521801a",
    image: "/certificates/introduction-to-modern-ai.webp",
    pdfUrl: "/certificates/introduction-to-modern-ai.pdf",
    description:
      "Completed Cisco Networking Academy’s introduction to modern artificial intelligence concepts and applications.",
  },
  {
    id: "cyber-threat-management",
    title: "Cyber Threat Management",
    issuer: "Cisco Networking Academy",
    date: "December 2025",
    image: "/certificates/cyber-threat-management.webp",
    pdfUrl: "/certificates/cyber-threat-management.pdf",
    description:
      "Completed Cisco Networking Academy’s Cyber Threat Management course.",
  },
  {
    id: "introduction-to-cybersecurity",
    title: "Introduction to Cybersecurity",
    issuer: "Cisco Networking Academy",
    date: "October 2025",
    image: "/certificates/introduction-to-cybersecurity.webp",
    pdfUrl: "/certificates/introduction-to-cybersecurity.pdf",
    description:
      "Completed Cisco Networking Academy’s Introduction to Cybersecurity course.",
  },
  {
    id: "sql-server-foundations",
    title: "SQL Server Foundations",
    issuer: "ScholarHat",
    date: "September 2025",
    credentialId: "BKCG130925",
    image: "/certificates/sql-server-foundations.webp",
    pdfUrl: "/certificates/sql-server-foundations.pdf",
    verificationUrl: "https://www.scholarhat.com/certificate/verify",
    description:
      "Completed ScholarHat’s SQL Server Foundations Course. The certificate ID can be verified on ScholarHat.",
  },
];
export const achievements: Achievement[] = [
  {
    title: "Civil Service Professional Eligibility",
    organization: "Civil Service Commission (CSC)",
    date: "March 2026",
    description: "Professional eligibility listed in my resume.",
  },
];
