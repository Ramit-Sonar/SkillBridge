import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Calendar, CheckCircle, Eye, Flag, User, X, XCircle } from "lucide-react";
import { DashboardLayout } from "../../app/components/layout/DashboardLayout";
import { FilterChipGroup, SearchInput, StatusBadge } from "../../app/components/shared/ui";
import { USER_REPORTS, type ReportStatus, type UserReport } from "../../app/data/admin";

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

function ReportCard({
  report,
  onView,
  onResolve,
  onDismiss,
}: {
  report: UserReport;
  onView: () => void;
  onResolve: () => void;
  onDismiss: () => void;
}) {
  const cfg = REPORT_STATUS_CFG[report.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.07)" }}
      className="bg-white rounded-2xl border border-black/[0.06] shadow-sm hover:border-blue-200 p-5 flex flex-col gap-4 transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden"
            style={{ fontSize: "0.65rem" }}
          >
            {report.reporterAvatar ? (
              <img
                src={report.reporterAvatar}
                alt={report.reporterName}
                className="w-full h-full object-cover"
              />
            ) : (
              report.reporterInitials
            )}
          </div>
          <div className="min-w-0">
            <p className="text-slate-900 font-bold truncate" style={{ fontSize: "0.875rem" }}>
              {report.reporterName}
            </p>
            <p className="text-slate-500" style={{ fontSize: "0.72rem" }}>
              Reporter
            </p>
          </div>
        </div>
        <StatusBadge config={cfg} style={{ fontSize: "0.6rem" }} />
      </div>

      <div className="grid gap-3">
        <div className="bg-slate-50 rounded-xl border border-black/[0.04] p-3">
          <p className="text-slate-400 font-semibold" style={{ fontSize: "0.62rem" }}>
            Reported User
          </p>
          <p className="text-slate-900 font-semibold mt-0.5" style={{ fontSize: "0.78rem" }}>
            {report.reportedUserName}
          </p>
          <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.68rem" }}>
            {getRoleLabel(report.reportedUserRole)}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 font-semibold px-2.5 py-1 rounded-lg"
            style={{ fontSize: "0.68rem" }}
          >
            <Flag className="w-3 h-3" /> {report.reason}
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span style={{ fontSize: "0.72rem" }}>{report.submittedAt}</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <button
          type="button"
          onClick={onView}
          className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 text-blue-600 font-semibold py-2 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors"
          style={{ fontSize: "0.75rem" }}
        >
          <Eye className="w-3.5 h-3.5" /> View Details
        </button>
        <button
          type="button"
          onClick={onResolve}
          disabled={report.status === "resolved"}
          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-600 font-semibold py-2 rounded-xl border border-emerald-300 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-emerald-50 disabled:hover:text-emerald-600"
          style={{ fontSize: "0.75rem" }}
        >
          <CheckCircle className="w-3.5 h-3.5" /> Resolve
        </button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={report.status === "dismissed"}
          className="flex-1 flex items-center justify-center gap-1.5 bg-slate-50 text-slate-500 font-semibold py-2 rounded-xl border border-slate-200 hover:bg-slate-600 hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:text-slate-500"
          style={{ fontSize: "0.75rem" }}
        >
          <XCircle className="w-3.5 h-3.5" /> Dismiss
        </button>
      </div>
    </motion.div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl border border-black/[0.04] p-3">
      <p className="text-slate-400 font-semibold" style={{ fontSize: "0.62rem" }}>
        {label}
      </p>
      <p className="text-slate-900 font-semibold mt-0.5" style={{ fontSize: "0.78rem" }}>
        {value}
      </p>
    </div>
  );
}

function ReportDetailsModal({
  report,
  onClose,
  onResolve,
  onDismiss,
}: {
  report: UserReport;
  onClose: () => void;
  onResolve: () => void;
  onDismiss: () => void;
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
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-details-title"
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 shrink-0 border-b border-black/[0.05]">
          <div>
            <h3
              id="report-details-title"
              className="text-slate-900 font-bold"
              style={{ fontSize: "1rem" }}
            >
              Report Details
            </h3>
            <p className="text-slate-500 mt-1.5" style={{ fontSize: "0.82rem" }}>
              Review the report before choosing an admin action.
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

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <DetailRow label="Reporter" value={report.reporterName} />
            <DetailRow
              label="Reported User"
              value={`${report.reportedUserName} (${getRoleLabel(report.reportedUserRole)})`}
            />
            <DetailRow label="Reason" value={report.reason} />
            <DetailRow label="Submitted Date" value={report.submittedAt} />
          </div>

          <div className="bg-slate-50 rounded-xl border border-black/[0.04] p-3">
            <p className="text-slate-400 font-semibold" style={{ fontSize: "0.62rem" }}>
              Current Status
            </p>
            <StatusBadge
              config={cfg}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold mt-2"
            />
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

        <div className="flex flex-col sm:flex-row gap-3 px-6 py-4 shrink-0 border-t border-black/[0.05]">
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-blue-200 text-blue-600 font-semibold hover:bg-blue-50 transition-colors"
            style={{ fontSize: "0.85rem" }}
          >
            <User className="w-4 h-4" /> View Reported User
          </button>
          <button
            type="button"
            onClick={onResolve}
            disabled={report.status === "resolved"}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
            style={{ fontSize: "0.85rem" }}
          >
            <CheckCircle className="w-4 h-4" /> Resolve
          </button>
          <button
            type="button"
            onClick={onDismiss}
            disabled={report.status === "dismissed"}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
            style={{ fontSize: "0.85rem" }}
          >
            <XCircle className="w-4 h-4" /> Dismiss
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState(USER_REPORTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const selectedReport = reports.find((report) => report.id === selectedReportId) ?? null;

  const updateStatus = (id: string, status: ReportStatus) => {
    setReports((current) =>
      current.map((report) => (report.id === id ? { ...report, status } : report))
    );
  };

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
              Review user-submitted reports and mark each case as resolved or dismissed.
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
                  onResolve={() => updateStatus(report.id, "resolved")}
                  onDismiss={() => updateStatus(report.id, "dismissed")}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedReport && (
          <ReportDetailsModal
            report={selectedReport}
            onClose={() => setSelectedReportId(null)}
            onResolve={() => updateStatus(selectedReport.id, "resolved")}
            onDismiss={() => updateStatus(selectedReport.id, "dismissed")}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
