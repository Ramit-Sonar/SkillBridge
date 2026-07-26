import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Ban, ChevronDown, UserCheck, X } from "lucide-react";
import { ClientInformationCard } from "../../app/components/shared/ClientInformationCard";
import { StudentProfileView } from "../../app/components/shared/StudentProfileView";
import { buildStudentProfileViewProps } from "../../app/components/shared/studentProfileBuilder";
import {
  ConfirmDialog,
  Notification,
  StatusBadge,
  type NotificationMessage,
  type StatusBadgeConfig,
} from "../../app/components/shared/ui";
import {
  activateUser,
  suspendUser,
  type PlatformUser,
  type UserStatus,
  type VerificationStatus,
} from "../../services/adminService";

const ACCOUNT_STATUS_CFG: Record<UserStatus, StatusBadgeConfig> = {
  active: {
    label: "Active",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    dot: "#10B981",
  },
  suspended: {
    label: "Suspended",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
    dot: "#EF4444",
  },
};

const VERIFICATION_STATUS_CFG: Record<VerificationStatus, StatusBadgeConfig> = {
  pending: {
    label: "Pending",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    dot: "#F59E0B",
  },
  approved: {
    label: "Verified",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    dot: "#2563EB",
  },
  rejected: {
    label: "Rejected",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
    dot: "#EF4444",
  },
};

const USER_SUSPENSION_REASONS = [
  "Spam",
  "Fake Job",
  "Duplicate Listing",
  "Policy Violation",
  "Copyright Issue",
  "Other",
] as const;

type UserSuspensionReason = (typeof USER_SUSPENSION_REASONS)[number];

