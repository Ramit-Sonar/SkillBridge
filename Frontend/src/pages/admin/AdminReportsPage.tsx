import { useCallback, useEffect, useMemo, useState } from "react";
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
import { FileAttachmentCard } from "../../app/components/shared/FileAttachmentCard";
import {
  FilterChipGroup,
  Notification,
  SearchInput,
  StatusBadge,
  type NotificationMessage,
} from "../../app/components/shared/ui";
import {
  dismissReport,
  getReportById,
  getReports,
  resolveReport,
  type ReportStatus,
  type UserReport,
} from "../../services/reportService";
import { getUserDetails, type PlatformUser } from "../../services/userManagementService";
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
  if (role === "student") return "Student";
  if (role === "client") return "Client";

  return "User";
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
  user: {
    label: "User",
    color: "#64748B",
    bg: "#F8FAFC",
    border: "#CBD5E1",
    icon: User,
  },
};

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

function formatReportDate(date?: string | null) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ReportDetailsModal({
  report,
  actionLoading,
  onClose,
  onViewReportedUser,
  onResolve,
  onDismiss,
}: {
  report: UserReport;
  actionLoading: "resolve" | "dismiss" | null;
  onClose: () => void;
  onViewReportedUser: () => void;
  onResolve: () => void;
  onDismiss: () => void;
}) {
  const cfg = REPORT_STATUS_CFG[report.status];
  const canUpdateStatus = report.status === "pending" && !actionLoading;

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
                {formatReportDate(report.submittedAt)}
              </p>
            </DetailBlock>
            {report.handledBy && (
              <DetailBlock label="Handled By">
                <p className="text-slate-900 font-semibold" style={{ fontSize: "0.78rem" }}>
                  {report.handledBy.fullName}
                </p>
              </DetailBlock>
            )}
            {report.resolvedAt && (
              <DetailBlock label="Resolved Date">
                <p className="text-slate-900 font-semibold" style={{ fontSize: "0.78rem" }}>
                  {formatReportDate(report.resolvedAt)}
                </p>
              </DetailBlock>
            )}
            {report.dismissedAt && (
              <DetailBlock label="Dismissed Date">
                <p className="text-slate-900 font-semibold" style={{ fontSize: "0.78rem" }}>
                  {formatReportDate(report.dismissedAt)}
                </p>
              </DetailBlock>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-black/[0.06] p-4">
            <p className="text-slate-900 font-bold" style={{ fontSize: "0.82rem" }}>
              Description
            </p>
            <p className="text-slate-600 leading-relaxed mt-2" style={{ fontSize: "0.8rem" }}>
              {report.description}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-black/[0.06] p-4">
            <p className="text-slate-900 font-bold" style={{ fontSize: "0.82rem" }}>
              Evidence
            </p>
            {report.attachments && report.attachments.length > 0 ? (
              <div className="flex flex-col gap-2 mt-3">
                {report.attachments.map((attachment) => (
                  <FileAttachmentCard
                    key={`${attachment.originalName}-${attachment.url}`}
                    attachment={attachment}
                  />
                ))}
              </div>
            ) : (
              <p className="text-slate-400 mt-2" style={{ fontSize: "0.78rem" }}>
                No evidence was attached.
              </p>
            )}
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
            disabled={!canUpdateStatus}
            onClick={onResolve}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
            style={{ fontSize: "0.82rem" }}
          >
            <CheckCircle className="w-4 h-4" />{" "}
            {actionLoading === "resolve" ? "Resolving..." : "Resolve"}
          </button>
          <button
            type="button"
            disabled={!canUpdateStatus}
            onClick={onDismiss}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-60"
            style={{ fontSize: "0.82rem" }}
          >
            <XCircle className="w-4 h-4" />{" "}
            {actionLoading === "dismiss" ? "Dismissing..." : "Dismiss"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminReportsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [reports, setReports] = useState<UserReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [profileUser, setProfileUser] = useState<PlatformUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<NotificationMessage>(null);
  const [reportAction, setReportAction] = useState<"resolve" | "dismiss" | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getReports();
      setReports(response.data.reports);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Reports could not be loaded.");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

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

  const handleViewReport = async (reportId: string) => {
    try {
      const response = await getReportById(reportId);
      setSelectedReport(response.data);
      setProfileUser(null);
    } catch (viewError) {
      setNotification({
        type: "error",
        text:
          viewError instanceof Error ? viewError.message : "Report details could not be loaded.",
      });
    }
  };

  const handleViewReportedUser = async () => {
    if (!selectedReport) return;

    try {
      const response = await getUserDetails(selectedReport.reportedUserId);
      setProfileUser(response.data);
    } catch (profileError) {
      setNotification({
        type: "error",
        text:
          profileError instanceof Error
            ? profileError.message
            : "User profile could not be loaded.",
      });
    }
  };

  const updateReportInState = (updatedReport: UserReport) => {
    setReports((currentReports) =>
      currentReports.map((report) => (report.id === updatedReport.id ? updatedReport : report))
    );
    setSelectedReport(updatedReport);
  };

  const handleResolveReport = async () => {
    if (!selectedReport || reportAction) return;

    setReportAction("resolve");

    try {
      const response = await resolveReport(selectedReport.id);
      updateReportInState(response.data);
      setNotification({ type: "success", text: response.message });
    } catch (resolveError) {
      setNotification({
        type: "error",
        text:
          resolveError instanceof Error ? resolveError.message : "Report could not be resolved.",
      });
    } finally {
      setReportAction(null);
    }
  };

  const handleDismissReport = async () => {
    if (!selectedReport || reportAction) return;

    setReportAction("dismiss");

    try {
      const response = await dismissReport(selectedReport.id);
      updateReportInState(response.data);
      setNotification({ type: "success", text: response.message });
    } catch (dismissError) {
      setNotification({
        type: "error",
        text:
          dismissError instanceof Error ? dismissError.message : "Report could not be dismissed.",
      });
    } finally {
      setReportAction(null);
    }
  };

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

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <motion.span
              className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-red-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-slate-400" style={{ fontSize: "0.82rem" }}>
              Loading reports...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
              <Flag className="w-9 h-9 text-slate-300" />
            </div>
            <div>
              <p className="text-slate-900 font-bold" style={{ fontSize: "1rem" }}>
                {error}
              </p>
              <p className="text-slate-500 mt-1" style={{ fontSize: "0.85rem" }}>
                Please try again later.
              </p>
            </div>
          </div>
        ) : filteredReports.length === 0 ? (
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
                  onView={() => handleViewReport(report.id)}
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
            actionLoading={reportAction}
            onClose={() => setSelectedReport(null)}
            onViewReportedUser={handleViewReportedUser}
            onResolve={handleResolveReport}
            onDismiss={handleDismissReport}
          />
        )}

        {profileUser && (
          <AdminUserProfileModal
            user={profileUser}
            onUserUpdated={setProfileUser}
            onClose={() => {
              setProfileUser(null);
            }}
          />
        )}
      </AnimatePresence>
      <Notification message={notification} onClose={() => setNotification(null)} />
    </DashboardLayout>
  );
}
