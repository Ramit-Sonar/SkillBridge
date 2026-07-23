import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Ban, UserCheck, X } from "lucide-react";
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
} from "../../services/userManagementService";

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

function AdminInformation({
  user,
  onUserUpdated,
  onNotify,
}: {
  user: PlatformUser;
  onUserUpdated: (user: PlatformUser) => void;
  onNotify: (message: NotificationMessage) => void;
}) {
  const [confirmAction, setConfirmAction] = useState<"suspend" | "activate" | null>(null);
  const isActive = user.status === "active";

  const handleAccountStatusChange = async (action: "suspend" | "activate") => {
    try {
      const response =
        action === "suspend" ? await suspendUser(user.id) : await activateUser(user.id);

      onUserUpdated(response.data);
      onNotify({ type: "success", text: response.message });
      setConfirmAction(null);
    } catch (error) {
      onNotify({
        type: "error",
        text: error instanceof Error ? error.message : "User status could not be updated.",
      });
    }
  };

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
            {user.joinedAt}
          </p>
        </AdminMetric>
      </div>

      {isActive ? (
        <button
          type="button"
          onClick={() => setConfirmAction("suspend")}
          className="w-full flex items-center justify-center gap-2 bg-white text-red-600 font-semibold py-2.5 rounded-xl border border-red-200 hover:bg-red-50 transition-colors"
          style={{ fontSize: "0.85rem" }}
        >
          <Ban className="w-4 h-4" /> Suspend User
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmAction("activate")}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
          style={{ fontSize: "0.85rem" }}
        >
          <UserCheck className="w-4 h-4" /> Activate User
        </button>
      )}

      <AnimatePresence>
        {confirmAction === "suspend" && (
          <ConfirmDialog
            title="Suspend User"
            body={
              <>
                Are you sure you want to suspend{" "}
                <strong className="text-slate-900">{user.name}</strong>?
              </>
            }
            confirmLabel="Suspend User"
            confirmColor="#DC2626"
            onConfirm={() => handleAccountStatusChange("suspend")}
            onClose={() => setConfirmAction(null)}
            icon={AlertTriangle}
            iconBg="#FEF2F2"
            iconColor="#EF4444"
            busyDelayMs={0}
          />
        )}

        {confirmAction === "activate" && (
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
            onClose={() => setConfirmAction(null)}
            icon={UserCheck}
            iconBg="#ECFDF5"
            iconColor="#059669"
            busyDelayMs={0}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

export function AdminUserProfileModal({
  user,
  onClose,
  onUserUpdated,
}: {
  user: PlatformUser;
  onClose: () => void;
  onUserUpdated?: (user: PlatformUser) => void;
}) {
  const isStudent = user.role === "student";
  const [notification, setNotification] = useState<NotificationMessage>(null);

  const handleUserUpdated = (updatedUser: PlatformUser) => {
    onUserUpdated?.(updatedUser);
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

            <AdminInformation
              user={user}
              onUserUpdated={handleUserUpdated}
              onNotify={setNotification}
            />
          </div>
        </div>
      </motion.div>
      <Notification message={notification} onClose={() => setNotification(null)} />
    </motion.div>
  );
}
