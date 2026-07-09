// Shared project dummy data - replace with API responses when the backend is ready.

import type { ProfileViewProps } from "../components/shared/StudentProfileView";

export type ProjectStatus = "active" | "submitted" | "revision_requested" | "completed";

export type ProjectSubmissionStatus = "submitted" | "revision_requested" | "approved";

export interface ProjectFile {
  url: string;
  publicId?: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface ProjectPerson {
  name: string;
  initials: string;
  avatar?: string;
}

export interface ProjectSubmission {
  id: string;
  versionNumber: number;
  label?: string;
  status: ProjectSubmissionStatus;
  submittedAt: string;
  notes?: string;
  demoLink?: string;
  repositoryLink?: string;
  liveUrl?: string;
  attachments?: ProjectFile[];
  approvedAt?: string | null;
}

export interface RevisionRequest {
  id: string;
  revisionNumber: number;
  requestedBy: ProjectPerson | null;
  requestedAt: string;
  message: string;
  attachments: ProjectFile[];
  referenceLinks: string[];
  resolved: boolean;
  resolvedAt?: string | null;
}

export interface ProjectTimelineItem {
  key: string;
  label: string;
  date: string;
  tone: "neutral" | "success" | "danger" | "muted";
}

export interface ProjectJobDetails {
  title: string;
  category: string;
  status: "open" | "closed" | "cancelled";
  description: string;
  requirements: string;
  skills: string[];
  budget: string;
  duration: string;
  deadline: string;
  complexity: "small" | "medium";
  postedAt: string;
  attachedFiles: ProjectFile[];
  clientName: string;
  clientInitials: string;
  clientLocation: string;
  clientCompanyName: string;
  clientWebsite: string;
  clientAbout: string;
  clientVerified: boolean;
  clientJobsPosted: number;
  clientProjectsCompleted: number;
  clientJoinedDate: string;
  clientRating: number;
}

export interface ProjectApplicationDetails {
  id: string;
  status: "accepted";
  appliedAt: string;
  updatedAt: string;
  acceptedAt: string;
  estimatedTime: string;
  coverMessage: string;
  whySuitable: string;
  attachments: ProjectFile[];
}

export interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  category: string;
  student: ProjectPerson;
  client: ProjectPerson;
  startDate: string;
  deadline: string;
  budget: string;
  description: string;
  requirements: string;
  skills: string[];
  progress: number;
  currentStage: string;
  deliverableStatus: string;
  actionRequired: string;
  revisionCount: number;
  lastUpdated: string;
  completedAt?: string;
  submissions: ProjectSubmission[];
  revisionRequests: RevisionRequest[];
  timeline: ProjectTimelineItem[];
  job: ProjectJobDetails;
  application: ProjectApplicationDetails;
  studentProfile?: ProfileViewProps | null;
}

export const PROJECT_STATUS_CFG: Record<
  ProjectStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  active: {
    label: "Active",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    dot: "#3B82F6",
  },
  submitted: {
    label: "Submitted",
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    dot: "#8B5CF6",
  },
  revision_requested: {
    label: "Revision",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    dot: "#F59E0B",
  },
  completed: {
    label: "Completed",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    dot: "#10B981",
  },
};

const file = (originalName: string, size: number, mimeType: string, url = "#"): ProjectFile => ({
  url,
  publicId: "",
  originalName,
  mimeType,
  size,
});

const baseJob = {
  status: "closed" as const,
  duration: "7d",
  complexity: "medium" as const,
  postedAt: "1 Jun 2026",
  clientLocation: "Kathmandu, Nepal",
  clientCompanyName: "SkillBridge Studio",
  clientWebsite: "https://skillbridge.example.com",
  clientAbout: "A small product team hiring students for focused design and development tasks.",
  clientVerified: true,
  clientJobsPosted: 12,
  clientProjectsCompleted: 8,
  clientJoinedDate: "Jan 2026",
  clientRating: 4.8,
};

const baseApplication = {
  status: "accepted" as const,
  appliedAt: "2 Jun 2026",
  updatedAt: "3 Jun 2026",
  acceptedAt: "3 Jun 2026",
  estimatedTime: "7 days",
  coverMessage:
    "I have worked on similar student projects and can deliver a clean, responsive result within the deadline.",
  whySuitable:
    "My portfolio includes responsive layouts, component-based development, and simple handoff documentation.",
  attachments: [file("student-portfolio.pdf", 920000, "application/pdf")],
};

