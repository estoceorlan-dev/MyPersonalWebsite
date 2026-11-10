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
    date: "[Start year] — Present",
    kind: "education",
    description:
      "Building a foundation in information technology and applying it through practical development projects.",
    highlights: ["Current academic status: " + personal.academicYear],
  },
];
export const experience: TimelineEntry[] = [
  {
    title: "Learning through building",
    organization: "Project-based development",
    date: "[Project dates]",
    kind: "project",
    description:
      "Exploring mobile development, machine learning, and web technologies through VitalySync, Mango Classifier, and Red vs. Blue.",
    highlights: ["Individual responsibilities and contributions to be added."],
  },
];
