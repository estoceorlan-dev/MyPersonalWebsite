export type Certification = {
  id: string;
  title: string;
  issuer: string;
  date: string;
  credentialId?: string;
  image?: string;
  verificationUrl?: string;
  description?: string;
};
export type Achievement = {
  title: string;
  organization: string;
  date: string;
  description: string;
};
// Eligibility is separate from course certifications, as in the resume.
export const certifications: Certification[] = [];
export const achievements: Achievement[] = [
  {
    title: "Civil Service Professional Eligibility",
    organization: "Civil Service Commission (CSC)",
    date: "March 2026",
    description: "Professional eligibility listed in my resume.",
  },
];
