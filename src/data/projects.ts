export const projectCategories = [
  "All projects",
  "Web Development",
  "Mobile Applications",
  "Desktop Applications",
  "Machine Learning",
  "Business Systems",
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
  preview: "wellness" | "mango" | "redblue" | "blueyellow" | "cover";
  cover?: {
    icon:
      | "store"
      | "flower"
      | "search"
      | "receipt"
      | "utensils"
      | "scissors"
      | "guitar"
      | "droplets"
      | "brain";
    tone: "lavender" | "sage" | "blue" | "sand" | "rose";
    label: string;
  };
  image?: string;
  imageAlt?: string;
  repository: string;
  additionalRepositories?: { label: string; url: string }[];
  demo: string;
  demoLabel?: string;
  role?: string;
  year?: string;
  status?: string;
  notes?: string[];
};
// Repository-backed project scope; only resume-confirmed contributions are attributed.
export const projects: Project[] = [
  {
    id: "vitalysync",
    title: "VitalySync",
    category: "Mobile Applications",
    categories: ["Mobile Applications", "Academic Projects"],
    description:
      "A mobile wellness companion for daily check-ins, burnout-related reflections, and personalized lifestyle suggestions.",
    technologies: ["Flutter", "Dart", "Node.js", "Express.js", "PostgreSQL"],
    features: [
      "User authentication and wellness profiles",
      "Daily tracking, periodic assessments, and trend reports",
      "Adaptive lifestyle recommendations",
    ],
    preview: "wellness",
    repository: "https://github.com/estoceorlan-dev/VitalySync",
    demo: "",
    role: "Developed the application, implemented authentication, tracking and assessment features, and integrated backend APIs and database services.",
    year: "2026",
    status: "Academic project",
    notes: ["Designed as a wellness aid, not a diagnostic or clinical tool."],
  },
  {
    id: "jce-management",
    title: "JCE Management System",
    category: "Desktop Applications",
    categories: [
      "Desktop Applications",
      "Mobile Applications",
      "Web Development",
      "Business Systems",
    ],
    description:
      "A Flutter business management and point-of-sale application for inventory, sales, reporting, and daily administration.",
    technologies: ["Flutter", "Dart", "Node.js", "PostgreSQL", "SQLite"],
    features: [
      "Point-of-sale, inventory management, and sales tracking",
      "Reporting and administrative workflows",
      "Offline-first Windows and Android clients; web administration",
    ],
    preview: "cover",
    cover: {
      icon: "store",
      tone: "lavender",
      label: "BUSINESS OPERATIONS",
    },
    repository: "https://github.com/estoceorlan-dev/JCE-Management-System",
    demo: "",
    role: "Designed and developed the business management system and integrated POS module, including inventory, sales tracking, reporting, and administrative functionality.",
    year: "2026",
    status: "In development",
    notes: [
      "Production release and hardware acceptance checks remain pending in the repository.",
    ],
  },
  {
    id: "florea-haven",
    title: "Floréa Haven",
    category: "Web Development",
    categories: ["Web Development", "Business Systems"],
    description:
      "A botanical storefront for seeds, flowers, and perfumes, with customer shopping flows and administration for catalog, inventory, and orders.",
    technologies: ["React", "Tailwind CSS", "Python", "Flask", "PostgreSQL"],
    features: [
      "Product browsing, persistent carts, and Cash on Delivery checkout",
      "Customer accounts and order history",
      "Catalog, stock, order, and user administration",
    ],
    preview: "cover",
    cover: {
      icon: "flower",
      tone: "sage",
      label: "BOTANICAL STOREFRONT",
    },
    repository: "https://github.com/estoceorlan-dev/Florea-Haven",
    additionalRepositories: [
      {
        label: "HTML / JavaScript version",
        url: "https://github.com/estoceorlan-dev/Florea-Haven-simple",
      },
    ],
    demo: "https://florea-haven.vercel.app",
    demoLabel: "Preview HTML version",
    notes: [
      "The linked preview is the separate plain HTML, CSS, and JavaScript version. Both versions use Flask and PostgreSQL.",
    ],
  },
  {
    id: "unifind",
    title: "UniFind",
    category: "Mobile Applications",
    categories: ["Mobile Applications"],
    description:
      "A campus lost-and-found platform that brings item reports, account verification, messaging, and moderation into one place.",
    technologies: ["Flutter", "Dart", "Firebase", "Firestore"],
    features: [
      "Lost-item, found-item, and announcement posts",
      "Administrator account verification and content moderation",
      "In-app messaging and notifications",
    ],
    preview: "cover",
    cover: {
      icon: "search",
      tone: "blue",
      label: "CAMPUS CONNECTIONS",
    },
    repository: "https://github.com/estoceorlan-dev/UniFind",
    demo: "",
  },
  {
    id: "mango-classifier",
    title: "Mango Classifier",
    category: "Machine Learning",
    categories: ["Machine Learning", "Web Development"],
    description:
      "A computer vision project that identifies five mango varieties and connects predictions to educational variety profiles.",
    technologies: ["Python", "TensorFlow / Keras", "MobileNetV2", "Flask"],
    features: [
      "MobileNetV2 transfer learning for five mango varieties",
      "Validated image uploads and confidence scores",
      "Variety profiles linked to classification results",
    ],
    preview: "mango",
    repository: "https://github.com/estoceorlan-dev/Mango-Classifier",
    demo: "",
    status: "Prototype",
  },
  {
    id: "jce-pos",
    title: "JCE POS",
    category: "Business Systems",
    categories: ["Business Systems", "Web Development"],
    description:
      "A separate React and TypeScript point-of-sale implementation for purchasing, checkout, returns, branch transfers, and reporting.",
    technologies: ["React", "TypeScript", "Node.js", "Express", "PostgreSQL"],
    features: [
      "Inventory, purchasing, checkout, and receipts",
      "Returns, register reconciliation, and local branch transfers",
      "Filtered reports, dashboards, and operational administration",
    ],
    preview: "cover",
    cover: {
      icon: "receipt",
      tone: "sand",
      label: "RETAIL WORKFLOWS",
    },
    repository: "https://github.com/estoceorlan-dev/jce-pos",
    demo: "",
    status: "In development",
    notes: [
      "Desktop packaging and production acceptance are later milestones; the current implementation is served by a local branch server.",
    ],
  },
  {
    id: "leslies-restaurant",
    title: "Leslie’s Restaurant",
    category: "Business Systems",
    categories: ["Business Systems", "Web Development", "Academic Projects"],
    description:
      "A local restaurant management system connecting cashier ordering, kitchen queues, inventory tracking, and sales reports.",
    technologies: ["React", "Node.js", "Express", "SQLite"],
    features: [
      "Role-based access for administrators, cashiers, and kitchen staff",
      "Dine-in and takeout ordering, receipts, and kitchen status updates",
      "Inventory movements, low-stock alerts, and printable reports",
    ],
    preview: "cover",
    cover: {
      icon: "utensils",
      tone: "sand",
      label: "RESTAURANT OPERATIONS",
    },
    repository:
      "https://github.com/estoceorlan-dev/Leslie-s-Restaurant-Management-System",
    demo: "",
    status: "School project",
  },
  {
    id: "romel-hair-salon",
    title: "Romel Hair Salon",
    category: "Business Systems",
    categories: ["Business Systems", "Web Development"],
    description:
      "A salon management application with authenticated roles, customer records, service catalogs, employee profiles, and manager settings.",
    technologies: ["React", "Vite", "Node.js", "Express", "PostgreSQL"],
    features: [
      "Verified sessions and role-based access",
      "Customer history, service catalogs, and employee availability",
      "Persistent, audited management records and settings",
    ],
    preview: "cover",
    cover: {
      icon: "scissors",
      tone: "rose",
      label: "SALON MANAGEMENT",
    },
    repository: "https://github.com/estoceorlan-dev/Hair-Salon",
    demo: "",
    status: "In development",
    notes: [
      "Booking transactions, inventory operations, and checkout are not yet implemented.",
    ],
  },
  {
    id: "roels-guitar-shop",
    title: "Roel’s Guitar Shop",
    category: "Business Systems",
    categories: ["Business Systems", "Web Development"],
    description:
      "A Python-powered shop application with server-rendered pages, product search, staff roles, inventory, and point-of-sale workflows.",
    technologies: ["Python", "Flask", "SQLite", "HTML", "CSS"],
    features: [
      "Role-based access for administrators, managers, and cashiers",
      "Product search and session-based shopping carts",
      "Stock-checked checkout, sale records, and inventory movements",
    ],
    preview: "cover",
    cover: {
      icon: "guitar",
      tone: "sand",
      label: "MUSIC MEETS RETAIL",
    },
    repository: "https://github.com/estoceorlan-dev/Guitar-Shop",
    demo: "",
    notes: [
      "Card and GCash options record received payments; external payment processing is not integrated.",
    ],
  },
  {
    id: "aquaflow",
    title: "AquaFlow",
    category: "Web Development",
    categories: ["Web Development", "Business Systems"],
    description:
      "A React dashboard prototype for water-refilling station operations, with views for orders, inventory, customers, and settings.",
    technologies: ["React", "Vite", "Tailwind CSS", "Recharts"],
    features: [
      "Daily operations dashboard",
      "Order and inventory views",
      "Customer records and settings interfaces",
    ],
    preview: "cover",
    cover: {
      icon: "droplets",
      tone: "blue",
      label: "WATER STATION DASHBOARD",
    },
    repository:
      "https://github.com/estoceorlan-dev/Water-Refilling-Management-System",
    demo: "",
    status: "Frontend prototype",
  },
  {
    id: "quickserve",
    title: "QuickServe",
    category: "Business Systems",
    categories: ["Business Systems", "Web Development"],
    description:
      "A canteen ordering application that connects meal selection, stock checks, billing, preparation queues, and completed orders.",
    technologies: ["Python", "Flask", "HTML", "CSS", "JavaScript"],
    features: [
      "Meal ordering with inventory and billing integration",
      "Preparation queues and completed-order tracking",
      "Administrative controls for meals, pricing, and inventory",
    ],
    preview: "cover",
    cover: {
      icon: "utensils",
      tone: "sage",
      label: "ORDER TO FULFILLMENT",
    },
    repository: "https://github.com/estoceorlan-dev/QuickServe",
    demo: "",
  },
  {
    id: "personascope",
    title: "PersonaScope",
    category: "Machine Learning",
    categories: ["Machine Learning", "Web Development"],
    description:
      "An MBTI prediction prototype with a guided questionnaire and four random-forest models, one for each personality dimension.",
    technologies: ["Python", "Flask", "scikit-learn", "pandas"],
    features: [
      "Questionnaire progress and answer validation",
      "Four binary trait models combined into an MBTI estimate",
      "Per-dimension prediction breakdown and confidence summary",
    ],
    preview: "cover",
    cover: {
      icon: "brain",
      tone: "lavender",
      label: "MACHINE LEARNING EXPLORATION",
    },
    repository: "https://github.com/estoceorlan-dev/MBTI-Predictor",
    demo: "",
    status: "Machine learning prototype",
  },
  {
    id: "blue-vs-yellow",
    title: "Blue vs. Yellow",
    category: "Web Development",
    categories: ["Web Development"],
    description:
      "A one-choice voting demo with a React frontend and a separate Express and PostgreSQL API.",
    technologies: ["React", "Vite", "Node.js", "Express", "PostgreSQL"],
    features: [
      "Blue-or-yellow voting interface",
      "Account-based API with hashed passwords",
      "Database enforcement of one vote per user",
    ],
    preview: "blueyellow",
    repository: "https://github.com/estoceorlan-dev/blue-vs-yellow-frontend",
    additionalRepositories: [
      {
        label: "Backend repository",
        url: "https://github.com/estoceorlan-dev/blue-vs-yellow-backend",
      },
    ],
    demo: "https://blue-vs-yellow-frontend.vercel.app",
    demoLabel: "Open frontend preview",
    status: "Demo",
  },
  {
    id: "red-vs-blue",
    title: "Red vs. Blue",
    category: "Web Development",
    categories: ["Web Development"],
    description:
      "A React and Firebase voting app: choose a side, store the vote in Firestore, and reveal the current result.",
    technologies: [
      "React",
      "JavaScript",
      "Firebase",
      "Firestore",
      "Tailwind CSS",
    ],
    features: [
      "Red-or-blue voting and results",
      "Firebase anonymous authentication",
      "One vote per anonymous identity through Firestore rules",
    ],
    preview: "redblue",
    repository: "https://github.com/estoceorlan-dev/RedvsBlue",
    demo: "",
    status: "Demo",
  },
];
