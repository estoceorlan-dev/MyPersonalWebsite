import { personal } from "./personal";
export type TimelineEntry = {
  title: string;
  organization: string;
  date: string;
  kind: "education" | "project" | "work";
  description: string;
  highlights: string[];
};
export const education: TimelineEntry[] = [
  {
    title: "Bachelor of Science in Information Technology",
    organization: personal.school,
    date: "2026–2027",
    kind: "education",
    description:
      "Studying Information Technology with practical project work in web and mobile development, machine learning, and database integration.",
    highlights: ["Academic and personal application development."],
  },
];
export const experience: TimelineEntry[] = [
  {
    title: "Administrative & IT Systems Support",
    organization: "JCE Dry Goods Trading · Sweetland, Buenavista, Bohol",
    date: "2025–2026",
    kind: "work",
    description:
      "Combined software development and IT support with day-to-day business administration.",
    highlights: [
      "Designed and developed a business management system with an integrated point-of-sale module.",
      "Maintained and updated systems, and troubleshot technical issues affecting daily workflows.",
      "Monitored business records and maintained data accuracy.",
      "Prepared operational reports and supported documentation and business coordination.",
    ],
  },
];
