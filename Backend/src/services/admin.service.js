import { User } from "../models/user.model.js";
import { Application } from "../models/application.model.js";
import { ClientProfile } from "../models/clientProfile.model.js";
import { Job } from "../models/job.model.js";
import { PlatformSettings } from "../models/platformSettings.model.js";
import { Project } from "../models/project.model.js";
import { Report } from "../models/report.model.js";
import { StudentProfile } from "../models/studentProfile.model.js";
import { Verification } from "../models/verification.model.js";
import { getStudentCompletedProjectProfileMap } from "./project.service.js";
import { getStudentReviewProfileMap } from "./review.service.js";

const JOB_MODERATION_REASONS = [
  "Spam",
  "Fake Job",
  "Duplicate Listing",
  "Policy Violation",
  "Copyright Issue",
  "Other",
];

const DEFAULT_MAINTENANCE_MESSAGE =
  "SkillBridge is currently under maintenance.";
const DEFAULT_PLATFORM_NAME = "SkillBridge";
const DEFAULT_SUPPORT_EMAIL = "support@skillbridge.com";
const DEFAULT_PLATFORM_DESCRIPTION =
  "A platform connecting verified students with local clients for real-world projects.";
const getDefaultMaintenanceMessage = (platformName = DEFAULT_PLATFORM_NAME) =>
  `${platformName} is currently under maintenance.`;

/**
 * Ensures the configured admin account exists when the server starts.
 */
const createAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || "SkillBridge Admin";

    if (!adminEmail || !adminPassword) {
      console.log("Admin credentials are missing in .env.");
      return;
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      email: adminEmail,
    });

    if (existingAdmin) {
      const isAdminPasswordValid =
        await existingAdmin.isPasswordCorrect(adminPassword);

      if (existingAdmin.role !== "admin" || !isAdminPasswordValid) {
        existingAdmin.fullName = adminName;
        existingAdmin.email = adminEmail;
        existingAdmin.password = adminPassword;
        existingAdmin.role = "admin";
        await existingAdmin.save();
        console.log("Admin account updated successfully.");
        return;
      }

      console.log("Admin already exists.");
      return;
    }

    // Create admin account
    await User.create({
      fullName: adminName,
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      avatar: "",
    });

    console.log("Admin account created successfully.");
  } catch (error) {
    console.error(" Error creating admin:", error.message);
  }
};

