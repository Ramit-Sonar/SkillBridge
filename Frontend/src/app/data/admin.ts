// Local admin fixtures used by admin pages that are not API-backed yet.

export type VerificationStatus = "pending" | "approved" | "rejected";

export interface VerificationRequest {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: "Student";
  collegeName: string;
  university: string;
  studentId: string;
  submittedAt: string;
  status: VerificationStatus;
  major: string;
  year: string;
}

export const VERIFICATION_REQUESTS: VerificationRequest[] = [
  {
    id: "v1",
    name: "Ramit Sharma",
    initials: "RS",
    email: "ramit.sharma@ku.edu.np",
    role: "Student",
    collegeName: "Kathmandu University",
    university: "Kathmandu University",
    studentId: "KU-2021-0342",
    submittedAt: "13 Jun 2026",
    status: "pending",
    major: "Computer Science",
    year: "3rd Year",
  },
  {
    id: "v4",
    name: "Priya Sharma",
    initials: "PS",
    email: "priya.sharma@ku.edu.np",
    role: "Student",
    collegeName: "Kathmandu University",
    university: "Kathmandu University",
    studentId: "KU-2022-0188",
    submittedAt: "10 Jun 2026",
    status: "approved",
    major: "Design",
    year: "3rd Year",
  },
  {
    id: "v6",
    name: "Roshan Bhandari",
    initials: "RB",
    email: "roshan.bhandari@ncit.edu.np",
    role: "Student",
    collegeName: "NCIT",
    university: "NCIT",
    studentId: "NCIT-2022-211",
    submittedAt: "8 Jun 2026",
    status: "rejected",
    major: "Software Eng.",
    year: "3rd Year",
  },
];

// Client KYC entries mirror the admin verification card fields.

export interface ClientKycRequest {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: "Client";
  legalName: string;
  phone: string;
  companyName?: string;
  submittedAt: string;
  status: VerificationStatus;
}

export const CLIENT_KYC_REQUESTS: ClientKycRequest[] = [
  {
    id: "ck1",
    name: "Dikshya Khanal",
    initials: "DK",
    email: "dikshya@techventures.com",
    role: "Client",
    legalName: "Dikshya Khanal",
    phone: "9841234567",
    companyName: "TechNova Pvt. Ltd.",
    submittedAt: "12 Jun 2026",
    status: "pending",
  },
  {
    id: "ck3",
    name: "Vikram Nair",
    initials: "VN",
    email: "vikram@startuphub.io",
    role: "Client",
    legalName: "Vikram Nair",
    phone: "9861234569",
    companyName: "StartupHub Pvt. Ltd.",
    submittedAt: "8 Jun 2026",
    status: "approved",
  },
  {
    id: "ck4",
    name: "Meera Joshi",
    initials: "MJ",
    email: "meera.joshi@brandworks.com",
    role: "Client",
    legalName: "Meera Joshi",
    phone: "9871234560",
    submittedAt: "5 Jun 2026",
    status: "rejected",
  },
];

// User fixtures keep admin user-management screens renderable offline.

export type UserRole = "student" | "client";
export type UserStatus = "active" | "suspended";

export interface PlatformUser {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  verificationStatus: VerificationStatus;
  joinedAt: string;
  projectCount: number;
  reportsReceived: number;
  pendingReports: number;
  avatar?: string;
  location?: string;
  headline?: string;
  education?: string;
  university?: string;
  bio: string;
  skills?: { name: string; verified: boolean }[];
  companyName?: string;
  website?: string;
  jobsPosted?: number;
  projectsCompleted?: number;
}

