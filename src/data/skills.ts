export type SkillGroup = {
  title: string;
  icon: "code" | "layout" | "mobile" | "server" | "database" | "tools";
  description: string;
  skills: string[];
};
// Resume skills plus additions confirmed by Orlandone (Java, TypeScript, PHP, Tailwind CSS, Canva, Render, Vercel).
export const skillGroups: SkillGroup[] = [
  {
    title: "Programming",
    icon: "code",
    description: "Languages I use to build and solve problems.",
    skills: ["Python", "Java", "JavaScript", "TypeScript", "PHP", "Dart"],
  },
  {
    title: "Web development",
    icon: "layout",
    description: "Building interfaces for the browser.",
    skills: ["React", "Tailwind CSS", "HTML", "CSS"],
  },
  {
    title: "Mobile development",
    icon: "mobile",
    description: "Applications that work across devices.",
    skills: ["Flutter", "React Native"],
  },
  {
    title: "Backend & APIs",
    icon: "server",
    description: "Connecting interfaces to application logic.",
    skills: ["Node.js", "Express.js", "Flask"],
  },
  {
    title: "Databases",
    icon: "database",
    description: "Storing, organizing, and managing data.",
    skills: ["SQL", "PostgreSQL", "Firebase", "Firestore"],
  },
  {
    title: "Tools & workflow",
    icon: "tools",
    description: "Development, design, deployment, and documentation.",
    skills: [
      "Git",
      "GitHub",
      "VS Code",
      "Figma",
      "Canva",
      "Vercel",
      "Render",
      "Microsoft Office",
    ],
  },
];