export const PROJECTS: Project[] = [
  {
    id: "p1",
    title: "EdTech Landing Page Design",
    status: "submitted",
    category: "UI/UX Design",
    student: { name: "Priya Sharma", initials: "PS" },
    client: { name: "Dikshya Khanal", initials: "DK" },
    startDate: "8 Jun 2026",
    deadline: "15 Jun 2026",
    budget: "8,000",
    description:
      "Design a modern, conversion-focused landing page for an online learning platform.",
    requirements:
      "Use the brand colors, include hero, features, testimonials, and CTA sections, and deliver the final Figma prototype.",
    skills: ["Figma", "UI/UX", "Prototyping", "Mobile Design"],
    progress: 70,
    currentStage: "Waiting for Client Review",
    deliverableStatus: "Version 1 submitted",
    actionRequired: "Client review needed",
    revisionCount: 0,
    lastUpdated: "11 Jun 2026, 3:42 PM",
    submissions: [],
    revisionRequests: [],
    timeline: [],
    job: {
      ...baseJob,
      title: "EdTech Landing Page Design",
      category: "ui-ux",
      description:
        "Design a modern, conversion-focused landing page for our online learning platform.",
      requirements: "Use our brand colors. Include hero, features, testimonials, and CTA sections.",
      skills: ["Figma", "UI/UX", "Prototyping", "Mobile Design"],
      budget: "8,000",
      deadline: "15 Jun 2026",
      attachedFiles: [file("brand-guidelines.pdf", 600000, "application/pdf")],
      clientName: "Dikshya Khanal",
      clientInitials: "DK",
    },
    application: {
      ...baseApplication,
      id: "app-p1",
      acceptedAt: "8 Jun 2026",
    },
  },
  {
    id: "p2",
    title: "React Portfolio Website",
    status: "active",
    category: "Web Development",
    student: { name: "Roshan Bhandari", initials: "RB" },
    client: { name: "Dikshya Khanal", initials: "DK" },
    startDate: "10 Jun 2026",
    deadline: "20 Jun 2026",
    budget: "6,500",
    description:
      "Build a personal portfolio website using React and TailwindCSS based on the provided Figma design.",
    requirements:
      "Implement responsive pages, subtle animations, contact form validation, and deploy to Vercel.",
    skills: ["React", "TailwindCSS", "JavaScript", "Vercel"],
    progress: 35,
    currentStage: "Ready to Submit",
    deliverableStatus: "No deliverables submitted",
    actionRequired: "Student submission needed",
    revisionCount: 0,
    lastUpdated: "12 Jun 2026, 10:15 AM",
    submissions: [],
    revisionRequests: [],
    timeline: [],
    job: {
      ...baseJob,
      title: "React Portfolio Website",
      category: "web-dev",
      description: "Build a personal portfolio website using React and TailwindCSS.",
      requirements: "Follow the Figma design, make the site responsive, and deploy it to Vercel.",
      skills: ["React", "TailwindCSS", "JavaScript", "Vercel"],
      budget: "6,500",
      deadline: "20 Jun 2026",
      attachedFiles: [file("portfolio-wireframe.fig", 2100000, "application/figma")],
      clientName: "Dikshya Khanal",
      clientInitials: "DK",
    },
    application: {
      ...baseApplication,
      id: "app-p2",
      appliedAt: "8 Jun 2026",
      acceptedAt: "9 Jun 2026",
      estimatedTime: "10 days",
    },
  },
  {
    id: "p3",
    title: "Food Delivery App UI Revision",
    status: "revision_requested",
    category: "UI/UX Design",
    student: { name: "Mina Gurung", initials: "MG" },
    client: { name: "Suman Karki", initials: "SK" },
    startDate: "5 Jun 2026",
    deadline: "18 Jun 2026",
    budget: "9,500",
    description:
      "Create a mobile UI kit for a food delivery app with customer, restaurant, and delivery screens.",
    requirements:
      "Prepare mobile-first screens, reusable components, and a clickable prototype for review.",
    skills: ["Figma", "Mobile UI", "Design Systems"],
    progress: 65,
    currentStage: "Revision Requested",
    deliverableStatus: "Version 1 needs changes",
    actionRequired: "Student resubmission needed",
    revisionCount: 1,
    lastUpdated: "13 Jun 2026, 5:20 PM",
    submissions: [],
    revisionRequests: [],
    timeline: [],
    job: {
      ...baseJob,
      title: "Food Delivery App UI Revision",
      category: "ui-ux",
      description: "Create a complete mobile UI kit for a food delivery app.",
      requirements:
        "Include customer, restaurant, and delivery screens with a clickable prototype.",
      skills: ["Figma", "Mobile UI", "Design Systems"],
      budget: "9,500",
      deadline: "18 Jun 2026",
      attachedFiles: [file("app-flow-notes.pdf", 760000, "application/pdf")],
      clientName: "Suman Karki",
      clientInitials: "SK",
    },
    application: {
      ...baseApplication,
      id: "app-p3",
      appliedAt: "3 Jun 2026",
      acceptedAt: "4 Jun 2026",
    },
  },
  {
    id: "p4",
    title: "Social Media Design Kit",
    status: "completed",
    category: "Graphic Design",
    student: { name: "Aakash Thapa", initials: "AT" },
    client: { name: "Dikshya Khanal", initials: "DK" },
    startDate: "1 Jun 2026",
    deadline: "5 Jun 2026",
    budget: "3,500",
    description:
      "Create a set of 20 branded social media post templates for Instagram, Facebook, and LinkedIn.",
    requirements:
      "Templates must cover announcements, quotes, and product features. All files should be editable in Canva.",
    skills: ["Canva", "Graphic Design", "Social Media"],
    progress: 100,
    currentStage: "Completed",
    deliverableStatus: "Version 2 approved",
    actionRequired: "No action required",
    revisionCount: 1,
    lastUpdated: "6 Jun 2026, 11:30 AM",
    completedAt: "6 Jun 2026, 11:30 AM",
    submissions: [],
    revisionRequests: [],
    timeline: [],
    job: {
      ...baseJob,
      title: "Social Media Design Kit",
      category: "graphic",
      description: "Create a set of branded social media templates.",
      requirements: "Prepare editable Canva templates and PNG exports.",
      skills: ["Canva", "Graphic Design", "Social Media"],
      budget: "3,500",
      deadline: "5 Jun 2026",
      attachedFiles: [file("brand-guide.pdf", 800000, "application/pdf")],
      clientName: "Dikshya Khanal",
      clientInitials: "DK",
    },
    application: {
      ...baseApplication,
      id: "app-p4",
      appliedAt: "30 May 2026",
      acceptedAt: "31 May 2026",
      estimatedTime: "5 days",
    },
  },
];