export const PLATFORM_USERS: PlatformUser[] = [
  {
    id: "u1",
    name: "Priya Sharma",
    initials: "PS",
    email: "priya.sharma@ku.edu.np",
    role: "student",
    status: "active",
    verificationStatus: "approved",
    joinedAt: "1 Mar 2026",
    projectCount: 5,
    reportsReceived: 0,
    pendingReports: 0,
    location: "Kathmandu, Nepal",
    headline: "Frontend Developer focused on React and UI polish",
    education: "BSc CSIT - 3rd Year",
    university: "Kathmandu University",
    bio: "Priya builds clean React interfaces for student projects and small business dashboards.",
    skills: [
      { name: "React", verified: true },
      { name: "TypeScript", verified: true },
      { name: "UI/UX", verified: false },
      { name: "Tailwind CSS", verified: true },
    ],
  },
  {
    id: "u4",
    name: "Manisha Poudel",
    initials: "MP",
    email: "manisha.poudel@bu.edu.np",
    role: "student",
    status: "suspended",
    verificationStatus: "approved",
    joinedAt: "12 Mar 2026",
    projectCount: 1,
    reportsReceived: 3,
    pendingReports: 2,
    location: "Pokhara, Nepal",
    headline: "Graphic design student exploring brand identity work",
    education: "Bachelor in Design - 2nd Year",
    university: "Boston International College",
    bio: "Manisha works on logo concepts, presentation design, and beginner-friendly brand kits.",
    skills: [
      { name: "Canva", verified: true },
      { name: "Brand Design", verified: false },
      { name: "Presentation Design", verified: true },
    ],
  },
  {
    id: "u6",
    name: "Anil Chakraborty",
    initials: "AC",
    email: "anil.c@techventures.com",
    role: "client",
    status: "active",
    verificationStatus: "approved",
    joinedAt: "2 Feb 2026",
    projectCount: 8,
    reportsReceived: 2,
    pendingReports: 1,
    location: "Lalitpur, Nepal",
    companyName: "TechVentures Nepal",
    website: "techventures.com.np",
    bio: "TechVentures Nepal hires students for practical web, documentation, and internal tool projects.",
    jobsPosted: 12,
    projectsCompleted: 8,
  },
];

// Report fixtures power the Phase 1 admin reporting UI until backend reporting exists.

export type ReportStatus = "pending" | "resolved" | "dismissed";

export interface UserReport {
  id: string;
  reporterUserId: string;
  reporterName: string;
  reporterInitials: string;
  reporterAvatar?: string;
  reporterRole: UserRole;
  reportedUserId: string;
  reportedUserName: string;
  reportedUserRole: UserRole;
  reason: string;
  description: string;
  submittedAt: string;
  status: ReportStatus;
}

export const USER_REPORTS: UserReport[] = [
  {
    id: "r1",
    reporterUserId: "u1",
    reporterName: "Priya Sharma",
    reporterInitials: "PS",
    reporterRole: "student",
    reportedUserId: "u6",
    reportedUserName: "Anil Chakraborty",
    reportedUserRole: "client",
    reason: "Scam / Fraud",
    description:
      "The client asked me to continue work outside SkillBridge and requested payment through a private wallet link.",
    submittedAt: "19 Jul 2026",
    status: "pending",
  },
  {
    id: "r2",
    reporterUserId: "u6",
    reporterName: "Anil Chakraborty",
    reporterInitials: "AC",
    reporterRole: "client",
    reportedUserId: "u4",
    reportedUserName: "Manisha Poudel",
    reportedUserRole: "student",
    reason: "Spam",
    description:
      "The applicant repeatedly sent the same proposal message across multiple unrelated jobs.",
    submittedAt: "17 Jul 2026",
    status: "resolved",
  },
  {
    id: "r3",
    reporterUserId: "u6",
    reporterName: "Dikshya Khanal",
    reporterInitials: "DK",
    reporterRole: "client",
    reportedUserId: "v1",
    reportedUserName: "Ramit Sharma",
    reportedUserRole: "student",
    reason: "Fake Profile",
    description:
      "Portfolio links shown in the profile appear to belong to another developer and do not match the applicant's submitted work.",
    submittedAt: "15 Jul 2026",
    status: "pending",
  },
  {
    id: "r4",
    reporterUserId: "v6",
    reporterName: "Roshan Bhandari",
    reporterInitials: "RB",
    reporterRole: "student",
    reportedUserId: "ck4",
    reportedUserName: "Meera Joshi",
    reportedUserRole: "client",
    reason: "Inappropriate Behavior",
    description:
      "The client used insulting language during project feedback and refused to discuss changes professionally.",
    submittedAt: "11 Jul 2026",
    status: "dismissed",
  },
];
