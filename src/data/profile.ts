// ---------------------------------------------------------------------------
// Point d'édition unique pour tout le contenu "réel" du portfolio.
// Remplacez les valeurs ci-dessous par vos propres informations.
// Les libellés d'interface (nav, boutons, titres de section) sont dans
// messages/fr.json et messages/en.json.
// ---------------------------------------------------------------------------

export type Locale = "fr" | "en";

export const siteConfig = {
  name: "Alex Moreau",
  initials: "AM",
  email: "alex.moreau@example.com",
  github: "https://github.com/alexmoreau",
  linkedin: "https://linkedin.com/in/alexmoreau",
  cvUrl: "/cv-placeholder.pdf",
};

export const yearsOfExperience = "5+";

export type Highlight = {
  icon: "refresh" | "handshake";
  key: "highlightMaintenance" | "highlightRelationship";
};

export const highlights: Highlight[] = [
  { icon: "refresh", key: "highlightMaintenance" },
  { icon: "handshake", key: "highlightRelationship" },
];

export type ExperienceEntry = {
  role: string;
  company: string;
  period: string;
  location: string;
  bullets: string[];
};

export const experience: Record<Locale, ExperienceEntry[]> = {
  fr: [
    {
      role: "Développeur Full-Stack Senior",
      company: "Nova Digital",
      period: "2023 — Présent",
      location: "Paris (hybride)",
      bullets: [
        "Conception et développement d'une plateforme SaaS B2B utilisée par plus de 10 000 utilisateurs actifs.",
        "Mise en place d'une architecture Next.js / Node.js avec une réduction de 40% du temps de chargement.",
        "Encadrement technique de deux développeurs juniors et mise en place de revues de code.",
      ],
    },
    {
      role: "Développeur Full-Stack",
      company: "Studio Kappa",
      period: "2021 — 2023",
      location: "Paris",
      bullets: [
        "Développement de sites et applications web sur mesure pour des clients grands comptes et startups.",
        "Intégration d'API de paiement, CMS headless et outils d'analytics.",
        "Amélioration continue des performances et du SEO technique des projets livrés.",
      ],
    },
    {
      role: "Développeur Front-End",
      company: "Lumen Web Agency",
      period: "2019 — 2021",
      location: "Lyon",
      bullets: [
        "Intégration de maquettes complexes en composants React réutilisables et testés.",
        "Collaboration étroite avec l'équipe design pour garantir la fidélité pixel-perfect.",
      ],
    },
  ],
  en: [
    {
      role: "Senior Full-Stack Developer",
      company: "Nova Digital",
      period: "2023 — Present",
      location: "Paris (hybrid)",
      bullets: [
        "Designed and built a B2B SaaS platform used by more than 10,000 active users.",
        "Set up a Next.js / Node.js architecture, cutting load time by 40%.",
        "Mentored two junior developers and introduced a code review process.",
      ],
    },
    {
      role: "Full-Stack Developer",
      company: "Studio Kappa",
      period: "2021 — 2023",
      location: "Paris",
      bullets: [
        "Built custom websites and web applications for enterprise clients and startups.",
        "Integrated payment APIs, headless CMS platforms and analytics tooling.",
        "Continuously improved performance and technical SEO across delivered projects.",
      ],
    },
    {
      role: "Front-End Developer",
      company: "Lumen Web Agency",
      period: "2019 — 2021",
      location: "Lyon",
      bullets: [
        "Turned complex designs into reusable, tested React components.",
        "Worked closely with the design team to ensure pixel-perfect accuracy.",
      ],
    },
  ],
};

export type EducationEntry = {
  degree: string;
  school: string;
  period: string;
};

export const education: Record<Locale, EducationEntry[]> = {
  fr: [
    {
      degree: "Master en Ingénierie Logicielle",
      school: "École Supérieure d'Informatique, Paris",
      period: "2017 — 2019",
    },
    {
      degree: "Licence Informatique",
      school: "Université de Lyon",
      period: "2014 — 2017",
    },
  ],
  en: [
    {
      degree: "M.Sc. in Software Engineering",
      school: "École Supérieure d'Informatique, Paris",
      period: "2017 — 2019",
    },
    {
      degree: "B.Sc. in Computer Science",
      school: "University of Lyon",
      period: "2014 — 2017",
    },
  ],
};

