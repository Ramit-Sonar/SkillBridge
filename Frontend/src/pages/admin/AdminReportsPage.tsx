import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Briefcase,
  Calendar,
  CheckCircle,
  Eye,
  Flag,
  GraduationCap,
  User,
  X,
  XCircle,
} from "lucide-react";
import { DashboardLayout } from "../../app/components/layout/DashboardLayout";
import { FilterChipGroup, SearchInput, StatusBadge } from "../../app/components/shared/ui";
import {
  CLIENT_KYC_REQUESTS,
  PLATFORM_USERS,
  USER_REPORTS,
  VERIFICATION_REQUESTS,
  type PlatformUser,
  type ReportStatus,
  type UserReport,
} from "../../app/data/admin";
import { AdminUserProfileModal } from "./AdminUserProfileModal";

const REPORT_STATUS_CFG: Record<
  ReportStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  pending: {
    label: "Pending",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    dot: "#F59E0B",
  },
  resolved: {
    label: "Resolved",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    dot: "#10B981",
  },
  dismissed: {
    label: "Dismissed",
    color: "#64748B",
    bg: "#F8FAFC",
    border: "#CBD5E1",
    dot: "#94A3B8",
  },
};

function getRoleLabel(role: UserReport["reportedUserRole"]) {
  return role === "student" ? "Student" : "Client";
}

const ROLE_CFG = {
  student: {
    label: "Student",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    icon: GraduationCap,
  },
  client: {
    label: "Client",
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    icon: Briefcase,
  },
};

function getReportedUser(report: UserReport): PlatformUser {
  const matchedUser = PLATFORM_USERS.find(
    (user) => user.id === report.reportedUserId || user.name === report.reportedUserName
  );
  const matchedStudentVerification = VERIFICATION_REQUESTS.find(
    (student) => student.id === report.reportedUserId || student.name === report.reportedUserName
  );
  const matchedClientVerification = CLIENT_KYC_REQUESTS.find(
    (client) => client.id === report.reportedUserId || client.name === report.reportedUserName
  );

  if (matchedUser) return matchedUser;

  if (report.reportedUserRole === "student") {
    return {
      id: report.reportedUserId,
      name: report.reportedUserName,
      initials: report.reportedUserName
        .split(" ")
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      email: "student.profile@skillbridge.local",
      role: "student",
      status: "active",
      verificationStatus: matchedStudentVerification?.status ?? "pending",
      joinedAt: "18 Apr 2026",
      projectCount: 2,
      reportsReceived: 1,
      pendingReports: report.status === "pending" ? 1 : 0,
      location: "Kathmandu, Nepal",
      headline: "Student freelancer building practical project experience",
      education: "Bachelor in Computer Science",
      university: "Kathmandu University",
      bio: "This student profile is dummy admin data prepared for report investigation screens.",
      skills: [
        { name: "React", verified: true },
        { name: "Documentation", verified: false },
        { name: "Communication", verified: true },
      ],
    };
  }

  return {
    id: report.reportedUserId,
    name: report.reportedUserName,
    initials: report.reportedUserName
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    email: "client.profile@skillbridge.local",
    role: "client",
    status: "active",
    verificationStatus: matchedClientVerification?.status ?? "pending",
    joinedAt: "9 May 2026",
    projectCount: 3,
    reportsReceived: 1,
    pendingReports: report.status === "pending" ? 1 : 0,
    location: "Lalitpur, Nepal",
    companyName: "BrandWorks Studio",
    website: "brandworks.com.np",
    bio: "This client profile is dummy admin data prepared for report investigation screens.",
    jobsPosted: 5,
    projectsCompleted: 3,
  };
}

function ReportCard({ report, onView }: { report: UserReport; onView: () => void }) {
  const cfg = REPORT_STATUS_CFG[report.status];
  const roleCfg = ROLE_CFG[report.reportedUserRole];
  const RoleIcon = roleCfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}
      className="bg-white rounded-2xl border border-black/[0.06] shadow-sm hover:border-blue-200 p-4 flex flex-col gap-3 transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-slate-400 font-semibold" style={{ fontSize: "0.62rem" }}>
            Reporter
          </p>
          <p className="text-slate-900 font-bold truncate mt-0.5" style={{ fontSize: "0.86rem" }}>
            {report.reporterName}
          </p>
        </div>
        <StatusBadge config={cfg} style={{ fontSize: "0.58rem" }} />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-slate-400 font-semibold" style={{ fontSize: "0.62rem" }}>
              Reported User
            </p>
            <p className="text-slate-900 font-semibold truncate" style={{ fontSize: "0.78rem" }}>
              {report.reportedUserName}
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold shrink-0"
            style={{
              background: roleCfg.bg,
              color: roleCfg.color,
              borderColor: roleCfg.border,
              fontSize: "0.66rem",
            }}
          >
            <RoleIcon className="w-3 h-3" /> {roleCfg.label}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 font-semibold px-2.5 py-1 rounded-lg"
            style={{ fontSize: "0.66rem" }}
          >
            <Flag className="w-3 h-3" /> {report.reason}
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span style={{ fontSize: "0.7rem" }}>{report.submittedAt}</span>
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onView}
        className="w-full flex items-center justify-center gap-1.5 bg-blue-50 text-blue-600 font-semibold py-2 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors"
        style={{ fontSize: "0.75rem" }}
      >
        <Eye className="w-3.5 h-3.5" /> View Details
      </button>
    </motion.div>
  );
}

