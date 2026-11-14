// Resume-backed content. Leave unprovided profile URLs empty.
export const personal = {
  name: "Orlandone Estoce",
  monogram: "OE",
  role: "BS Information Technology Student",
  aspiration: "Aspiring Software Developer",
  introduction: "Building useful software for everyday work.",
  summary:
    "I’m an Information Technology student with hands-on experience in web and mobile development, database integration, and IT systems support. I’m seeking an internship where I can contribute to real projects, solve practical problems, and grow alongside experienced developers.",
  availability: "Open to internship opportunities",
  school: "Buenavista Community College",
  academicYear: "Academic year 2026–2027",
  degree: "BS Information Technology",
  email: "estoce.orlan@gmail.com",
  phone: "0994 558 1412",
  phoneHref: "+639945581412",
  resumeUrl: "/resume.pdf",
  siteUrl: "https://www.orlanestoce.online",
  portraitUrl: "",
  portraitAlt: "Portrait of Orlandone Estoce",
  portraitCaption: "THE PERSON BEHIND THE PROJECTS",
  heroGreeting: "Hello, I’m",
  heroBadgeTitle: "Always a student.",
  heroBadgeSubtitle: "Always building something.",
  heroBottomLinkText: "A little more about me",
  heroBottomTagline: "Learning with intention. Building with care.",
  aboutLeadLine1: "Curious by nature.",
  aboutLeadLine2: "Precise by",
  aboutLeadHighlight: "practice.",
  educationCardHeader: "CURRENTLY LEARNING",
  occupationStatusPill: "Student",
  experienceCalloutTitle: "The next chapter could be with your team.",
  experienceCalloutSubtitle: "Looking for an IT internship and room to grow.",
  contactEyebrow: "Let’s connect",
  contactHeadingLine1: "Good things start",
  contactHeadingLine2: "with a",
  contactHeadingHighlight: "hello.",
  contactPrompt:
    "Interested in working together or offering an internship opportunity? I’d love to hear from you.",
  footerTagline: "Learning with intention. Building with care.",
  copyrightYear: "2026",
  seoDescription:
    "Orlandone Estoce is a BSIT student at Buenavista Community College and aspiring software developer. Explore his web, mobile, database, and machine learning projects, IT support experience, and internship availability.",
  about: [
    "I’m an Information Technology student at Buenavista Community College with hands-on experience in software development, database integration, and technical support.",
    "I’ve worked on applications using Flutter and React, developed backend APIs, integrated databases, and explored machine learning through personal and academic projects. I enjoy understanding how things work, experimenting with different technologies, and finding practical ways to put them to use.",
    "At JCE Dry Goods Trading, I’ve gained practical experience working with business software, including point-of-sale and management systems. My responsibilities have involved system maintenance, troubleshooting, data management, and operational reporting.",
    "I value structure, careful planning, and attention to detail. I prefer staying ahead of deadlines and keeping work organized, while remaining flexible when priorities change. I believe an efficient process should lead to a quality result, and I’m comfortable working under pressure without losing sight of either.",
    "I’m currently looking for an internship where I can apply what I’ve learned, contribute to real-world projects, and continue developing as an IT professional.",
  ],
  interests: [
    {
      title: "Software that supports real work",
      description:
        "Web, mobile, and business applications with practical workflows.",
    },
    {
      title: "Technical troubleshooting",
      description:
        "System maintenance, updates, and resolving day-to-day IT issues.",
    },
    {
      title: "Careful data management",
      description:
        "Database integration, accurate records, and clear operational reports.",
    },
  ],
  languages: ["English", "Cebuano", "Tagalog"],
  socials: {
    github: "https://github.com/estoceorlan-dev",
    linkedin: "https://www.linkedin.com/in/orlandone-estoce-62a0673a4",
    facebook: "https://www.facebook.com/not.orlan",
    whatsapp: "https://wa.me/639945581412",
  },
};
export const navigation = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "certifications", label: "Credentials" },
  { id: "contact", label: "Contact" },
];

export type PersonalData = typeof personal;

export type SectionHeadingConfig = {
  label: string;
  title: string;
  description?: string;
};

export type SectionHeadings = {
  about: SectionHeadingConfig;
  skills: SectionHeadingConfig;
  projects: SectionHeadingConfig;
  experience: SectionHeadingConfig;
  certifications: SectionHeadingConfig;
};

export const defaultSectionHeadings: SectionHeadings = {
  about: {
    label: "A little about me",
    title: "Curiosity is where it starts.",
  },
  skills: {
    label: "My toolkit",
    title: "The tools behind the ideas.",
    description:
      "The languages, frameworks, and tools I work with across software development, databases, and everyday IT support.",
  },
  projects: {
    label: "Selected work",
    title: "From a thought to a thing.",
    description:
      "Mobile applications, business systems, and machine learning experiments. Explore the code and the ideas behind each project.",
  },
  experience: {
    label: "The journey so far",
    title: "Building a foundation.",
    description:
      "An IT education supported by hands-on software development, business administration, and technical support experience.",
  },
  certifications: {
    label: "Credentials & eligibility",
    title: "Learning. Applied.",
    description:
      "Professional eligibility alongside a growing foundation in information technology.",
  },
};
