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
// No credentials or achievements are assumed. Populate with verified information.
export const certifications: Certification[] = [];
export const achievements: Achievement[] = [];
