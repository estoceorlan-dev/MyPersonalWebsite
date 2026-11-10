export type SkillGroup = {
  title: string;
  icon: "code" | "layout" | "server" | "database" | "tools";
  description: string;
  skills: string[];
};

// Add ONLY skills you can personally confirm. Project stacks remain visible on projects.
export const skillGroups: SkillGroup[] = [
  {
    title: "Programming",
    icon: "code",
    description: "The foundations of how I build.",
    skills: [],
  },
  {
    title: "Frontend",
    icon: "layout",
    description: "Interfaces with people in mind.",
    skills: [],
  },
  {
    title: "Backend & APIs",
    icon: "server",
    description: "The logic behind the experience.",
    skills: [],
  },
  {
    title: "Databases",
    icon: "database",
    description: "Organizing and connecting data.",
    skills: [],
  },
  {
    title: "Tools & workflow",
    icon: "tools",
    description: "From the first idea to deployment.",
    skills: [],
  },
];
