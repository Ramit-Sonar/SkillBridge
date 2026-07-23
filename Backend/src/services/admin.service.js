import { User } from "../models/user.model.js";
import { ClientProfile } from "../models/clientProfile.model.js";
import { Job } from "../models/job.model.js";
import { Project } from "../models/project.model.js";
import { Report } from "../models/report.model.js";
import { StudentProfile } from "../models/studentProfile.model.js";
import { Verification } from "../models/verification.model.js";
import { getStudentCompletedProjectProfileMap } from "./project.service.js";
import { getStudentReviewProfileMap } from "./review.service.js";

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
      "_id fullName email role avatar profileCompleted accountStatus createdAt"
    )
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
      "_id fullName email role avatar profileCompleted accountStatus createdAt"
    )
    .lean();

  if (!user) return null;

  const [userSummary] = await buildAdminUserSummaries([user]);

  return userSummary;
};

const updateAdminUserAccountStatus = async (userId, accountStatus) => {
  const user = await User.findOne({
    _id: userId,
    role: { $in: ["student", "client"] },
  }).select("_id accountStatus role");

  if (!user) return null;

  user.accountStatus = accountStatus;
  await user.save();

  return getAdminUserDetailsData(user._id);
};

export {
  getAdminDashboardSummaryData,
  getAdminUserDetailsData,
  getAdminUsersData,
  updateAdminUserAccountStatus,
};

export default createAdmin;
