export const projectCategories = [
  "All projects",
  "Web Development",
  "Mobile Applications",
  "Machine Learning",
  "Academic Projects",
] as const;
export type ProjectCategory = (typeof projectCategories)[number];
export type Project = {
  id: string;
  title: string;
  category: Exclude<ProjectCategory, "All projects">;
  categories: Exclude<ProjectCategory, "All projects">[];
  description: string;
  technologies: string[];
  features: string[];
  preview: "wellness" | "mango" | "redblue";
  image?: string;
  imageAlt?: string;
  repository: string;
  demo: string;
  role: string;
};
export const projects: Project[] = [
  {
    id: "vitalysync",
    title: "VitalySync",
    category: "Mobile Applications",
    categories: ["Mobile Applications"],
    description:
      "A more considered approach to wellbeing. An intelligent wellness app for burnout risk assessment and adaptive lifestyle recommendations.",
    technologies: [
      "Flutter",
      "Dart",
      "Node.js",
      "Express.js",
      "PostgreSQL",
      "REST API",
    ],
    features: [
      "Personalized wellness tracking",
      "Burnout risk assessment",
      "Adaptive lifestyle recommendations",
    ],
    preview: "wellness",
    repository: "",
    demo: "",
    role: "[Add your role and contribution]",
  },
  {
    id: "mango-classifier",
    title: "Mango Classifier",
    category: "Machine Learning",
    categories: ["Machine Learning"],
    description:
      "Exploring machine learning through image recognition. A classification project that identifies different varieties of mangoes.",
    technologies: ["Python", "TensorFlow / Keras", "MobileNet", "ResNet"],
    features: [
      "Mango variety identification",
      "Image-based classification",
      "MobileNet and ResNet architectures",
    ],
    preview: "mango",
    repository: "",
    demo: "",
    role: "[Add your role and contribution]",
  },
  {
    id: "red-vs-blue",
    title: "Red vs. Blue",
    category: "Web Development",
    categories: ["Web Development"],
    description:
      "Bringing the frontend and database together. A web project exploring React interfaces and Firebase integration.",
    technologies: ["React", "JavaScript", "Firebase", "Firestore"],
    features: ["React frontend", "Firebase integration", "Firestore database"],
    preview: "redblue",
    repository: "",
    demo: "",
    role: "[Add your role and contribution]",
  },
];
