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
  joinedAt: string;
  projectCount: number;
}

export const PLATFORM_USERS: PlatformUser[] = [
  {
    id: "u1",
    name: "Priya Sharma",
    initials: "PS",
    email: "priya.sharma@ku.edu.np",
    role: "student",
    status: "active",
    joinedAt: "1 Mar 2026",
    projectCount: 5,
  },
  {
    id: "u4",
    name: "Manisha Poudel",
    initials: "MP",
    email: "manisha.poudel@bu.edu.np",
    role: "student",
    status: "suspended",
    joinedAt: "12 Mar 2026",
    projectCount: 1,
  },
  {
    id: "u6",
    name: "Anil Chakraborty",
    initials: "AC",
    email: "anil.c@techventures.com",
    role: "client",
    status: "active",
    joinedAt: "2 Feb 2026",
    projectCount: 8,
  },
];

// Report fixtures power the Phase 1 admin reporting UI until backend reporting exists.

export type ReportStatus = "pending" | "resolved" | "dismissed";

export interface UserReport {
  id: string;
  reporterName: string;
  reporterInitials: string;
  reporterAvatar?: string;
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
    reporterName: "Priya Sharma",
    reporterInitials: "PS",
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
    reporterName: "Anil Chakraborty",
    reporterInitials: "AC",
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
    reporterName: "Dikshya Khanal",
    reporterInitials: "DK",
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
    reporterName: "Roshan Bhandari",
    reporterInitials: "RB",
    reportedUserName: "Meera Joshi",
    reportedUserRole: "client",
    reason: "Inappropriate Behavior",
    description:
      "The client used insulting language during project feedback and refused to discuss changes professionally.",
    submittedAt: "11 Jul 2026",
    status: "dismissed",
  },
];