export type Project = {
  title: string;
  description: string;
  stack: string[];
  githubUrl?: string;
  demoUrl?: string;
  featured?: boolean;
  // Visuel affiché sur le panneau publicitaire de l'accueil 3D (fichiers dans
  // public/projects/). Sans média, un visuel est généré à partir du projet.
  // Format conseillé : 16:9 (ex. 1600×900), vidéo mp4 muette en boucle.
  media?: { image?: string; video?: string };
};

export const projects: Record<Locale, Project[]> = {
  fr: [
    {
      title: "Orbit — Plateforme de gestion de projets",
      description:
        "Application SaaS collaborative avec tableaux Kanban en temps réel, notifications et intégrations tierces.",
      stack: ["Next.js", "TypeScript", "PostgreSQL", "WebSockets"],
      githubUrl: "https://github.com/alexmoreau/orbit",
      demoUrl: "https://orbit-demo.example.com",
      featured: true,
    },
    {
      title: "Marché Local",
      description:
        "Marketplace e-commerce mettant en avant des producteurs locaux, avec paiement intégré et gestion de stock.",
      stack: ["React", "Node.js", "Stripe", "MongoDB"],
      githubUrl: "https://github.com/alexmoreau/marche-local",
      demoUrl: "https://marche-local-demo.example.com",
      featured: true,
    },
    {
      title: "Nimbus Analytics",
      description:
        "Tableau de bord d'analyse de données en temps réel avec visualisations interactives.",
      stack: ["Next.js", "D3.js", "tRPC", "Redis"],
      githubUrl: "https://github.com/alexmoreau/nimbus-analytics",
    },
    {
      title: "DevNotes",
      description:
        "Application de prise de notes pour développeurs avec coloration syntaxique et synchronisation cloud.",
      stack: ["React Native", "Firebase"],
      githubUrl: "https://github.com/alexmoreau/devnotes",
    },
    {
      title: "API Gateway Toolkit",
      description:
        "Boîte à outils open-source pour construire des API gateways légères avec rate limiting et cache.",
      stack: ["Node.js", "Express", "Redis"],
      githubUrl: "https://github.com/alexmoreau/api-gateway-toolkit",
    },
    {
      title: "Portfolio Générateur",
      description:
        "CLI générant des portfolios statiques personnalisables à partir d'un simple fichier de configuration.",
      stack: ["TypeScript", "Astro"],
      githubUrl: "https://github.com/alexmoreau/portfolio-gen",
    },
  ],
  en: [
    {
      title: "Orbit — Project Management Platform",
      description:
        "Collaborative SaaS app with real-time Kanban boards, notifications and third-party integrations.",
      stack: ["Next.js", "TypeScript", "PostgreSQL", "WebSockets"],
      githubUrl: "https://github.com/alexmoreau/orbit",
      demoUrl: "https://orbit-demo.example.com",
      featured: true,
    },
    {
      title: "Local Market",
      description:
        "E-commerce marketplace showcasing local producers, with integrated payments and inventory management.",
      stack: ["React", "Node.js", "Stripe", "MongoDB"],
      githubUrl: "https://github.com/alexmoreau/marche-local",
      demoUrl: "https://marche-local-demo.example.com",
      featured: true,
    },
    {
      title: "Nimbus Analytics",
      description:
        "Real-time data analytics dashboard with interactive visualizations.",
      stack: ["Next.js", "D3.js", "tRPC", "Redis"],
      githubUrl: "https://github.com/alexmoreau/nimbus-analytics",
    },
    {
      title: "DevNotes",
      description:
        "Note-taking app for developers with syntax highlighting and cloud sync.",
      stack: ["React Native", "Firebase"],
      githubUrl: "https://github.com/alexmoreau/devnotes",
    },
    {
      title: "API Gateway Toolkit",
      description:
        "Open-source toolkit for building lightweight API gateways with rate limiting and caching.",
      stack: ["Node.js", "Express", "Redis"],
      githubUrl: "https://github.com/alexmoreau/api-gateway-toolkit",
    },
    {
      title: "Portfolio Generator",
      description:
        "CLI that generates customizable static portfolios from a single configuration file.",
      stack: ["TypeScript", "Astro"],
      githubUrl: "https://github.com/alexmoreau/portfolio-gen",
    },
  ],
};

export const skills = {
  languages: ["TypeScript", "JavaScript", "Python", "SQL"],
  frontend: ["React", "Next.js", "Tailwind CSS", "Framer Motion"],
  backend: ["Node.js", "Express", "PostgreSQL", "MongoDB"],
  tools: ["Docker", "AWS", "Vercel", "GitHub Actions"],
};