const getInitials = (fullName = "") => {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const mapByUserId = (items) =>
  new Map(items.map((item) => [item.user.toString(), item]));

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isValidJobModerationReason = (reason) =>
  JOB_MODERATION_REASONS.includes(reason);

const getReportCountMap = async (userIds) => {
  if (userIds.length === 0) return new Map();

  const reportCounts = await Report.aggregate([
    {
      $match: {
        reportedUser: { $in: userIds },
      },
    },
    {
      $group: {
        _id: "$reportedUser",
        reportsReceived: { $sum: 1 },
        pendingReports: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
      },
    },
  ]);

  return new Map(
    reportCounts.map((item) => [
      item._id.toString(),
      {
        reportsReceived: item.reportsReceived,
        pendingReports: item.pendingReports,
      },
    ])
  );
};

const getClientStatsMap = async (clientIds) => {
  if (clientIds.length === 0) return new Map();

  const [jobCounts, projectCounts] = await Promise.all([
    Job.aggregate([
      {
        $match: {
          client: { $in: clientIds },
        },
      },
      {
        $group: {
          _id: "$client",
          jobsPosted: { $sum: 1 },
        },
      },
    ]),
    Project.aggregate([
      {
        $match: {
          client: { $in: clientIds },
        },
      },
      {
        $group: {
          _id: "$client",
          projectsCompleted: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          activeProjects: {
            $sum: { $cond: [{ $ne: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const statsMap = new Map(
    clientIds.map((clientId) => [
      clientId.toString(),
      {
        jobsPosted: 0,
        projectsCompleted: 0,
        activeProjects: 0,
      },
    ])
  );

  jobCounts.forEach((item) => {
    const stats = statsMap.get(item._id.toString());

    if (stats) {
      stats.jobsPosted = item.jobsPosted;
    }
  });

  projectCounts.forEach((item) => {
    const stats = statsMap.get(item._id.toString());

    if (stats) {
      stats.projectsCompleted = item.projectsCompleted;
      stats.activeProjects = item.activeProjects;
    }
  });

  return statsMap;
};

const buildPendingTaskSummary = (verification) => {
  const user = verification.user || {};
  const fullName = user.fullName || "Unknown User";
  const roleLabel =
    verification.type === "client" ? "client KYC" : "student verification";

  return {
    id: verification._id.toString(),
    name: fullName,
    initials: getInitials(fullName),
    type: verification.type,
    text: `${fullName} submitted a ${roleLabel} request`,
    submittedAt: verification.submittedAt || verification.createdAt,
    path: verification.type === "client" ? "/admin/clients" : "/admin/students",
  };
};

const getAdminDashboardSummaryData = async () => {
  const [
    pendingVerifications,
    pendingVerificationCount,
    studentCount,
    clientCount,
    activeProjectCount,
  ] = await Promise.all([
    Verification.find({ status: "pending" })
      .populate("user", "fullName avatar role")
      .sort({ submittedAt: -1, createdAt: -1 })
      .limit(5)
      .lean(),
    Verification.countDocuments({ status: "pending" }),
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "client" }),
    Project.countDocuments({ status: { $ne: "completed" } }),
  ]);

  const pendingTasks = pendingVerifications.map(buildPendingTaskSummary);

  return {
    pendingVerifications: pendingVerificationCount,
    totalStudents: studentCount,
    totalClients: clientCount,
    activeProjects: activeProjectCount,
    pendingTasks,
  };
};

const buildAdminUserSummary = ({
  user,
  verification,
  reportCounts,
  studentProfile,
  studentProjectProfile,
  studentReviewProfile,
  clientProfile,
  clientStats,
}) => {
  const isStudent = user.role === "student";
  const verificationStatus = verification?.status || "pending";
  const studentCompletedProjects =
    studentProjectProfile?.completedProjectsCount || 0;
  const clientProjectsCompleted = clientStats?.projectsCompleted || 0;

  const summary = {
    id: user._id.toString(),
    name: user.fullName,
    initials: getInitials(user.fullName),
    email: user.email,
    role: user.role,
    status: user.accountStatus || "active",
    suspendedAt: user.suspendedAt || null,
    suspendedBy: user.suspendedBy
      ? {
          id: user.suspendedBy._id?.toString?.() || user.suspendedBy.toString(),
          name: user.suspendedBy.fullName || "Unknown Admin",
          email: user.suspendedBy.email || "",
        }
      : null,
    suspensionReason: user.suspensionReason || "",
    verificationStatus,
    joinedAt: user.createdAt,
    projectCount: isStudent
      ? studentCompletedProjects
      : clientProjectsCompleted,
    reportsReceived: reportCounts?.reportsReceived || 0,
    pendingReports: reportCounts?.pendingReports || 0,
    avatar: user.avatar || "",
    bio: isStudent ? studentProfile?.bio || "" : clientProfile?.bio || "",
  };

  if (isStudent) {
    summary.headline =
      studentProfile?.education ||
      studentProfile?.university ||
      "Student freelancer building practical project experience";
    summary.education = studentProfile?.education || "";
    summary.university = studentProfile?.university || "";
    summary.github = studentProfile?.github || "";
    summary.linkedin = studentProfile?.linkedin || "";
    summary.portfolio = studentProfile?.portfolio || "";
    summary.skills = (studentProfile?.skills || []).map((skill) => ({
      name: skill,
      verified: false,
    }));
    summary.ratingSummary = studentReviewProfile?.ratingSummary || null;
    summary.completedProjects = studentProjectProfile?.completedProjects || [];
    summary.latestReviews = studentReviewProfile?.latestReviews || [];
  } else {
    summary.location = clientProfile?.location || "";
    summary.companyName =
      clientProfile?.companyName || verification?.companyName || "";
    summary.website = clientProfile?.website || "";
    summary.jobsPosted = clientStats?.jobsPosted || 0;
    summary.projectsCompleted = clientProjectsCompleted;
    summary.activeProjects = clientStats?.activeProjects || 0;
  }

  return summary;
};

const buildAdminUserSummaries = async (users) => {
  const userIds = users.map((user) => user._id);
  const studentIds = users
    .filter((user) => user.role === "student")
    .map((user) => user._id);
  const clientIds = users
    .filter((user) => user.role === "client")
    .map((user) => user._id);

  const [
    verifications,
    studentProfiles,
    clientProfiles,
    reportCountMap,
    studentProjectProfileMap,
    studentReviewProfileMap,
    clientStatsMap,
  ] = await Promise.all([
    Verification.find({ user: { $in: userIds } })
      .select("user status verifiedAt companyName")
      .lean(),
    StudentProfile.find({ user: { $in: studentIds } }).lean(),
    ClientProfile.find({ user: { $in: clientIds } }).lean(),
    getReportCountMap(userIds),
    getStudentCompletedProjectProfileMap(studentIds),
    getStudentReviewProfileMap(studentIds),
    getClientStatsMap(clientIds),
  ]);

  const verificationMap = mapByUserId(verifications);
  const studentProfileMap = mapByUserId(studentProfiles);
  const clientProfileMap = mapByUserId(clientProfiles);

  return users.map((user) => {
    const userId = user._id.toString();

    return buildAdminUserSummary({
      user,
      verification: verificationMap.get(userId),
      reportCounts: reportCountMap.get(userId),
      studentProfile: studentProfileMap.get(userId),
      studentProjectProfile: studentProjectProfileMap.get(userId),
      studentReviewProfile: studentReviewProfileMap.get(userId),
      clientProfile: clientProfileMap.get(userId),
      clientStats: clientStatsMap.get(userId),
    });
  });
};

const getAdminUsersData = async () => {
  const users = await User.find({ role: { $in: ["student", "client"] } })
    .select(
      "_id fullName email role avatar profileCompleted accountStatus suspendedAt suspendedBy suspensionReason createdAt"
    )
    .populate("suspendedBy", "fullName email role")
    .sort({ createdAt: -1 })
    .lean();

  return buildAdminUserSummaries(users);
};

const getAdminUserDetailsData = async (userId) => {
  const user = await User.findOne({
    _id: userId,
    role: { $in: ["student", "client"] },
  })
    .select(
      "_id fullName email role avatar profileCompleted accountStatus suspendedAt suspendedBy suspensionReason createdAt"
    )
    .populate("suspendedBy", "fullName email role")
    .lean();

  if (!user) return null;

  const [userSummary] = await buildAdminUserSummaries([user]);

  return userSummary;
};

const buildAdminJobClient = (client) => {
  if (!client) {
    return {
      id: "",
      name: "Unknown Client",
      fullName: "Unknown Client",
      initials: "UC",
      avatar: "",
      joined: null,
      location: "",
      companyName: "",
      website: "",
      bio: "",
      verification: {
        status: null,
        verifiedAt: null,
      },
      statistics: {
        jobsPosted: null,
        projectsCompleted: null,
        activeProjects: null,
        totalReviews: null,
        averageRating: null,
      },
    };
  }

  const clientId = client._id?.toString?.() || client.toString?.() || "";
  const clientName = client.fullName || "Unknown Client";

  return {
    id: clientId,
    name: clientName,
    fullName: clientName,
    initials: getInitials(clientName),
    avatar: client.avatar || "",
    joined: client.createdAt || null,
    location: client.location || "",
    companyName: client.companyName || "",
    website: client.website || "",
    bio: client.bio || "",
    verification: client.verification || {
      status: null,
      verifiedAt: null,
    },
    statistics: client.statistics || {
      jobsPosted: null,
      projectsCompleted: null,
      activeProjects: null,
      totalReviews: null,
      averageRating: null,
    },
  };
};

const buildDetailedAdminJobClient = ({
  client,
  clientProfile,
  verification,
  clientStats,
}) => {
  const detailedClient = {
    ...(client || {}),
    location: clientProfile?.location || "",
    companyName: clientProfile?.companyName || verification?.companyName || "",
    website: clientProfile?.website || "",
    bio: clientProfile?.bio || "",
    verification: {
      status: verification?.status || null,
      verifiedAt: verification?.verifiedAt || verification?.approvedAt || null,
    },
    statistics: {
      jobsPosted: clientStats?.jobsPosted ?? null,
      projectsCompleted: clientStats?.projectsCompleted ?? null,
      activeProjects: clientStats?.activeProjects ?? null,
      totalReviews: null,
      averageRating: null,
    },
  };

  return buildAdminJobClient(detailedClient);
};

const getApplicationCountMapByJob = async (jobIds) => {
  if (jobIds.length === 0) return new Map();

  const applicationCounts = await Application.aggregate([
    {
      $match: {
        job: { $in: jobIds },
      },
    },
    {
      $group: {
        _id: "$job",
        applications: { $sum: 1 },
      },
    },
  ]);

  return new Map(
    applicationCounts.map((item) => [item._id.toString(), item.applications])
  );
};

const buildAdminJobSummary = (job, applicationCountMap = new Map()) => {
  const client = buildAdminJobClient(job.client);
  const jobId = job._id.toString();
  const applications = applicationCountMap.get(jobId) || 0;

  return {
    id: jobId,
    title: job.title,
    client,
    clientName: client.name,
    clientInitials: client.initials,
    clientAvatar: client.avatar,
    clientId: client.id,
    clientLocation: client.location,
    clientCompanyName: client.companyName,
    clientWebsite: client.website,
    clientAbout: client.bio,
    clientVerified: client.verification.status === "approved",
    clientJobsPosted: client.statistics.jobsPosted,
    clientProjectsCompleted: client.statistics.projectsCompleted,
    clientJoinedDate: client.joined,
    clientRating: client.statistics.averageRating,
    category: job.category,
    budget: job.budget,
    duration: job.duration,
    deadline: job.deadline,
    complexity: job.complexity,
    status: job.status,
    moderatedBy: job.moderatedBy
      ? {
          id: job.moderatedBy._id?.toString?.() || job.moderatedBy.toString(),
          name: job.moderatedBy.fullName || "Unknown Admin",
          email: job.moderatedBy.email || "",
        }
      : null,
    moderatedAt: job.moderatedAt || null,
    moderationReason: job.moderationReason || "",
    customModerationReason: job.customModerationReason || "",
    postedAt: job.createdAt,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    applications,
    applicationCount: applications,
    applicationsCount: applications,
    description: job.description,
    requirements: job.requirements,
    skills: job.skills || [],
    attachments: job.attachments || [],
  };
};

const buildAdminJobDetails = (job, applications, clientDetails) => {
  const applicationCountMap = new Map([
    [job._id.toString(), applications.length],
  ]);
  const summary = buildAdminJobSummary(job, applicationCountMap);

  return {
    ...summary,
    client: clientDetails || summary.client,
    clientName: clientDetails?.name || summary.clientName,
    clientInitials: clientDetails?.initials || summary.clientInitials,
    clientAvatar: clientDetails?.avatar || summary.clientAvatar,
    clientId: clientDetails?.id || summary.clientId,
    clientLocation: clientDetails?.location || "",
    clientCompanyName: clientDetails?.companyName || "",
    clientWebsite: clientDetails?.website || "",
    clientAbout: clientDetails?.bio || "",
    clientVerified: clientDetails?.verification?.status === "approved",
    clientJobsPosted: clientDetails?.statistics?.jobsPosted ?? null,
    clientProjectsCompleted:
      clientDetails?.statistics?.projectsCompleted ?? null,
    clientJoinedDate: clientDetails?.joined || null,
    clientRating: clientDetails?.statistics?.averageRating ?? null,
    _id: job._id,
    applications: applications.map((application) => ({
      id: application._id.toString(),
      student: application.student
        ? {
            id: application.student._id?.toString?.() || "",
            name: application.student.fullName || "Unknown Student",
            initials: getInitials(
              application.student.fullName || "Unknown Student"
            ),
            avatar: application.student.avatar || "",
          }
        : null,
      status: application.status,
      appliedAt: application.appliedAt,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    })),
    applicationCount: applications.length,
    applicationsCount: applications.length,
  };
};

const getAdminJobsData = async ({ search = "", status = "all" } = {}) => {
  const query = {};
  const normalizedStatus = status.toLowerCase();

  if (["open", "closed", "cancelled", "suspended"].includes(normalizedStatus)) {
    query.status = normalizedStatus;
  }

  const trimmedSearch = search.trim();

  if (trimmedSearch) {
    const searchRegex = new RegExp(escapeRegex(trimmedSearch), "i");
    const clientMatches = await User.find({
      role: "client",
      fullName: searchRegex,
    })
      .select("_id")
      .lean();

    query.$or = [
      { title: searchRegex },
      { category: searchRegex },
      { description: searchRegex },
    ];

    if (clientMatches.length > 0) {
      query.$or.push({
        client: { $in: clientMatches.map((client) => client._id) },
      });
    }
  }

  const jobs = await Job.find(query)
    .populate("client", "fullName avatar")
    .populate("moderatedBy", "fullName email role")
    .sort({ createdAt: -1 })
    .lean();

  const applicationCountMap = await getApplicationCountMapByJob(
    jobs.map((job) => job._id)
  );

  return jobs.map((job) => buildAdminJobSummary(job, applicationCountMap));
};

const getAdminJobDetailsData = async (jobId) => {
  const job = await Job.findById(jobId)
    .populate("client", "fullName avatar createdAt")
    .populate("moderatedBy", "fullName email role")
    .lean();

  if (!job) return null;

  const clientId = job.client?._id || null;
  const [applications, clientProfile, verification, clientStatsMap] =
    await Promise.all([
      Application.find({ job: job._id })
        .select("_id student status appliedAt createdAt updatedAt")
        .populate("student", "fullName avatar")
        .sort({ appliedAt: -1, createdAt: -1 })
        .lean(),
      clientId
        ? ClientProfile.findOne({ user: clientId }).select(
            "location bio companyName website"
          )
        : null,
      clientId
        ? Verification.findOne({ user: clientId, type: "client" }).select(
            "status verifiedAt approvedAt companyName"
          )
        : null,
      clientId ? getClientStatsMap([clientId]) : new Map(),
    ]);

  const clientDetails = buildDetailedAdminJobClient({
    client: job.client,
    clientProfile,
    verification,
    clientStats: clientId ? clientStatsMap.get(clientId.toString()) : null,
  });

  return buildAdminJobDetails(job, applications, clientDetails);
};

const suspendAdminJobData = async ({
  jobId,
  adminUserId,
  moderationReason,
  customModerationReason = "",
}) => {
  const reason = moderationReason.trim();
  const customReason = customModerationReason.trim();

  if (!isValidJobModerationReason(reason)) {
    return {
      error: "INVALID_REASON",
      message: "Please select a valid moderation reason",
    };
  }

  if (reason === "Other" && !customReason) {
    return {
      error: "CUSTOM_REASON_REQUIRED",
      message: "Custom moderation reason is required when Other is selected",
    };
  }

  const job = await Job.findById(jobId).select(
    "_id status moderatedBy moderatedAt moderationReason customModerationReason"
  );

  if (!job) return null;

  if (job.status !== "open") {
    return {
      error: "NOT_OPEN",
      message: "Only open jobs can be suspended",
    };
  }

  job.status = "suspended";
  job.moderatedBy = adminUserId;
  job.moderatedAt = new Date();
  job.moderationReason = reason;
  job.customModerationReason = reason === "Other" ? customReason : "";

  await job.save();

  return getAdminJobDetailsData(job._id);
};

const updateAdminUserAccountStatus = async (
  userId,
  accountStatus,
  adminUserId,
  suspensionReason = ""
) => {
  const user = await User.findOne({
    _id: userId,
    role: { $in: ["student", "client"] },
  }).select("_id accountStatus suspendedAt suspendedBy suspensionReason role");

  if (!user) return null;

  user.accountStatus = accountStatus;

  if (accountStatus === "suspended") {
    user.suspendedAt = new Date();
    user.suspendedBy = adminUserId;
    user.suspensionReason = suspensionReason;
  } else {
    user.suspendedAt = undefined;
    user.suspendedBy = undefined;
    user.suspensionReason = "";
  }

  await user.save();

  return getAdminUserDetailsData(user._id);
};

const getPlatformSettingsData = async () => {
  const settings = await PlatformSettings.findOneAndUpdate(
    { key: "platform" },
    {
      $setOnInsert: {
        key: "platform",
        platformName: DEFAULT_PLATFORM_NAME,
        supportEmail: DEFAULT_SUPPORT_EMAIL,
        platformDescription: DEFAULT_PLATFORM_DESCRIPTION,
        logoUrl: "",
        maintenanceMode: false,
        maintenanceMessage: DEFAULT_MAINTENANCE_MESSAGE,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  )
    .populate("updatedBy", "fullName email role")
    .lean();

  const platformName = settings.platformName || DEFAULT_PLATFORM_NAME;
  const maintenanceMessage =
    settings.maintenanceMessage &&
    settings.maintenanceMessage !== DEFAULT_MAINTENANCE_MESSAGE
      ? settings.maintenanceMessage
      : getDefaultMaintenanceMessage(platformName);

  return {
    platformName,
    supportEmail: settings.supportEmail || DEFAULT_SUPPORT_EMAIL,
    platformDescription:
      settings.platformDescription || DEFAULT_PLATFORM_DESCRIPTION,
    logoUrl: settings.logoUrl || "",
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage,
    updatedBy: settings.updatedBy
      ? {
          id: settings.updatedBy._id?.toString?.() || "",
          name: settings.updatedBy.fullName || "Unknown Admin",
          email: settings.updatedBy.email || "",
        }
      : null,
    updatedAt: settings.updatedAt || null,
  };
};

const updateGeneralSettingsData = async ({
  platformName,
  supportEmail,
  platformDescription,
  adminUserId,
}) => {
  await PlatformSettings.findOneAndUpdate(
    { key: "platform" },
    {
      $set: {
        platformName,
        supportEmail,
        platformDescription,
        updatedBy: adminUserId,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        key: "platform",
        maintenanceMode: false,
        maintenanceMessage: DEFAULT_MAINTENANCE_MESSAGE,
        logoUrl: "",
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return getPlatformSettingsData();
};

const updateMaintenanceSettingsData = async ({
  maintenanceMode,
  maintenanceMessage,
  adminUserId,
}) => {
  const currentSettings = await getPlatformSettingsData();
  const message =
    maintenanceMessage.trim() ||
    getDefaultMaintenanceMessage(currentSettings.platformName);

  await PlatformSettings.findOneAndUpdate(
    { key: "platform" },
    {
      $set: {
        maintenanceMode,
        maintenanceMessage: message,
        updatedBy: adminUserId,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        key: "platform",
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return getPlatformSettingsData();
};

export {
  JOB_MODERATION_REASONS,
  getAdminDashboardSummaryData,
  getAdminJobDetailsData,
  getAdminJobsData,
  getPlatformSettingsData,
  getAdminUserDetailsData,
  getAdminUsersData,
  suspendAdminJobData,
  updateGeneralSettingsData,
  updateMaintenanceSettingsData,
  updateAdminUserAccountStatus,
};

export default createAdmin;