function formatAdminDate(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildAdminStudentProfile(user: PlatformUser) {
  return buildStudentProfileViewProps({
    user: {
      fullName: user.name,
      avatar: user.avatar,
    },
    profile: {
      id: user.id,
      fullName: user.name,
      initials: user.initials,
      avatar: user.avatar,
      headline: user.headline,
      bio: user.bio,
      education: user.education,
      university: user.university,
      skills: user.skills ?? [],
      verification: {
        status: user.verificationStatus,
        verifiedAt: user.verificationStatus === "approved" ? user.joinedAt : null,
      },
      github: user.github,
      linkedin: user.linkedin,
      portfolio: user.portfolio,
      statistics: user.ratingSummary
        ? {
            ...user.ratingSummary,
            completedProjectsCount: user.projectCount,
          }
        : {
            averageRating: 0,
            reviewCount: 0,
            ratingDistribution: {
              1: 0,
              2: 0,
              3: 0,
              4: 0,
              5: 0,
            },
            completedProjectsCount: user.projectCount,
          },
      completedProjects: user.completedProjects ?? [],
      latestReviews: user.latestReviews ?? [],
    },
    verified: user.verificationStatus === "approved",
    completedProjects: user.completedProjects ?? [],
    reviews: user.latestReviews ?? [],
  });
}

function AdminMetric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 rounded-xl border border-black/[0.04] p-3">
      <p className="text-slate-400 font-semibold" style={{ fontSize: "0.62rem" }}>
        {label}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function SuspendUserModal({
  user,
  onConfirm,
  onClose,
  loading,
}: {
  user: PlatformUser;
  onConfirm: (reason: string) => Promise<void> | void;
  onClose: () => void;
  loading?: boolean;
}) {
  const [reason, setReason] = useState<UserSuspensionReason | "">("");
  const [customReason, setCustomReason] = useState("");
  const [error, setError] = useState("");
  const requiresCustomReason = reason === "Other";

  const handleConfirm = async () => {
    if (!reason) {
      setError("Please select a suspension reason.");
      return;
    }

    if (requiresCustomReason && !customReason.trim()) {
      setError("Please enter the custom suspension reason.");
      return;
    }

    setError("");
    await onConfirm(requiresCustomReason ? customReason.trim() : reason);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-5"
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-red-50">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <p className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
            Suspend User
          </p>
          <p className="text-slate-500 mt-1.5 leading-relaxed" style={{ fontSize: "0.82rem" }}>
            Select why you want to suspend <strong className="text-slate-900">{user.name}</strong>.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-slate-700 font-semibold" style={{ fontSize: "0.78rem" }}>
            Suspension Reason
          </label>
          <div className="relative">
            <select
              value={reason}
              onChange={(event) => {
                setReason(event.target.value as UserSuspensionReason);
                setError("");
              }}
              disabled={loading}
              className="w-full appearance-none bg-white border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-slate-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/10 disabled:opacity-60"
              style={{ fontSize: "0.85rem" }}
            >
              <option value="">Select reason</option>
              {USER_SUSPENSION_REASONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {requiresCustomReason && (
            <textarea
              value={customReason}
              onChange={(event) => {
                setCustomReason(event.target.value);
                setError("");
              }}
              disabled={loading}
              rows={4}
              placeholder="Enter custom suspension reason..."
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-300 outline-none resize-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/10 disabled:opacity-60"
              style={{ fontSize: "0.85rem" }}
            />
          )}

          {error && (
            <p className="text-red-600 font-semibold" style={{ fontSize: "0.74rem" }}>
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-semibold hover:text-slate-900 transition-all disabled:opacity-60"
            style={{ fontSize: "0.875rem" }}
          >
            Cancel
          </button>
          <motion.button
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.97 } : {}}
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            style={{ fontSize: "0.875rem" }}
          >
            {loading ? (
              <motion.span
                className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              "Suspend User"
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AdminInformation({ user }: { user: PlatformUser }) {
  return (
    <section className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5 flex flex-col gap-4">
      <div>
        <h3 className="text-slate-900 font-bold" style={{ fontSize: "0.9rem" }}>
          Admin Information
        </h3>
        <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.7rem" }}>
          Internal account review data for administrators.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <AdminMetric label="Account Status">
          <StatusBadge config={ACCOUNT_STATUS_CFG[user.status]} />
        </AdminMetric>
        <AdminMetric label="Verification Status">
          <StatusBadge config={VERIFICATION_STATUS_CFG[user.verificationStatus]} />
        </AdminMetric>
        <AdminMetric label="Reports Received">
          <p className="text-slate-900 font-bold" style={{ fontSize: "0.82rem" }}>
            {user.reportsReceived}
          </p>
        </AdminMetric>
        <AdminMetric label="Pending Reports">
          <p className="text-slate-900 font-bold" style={{ fontSize: "0.82rem" }}>
            {user.pendingReports}
          </p>
        </AdminMetric>
        <AdminMetric label="Joined Date">
          <p className="text-slate-900 font-semibold" style={{ fontSize: "0.78rem" }}>
            {formatAdminDate(user.joinedAt)}
          </p>
        </AdminMetric>
        <AdminMetric label="Suspended By">
          <p className="text-slate-900 font-semibold" style={{ fontSize: "0.78rem" }}>
            {user.suspendedBy?.name || "Not applicable"}
          </p>
        </AdminMetric>
        <AdminMetric label="Suspended At">
          <p className="text-slate-900 font-semibold" style={{ fontSize: "0.78rem" }}>
            {formatAdminDate(user.suspendedAt || undefined)}
          </p>
        </AdminMetric>
      </div>

      {user.status === "suspended" && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-red-400 font-semibold" style={{ fontSize: "0.68rem" }}>
            Suspension Reason
          </p>
          <p className="text-red-700 mt-1 leading-relaxed" style={{ fontSize: "0.8rem" }}>
            {user.suspensionReason || "No reason was provided."}
          </p>
        </div>
      )}
    </section>
  );
}

export function AdminUserProfileModal({
  user,
  onClose,
  onUserUpdated,
  readOnly = false,
}: {
  user: PlatformUser;
  onClose: () => void;
  onUserUpdated?: (user: PlatformUser) => void;
  readOnly?: boolean;
}) {
  const isStudent = user.role === "student";
  const [notification, setNotification] = useState<NotificationMessage>(null);
  const [confirmAction, setConfirmAction] = useState<"suspend" | "activate" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const isActive = user.status === "active";

  const handleUserUpdated = (updatedUser: PlatformUser) => {
    onUserUpdated?.(updatedUser);
  };

  const handleAccountStatusChange = async (
    action: "suspend" | "activate",
    suspensionReason = ""
  ) => {
    setActionLoading(true);

    try {
      const response =
        action === "suspend"
          ? await suspendUser(user.id, suspensionReason)
          : await activateUser(user.id);

      handleUserUpdated(response.data);
      setNotification({ type: "success", text: response.message });
      setConfirmAction(null);
    } catch (error) {
      setNotification({
        type: "error",
        text: error instanceof Error ? error.message : "User status could not be updated.",
      });
    } finally {
      setActionLoading(false);
    }
  };

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
        className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-profile-title"
      >
        <div className="bg-white border-b border-black/[0.05] px-5 py-4 flex items-start justify-between gap-3 shrink-0">
          <div>
            <p
              id="admin-user-profile-title"
              className="text-slate-900 font-bold"
              style={{ fontSize: "0.95rem" }}
            >
              User Details
            </p>
            <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.72rem" }}>
              {user.name} - {isStudent ? "Student" : "Client"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
            aria-label="Close user details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="w-full flex flex-col gap-4">
            {isStudent ? (
              <StudentProfileView profile={buildAdminStudentProfile(user)} />
            ) : (
              <ClientInformationCard
                client={{
                  id: user.id,
                  fullName: user.name,
                  avatar: user.avatar,
                  location: user.location,
                  joined: user.joinedAt,
                  companyName: user.companyName,
                  website: user.website,
                  bio: user.bio,
                  verification: {
                    status: user.verificationStatus === "approved" ? "approved" : null,
                  },
                  statistics: {
                    jobsPosted: user.jobsPosted,
                    projectsCompleted: user.projectsCompleted,
                    activeProjects: user.activeProjects,
                  },
                }}
              />
            )}

            <AdminInformation user={user} />
          </div>
        </div>

        {!readOnly && (
          <div className="p-4 border-t border-black/[0.05] bg-white flex gap-3 shrink-0">
            {isActive ? (
              <button
                type="button"
                onClick={() => setConfirmAction("suspend")}
                className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 font-semibold py-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                style={{ fontSize: "0.875rem" }}
              >
                <Ban className="w-4 h-4" /> Suspend User
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmAction("activate")}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                style={{ fontSize: "0.875rem" }}
              >
                <UserCheck className="w-4 h-4" /> Activate User
              </button>
            )}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {!readOnly && confirmAction === "suspend" && (
          <SuspendUserModal
            user={user}
            onConfirm={(reason) => handleAccountStatusChange("suspend", reason)}
            onClose={() => {
              if (!actionLoading) setConfirmAction(null);
            }}
            loading={actionLoading}
          />
        )}

        {!readOnly && confirmAction === "activate" && (
          <ConfirmDialog
            title="Activate User"
            body={
              <>
                Are you sure you want to activate{" "}
                <strong className="text-slate-900">{user.name}</strong>?
              </>
            }
            confirmLabel="Activate User"
            confirmColor="#059669"
            onConfirm={() => handleAccountStatusChange("activate")}
            onClose={() => {
              if (!actionLoading) setConfirmAction(null);
            }}
            loading={actionLoading}
            icon={UserCheck}
            iconBg="#ECFDF5"
            iconColor="#059669"
            busyDelayMs={0}
          />
        )}
      </AnimatePresence>
      <Notification message={notification} onClose={() => setNotification(null)} />
    </motion.div>
  );
}