function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 rounded-xl border border-black/[0.04] p-3">
      <p className="text-slate-400 font-semibold" style={{ fontSize: "0.62rem" }}>
        {label}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function ReportDetailsModal({
  report,
  onClose,
  onViewReportedUser,
}: {
  report: UserReport;
  onClose: () => void;
  onViewReportedUser: () => void;
}) {
  const cfg = REPORT_STATUS_CFG[report.status];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-details-title"
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 shrink-0 border-b border-black/[0.05]">
          <div>
            <h3
              id="report-details-title"
              className="text-slate-900 font-bold"
              style={{ fontSize: "0.98rem" }}
            >
              Report Details
            </h3>
            <p className="text-slate-500 mt-1" style={{ fontSize: "0.78rem" }}>
              Investigation summary for admin review.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50"
            aria-label="Close report details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <DetailBlock label="Reporter Information">
              <p className="text-slate-900 font-semibold" style={{ fontSize: "0.78rem" }}>
                {report.reporterName}
              </p>
              <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.68rem" }}>
                {getRoleLabel(report.reporterRole)}
              </p>
            </DetailBlock>
            <DetailBlock label="Reported User">
              <p className="text-slate-900 font-semibold" style={{ fontSize: "0.78rem" }}>
                {report.reportedUserName}
              </p>
              <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.68rem" }}>
                {getRoleLabel(report.reportedUserRole)}
              </p>
            </DetailBlock>
            <DetailBlock label="Reason">
              <p className="text-red-600 font-semibold" style={{ fontSize: "0.78rem" }}>
                {report.reason}
              </p>
            </DetailBlock>
            <DetailBlock label="Status">
              <StatusBadge config={cfg} />
            </DetailBlock>
            <DetailBlock label="Submitted Date">
              <p className="text-slate-900 font-semibold" style={{ fontSize: "0.78rem" }}>
                {report.submittedAt}
              </p>
            </DetailBlock>
          </div>

          <div className="bg-white rounded-2xl border border-black/[0.06] p-4">
            <p className="text-slate-900 font-bold" style={{ fontSize: "0.82rem" }}>
              Description
            </p>
            <p className="text-slate-600 leading-relaxed mt-2" style={{ fontSize: "0.8rem" }}>
              {report.description}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 px-5 py-4 shrink-0 border-t border-black/[0.05]">
          <button
            type="button"
            onClick={onViewReportedUser}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-blue-200 text-blue-600 font-semibold hover:bg-blue-50 transition-colors"
            style={{ fontSize: "0.82rem" }}
          >
            <User className="w-4 h-4" /> View Reported User
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
            style={{ fontSize: "0.82rem" }}
          >
            <CheckCircle className="w-4 h-4" /> Resolve
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors"
            style={{ fontSize: "0.82rem" }}
          >
            <XCircle className="w-4 h-4" /> Dismiss
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminReportsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<PlatformUser | null>(null);
  const reports = USER_REPORTS;
  const selectedReport = reports.find((report) => report.id === selectedReportId) ?? null;

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesSearch =
        !q ||
        report.reporterName.toLowerCase().includes(q) ||
        report.reportedUserName.toLowerCase().includes(q) ||
        report.reason.toLowerCase().includes(q);

      return matchesSearch && (statusFilter === "all" || report.status === statusFilter);
    });
  }, [reports, search, statusFilter]);

  return (
    <DashboardLayout role="admin" title="Reports" activeNav="reports">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-slate-900" style={{ fontSize: "1.05rem", fontWeight: 800 }}>
              User Reports
            </h2>
            <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
              Review user-submitted reports for investigation.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
            <Flag className="w-3.5 h-3.5 text-red-600" />
            <span className="text-red-600 font-semibold" style={{ fontSize: "0.78rem" }}>
              {reports.length} reports
            </span>
          </div>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by reporter, reported user, or reason..."
        />

        <FilterChipGroup
          items={[
            { label: "All", value: "all", count: reports.length },
            {
              label: "Pending",
              value: "pending",
              count: reports.filter((report) => report.status === "pending").length,
              config: REPORT_STATUS_CFG.pending,
            },
            {
              label: "Resolved",
              value: "resolved",
              count: reports.filter((report) => report.status === "resolved").length,
              config: REPORT_STATUS_CFG.resolved,
            },
            {
              label: "Dismissed",
              value: "dismissed",
              count: reports.filter((report) => report.status === "dismissed").length,
              config: REPORT_STATUS_CFG.dismissed,
            },
          ]}
          activeValue={statusFilter}
          onChange={setStatusFilter}
          showZeroCounts={true}
        />

        {filteredReports.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
              <Flag className="w-9 h-9 text-slate-300" />
            </div>
            <div>
              <p className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
                No Reports Found
              </p>
              <p className="text-slate-500 mt-1" style={{ fontSize: "0.85rem" }}>
                Try adjusting your search or status filter.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onView={() => setSelectedReportId(report.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedReport && !profileUser && (
          <ReportDetailsModal
            report={selectedReport}
            onClose={() => setSelectedReportId(null)}
            onViewReportedUser={() => setProfileUser(getReportedUser(selectedReport))}
          />
        )}

        {profileUser && (
          <AdminUserProfileModal
            user={profileUser}
            onClose={() => {
              setProfileUser(null);
            }}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
