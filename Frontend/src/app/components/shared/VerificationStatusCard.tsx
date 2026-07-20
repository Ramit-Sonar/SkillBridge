import type { ElementType, ReactNode } from "react";
import { motion } from "motion/react";
import { CheckCircle, Clock, ShieldCheck, XCircle } from "lucide-react";
import { StatusBadge, type StatusBadgeConfig } from "./ui";

export type VerificationDatabaseStatus = "pending" | "approved" | "rejected";
export type VerificationDisplayStatus = "not-verified" | "pending" | "verified" | "rejected";
export type VerificationStatusValue =
  | VerificationDatabaseStatus
  | VerificationDisplayStatus
  | null
  | undefined;

type VerificationStatusConfig = {
  label: string;
  description: string;
  icon: ElementType;
  iconColor: string;
  iconBg: string;
  badge: StatusBadgeConfig;
};

/**
 * Converts database statuses into the display statuses used by settings UI.
 */
export function getVerificationDisplayStatus(
  status: VerificationStatusValue
): VerificationDisplayStatus {
  if (!status) return "not-verified";
  if (status === "approved") return "verified";
  if (status === "verified") return "verified";
  if (status === "pending") return "pending";
  if (status === "rejected") return "rejected";
  return "not-verified";
}

export const VERIFICATION_STATUS_CONFIG: Record<
  VerificationDisplayStatus,
  VerificationStatusConfig
> = {
  "not-verified": {
    label: "Not Verified",
    description: "You have not submitted your verification documents yet.",
    icon: ShieldCheck,
    iconColor: "#64748B",
    iconBg: "#F8FAFC",
    badge: {
      label: "Not Verified",
      color: "#64748B",
      bg: "#F8FAFC",
      border: "#E2E8F0",
    },
  },
  pending: {
    label: "Pending",
    description: "Your verification request has been submitted. It is currently under admin review.",
    icon: Clock,
    iconColor: "#D97706",
    iconBg: "#FFFBEB",
    badge: {
      label: "Pending",
      color: "#D97706",
      bg: "#FFFBEB",
      border: "#FDE68A",
    },
  },
  verified: {
    label: "Verified",
    description: "Your identity has been successfully verified.",
    icon: CheckCircle,
    iconColor: "#059669",
    iconBg: "#ECFDF5",
    badge: {
      label: "Verified",
      color: "#059669",
      bg: "#ECFDF5",
      border: "#6EE7B7",
    },
  },
  rejected: {
    label: "Rejected",
    description:
      "Your verification request was rejected. Please review the rejection reason and update your information.",
    icon: XCircle,
    iconColor: "#DC2626",
    iconBg: "#FEF2F2",
    badge: {
      label: "Rejected",
      color: "#DC2626",
      bg: "#FEF2F2",
      border: "#FECACA",
    },
  },
};

export function VerificationStatusCard({ status }: { status: VerificationStatusValue }) {
  const displayStatus = getVerificationDisplayStatus(status);
  const config = VERIFICATION_STATUS_CONFIG[displayStatus];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-4 bg-white border border-slate-200 rounded-2xl p-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: config.iconBg }}
      >
        <Icon className="w-5 h-5" style={{ color: config.iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-slate-900 font-semibold" style={{ fontSize: "0.875rem" }}>
            Verification Status
          </p>
          <StatusBadge
            config={config.badge}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border font-semibold"
          />
        </div>
        <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.75rem" }}>
          {config.description}
        </p>
      </div>
    </div>
  );
}

export function VerificationDocumentsSection({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 pt-2 border-t border-black/[0.05]">
      <div>
        <p className="text-slate-900 font-semibold" style={{ fontSize: "0.875rem" }}>
          Required Documents
        </p>
        <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.72rem" }}>
          Documents are visible only to Admin and are kept confidential.
        </p>
      </div>
      {children}
    </div>
  );
}

export function VerificationLoadingMessage() {
  return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3 border border-slate-200 bg-slate-50">
      <motion.span
        className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-blue-600"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      />
      <p className="text-slate-500" style={{ fontSize: "0.78rem" }}>
        Loading verification status...
      </p>
    </div>
  );
}

export function VerificationErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
      <XCircle className="w-4 h-4 text-red-500 shrink-0" />
      <p className="text-red-600" style={{ fontSize: "0.78rem" }}>
        {message}
      </p>
    </div>
  );
}

export function VerificationRejectionReason({ reason }: { reason: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl px-4 py-3 border border-red-200 bg-red-50">
      <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
      <div>
        <p className="text-red-600 font-semibold" style={{ fontSize: "0.78rem" }}>
          Rejection Reason
        </p>
        <p className="text-red-600 mt-0.5" style={{ fontSize: "0.78rem" }}>
          {reason}
        </p>
      </div>
    </div>
  );
}

export function VerificationHelpMessage({ status }: { status: VerificationDisplayStatus }) {
  const config = VERIFICATION_STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div
      className="flex items-start gap-3 rounded-xl px-4 py-3 border"
      style={{ background: config.badge.bg, borderColor: config.badge.border }}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: config.badge.color }} />
      <p style={{ color: config.badge.color, fontSize: "0.78rem" }}>{config.description}</p>
    </div>
  );
}
